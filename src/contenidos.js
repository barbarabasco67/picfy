// Calendario de contenidos por cliente: publicaciones con imágenes, copy y estado,
// y un enlace para que el cliente las vea, las apruebe o pida cambios.
import { randomHex, isHex, html, json, esc } from './util.js';
import { currentUser } from './auth.js';
import { FONTS, NETWORKS, redesReady } from './redes.js';

export const STATUSES = {
  idea: { label: 'Idea', color: '#8a8f98', client: false },
  diseno: { label: 'En diseño', color: '#8e5bd6', client: false },
  revision: { label: 'Para revisar', color: '#e5964c', client: true },
  cambios: { label: 'Cambios pedidos', color: '#d6483b', client: true },
  aprobado: { label: 'Aprobado', color: '#2f9e5f', client: true },
  programado: { label: 'Programado', color: '#2f6fed', client: true },
  publicado: { label: 'Publicado', color: '#14213d', client: true },
};
export const CHECKS = { copy: 'Texto', arte: 'Diseño', tags: 'Hashtags', prog: 'Programado' };
export const MODES = ['view', 'review', 'edit'];
export const FORMATS = { post: 'Post', carrusel: 'Carrusel', reel: 'Reel', storie: 'Storie', video: 'Vídeo', texto: 'Texto' };

let st = { v: null, t: 0 };
export async function contenidosReady(db) {
  if (st.v === true || (st.v === false && Date.now() - st.t < 30000)) return st.v;
  try {
    await db.prepare('SELECT post FROM agenda_items LIMIT 1').first();
    await db.prepare('SELECT share_token FROM social_clients LIMIT 1').first();
    await db.prepare('SELECT id, item_id, position FROM post_images LIMIT 1').first();
    await db.prepare('SELECT id, item_id, body FROM post_notes LIMIT 1').first();
    st = { v: true, t: Date.now() };
  } catch { st = { v: false, t: Date.now() }; }
  return st.v;
}

const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const reDate = /^\d{4}-\d{2}-\d{2}$/;
const reTime = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIMES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_IMG = 8 * 1024 * 1024;
const safeJson = (s) => { try { return JSON.parse(s) || {}; } catch { return {}; } };

function cleanPost(b, cur = {}) {
  const p0 = cur.post ? safeJson(cur.post) : {};
  const title = clip(b.title != null ? b.title : cur.title, 160);
  if (!title) return { error: 'title' };
  const date = 'date' in b ? (reDate.test(String(b.date || '')) ? String(b.date) : '') : (cur.date || '');
  const time = 'time' in b ? (date && reTime.test(String(b.time || '')) ? String(b.time) : null) : (cur.time || null);
  const nets = Array.isArray(b.networks) ? b.networks.filter((n) => n in NETWORKS).slice(0, 6) : (p0.networks || []);
  const format = b.format in FORMATS ? b.format : (p0.format in FORMATS ? p0.format : 'post');
  const status = b.status in STATUSES ? b.status : (p0.status in STATUSES ? p0.status : 'idea');
  let link = 'link' in b ? clip(b.link, 400) : (cur.url || '');
  if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
  const post = {
    networks: nets, format, status,
    copy: 'copy' in b ? clip(b.copy, 5000) : (p0.copy || ''),
    hashtags: 'hashtags' in b ? clip(b.hashtags, 600) : (p0.hashtags || ''),
    notes: 'notes' in b ? clip(b.notes, 2000) : (p0.notes || ''),
    pillar: 'pillar' in b ? clip(b.pillar, 40) : (p0.pillar || ''),
    owner: 'owner' in b ? clip(b.owner, 60) : (p0.owner || ''),
    goal: 'goal' in b ? clip(b.goal, 200) : (p0.goal || ''),
    place: 'place' in b ? clip(b.place, 100) : (p0.place || ''),
    mentions: 'mentions' in b ? clip(b.mentions, 300) : (p0.mentions || ''),
    check: {}, stats: {},
  };
  for (const k of Object.keys(CHECKS)) post.check[k] = b.check && typeof b.check === 'object' ? !!b.check[k] : !!(p0.check || {})[k];
  const sIn = b.stats && typeof b.stats === 'object' ? b.stats : (p0.stats || {});
  for (const k of ['reach', 'likes', 'comments', 'saves', 'shares']) { const n = Math.round(Number(sIn[k])); if (sIn[k] !== '' && sIn[k] != null && Number.isFinite(n) && n >= 0 && n < 1e10) post.stats[k] = n; }
  return { v: { title, date, time, link: link || null, kind: format === 'storie' ? 'storie' : 'publicacion', done: status === 'publicado' ? 1 : 0, post: JSON.stringify(post) } };
}

