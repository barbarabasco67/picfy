// Hábitos (picfy.es/habitos): objetivos diarios con progreso por día, solo para la cuenta que los crea.
import { randomHex, isHex, json } from './util.js';
import { currentUser } from './auth.js';

export const HABIT_COLORS = ['#e5604f', '#2f9e6f', '#e5964c', '#1f9fb3', '#4a63d6', '#8e5bd6', '#c9376e', '#6b7280'];

let st = { v: null, t: 0 };
export async function habitsReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try { await db.prepare('SELECT id FROM habits LIMIT 1').first(); await db.prepare('SELECT habit_id FROM habit_logs LIMIT 1').first(); st = { v: true, t: Date.now() }; }
  catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const reDate = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const num = (v, d) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 1 ? Math.min(n, 1000000) : d; };

function clean(b) {
  const name = clip(b.name, 60);
  if (!name) return null;
  return { name, icon: /^[a-z]{2,20}$/.test(String(b.icon || '')) ? String(b.icon) : null, color: HABIT_COLORS.includes(b.color) ? b.color : HABIT_COLORS[0], unit: clip(b.unit, 12) || null, goal: num(b.goal, 1), step: num(b.step, 1) };
}

export function habitsRoutes(app) {
  const go = (to) => new Response(null, { status: 303, headers: { location: to } });
  app.get('/habitos', () => go('/agenda#habitos'));

  async function auth(c) {
    const user = await currentUser(c);
    if (!user) return { err: json({ error: 'auth' }, 401) };
    if (!(await habitsReady(c.env.DB))) return { err: json({ error: 'setup' }, 503) };
    return { user };
  }
  const mine = (c, uid, id) => (isHex(id, 16) ? c.env.DB.prepare('SELECT * FROM habits WHERE id = ? AND owner_id = ?').bind(id, uid).first() : null);

  // Hábitos y sus registros entre dos fechas (por defecto, la semana que se esté viendo)
  app.get('/api/habits', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const from = reDate.test(c.req.query('from') || '') ? c.req.query('from') : '0000-00-00';
    const to = reDate.test(c.req.query('to') || '') ? c.req.query('to') : '9999-99-99';
    const habits = (await c.env.DB.prepare('SELECT id, name, icon, color, unit, goal, step FROM habits WHERE owner_id = ? ORDER BY created_at LIMIT 200').bind(a.user.id).all()).results;
    const logs = (await c.env.DB.prepare('SELECT l.habit_id, l.date, l.value FROM habit_logs l JOIN habits h ON h.id = l.habit_id WHERE h.owner_id = ? AND l.date >= ? AND l.date <= ? LIMIT 5000').bind(a.user.id, from, to).all()).results;
    return json({ habits, logs });
  });

  app.post('/api/habits', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const v = clean(await c.req.json().catch(() => ({})));
    if (!v) return json({ error: 'name' }, 400);
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO habits (id, owner_id, name, icon, color, unit, goal, step, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)').bind(id, a.user.id, v.name, v.icon, v.color, v.unit, v.goal, v.step, Date.now()).run();
    return json({ habit: { id, ...v } });
  });

  app.put('/api/habits/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!(await mine(c, a.user.id, id))) return json({ error: 'nf' }, 404);
    const v = clean(await c.req.json().catch(() => ({})));
    if (!v) return json({ error: 'name' }, 400);
    await c.env.DB.prepare('UPDATE habits SET name=?2, icon=?3, color=?4, unit=?5, goal=?6, step=?7 WHERE id=?1').bind(id, v.name, v.icon, v.color, v.unit, v.goal, v.step).run();
    return json({ habit: { id, ...v } });
  });

  app.delete('/api/habits/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!(await mine(c, a.user.id, id))) return json({ error: 'nf' }, 404);
    await c.env.DB.batch([c.env.DB.prepare('DELETE FROM habit_logs WHERE habit_id = ?').bind(id), c.env.DB.prepare('DELETE FROM habits WHERE id = ?').bind(id)]);
    return json({ ok: true });
  });

  // Fija el valor de un día (0 lo borra)
  app.put('/api/habits/:id/log', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const id = c.req.param('id');
    if (!(await mine(c, a.user.id, id))) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    if (!reDate.test(String(b.date || ''))) return json({ error: 'date' }, 400);
    const n = Math.round(Number(b.value));
    const value = Number.isFinite(n) ? Math.min(Math.max(n, 0), 1000000) : 0;
    if (value === 0) await c.env.DB.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').bind(id, b.date).run();
    else await c.env.DB.prepare('INSERT INTO habit_logs (habit_id, date, value) VALUES (?1,?2,?3) ON CONFLICT(habit_id, date) DO UPDATE SET value = ?3').bind(id, b.date, value).run();
    return json({ ok: true, value });
  });
}
