import { Hono } from 'hono';
import {
  randomHex, sha256Hex, timingSafeEqual, isHex, json, html,
  makeSession, checkSession, getCookie,
} from './util.js';
import {
  getEventByGuestToken, getEventById, listApproved, countApproved,
  applyOrder, nextSortOrder, deletePhotos, orderSql,
} from './photos.js';
import {
  PER_PAGE, landingPage, notFoundPage, adminLoginPage, adminDashboard, adminCreated,
  guestPage,
} from './views.js';
import { manageRoutes } from './manage.js';
import { appRoutes } from './app.js';
import { currentUser } from './auth.js';
import { buildZip, splitParts } from './zip.js';

const app = new Hono();

const MAX_ORIGINAL = 60 * 1024 * 1024; // 60 MB
const MAX_THUMB = 4 * 1024 * 1024;
const HARD_GUEST_CAP = 1500;
const MIME_OK = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

// Cabeceras de seguridad: los enlaces llevan el token en la URL, así que no se envía Referer.
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Referrer-Policy', 'no-referrer');
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Robots-Tag', 'noindex, nofollow');
});

app.get('/', async (c) => (await currentUser(c)) ? c.redirect('/galerias', 303) : html(landingPage()));
// Diagnóstico sin datos sensibles: solo dice si cada pieza está conectada.
app.get('/health', async (c) => {
  const out = { admin_password_set: Boolean(c.env.ADMIN_PASSWORD), database: false, photos_bucket: false };
  try { await c.env.DB.prepare('SELECT 1').first(); out.database = true; } catch { /* sin base de datos */ }
  try { await c.env.PHOTOS.head('p/health-check'); out.photos_bucket = true; } catch { /* sin bucket */ }
  // Qué actualizaciones de la base de datos están aplicadas (true = hecha)
  const has = async (sql) => { try { await c.env.DB.prepare(sql).first(); return true; } catch { return false; } };
  out.schema = {
    cuentas: await has('SELECT id FROM users LIMIT 1'),
    banderas: await has('SELECT flag, fav FROM photos LIMIT 1'),
    subgalerias: await has('SELECT parent_id FROM events LIMIT 1'),
    personalizacion: await has('SELECT accent, cover_v, avatar_v FROM events LIMIT 1'),
    mostrar_subgalerias: await has('SELECT show_subs FROM events LIMIT 1'),
    portada_sedes: await has('SELECT thumb_v FROM events LIMIT 1'),
    descargas: await has('SELECT allow_download FROM events LIMIT 1'),
  };
  return json(out);
});
app.get('/robots.txt', (c) => new Response('User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain' } }));

/* ---------- Fotos (lectura) ---------- */

app.get('/m/:id/:size', async (c) => {
  const { id, size } = c.req.param();
  if (!isHex(id, 32) || !['o', 'm', 'l'].includes(size)) return c.notFound();
  const obj = await c.env.PHOTOS.get(`p/${id}/${size}`);
  if (!obj) return c.notFound();
  const etag = obj.httpEtag;
  if (c.req.header('if-none-match') === etag) return new Response(null, { status: 304, headers: { etag } });
  const headers = new Headers({
    'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
    'content-length': String(obj.size),
    'cache-control': 'public, max-age=31536000, immutable',
    etag,
  });
  if (size === 'o' && c.req.query('dl')) {
    const row = await c.env.DB.prepare('SELECT filename FROM photos WHERE id = ?').bind(id).first();
    const name = (row?.filename || `${id}.jpg`).replace(/[^\w.\- ]+/g, '_');
    headers.set('content-disposition', `attachment; filename="${name}"`);
  }
  return new Response(obj.body, { headers });
});

/* ---------- Descargas de invitados (solo si el organizador las permite) ---------- */

