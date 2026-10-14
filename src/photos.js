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

export async function getEventByGuestToken(db, token) {
  if (!isHex(token, 32)) return null;
  return db.prepare('SELECT * FROM events WHERE guest_token = ?').bind(token).first();
}

export async function getEventById(db, id) {
  if (!isHex(id, 16)) return null;
  return db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
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
