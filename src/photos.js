// Lógica de orden y consultas de fotos.

import { isHex } from './util.js';

export const SORTS = ['time', 'time_desc', 'name', 'manual'];

// Fragmento ORDER BY según el modo del evento.
export function orderSql(mode, alias = '') {
  const p = alias ? alias + '.' : '';
  const t = `COALESCE(${p}taken_at, ${p}uploaded_at)`;
  if (mode === 'manual') return `${p}sort_order ASC, ${p}id ASC`;
  if (mode === 'name') return `${p}filename COLLATE NOCASE ASC, ${p}id ASC`;
  if (mode === 'time_desc') return `${t} DESC, ${p}id DESC`;
  return `${t} ASC, ${p}id ASC`;
}

// Una subgalería hereda consentimiento y caducidad de su galería principal.
async function inheritFromParent(db, e) {
  if (e && e.parent_id) {
    try {
      const p = await db.prepare('SELECT consent, consent_text, expires_at, expire_delete FROM events WHERE id = ?').bind(e.parent_id).first();
      if (p) {
        e.consent = e.consent || p.consent; e.consent_text = e.consent_text || p.consent_text;
        e.expires_at = e.expires_at || p.expires_at; e.expire_delete = e.expire_delete || p.expire_delete;
      }
    } catch { /* falta la migración 0013 */ }
  }
  return e;
}

export const TRASH_DAYS = 30;
let trashState = { v: null, t: 0 };
// ¿Está aplicada la migración 0014 (papelera)? Se recuerda un rato para no consultarlo en cada petición.
export async function trashReady(db) {
  if (trashState.v === true || (trashState.v === false && Date.now() - trashState.t < 30000)) return trashState.v;
  try { await db.prepare('SELECT deleted_at FROM events LIMIT 1').first(); await db.prepare('SELECT deleted_at, prev_state FROM photos LIMIT 1').first(); trashState = { v: true, t: Date.now() }; }
  catch { trashState = { v: false, t: Date.now() }; }
  return trashState.v;
}

// Manda fotos a la papelera (si no hay migración, las borra del todo como antes).
export async function trashPhotos(env, eventId, ids) {
  if (!(await trashReady(env.DB))) return deletePhotos(env, eventId, ids);
  ids = [...new Set(ids.filter((i) => isHex(i, 32)))];
  if (!ids.length) return 0;
  const r = await env.DB.prepare(
    `UPDATE photos SET prev_state = state, state = 'trashed', deleted_at = ?2 WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND state IN ('approved','pending','rejected') AND id IN (${ids.map((i) => `'${i}'`).join(',')})`,
  ).bind(eventId, Date.now()).run();
  return r.meta?.changes ?? 0;
}

// Borra del todo fotos de la papelera (objetos de R2 y filas).
export async function purgeTrashedPhotos(env, ids) {
  ids = [...new Set(ids.filter((i) => isHex(i, 32)))];
  for (let i = 0; i < ids.length; i += 200) {
    const part = ids.slice(i, i + 200);
    const keys = part.flatMap((id) => ['o', 'm', 'l'].map((s) => `p/${id}/${s}`));
    for (let k = 0; k < keys.length; k += 500) await env.PHOTOS.delete(keys.slice(k, k + 500));
    await env.DB.prepare(`DELETE FROM photos WHERE state = 'trashed' AND id IN (${part.map((x) => `'${x}'`).join(',')})`).run();
  }
  return ids.length;
}

export const isExpired = (e) => Boolean(e && e.expires_at && Date.now() > e.expires_at);

export async function getEventByGuestToken(db, token) {
  if (!isHex(token, 32)) return null;
  const e = await db.prepare('SELECT * FROM events WHERE guest_token = ?').bind(token).first();
  if (e && e.deleted_at) return null;
  return inheritFromParent(db, e);
}

export async function getEventById(db, id) {
  if (!isHex(id, 16)) return null;
  const e = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
  return e && e.deleted_at ? null : e;
}

