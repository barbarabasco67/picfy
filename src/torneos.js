// Torneos: el hub (cuenta) organiza sedes, creadores con enlace de invitación y tareas del día.
import { randomHex, isHex, html, json } from './util.js';
import { currentUser } from './auth.js';
import { torneosPage, torneoPage, miDiaPage } from './appviews.js';
import { AGENDA_KINDS } from './agenda.js';

let st = { v: null, t: 0 };
export async function torneosReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT id FROM torneos LIMIT 1').first(); await db.prepare('SELECT id FROM tareas_torneo LIMIT 1').first(); await db.prepare('SELECT token FROM creadores LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const reDate = /^\d{4}-\d{2}-\d{2}$/;
const reTime = /^([01]\d|2[0-3]):[0-5]\d$/;
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const go = (to) => new Response(null, { status: 303, headers: { location: to } });
const KINDS = Object.fromEntries(Object.entries(AGENDA_KINDS).map(([k, v]) => [k, { label: v.label, color: v.color }]));

export function torneosRoutes(app) {
  async function auth(c) {
    const user = await currentUser(c);
    if (!user) return { err: json({ error: 'auth' }, 401) };
    if (!(await torneosReady(c.env.DB))) return { err: json({ error: 'setup' }, 503) };
    return { user };
  }
  const ownTorneo = (c, user, id) => isHex(id, 16) ? c.env.DB.prepare('SELECT * FROM torneos WHERE id = ? AND owner_id = ?').bind(id, user.id).first() : null;
  const ownSede = (c, user, id) => isHex(id, 16) ? c.env.DB.prepare('SELECT s.* FROM sedes s JOIN torneos t ON t.id = s.torneo_id WHERE s.id = ? AND t.owner_id = ?').bind(id, user.id).first() : null;

  /* ----- Páginas del hub ----- */
  app.get('/torneo', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const ready = await torneosReady(c.env.DB);
    const rows = ready ? (await c.env.DB.prepare(
      `SELECT t.id, t.name,
         (SELECT COUNT(*) FROM sedes s WHERE s.torneo_id = t.id) AS sedes,
         (SELECT COUNT(*) FROM tareas_torneo k JOIN sedes s ON s.id = k.sede_id WHERE s.torneo_id = t.id) AS tareas,
         (SELECT COUNT(*) FROM tareas_torneo k JOIN sedes s ON s.id = k.sede_id WHERE s.torneo_id = t.id AND k.done = 1) AS hechas
       FROM torneos t WHERE t.owner_id = ? ORDER BY t.created_at DESC LIMIT 200`).bind(user.id).all()).results : [];
    return html(torneosPage({ user, ready, torneos: rows }));
  });

  app.post('/torneo', async (c) => {
    const a = await auth(c); if (a.err) return go('/torneo');
    const f = await c.req.formData().catch(() => null);
    const name = clip(f && f.get('name'), 120);
    if (!name) return go('/torneo');
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO torneos (id, owner_id, name, created_at) VALUES (?,?,?,?)').bind(id, a.user.id, name, Date.now()).run();
    return go('/torneo/' + id);
  });

  app.get('/torneo/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    if (!(await torneosReady(c.env.DB))) return go('/torneo');
    const t = await ownTorneo(c, user, c.req.param('id'));
    if (!t) return go('/torneo');
    return html(torneoPage({ user, torneo: { id: t.id, name: t.name }, kinds: KINDS }));
  });

  app.post('/torneo/:id/borrar', async (c) => {
    const a = await auth(c); if (a.err) return go('/torneo');
    const t = await ownTorneo(c, a.user, c.req.param('id'));
    if (t) {
      const ids = (await c.env.DB.prepare('SELECT id FROM sedes WHERE torneo_id = ?').bind(t.id).all()).results.map((r) => r.id);
      const st2 = [];
      for (const s of ids) st2.push(c.env.DB.prepare('DELETE FROM tareas_torneo WHERE sede_id = ?').bind(s), c.env.DB.prepare('DELETE FROM creadores WHERE sede_id = ?').bind(s));
      st2.push(c.env.DB.prepare('DELETE FROM sedes WHERE torneo_id = ?').bind(t.id), c.env.DB.prepare('DELETE FROM torneos WHERE id = ?').bind(t.id));
      await c.env.DB.batch(st2);
    }
    return go('/torneo');
  });

  /* ----- API del hub ----- */
  app.get('/api/torneos/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const t = await ownTorneo(c, a.user, c.req.param('id'));
    if (!t) return json({ error: 'nf' }, 404);
    const sedes = (await c.env.DB.prepare('SELECT id, name FROM sedes WHERE torneo_id = ? ORDER BY created_at').bind(t.id).all()).results;
    const ids = sedes.map((s) => s.id);
    const q = (sql) => ids.length ? c.env.DB.prepare(sql.replace('?', ids.map(() => '?').join(','))).bind(...ids).all().then((r) => r.results) : [];
    const creadores = await q('SELECT id, sede_id, name, token FROM creadores WHERE sede_id IN (?) ORDER BY created_at');
    const tareas = await q("SELECT id, sede_id, creador_id, kind, title, date, time, notes, done, done_at, done_by FROM tareas_torneo WHERE sede_id IN (?) ORDER BY date, COALESCE(time, '99:99'), created_at");
    return json({ sedes: sedes.map((s) => ({ ...s, creadores: creadores.filter((x) => x.sede_id === s.id), tareas: tareas.filter((x) => x.sede_id === s.id) })) });
  });

  app.post('/api/torneos/:id/sedes', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const t = await ownTorneo(c, a.user, c.req.param('id'));
    if (!t) return json({ error: 'nf' }, 404);
    const name = clip((await c.req.json().catch(() => ({}))).name, 80);
    if (!name) return json({ error: 'name' }, 400);
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO sedes (id, torneo_id, name, created_at) VALUES (?,?,?,?)').bind(id, t.id, name, Date.now()).run();
    return json({ sede: { id, name, creadores: [], tareas: [] } });
  });

  app.delete('/api/sedes/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const s = await ownSede(c, a.user, c.req.param('id'));
    if (!s) return json({ error: 'nf' }, 404);
    await c.env.DB.batch([c.env.DB.prepare('DELETE FROM tareas_torneo WHERE sede_id = ?').bind(s.id), c.env.DB.prepare('DELETE FROM creadores WHERE sede_id = ?').bind(s.id), c.env.DB.prepare('DELETE FROM sedes WHERE id = ?').bind(s.id)]);
    return json({ ok: true });
  });

  app.post('/api/sedes/:id/creadores', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const s = await ownSede(c, a.user, c.req.param('id'));
    if (!s) return json({ error: 'nf' }, 404);
    const name = clip((await c.req.json().catch(() => ({}))).name, 80);
    if (!name) return json({ error: 'name' }, 400);
    const id = randomHex(8), token = randomHex(12);
    await c.env.DB.prepare('INSERT INTO creadores (id, sede_id, name, token, created_at) VALUES (?,?,?,?,?)').bind(id, s.id, name, token, Date.now()).run();
    return json({ creador: { id, sede_id: s.id, name, token } });
  });

  app.delete('/api/creadores/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!isHex(id, 16)) return json({ error: 'nf' }, 404);
    const r = await c.env.DB.prepare('SELECT c.id FROM creadores c JOIN sedes s ON s.id = c.sede_id JOIN torneos t ON t.id = s.torneo_id WHERE c.id = ? AND t.owner_id = ?').bind(id, a.user.id).first();
    if (!r) return json({ error: 'nf' }, 404);
    await c.env.DB.batch([c.env.DB.prepare('UPDATE tareas_torneo SET creador_id = NULL WHERE creador_id = ?').bind(id), c.env.DB.prepare('DELETE FROM creadores WHERE id = ?').bind(id)]);
    return json({ ok: true });
  });

  function cleanTask(b) {
    const title = clip(b.title, 160);
    if (!title) return null;
    const date = reDate.test(String(b.date || '')) ? String(b.date) : '';
    return { kind: b.kind in KINDS ? b.kind : 'tarea', title, date, time: date && reTime.test(String(b.time || '')) ? String(b.time) : null, notes: clip(b.notes, 1000) || null, creador_id: isHex(b.creador_id, 16) ? b.creador_id : null };
  }

  app.post('/api/sedes/:id/tareas', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const s = await ownSede(c, a.user, c.req.param('id'));
    if (!s) return json({ error: 'nf' }, 404);
    const v = cleanTask(await c.req.json().catch(() => ({})));
    if (!v) return json({ error: 'title' }, 400);
    if (v.creador_id && !(await c.env.DB.prepare('SELECT 1 AS ok FROM creadores WHERE id = ? AND sede_id = ?').bind(v.creador_id, s.id).first())) v.creador_id = null;
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO tareas_torneo (id, sede_id, creador_id, kind, title, date, time, notes, done, created_at) VALUES (?,?,?,?,?,?,?,?,0,?)').bind(id, s.id, v.creador_id, v.kind, v.title, v.date, v.time, v.notes, Date.now()).run();
    return json({ tarea: { id, sede_id: s.id, ...v, done: 0 } });
  });

  async function ownTask(c, user, id) {
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT k.* FROM tareas_torneo k JOIN sedes s ON s.id = k.sede_id JOIN torneos t ON t.id = s.torneo_id WHERE k.id = ? AND t.owner_id = ?').bind(id, user.id).first();
  }

  app.put('/api/tareas/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cur = await ownTask(c, a.user, c.req.param('id'));
    if (!cur) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    const done = 'done' in b ? (Number(b.done) ? 1 : 0) : cur.done;
    const v = cleanTask({ ...cur, ...b });
    if (!v) return json({ error: 'title' }, 400);
    if (v.creador_id && !(await c.env.DB.prepare('SELECT 1 AS ok FROM creadores WHERE id = ? AND sede_id = ?').bind(v.creador_id, cur.sede_id).first())) v.creador_id = null;
    await c.env.DB.prepare('UPDATE tareas_torneo SET kind=?2, title=?3, date=?4, time=?5, notes=?6, creador_id=?7, done=?8, done_at=?9, done_by=?10 WHERE id=?1')
      .bind(cur.id, v.kind, v.title, v.date, v.time, v.notes, v.creador_id, done, done ? (cur.done ? cur.done_at : Date.now()) : null, done ? (cur.done ? cur.done_by : 'hub') : null).run();
    return json({ ok: true });
  });

  app.delete('/api/tareas/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cur = await ownTask(c, a.user, c.req.param('id'));
    if (!cur) return json({ error: 'nf' }, 404);
    await c.env.DB.prepare('DELETE FROM tareas_torneo WHERE id = ?').bind(cur.id).run();
    return json({ ok: true });
  });

  /* ----- Creadores: "Mi día" por enlace de invitación ----- */
  async function byToken(c) {
    const token = c.req.param('token');
    if (!isHex(token, 24) || !(await torneosReady(c.env.DB))) return null;
    return c.env.DB.prepare('SELECT c.id, c.name, c.sede_id, s.name AS sede, t.name AS torneo FROM creadores c JOIN sedes s ON s.id = c.sede_id JOIN torneos t ON t.id = s.torneo_id WHERE c.token = ?').bind(token).first();
  }

  app.get('/t/:token', async (c) => {
    const me = await byToken(c);
    if (!me) return html(miDiaPage({ me: null }), 404);
    return html(miDiaPage({ me: { name: me.name, sede: me.sede, torneo: me.torneo }, token: c.req.param('token'), kinds: KINDS }));
  });

  app.get('/api/t/:token', async (c) => {
    const me = await byToken(c);
    if (!me) return json({ error: 'nf' }, 404);
    const rows = (await c.env.DB.prepare("SELECT id, kind, title, date, time, notes, done FROM tareas_torneo WHERE sede_id = ? AND (creador_id IS NULL OR creador_id = ?) ORDER BY date, COALESCE(time, '99:99'), created_at LIMIT 1000").bind(me.sede_id, me.id).all()).results;
    return json({ tareas: rows });
  });

  app.put('/api/t/:token/tareas/:id', async (c) => {
    const me = await byToken(c);
    if (!me) return json({ error: 'nf' }, 404);
    const id = c.req.param('id');
    if (!isHex(id, 16)) return json({ error: 'nf' }, 404);
    const cur = await c.env.DB.prepare('SELECT * FROM tareas_torneo WHERE id = ? AND sede_id = ? AND (creador_id IS NULL OR creador_id = ?)').bind(id, me.sede_id, me.id).first();
    if (!cur) return json({ error: 'nf' }, 404);
    const done = Number((await c.req.json().catch(() => ({}))).done) ? 1 : 0;
    await c.env.DB.prepare('UPDATE tareas_torneo SET done = ?2, done_at = ?3, done_by = ?4 WHERE id = ?1').bind(id, done, done ? Date.now() : null, done ? me.name : null).run();
    return json({ ok: true });
  });
}
