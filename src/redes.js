// Redes sociales por cliente (picfy.es/redes): una página por cliente con su color y su letra,
// calendario y tareas propios (que también salen en la agenda general) y seguimiento de sus redes.
import { randomHex, isHex, html, json } from './util.js';
import { currentUser } from './auth.js';
import { redesPage, clientePage } from './appviews.js';
import { AGENDA_KINDS, agendaReady } from './agenda.js';

export const FONTS = {
  sans: { label: 'Moderna', css: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', w: 700 },
  serif: { label: 'Elegante', css: 'Georgia, "Times New Roman", serif', w: 700 },
  redonda: { label: 'Redondeada', css: '"Avenir Next Rounded", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif', w: 700 },
  deporte: { label: 'Deportiva', css: 'Impact, "Arial Narrow Bold", "Haettenschweiler", sans-serif', w: 400 },
  mono: { label: 'Máquina', css: '"SF Mono", Menlo, Consolas, monospace', w: 700 },
  mano: { label: 'A mano', css: '"Bradley Hand", "Segoe Script", "Comic Sans MS", cursive', w: 700 },
};

export const NETWORKS = {
  instagram: { label: 'Instagram', color: '#c9376e' },
  tiktok: { label: 'TikTok', color: '#14213d' },
  facebook: { label: 'Facebook', color: '#2f6fed' },
  youtube: { label: 'YouTube', color: '#d6483b' },
  x: { label: 'X', color: '#4b5563' },
  linkedin: { label: 'LinkedIn', color: '#1f6fb3' },
};

let st = { v: null, t: 0 };
export async function redesReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try {
    await db.prepare('SELECT id, name, color, font, networks FROM social_clients LIMIT 1').first();
    await db.prepare('SELECT client_id, followers FROM social_metrics LIMIT 1').first();
    await db.prepare('SELECT client_id FROM agenda_items LIMIT 1').first();
    st = { v: true, t: Date.now() };
  } catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const reDate = /^\d{4}-\d{2}-\d{2}$/;
const num = (v) => { if (v === '' || v == null) return null; const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n < 1e10 ? n : null; };

function cleanNetworks(raw) {
  const out = {};
  for (const k of Object.keys(NETWORKS)) {
    const o = raw && raw[k];
    if (!o) continue;
    const handle = clip(o.handle, 80);
    let url = clip(o.url, 300);
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (handle || url) out[k] = { handle, url };
  }
  return out;
}

function cleanClient(b, cur = {}) {
  const name = clip(b.name != null ? b.name : cur.name, 80);
  if (!name) return { error: 'name' };
  const color = /^#[0-9a-fA-F]{6}$/.test(String(b.color || '')) ? String(b.color).toLowerCase() : (cur.color || '#e5964c');
  const font = b.font in FONTS ? b.font : (cur.font in FONTS ? cur.font : 'sans');
  let networks = cur.networks ? safeJson(cur.networks) : {};
  if (b.networks) networks = cleanNetworks(b.networks);
  return { v: { name, color, font, networks: JSON.stringify(networks), notes: clip(b.notes != null ? b.notes : cur.notes, 2000) || null } };
}
const safeJson = (s) => { try { return JSON.parse(s) || {}; } catch { return {}; } };
const pub = (r) => ({ id: r.id, name: r.name, color: r.color, font: r.font, networks: safeJson(r.networks), notes: r.notes || '', position: r.position });

export function agendaClients(rows) { return rows.map((r) => ({ id: r.id, name: r.name, color: r.color, font: r.font })); }

export function redesRoutes(app) {
  const go = (to) => new Response(null, { status: 303, headers: { location: to } });

  async function auth(c) {
    const user = await currentUser(c);
    if (!user) return { err: json({ error: 'auth' }, 401) };
    if (!(await redesReady(c.env.DB))) return { err: json({ error: 'setup' }, 503) };
    return { user };
  }
  async function mine(c, user, id) {
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT * FROM social_clients WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
  }

  app.get('/redes', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const ready = await redesReady(c.env.DB);
    let clients = [];
    if (ready) {
      const today = new Date().toISOString().slice(0, 10);
      const rows = (await c.env.DB.prepare('SELECT * FROM social_clients WHERE owner_id = ? ORDER BY position, created_at').bind(user.id).all()).results;
      const items = (await c.env.DB.prepare('SELECT client_id, kind, title, date, done FROM agenda_items WHERE owner_id = ? AND client_id IS NOT NULL ORDER BY date').bind(user.id).all()).results;
      clients = rows.map((r) => {
        const mine = items.filter((i) => i.client_id === r.id);
        const next = mine.filter((i) => !i.done && i.date && i.date >= today)[0] || null;
        return { ...pub(r), pending: mine.filter((i) => !i.done).length, next };
      });
    }
    return html(redesPage({ user, ready, clients, fonts: FONTS, networks: NETWORKS }));
  });

  app.get('/redes/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    if (!(await redesReady(c.env.DB))) return go('/redes');
    const row = await mine(c, user, c.req.param('id'));
    if (!row) return go('/redes');
    const all = (await c.env.DB.prepare('SELECT * FROM social_clients WHERE owner_id = ? ORDER BY position, created_at').bind(user.id).all()).results;
    const metrics = (await c.env.DB.prepare('SELECT id, network, date, followers, posts, reach, interactions, note FROM social_metrics WHERE client_id = ? ORDER BY date, created_at LIMIT 2000').bind(row.id).all()).results;
    return html(clientePage({ user, client: pub(row), clients: agendaClients(all), metrics, fonts: FONTS, networks: NETWORKS, kinds: AGENDA_KINDS, agendaOk: await agendaReady(c.env.DB), tab: c.req.query('t') || 'calendario' }));
  });

  app.get('/api/redes', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const rows = (await c.env.DB.prepare('SELECT * FROM social_clients WHERE owner_id = ? ORDER BY position, created_at').bind(a.user.id).all()).results;
    return json({ clients: rows.map(pub) });
  });

  app.post('/api/redes', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const r = cleanClient(await c.req.json().catch(() => ({})));
    if (r.error) return json({ error: r.error }, 400);
    const n = (await c.env.DB.prepare('SELECT COUNT(*) AS n FROM social_clients WHERE owner_id = ?').bind(a.user.id).first()).n;
    if (n >= 100) return json({ error: 'limit' }, 400);
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO social_clients (id, owner_id, name, color, font, networks, notes, position, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(id, a.user.id, r.v.name, r.v.color, r.v.font, r.v.networks, r.v.notes, n, Date.now()).run();
    return json({ id });
  });

  app.put('/api/redes/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cur = await mine(c, a.user, c.req.param('id'));
    if (!cur) return json({ error: 'nf' }, 404);
    const r = cleanClient(await c.req.json().catch(() => ({})), cur);
    if (r.error) return json({ error: r.error }, 400);
    await c.env.DB.prepare('UPDATE social_clients SET name=?2, color=?3, font=?4, networks=?5, notes=?6 WHERE id=?1').bind(cur.id, r.v.name, r.v.color, r.v.font, r.v.networks, r.v.notes).run();
    return json({ ok: true });
  });

  app.delete('/api/redes/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cur = await mine(c, a.user, c.req.param('id'));
    if (!cur) return json({ error: 'nf' }, 404);
    // Sus tareas y publicaciones se quedan en la agenda general, sin cliente.
    await c.env.DB.batch([
      c.env.DB.prepare('UPDATE agenda_items SET client_id = NULL, category = COALESCE(category, ?2) WHERE client_id = ?1 AND owner_id = ?3').bind(cur.id, cur.name, a.user.id),
      c.env.DB.prepare('DELETE FROM social_metrics WHERE client_id = ?').bind(cur.id),
      c.env.DB.prepare('DELETE FROM social_clients WHERE id = ?').bind(cur.id),
    ]);
    return json({ ok: true });
  });

  app.post('/api/redes/:id/metrics', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cur = await mine(c, a.user, c.req.param('id'));
    if (!cur) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    const network = b.network in NETWORKS ? b.network : null;
    const date = reDate.test(String(b.date || '')) ? String(b.date) : null;
    if (!network || !date) return json({ error: 'data' }, 400);
    const v = { followers: num(b.followers), posts: num(b.posts), reach: num(b.reach), interactions: num(b.interactions) };
    if (v.followers == null && v.posts == null && v.reach == null && v.interactions == null) return json({ error: 'empty' }, 400);
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO social_metrics (id, client_id, network, date, followers, posts, reach, interactions, note, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .bind(id, cur.id, network, date, v.followers, v.posts, v.reach, v.interactions, clip(b.note, 300) || null, Date.now()).run();
    return json({ metric: { id, network, date, ...v, note: clip(b.note, 300) } });
  });

  app.delete('/api/redes/:id/metrics/:mid', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cur = await mine(c, a.user, c.req.param('id'));
    if (!cur || !isHex(c.req.param('mid'), 16)) return json({ error: 'nf' }, 404);
    await c.env.DB.prepare('DELETE FROM social_metrics WHERE id = ? AND client_id = ?').bind(c.req.param('mid'), cur.id).run();
    return json({ ok: true });
  });
}
