// Gestión de una galería por su dueño: moderar, ordenar, marcar, mover, ajustes y descargas.

import { isHex, json, html } from './util.js';
import { currentUser } from './auth.js';
import { applyOrder, deletePhotos, orderSql, setSortMode, SORTS } from './photos.js';
import { buildZip, splitParts } from './zip.js';
import { notFoundPage } from './views.js';

const FLAGS = new Set(['red', 'orange', 'green', 'black']);
const validIds = (ids) => [...new Set((Array.isArray(ids) ? ids : []).filter((i) => isHex(i, 32)))].slice(0, 3000);
const inList = (ids) => ids.map((i) => `'${i}'`).join(',');

async function ownerEvent(c) {
  const user = await currentUser(c);
  if (!user) return { user: null, event: null };
  const id = c.req.param('id');
  if (!/^[0-9a-f]{16}$/.test(id)) return { user, event: null };
  const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
  return { user, event };
}

const BRAND_MAX = 3 * 1024 * 1024;
const BRAND_KINDS = { cover: 'cover_v', avatar: 'avatar_v', thumb: 'thumb_v' };
export const validAccent = (v) => (/^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v).toLowerCase() : null);

export function galleryRoutes(app) {

  // Imagen de cabecera / perfil de una galería (pública: se ve en la página de invitados)
  app.get('/c/:token/:kind', async (c) => {
    const { token, kind } = c.req.param();
    if (!BRAND_KINDS[kind] || !isHex(token, 32)) return c.notFound();
    const ev = await c.env.DB.prepare('SELECT id FROM events WHERE guest_token = ?').bind(token).first();
    if (!ev) return c.notFound();
    const obj = await c.env.PHOTOS.get(`c/${ev.id}/${kind}`);
    if (!obj) return c.notFound();
    return new Response(obj.body, { headers: {
      'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable', etag: obj.httpEtag,
    } });
  });

  app.put('/api/g/:id/brand/:kind', async (c) => {
    const { event } = await ownerEvent(c);
    const col = BRAND_KINDS[c.req.param('kind')];
    if (!event || !col) return json({ error: 'auth' }, 403);
    const type = (c.req.header('content-type') || '').split(';')[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return json({ error: 'type' }, 415);
    const len = Number(c.req.header('content-length') || 0);
    if (!(len > 0 && len <= BRAND_MAX)) return json({ error: 'size' }, 413);
    await c.env.PHOTOS.put(`c/${event.id}/${c.req.param('kind')}`, c.req.raw.body, { httpMetadata: { contentType: type } });
    const v = Date.now();
    await c.env.DB.prepare(`UPDATE events SET ${col} = ? WHERE id = ?`).bind(v, event.id).run();
    return json({ ok: true, v });
  });

  app.delete('/api/g/:id/brand/:kind', async (c) => {
    const { event } = await ownerEvent(c);
    const col = BRAND_KINDS[c.req.param('kind')];
    if (!event || !col) return json({ error: 'auth' }, 403);
    await c.env.PHOTOS.delete(`c/${event.id}/${c.req.param('kind')}`);
    await c.env.DB.prepare(`UPDATE events SET ${col} = 0 WHERE id = ?`).bind(event.id).run();
    return json({ ok: true });
  });

  async function api(c) {
    const { event } = await ownerEvent(c);
    if (!event) return null;
    const body = await c.req.json().catch(() => ({}));
    return { event, body };
  }

  app.post('/api/g/:id/state', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    const approve = x.body.action === 'approve';
    if (!approve && x.body.action !== 'reject') return json({ error: 'action' }, 400);
    const from = approve ? `('pending','rejected')` : `('pending','approved')`;
    let where = `event_id = ?1 AND state IN ${from}`;
    if (approve && x.body.all === true) where = `event_id = ?1 AND state = 'pending'`;
    else {
      const ids = validIds(x.body.ids);
      if (!ids.length) return json({ ok: true, changed: 0 });
      where += ` AND id IN (${inList(ids)})`;
    }
    const r = await c.env.DB.prepare(`UPDATE photos SET state = '${approve ? 'approved' : 'rejected'}' WHERE ${where}`).bind(x.event.id).run();
    return json({ ok: true, changed: r.meta?.changes ?? 0 });
  });

  app.post('/api/g/:id/delete', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    return json({ ok: true, deleted: await deletePhotos(c.env, x.event.id, validIds(x.body.ids)) });
  });

  app.post('/api/g/:id/reorder', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    return json({ ok: true, moved: await applyOrder(c.env.DB, x.event, validIds(x.body.ids)) });
  });

  app.post('/api/g/:id/sort', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    if (!SORTS.includes(x.body.mode) || x.body.mode === 'manual') return json({ error: 'mode' }, 400);
    await setSortMode(c.env.DB, x.event.id, x.body.mode);
    return json({ ok: true });
  });

  app.post('/api/g/:id/mark', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    const ids = validIds(x.body.ids);
    if (!ids.length) return json({ ok: true });
    const sets = [], binds = [x.event.id];
    if ('flag' in x.body) {
      if (x.body.flag !== null && !FLAGS.has(x.body.flag)) return json({ error: 'flag' }, 400);
      sets.push(`flag = ?${binds.push(x.body.flag) }`);
    }
    if ('fav' in x.body) sets.push(`fav = ?${binds.push(x.body.fav ? 1 : 0)}`);
    if (!sets.length) return json({ error: 'nothing' }, 400);
    await c.env.DB.prepare(`UPDATE photos SET ${sets.join(', ')} WHERE event_id = ?1 AND id IN (${inList(ids)})`).bind(...binds).run();
    return json({ ok: true });
  });

  app.post('/api/g/:id/move', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    const ids = validIds(x.body.ids);
    if (!ids.length || !isHex(String(x.body.guest_id || ''), 16)) return json({ error: 'bad' }, 400);
    const g = await c.env.DB.prepare('SELECT id FROM guests WHERE id = ? AND event_id = ?').bind(x.body.guest_id, x.event.id).first();
    if (!g) return json({ error: 'guest' }, 404);
    const r = await c.env.DB.prepare(`UPDATE photos SET guest_id = ? WHERE event_id = ? AND id IN (${inList(ids)})`).bind(g.id, x.event.id).run();
    return json({ ok: true, moved: r.meta?.changes ?? 0 });
  });

  // Ajustes (formulario normal)
  app.post('/galerias/:id/ajustes', async (c) => {
    const { user, event } = await ownerEvent(c);
    if (!user) return c.redirect('/entrar', 303);
    if (!event) return html(notFoundPage('No encontramos esa galería.'), 404);
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 120) || event.name;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('event_date') || '')) ? String(f.get('event_date')) : null;
    const limit = Math.max(0, Math.min(2000, parseInt(String(f.get('photo_limit') || '0'), 10) || 0));
    const vals = [name, date, limit, String(f.get('lead') || '').trim().slice(0, 400),
      f.get('auto_approve') ? 1 : 0, f.get('upload_open') ? 1 : 0, f.get('gallery_open') ? 1 : 0, validAccent(f.get('accent'))];
    const base = 'UPDATE events SET name = ?, event_date = ?, photo_limit = ?, lead = ?, auto_approve = ?, upload_open = ?, gallery_open = ?, accent = ?';
    if (event.parent_id) await c.env.DB.prepare(base + ' WHERE id = ?').bind(...vals, event.id).run();
    else {
      try { await c.env.DB.prepare(base + ', show_subs = ? WHERE id = ?').bind(...vals, f.get('show_subs') ? 1 : 0, event.id).run(); }
      catch { await c.env.DB.prepare(base + ' WHERE id = ?').bind(...vals, event.id).run(); } // falta la migración 0006
    }
    return c.redirect(`/galerias/${event.id}?ok=${encodeURIComponent('Ajustes guardados.')}`, 303);
  });

  app.post('/galerias/:id/mostrar-subs', async (c) => {
    const { user, event } = await ownerEvent(c);
    if (!user) return c.redirect('/entrar', 303);
    if (!event || event.parent_id) return html(notFoundPage('No encontramos esa galería.'), 404);
    const f = await c.req.formData();
    let msg = f.get('show_subs') ? 'Las subgalerías se muestran a los invitados.' : 'Las subgalerías ya no se muestran a los invitados.';
    try { await c.env.DB.prepare('UPDATE events SET show_subs = ? WHERE id = ?').bind(f.get('show_subs') ? 1 : 0, event.id).run(); }
    catch { msg = 'Falta la actualización de la base de datos (migración 0006).'; }
    return c.redirect(`/galerias/${event.id}?ok=${encodeURIComponent(msg)}`, 303);
  });

  // ZIP en streaming: todas las publicadas (por partes) o una selección (?ids=a,b,c)
  app.get('/galerias/:id/zip', async (c) => {
    const { user, event } = await ownerEvent(c);
    if (!user) return c.redirect('/entrar', 303);
    if (!event) return html(notFoundPage(), 404);
    const partSize = Number(c.env.ZIP_PART_SIZE) || 40;
    const part = Math.max(1, parseInt(c.req.query('part') || '1', 10) || 1);
    const pick = validIds(String(c.req.query('ids') || '').split(',')).slice(0, partSize);
    const rows = (await c.env.DB.prepare(
      `SELECT p.id, p.filename, p.size, p.crc32, p.taken_at, p.uploaded_at
       FROM photos p WHERE p.event_id = ? AND p.state IN ('approved','pending','rejected') ${pick.length ? `AND p.id IN (${inList(pick)})` : `AND p.state = 'approved'`}
       ORDER BY ${orderSql(event.sort_mode, 'p')}`,
    ).bind(event.id).all()).results;
    const parts = pick.length ? [rows] : splitParts(rows, partSize);
    const list = parts[part - 1];
    if (!list || !list.length) return html(notFoundPage('No hay fotos para descargar.'), 404);
    const offset = pick.length ? 0 : parts.slice(0, part - 1).reduce((n, p) => n + p.length, 0);
    const used = new Set();
    const safe = (s) => String(s || '').replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').trim().slice(0, 80);
    const entries = list.map((r, i) => {
      let name = `${String(offset + i + 1).padStart(4, '0')}_${safe(r.filename) || r.id + '.jpg'}`;
      while (used.has(name)) name = name.replace(/(\.[^.]*)?$/, `_${r.id.slice(0, 4)}$1`);
      used.add(name);
      return { key: `p/${r.id}/o`, name, size: r.size, crc: r.crc32, ms: r.taken_at ?? r.uploaded_at };
    });
    const { stream, length } = buildZip(c.env.PHOTOS, entries);
    const label = safe(event.name).replace(/\s+/g, '-') || 'galeria';
    const fname = pick.length ? `picfy-${label}-seleccion.zip` : parts.length > 1 ? `picfy-${label}-parte${part}.zip` : `picfy-${label}.zip`;
    return new Response(stream, {
      headers: {
        'content-type': 'application/zip', 'content-length': String(length),
        'content-disposition': `attachment; filename="${fname}"`, 'cache-control': 'no-store',
      },
    });
  });
}