function outPost(r, imgs, notes) {
  const p = safeJson(r.post);
  return {
    id: r.id, title: r.title, date: r.date || '', time: r.time || '', link: r.url || '',
    networks: p.networks || [], format: p.format || 'post', status: p.status || 'idea',
    copy: p.copy || '', hashtags: p.hashtags || '', notes: p.notes || '',
    pillar: p.pillar || '', owner: p.owner || '', goal: p.goal || '', place: p.place || '', mentions: p.mentions || '', check: p.check || {}, stats: p.stats || {},
    images: imgs.filter((i) => i.item_id === r.id).sort((a, b) => a.position - b.position).map((i) => i.id),
    comments: notes.filter((n) => n.item_id === r.id).sort((a, b) => a.created_at - b.created_at).map((n) => ({ id: n.id, author: n.author, body: n.body, at: n.created_at })),
  };
}

async function loadPosts(db, cid, onlyClient) {
  const rows = (await db.prepare('SELECT * FROM agenda_items WHERE client_id = ? AND post IS NOT NULL ORDER BY date, COALESCE(time, \'99:99\'), created_at LIMIT 1000').bind(cid).all()).results;
  const ids = rows.map((r) => r.id);
  let imgs = [], notes = [];
  if (ids.length) {
    const q = ids.map(() => '?').join(',');
    imgs = (await db.prepare(`SELECT id, item_id, position FROM post_images WHERE item_id IN (${q})`).bind(...ids).all()).results;
    notes = (await db.prepare(`SELECT id, item_id, author, body, created_at FROM post_notes WHERE item_id IN (${q})`).bind(...ids).all()).results;
  }
  let list = rows.map((r) => outPost(r, imgs, notes));
  if (onlyClient) list = list.filter((p) => STATUSES[p.status].client);
  return list;
}

