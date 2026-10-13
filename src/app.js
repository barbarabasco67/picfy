// Rutas de la plataforma: cuentas y galerías de cada usuario.

import { randomHex, sha256Hex, html, json } from './util.js';
import { hashPassword, checkPassword, validEmail, startSession, endSession, currentUser } from './auth.js';
import { authPage, galleriesPage, galleryPage } from './appviews.js';
import { notFoundPage } from './views.js';

const go = (to, headers = {}) => new Response(null, { status: 303, headers: { location: to, ...headers } });

async function userCount(db) {
  const r = await db.prepare('SELECT COUNT(*) AS n FROM users').first();
  return r ? r.n : 0;
}

export function appRoutes(app) {
  /* ----- Entrar ----- */
  app.get('/entrar', async (c) => (await currentUser(c)) ? go('/galerias') : html(authPage({ mode: 'login' })));

  app.post('/entrar', async (c) => {
    const f = await c.req.formData();
    const email = String(f.get('email') || '').trim().toLowerCase().slice(0, 254);
    const password = String(f.get('password') || '').slice(0, 200);
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    // Se calcula siempre el hash para que no se note si el correo existe.
    const ok = user ? await checkPassword(user, password) : (await hashPassword(password, '00'.repeat(16)), false);
    if (!ok) return html(authPage({ mode: 'login', email, error: 'Correo o contraseña incorrectos.' }), 401);
    return go('/galerias', { 'set-cookie': await startSession(c.env.DB, user.id) });
  });

  /* ----- Crear cuenta ----- */
  app.get('/registro', async (c) => {
    if (await currentUser(c)) return go('/galerias');
    const first = (await userCount(c.env.DB)) === 0;
    if (!first && !c.env.SIGNUP_CODE) return html(authPage({ mode: 'login', error: 'El registro está cerrado. Pide una invitación.' }), 403);
    return html(authPage({ mode: 'signup', needCode: !first && Boolean(c.env.SIGNUP_CODE), firstUser: first }));
  });

  app.post('/registro', async (c) => {
    const first = (await userCount(c.env.DB)) === 0;
    const needCode = !first && Boolean(c.env.SIGNUP_CODE);
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 80);
    const email = String(f.get('email') || '').trim().toLowerCase();
    const password = String(f.get('password') || '').slice(0, 200);
    const back = (error, status = 400) => html(authPage({ mode: 'signup', error, name, email, needCode, firstUser: first }), status);
    if (!first && !c.env.SIGNUP_CODE) return back('El registro está cerrado.', 403);
    if (needCode && String(f.get('code') || '').trim() !== c.env.SIGNUP_CODE) return back('Código de invitación incorrecto.', 403);
    if (!name) return back('Escribe tu nombre.');
    if (!validEmail(email)) return back('Ese correo no parece correcto.');
    if (password.length < 8) return back('La contraseña debe tener al menos 8 caracteres.');
    if (await c.env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) return back('Ya existe una cuenta con ese correo.', 409);
    const id = randomHex(8);
    const salt = randomHex(16);
    await c.env.DB.prepare('INSERT INTO users (id, email, name, pass_salt, pass_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, name, salt, await hashPassword(password, salt), Date.now()).run();
    return go('/galerias', { 'set-cookie': await startSession(c.env.DB, id) });
  });

  app.post('/salir', async (c) => go('/entrar', { 'set-cookie': await endSession(c.env.DB, c.req.raw) }));

  /* ----- Galerías ----- */
  app.get('/galerias', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const rows = await c.env.DB.prepare(
      `SELECT e.id, e.name, e.event_date,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id AND p.state = 'approved') AS approved,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id AND p.state = 'pending') AS pending,
         (SELECT p.id FROM photos p WHERE p.event_id = e.id AND p.state = 'approved'
            ORDER BY COALESCE(p.taken_at, p.uploaded_at) ASC LIMIT 1) AS cover
       FROM events e WHERE e.owner_id = ? ORDER BY e.created_at DESC`,
    ).bind(user.id).all();
    return html(galleriesPage({ user, events: rows.results, origin: new URL(c.req.url).origin }));
  });

  app.post('/galerias', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 120);
    if (!name) return go('/galerias');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('event_date') || '')) ? String(f.get('event_date')) : null;
    const limit = Math.max(0, Math.min(2000, parseInt(String(f.get('photo_limit') || '0'), 10) || 0));
    const lead = String(f.get('lead') || '').trim().slice(0, 400);
    const auto = f.get('auto_approve') ? 1 : 0;
    const id = randomHex(8);
    // El enlace de organizador por token sigue existiendo (compatibilidad); aquí nadie lo necesita.
    await c.env.DB.prepare(
      `INSERT INTO events (id, name, lead, event_date, guest_token, manage_hash, auto_approve, photo_limit, created_at, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, name, lead, date, randomHex(16), await sha256Hex(randomHex(32)), auto, limit, Date.now(), user.id).run();
    return go(`/galerias/${id}?ok=${encodeURIComponent('Galería creada. Comparte el enlace con tus invitados.')}`);
  });

  async function ownEvent(c, user) {
    const id = c.req.param('id');
    if (!/^[0-9a-f]{16}$/.test(id)) return null;
    return c.env.DB.prepare('SELECT * FROM events WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
  }

  app.get('/galerias/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const event = await ownEvent(c, user);
    if (!event) return html(notFoundPage('No encontramos esa galería.'), 404);
    const photos = (await c.env.DB.prepare(
      `SELECT id, state FROM photos WHERE event_id = ? AND state IN ('approved','pending')
       ORDER BY ${event.sort_mode === 'manual' ? 'sort_order ASC, id ASC' : event.sort_mode === 'time_desc' ? 'COALESCE(taken_at, uploaded_at) DESC, id DESC' : 'COALESCE(taken_at, uploaded_at) ASC, id ASC'}
       LIMIT 300`,
    ).bind(event.id).all()).results;
    const counts = await c.env.DB.prepare(
      `SELECT SUM(state = 'approved') AS approved, SUM(state = 'pending') AS pending FROM photos WHERE event_id = ?`,
    ).bind(event.id).first();
    return html(galleryPage({
      user, event, photos, origin: new URL(c.req.url).origin,
      counts: { approved: counts?.approved || 0, pending: counts?.pending || 0 },
      note: c.req.query('ok') || '',
    }));
  });

  app.post('/galerias/:id/borrar', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const event = await ownEvent(c, user);
    if (!event) return go('/galerias');
    const rows = await c.env.DB.prepare('SELECT id FROM photos WHERE event_id = ?').bind(event.id).all();
    const keys = rows.results.flatMap((r) => ['o', 'm', 'l'].map((s) => `p/${r.id}/${s}`));
    for (let i = 0; i < keys.length; i += 500) await c.env.PHOTOS.delete(keys.slice(i, i + 500));
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM photos WHERE event_id = ?').bind(event.id),
      c.env.DB.prepare('DELETE FROM guests WHERE event_id = ?').bind(event.id),
      c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(event.id),
    ]);
    return go('/galerias');
  });
}
