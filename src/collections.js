// Colecciones: agrupan varias galerías (por ejemplo, las de un mismo cliente) bajo un único enlace.
import { randomHex, isHex, html, json } from './util.js';
import { currentUser } from './auth.js';
import { privacyReady, isExpired, attachSlugs } from './photos.js';
import { collectionsPage, collectionPage } from './appviews.js';
import { collectionPublicPage, notFoundPage } from './views.js';

let st = { v: null, t: 0 };
export async function colReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT 1 FROM collections LIMIT 1').first(); await db.prepare('SELECT 1 FROM collection_items LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}
let cst = { v: null, t: 0 };
export async function colCoverReady(db) {
  if (cst.v === true || (cst.v === false && Date.now() - cst.t < 30000)) return cst.v;
  try { await db.prepare('SELECT cover_v FROM collections LIMIT 1').first(); cst = { v: true, t: Date.now() }; } catch { cst = { v: false, t: Date.now() }; }
  return cst.v;
}
const go = (to) => new Response(null, { status: 303, headers: { location: to } });
const COVER = `(SELECT p.id FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'approved' ORDER BY COALESCE(p.taken_at, p.uploaded_at) ASC LIMIT 1)`;
const COUNT = `(SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'approved')`;

export function collectionRoutes(app) {
  async function mine(c, user) {
    const id = c.req.param('id');
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT * FROM collections WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
  }

  app.get('/colecciones', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    const db = c.env.DB, ready = await colReady(db);
    let rows = [];
    if (ready) rows = (await db.prepare(
      `SELECT c.id, c.name, c.lead, ${(await colCoverReady(db)) ? 'c.cover_v, c.token,' : '0 AS cover_v, c.token,'} (SELECT COUNT(*) FROM collection_items i JOIN events e ON e.id = i.event_id WHERE i.collection_id = c.id AND e.deleted_at IS NULL) AS n,
        (SELECT ${COVER} FROM collection_items i JOIN events e ON e.id = i.event_id WHERE i.collection_id = c.id AND e.deleted_at IS NULL ORDER BY i.sort_order LIMIT 1) AS cover
       FROM collections c WHERE c.owner_id = ? ORDER BY c.created_at DESC`,
    ).bind(user.id).all()).results;
    return html(collectionsPage({ user, collections: rows, ready, ok: c.req.query('ok') || '' }));
  });

  app.post('/colecciones', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    if (!(await colReady(c.env.DB))) return go('/colecciones');
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 120);
    if (!name) return go('/colecciones');
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO collections (id, owner_id, name, lead, token, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, user.id, name, String(f.get('lead') || '').trim().slice(0, 400), randomHex(16), Date.now()).run();
    return go(`/colecciones/${id}?ok=${encodeURIComponent('Colección creada. Añade las galerías que quieras.')}`);
  });

  app.get('/colecciones/:id', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    if (!(await colReady(c.env.DB))) return go('/colecciones');
    const col = await mine(c, user); if (!col) return html(notFoundPage('No encontramos esa colección.'), 404);
    const db = c.env.DB;
    const items = (await db.prepare(
      `SELECT e.id, e.name, e.event_date, e.thumb_v, e.guest_token, ${COUNT} AS n, ${COVER} AS cover
       FROM collection_items i JOIN events e ON e.id = i.event_id WHERE i.collection_id = ? AND e.deleted_at IS NULL ORDER BY i.sort_order, e.created_at`,
    ).bind(col.id).all()).results;
    const inIds = new Set(items.map((x) => x.id));
    const all = (await db.prepare(
      `SELECT e.id, e.name, e.event_date, ${COUNT} AS n FROM events e WHERE e.owner_id = ? AND e.parent_id IS NULL AND e.deleted_at IS NULL ORDER BY e.created_at DESC`,
    ).bind(user.id).all()).results;
    return html(collectionPage({ user, col, items, available: all.filter((g) => !inIds.has(g.id)), origin: new URL(c.req.url).origin, ok: c.req.query('ok') || '' }));
  });

  // Portada de la colección (imagen ya redimensionada en el navegador)
  app.put('/api/col/:id/cover', async (c) => {
    const user = await currentUser(c); if (!user) return json({ error: 'auth' }, 403);
    const col = await mine(c, user); if (!col) return json({ error: 'notfound' }, 404);
    if (!(await colCoverReady(c.env.DB))) return json({ error: 'migration' }, 500);
    const buf = await c.req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > 3 * 1024 * 1024) return json({ error: 'size' }, 400);
    await c.env.PHOTOS.put(`col/${col.id}/cover`, buf, { httpMetadata: { contentType: 'image/jpeg' } });
    const v = Date.now();
    await c.env.DB.prepare('UPDATE collections SET cover_v = ? WHERE id = ?').bind(v, col.id).run();
    return json({ ok: true, v });
  });
  const FAM = `(SELECT e.id FROM events e WHERE e.id IN (SELECT event_id FROM collection_items WHERE collection_id = ?1) OR e.parent_id IN (SELECT event_id FROM collection_items WHERE collection_id = ?1))`;
  app.get('/api/col/:id/photos', async (c) => {
    const user = await currentUser(c); if (!user) return json({ error: 'auth' }, 403);
    const col = await mine(c, user); if (!col) return json({ error: 'notfound' }, 404);
    const rows = (await c.env.DB.prepare(`SELECT p.id FROM photos p WHERE p.state = 'approved' AND (p.mime IS NULL OR p.mime NOT LIKE 'video/%') AND p.event_id IN ${FAM} ORDER BY COALESCE(p.taken_at, p.uploaded_at) ASC LIMIT 300`).bind(col.id).all()).results;
    return json({ ids: rows.map((r) => r.id) });
  });
  app.post('/api/col/:id/cover-from', async (c) => {
    const user = await currentUser(c); if (!user) return json({ error: 'auth' }, 403);
    const col = await mine(c, user); if (!col) return json({ error: 'notfound' }, 404);
    if (!(await colCoverReady(c.env.DB))) return json({ error: 'migration' }, 500);
    const id = String((await c.req.json().catch(() => ({}))).id || '');
    if (!isHex(id, 32)) return json({ error: 'bad' }, 400);
    const ok = await c.env.DB.prepare(`SELECT p.id FROM photos p WHERE p.id = ?2 AND p.event_id IN ${FAM}`).bind(col.id, id).first();
    const obj = ok && await c.env.PHOTOS.get(`p/${id}/l`);
    if (!obj) return json({ error: 'photo' }, 404);
    await c.env.PHOTOS.put(`col/${col.id}/cover`, obj.body, { httpMetadata: { contentType: 'image/jpeg' } });
    const v = Date.now();
    await c.env.DB.prepare('UPDATE collections SET cover_v = ? WHERE id = ?').bind(v, col.id).run();
    return json({ ok: true, v });
  });
  app.delete('/api/col/:id/cover', async (c) => {
    const user = await currentUser(c); if (!user) return json({ error: 'auth' }, 403);
    const col = await mine(c, user); if (!col) return json({ error: 'notfound' }, 404);
    if (!(await colCoverReady(c.env.DB))) return json({ error: 'migration' }, 500);
    await c.env.PHOTOS.delete(`col/${col.id}/cover`);
    await c.env.DB.prepare('UPDATE collections SET cover_v = NULL WHERE id = ?').bind(col.id).run();
    return json({ ok: true });
  });

  app.post('/colecciones/:id/ajustes', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    const col = await mine(c, user); if (!col) return go('/colecciones');
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 120) || col.name;
    await c.env.DB.prepare('UPDATE collections SET name = ?, lead = ? WHERE id = ?').bind(name, String(f.get('lead') || '').trim().slice(0, 400), col.id).run();
    return go(`/colecciones/${col.id}?ok=${encodeURIComponent('Cambios guardados.')}`);
  });

  app.post('/colecciones/:id/galerias', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    const col = await mine(c, user); if (!col) return go('/colecciones');
    const f = await c.req.formData();
    const ids = [...new Set(f.getAll('gal').map(String).filter((i) => isHex(i, 16)))].slice(0, 100);
    const db = c.env.DB;
    const own = ids.length ? (await db.prepare(`SELECT id FROM events WHERE owner_id = ? AND parent_id IS NULL AND deleted_at IS NULL AND id IN (${ids.map((i) => `'${i}'`).join(',')})`).bind(user.id).all()).results : [];
    const max = (await db.prepare('SELECT COALESCE(MAX(sort_order), 0) m FROM collection_items WHERE collection_id = ?').bind(col.id).first()).m;
    if (own.length) await db.batch(own.map((g, k) => db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, event_id, sort_order) VALUES (?, ?, ?)').bind(col.id, g.id, max + k + 1)));
    return go(`/colecciones/${col.id}${own.length ? `?ok=${encodeURIComponent(own.length === 1 ? 'Galería añadida.' : `${own.length} galerías añadidas.`)}` : ''}`);
  });

  app.post('/colecciones/:id/quitar', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    const col = await mine(c, user); if (!col) return go('/colecciones');
    const f = await c.req.formData();
    const gid = String(f.get('event_id') || '');
    if (isHex(gid, 16)) await c.env.DB.prepare('DELETE FROM collection_items WHERE collection_id = ? AND event_id = ?').bind(col.id, gid).run();
    return go(`/colecciones/${col.id}?ok=${encodeURIComponent('Galería quitada de la colección (la galería sigue existiendo).')}`);
  });

  // Subir o bajar una galería dentro de la colección.
  app.post('/colecciones/:id/mover', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    const col = await mine(c, user); if (!col) return go('/colecciones');
    const f = await c.req.formData();
    const gid = String(f.get('event_id') || ''), dir = f.get('dir') === 'up' ? -1 : 1;
    const db = c.env.DB;
    const rows = (await db.prepare('SELECT event_id FROM collection_items WHERE collection_id = ? ORDER BY sort_order, event_id').bind(col.id).all()).results.map((r) => r.event_id);
    const i = rows.indexOf(gid), j = i + dir;
    if (i >= 0 && j >= 0 && j < rows.length) {
      [rows[i], rows[j]] = [rows[j], rows[i]];
      await db.batch(rows.map((id, k) => db.prepare('UPDATE collection_items SET sort_order = ? WHERE collection_id = ? AND event_id = ?').bind(k + 1, col.id, id)));
    }
    return go(`/colecciones/${col.id}`);
  });

  app.post('/colecciones/:id/borrar', async (c) => {
    const user = await currentUser(c); if (!user) return go('/entrar');
    const col = await mine(c, user); if (!col) return go('/colecciones');
    await c.env.DB.prepare('DELETE FROM collection_items WHERE collection_id = ?').bind(col.id).run();
    await c.env.DB.prepare('DELETE FROM collections WHERE id = ?').bind(col.id).run();
    await c.env.PHOTOS.delete(`col/${col.id}/cover`).catch(() => {});
    return go(`/colecciones?ok=${encodeURIComponent('Colección eliminada. Las galerías no se han tocado.')}`);
  });
}

