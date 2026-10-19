// Agenda personal (picfy.es/agenda): tareas y eventos de varios tipos, con importantes y por hacer.
import { randomHex, isHex, html, json } from './util.js';
import { currentUser } from './auth.js';
import { agendaPage } from './appviews.js';

// Tipos de elemento de la agenda (el navegador los usa para pintar; el servidor, para validar).
export const AGENDA_KINDS = {
  tarea: { label: 'Tarea', plural: 'Tareas', color: '#6b7280', icon: '✅' },
  evento: { label: 'Evento', plural: 'Eventos', color: '#1f9fb3', icon: '📅' },
  torneo: { label: 'Torneo', plural: 'Torneos', color: '#e5964c', icon: '🏆' },
  reunion: { label: 'Reunión', plural: 'Reuniones', color: '#2f6fed', icon: '🤝' },
  publicacion: { label: 'Publicación', plural: 'Publicaciones', color: '#c9376e', icon: '📣' },
  storie: { label: 'Storie', plural: 'Stories', color: '#8e5bd6', icon: '📱' },
  entrega: { label: 'Entrega', plural: 'Entregas', color: '#2f9e5f', icon: '📦' },
  grabacion: { label: 'Grabación', plural: 'Grabaciones', color: '#d6483b', icon: '🎬' },
};

let st = { v: null, t: 0 };
export async function agendaReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT done, important, category FROM agenda_items LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const reDate = /^\d{4}-\d{2}-\d{2}$/;
const reTime = /^([01]\d|2[0-3]):[0-5]\d$/;
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

function clean(b) {
  const kind = b.kind in AGENDA_KINDS ? b.kind : 'tarea';
  const title = clip(b.title, 160);
  if (!title) return { error: 'title' };
  const date = reDate.test(String(b.date || '')) ? String(b.date) : '';
  if (kind !== 'tarea' && !date) return { error: 'date' };
  let end = reDate.test(String(b.end_date || '')) ? String(b.end_date) : null;
  if (!date || (end && end <= date)) end = null;
  const time = date && reTime.test(String(b.time || '')) ? String(b.time) : null;
  const end_time = time && reTime.test(String(b.end_time || '')) ? String(b.end_time) : null;
  let url = clip(b.url, 400);
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  return { v: { kind, title, icon: clip(b.icon, 8) || null, category: clip(b.category, 80) || null, date, end_date: end, time, end_time, done: Number(b.done) ? 1 : 0, important: Number(b.important) ? 1 : 0, url: url || null, notes: clip(b.notes, 2000) || null } };
}

export function agendaRoutes(app) {
  const go = (to) => new Response(null, { status: 303, headers: { location: to } });

  app.get('/agenda', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    return html(agendaPage({ user, ready: await agendaReady(c.env.DB), kinds: AGENDA_KINDS }));
  });

  async function auth(c) {
    const user = await currentUser(c);
    if (!user) return { err: json({ error: 'auth' }, 401) };
    if (!(await agendaReady(c.env.DB))) return { err: json({ error: 'setup' }, 503) };
    return { user };
  }

  app.get('/api/agenda', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const rows = (await c.env.DB.prepare('SELECT * FROM agenda_items WHERE owner_id = ? ORDER BY date, COALESCE(time, \'99:99\'), created_at LIMIT 5000').bind(a.user.id).all()).results;
    return json({ items: rows.map(({ owner_id, created_at, ...r }) => r) });
  });

  app.post('/api/agenda', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const b = await c.req.json().catch(() => ({}));
    const r = clean(b);
    if (r.error) return json({ error: r.error }, 400);
    const id = randomHex(8);
    const v = r.v;
    await c.env.DB.prepare('INSERT INTO agenda_items (id, owner_id, kind, title, icon, category, date, end_date, time, end_time, done, important, url, notes, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)')
      .bind(id, a.user.id, v.kind, v.title, v.icon, v.category, v.date, v.end_date, v.time, v.end_time, v.done, v.important, v.url, v.notes, Date.now()).run();
    return json({ item: { id, ...v } });
  });

  app.put('/api/agenda/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!isHex(id, 16)) return json({ error: 'nf' }, 404);
    const cur = await c.env.DB.prepare('SELECT * FROM agenda_items WHERE id = ? AND owner_id = ?').bind(id, a.user.id).first();
    if (!cur) return json({ error: 'nf' }, 404);
    const r = clean({ ...cur, ...(await c.req.json().catch(() => ({}))) });
    if (r.error) return json({ error: r.error }, 400);
    const v = r.v;
    await c.env.DB.prepare('UPDATE agenda_items SET kind=?2, title=?3, icon=?4, category=?5, date=?6, end_date=?7, time=?8, end_time=?9, done=?10, important=?11, url=?12, notes=?13 WHERE id=?1')
      .bind(id, v.kind, v.title, v.icon, v.category, v.date, v.end_date, v.time, v.end_time, v.done, v.important, v.url, v.notes).run();
    return json({ item: { id, ...v } });
  });

  app.delete('/api/agenda/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!isHex(id, 16)) return json({ error: 'nf' }, 404);
    await c.env.DB.prepare('DELETE FROM agenda_items WHERE id = ? AND owner_id = ?').bind(id, a.user.id).run();
    return json({ ok: true });
  });
}
