// Cobro con Stripe: planes mensuales y pase por evento. Sin SDK: se habla con la API directamente.
// Variables secretas en Cloudflare: STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET.
import { json, html } from './util.js';
import { currentUser } from './auth.js';
import { trashReady } from './photos.js';
import { planesPage } from './appviews.js';
import { PLANES, PASE, THUMB_EST, limitsOf, usedBytes } from './plans.js';

const go = (to) => new Response(null, { status: 303, headers: { location: to } });

let rd = { v: null, t: 0 };
export async function billingReady(db) {
  if (rd.v === true || (rd.v === false && Date.now() - rd.t < 30000)) return rd.v;
  try { await db.prepare('SELECT plan, stripe_customer, stripe_sub, plan_until FROM users LIMIT 1').first(); await db.prepare('SELECT id, expires_at FROM pases LIMIT 1').first(); rd = { v: true, t: Date.now() }; }
  catch { rd = { v: false, t: Date.now() }; }
  return rd.v;
}

// Plan de una cuenta con sus límites. Sin la migración, todo queda sin límites.
export async function getPlan(db, userId) {
  if (!(await billingReady(db))) return { ...limitsOf('libre'), ready: false };
  const u = await db.prepare('SELECT plan, stripe_customer, stripe_sub, plan_until FROM users WHERE id = ?').bind(userId).first();
  const ps = (await db.prepare('SELECT expires_at FROM pases WHERE user_id = ? AND expires_at > ? ORDER BY expires_at DESC').bind(userId, Date.now()).all()).results;
  return { ...limitsOf(u ? u.plan : 'libre', ps.length), ready: true, customer: u && u.stripe_customer, sub: u && u.stripe_sub, until: u && u.plan_until, paseHasta: ps.length ? ps[0].expires_at : null };
}

export async function getUsage(db, userId) {
  const g = await db.prepare(`SELECT COUNT(*) AS n FROM events WHERE owner_id = ? AND parent_id IS NULL${(await trashReady(db)) ? ' AND deleted_at IS NULL' : ''}`).bind(userId).first();
  const t = await db.prepare('SELECT COALESCE(SUM(p.size), 0) AS bytes, COUNT(*) AS n FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ?').bind(userId).first();
  return { galerias: g.n, bytes: usedBytes(t), fotos: t.n, raw: t };
}

// Añade el límite del plan a los totales de espacio que pintan las pantallas.
export async function withLimit(db, userId, tot) {
  const p = await getPlan(db, userId);
  return { ...tot, limit: isFinite(p.bytes) ? p.bytes : null, plan: p.key === 'libre' ? null : p.nombre };
}

export async function canCreateGallery(db, userId) {
  const p = await getPlan(db, userId); if (!isFinite(p.galerias)) return true;
  return (await getUsage(db, userId)).galerias < p.galerias;
}
export async function canCreateTorneo(db, userId) { return (await getPlan(db, userId)).torneos; }
// ¿Cabe una foto más en el espacio del dueño de la galería?
export async function hasSpace(db, ownerId, size) {
  if (!ownerId) return true;
  const p = await getPlan(db, ownerId); if (!isFinite(p.bytes)) return true;
  return (await getUsage(db, ownerId)).bytes + size + THUMB_EST <= p.bytes;
}