// Fotos visibles para todos, con paginación.
// ¿Está aplicada la migración de privacidad? (se recuerda un rato para no consultarlo en cada visita)
let privState = { v: null, t: 0 };
export async function privacyReady(db) {
  if (privState.v === true || (privState.v === false && Date.now() - privState.t < 30000)) return privState.v;
  try { await db.prepare('SELECT is_private FROM events LIMIT 1').first(); privState = { v: true, t: Date.now() }; }
  catch { privState = { v: false, t: Date.now() }; }
  return privState.v;
}
// Familia visible para los invitados: la galería y sus subgalerías NO privadas.
export const famPublic = (col, p, ready) => `${col} IN (SELECT id FROM events WHERE id = ${p} OR (parent_id = ${p}${ready ? ' AND is_private = 0' : ''}))`;

export const GUEST_ORDERS = { recientes: 'time_desc', antiguas: 'time', nombre: 'name', autor: 'author' };

export async function listApproved(db, event, limit, offset, order = '') {
  const ready = await privacyReady(db);
  const rows = await db
    .prepare(
      `SELECT p.id, p.w, p.h, p.taken_at, p.uploaded_at, g.name AS gname FROM photos p
       JOIN guests g ON g.id = p.guest_id
       WHERE ${famPublic('p.event_id', '?1', ready)} AND p.state = 'approved'
       ORDER BY ${order === 'autor' ? "g.name COLLATE NOCASE ASC, COALESCE(p.taken_at, p.uploaded_at) ASC, p.id ASC" : orderSql(GUEST_ORDERS[order] || event.sort_mode, 'p')} LIMIT ?2 OFFSET ?3`,
    )
    .bind(event.id, limit, offset)
    .all();
  return rows.results;
}

export async function countApproved(db, eventId) {
  const ready = await privacyReady(db);
  const r = await db.prepare(`SELECT COUNT(*) AS n FROM photos p WHERE ${famPublic('p.event_id', '?1', ready)} AND p.state = 'approved'`).bind(eventId).first();
  return r ? r.n : 0;
}

// Convierte el orden actual (por hora) en posiciones fijas, para poder pasar a modo manual
// sin que nada cambie de sitio.
export async function materialize(db, event) {
  if (event.sort_mode === 'manual') return;
  await db
    .prepare(
      `UPDATE photos SET sort_order = (
         SELECT r FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY ${orderSql(event.sort_mode)}) AS r
           FROM photos WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1)
         ) x WHERE x.id = photos.id
       ) WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1)`,
    )
    .bind(event.id)
    .run();
}

export async function setSortMode(db, eventId, mode) {
  await db.prepare('UPDATE events SET sort_mode = ? WHERE id = ?').bind(mode, eventId).run();
}

// Reordena SOLO las fotos indicadas, reutilizando los huecos que ya ocupaban.
// El resto de fotos no se mueve. Devuelve cuántas se recolocaron.
export async function applyOrder(db, event, ids) {
  ids = [...new Set(ids.filter((i) => isHex(i, 32)))];
  if (!ids.length) return 0;
  await materialize(db, event);
  const list = ids.map((i) => `'${i}'`).join(',');
  const rows = await db
    .prepare(`SELECT id, sort_order FROM photos WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND id IN (${list})`)
    .bind(event.id)
    .all();
  const known = new Set(rows.results.map((r) => r.id));
  const valid = ids.filter((i) => known.has(i));
  const slots = rows.results.map((r) => r.sort_order).sort((a, b) => a - b);
  const stmts = [];
  const CH = 300;
  for (let s = 0; s < valid.length; s += CH) {
    const part = valid.slice(s, s + CH);
    const cases = part.map((id, k) => `WHEN '${id}' THEN ${Number(slots[s + k])}`).join(' ');
    const inList = part.map((id) => `'${id}'`).join(',');
    stmts.push(db.prepare(`UPDATE photos SET sort_order = CASE id ${cases} END WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND id IN (${inList})`).bind(event.id));
  }
  if (stmts.length) await db.batch(stmts);
  if (event.sort_mode !== 'manual') await setSortMode(db, event.id, 'manual');
  return valid.length;
}

