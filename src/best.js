// Fotos destacadas (el corazón del organizador): pueden salir primero y tener su propia pestaña para los invitados.
let st = { v: null, t: 0 };
export async function bestReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT show_first FROM event_best LIMIT 1').first(); await db.prepare('SELECT fav FROM photos LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

export const BEST_TITLE = 'Lo mejor';

// Ajustes de la galería principal a la que pertenece `event` (las sedes los heredan).
export async function getBest(db, event) {
  const off = { ready: false, first: 0, tab: 0, title: BEST_TITLE, raw: '' };
  if (!event || !(await bestReady(db))) return off;
  const row = await db.prepare('SELECT * FROM event_best WHERE event_id = ?').bind(event.parent_id || event.id).first();
  return { ready: true, first: row && row.show_first ? 1 : 0, tab: row && row.show_tab ? 1 : 0, title: (row && row.title) || BEST_TITLE, raw: (row && row.title) || '' };
}

export async function saveBest(db, event, f) {
  if (!f.has('best_form')) return '';
  if (!(await bestReady(db))) return (f.get('best_first') || f.get('best_tab')) ? 'Ajustes guardados, pero falta la actualización de la base de datos (migración 0023) para las destacadas.' : '';
  const first = f.get('best_first') ? 1 : 0, tab = f.get('best_tab') ? 1 : 0;
  const title = String(f.get('best_title') || '').trim().slice(0, 40);
  await db.prepare(
    `INSERT INTO event_best (event_id, show_first, show_tab, title) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(event_id) DO UPDATE SET show_first = ?2, show_tab = ?3, title = ?4`,
  ).bind(event.id, first, tab, title || null).run();
  return '';
}
