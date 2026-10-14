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