export function contenidosRoutes(app) {
  async function auth(c) {
    const user = await currentUser(c);
    if (!user) return { err: json({ error: 'auth' }, 401) };
    if (!(await redesReady(c.env.DB)) || !(await contenidosReady(c.env.DB))) return { err: json({ error: 'setup' }, 503) };
    return { user };
  }
  async function client(c, user) {
    const id = c.req.param('cid');
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT * FROM social_clients WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
  }
  async function myPost(c, cl) {
    const id = c.req.param('id');
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT * FROM agenda_items WHERE id = ? AND client_id = ? AND post IS NOT NULL').bind(id, cl.id).first();
  }

  app.get('/api/redes/:cid/posts', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    return json({ posts: await loadPosts(c.env.DB, cl.id, false), token: cl.share_token || null, mode: MODES.includes(cl.share_mode) ? cl.share_mode : 'review', modeOk: 'share_mode' in cl, planOk: 'plan' in cl, plan: 'plan' in cl ? safeJson(cl.plan) : {} });
  });

  app.post('/api/redes/:cid/posts', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const r = cleanPost(await c.req.json().catch(() => ({})));
    if (r.error) return json({ error: r.error }, 400);
    const id = randomHex(8), v = r.v;
    await c.env.DB.prepare('INSERT INTO agenda_items (id, owner_id, kind, title, category, date, time, done, important, url, created_at, client_id, post) VALUES (?,?,?,?,?,?,?,?,0,?,?,?,?)')
      .bind(id, a.user.id, v.kind, v.title, cl.name, v.date, v.time, v.done, v.link, Date.now(), cl.id, v.post).run();
    return json({ id });
  });

  app.put('/api/redes/:cid/posts/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const r = cleanPost(await c.req.json().catch(() => ({})), cur);
    if (r.error) return json({ error: r.error }, 400);
    const v = r.v;
    await c.env.DB.prepare('UPDATE agenda_items SET kind=?2, title=?3, date=?4, time=?5, done=?6, url=?7, post=?8 WHERE id=?1').bind(cur.id, v.kind, v.title, v.date, v.time, v.done, v.link, v.post).run();
    return json({ ok: true });
  });

  async function dropImages(c, ids) {
    for (const i of ids) await c.env.PHOTOS.delete(`social/${i.item_id}/${i.id}`).catch(() => {});
  }

  app.delete('/api/redes/:cid/posts/:id', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const imgs = (await c.env.DB.prepare('SELECT id, item_id FROM post_images WHERE item_id = ?').bind(cur.id).all()).results;
    await dropImages(c, imgs);
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM post_images WHERE item_id = ?').bind(cur.id),
      c.env.DB.prepare('DELETE FROM post_notes WHERE item_id = ?').bind(cur.id),
      c.env.DB.prepare('DELETE FROM agenda_items WHERE id = ?').bind(cur.id),
    ]);
    return json({ ok: true });
  });

  app.post('/api/redes/:cid/posts/:id/images', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const mime = String(c.req.header('content-type') || '').split(';')[0].trim();
    if (!(mime in MIMES)) return json({ error: 'type' }, 415);
    const n = (await c.env.DB.prepare('SELECT COUNT(*) AS n FROM post_images WHERE item_id = ?').bind(cur.id).first()).n;
    if (n >= 10) return json({ error: 'limit' }, 400);
    const buf = await c.req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_IMG) return json({ error: 'size' }, 413);
    const id = randomHex(8);
    await c.env.PHOTOS.put(`social/${cur.id}/${id}`, buf, { httpMetadata: { contentType: mime } });
    await c.env.DB.prepare('INSERT INTO post_images (id, item_id, owner_id, position, mime, size, created_at) VALUES (?,?,?,?,?,?,?)').bind(id, cur.id, a.user.id, n, mime, buf.byteLength, Date.now()).run();
    return json({ id });
  });

  app.delete('/api/redes/:cid/posts/:id/images/:iid', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const iid = c.req.param('iid');
    if (!isHex(iid, 16)) return json({ error: 'nf' }, 404);
    await dropImages(c, [{ id: iid, item_id: cur.id }]);
    await c.env.DB.prepare('DELETE FROM post_images WHERE id = ? AND item_id = ?').bind(iid, cur.id).run();
    return json({ ok: true });
  });

  app.put('/api/redes/:cid/posts/:id/order', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    const ids = Array.isArray(b.ids) ? b.ids.filter((x) => isHex(x, 16)).slice(0, 10) : [];
    await c.env.DB.batch(ids.map((x, i) => c.env.DB.prepare('UPDATE post_images SET position = ? WHERE id = ? AND item_id = ?').bind(i, x, cur.id)));
    return json({ ok: true });
  });

  app.post('/api/redes/:cid/posts/:id/notes', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const body = clip((await c.req.json().catch(() => ({}))).body, 1000);
    if (!body) return json({ error: 'empty' }, 400);
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO post_notes (id, item_id, author, body, created_at) VALUES (?,?,?,?,?)').bind(id, cur.id, 'yo', body, Date.now()).run();
    return json({ comment: { id, author: 'yo', body, at: Date.now() } });
  });

  app.post('/api/redes/:cid/share', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    let token = cl.share_token || null;
    if (b.on === false) token = null;
    else if (b.on) token = (b.renew || !cl.share_token) ? randomHex(16) : cl.share_token;
    await c.env.DB.prepare('UPDATE social_clients SET share_token = ? WHERE id = ?').bind(token, cl.id).run();
    let mode = MODES.includes(cl.share_mode) ? cl.share_mode : 'review';
    if (MODES.includes(b.mode) && 'share_mode' in cl) { mode = b.mode; await c.env.DB.prepare('UPDATE social_clients SET share_mode = ? WHERE id = ?').bind(mode, cl.id).run(); }
    return json({ token, mode });
  });

  app.put('/api/redes/:cid/plan', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    if (!('plan' in cl)) return json({ error: 'setup' }, 503);
    const b = await c.req.json().catch(() => ({}));
    const pillars = (Array.isArray(b.pillars) ? b.pillars : []).slice(0, 12).map((x) => ({ name: clip(x && x.name, 40), color: /^#[0-9a-fA-F]{6}$/.test(String(x && x.color)) ? x.color.toLowerCase() : '#8a8f98' })).filter((x) => x.name);
    const tagsets = (Array.isArray(b.tagsets) ? b.tagsets : []).slice(0, 12).map((x) => ({ name: clip(x && x.name, 40), tags: clip(x && x.tags, 600) })).filter((x) => x.name && x.tags);
    const plan = { pillars, tagsets };
    await c.env.DB.prepare('UPDATE social_clients SET plan = ? WHERE id = ?').bind(JSON.stringify(plan), cl.id).run();
    return json({ plan });
  });

  app.post('/api/redes/:cid/posts/:id/duplicate', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a.user); if (!cl) return json({ error: 'nf' }, 404);
    const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
    const p = safeJson(cur.post); p.status = 'idea'; p.check = {}; p.stats = {};
    const id = randomHex(8);
    await c.env.DB.prepare('INSERT INTO agenda_items (id, owner_id, kind, title, category, date, time, done, important, url, created_at, client_id, post) VALUES (?,?,?,?,?,?,?,0,0,NULL,?,?,?)')
      .bind(id, a.user.id, cur.kind, clip(cur.title + ' (copia)', 160), cl.name, cur.date, cur.time, Date.now(), cl.id, JSON.stringify(p)).run();
    const imgs = (await c.env.DB.prepare('SELECT id, mime, size, position FROM post_images WHERE item_id = ? ORDER BY position').bind(cur.id).all()).results;
    for (const im of imgs) {
      const obj = await c.env.PHOTOS.get(`social/${cur.id}/${im.id}`); if (!obj) continue;
      const nid = randomHex(8);
      await c.env.PHOTOS.put(`social/${id}/${nid}`, await obj.arrayBuffer(), { httpMetadata: { contentType: im.mime } });
      await c.env.DB.prepare('INSERT INTO post_images (id, item_id, owner_id, position, mime, size, created_at) VALUES (?,?,?,?,?,?,?)').bind(nid, id, a.user.id, im.position, im.mime, im.size, Date.now()).run();
    }
    return json({ id });
  });

  app.get('/api/post-img/:iid', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const iid = c.req.param('iid');
    if (!isHex(iid, 16)) return c.notFound();
    const r = await c.env.DB.prepare('SELECT id, item_id, mime FROM post_images WHERE id = ? AND owner_id = ?').bind(iid, a.user.id).first();
    const obj = r && await c.env.PHOTOS.get(`social/${r.item_id}/${r.id}`);
    if (!obj) return c.notFound();
    return new Response(obj.body, { headers: { 'content-type': r.mime, 'cache-control': 'private, max-age=86400' } });
  });

  /* ---------- Vista pública para el cliente ---------- */

  async function byToken(c) {
    const t = c.req.param('token');
    if (!isHex(t, 32) || !(await redesReady(c.env.DB)) || !(await contenidosReady(c.env.DB))) return null;
    return c.env.DB.prepare('SELECT * FROM social_clients WHERE share_token = ?').bind(t).first();
  }

  app.get('/c/:token/img/:iid', async (c) => {
    const cl = await byToken(c);
    const iid = c.req.param('iid');
    if (!cl || !isHex(iid, 16)) return c.notFound();
    const r = await c.env.DB.prepare('SELECT i.id, i.item_id, i.mime, a.post FROM post_images i JOIN agenda_items a ON a.id = i.item_id WHERE i.id = ? AND a.client_id = ?').bind(iid, cl.id).first();
    if (!r || !STATUSES[safeJson(r.post).status || 'idea'].client) return c.notFound();
    const obj = await c.env.PHOTOS.get(`social/${r.item_id}/${r.id}`);
    if (!obj) return c.notFound();
    return new Response(obj.body, { headers: { 'content-type': r.mime, 'cache-control': 'private, max-age=3600' } });
  });

  app.post('/c/:token/posts/:id', async (c) => {
    const cl = await byToken(c);
    if (!cl) return json({ error: 'nf' }, 404);
    const id = c.req.param('id');
    if (!isHex(id, 16)) return json({ error: 'nf' }, 404);
    const cur = await c.env.DB.prepare('SELECT * FROM agenda_items WHERE id = ? AND client_id = ? AND post IS NOT NULL').bind(id, cl.id).first();
    if (!cur) return json({ error: 'nf' }, 404);
    const p = safeJson(cur.post);
    if (!STATUSES[p.status || 'idea'].client) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    const mode = MODES.includes(cl.share_mode) ? cl.share_mode : 'review';
    if (mode === 'view') return json({ error: 'readonly' }, 403);
    const body = clip(b.body, 1000);
    const open = p.status === 'revision' || p.status === 'cambios';
    const act = b.action;
    if (act === 'edit') {
      if (mode !== 'edit' || !open) return json({ error: 'state' }, 403);
      const r = cleanPost({ title: b.title, date: b.date, time: b.time, copy: b.copy, hashtags: b.hashtags }, cur);
      if (r.error) return json({ error: r.error }, 400);
      const keep = safeJson(cur.post), np = safeJson(r.v.post);
      np.status = keep.status;
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE agenda_items SET title=?2, date=?3, time=?4, post=?5 WHERE id=?1').bind(cur.id, r.v.title, r.v.date, r.v.time, JSON.stringify(np)),
        c.env.DB.prepare('INSERT INTO post_notes (id, item_id, author, body, created_at) VALUES (?,?,?,?,?)').bind(randomHex(8), cur.id, 'cliente', 'Ha editado la publicación', Date.now()),
      ]);
      return json({ ok: true, status: np.status });
    }
    if (act === 'approve' && open) p.status = 'aprobado';
    else if (act === 'changes' && open) { if (!body) return json({ error: 'empty' }, 400); p.status = 'cambios'; }
    else if (act !== 'comment') return json({ error: 'state' }, 400);
    else if (!body) return json({ error: 'empty' }, 400);
    const ops = [];
    if (p.status !== (safeJson(cur.post).status)) ops.push(c.env.DB.prepare('UPDATE agenda_items SET post = ? WHERE id = ?').bind(JSON.stringify(p), cur.id));
    const text = act === 'approve' ? (body ? 'Aprobado. ' + body : 'Aprobado') : body;
    ops.push(c.env.DB.prepare('INSERT INTO post_notes (id, item_id, author, body, created_at) VALUES (?,?,?,?,?)').bind(randomHex(8), cur.id, 'cliente', text, Date.now()));
    await c.env.DB.batch(ops);
    return json({ ok: true, status: p.status });
  });

  app.get('/c/:token', async (c) => {
    const cl = await byToken(c);
    if (!cl) return html(publicShell('Enlace no disponible', '<p class="empty">Este enlace no existe o ya no está activo.</p>', '#14213d', FONTS.sans.css), 404);
    const posts = (await loadPosts(c.env.DB, cl.id, true)).filter((p) => p.date);
    const font = FONTS[cl.font] || FONTS.sans;
    return html(publicShell(cl.name, publicBody(cl, posts, c.req.param('token'), MODES.includes(cl.share_mode) ? cl.share_mode : 'review'), cl.color, font.css, font.w));
  });
}

