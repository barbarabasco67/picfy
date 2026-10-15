// Selección de favoritas del cliente: marcar fotos y enviarlas al fotógrafo (queda guardado y se avisa por email).
import { randomHex, sha256Hex, isHex, json } from './util.js';
import { getEventByGuestToken } from './photos.js';
import { sendMail } from './mail.js';

let st = { v: null, t: 0 };
export async function selReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT 1 FROM selections LIMIT 1').first(); await db.prepare('SELECT selection FROM events LIMIT 1').first(); await db.prepare('SELECT 1 FROM selection_sends LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}
let sst = { v: null, t: 0 };
export async function selSeenReady(db) {
  if (sst.v === true || (sst.v === false && Date.now() - sst.t < 30000)) return sst.v;
  try { await db.prepare('SELECT sel_seen_at FROM events LIMIT 1').first(); sst = { v: (await selReady(db)), t: Date.now() }; }
  catch { sst = { v: false, t: Date.now() }; }
  return sst.v;
}
// Subconsulta: selecciones recibidas que el organizador aún no ha visto (alias `e` = galería principal).
export const NEW_SEL_SQL = `(SELECT COUNT(*) FROM selection_sends q JOIN events qe ON qe.id = q.event_id WHERE (qe.id = e.id OR qe.parent_id = e.id) AND q.created_at > qe.sel_seen_at)`;

