// Panel de inicio (picfy.es/inicio): resumen del trabajo del usuario.
import { html } from './util.js';
import { currentUser } from './auth.js';
import { dashPage, spaceBox } from './appviews.js';
import { agendaReady, AGENDA_KINDS } from './agenda.js';

const go = (to) => new Response(null, { status: 303, headers: { location: to } });
const TZ = 'Europe/Madrid';
const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function dashboardRoutes(app) {
  app.get('/api/espacio', async (c) => {
    const user = await currentUser(c);
    if (!user) return new Response('', { status: 401 });
    const tot = await c.env.DB.prepare('SELECT COALESCE(SUM(p.size),0) AS bytes, COUNT(*) AS n FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ?').bind(user.id).first();
    return new Response(spaceBox(tot), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  });

  app.get('/inicio', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const db = c.env.DB;
    const today = ymd(new Date());

    const gal = (await db.prepare(
      `SELECT e.id, e.name, e.event_date,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'approved') AS approved,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'pending') AS pending,
         (SELECT p.id FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'approved'
            ORDER BY COALESCE(p.taken_at, p.uploaded_at) ASC LIMIT 1) AS cover
       FROM events e WHERE e.owner_id = ? AND e.parent_id IS NULL AND e.deleted_at IS NULL ORDER BY e.created_at DESC LIMIT 200`,
    ).bind(user.id).all().catch(async () => db.prepare(
      `SELECT e.id, e.name, e.event_date, 0 AS approved, 0 AS pending, NULL AS cover FROM events e WHERE e.owner_id = ? AND e.parent_id IS NULL ORDER BY e.created_at DESC LIMIT 200`,
    ).bind(user.id).all())).results;

    const tot = await db.prepare(
      `SELECT COALESCE(SUM(p.size),0) AS bytes, COUNT(*) AS n, COALESCE(SUM(p.state='pending'),0) AS pending
       FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ?`,
    ).bind(user.id).first();

    // Fotos subidas por día (últimos 7 días)
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const since = new Date(days[0] + 'T00:00:00Z').getTime() - 12 * 3600 * 1000;
    const ups = (await db.prepare(
      `SELECT p.uploaded_at AS t FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ? AND p.uploaded_at >= ? AND p.state != 'uploading' LIMIT 20000`,
    ).bind(user.id, since).all()).results;
    const perDay = Object.fromEntries(days.map((d) => [d, 0]));
    for (const r of ups) { const d = ymd(new Date(r.t)); if (d in perDay) perDay[d]++; }

    // Agenda
    let agenda = { ready: false, today: [], todo: [], events: [], dots: [] };
    if (await agendaReady(db)) {
      const monthStart = today.slice(0, 8) + '01';
      const rows = (await db.prepare(
        `SELECT id, kind, title, date, end_date, time, done, important FROM agenda_items WHERE owner_id = ? ORDER BY date, time LIMIT 2000`,
      ).bind(user.id).all()).results;
      const covers = (it, d) => it.date && it.date <= d && (it.end_date || it.date) >= d;
      agenda = {
        ready: true,
        today: rows.filter((r) => covers(r, today)),
        todo: rows.filter((r) => !r.done && (!r.date || r.date < today)).slice(0, 5),
        events: rows.filter((r) => !r.done && r.date >= today).slice(0, 6),
        dots: [...new Set(rows.filter((r) => r.date && r.date.slice(0, 7) === monthStart.slice(0, 7)).map((r) => r.date))],
      };
    }

    return html(dashPage({ user, today, galleries: gal, totals: tot, days, perDay, agenda, kinds: AGENDA_KINDS }));
  });
}