app.get('/e/:token/dl/:id', async (c) => {
  const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
  const id = c.req.param('id');
  if (!event || !event.allow_download || !event.gallery_open || !isHex(id, 32)) return c.notFound();
  const row = await c.env.DB.prepare("SELECT filename FROM photos WHERE id = ?1 AND event_id IN (SELECT id FROM events WHERE id = ?2 OR parent_id = ?2) AND state = 'approved'").bind(id, event.id).first();
  if (!row) return c.notFound();
  const obj = await c.env.PHOTOS.get(`p/${id}/o`);
  if (!obj) return c.notFound();
  const name = (row.filename || `${id}.jpg`).replace(/[^\w.\- ]+/g, '_');
  return new Response(obj.body, { headers: {
    'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'content-length': String(obj.size),
    'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'private, max-age=3600',
  } });
});

app.get('/e/:token/zip', async (c) => {
  const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
  if (!event || !event.allow_download || !event.gallery_open) return html(notFoundPage('Las descargas no están disponibles.'), 404);
  const partSize = Number(c.env.ZIP_PART_SIZE) || 40;
  const part = Math.max(1, parseInt(c.req.query('part') || '1', 10) || 1);
  const pick = [...new Set(String(c.req.query('ids') || '').split(',').filter((x) => isHex(x, 32)))].slice(0, partSize);
  const rows = (await c.env.DB.prepare(
    `SELECT p.id, p.filename, p.size, p.crc32, p.taken_at, p.uploaded_at FROM photos p
     WHERE p.event_id IN (SELECT id FROM events WHERE id = ?1 OR parent_id = ?1) AND p.state = 'approved' ${pick.length ? `AND p.id IN (${pick.map((x) => `'${x}'`).join(',')})` : ''}
     ORDER BY ${orderSql(event.sort_mode, 'p')}`,
  ).bind(event.id).all()).results;
  const parts = pick.length ? [rows] : splitParts(rows, partSize);
  const list = parts[part - 1];
  if (!list || !list.length) return html(notFoundPage('No hay fotos para descargar.'), 404);
  const offset = pick.length ? 0 : parts.slice(0, part - 1).reduce((n, p) => n + p.length, 0);
  const used = new Set();
  const safe = (s) => String(s || '').replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').trim().slice(0, 80);
  const entries = list.map((r, k) => {
    let name = `${String(offset + k + 1).padStart(4, '0')}_${safe(r.filename) || r.id + '.jpg'}`;
    while (used.has(name)) name = name.replace(/(\.[^.]*)?$/, `_${r.id.slice(0, 4)}$1`);
    used.add(name);
    return { key: `p/${r.id}/o`, name, size: r.size, crc: r.crc32, ms: r.taken_at ?? r.uploaded_at };
  });
  const { stream, length } = buildZip(c.env.PHOTOS, entries);
  const label = safe(event.name).replace(/\s+/g, '-') || 'galeria';
  const fname = pick.length ? `${label}-seleccion.zip` : parts.length > 1 ? `${label}-parte${part}.zip` : `${label}.zip`;
  return new Response(stream, { headers: { 'content-type': 'application/zip', 'content-length': String(length), 'content-disposition': `attachment; filename="${fname}"`, 'cache-control': 'no-store' } });
});

/* ---------- Invitados ---------- */

app.get('/e/:token', async (c) => {
  const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
  if (!event) return html(notFoundPage('Este enlace no existe o ya no está activo.'), 404);
  const total = await countApproved(c.env.DB, event.id);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pages, Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1));
  const photos = event.gallery_open ? await listApproved(c.env.DB, event, PER_PAGE, (page - 1) * PER_PAGE) : [];
  let subs = [];
  if (event.show_subs && !event.parent_id) {
    subs = (await c.env.DB.prepare(
      `SELECT s.name, s.guest_token, s.thumb_v, s.event_date, s.upload_open,
              (SELECT p.id FROM photos p WHERE p.event_id = s.id AND p.state = 'approved' ORDER BY p.sort_order LIMIT 1) AS first_id,
              (SELECT COUNT(*) FROM photos p WHERE p.event_id = s.id AND p.state = 'approved') AS n
       FROM events s WHERE s.parent_id = ? AND s.gallery_open = 1 ORDER BY s.name COLLATE NOCASE`,
    ).bind(event.id).all()).results;
  }
  let parent = null;
  if (event.parent_id) parent = await c.env.DB.prepare('SELECT name, guest_token FROM events WHERE id = ?').bind(event.parent_id).first();
  const partSize = Number(c.env.ZIP_PART_SIZE) || 40;
  return html(guestPage({ event, photos, total, page, pages, subs, parent, dl: event.allow_download ? { parts: Math.max(1, Math.ceil(total / partSize)), partSize, total } : null }));
});

