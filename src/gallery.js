// Gestión de una galería por su dueño: moderar, ordenar, marcar, mover, ajustes y descargas.

import { isHex, json, html, randomHex } from './util.js';
import { currentUser, hashPassword } from './auth.js';
import { applyOrder, deletePhotos, trashPhotos, orderSql, setSortMode, SORTS } from './photos.js';
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
  return { user, event: event && event.deleted_at ? null : event };
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
    let where = `event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND state IN ${from}`;
    if (approve && x.body.all === true) where = `event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND state = 'pending'`;
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
    return json({ ok: true, deleted: await trashPhotos(c.env, x.event.id, validIds(x.body.ids)) });
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
    await c.env.DB.prepare(`UPDATE photos SET ${sets.join(', ')} WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND id IN (${inList(ids)})`).bind(...binds).run();
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

  // Mover fotos a otra carpeta (galería principal o una de sus subgalerías)
  app.post('/api/g/:id/folder', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    const ids = validIds(x.body.ids);
    const rootId = x.event.parent_id || x.event.id;
    const target = String(x.body.target || '');
    const dest = await c.env.DB.prepare('SELECT id FROM events WHERE id = ?1 AND (id = ?2 OR parent_id = ?2) AND owner_id = ?3').bind(target, rootId, x.event.owner_id).first();
    if (!ids.length || !dest) return json({ error: 'bad' }, 400);
    const r = await c.env.DB.prepare(
      `UPDATE photos SET event_id = ?1 WHERE id IN (${inList(ids)}) AND event_id IN (SELECT id FROM events WHERE id = ?2 OR parent_id = ?2)`,
    ).bind(dest.id, rootId).run();
    return json({ ok: true, moved: r.meta?.changes ?? 0 });
  });

  // Usar una foto como portada del cuadro de esta (sub)galería
  app.post('/api/g/:id/thumb-from', async (c) => {
    const x = await api(c); if (!x) return json({ error: 'auth' }, 403);
    const id = String(x.body.id || '');
    if (!isHex(id, 32)) return json({ error: 'bad' }, 400);
    const ok = await c.env.DB.prepare('SELECT id FROM photos WHERE id = ?1 AND event_id IN (SELECT id FROM events WHERE id = ?2 OR parent_id = ?2)').bind(id, x.event.id).first();
    const obj = ok && await c.env.PHOTOS.get(`p/${id}/l`);
    if (!obj) return json({ error: 'photo' }, 404);
    await c.env.PHOTOS.put(`c/${x.event.id}/thumb`, obj.body, { httpMetadata: { contentType: 'image/jpeg' } });
    const v = Date.now();
    await c.env.DB.prepare('UPDATE events SET thumb_v = ? WHERE id = ?').bind(v, x.event.id).run();
    return json({ ok: true, v });
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
    const base = 'UPDATE events SET name = ?, event_date = ?, photo_limit = ?, lead = ?, auto_approve = ?, upload_open = ?, gallery_open = ?, accent = COALESCE(?, accent)';
    if (event.parent_id) await c.env.DB.prepare(base + ' WHERE id = ?').bind(...vals, event.id).run();
    else {
      try { await c.env.DB.prepare(base + ', show_subs = ? WHERE id = ?').bind(...vals, f.get('show_subs') ? 1 : 0, event.id).run(); }
      catch { await c.env.DB.prepare(base + ' WHERE id = ?').bind(...vals, event.id).run(); } // falta la migración 0006
    }
    try {
      const dl = f.get('allow_download') ? 1 : 0;
      // en una galería principal, si el permiso cambia, se aplica también a sus subgalerías
      if (!event.parent_id && Boolean(event.allow_download) !== Boolean(dl)) await c.env.DB.prepare('UPDATE events SET allow_download = ? WHERE id = ? OR parent_id = ?').bind(dl, event.id, event.id).run();
      else await c.env.DB.prepare('UPDATE events SET allow_download = ? WHERE id = ?').bind(dl, event.id).run();
    } catch { /* falta la migración 0008 */ }
    try {
      const so = f.get('social') ? 1 : 0;
      if (!event.parent_id) await c.env.DB.prepare('UPDATE events SET social = ? WHERE id = ? OR parent_id = ?').bind(so, event.id, event.id).run();
      else await c.env.DB.prepare('UPDATE events SET social = ? WHERE id = ?').bind(so, event.id).run();
    } catch { /* falta la migración 0015 */ }
    let msg = 'Ajustes guardados.';
    if (!event.parent_id) {
      const ex = String(f.get('expires') || '');
      const exMs = /^\d{4}-\d{2}-\d{2}$/.test(ex) ? Date.parse(ex + 'T23:59:59') : null;
      try {
        await c.env.DB.prepare('UPDATE events SET consent = ?, consent_text = ?, expires_at = ?, expire_delete = ? WHERE id = ?')
          .bind(f.get('consent') ? 1 : 0, String(f.get('consent_text') || '').trim().slice(0, 600), Number.isFinite(exMs) ? exMs : null, f.get('expire_delete') && exMs ? 1 : 0, event.id).run();
      } catch { msg = 'Ajustes guardados, pero falta la actualización de la base de datos (migración 0013) para el consentimiento y la caducidad.'; }
    }
    if (event.parent_id) {
      try {
        await c.env.DB.prepare('UPDATE events SET is_private = ? WHERE id = ?').bind(f.get('is_private') ? 1 : 0, event.id).run();
        const pw = String(f.get('access_password') || '').trim().slice(0, 60);
        if (f.get('access_clear')) await c.env.DB.prepare('UPDATE events SET access_hash = NULL WHERE id = ?').bind(event.id).run();
        else if (pw && pw.length < 4) msg = 'Ajustes guardados, pero la contraseña debe tener al menos 4 caracteres.';
        else if (pw) { const salt = randomHex(16); await c.env.DB.prepare('UPDATE events SET access_hash = ? WHERE id = ?').bind(`${salt}:${await hashPassword(pw, salt)}`, event.id).run(); }
      } catch { msg = 'Ajustes guardados, pero falta la actualización de la base de datos (migración 0009) para la privacidad.'; }
    }
    return c.redirect(`/galerias/${event.id}?ok=${encodeURIComponent(msg)}`, 303);
  });

  // Solo el color (las fotos de perfil y cabecera se suben aparte, por /api/g/:id/brand)
  app.post('/galerias/:id/personalizar', async (c) => {
    const { user, event } = await ownerEvent(c);
    if (!user) return c.redirect('/entrar', 303);
    if (!event) return html(notFoundPage('No encontramos esa galería.'), 404);
    const f = await c.req.formData();
    const accent = validAccent(f.get('accent'));
    if (accent) await c.env.DB.prepare('UPDATE events SET accent = ? WHERE id = ?').bind(accent, event.id).run();
    return c.redirect(`/galerias/${event.id}?ok=${encodeURIComponent('Personalización guardada.')}`, 303);
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
       FROM photos p WHERE p.event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND p.state IN ('approved','pending','rejected') ${pick.length ? `AND p.id IN (${inList(pick)})` : `AND p.state = 'approved'`}
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