const FAM = '(SELECT id FROM events WHERE id = ?1 OR parent_id = ?1)';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function selectionRoutes(app, { accessOk }) {
  async function ctx(c) {
    const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
    if (!event || !event.gallery_open || !(await accessOk(c, event))) return { err: json({ error: 'access' }, 403) };
    if (!(await selReady(c.env.DB)) || !event.selection) return { err: json({ off: true }, 200) };
    let b = {}; try { b = await c.req.json(); } catch { return { err: json({ error: 'json' }, 400) }; }
    if (!isHex(b.key, 32)) return { err: json({ error: 'key' }, 400) };
    return { event, b, voter: await sha256Hex(b.key) };
  }

  app.post('/api/e/:token/sel/list', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    const rows = (await c.env.DB.prepare('SELECT photo_id FROM selections WHERE event_id = ? AND voter = ?').bind(x.event.id, x.voter).all()).results;
    return json({ ids: rows.map((r) => r.photo_id) });
  });

  app.post('/api/e/:token/sel/toggle', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    if (!isHex(x.b.photo, 32)) return json({ error: 'photo' }, 400);
    const db = c.env.DB;
    const ph = await db.prepare(`SELECT id FROM photos WHERE id = ?2 AND state = 'approved' AND event_id IN ${FAM}`).bind(x.event.id, x.b.photo).first();
    if (!ph) return json({ error: 'photo' }, 404);
    const had = await db.prepare('SELECT 1 FROM selections WHERE event_id = ? AND voter = ? AND photo_id = ?').bind(x.event.id, x.voter, ph.id).first();
    if (had) await db.prepare('DELETE FROM selections WHERE event_id = ? AND voter = ? AND photo_id = ?').bind(x.event.id, x.voter, ph.id).run();
    else {
      const n = await db.prepare('SELECT COUNT(*) n FROM selections WHERE event_id = ? AND voter = ?').bind(x.event.id, x.voter).first();
      if (n.n >= 2000) return json({ error: 'limit' }, 400);
      await db.prepare('INSERT OR IGNORE INTO selections (event_id, voter, photo_id, created_at) VALUES (?, ?, ?, ?)').bind(x.event.id, x.voter, ph.id, Date.now()).run();
    }
    const n = await db.prepare('SELECT COUNT(*) n FROM selections WHERE event_id = ? AND voter = ?').bind(x.event.id, x.voter).first();
    return json({ on: !had, n: n.n });
  });

  app.post('/api/e/:token/sel/clear', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    await c.env.DB.prepare('DELETE FROM selections WHERE event_id = ? AND voter = ?').bind(x.event.id, x.voter).run();
    return json({ ok: true, n: 0 });
  });

  // Elegir o quitar varias a la vez (la página actual).
  app.post('/api/e/:token/sel/bulk', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    const db = c.env.DB;
    const ids = [...new Set((Array.isArray(x.b.photos) ? x.b.photos : []).filter((i) => isHex(i, 32)))].slice(0, 200);
    if (!ids.length) return json({ ok: true });
    const inl = ids.map((i) => `'${i}'`).join(',');
    if (x.b.on) {
      const ok = (await db.prepare(`SELECT id FROM photos WHERE state = 'approved' AND event_id IN ${FAM} AND id IN (${inl})`).bind(x.event.id).all()).results;
      const now = Date.now();
      await db.batch(ok.map((r) => db.prepare('INSERT OR IGNORE INTO selections (event_id, voter, photo_id, created_at) VALUES (?, ?, ?, ?)').bind(x.event.id, x.voter, r.id, now)));
    } else {
      await db.prepare(`DELETE FROM selections WHERE event_id = ? AND voter = ? AND photo_id IN (${inl})`).bind(x.event.id, x.voter).run();
    }
    return json({ ok: true });
  });

  app.post('/api/e/:token/sel/send', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    const db = c.env.DB;
    const rows = (await db.prepare('SELECT photo_id FROM selections WHERE event_id = ? AND voter = ? ORDER BY created_at').bind(x.event.id, x.voter).all()).results;
    if (!rows.length) return json({ error: 'empty' }, 400);
    const recent = await db.prepare('SELECT COUNT(*) n FROM selection_sends WHERE voter = ? AND created_at > ?').bind(x.voter, Date.now() - 3600000).first();
    if (recent.n >= 5) return json({ error: 'rate' }, 429);
    const name = String(x.b.name || '').trim().slice(0, 60), note = String(x.b.note || '').trim().slice(0, 1000);
    const email = String(x.b.email || '').trim().slice(0, 120);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'email' }, 400);
    const ids = rows.map((r) => r.photo_id);
    const id = randomHex(8);
    await db.prepare('INSERT INTO selection_sends (id, event_id, voter, name, email, note, ids, n, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, x.event.id, x.voter, name, email, note, JSON.stringify(ids), ids.length, Date.now()).run();
    // aviso por email al dueño de la galería
    let mailed = false;
    try {
      const owner = x.event.owner_id ? await db.prepare('SELECT email, name FROM users WHERE id = ?').bind(x.event.owner_id).first() : null;
      if (owner && owner.email && c.env.RESEND_API_KEY) {
        const origin = new URL(c.req.url).origin;
        const link = `${origin}/galerias/${x.event.id}`;
        const who = name || 'Un invitado';
        const html = `<div style="font-family:system-ui,sans-serif;max-width:520px"><h2 style="margin:0 0 8px">${esc(who)} te ha enviado su selección</h2><p style="margin:0 0 12px">Galería: <b>${esc(x.event.name)}</b> · <b>${ids.length}</b> ${ids.length === 1 ? 'foto elegida' : 'fotos elegidas'}</p>${note ? `<p style="background:#faf3e6;padding:10px 14px;border-radius:10px;white-space:pre-wrap">${esc(note)}</p>` : ''}${email ? `<p>Contacto: ${esc(email)}</p>` : ''}<p><a href="${link}" style="display:inline-block;background:#edb265;color:#2a1d08;padding:10px 18px;border-radius:99px;text-decoration:none;font-weight:700">Ver la selección</a></p></div>`;
        const text = `${who} te ha enviado su selección de "${x.event.name}": ${ids.length} fotos.\n${note ? note + '\n' : ''}${email ? 'Contacto: ' + email + '\n' : ''}${link}`;
        mailed = await sendMail(c.env, { to: owner.email, subject: `${who} ha enviado su selección (${ids.length} fotos) · ${x.event.name}`, html, text, replyTo: email || undefined });
      }
    } catch { /* el aviso es opcional */ }
    return json({ ok: true, n: ids.length, mailed });
  });
}

// Selecciones recibidas, para el panel del organizador.
export async function loadSelections(db, event) {
  if (!(await selReady(db))) return { ready: false, sends: [] };
  const seen = await selSeenReady(db);
  const rows = (await db.prepare(`SELECT s.id, s.name, s.email, s.note, s.ids, s.n, s.created_at, e.name AS ename, ${seen ? '(s.created_at > e.sel_seen_at)' : '0'} AS isnew FROM selection_sends s JOIN events e ON e.id = s.event_id WHERE s.event_id IN ${FAM} ORDER BY s.created_at DESC LIMIT 50`).bind(event.id).all()).results;
  return { ready: true, sends: rows.map((r) => ({ ...r, ids: JSON.parse(r.ids || '[]') })), newCount: rows.filter((r) => r.isnew).length };
}