async function guestFor(db, event, key) {
  if (!isHex(key, 32)) return null;
  return db.prepare('SELECT * FROM guests WHERE event_id = ? AND key_hash = ?').bind(event.id, await sha256Hex(key)).first();
}

/* ---------- Subida ---------- */

app.post('/api/e/:token/upload/init', async (c) => {
  const event = await getEventByGuestToken(c.env.DB, c.req.param('token'));
  if (!event) return json({ error: 'event' }, 404);
  if (!event.upload_open) {
    const who = await currentUser(c);
    if (!(who && event.owner_id && who.id === event.owner_id)) return json({ error: 'closed' }, 403);
  }
  let b;
  try { b = await c.req.json(); } catch { return json({ error: 'json' }, 400); }
  if (!isHex(b.key, 32)) return json({ error: 'key' }, 400);
  const type = String(b.type || '').toLowerCase();
  const size = Number(b.size);
  if (!MIME_OK.has(type)) return json({ error: 'type' }, 415);
  if (!(size > 0 && size <= MAX_ORIGINAL)) return json({ error: 'size' }, 413);

  const keyHash = await sha256Hex(b.key);
  const name = String(b.name || '').trim().slice(0, 60);
  await c.env.DB.prepare('INSERT OR IGNORE INTO guests (id, event_id, key_hash, name, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(randomHex(8), event.id, keyHash, name, Date.now()).run();
  const guest = await c.env.DB.prepare('SELECT * FROM guests WHERE event_id = ? AND key_hash = ?').bind(event.id, keyHash).first();
  if (name && name !== guest.name) await c.env.DB.prepare('UPDATE guests SET name = ? WHERE id = ?').bind(name, guest.id).run();

  const cnt = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM photos WHERE guest_id = ? AND (state IN ('approved','pending') OR (state = 'uploading' AND uploaded_at > ?))`,
  ).bind(guest.id, Date.now() - 3600 * 1000).first();
  const me = await currentUser(c);
  const isOwner = Boolean(me && event.owner_id && me.id === event.owner_id);
  const limit = isOwner ? 100000 : event.photo_limit > 0 ? event.photo_limit : HARD_GUEST_CAP;
  if (cnt.n >= limit) return json({ error: 'limit', limit }, 403);

  const id = randomHex(16);
  const taken = Number.isFinite(Number(b.taken)) && Number(b.taken) > 0 ? Math.round(Number(b.taken)) : null;
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.round(Number(v)) : null);
  const crc = Number.isFinite(Number(b.crc)) ? Number(b.crc) >>> 0 : null;
  await c.env.DB.prepare(
    `INSERT INTO photos (id, event_id, guest_id, filename, mime, size, crc32, w, h, taken_at, uploaded_at, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'uploading')`,
  ).bind(id, event.id, guest.id, String(b.filename || '').slice(0, 120), type, size, crc, num(b.w), num(b.h), taken, Date.now()).run();
  return json({ id });
});

app.put('/api/e/:token/upload/:id/:size', async (c) => {
  const { token, id, size } = c.req.param();
  if (!['o', 'm', 'l'].includes(size) || !isHex(id, 32)) return json({ error: 'bad' }, 400);
  const event = await getEventByGuestToken(c.env.DB, token);
  if (!event) return json({ error: 'event' }, 404);
  const key = c.req.header('x-picfy-key') || '';
  const guest = await guestFor(c.env.DB, event, key);
  if (!guest) return json({ error: 'key' }, 403);
  const photo = await c.env.DB.prepare('SELECT * FROM photos WHERE id = ? AND event_id = ? AND guest_id = ?').bind(id, event.id, guest.id).first();
  if (!photo || photo.state !== 'uploading') return json({ error: 'state' }, 409);
  const len = Number(c.req.header('content-length') || 0);
  const max = size === 'o' ? MAX_ORIGINAL : MAX_THUMB;
  if (!(len > 0 && len <= max)) return json({ error: 'size' }, 413);
  if (size === 'o' && len !== photo.size) return json({ error: 'size_mismatch' }, 400);
  await c.env.PHOTOS.put(`p/${id}/${size}`, c.req.raw.body, {
    httpMetadata: { contentType: size === 'o' ? photo.mime : 'image/jpeg' },
  });
  return json({ ok: true });
});

app.post('/api/e/:token/upload/:id/commit', async (c) => {
  const { token, id } = c.req.param();
  if (!isHex(id, 32)) return json({ error: 'bad' }, 400);
  const event = await getEventByGuestToken(c.env.DB, token);
  if (!event) return json({ error: 'event' }, 404);
  let b = {};
  try { b = await c.req.json(); } catch { /* sin cuerpo */ }
  const guest = await guestFor(c.env.DB, event, b.key);
  if (!guest) return json({ error: 'key' }, 403);
  const photo = await c.env.DB.prepare('SELECT * FROM photos WHERE id = ? AND event_id = ? AND guest_id = ?').bind(id, event.id, guest.id).first();
  if (!photo) return json({ error: 'nofound' }, 404);
  if (photo.state !== 'uploading') return json({ ok: true, state: photo.state }); // reintento: ya confirmada
  const [o, m, l] = await Promise.all(['o', 'm', 'l'].map((s) => c.env.PHOTOS.head(`p/${id}/${s}`)));
  if (!o || !m || !l) return json({ error: 'incomplete', missing: [!o && 'o', !m && 'm', !l && 'l'].filter(Boolean) }, 409);
  if (o.size !== photo.size) return json({ error: 'size_mismatch' }, 409);
  const me = await currentUser(c);
  const isOwner = Boolean(me && event.owner_id && me.id === event.owner_id);
  const state = event.auto_approve || isOwner ? 'approved' : 'pending';
  const order = await nextSortOrder(c.env.DB, event.id);
  await c.env.DB.prepare(`UPDATE photos SET state = ?, sort_order = ? WHERE id = ? AND state = 'uploading'`).bind(state, order, id).run();
  return json({ ok: true, state });
});

/* ---------- Álbum personal ---------- */

async function ownIds(db, event, guest, ids) {
  ids = [...new Set((Array.isArray(ids) ? ids : []).filter((i) => isHex(i, 32)))];
  if (!ids.length) return [];
  const list = ids.map((i) => `'${i}'`).join(',');
  const rows = await db.prepare(`SELECT id FROM photos WHERE event_id = ? AND guest_id = ? AND id IN (${list})`).bind(event.id, guest.id).all();
  return rows.results.map((r) => r.id);
}

/* ---------- Administración ---------- */

const adminSecret = (env) => env.SESSION_SECRET || env.ADMIN_PASSWORD || '';

async function isAdmin(c) {
  return checkSession(adminSecret(c.env), getCookie(c.req.raw, 'picfy_admin'));
}

function adminCookie(value, maxAge) {
  return `picfy_admin=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

app.get('/admin', async (c) => {
  if (!c.env.ADMIN_PASSWORD) return html(adminLoginPage('Falta configurar ADMIN_PASSWORD en el servidor.'), 503);
  if (!(await isAdmin(c))) return html(adminLoginPage());
  const rows = await c.env.DB.prepare(
    `SELECT e.*,
       (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id AND p.state = 'approved') AS approved,
       (SELECT COUNT(*) FROM photos p WHERE p.event_id = e.id AND p.state = 'pending') AS pending
     FROM events e ORDER BY e.created_at DESC`,
  ).all();
  return html(adminDashboard(rows.results, new URL(c.req.url).origin, c.req.query('ok') || ''));
});

app.post('/admin/login', async (c) => {
  if (!c.env.ADMIN_PASSWORD) return html(adminLoginPage('Falta configurar ADMIN_PASSWORD en el servidor.'), 503);
  const form = await c.req.formData();
  const a = await sha256Hex(String(form.get('password') || ''));
  const b = await sha256Hex(c.env.ADMIN_PASSWORD);
  if (!timingSafeEqual(a, b)) return html(adminLoginPage('Contraseña incorrecta.'), 401);
  const session = await makeSession(adminSecret(c.env));
  return new Response(null, { status: 303, headers: { location: '/admin', 'set-cookie': adminCookie(session, 12 * 3600) } });
});

app.post('/admin/logout', async (c) =>
  new Response(null, { status: 303, headers: { location: '/admin', 'set-cookie': adminCookie('', 0) } }));

app.post('/admin/events', async (c) => {
  if (!(await isAdmin(c))) return c.redirect('/admin', 303);
  const f = await c.req.formData();
  const name = String(f.get('name') || '').trim().slice(0, 120);
  if (!name) return c.redirect('/admin', 303);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('event_date') || '')) ? String(f.get('event_date')) : null;
  const limit = Math.max(0, Math.min(2000, parseInt(String(f.get('photo_limit') || '0'), 10) || 0));
  const lead = String(f.get('lead') || '').trim().slice(0, 400);
  const auto = f.get('auto_approve') ? 1 : 0;
  const event = {
    id: randomHex(8), name, lead, event_date: date,
    guest_token: randomHex(16), auto_approve: auto, photo_limit: limit,
  };
  const manageToken = randomHex(32);
  await c.env.DB.prepare(
    `INSERT INTO events (id, name, lead, event_date, guest_token, manage_hash, auto_approve, photo_limit, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(event.id, name, lead, date, event.guest_token, await sha256Hex(manageToken), auto, limit, Date.now()).run();
  const origin = new URL(c.req.url).origin;
  return html(adminCreated(event, `${origin}/e/${event.guest_token}`, `${origin}/o/${manageToken}`));
});

app.post('/admin/events/:id/regen', async (c) => {
  if (!(await isAdmin(c))) return c.redirect('/admin', 303);
  const event = await getEventById(c.env.DB, c.req.param('id'));
  if (!event) return c.redirect('/admin', 303);
  const manageToken = randomHex(32);
  await c.env.DB.prepare('UPDATE events SET manage_hash = ? WHERE id = ?').bind(await sha256Hex(manageToken), event.id).run();
  const origin = new URL(c.req.url).origin;
  return html(adminCreated(event, `${origin}/e/${event.guest_token}`, `${origin}/o/${manageToken}`));
});

app.post('/admin/events/:id/delete', async (c) => {
  if (!(await isAdmin(c))) return c.redirect('/admin', 303);
  const event = await getEventById(c.env.DB, c.req.param('id'));
  if (!event) return c.redirect('/admin', 303);
  const rows = await c.env.DB.prepare('SELECT id FROM photos WHERE event_id = ?').bind(event.id).all();
  const keys = rows.results.flatMap((r) => ['o', 'm', 'l'].map((s) => `p/${r.id}/${s}`));
  for (let i = 0; i < keys.length; i += 500) await c.env.PHOTOS.delete(keys.slice(i, i + 500));
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM photos WHERE event_id = ?').bind(event.id),
    c.env.DB.prepare('DELETE FROM guests WHERE event_id = ?').bind(event.id),
    c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(event.id),
  ]);
  return c.redirect('/admin?ok=' + encodeURIComponent('Evento borrado.'), 303);
});

/* ---------- Organizador ---------- */
manageRoutes(app);

/* ---------- Plataforma: cuentas y galerías ---------- */
appRoutes(app);

app.notFound((c) => (c.req.header('accept') || '').includes('text/html') ? html(notFoundPage(), 404) : c.text('Not found', 404));
app.onError((err, c) => {
  console.error(err && err.stack || err);
  return c.req.path.startsWith('/api/') ? json({ error: 'server' }, 500) : html(notFoundPage('Algo ha fallado. Inténtalo de nuevo.'), 500);
});

export default app;
