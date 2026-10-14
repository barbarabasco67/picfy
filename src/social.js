// Me gusta y comentarios de las fotos (invitados identificados por la clave de su dispositivo).
import { randomHex, sha256Hex, isHex, json } from './util.js';
import { getEventByGuestToken, isExpired } from './photos.js';

let st = { v: null, t: 0 };
export async function socialReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT 1 FROM photo_likes LIMIT 1').first(); await db.prepare('SELECT social FROM events LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const FAM = '(SELECT id FROM events WHERE id = ?1 OR parent_id = ?1)';

export function socialRoutes(app, { accessOk, ownsEvent }) {
  // Carga común: galería accesible, interacción activada y foto publicada de esa galería.
  async function ctx(c, withPhoto = true) {
    const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
    if (!event || !event.gallery_open || !(await accessOk(c, event))) return { err: json({ error: 'access' }, 403) };
    if (!(await socialReady(c.env.DB)) || event.social === 0) return { err: json({ off: true }, 200) };
    let b = {};
    if (c.req.method === 'POST') { try { b = await c.req.json(); } catch { return { err: json({ error: 'json' }, 400) }; } }
    const key = b.key ?? c.req.query('key');
    if (!isHex(key, 32)) return { err: json({ error: 'key' }, 400) };
    const voter = await sha256Hex(key);
    let photo = null;
    if (withPhoto) {
      const id = c.req.param('id');
      if (!isHex(id, 32)) return { err: json({ error: 'photo' }, 404) };
      photo = await c.env.DB.prepare(`SELECT id FROM photos WHERE id = ?2 AND state = 'approved' AND event_id IN ${FAM}`).bind(event.id, id).first();
      if (!photo) return { err: json({ error: 'photo' }, 404) };
    }
    return { event, b, voter, photo };
  }

  // Resumen de la página: me gusta y comentarios por foto.
  app.post('/api/e/:token/social', async (c) => {
    const x = await ctx(c, false); if (x.err) return x.err;
    const ids = [...new Set((x.b.ids || []).filter((i) => isHex(i, 32)))].slice(0, 200);
    if (!ids.length) return json({ items: {} });
    const inl = ids.map((i) => `'${i}'`).join(',');
    const db = c.env.DB;
    const likes = (await db.prepare(`SELECT photo_id, COUNT(*) n, SUM(voter = ?1) mine FROM photo_likes WHERE photo_id IN (${inl}) GROUP BY photo_id`).bind(x.voter).all()).results;
    const coms = (await db.prepare(`SELECT photo_id, COUNT(*) n FROM photo_comments WHERE photo_id IN (${inl}) GROUP BY photo_id`).all()).results;
    const items = {};
    for (const r of likes) items[r.photo_id] = { l: r.n, m: r.mine ? 1 : 0, c: 0 };
    for (const r of coms) (items[r.photo_id] ||= { l: 0, m: 0, c: 0 }).c = r.n;
    if (await viewsReady(db)) {
      const vw = (await db.prepare(`SELECT photo_id, n FROM photo_views WHERE photo_id IN (${inl})`).all()).results;
      for (const r of vw) (items[r.photo_id] ||= { l: 0, m: 0, c: 0 }).w = r.n;
    }
    return json({ items, owner: await ownsEvent(c, x.event) });
  });

  // Detalle de una foto: comentarios.
  app.post('/api/e/:token/p/:id/comments', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    const rows = (await c.env.DB.prepare('SELECT id, voter, author, body, created_at FROM photo_comments WHERE photo_id = ? ORDER BY created_at LIMIT 200').bind(x.photo.id).all()).results;
    return json({ owner: await ownsEvent(c, x.event), comments: rows.map((r) => ({ id: r.id, author: r.author, body: r.body, at: r.created_at, mine: r.voter === x.voter })) });
  });

  app.post('/api/e/:token/p/:id/like', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    const db = c.env.DB;
    const had = await db.prepare('SELECT 1 FROM photo_likes WHERE photo_id = ? AND voter = ?').bind(x.photo.id, x.voter).first();
    if (had) await db.prepare('DELETE FROM photo_likes WHERE photo_id = ? AND voter = ?').bind(x.photo.id, x.voter).run();
    else await db.prepare('INSERT OR IGNORE INTO photo_likes (photo_id, voter, created_at) VALUES (?, ?, ?)').bind(x.photo.id, x.voter, Date.now()).run();
    const n = await db.prepare('SELECT COUNT(*) n FROM photo_likes WHERE photo_id = ?').bind(x.photo.id).first();
    return json({ liked: !had, likes: n.n });
  });

  app.post('/api/e/:token/p/:id/comment', async (c) => {
    const x = await ctx(c); if (x.err) return x.err;
    const body = String(x.b.body || '').trim().slice(0, 500);
    const author = String(x.b.name || '').trim().slice(0, 40);
    if (!body) return json({ error: 'empty' }, 400);
    const db = c.env.DB;
    const recent = await db.prepare('SELECT COUNT(*) n FROM photo_comments WHERE voter = ? AND created_at > ?').bind(x.voter, Date.now() - 3600000).first();
    if (recent.n >= 15) return json({ error: 'rate' }, 429);
    const id = randomHex(8), at = Date.now();
    await db.prepare('INSERT INTO photo_comments (id, photo_id, voter, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(id, x.photo.id, x.voter, author, body, at).run();
    return json({ comment: { id, author, body, at, mine: true } });
  });

  // Borra un comentario: su autor (misma clave) o el dueño de la galería.
  app.post('/api/e/:token/comment/:cid/delete', async (c) => {
    const x = await ctx(c, false); if (x.err) return x.err;
    const row = await c.env.DB.prepare(`SELECT c.id, c.voter FROM photo_comments c JOIN photos p ON p.id = c.photo_id WHERE c.id = ?2 AND p.event_id IN ${FAM}`).bind(x.event.id, c.req.param('cid')).first();
    if (!row) return json({ error: 'nf' }, 404);
    if (row.voter !== x.voter && !(await ownsEvent(c, x.event))) return json({ error: 'forbidden' }, 403);
    await c.env.DB.prepare('DELETE FROM photo_comments WHERE id = ?').bind(row.id).run();
    return json({ ok: true });
  });
}

