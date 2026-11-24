// Calendario de contenidos por cliente: publicaciones con imágenes, copy y estado,
// y un enlace para que el cliente las vea, las apruebe o pida cambios.
import { randomHex, isHex, html, json, esc } from './util.js';
import { currentUser } from './auth.js';
import { FONTS, NETWORKS, redesReady } from './redes.js';
import { layout } from './views.js';
import { compartidoPage } from './appviews.js';

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
    if (c.req.param('token') !== undefined) {
      const cl = await byToken(c);
      if (!cl) return { err: json({ error: 'nf' }, 404) };
      if (cl.share_mode === 'view' && c.req.method !== 'GET') return { err: json({ error: 'readonly' }, 403) };
      return { user: { id: cl.owner_id }, cl, shared: true };
    }
    const user = await currentUser(c);
    if (!user) return { err: json({ error: 'auth' }, 401) };
    if (!(await redesReady(c.env.DB)) || !(await contenidosReady(c.env.DB))) return { err: json({ error: 'setup' }, 503) };
    return { user };
  }
  async function client(c, a) {
    if (a.cl) return a.cl;
    const user = a.user;
    const id = c.req.param('cid');
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT * FROM social_clients WHERE id = ? AND owner_id = ?').bind(id, user.id).first();
  }
  async function myPost(c, cl) {
    const id = c.req.param('id');
    if (!isHex(id, 16)) return null;
    return c.env.DB.prepare('SELECT * FROM agenda_items WHERE id = ? AND client_id = ? AND post IS NOT NULL').bind(id, cl.id).first();
  }

  function mount(base) {
    app.get(base + '/posts', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
      return json({ posts: await loadPosts(c.env.DB, cl.id, false), token: cl.share_token || null, mode: MODES.includes(cl.share_mode) ? cl.share_mode : 'review', modeOk: 'share_mode' in cl, planOk: 'plan' in cl, plan: 'plan' in cl ? safeJson(cl.plan) : {}, campaigns: 'plan' in cl ? (safeJson(cl.plan).campaigns || []) : [] });
    });

    app.post(base + '/posts', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
      const r = cleanPost(await c.req.json().catch(() => ({})));
      if (r.error) return json({ error: r.error }, 400);
      const id = randomHex(8), v = r.v;
      await c.env.DB.prepare('INSERT INTO agenda_items (id, owner_id, kind, title, category, date, time, done, important, url, created_at, client_id, post) VALUES (?,?,?,?,?,?,?,?,0,?,?,?,?)')
        .bind(id, a.user.id, v.kind, v.title, cl.name, v.date, v.time, v.done, v.link, Date.now(), cl.id, v.post).run();
      return json({ id });
    });

    app.put(base + '/posts/:id', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
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

    app.delete(base + '/posts/:id', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
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

    app.post(base + '/posts/:id/images', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
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

    app.delete(base + '/posts/:id/images/:iid', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
      const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
      const iid = c.req.param('iid');
      if (!isHex(iid, 16)) return json({ error: 'nf' }, 404);
      await dropImages(c, [{ id: iid, item_id: cur.id }]);
      await c.env.DB.prepare('DELETE FROM post_images WHERE id = ? AND item_id = ?').bind(iid, cur.id).run();
      return json({ ok: true });
    });

    app.put(base + '/posts/:id/order', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
      const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
      const b = await c.req.json().catch(() => ({}));
      const ids = Array.isArray(b.ids) ? b.ids.filter((x) => isHex(x, 16)).slice(0, 10) : [];
      await c.env.DB.batch(ids.map((x, i) => c.env.DB.prepare('UPDATE post_images SET position = ? WHERE id = ? AND item_id = ?').bind(i, x, cur.id)));
      return json({ ok: true });
    });

    app.post(base + '/posts/:id/notes', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
      const cur = await myPost(c, cl); if (!cur) return json({ error: 'nf' }, 404);
      const body = clip((await c.req.json().catch(() => ({}))).body, 1000);
      if (!body) return json({ error: 'empty' }, 400);
      const id = randomHex(8);
      await c.env.DB.prepare('INSERT INTO post_notes (id, item_id, author, body, created_at) VALUES (?,?,?,?,?)').bind(id, cur.id, a.shared ? 'cliente' : 'yo', body, Date.now()).run();
      return json({ comment: { id, author: a.shared ? 'cliente' : 'yo', body, at: Date.now() } });
    });

    app.put(base + '/campaigns', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
      if (!('plan' in cl)) return json({ error: 'setup' }, 503);
      const b = await c.req.json().catch(() => ({}));
      const campaigns = (Array.isArray(b.campaigns) ? b.campaigns : []).slice(0, 40).map((x) => {
        const start = reDate.test(String(x && x.start)) ? x.start : '';
        let end = reDate.test(String(x && x.end)) ? x.end : start;
        if (end < start) end = start;
        return { id: isHex(x && x.id, 16) ? x.id : randomHex(8), name: clip(x && x.name, 60), color: /^#[0-9a-fA-F]{6}$/.test(String(x && x.color)) ? x.color.toLowerCase() : '#8e5bd6', start, end };
      }).filter((x) => x.name && x.start);
      const plan = { ...safeJson(cl.plan), campaigns };
      await c.env.DB.prepare('UPDATE social_clients SET plan = ? WHERE id = ?').bind(JSON.stringify(plan), cl.id).run();
      return json({ campaigns });
    });

    app.post(base + '/posts/:id/duplicate', async (c) => {
      const a = await auth(c); if (a.err) return a.err;
      const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
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
  }
  mount('/api/redes/:cid');
  mount('/c/:token/api');

  app.post('/api/redes/:cid/share', async (c) => {
    const a = await auth(c); if (a.err) return a.err;
    const cl = await client(c, a); if (!cl) return json({ error: 'nf' }, 404);
    const b = await c.req.json().catch(() => ({}));
    let token = cl.share_token || null;
    if (b.on === false) token = null;
    else if (b.on) token = (b.renew || !cl.share_token) ? randomHex(16) : cl.share_token;
    await c.env.DB.prepare('UPDATE social_clients SET share_token = ? WHERE id = ?').bind(token, cl.id).run();
    let mode = MODES.includes(cl.share_mode) ? cl.share_mode : 'review';
    if (MODES.includes(b.mode) && 'share_mode' in cl) { mode = b.mode; await c.env.DB.prepare('UPDATE social_clients SET share_mode = ? WHERE id = ?').bind(mode, cl.id).run(); }
    return json({ token, mode });
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
    if (!r) return c.notFound();
    const obj = await c.env.PHOTOS.get(`social/${r.item_id}/${r.id}`);
    if (!obj) return c.notFound();
    return new Response(obj.body, { headers: { 'content-type': r.mime, 'cache-control': 'private, max-age=3600' } });
  });

  app.get('/c/:token', async (c) => {
    const cl = await byToken(c);
    if (!cl) return html(layout({ title: 'Enlace no disponible', body: '<main class="main"><div class="glass emptybox">Este enlace no existe o ya no está activo.</div></main>' }), 404);
    return html(compartidoPage({ client: { ...cl, networks: safeJson(cl.networks) }, fonts: FONTS, networks: NETWORKS, statuses: STATUSES, formats: FORMATS, token: c.req.param('token') }));
  });
}