/* ---------- Stripe ---------- */
const base = (env) => env.STRIPE_API || 'https://api.stripe.com';
const flat = (o, p = '', out = new URLSearchParams()) => {
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const key = p ? `${p}[${k}]` : k;
    if (typeof v === 'object') flat(v, key, out); else out.append(key, String(v));
  }
  return out;
};
async function stripe(env, method, path, params, idem) {
  const r = await fetch(base(env) + path, {
    method, headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(method === 'POST' ? { 'content-type': 'application/x-www-form-urlencoded' } : {}), ...(idem ? { 'idempotency-key': idem } : {}) },
    body: method === 'POST' ? flat(params || {}).toString() : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || 'stripe ' + r.status);
  return j;
}
// Un producto de Stripe por plan; se crea la primera vez que se usa.
async function productFor(env, key) {
  const nombre = key === 'pase' ? PASE.nombre : PLANES[key].nombre;
  const found = await stripe(env, 'GET', `/v1/products/search?query=${encodeURIComponent(`metadata['picfy']:'${key}' AND active:'true'`)}`).catch(() => ({ data: [] }));
  if (found.data && found.data[0]) return found.data[0].id;
  return (await stripe(env, 'POST', '/v1/products', { name: `Picfy ${nombre}`, metadata: { picfy: key } }, `picfy-product-${key}`)).id;
}
const priceData = (product, key) => ({ currency: 'eur', product, unit_amount: Math.round((key === 'pase' ? PASE.precio : PLANES[key].precio) * 100), ...(key === 'pase' ? {} : { recurring: { interval: 'month' } }) });