export async function nextSortOrder(db, eventId) {
  const r = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM photos WHERE event_id = ?').bind(eventId).first();
  return r ? r.n : 1;
}

// Borra fotos (filas y objetos de R2). Solo las ids que pertenecen al evento (y, si se indica, al invitado).
export async function deletePhotos(env, eventId, ids, guestId = null) {
  ids = [...new Set(ids.filter((i) => isHex(i, 32)))];
  if (!ids.length) return 0;
  const list = ids.map((i) => `'${i}'`).join(',');
  let sql = `SELECT id FROM photos WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND id IN (${list})`;
  const binds = [eventId];
  if (guestId) { sql += ' AND guest_id = ?2'; binds.push(guestId); }
  const rows = await env.DB.prepare(sql).bind(...binds).all();
  const del = rows.results.map((r) => r.id);
  if (!del.length) return 0;
  const keys = del.flatMap((id) => ['o', 'm', 'l'].map((s) => `p/${id}/${s}`));
  for (let i = 0; i < keys.length; i += 500) await env.PHOTOS.delete(keys.slice(i, i + 500));
  const dl = del.map((i) => `'${i}'`).join(',');
  await env.DB.prepare(`DELETE FROM photos WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND id IN (${dl})`).bind(eventId).run();
  return del.length;
}

// Borra una galería con todas sus subgalerías: fotos (filas y R2), invitados e imágenes de personalización.
export async function deleteFamily(env, eventId) {
  const kids = (await env.DB.prepare('SELECT id FROM events WHERE parent_id = ?').bind(eventId).all()).results.map((r) => r.id);
  for (const eid of [...kids, eventId]) {
    const rows = await env.DB.prepare('SELECT id FROM photos WHERE event_id = ?').bind(eid).all();
    const keys = rows.results.flatMap((r) => ['o', 'm', 'l'].map((s) => `p/${r.id}/${s}`));
    for (let k = 0; k < keys.length; k += 500) await env.PHOTOS.delete(keys.slice(k, k + 500));
    await env.PHOTOS.delete([`c/${eid}/cover`, `c/${eid}/avatar`, `c/${eid}/thumb`]);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM photos WHERE event_id = ?').bind(eid),
      env.DB.prepare('DELETE FROM guests WHERE event_id = ?').bind(eid),
      env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eid),
    ]);
  }
}

// Tarea diaria: vacía lo que lleva más de 30 días en la papelera y borra las galerías caducadas marcadas para borrarse.
export async function dailyCleanup(env) {
  let n = await purgeExpired(env);
  try {
    const cutoff = Date.now() - TRASH_DAYS * 86400000;
    const ph = (await env.DB.prepare("SELECT id FROM photos WHERE state = 'trashed' AND deleted_at < ?").bind(cutoff).all()).results.map((r) => r.id);
    n += await purgeTrashedPhotos(env, ph);
    const ge = (await env.DB.prepare('SELECT id FROM events WHERE parent_id IS NULL AND deleted_at IS NOT NULL AND deleted_at < ?').bind(cutoff).all()).results;
    for (const g of ge) { try { await deleteFamily(env, g.id); n++; } catch (e) { console.error('trash purge', g.id, e && e.message); } }
  } catch { /* falta la migración 0014 */ }
  return n;
}

async function purgeExpired(env) {
  let rows;
  try {
    rows = (await env.DB.prepare('SELECT id FROM events WHERE parent_id IS NULL AND expire_delete = 1 AND expires_at IS NOT NULL AND expires_at < ?').bind(Date.now()).all()).results;
  } catch { return 0; }
  let n = 0;
  for (const r of rows) { try { await deleteFamily(env, r.id); n++; } catch (e) { console.error('purge', r.id, e && e.message); } }
  return n;
}
