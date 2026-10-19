// Rutas de la plataforma: cuentas y galerías de cada usuario.

import { randomHex, sha256Hex, html, json } from './util.js';
import { hashPassword, checkPassword, validEmail, startSession, endSession, currentUser } from './auth.js';
import { authPage, galleriesPage, galleryPage, accountPage, trashPage } from './appviews.js';
import { notFoundPage } from './views.js';
import { attachSlugs, orderSql, privacyReady, deleteFamily, trashReady, purgeTrashedPhotos, cleanup, GALLERY_TRASH_DAYS } from './photos.js';
import { galleryRoutes, validAccent } from './gallery.js';
import { wmRoutes, getWm, wmAttr } from './watermark.js';
import { getBest } from './best.js';
import { collectionRoutes } from './collections.js';
import { agendaRoutes } from './agenda.js';
import { habitsRoutes } from './habits.js';
import { splitParts } from './zip.js';
import { socialReady, loadStats, viewsReady } from './social.js';
import { loadSelections, selSeenReady, NEW_SEL_SQL } from './selection.js';

const go = (to, headers = {}) => new Response(null, { status: 303, headers: { location: to, ...headers } });

async function userCount(db) {
  const r = await db.prepare('SELECT COUNT(*) AS n FROM users').first();
  return r ? r.n : 0;
}

