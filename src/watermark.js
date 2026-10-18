// Marca de agua. Las fotos que ven los invitados (miniatura «m» y grande «l») llevan la marca pintada;
// el original limpio («o») solo se descarga si el organizador permite las descargas.
// La marca la pinta el navegador (al subir, y en lote para las fotos que ya estaban): ver public/wm.js.

import { isHex, json } from './util.js';
import { currentUser } from './auth.js';

const MAX_THUMB = 4 * 1024 * 1024;
export const WM_POS = ['diag', 'center', 'corner'];

let st = { v: null, t: 0 };
export async function wmReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT enabled FROM event_wm LIMIT 1').first(); await db.prepare('SELECT rev FROM photo_wm LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

// Ajustes de marca de agua de la galería principal a la que pertenece `event`.
export async function getWm(db, event) {
  const off = { ready: false, on: 0, text: '', pos: 'diag', op: 35, logo: 0, rev: 0, logoUrl: '' };
  if (!event || !(await wmReady(db))) return off;
  const rootId = event.parent_id || event.id;
  const [row, root] = await Promise.all([
    db.prepare('SELECT * FROM event_wm WHERE event_id = ?').bind(rootId).first(),
    db.prepare('SELECT name, guest_token, avatar_v FROM events WHERE id = ?').bind(rootId).first(),
  ]);
  const cfg = { ...off, ready: true, rootId, name: root ? root.name : '' };
  if (!row) return cfg;
  cfg.on = row.enabled ? 1 : 0; cfg.text = row.text || ''; cfg.pos = WM_POS.includes(row.pos) ? row.pos : 'diag';
  cfg.op = Math.min(80, Math.max(10, row.opacity || 35)); cfg.rev = row.rev || 0;
  cfg.logo = row.logo && root && root.avatar_v ? 1 : 0;
  cfg.logoUrl = cfg.logo ? `/c/${root.guest_token}/avatar?v=${root.avatar_v}` : '';
  return cfg;
}

// Lo que necesita el navegador para pintar la marca (va en un atributo de la página).
export function wmAttr(cfg) {
  if (!cfg || !cfg.on) return '';
  return JSON.stringify({ on: 1, text: cfg.text || cfg.name || '', pos: cfg.pos, op: cfg.op, logoUrl: cfg.logoUrl, rev: cfg.rev });
}

// Guarda los ajustes que llegan del formulario (solo galería principal). Devuelve un aviso si algo falla.
export async function saveWm(db, event, f) {
  if (!(await wmReady(db))) return f.has('wm_form') && f.get('wm') ? 'Ajustes guardados, pero falta la actualización de la base de datos (migración 0022) para la marca de agua.' : '';
  if (!f.has('wm_form')) return '';
  const cur = await db.prepare('SELECT * FROM event_wm WHERE event_id = ?').bind(event.id).first();
  const enabled = f.get('wm') ? 1 : 0;
  const text = String(f.get('wm_text') || '').trim().slice(0, 60);
  const pos = WM_POS.includes(String(f.get('wm_pos'))) ? String(f.get('wm_pos')) : 'diag';
  const opacity = Math.min(80, Math.max(10, parseInt(String(f.get('wm_op') || '35'), 10) || 35));
  const logo = f.get('wm_logo') ? 1 : 0;
  const same = cur && cur.enabled === enabled && (cur.text || '') === text && cur.pos === pos && cur.opacity === opacity && cur.logo === logo;
  if (!cur && !enabled) return '';
  if (same) return '';
  const prev = cur ? cur.rev : 0;
  await db.prepare(
    `INSERT INTO event_wm (event_id, enabled, text, pos, opacity, logo, rev) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT(event_id) DO UPDATE SET enabled = ?2, text = ?3, pos = ?4, opacity = ?5, logo = ?6, rev = ?7`,
  ).bind(event.id, enabled, text, pos, opacity, logo, enabled ? prev + 1 : prev).run();
  return '';
}

// Fotos de la familia (galería + sedes) que aún no tienen la versión que toca (con marca o limpia).
async function pending(db, rootId, cfg) {
  const target = cfg.on ? cfg.rev : 0;
  const rows = (await db.prepare(
    `SELECT p.id FROM photos p LEFT JOIN photo_wm w ON w.photo_id = p.id
     WHERE p.event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND p.state IN ('approved','pending','rejected')
       AND COALESCE(w.rev, 0) != ?2 ORDER BY p.uploaded_at DESC LIMIT 5000`,
  ).bind(rootId, target).all()).results;
  return rows.map((r) => r.id);
}

export function wmRoutes(app) {
  async function owned(c) {
    const user = await currentUser(c);
    const id = c.req.param('id');
    if (!user || !/^[0-9a-f]{16}$/.test(id)) return null;
    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
    if (!event || event.deleted_at) return null;
    return event;
  }
  const inFamily = (db, rootId, photoId) => db.prepare(
    `SELECT p.id FROM photos p WHERE p.id = ?1 AND p.event_id IN (SELECT id FROM events WHERE id = ?2 OR parent_id = ?2)`,
  ).bind(photoId, rootId).first();

  app.get('/api/g/:id/wm/pending', async (c) => {
    const event = await owned(c);
    if (!event) return json({ error: 'auth' }, 403);
    const cfg = await getWm(c.env.DB, event);
    if (!cfg.ready) return json({ ready: false, ids: [] });
    return json({ ready: true, on: cfg.on, rev: cfg.rev, text: cfg.text || cfg.name || '', pos: cfg.pos, op: cfg.op, logoUrl: cfg.logoUrl, ids: await pending(c.env.DB, cfg.rootId, cfg) });
  });

  app.put('/api/g/:id/wm/:photo/:size', async (c) => {
    const event = await owned(c);
    const { photo, size } = c.req.param();
    if (!event || !isHex(photo, 32) || !['m', 'l'].includes(size)) return json({ error: 'auth' }, 403);
    const cfg = await getWm(c.env.DB, event);
    if (!cfg.ready || !(await inFamily(c.env.DB, cfg.rootId, photo))) return json({ error: 'nf' }, 404);
    const len = Number(c.req.header('content-length') || 0);
    if (!(len > 0 && len <= MAX_THUMB)) return json({ error: 'size' }, 413);
    await c.env.PHOTOS.put(`p/${photo}/${size}`, c.req.raw.body, { httpMetadata: { contentType: 'image/jpeg' } });
    return json({ ok: true });
  });

  app.post('/api/g/:id/wm/:photo/done', async (c) => {
    const event = await owned(c);
    const { photo } = c.req.param();
    if (!event || !isHex(photo, 32)) return json({ error: 'auth' }, 403);
    const cfg = await getWm(c.env.DB, event);
    if (!cfg.ready || !(await inFamily(c.env.DB, cfg.rootId, photo))) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    const target = cfg.on ? cfg.rev : 0;
    if (Number(b.rev) !== target) return json({ error: 'stale' }, 409); // el diseño cambió mientras tanto
    await c.env.DB.prepare('INSERT INTO photo_wm (photo_id, rev) VALUES (?1, ?2) ON CONFLICT(photo_id) DO UPDATE SET rev = ?2').bind(photo, target).run();
    return json({ ok: true });
  });
}
