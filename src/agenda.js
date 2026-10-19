// Agenda personal (picfy.es/agenda): torneos, partidos, publicaciones y tareas/entregas.
import { randomHex, isHex, html, json, esc } from './util.js';
import { currentUser } from './auth.js';
import { agendaPage } from './appviews.js';

// Tipos y estados: los usa el servidor para validar y el navegador para pintar.
export const AGENDA_KINDS = {
  torneo: { label: 'Torneo', plural: 'Torneos', color: '#e5964c', detail: 'Sede o pabellón', statuses: ['programado', 'en curso', 'terminado', 'cancelado'], done: ['terminado', 'cancelado'] },
  partido: { label: 'Partido', plural: 'Partidos', color: '#2f6fed', detail: 'Pabellón o rival', statuses: ['programado', 'jugado', 'aplazado'], done: ['jugado', 'aplazado'] },
  publicacion: { label: 'Publicación', plural: 'Publicaciones', color: '#c9376e', detail: 'Red social o formato', statuses: ['idea', 'pendiente', 'programada', 'publicada'], done: ['publicada'] },
  tarea: { label: 'Tarea o entrega', plural: 'Tareas y entregas', color: '#2f9e5f', detail: 'Entregar a', statuses: ['pendiente', 'en curso', 'hecha'], done: ['hecha'] },
};

let st = { v: null, t: 0 };
export async function agendaReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT id FROM agenda_items LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const reDate = /^\d{4}-\d{2}-\d{2}$/;
const reTime = /^([01]\d|2[0-3]):[0-5]\d$/;
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

function clean(b, current = null) {
  const kind = b.kind in AGENDA_KINDS ? b.kind : (current && current.kind) || null;
  if (!kind) return { error: 'kind' };
  const title = clip(b.title, 160);
  if (!title) return { error: 'title' };
  const date = reDate.test(String(b.date)) ? String(b.date) : null;
  if (!date) return { error: 'date' };
  let end = reDate.test(String(b.end_date || '')) ? String(b.end_date) : null;
  if (end && end <= date) end = null;
  const time = reTime.test(String(b.time || '')) ? String(b.time) : null;
  const status = AGENDA_KINDS[kind].statuses.includes(b.status) ? b.status : AGENDA_KINDS[kind].statuses[0];
  let url = clip(b.url, 400);
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
  return { v: { kind, title, date, end_date: end, time, status, client: clip(b.client, 80) || null, detail: clip(b.detail, 120) || null, url: url || null, notes: clip(b.notes, 2000) || null } };
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
    const rows = (await c.env.DB.prepare('SELECT * FROM agenda_items WHERE owner_id = ? ORDER BY date, COALESCE(time, \'99:99\') LIMIT 5000').bind(a.user.id).all()).results;
    return json({ items: rows.map(({ owner_id, created_at, ...r }) => r) });
  });

  app.post('/api/agenda', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const b = await c.req.json().catch(() => ({}));
    const r = clean(b);
    if (r.error) return json({ error: r.error }, 400);
    const id = randomHex(8);
    const v = r.v;
    await c.env.DB.prepare('INSERT INTO agenda_items (id, owner_id, kind, title, date, end_date, time, status, client, detail, url, notes, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)')
      .bind(id, a.user.id, v.kind, v.title, v.date, v.end_date, v.time, v.status, v.client, v.detail, v.url, v.notes, Date.now()).run();
    return json({ item: { id, ...v } });
  });

  app.put('/api/agenda/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!isHex(id, 16)) return json({ error: 'nf' }, 404);
    const cur = await c.env.DB.prepare('SELECT * FROM agenda_items WHERE id = ? AND owner_id = ?').bind(id, a.user.id).first();
    if (!cur) return json({ error: 'nf' }, 404);
    const r = clean({ ...cur, ...(await c.req.json().catch(() => ({}))) }, cur);
    if (r.error) return json({ error: r.error }, 400);
    const v = r.v;
    await c.env.DB.prepare('UPDATE agenda_items SET kind=?2, title=?3, date=?4, end_date=?5, time=?6, status=?7, client=?8, detail=?9, url=?10, notes=?11 WHERE id=?1')
      .bind(id, v.kind, v.title, v.date, v.end_date, v.time, v.status, v.client, v.detail, v.url, v.notes).run();
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