export function appRoutes(app) {
  galleryRoutes(app);
  wmRoutes(app);
  collectionRoutes(app);
  agendaRoutes(app);
  habitsRoutes(app);

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

  /* ----- Mi cuenta ----- */
  async function userDefaults(db, id) {
    try {
      const r = await db.prepare('SELECT defaults FROM users WHERE id = ?').bind(id).first();
      return r && r.defaults ? JSON.parse(r.defaults) : {};
    } catch { return {}; }
  }
  async function fullUser(db, id) {
    try { return await db.prepare('SELECT id, email, name, surname, username, avatar_v, created_at, pass_salt, pass_hash FROM users WHERE id = ?').bind(id).first(); }
    catch { return db.prepare("SELECT id, email, name, '' AS surname, '' AS username, 0 AS avatar_v, created_at, pass_salt, pass_hash FROM users WHERE id = ?").bind(id).first(); }
  }
  const SECTIONS = ['datos', 'password', 'galerias'];
  async function accountView(c, user, section, ok = '', error = '') {
    const u = await fullUser(c.env.DB, user.id);
    const g = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM events WHERE owner_id = ? AND parent_id IS NULL${(await trashReady(c.env.DB)) ? ' AND deleted_at IS NULL' : ''}`).bind(user.id).first();
    const ph = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM photos WHERE state = 'approved' AND event_id IN (SELECT id FROM events WHERE owner_id = ?)").bind(user.id).first();
    return html(accountPage({ user: u, section, ok, error, defaults: await userDefaults(c.env.DB, user.id), stats: { galleries: g.n, photos: ph.n } }));
  }
  const toAcc = (section, kind, text) => go(`/cuenta/${section}?${kind}=${encodeURIComponent(text)}`);

  // Foto de perfil: solo la ve su dueño (se pinta en las páginas de administración).
  app.get('/cuenta/foto', async (c) => {
    const user = await currentUser(c);
    if (!user) return c.notFound();
    const obj = await c.env.PHOTOS.get(`u/${user.id}/avatar`);
    if (!obj) return c.notFound();
    return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'private, max-age=31536000, immutable' } });
  });
  app.put('/cuenta/foto', async (c) => {
    const user = await currentUser(c);
    if (!user) return json({ error: 'auth' }, 403);
    const type = (c.req.header('content-type') || '').split(';')[0];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return json({ error: 'type' }, 415);
    const len = Number(c.req.header('content-length') || 0);
    if (!(len > 0 && len <= 1024 * 1024)) return json({ error: 'size' }, 413);
    const v = Date.now();
    try { await c.env.DB.prepare('UPDATE users SET avatar_v = ? WHERE id = ?').bind(v, user.id).run(); }
    catch { return json({ error: 'migracion' }, 409); }
    await c.env.PHOTOS.put(`u/${user.id}/avatar`, c.req.raw.body, { httpMetadata: { contentType: type } });
    return json({ ok: true, v });
  });
  app.delete('/cuenta/foto', async (c) => {
    const user = await currentUser(c);
    if (!user) return json({ error: 'auth' }, 403);
    await c.env.PHOTOS.delete(`u/${user.id}/avatar`);
    try { await c.env.DB.prepare('UPDATE users SET avatar_v = 0 WHERE id = ?').bind(user.id).run(); } catch {}
    return json({ ok: true });
  });

  app.get('/cuenta', (c) => go('/cuenta/datos'));
  app.get('/cuenta/:s', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const s = c.req.param('s');
    if (!SECTIONS.includes(s)) return go('/cuenta/datos');
    return accountView(c, user, s, c.req.query('ok') || '', c.req.query('err') || '');
  });

  app.post('/cuenta/datos', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 80);
    const surname = String(f.get('surname') || '').trim().slice(0, 120);
    if (!name) return toAcc('datos', 'err', 'Escribe tu nombre.');
    const username = String(f.get('username') || '').trim().toLowerCase();
    if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) return toAcc('datos', 'err', 'El nombre de usuario necesita de 3 a 30 letras, números, punto, guion o guion bajo.');
    try {
      if (username && await c.env.DB.prepare('SELECT 1 FROM users WHERE username = ? AND id <> ?').bind(username, user.id).first()) return toAcc('datos', 'err', 'Ese nombre de usuario ya está cogido.');
      await c.env.DB.prepare('UPDATE users SET name = ?, surname = ?, username = ? WHERE id = ?').bind(name, surname, username, user.id).run();
    } catch {
      try { await c.env.DB.prepare('UPDATE users SET name = ?, surname = ? WHERE id = ?').bind(name, surname, user.id).run(); }
      catch { await c.env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(name, user.id).run(); }
      if (username) return toAcc('datos', 'err', 'Falta aplicar la migración 0012 para guardar el nombre de usuario.');
    }
    return toAcc('datos', 'ok', 'Datos guardados.');
  });

  app.post('/cuenta/correo', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const f = await c.req.formData();
    const email = String(f.get('email') || '').trim().toLowerCase();
    const u = await fullUser(c.env.DB, user.id);
    if (!validEmail(email)) return toAcc('datos', 'err', 'Ese correo no parece válido.');
    if (!(await checkPassword(u, String(f.get('current') || '')))) return toAcc('datos', 'err', 'La contraseña no es correcta.');
    if (email !== u.email && await c.env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) return toAcc('datos', 'err', 'Ya existe una cuenta con ese correo.');
    await c.env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(email, user.id).run();
    return toAcc('datos', 'ok', 'Correo actualizado.');
  });

  app.post('/cuenta/password', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const f = await c.req.formData();
    const u = await fullUser(c.env.DB, user.id);
    const pw = String(f.get('password') || '');
    if (!(await checkPassword(u, String(f.get('current') || '')))) return toAcc('password', 'err', 'La contraseña actual no es correcta.');
    if (pw.length < 8) return toAcc('password', 'err', 'La nueva contraseña necesita al menos 8 caracteres.');
    if (pw !== String(f.get('password2') || '')) return toAcc('password', 'err', 'Las dos contraseñas nuevas no coinciden.');
    const salt = randomHex(16);
    await c.env.DB.prepare('UPDATE users SET pass_salt = ?, pass_hash = ? WHERE id = ?').bind(salt, await hashPassword(pw, salt), user.id).run();
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
    return go('/cuenta/password?ok=' + encodeURIComponent('Contraseña cambiada.'), { 'set-cookie': await startSession(c.env.DB, user.id) });
  });

  app.post('/cuenta/galerias', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const f = await c.req.formData();
    const d = {
      accent: validAccent(f.get('accent')) || '#edb265',
      auto_approve: f.get('auto_approve') ? 1 : 0,
      allow_download: f.get('allow_download') ? 1 : 0,
      show_subs: f.get('show_subs') ? 1 : 0,
      photo_limit: Math.max(0, Math.min(2000, parseInt(String(f.get('photo_limit') || '0'), 10) || 0)),
    };
    try { await c.env.DB.prepare('UPDATE users SET defaults = ? WHERE id = ?').bind(JSON.stringify(d), user.id).run(); }
    catch { return toAcc('galerias', 'err', 'Falta aplicar la migración 0010 en la base de datos.'); }
    return toAcc('galerias', 'ok', 'Valores guardados. Se usarán en las galerías nuevas.');
  });

  /* ----- Duplicar galería ----- */
  // Copia los ajustes, la personalización y las subgalerías (sin fotos ni invitados).
  app.post('/galerias/:id/duplicar', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const event = await ownEvent(c, user);
    if (!event || event.parent_id) return go('/galerias');
    const db = c.env.DB;
    const f = await c.req.formData().catch(() => null);
    const typed = f ? String(f.get('name') || '').trim().slice(0, 120) : '';
    const name = typed && typed !== event.name ? typed : `${event.name} (copia)`.slice(0, 120);
    const SKIP = new Set(['id', 'guest_token', 'manage_hash', 'created_at', 'owner_id', 'expires_at', 'deleted_at', 'parent_id', 'name', 'slug']);
    async function clone(src, parentId, newName) {
      const nid = randomHex(8);
      const vals = { id: nid, name: newName, guest_token: randomHex(16), manage_hash: await sha256Hex(randomHex(32)), created_at: Date.now(), owner_id: user.id, parent_id: parentId };
      for (const k of Object.keys(src)) if (!SKIP.has(k) && !(k in vals)) vals[k] = src[k];
      const cols = Object.keys(vals);
      await db.prepare(`INSERT INTO events (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map((k) => vals[k])).run();
      for (const kind of ['cover', 'avatar', 'thumb']) {
        if (!src[kind + '_v']) continue;
        const o = await c.env.PHOTOS.get(`c/${src.id}/${kind}`);
        if (o) await c.env.PHOTOS.put(`c/${nid}/${kind}`, o.body, { httpMetadata: o.httpMetadata });
      }
      return nid;
    }
    const nid = await clone(event, null, name);
    const subs = (await db.prepare('SELECT * FROM events WHERE parent_id = ? ORDER BY created_at').bind(event.id).all()).results;
    for (const s of subs) await clone(s, nid, s.name);
    return go(`/galerias/${nid}?ok=${encodeURIComponent(`Galería duplicada con sus ajustes${subs.length ? ' y subgalerías' : ''}. Las fotos no se copian.`)}`);
  });

  /* ----- Papelera ----- */
  const ids16 = (a) => a.map(String).filter((x) => /^[0-9a-f]{16}$/.test(x));
  const ids32 = (a) => a.map(String).filter((x) => /^[0-9a-f]{32}$/.test(x));
  app.get('/papelera', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    await cleanup(c.env, user.id);
    let galleries = [], photos = [];
    if (await trashReady(c.env.DB)) {
      galleries = (await c.env.DB.prepare(
        `SELECT e.id, e.name, e.deleted_at, (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state IN ('approved','pending','rejected')) AS n
         FROM events e WHERE e.owner_id = ? AND e.parent_id IS NULL AND e.deleted_at IS NOT NULL ORDER BY e.deleted_at DESC`).bind(user.id).all()).results;
      photos = (await c.env.DB.prepare(
        `SELECT p.id, p.filename, p.deleted_at, e.name AS ename FROM photos p JOIN events e ON e.id = p.event_id
         WHERE e.owner_id = ? AND e.deleted_at IS NULL AND p.state = 'trashed' ORDER BY p.deleted_at DESC LIMIT 500`).bind(user.id).all()).results;
    }
    return html(trashPage({ user, galleries, photos, ready: await trashReady(c.env.DB), ok: c.req.query('ok') || '' }));
  });

  async function trashAct(c, mode) {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    if (!(await trashReady(c.env.DB))) return go('/papelera');
    const f = await c.req.formData();
    const db = c.env.DB;
    let gids, pids;
    if (mode === 'vaciar') {
      gids = (await db.prepare('SELECT id FROM events WHERE owner_id = ? AND parent_id IS NULL AND deleted_at IS NOT NULL').bind(user.id).all()).results.map((r) => r.id);
      pids = (await db.prepare("SELECT p.id FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ? AND p.state = 'trashed'").bind(user.id).all()).results.map((r) => r.id);
    } else {
      gids = ids16(f.getAll('gal'));
      pids = ids32(f.getAll('foto'));
      if (gids.length) gids = (await db.prepare(`SELECT id FROM events WHERE owner_id = ? AND parent_id IS NULL AND deleted_at IS NOT NULL AND id IN (${gids.map((i) => `'${i}'`).join(',')})`).bind(user.id).all()).results.map((r) => r.id);
      if (pids.length) pids = (await db.prepare(`SELECT p.id FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ? AND p.state = 'trashed' AND p.id IN (${pids.map((i) => `'${i}'`).join(',')})`).bind(user.id).all()).results.map((r) => r.id);
    }
    let msg;
    if (mode === 'restaurar') {
      for (const g of gids) await db.prepare('UPDATE events SET deleted_at = NULL WHERE id = ? OR parent_id = ?').bind(g, g).run();
      if (pids.length) await db.prepare(`UPDATE photos SET state = COALESCE(prev_state, 'approved'), prev_state = NULL, deleted_at = NULL WHERE state = 'trashed' AND id IN (${pids.map((i) => `'${i}'`).join(',')})`).run();
      msg = gids.length + pids.length ? 'Recuperado.' : 'No has marcado nada.';
    } else {
      for (const g of gids) await deleteFamily(c.env, g);
      await purgeTrashedPhotos(c.env, pids);
      msg = gids.length + pids.length ? 'Borrado para siempre.' : 'No había nada que borrar.';
    }
    return go('/papelera?ok=' + encodeURIComponent(msg));
  }
  app.post('/papelera/restaurar', (c) => trashAct(c, 'restaurar'));
  app.post('/papelera/borrar', (c) => trashAct(c, 'borrar'));
  app.post('/papelera/vaciar', (c) => trashAct(c, 'vaciar'));

  /* ----- Galerías ----- */
  app.get('/galerias', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    c.executionCtx.waitUntil(cleanup(c.env, user.id).catch(() => {}));
    const rows = await c.env.DB.prepare(
      `SELECT e.id, e.name, e.event_date,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'approved') AS approved,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'pending') AS pending,
         (SELECT p.id FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id) AND p.state = 'approved'
            ORDER BY COALESCE(p.taken_at, p.uploaded_at) ASC LIMIT 1) AS cover
         , (SELECT COUNT(*) FROM events s WHERE s.parent_id = e.id) AS subs
         , (SELECT COALESCE(SUM(p.size), 0) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id)) AS bytes
         , (SELECT COUNT(*) FROM photos p WHERE p.event_id IN (SELECT id FROM events x WHERE x.id = e.id OR x.parent_id = e.id)) AS nph
         , ${(await selSeenReady(c.env.DB)) ? NEW_SEL_SQL : '0'} AS new_sel
       FROM events e WHERE e.owner_id = ? AND e.parent_id IS NULL ${(await trashReady(c.env.DB)) ? 'AND e.deleted_at IS NULL' : ''} ORDER BY e.created_at DESC`,
    ).bind(user.id).all();
    const tot = await c.env.DB.prepare('SELECT COALESCE(SUM(p.size), 0) AS bytes, COUNT(*) AS n FROM photos p JOIN events e ON e.id = p.event_id WHERE e.owner_id = ?').bind(user.id).first();
    return html(galleriesPage({ user, events: rows.results, storage: tot, origin: new URL(c.req.url).origin, defaults: await userDefaults(c.env.DB, user.id), ok: c.req.query('ok') || '' }));
  });

  // El organizador abre sus selecciones: se marcan como vistas.
  app.post('/galerias/:id/selecciones/vistas', async (c) => {
    const user = await currentUser(c);
    if (!user) return json({ error: 'auth' }, 403);
    const event = await ownEvent(c, user);
    if (!event) return json({ error: 'nf' }, 404);
    try { await c.env.DB.prepare('UPDATE events SET sel_seen_at = ?1 WHERE id = ?2 OR parent_id = ?2').bind(Date.now(), event.id).run(); } catch { /* falta la migración 0018 */ }
    return json({ ok: true });
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
    const dflt = await userDefaults(c.env.DB, user.id);
    const id = randomHex(8);
    // El enlace de organizador por token sigue existiendo (compatibilidad); aquí nadie lo necesita.
    await c.env.DB.prepare(
      `INSERT INTO events (id, name, lead, event_date, guest_token, manage_hash, auto_approve, photo_limit, created_at, owner_id, accent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, name, lead, date, randomHex(16), await sha256Hex(randomHex(32)), auto, limit, Date.now(), user.id, validAccent(f.get('accent'))).run();
    for (const col of ['allow_download', 'show_subs']) {
      if (dflt[col]) { try { await c.env.DB.prepare(`UPDATE events SET ${col} = 1 WHERE id = ?`).bind(id).run(); } catch {} }
    }
    if ((c.req.header('accept') || '').includes('application/json')) return json({ id, url: `/galerias/${id}?ok=${encodeURIComponent('Galería creada. Comparte el enlace con tus invitados.')}` });
    return go(`/galerias/${id}?ok=${encodeURIComponent('Galería creada. Comparte el enlace con tus invitados.')}`);
  });

  async function ownEvent(c, user) {
    const id = c.req.param('id');
    if (!/^[0-9a-f]{16}$/.test(id)) return null;
    const e = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
    return e && e.deleted_at ? null : e;
  }

  app.get('/galerias/:id', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const event = await ownEvent(c, user);
    if (!event) return html(notFoundPage('No encontramos esa galería.'), 404);
    const db = c.env.DB;
    const [ph, gs] = await Promise.all([
      db.prepare(
        `SELECT id, guest_id, event_id, (SELECT name FROM events x WHERE x.id = photos.event_id) AS ename, filename, state, flag, fav, size, COALESCE(taken_at, uploaded_at) AS ts FROM photos
         WHERE event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND state IN ('approved','pending','rejected')
         ORDER BY ${orderSql(event.sort_mode)} LIMIT 3000`,
      ).bind(event.id).all(),
      db.prepare(
        `SELECT g.id, g.name, (SELECT COUNT(*) FROM photos p WHERE p.guest_id = g.id AND p.state IN ('approved','pending','rejected')) AS n
         FROM guests g WHERE g.event_id = ? ORDER BY g.created_at ASC`,
      ).bind(event.id).all(),
    ]);
    const photos = ph.results;
    if (photos.length && await socialReady(db)) {
      try {
        const inl = photos.map((p) => `'${p.id}'`).join(',');
        const [lk, cm] = await Promise.all([
          db.prepare(`SELECT photo_id, COUNT(*) n FROM photo_likes WHERE photo_id IN (${inl}) GROUP BY photo_id`).all(),
          db.prepare(`SELECT photo_id, COUNT(*) n FROM photo_comments WHERE photo_id IN (${inl}) GROUP BY photo_id`).all(),
        ]);
        const L = new Map(lk.results.map((r) => [r.photo_id, r.n])), C = new Map(cm.results.map((r) => [r.photo_id, r.n]));
        photos.forEach((p) => { p.likes = L.get(p.id) || 0; p.coms = C.get(p.id) || 0; });
      } catch { /* sin datos sociales */ }
    }
    if (photos.length && await viewsReady(db)) {
      try {
        const inl = photos.map((p) => `'${p.id}'`).join(',');
        const vw = (await db.prepare(`SELECT photo_id, n FROM photo_views WHERE photo_id IN (${inl})`).all()).results;
        const V = new Map(vw.map((r) => [r.photo_id, r.n]));
        photos.forEach((p) => { p.views = V.get(p.id) || 0; });
      } catch { /* sin datos de visitas */ }
    }
    const priv = await privacyReady(db);
    const subs = (await db.prepare(
      `SELECT e.id, e.name, e.guest_token, e.thumb_v, ${(await selSeenReady(db)) ? NEW_SEL_SQL : '0'} AS new_sel, ${priv ? 'e.is_private, (e.access_hash IS NOT NULL) AS has_pw,' : '0 AS is_private, 0 AS has_pw,'}
         (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id AND p.state = 'approved') AS approved,
         (SELECT COALESCE(SUM(p.size), 0) FROM photos p WHERE p.event_id = e.id) AS bytes,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id) AS nph,
         (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id AND p.state = 'pending') AS pending,
         (SELECT p.id FROM photos p WHERE p.event_id = e.id AND p.state = 'approved' ORDER BY COALESCE(p.taken_at, p.uploaded_at) ASC LIMIT 1) AS cover
       FROM events e WHERE e.parent_id = ? ORDER BY e.created_at ASC`,
    ).bind(event.id).all()).results;
    await attachSlugs(db, [event, ...subs]);
    const parent = event.parent_id
      ? await db.prepare('SELECT id, name FROM events WHERE id = ? AND owner_id = ?').bind(event.parent_id, user.id).first()
      : null;
    const rootId = parent ? parent.id : event.id;
    const folders = (await db.prepare(
      'SELECT id, name, parent_id FROM events WHERE (id = ?1 OR parent_id = ?1) AND owner_id = ?2 ORDER BY (parent_id IS NOT NULL), created_at ASC',
    ).bind(rootId, user.id).all()).results;
    const approved = photos.filter((p) => p.state === 'approved');
    const partSize = Number(c.env.ZIP_PART_SIZE) || 40;
    const zipParts = splitParts(approved, partSize).map((p) => ({ count: p.length }));
    let sels = { ready: false, sends: [] };
    try { sels = await loadSelections(db, event); } catch { /* sin selecciones */ }
    let stats = null;
    try { stats = await loadStats(db, event); } catch { /* sin estadísticas */ }
    const wm = await getWm(db, event);
    const best = await getBest(db, event);
    return html(galleryPage({
      wm, best, sels, stats, user, event, photos, subs, parent, folders, guests: gs.results, origin: new URL(c.req.url).origin, partSize, zipParts,
      counts: { approved: approved.length, pending: photos.filter((p) => p.state === 'pending').length },
      note: c.req.query('ok') || '',
    }));
  });

  app.post('/galerias/:id/sub', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const parent = await ownEvent(c, user);
    if (!parent) return go('/galerias');
    if (parent.parent_id) return go(`/galerias/${parent.id}`); // solo un nivel
    const fd = await c.req.formData();
    const name = String(fd.get('name') || '').trim().slice(0, 120);
    const lead = String(fd.get('lead') || '').trim().slice(0, 400);
    if (!name) return go(`/galerias/${parent.id}`);
    const id = randomHex(8);
    await c.env.DB.prepare(
      `INSERT INTO events (id, name, lead, event_date, guest_token, manage_hash, auto_approve, photo_limit, created_at, owner_id, parent_id, accent, cover_v, avatar_v)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, name, lead, parent.event_date, randomHex(16), await sha256Hex(randomHex(32)), parent.auto_approve, parent.photo_limit, Date.now(), user.id, parent.id, parent.accent, parent.cover_v, parent.avatar_v).run();
    try { await c.env.DB.prepare('UPDATE events SET allow_download = ? WHERE id = ?').bind(parent.allow_download ? 1 : 0, id).run(); } catch { /* sin migración 0008 */ }
    // la subgalería hereda el aspecto de la principal (copia de las imágenes)
    for (const kind of ['cover', 'avatar']) {
      const obj = await c.env.PHOTOS.get(`c/${parent.id}/${kind}`);
      if (obj) await c.env.PHOTOS.put(`c/${id}/${kind}`, obj.body, { httpMetadata: obj.httpMetadata });
    }
    return go(`/galerias/${id}?ok=${encodeURIComponent('Subgalería creada. Comparte su enlace con la gente de esta sede.')}`);
  });

  app.post('/galerias/:id/borrar', async (c) => {
    const user = await currentUser(c);
    if (!user) return go('/entrar');
    const event = await ownEvent(c, user);
    if (!event) return go('/galerias');
    const db = c.env.DB;
    if (event.parent_id) {
      // una subgalería es solo una carpeta: sus fotos pasan a la galería principal
      const pid = event.parent_id;
      const dup = (await db.prepare('SELECT s.id AS sid, p.id AS pid FROM guests s JOIN guests p ON p.event_id = ?1 AND p.key_hash = s.key_hash WHERE s.event_id = ?2').bind(pid, event.id).all()).results;
      for (const d of dup) {
        await db.batch([
          db.prepare('UPDATE photos SET guest_id = ? WHERE guest_id = ?').bind(d.pid, d.sid),
          db.prepare('DELETE FROM guests WHERE id = ?').bind(d.sid),
        ]);
      }
      await db.batch([
        db.prepare('UPDATE guests SET event_id = ? WHERE event_id = ?').bind(pid, event.id),
        db.prepare('UPDATE photos SET event_id = ? WHERE event_id = ?').bind(pid, event.id),
      ]);
      await c.env.PHOTOS.delete([`c/${event.id}/cover`, `c/${event.id}/avatar`, `c/${event.id}/thumb`]);
      await db.prepare('DELETE FROM events WHERE id = ?').bind(event.id).run();
      return go(`/galerias/${pid}`);
    }
    if (await trashReady(db)) {
      // galería principal: va a la papelera 30 días con sus subgalerías
      await db.prepare('UPDATE events SET deleted_at = ? WHERE id = ? OR parent_id = ?').bind(Date.now(), event.id, event.id).run();
      return go('/galerias?ok=' + encodeURIComponent(`«${event.name}» está en la papelera. Puedes recuperarla durante ${GALLERY_TRASH_DAYS} días.`));
    }
    await deleteFamily(c.env, event.id);
    return go(event.parent_id ? `/galerias/${event.parent_id}` : '/galerias');
  });
}