// Página pública de una colección.
export function publicCollectionRoute(app) {
  app.get('/col/:token/cover', async (c) => {
    const token = c.req.param('token');
    if (!isHex(token, 32)) return c.notFound();
    const col = await c.env.DB.prepare('SELECT id FROM collections WHERE token = ?').bind(token).first();
    const obj = col && await c.env.PHOTOS.get(`col/${col.id}/cover`);
    if (!obj) return c.notFound();
    return new Response(obj.body, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', etag: obj.httpEtag } });
  });

  app.get('/col/:token', async (c) => {
    const token = c.req.param('token');
    const db = c.env.DB;
    if (!isHex(token, 32) || !(await colReady(db))) return html(notFoundPage('Este enlace no existe o ya no está activo.'), 404);
    const col = await db.prepare('SELECT * FROM collections WHERE token = ?').bind(token).first();
    if (!col) return html(notFoundPage('Este enlace no existe o ya no está activo.'), 404);
    const priv = await privacyReady(db);
    const rows = (await db.prepare(
      `SELECT e.id, e.name, e.lead, e.event_date, e.thumb_v, e.guest_token, e.expires_at, e.gallery_open, ${COUNT} AS n, ${COVER} AS cover
       FROM collection_items i JOIN events e ON e.id = i.event_id
       WHERE i.collection_id = ? AND e.deleted_at IS NULL AND e.gallery_open = 1 ${priv ? 'AND e.is_private = 0' : ''} ORDER BY i.sort_order, e.created_at`,
    ).bind(col.id).all()).results.filter((e) => !isExpired(e));
    await attachSlugs(db, rows);
    return html(collectionPublicPage({ col, items: rows }));
  });
}