/* ---------- HTML público ---------- */

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOW = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

function ink(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#14213d' : '#ffffff';
}

function publicBody(cl, posts, token, mode) {
  if (!posts.length) return `<header class="top"><h1>${esc(cl.name)}</h1><p>Calendario de contenidos</p></header><p class="empty">Todavía no hay publicaciones para revisar.</p>`;
  const byMonth = {};
  for (const p of posts) (byMonth[p.date.slice(0, 7)] = byMonth[p.date.slice(0, 7)] || []).push(p);
  const pending = posts.filter((p) => p.status === 'revision' || p.status === 'cambios').length;
  const img = (p, i) => `/c/${token}/img/${i}`;
  const card = (p) => {
    const s = STATUSES[p.status];
    const [y, m, d] = p.date.split('-').map(Number);
    const open = p.status === 'revision' || p.status === 'cambios';
    const media = p.images.length ? `<div class="media${p.images.length > 1 ? ' multi' : ''}">${p.images.map((i) => `<img src="${img(p, i)}" alt="">`).join('')}</div>${p.images.length > 1 ? `<p class="cnt">${p.images.length} imágenes · desliza</p>` : ''}` : '';
    const nets = p.networks.map((n) => `<span class="net" style="--n:${NETWORKS[n].color}">${esc(NETWORKS[n].label)}</span>`).join('');
    const full = [p.copy, p.hashtags].filter(Boolean).join('\n\n');
    const comments = p.comments.map((x) => `<div class="cm ${x.author === 'cliente' ? 'me' : ''}"><b>${x.author === 'cliente' ? 'Tú' : esc(cl.name.length > 0 ? 'Equipo' : 'Equipo')}</b><span>${esc(x.body)}</span></div>`).join('');
    const edit = mode === 'edit' && open ? `<div class="edit" hidden><input data-f="title" value="${esc(p.title)}" maxlength="160" aria-label="Título"><div class="two"><input type="date" data-f="date" value="${esc(p.date)}" aria-label="Fecha"><input type="time" data-f="time" value="${esc(p.time)}" aria-label="Hora"></div><textarea data-f="copy" rows="6" maxlength="5000" aria-label="Texto">${esc(p.copy)}</textarea><input data-f="hashtags" value="${esc(p.hashtags)}" maxlength="600" aria-label="Hashtags"><div class="btns"><button type="button" data-act="edit" class="ok">Guardar</button><button type="button" data-act="cancel-edit" class="ch">Cancelar</button></div></div><button type="button" class="cp" data-act="open-edit">Editar</button>` : '';
    const actions = mode === 'view' ? '' : open ? `<div class="acts"><textarea placeholder="Escribe aquí si quieres pedir un cambio…" maxlength="1000" rows="2"></textarea><div class="btns"><button type="button" data-act="approve" class="ok">Aprobar</button><button type="button" data-act="changes" class="ch">Pedir cambios</button></div></div>`
      : `<div class="acts"><div class="btns one"><button type="button" data-act="comment" class="ch">Comentar</button></div><textarea placeholder="Añadir un comentario…" maxlength="1000" rows="2"></textarea></div>`;
    return `<article class="card" id="p-${p.id}" data-id="${p.id}" data-st="${p.status}">
<header><div class="dt"><b>${d}</b><span>${MONTHS[m - 1].slice(0, 3)}${p.time ? ' · ' + esc(p.time) : ''}</span></div><div class="ti"><h3>${esc(p.title)}</h3><div class="meta">${nets}<span class="fm">${esc(FORMATS[p.format])}</span></div></div><span class="pill" style="--s:${s.color}">${s.label}</span></header>
${media}
${full ? `<div class="copy"><p>${esc(p.copy).replace(/\n/g, '<br>')}</p>${p.hashtags ? `<p class="tags">${esc(p.hashtags)}</p>` : ''}<button type="button" class="cp" data-copy="${esc(full)}">Copiar texto</button></div>` : ''}
${comments ? `<div class="cms">${comments}</div>` : ''}
${edit}
${actions}
</article>`;
  };
  const grid = (key) => {
    const [y, m] = key.split('-').map(Number);
    const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate(), off = (first.getDay() + 6) % 7;
    let cells = '';
    for (let i = 0; i < off; i++) cells += '<div class="gc empty"></div>';
    for (let d = 1; d <= days; d++) {
      const iso = `${key}-${String(d).padStart(2, '0')}`;
      const ps = byMonth[key].filter((p) => p.date === iso);
      cells += `<div class="gc"><span class="n">${d}</span>${ps.map((p) => `<a href="#p-${p.id}" class="gp" style="--s:${STATUSES[p.status].color}">${p.images[0] ? `<img src="${img(p, p.images[0])}" alt="">` : ''}<span>${esc(p.title)}</span></a>`).join('')}</div>`;
    }
    return `<div class="grid"><div class="dw">${DOW.map((x) => `<span>${x}</span>`).join('')}</div><div class="gs">${cells}</div></div>`;
  };
  const months = Object.keys(byMonth).sort().map((k) => {
    const [y, m] = k.split('-').map(Number);
    return `<section class="month"><h2>${MONTHS[m - 1]} ${y}</h2>${grid(k)}<div class="list">${byMonth[k].map(card).join('')}</div></section>`;
  }).join('');
  return `<header class="top"><h1>${esc(cl.name)}</h1><p>Calendario de contenidos${pending ? ` · <b>${pending} por revisar</b>` : ''}</p>
<div class="vt"><button type="button" data-v="list" class="on">Lista</button><button type="button" data-v="cal">Calendario</button></div></header>${months}`;
}