/* ---------- Estadísticas de visualizaciones ---------- */

let vst = { v: null, t: 0 };
export async function viewsReady(db) {
  if (vst.v === true || (vst.v === false && Date.now() - vst.t < 30000)) return vst.v;
  try { await db.prepare('SELECT 1 FROM gallery_views LIMIT 1').first(); await db.prepare('SELECT 1 FROM photo_views LIMIT 1').first(); vst = { v: true, t: Date.now() }; }
  catch { vst = { v: false, t: Date.now() }; }
  return vst.v;
}
const dayStr = (ms) => new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

export function viewRoutes(app, { accessOk, ownsEvent }) {
  // Lo envía el navegador del invitado (los robots no ejecutan JS, así que no cuentan).
  app.post('/api/e/:token/view', async (c) => {
    const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
    if (!event || !(await accessOk(c, event))) return json({ ok: false }, 403);
    if (!(await viewsReady(c.env.DB)) || (await ownsEvent(c, event))) return json({ ok: true, skipped: true });
    let b; try { b = await c.req.json(); } catch { return json({ error: 'json' }, 400); }
    if (!isHex(b.key, 32)) return json({ error: 'key' }, 400);
    const voter = await sha256Hex(b.key), db = c.env.DB;
    if (b.photo) {
      if (!isHex(b.photo, 32)) return json({ error: 'photo' }, 400);
      const ph = await db.prepare(`SELECT id FROM photos WHERE id = ?2 AND state = 'approved' AND event_id IN ${FAM}`).bind(event.id, b.photo).first();
      if (ph) await db.prepare('INSERT INTO photo_views (photo_id, n) VALUES (?, 1) ON CONFLICT(photo_id) DO UPDATE SET n = n + 1').bind(ph.id).run();
    } else {
      await db.prepare('INSERT INTO gallery_views (event_id, day, voter, n) VALUES (?, ?, ?, 1) ON CONFLICT(event_id, day, voter) DO UPDATE SET n = n + 1').bind(event.id, dayStr(Date.now()), voter).run();
    }
    return json({ ok: true });
  });
}

// Datos para el panel del organizador (galería y subgalerías juntas).
export async function loadStats(db, event) {
  const fam = `(SELECT id FROM events WHERE id = ?1 OR parent_id = ?1)`;
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(dayStr(Date.now() - i * 86400000));
  const out = { ready: await viewsReady(db), views: 0, visitors: 0, today: 0, days: days.map((d) => ({ d, views: 0 })), top: [], likes: 0, comments: 0, photos: 0 };
  out.photos = (await db.prepare(`SELECT COUNT(*) n FROM photos WHERE state = 'approved' AND event_id IN ${fam}`).bind(event.id).first()).n;
  if (out.ready) {
    const t = await db.prepare(`SELECT COALESCE(SUM(n),0) v, COUNT(DISTINCT voter) u FROM gallery_views WHERE event_id IN ${fam}`).bind(event.id).first();
    out.views = t.v; out.visitors = t.u;
    const per = (await db.prepare(`SELECT day, SUM(n) v FROM gallery_views WHERE event_id IN ${fam} AND day >= ?2 GROUP BY day`).bind(event.id, days[0]).all()).results;
    const m = new Map(per.map((r) => [r.day, r.v]));
    out.days.forEach((x) => { x.views = m.get(x.d) || 0; });
    out.today = m.get(days[days.length - 1]) || 0;
    out.top = (await db.prepare(`SELECT v.photo_id id, v.n FROM photo_views v JOIN photos p ON p.id = v.photo_id WHERE p.event_id IN ${fam} AND p.state = 'approved' ORDER BY v.n DESC LIMIT 6`).bind(event.id).all()).results;
  }
  if (await socialReady(db)) {
    try {
      out.likes = (await db.prepare(`SELECT COUNT(*) n FROM photo_likes l JOIN photos p ON p.id = l.photo_id WHERE p.event_id IN ${fam}`).bind(event.id).first()).n;
      out.comments = (await db.prepare(`SELECT COUNT(*) n FROM photo_comments l JOIN photos p ON p.id = l.photo_id WHERE p.event_id IN ${fam}`).bind(event.id).first()).n;
    } catch { /* sin datos */ }
  }
  return out;
}
