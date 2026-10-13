// Panel del organizador: moderar, ordenar, mover fotos entre álbumes, ajustes y descarga en ZIP.

import { esc, sha256Hex, isHex, json, html } from './util.js';
import { applyOrder, deletePhotos, orderSql, setSortMode, SORTS } from './photos.js';
import { layout, notFoundPage, fmtDate, lightbox } from './views.js';
import { buildZip, splitParts } from './zip.js';

async function eventByManageToken(db, token) {
  if (!isHex(token, 64)) return null;
  return db.prepare('SELECT * FROM events WHERE manage_hash = ?').bind(await sha256Hex(token)).first();
}

const validIds = (ids) => [...new Set((Array.isArray(ids) ? ids : []).filter((i) => isHex(i, 32)))];
const inList = (ids) => ids.map((i) => `'${i}'`).join(',');

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;

function hhmm(p) {
  const real = p.taken_at != null;
  const d = new Date(real ? p.taken_at : p.uploaded_at);
  const opt = real
    ? { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' }
    : { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' };
  const day = real
    ? d.toLocaleDateString('es-ES', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
    : d.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit' });
  return `${day} ${d.toLocaleTimeString('es-ES', opt)}${real ? '' : ' ~'}`;
}

function guestLabel(g) {
  return g.name ? g.name : `Invitado ${g.id.slice(0, 4)}`;
}

function managePage({ event, token, origin, approved, pending, rejected, guests, zipParts, flash }) {
  const owner = new Map(guests.map((g) => [g.id, g]));
  const sortTile = (p) => `<div class="tile" data-id="${p.id}" data-full="/m/${p.id}/l">
<input class="chk" type="checkbox" aria-label="Marcar foto">
<button class="trash" type="button" aria-label="Borrar foto" title="Borrar">${TRASH}</button>
<img src="/m/${p.id}/m" loading="lazy" decoding="async" alt="">
<span class="meta">${esc(guestLabel(owner.get(p.guest_id) || { id: '????', name: '' }))}<br>${esc(hhmm(p))}</span></div>`;
  const modTile = (p, kind) => `<div class="tile" data-id="${p.id}" data-full="/m/${p.id}/l">
<img src="/m/${p.id}/m" loading="lazy" decoding="async" alt="">
<span class="meta">${esc(guestLabel(owner.get(p.guest_id) || { id: '????', name: '' }))}<br>${esc(hhmm(p))}</span>
<div style="position:absolute;top:4px;left:4px;right:4px;display:flex;gap:4px;z-index:3">
<button class="btn sm primary" type="button" data-act="approve" data-id="${p.id}">${kind === 'pending' ? 'Aprobar' : 'Publicar'}</button>
${kind === 'pending' ? `<button class="btn sm" type="button" data-act="reject" data-id="${p.id}">Rechazar</button>` : `<button class="btn sm danger" type="button" data-act="delete" data-id="${p.id}">Borrar</button>`}
</div></div>`;
  const guestUrl = `${origin}/e/${event.guest_token}`;
  const opts = guests.map((g) => `<option value="${g.id}">${esc(guestLabel(g))} (${g.n})</option>`).join('');
  const modeLabel = { time: 'por hora de captura', time_desc: 'por hora (más recientes primero)', manual: 'orden manual' }[event.sort_mode];
  const base = `/api/o/${token}`;

  const zipLinks = zipParts.length
    ? zipParts.map((z, i) => `<a class="btn sm" href="/o/${token}/zip?part=${i + 1}">${zipParts.length > 1 ? `Parte ${i + 1} de ${zipParts.length} (${z.count} fotos)` : `Descargar ZIP (${z.count} fotos)`}</a>`).join(' ')
    : '<span class="muted small">No hay fotos publicadas todavía.</span>';

  return layout({
    title: `Organizador · ${event.name}`,
    bodyAttrs: `data-api="${base}" data-token="${token}"`,
    scripts: ['/vendor/qrcode.js', '/qr.js', '/lightbox.js', '/reorder.js', '/manage.js'],
    body: `<main class="wrap" style="padding:20px 16px 60px">
<div class="bar"><h1 style="margin:0;font-size:1.6rem">${esc(event.name)}</h1><span class="spacer"></span>
<span class="muted small">${approved.length} publicadas · ${pending.length} en revisión · ${guests.length} invitados</span></div>
${flash ? `<div class="notice ok">${esc(flash)}</div>` : ''}

<div class="card">
<div class="row2">
<div><strong>Enlace para invitados</strong>
<div class="linkbox" id="guestLink">${esc(guestUrl)}</div>
<button class="btn sm" type="button" id="copyLink">Copiar enlace</button>
<a class="btn sm" href="${esc(guestUrl)}" target="_blank" rel="noopener">Abrir</a></div>
<div><div class="qr" data-qr="${esc(guestUrl)}"></div></div>
</div></div>

${pending.length ? `<div class="card"><div class="bar"><h2 style="margin:0">En revisión (${pending.length})</h2><span class="spacer"></span>
<button class="btn sm primary" type="button" id="approveAll">Aprobar todas</button></div>
<div class="grid" id="pendingGrid" style="--tile:150px">${pending.map((p) => modTile(p, 'pending')).join('')}</div></div>` : ''}

<div class="card">
<div class="bar"><h2 style="margin:0">Todas las fotos</h2><span class="spacer"></span>
<span class="muted small">Orden actual: ${esc(modeLabel)}</span></div>
<p class="muted small">Arrastra para colocar las fotos como quieras. Marca varias (o estira el ratón) para moverlas, borrarlas o pasarlas al álbum de otro invitado.</p>
<div class="bar">
<button class="btn sm" type="button" id="pickAll">Marcar todas</button>
<button class="btn sm danger hidden" type="button" id="delPicked">${TRASH.replace('<svg', '<svg width="14" height="14"')} Borrar marcadas <span id="pickedN"></span></button>
<span class="hidden" id="moveBox"><select id="moveTo" aria-label="Álbum de destino">${opts}</select>
<button class="btn sm" type="button" id="moveBtn">Pasar al álbum de…</button></span>
<span class="spacer"></span>
<button class="btn sm" type="button" data-mode="time">Ordenar por hora</button>
<button class="btn sm" type="button" data-mode="time_desc">Más recientes primero</button>
<label class="size-ctl">Tamaño <input type="range" id="size" min="64" max="260" value="120"></label>
</div>
<div id="mineCount" class="muted small">${approved.length} fotos</div>
${approved.length ? `<div class="grid sort-grid compact" id="sortGrid" style="--tile:120px">${approved.map(sortTile).join('')}</div>` : '<div class="empty">Todavía no hay fotos publicadas.</div>'}
</div>

${rejected.length ? `<div class="card"><h2>No publicadas (${rejected.length})</h2><div class="grid" id="rejectedGrid" style="--tile:130px">${rejected.map((p) => modTile(p, 'rejected')).join('')}</div></div>` : ''}

<div class="card"><h2>Descargar</h2>
<p class="muted small">Fotos originales, en el orden de la galería. Para eventos grandes se reparten en varias partes.</p>
<div class="bar">${zipLinks}</div>
<div class="bar"><a class="small" href="/o/${token}/zip?by=guest&part=1">También en carpetas por invitado (parte 1)</a></div></div>

<details class="card"><summary><strong>Ajustes del evento</strong></summary>
<form method="post" action="/o/${token}/settings" style="margin-top:12px">
<label class="field"><span>Nombre</span><input type="text" name="name" maxlength="120" value="${esc(event.name)}" required></label>
<div class="row2">
<label class="field"><span>Fecha</span><input type="date" name="event_date" value="${esc(event.event_date || '')}"></label>
<label class="field"><span>Máximo de fotos por invitado (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="${event.photo_limit}"></label>
</div>
<label class="field"><span>Texto de bienvenida</span><textarea name="lead" maxlength="400">${esc(event.lead)}</textarea></label>
<label class="field"><input type="checkbox" name="auto_approve" value="1" ${event.auto_approve ? 'checked' : ''}> Publicar las fotos automáticamente</label>
<label class="field"><input type="checkbox" name="upload_open" value="1" ${event.upload_open ? 'checked' : ''}> Subida de fotos abierta</label>
<label class="field"><input type="checkbox" name="gallery_open" value="1" ${event.gallery_open ? 'checked' : ''}> Galería visible para invitados</label>
<button class="btn primary" type="submit">Guardar ajustes</button>
</form></details>
</main>
${lightbox()}`,
  });
}

export function manageRoutes(app) {
  // Panel
  app.get('/o/:token', async (c) => {
    const token = c.req.param('token');
    const event = await eventByManageToken(c.env.DB, token);
    if (!event) return html(notFoundPage('Este enlace de organizador no existe o ya no está activo.'), 404);
    const db = c.env.DB;
    const cols = 'id, guest_id, state, taken_at, uploaded_at, size';
    const [appr, pend, rej, gs] = await Promise.all([
      db.prepare(`SELECT ${cols} FROM photos WHERE event_id = ? AND state = 'approved' ORDER BY ${orderSql(event.sort_mode)}`).bind(event.id).all(),
      db.prepare(`SELECT ${cols} FROM photos WHERE event_id = ? AND state = 'pending' ORDER BY uploaded_at ASC`).bind(event.id).all(),
      db.prepare(`SELECT ${cols} FROM photos WHERE event_id = ? AND state = 'rejected' ORDER BY uploaded_at ASC`).bind(event.id).all(),
      db.prepare(`SELECT g.id, g.name, (SELECT COUNT(*) FROM photos p WHERE p.guest_id = g.id AND p.state IN ('approved','pending','rejected')) AS n
                  FROM guests g WHERE g.event_id = ? ORDER BY g.created_at ASC`).bind(event.id).all(),
    ]);
    const partSize = Number(c.env.ZIP_PART_SIZE) || 40;
    const parts = splitParts(appr.results, partSize);
    const zipParts = parts.map((p) => ({ count: p.length }));
    return html(managePage({
      event, token, origin: new URL(c.req.url).origin,
      approved: appr.results, pending: pend.results, rejected: rej.results, guests: gs.results,
      zipParts, flash: c.req.query('ok') || '',
    }));
  });

  // Ajustes (formulario normal)
  app.post('/o/:token/settings', async (c) => {
    const token = c.req.param('token');
    const event = await eventByManageToken(c.env.DB, token);
    if (!event) return html(notFoundPage(), 404);
    const f = await c.req.formData();
    const name = String(f.get('name') || '').trim().slice(0, 120) || event.name;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(f.get('event_date') || '')) ? String(f.get('event_date')) : null;
    const limit = Math.max(0, Math.min(2000, parseInt(String(f.get('photo_limit') || '0'), 10) || 0));
    await c.env.DB.prepare(
      `UPDATE events SET name = ?, event_date = ?, photo_limit = ?, lead = ?, auto_approve = ?, upload_open = ?, gallery_open = ? WHERE id = ?`,
    ).bind(name, date, limit, String(f.get('lead') || '').trim().slice(0, 400),
      f.get('auto_approve') ? 1 : 0, f.get('upload_open') ? 1 : 0, f.get('gallery_open') ? 1 : 0, event.id).run();
    return c.redirect(`/o/${token}?ok=${encodeURIComponent('Ajustes guardados.')}`, 303);
  });

  // ZIP en streaming
  app.get('/o/:token/zip', async (c) => {
    const event = await eventByManageToken(c.env.DB, c.req.param('token'));
    if (!event) return html(notFoundPage(), 404);
    const part = Math.max(1, parseInt(c.req.query('part') || '1', 10) || 1);
    const byGuest = c.req.query('by') === 'guest';
    const rows = (await c.env.DB.prepare(
      `SELECT p.id, p.filename, p.size, p.crc32, p.taken_at, p.uploaded_at, g.name AS gname, g.id AS gid
       FROM photos p JOIN guests g ON g.id = p.guest_id
       WHERE p.event_id = ? AND p.state = 'approved' ORDER BY ${orderSql(event.sort_mode, 'p')}`,
    ).bind(event.id).all()).results;
    const partSize = Number(c.env.ZIP_PART_SIZE) || 40;
    const parts = splitParts(rows, partSize);
    const list = parts[part - 1];
    if (!list) return html(notFoundPage('Esa parte no existe.'), 404);
    const offsetSeq = parts.slice(0, part - 1).reduce((n, p) => n + p.length, 0);
    const used = new Set();
    const safe = (s) => String(s || '').replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').trim().slice(0, 80);
    const entries = list.map((r, i) => {
      const seq = String(offsetSeq + i + 1).padStart(4, '0');
      let base = safe(r.filename) || `${r.id}.jpg`;
      let name = byGuest ? `${safe(r.gname) || 'Invitado ' + r.gid.slice(0, 4)}/${seq}_${base}` : `${seq}_${base}`;
      while (used.has(name)) name = name.replace(/(\.[^.]*)?$/, `_${r.id.slice(0, 4)}$1`);
      used.add(name);
      return { key: `p/${r.id}/o`, name, size: r.size, crc: r.crc32, ms: r.taken_at ?? r.uploaded_at };
    });
    const { stream, length } = buildZip(c.env.PHOTOS, entries);
    const label = safe(event.name).replace(/\s+/g, '-') || 'evento';
    const fname = parts.length > 1 ? `picfy-${label}-parte${part}.zip` : `picfy-${label}.zip`;
    return new Response(stream, {
      headers: {
        'content-type': 'application/zip',
        'content-length': String(length),
        'content-disposition': `attachment; filename="${fname}"`,
        'cache-control': 'no-store',
      },
    });
  });

  /* ----- API (JSON) ----- */
  async function ctx(c) {
    const event = await eventByManageToken(c.env.DB, c.req.param('token'));
    if (!event) return null;
    const body = await c.req.json().catch(() => ({}));
    return { event, body };
  }

  app.post('/api/o/:token/state', async (c) => {
    const x = await ctx(c); if (!x) return json({ error: 'auth' }, 403);
    const state = { approve: 'approved', reject: 'rejected' }[x.body.action];
    if (!state) return json({ error: 'action' }, 400);
    let ids = validIds(x.body.ids);
    let where = `event_id = ?1 AND state IN ('pending','rejected')`;
    if (x.body.all === true && state === 'approved') { /* todas las pendientes */ where = `event_id = ?1 AND state = 'pending'`; }
    else if (!ids.length) return json({ ok: true, changed: 0 });
    else where += ` AND id IN (${inList(ids)})`;
    if (state === 'rejected') where = where.replace("state IN ('pending','rejected')", "state IN ('pending','approved')");
    const r = await c.env.DB.prepare(`UPDATE photos SET state = '${state}' WHERE ${where}`).bind(x.event.id).run();
    return json({ ok: true, changed: r.meta?.changes ?? 0 });
  });

  app.post('/api/o/:token/delete', async (c) => {
    const x = await ctx(c); if (!x) return json({ error: 'auth' }, 403);
    const n = await deletePhotos(c.env, x.event.id, validIds(x.body.ids));
    return json({ ok: true, deleted: n });
  });

  app.post('/api/o/:token/reorder', async (c) => {
    const x = await ctx(c); if (!x) return json({ error: 'auth' }, 403);
    const ids = (Array.isArray(x.body.ids) ? x.body.ids : []).filter((i) => isHex(i, 32));
    const n = await applyOrder(c.env.DB, x.event, ids);
    return json({ ok: true, moved: n });
  });

  app.post('/api/o/:token/sort', async (c) => {
    const x = await ctx(c); if (!x) return json({ error: 'auth' }, 403);
    const mode = x.body.mode;
    if (!SORTS.includes(mode) || mode === 'manual') return json({ error: 'mode' }, 400);
    await setSortMode(c.env.DB, x.event.id, mode);
    return json({ ok: true });
  });

  app.post('/api/o/:token/move', async (c) => {
    const x = await ctx(c); if (!x) return json({ error: 'auth' }, 403);
    const ids = validIds(x.body.ids);
    if (!ids.length || !isHex(String(x.body.guest_id || ''), 16)) return json({ error: 'bad' }, 400);
    const g = await c.env.DB.prepare('SELECT id FROM guests WHERE id = ? AND event_id = ?').bind(x.body.guest_id, x.event.id).first();
    if (!g) return json({ error: 'guest' }, 404);
    const r = await c.env.DB.prepare(`UPDATE photos SET guest_id = ? WHERE event_id = ? AND id IN (${inList(ids)})`).bind(g.id, x.event.id).run();
    return json({ ok: true, moved: r.meta?.changes ?? 0 });
  });
}