function publicShell(title, body, color, font, weight = 700) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${esc(title)}</title>
<style>
:root{--c:${color};--ci:${ink(color)};--f:${font};--w:${weight};--bg:#f6f4f0;--ink:#14213d;--mu:#6b7280;--ln:#e6e1d8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:0 16px 80px}
.top{padding:36px 0 18px;border-bottom:3px solid var(--c);margin-bottom:18px}.top h1{font:var(--w) 32px/1.1 var(--f);margin:0 0 4px;letter-spacing:-.01em}.top p{margin:0;color:var(--mu)}.top b{color:var(--ink)}
.vt{display:inline-flex;margin-top:14px;border:1px solid var(--ln);border-radius:10px;overflow:hidden;background:#fff}.vt button{border:0;background:none;padding:8px 16px;font:inherit;font-size:14px;cursor:pointer;color:var(--mu)}.vt .on{background:var(--c);color:var(--ci)}
.month h2{font:var(--w) 22px var(--f);text-transform:capitalize;margin:28px 0 12px}
.grid{display:none;margin-bottom:16px}.cal .grid{display:block}.cal .list{display:none}
.dw,.gs{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.dw span{font-size:12px;color:var(--mu);text-align:center;text-transform:uppercase}
.gc{min-height:72px;background:#fff;border:1px solid var(--ln);border-radius:8px;padding:4px;display:flex;flex-direction:column;gap:3px;min-width:0}.gc.empty{background:none;border:0}.gc .n{font-size:11px;color:var(--mu)}
.gp{display:block;text-decoration:none;color:#fff;background:var(--s);border-radius:6px;overflow:hidden;font-size:11px;line-height:1.2}.gp img{display:block;width:100%;aspect-ratio:1;object-fit:cover}.gp span{display:block;padding:2px 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.card{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:16px;margin-bottom:16px;scroll-margin-top:12px}
.card>header{display:flex;gap:12px;align-items:flex-start}.dt{flex:none;width:52px;text-align:center;background:var(--c);color:var(--ci);border-radius:10px;padding:6px 0;line-height:1.1}.dt b{display:block;font:var(--w) 22px var(--f)}.dt span{font-size:11px;text-transform:uppercase}
.ti{flex:1;min-width:0}.ti h3{margin:0 0 4px;font:var(--w) 18px/1.25 var(--f)}.meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.net{font-size:12px;padding:2px 8px;border-radius:99px;background:color-mix(in srgb,var(--n) 14%,#fff);color:var(--n)}.fm{font-size:12px;color:var(--mu)}
.pill{flex:none;font-size:12px;padding:3px 10px;border-radius:99px;background:color-mix(in srgb,var(--s) 14%,#fff);color:var(--s);font-weight:600;white-space:nowrap}
.media{display:flex;gap:8px;margin:14px 0 4px;overflow-x:auto;scroll-snap-type:x mandatory;border-radius:12px}.media img{display:block;width:100%;max-height:520px;object-fit:contain;background:#efece6;border-radius:12px;scroll-snap-align:center;flex:none}.media.multi img{width:88%}
.cnt{margin:2px 0 0;font-size:12px;color:var(--mu)}
.copy{margin-top:12px;background:#faf8f4;border:1px solid var(--ln);border-radius:12px;padding:12px 14px}.copy p{margin:0 0 8px;overflow-wrap:anywhere}.copy .tags{color:var(--c);filter:brightness(.8)}
.cp{border:1px solid var(--ln);background:#fff;border-radius:8px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer}
.cms{margin-top:12px;display:grid;gap:6px}.cm{font-size:14px;background:#f1eee8;border-radius:10px;padding:8px 12px;max-width:90%}.cm b{display:block;font-size:12px;color:var(--mu)}.cm.me{background:color-mix(in srgb,var(--c) 18%,#fff);margin-left:auto}
.acts{margin-top:12px;display:grid;gap:8px}.acts textarea{width:100%;font:inherit;font-size:15px;border:1px solid var(--ln);border-radius:10px;padding:10px;resize:vertical}
.btns{display:flex;gap:8px}.btns.one{order:2}.btns button{flex:1;border:0;border-radius:10px;padding:12px;font:inherit;font-weight:600;cursor:pointer}.ok{background:#2f9e5f;color:#fff}.ch{background:#fff;border:1px solid var(--ln)!important;color:var(--ink)}
.edit{margin-top:12px;display:grid;gap:8px}.edit input,.edit textarea{width:100%;font:inherit;font-size:15px;border:1px solid var(--ln);border-radius:10px;padding:10px}.edit .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.card>.cp{margin-top:12px}
.empty{color:var(--mu);padding:40px 0;text-align:center}.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:10px;font-size:14px}
@media(max-width:560px){.gc{min-height:54px}.gp span{display:none}.top h1{font-size:26px}}
</style></head><body><div class="wrap">${body}</div>
<script>
(function(){
var T=location.pathname.split('/')[2];
function toast(t){var e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(function(){e.remove()},2600)}
document.querySelectorAll('.vt button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.vt button').forEach(function(x){x.classList.toggle('on',x===b)});document.querySelector('.wrap').classList.toggle('cal',b.dataset.v==='cal')})});
document.addEventListener('click',function(e){
 var cp=e.target.closest('[data-copy]');
 if(cp){var t=cp.getAttribute('data-copy');(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){toast('Texto copiado')},function(){var a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');toast('Texto copiado')}catch(x){}a.remove()});return}
 var b=e.target.closest('[data-act]');if(!b)return;
 var card=b.closest('.card'),act=b.dataset.act;
 if(act==='open-edit'||act==='cancel-edit'){var ed=card.querySelector('.edit');ed.hidden=act==='cancel-edit';card.querySelector('[data-act=open-edit]').hidden=act==='open-edit';return}
 if(act==='edit'){var d={action:'edit'};card.querySelectorAll('.edit [data-f]').forEach(function(i){d[i.dataset.f]=i.value});b.disabled=true;
  fetch('/c/'+T+'/posts/'+card.dataset.id,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(d)}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(){toast('Guardado');setTimeout(function(){location.reload()},600)}).catch(function(){b.disabled=false;toast('No se pudo guardar')});return}
 var ta=card.querySelector('.acts textarea'),body=ta?ta.value.trim():'';
 if((act==='changes'||act==='comment')&&!body){toast('Escribe un mensaje primero');if(ta)ta.focus();return}
 b.disabled=true;
 fetch('/c/'+T+'/posts/'+card.dataset.id,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:act,body:body})}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(){toast(act==='approve'?'Aprobado, gracias':act==='changes'?'Cambios enviados':'Comentario enviado');setTimeout(function(){location.reload()},700)}).catch(function(){b.disabled=false;toast('No se pudo enviar')});
});
})();
</script></body></html>`;
}