// Firma del webhook: HMAC-SHA256 de "marca.cuerpo" con el secreto de Stripe.
async function validSignature(raw, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((s) => s.split('=')).filter((a) => a.length === 2));
  const t = Number(parts.t); if (!t || Math.abs(Date.now() / 1000 - t) > 600) return false;
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${t}.${raw}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  return header.split(',').filter((s) => s.startsWith('v1=')).some((s) => { const v = s.slice(3); return v.length === hex.length && [...v].reduce((a, ch, i) => a | (ch.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0; });
}

const ACTIVE = new Set(['active', 'trialing', 'past_due']);
async function onSubscription(db, sub) {
  const plan = sub.metadata && sub.metadata.plan; const uid = sub.metadata && sub.metadata.user;
  const where = uid ? ['id = ?', uid] : ['stripe_sub = ?', sub.id];
  const u = await db.prepare(`SELECT id, plan FROM users WHERE ${where[0]}`).bind(where[1]).first();
  if (!u || u.plan === 'libre') return;
  if (ACTIVE.has(sub.status) && PLANES[plan]) await db.prepare('UPDATE users SET plan = ?, stripe_customer = ?, stripe_sub = ?, plan_until = ? WHERE id = ?').bind(plan, sub.customer, sub.id, (sub.current_period_end || 0) * 1000, u.id).run();
  else await db.prepare("UPDATE users SET plan = 'gratis', stripe_sub = NULL, plan_until = NULL WHERE id = ?").bind(u.id).run();
}

export function billingRoutes(app) {
  app.get('/planes', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const db = c.env.DB; const plan = await getPlan(db, user.id); const usage = await getUsage(db, user.id);
    const q = c.req.query();
    return html(planesPage({ user, plan, usage, stripeOn: Boolean(c.env.STRIPE_SECRET_KEY), aviso: q.limite || '', ok: q.ok || '' }));
  });

  app.post('/api/billing/checkout', async (c) => {
    const user = await currentUser(c); if (!user) return json({ error: 'auth' }, 401);
    if (!c.env.STRIPE_SECRET_KEY || !(await billingReady(c.env.DB))) return json({ error: 'off' }, 503);
    let b; try { b = await c.req.json(); } catch { b = {}; }
    const key = String(b.plan || ''); if (key !== 'pase' && !(PLANES[key] && PLANES[key].precio > 0)) return json({ error: 'plan' }, 400);
    const origin = new URL(c.req.url).origin; const db = c.env.DB;
    const u = await db.prepare('SELECT plan, stripe_customer, stripe_sub FROM users WHERE id = ?').bind(user.id).first();
    if (u.plan === 'libre') return json({ error: 'libre' }, 400);
    try {
      const product = await productFor(c.env, key);
      // Quien ya tiene una suscripción cambia de plan sin pagar dos veces.
      if (key !== 'pase' && u.stripe_sub) {
        const sub = await stripe(c.env, 'GET', `/v1/subscriptions/${u.stripe_sub}`);
        if (sub && ACTIVE.has(sub.status) && sub.items && sub.items.data[0]) {
          await stripe(c.env, 'POST', `/v1/subscriptions/${u.stripe_sub}`, { items: { 0: { id: sub.items.data[0].id, price_data: priceData(product, key) } }, metadata: { plan: key, user: user.id }, proration_behavior: 'create_prorations' });
          await db.prepare('UPDATE users SET plan = ? WHERE id = ?').bind(key, user.id).run();
          return json({ url: '/planes?ok=cambio' });
        }
      }
      const params = {
        mode: key === 'pase' ? 'payment' : 'subscription', locale: 'es', client_reference_id: user.id, allow_promotion_codes: 'true',
        success_url: `${origin}/planes?ok=${key === 'pase' ? 'pase' : 'plan'}`, cancel_url: `${origin}/planes`,
        line_items: { 0: { quantity: 1, price_data: priceData(product, key) } },
        metadata: { user: user.id, plan: key },
        ...(u.stripe_customer ? { customer: u.stripe_customer } : { customer_email: user.email }),
        ...(key === 'pase' ? {} : { subscription_data: { metadata: { user: user.id, plan: key } } }),
      };
      const s = await stripe(c.env, 'POST', '/v1/checkout/sessions', params);
      return json({ url: s.url });
    } catch (e) { return json({ error: 'stripe', message: String(e.message || e).slice(0, 200) }, 502); }
  });

  app.post('/api/billing/portal', async (c) => {
    const user = await currentUser(c); if (!user) return json({ error: 'auth' }, 401);
    if (!c.env.STRIPE_SECRET_KEY || !(await billingReady(c.env.DB))) return json({ error: 'off' }, 503);
    const u = await c.env.DB.prepare('SELECT stripe_customer FROM users WHERE id = ?').bind(user.id).first();
    if (!u || !u.stripe_customer) return json({ error: 'nocustomer' }, 400);
    try { const s = await stripe(c.env, 'POST', '/v1/billing_portal/sessions', { customer: u.stripe_customer, return_url: new URL(c.req.url).origin + '/planes' }); return json({ url: s.url }); }
    catch (e) { return json({ error: 'stripe', message: String(e.message || e).slice(0, 200) }, 502); }
  });

  app.post('/webhook/stripe', async (c) => {
    const raw = await c.req.text();
    if (!(await validSignature(raw, c.req.header('stripe-signature'), c.env.STRIPE_WEBHOOK_SECRET))) return json({ error: 'firma' }, 400);
    let ev; try { ev = JSON.parse(raw); } catch { return json({ error: 'json' }, 400); }
    const db = c.env.DB; if (!(await billingReady(db))) return json({ error: 'migracion' }, 503);
    const o = ev.data && ev.data.object; if (!o) return json({ ok: true });
    if (ev.type === 'checkout.session.completed') {
      const uid = o.client_reference_id || (o.metadata && o.metadata.user); const plan = o.metadata && o.metadata.plan;
      if (uid && o.customer) await db.prepare('UPDATE users SET stripe_customer = COALESCE(stripe_customer, ?) WHERE id = ?').bind(o.customer, uid).run();
      if (uid && o.mode === 'payment' && plan === 'pase' && o.payment_status === 'paid') {
        const exp = new Date(); exp.setMonth(exp.getMonth() + PASE.meses);
        await db.prepare('INSERT OR IGNORE INTO pases (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(o.id, uid, Date.now(), exp.getTime()).run();
      }
      if (uid && o.mode === 'subscription' && PLANES[plan]) {
        const cur = await db.prepare('SELECT plan FROM users WHERE id = ?').bind(uid).first();
        if (cur && cur.plan !== 'libre') await db.prepare('UPDATE users SET plan = ?, stripe_sub = ? WHERE id = ?').bind(plan, o.subscription, uid).run();
      }
    } else if (ev.type === 'customer.subscription.created' || ev.type === 'customer.subscription.updated') await onSubscription(db, o);
    else if (ev.type === 'customer.subscription.deleted') await onSubscription(db, { ...o, status: 'canceled' });
    return json({ ok: true });
  });
}
