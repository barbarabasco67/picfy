import { ASSET_V } from './version.js';
// Páginas HTML (renderizadas en el servidor).

import { esc, themeStyle } from './util.js';

export const PER_PAGE = 60;

export function layout({ title, body, scripts = [], bodyAttrs = '', head = '' }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/style.css?v=${ASSET_V}">
<link rel="stylesheet" href="/app.css?v=${ASSET_V}">
<meta name="theme-color" content="#ffffff">
${head}
</head>
<body class="app" ${bodyAttrs}>
<div class="bgfx" aria-hidden="true"></div>
${body}
${scripts.map((s) => `<script src="${s}?v=${ASSET_V}" defer></script>`).join('\n')}
</body>
</html>`;
}

export function fmtDate(d) {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// 1 2 3 … 8 9, con flechas
const DLSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg>';

export function pagination(base, page, pages) {
  if (pages <= 1) return '';
  const url = (p) => (p === 1 ? base : `${base}${base.includes('?') ? '&' : '?'}page=${p}`);
  const set = new Set([1, pages]);
  for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= pages) set.add(p);
  const list = [...set].sort((a, b) => a - b);
  let out = '<nav class="pages" aria-label="Páginas">';
  if (page > 1) out += `<a href="${esc(url(page - 1))}" aria-label="Anterior">‹</a>`;
  let prev = 0;
  for (const p of list) {
    if (p - prev > 1) out += '<span class="gap">…</span>';
    out += p === page ? `<span class="cur">${p}</span>` : `<a href="${esc(url(p))}">${p}</a>`;
    prev = p;
  }
  if (page < pages) out += `<a href="${esc(url(page + 1))}" aria-label="Siguiente">›</a>`;
  return out + '</nav>';
}

export function tile(p, extra = '', dlToken = '') {
  const by = p.gname ? `Compartida por ${esc(p.gname)}` : '';
  const ts = p.taken_at || p.uploaded_at;
  const when = ts ? new Date(Number(ts)).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const ar = p.w && p.h ? ` style="--ar:${(p.w / p.h).toFixed(4)}"` : '';
  const det = `<div class="det">${by ? `<strong>${by}</strong>` : ''}${when ? `<span>${esc(when)}</span>` : ''}${p.w && p.h ? `<span>${p.w} × ${p.h} px</span>` : ''}</div>`;
  const dlb = dlToken ? `<a class="dlbtn" href="/e/${dlToken}/dl/${p.id}" download aria-label="Descargar foto" title="Descargar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/></svg></a><span class="pick" aria-hidden="true"></span>` : '';
  return `<figure class="gitem"${ar}><a class="tile" href="/m/${p.id}/l" data-id="${p.id}" data-full="/m/${p.id}/l">
  <img src="/m/${p.id}/m" loading="lazy" decoding="async" alt="" ${p.w && p.h ? `width="${p.w}" height="${p.h}"` : ''}>${extra}</a>${dlb}${by ? `<figcaption>${by}</figcaption>` : ''}${det}</figure>`;
}

export function lightbox(social = false, mod = false, selection = false) {
  const soc = social ? `<div class="lbsoc hidden" id="lbSoc"><div class="lbpanel hidden" id="lbPanel"><button type="button" class="lbclose" id="lbPanelX" aria-label="Cerrar comentarios">×</button><div class="lblist" id="lbList"></div><form id="lbForm" class="lbform"><input id="lbName" maxlength="40" placeholder="Tu nombre" autocomplete="nickname"><div class="lbrow"><input id="lbText" maxlength="500" placeholder="Escribe un comentario…" autocomplete="off" required><button class="btn sm primary" type="submit">Enviar</button></div></form></div><div class="lbbtns"><span class="lbeye" id="lbEye" title="Visualizaciones"></span><button type="button" id="lbLike" aria-label="Me gusta"></button><button type="button" id="lbCom" aria-label="Comentarios"></button></div></div>` : '';
  return `<div class="lb" id="lb" aria-hidden="true"><button class="x" aria-label="Cerrar">×</button><button class="prev" aria-label="Anterior">‹</button><img alt=""><button class="next" aria-label="Siguiente">›</button>${soc}${selection ? '<button type="button" class="lbsel" id="lbSel"></button>' : ''}${mod ? `<div class="lbmod" id="lbMod"><span class="lbst" id="lbSt"></span><button type="button" data-mod="approve"><u>A</u>probar</button><button type="button" data-mod="reject"><u>R</u>echazar</button><button type="button" data-mod="fav"><u>F</u>avorita</button></div>` : ''}</div>`;
}

function selectionUi() {
  return `<p class="selhint" id="selHint"><b>¿Cuáles te gustan más?</b> Toca el círculo de las fotos para elegirlas y, cuando termines, envía la lista al fotógrafo.</p>
<div class="glass selmine hidden" id="selMine"><span id="selMineN"></span><button type="button" class="btn sm primary" id="selSendOpen">Enviar al fotógrafo</button></div>
<dialog id="selSendDlg"><form class="dlg" id="selSendForm" method="dialog"><header><h2>Enviar mis favoritas</h2><button class="btn sm" type="button" data-close>Cerrar</button></header>
<div class="body"><p class="selinfo" id="selSendInfo"></p>
<label class="field"><span>Tu nombre</span><input class="txt" id="selName" maxlength="60" required autocomplete="name"></label>
<label class="field"><span>Tu email (opcional, por si quiere contestarte)</span><input class="txt" id="selEmail" type="email" maxlength="120" autocomplete="email"></label>
<label class="field"><span>Mensaje (opcional)</span><textarea class="txt" id="selNote" maxlength="1000" rows="3" placeholder="Por ejemplo: la primera me encanta para ampliarla"></textarea></label>
<p class="notice err hidden" id="selErr"></p>
<p class="notice hidden" id="selOk">¡Enviado! El fotógrafo ya tiene tu lista. Puedes seguir eligiendo y volver a enviarla.</p></div>
<footer><button type="button" class="btn" data-close>Cancelar</button><button type="submit" class="btn primary" id="selSendGo">Enviar lista</button></footer></form></dialog>`;
}

export function landingPage() {
  return layout({
    title: 'Picfy',
    body: `<main class="wrap narrow" style="padding:90px 16px;text-align:center"><div class="glass emptybox" style="padding:44px 24px">
<h1 style="font-size:3rem">Picfy</h1>
<p class="muted">Las fotos de todos, en un solo sitio.</p>
<p><a class="btn primary" href="/entrar">Entrar</a></p>
<p class="small muted">Si tienes un enlace de evento, ábrelo directamente.</p>
</div></main>`,
  });
}

export function notFoundPage(msg = 'No hemos encontrado esta página.') {
  return layout({
    title: 'No encontrado · Picfy',
    body: `<main class="wrap narrow" style="padding:90px 16px;text-align:center"><div class="glass emptybox" style="padding:40px 24px"><h1>Vaya…</h1><p class="muted">${esc(msg)}</p><a class="btn primary" href="/">Ir al inicio</a></div></main>`,
  });
}

export function accessPage(event, error = '') {
  return layout({
    title: `${event.name} · Picfy`,
    body: `<main class="wrap narrow" style="padding:90px 16px;text-align:center"><div class="glass emptybox" style="padding:36px 24px;max-width:420px;margin:0 auto">
<h1 style="margin-top:0">${esc(event.name)}</h1><p class="muted">Esta galería es privada. Escribe la contraseña que te han dado.</p>
${error ? `<div class="notice err">${esc(error)}</div>` : ''}
<form method="post" action="/e/${event.guest_token}/acceso" style="display:grid;gap:12px;margin-top:14px">
<input type="password" name="password" required autocomplete="current-password" placeholder="Contraseña" style="font:inherit;padding:.8em 1em;border-radius:12px;border:1px solid var(--line);text-align:center">
<button class="btn primary" type="submit">Entrar</button></form></div></main>`,
  });
}

/* ---------------- Administración ---------------- */

export function adminLoginPage(error = '') {
  return layout({
    title: 'Acceso · Picfy',
    body: `<main class="wrap narrow" style="padding:60px 16px">
<h1>Picfy · administración</h1>
${error ? `<div class="notice err">${esc(error)}</div>` : ''}
<form method="post" action="/admin/login" class="card">
<label class="field"><span>Contraseña</span><input type="password" name="password" autocomplete="current-password" autofocus required></label>
<button class="btn primary" type="submit">Entrar</button>
</form></main>`,
  });
}

export function adminDashboard(events, origin, note = '') {
  const rows = events
    .map(
      (e) => `<tr>
<td><strong>${esc(e.name)}</strong><br><span class="muted small">${esc(fmtDate(e.event_date))}</span></td>
<td>${e.approved} <span class="muted small">+ ${e.pending} pend.</span></td>
<td><a href="/e/${e.guest_token}" target="_blank" rel="noopener">Invitados</a></td>
<td>
<form method="post" action="/admin/events/${e.id}/regen" onsubmit="return confirm('Se creará un enlace nuevo de organizador y el anterior dejará de funcionar. ¿Seguir?')" style="display:inline"><button class="btn sm" type="submit">Enlace organizador</button></form>
<form method="post" action="/admin/events/${e.id}/delete" onsubmit="return confirm('Se borrará el evento y TODAS sus fotos. No se puede deshacer. ¿Seguir?')" style="display:inline"><button class="btn sm danger" type="submit">Borrar</button></form>
</td></tr>`,
    )
    .join('');
  return layout({
    title: 'Administración · Picfy',
    body: `<main class="wrap" style="padding:28px 16px 60px">
<div class="bar"><h1 style="margin:0">Eventos</h1><span class="spacer"></span>
<form method="post" action="/admin/logout"><button class="btn sm" type="submit">Salir</button></form></div>
${note ? `<div class="notice ok">${esc(note)}</div>` : ''}
<div class="card"><table><thead><tr><th>Evento</th><th>Fotos</th><th>Enlace</th><th></th></tr></thead>
<tbody>${rows || '<tr><td colspan="4" class="muted">Todavía no hay eventos.</td></tr>'}</tbody></table></div>
<div class="card"><h2>Nuevo evento</h2>
<form method="post" action="/admin/events">
<label class="field"><span>Nombre del evento</span><input type="text" name="name" maxlength="120" required placeholder="Boda de Ana y Luis"></label>
<div class="row2">
<label class="field"><span>Fecha</span><input type="date" name="event_date"></label>
<label class="field"><span>Máximo de fotos por invitado (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="0"></label>
</div>
<label class="field"><span>Texto de bienvenida</span><textarea name="lead" maxlength="400" placeholder="Los mejores recuerdos se viven juntos. Sube las fotos que hiciste para compartirlas con todos."></textarea></label>
<label class="field"><input type="checkbox" name="auto_approve" value="1" checked> Publicar las fotos automáticamente (si no, las revisas tú antes)</label>
<button class="btn primary" type="submit">Crear evento</button>
</form></div></main>`,
  });
}

export function adminCreated(event, guestUrl, manageUrl) {
  return layout({
    title: 'Evento creado · Picfy',
    scripts: ['/vendor/qrcode.js', '/qr.js'],
    body: `<main class="wrap narrow" style="padding:28px 16px 60px">
<h1>${esc(event.name)}</h1>
<div class="notice ok">Guarda el enlace del organizador ahora: por seguridad no se vuelve a mostrar (si lo pierdes puedes generar uno nuevo).</div>
<div class="card"><h2>Enlace para invitados</h2>
<div class="linkbox">${esc(guestUrl)}</div>
<div class="qr" data-qr="${esc(guestUrl)}"></div>
<p class="small muted">Compártelo o imprime el QR. Cualquiera con el enlace puede subir fotos.</p></div>
<div class="card"><h2>Enlace privado del organizador</h2>
<div class="linkbox">${esc(manageUrl)}</div>
<p class="small muted">Desde aquí moderas, ordenas, mueves fotos y descargas todo. No lo compartas.</p></div>
<a class="btn" href="/admin">Volver a eventos</a></main>`,
  });
}

/* ---------------- Invitados ---------------- */

export const DEFAULT_CONSENT = 'Confirmo que tengo permiso de las personas que aparecen en estas fotos (y, si son menores, de sus padres o tutores) para compartirlas aquí, y entiendo que el organizador podrá verlas y publicarlas en esta galería.';

export function uploadDialog(event = null, subs = [], consent = '') {
  const targets = event && subs.some((s) => s.upload_open) ? `<label class="field"><span>Subir a</span><select id="upTarget"><option value="${event.guest_token}" data-name="${esc(event.name)}">${esc(event.name)} (galería principal)</option>${subs.filter((s) => s.upload_open).map((s) => `<option value="${s.guest_token}" data-name="${esc(s.name)}">${esc(s.name)}</option>`).join('')}</select></label>` : '';
  return `<dialog id="upDlg"><div class="dlg">
<header><h2>Subir fotos</h2><button class="btn sm" id="upClose" type="button">Cerrar</button></header>
<div class="body">
${targets}
<label class="field namefield"><span>Tu nombre (opcional, aparece bajo tus fotos)</span><input type="text" id="guestName" maxlength="60" autocomplete="name"></label>
<div class="drop" id="drop">Toca para elegir fotos<br><span class="small">o arrástralas aquí</span></div>
<input type="file" id="fileInput" accept="image/*" multiple class="hidden">
<div class="up-tools hidden" id="upTools">
<button class="btn sm" type="button" id="upAll">Marcar todas</button>
<button class="btn sm danger" type="button" id="upRemove">Quitar marcadas</button>
<span class="muted small" id="upCount"></span>
</div>
<div class="up-list" id="upList"></div>
<div class="notice hidden" id="upMsg"></div>
${consent ? `<label class="check consent"><input type="checkbox" id="upConsent"> <span>${esc(consent)}</span></label>` : ''}
</div>
<footer>
<button class="btn primary" id="upStart" type="button" disabled>Subir</button>
</footer></div></dialog>`;
}

function subCards(subs) {
  if (!subs || !subs.length) return '';
  return `<section class="subs-g"><button type="button" class="cardbtn car-nav prev" aria-label="Anteriores" hidden>‹</button><button type="button" class="cardbtn car-nav next" aria-label="Siguientes" hidden>›</button><div class="subs-track">${subs.map((s) => `<div class="subwrap"><a class="subcard" href="/e/${s.guest_token}">
<span class="subimg"${s.thumb_v ? ` style="background-image:url('/c/${s.guest_token}/thumb?v=${s.thumb_v}')"` : s.first_id ? ` style="background-image:url('/m/${s.first_id}/m')"` : ''}></span>
<span class="subname">${esc(s.name)}</span>${s.lead ? `<span class="subdesc">${esc(s.lead)}</span>` : ''}<span class="subn">${s.n} ${s.n === 1 ? 'foto' : 'fotos'}</span></a><button type="button" class="cardbtn subshare" data-sharelink="/e/${s.guest_token}" aria-label="Compartir ${esc(s.name)}" title="Compartir enlace"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></div>`).join('')}</div></section>`;
}

export function guestPage({ event, photos, total, page, pages, subs = [], parent = null, dl = null, orden = '' }) {
  const grid = photos.length
    ? `<div class="gbar"><span class="gsub">${total} ${total === 1 ? 'foto' : 'fotos'}</span>${dl ? `<button type="button" class="gbtn" id="selToggle">Seleccionar</button><button type="button" class="gbtn" id="dlOpen">${DLSVG} Descargar</button>` : ''}<div class="gorder dd" id="gorder" data-value="${orden}"><button type="button" class="ddbtn" id="gorderBtn" aria-haspopup="listbox" aria-expanded="false"><span id="gorderLbl">${orden ? 'Ordenar por: ' + ({ recientes: 'Más recientes', antiguas: 'Más antiguas', nombre: 'Nombre', autor: 'Quién la compartió' })[orden] : 'Ordenar por'}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button><ul class="ddmenu hidden" role="listbox" aria-label="Ordenar por">${[['', 'Por defecto'], ['recientes', 'Más recientes primero'], ['antiguas', 'Más antiguas primero'], ['nombre', 'Por nombre de archivo'], ['autor', 'Por quién las compartió']].map(([k, t]) => `<li role="option" tabindex="-1" data-v="${k}" aria-selected="${orden === k}">${t}</li>`).join('')}</ul></div><label class="sizer" title="Tamaño de las fotos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/></svg><input type="range" id="gsize" min="0" max="100" value="50" aria-label="Tamaño de las fotos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/></svg></label><div class="vtog" role="group" aria-label="Vista"><button type="button" class="on" data-view="grid" aria-label="Cuadrícula"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg></button><button type="button" data-view="list" aria-label="Lineal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="7" rx="1"/><rect x="4" y="13" width="16" height="7" rx="1"/></svg></button></div></div><div class="grid gguest" id="gallery">${photos.map((p) => tile(p, '', dl ? event.guest_token : '')).join('')}</div>`
    : (subs && subs.length ? '' : `<div class="empty">Aún no hay fotos. ¡Sé el primero en subir una!</div>`);
  const base = `/e/${event.guest_token}${orden ? `?orden=${orden}` : ''}`;
  return layout({
    title: `${event.name} · Picfy`,
    bodyAttrs: `data-token="${event.guest_token}" data-limit="${event.photo_limit}" data-auto="${event.auto_approve}" data-social="${event.social === 0 ? 0 : 1}" data-selection="${event.selection ? 1 : 0}" style="${themeStyle(event.accent)}"`,
    scripts: ['/vendor/qrcode.js', '/qr.js', '/lightbox.js', '/social.js', '/views.js', '/selection.js', '/guest.js'],
    body: `${parent ? `<a class="backbtn" href="/e/${parent.guest_token}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg><span>${esc(parent.name)}</span></a>` : ''}
<header class="hero ${event.cover_v ? 'has-cover' : ''}">
${event.cover_v ? `<div class="hero-cover" style="background-image:url('/c/${event.guest_token}/cover?v=${event.cover_v}')"></div>` : ''}
<div class="hero-body">
${event.avatar_v ? `<img class="hero-avatar" src="/c/${event.guest_token}/avatar?v=${event.avatar_v}" alt="">` : ''}
<h1>${esc(event.name)}</h1>
${event.event_date ? `<p class="when">${esc(fmtDate(event.event_date))}</p>` : ''}
${event.lead ? `<p class="lead">${esc(event.lead)}</p>` : ''}
${event.upload_open ? `<button class="btn primary" id="openUpload" type="button">Subir fotos</button>` : '<p class="muted">La subida de fotos está cerrada.</p>'}
</div></header>
<main class="wrap">${subCards(subs)}${event.gallery_open ? grid + pagination(base, page, pages) : '<div class="empty">La galería no está disponible por ahora.</div>'}</main>
<p class="brand">Picfy</p>
${lightbox(event.social !== 0, false, Boolean(event.selection))}
${event.selection ? selectionUi() : ''}
${uploadDialog(event, subs, event.consent ? (event.consent_text || DEFAULT_CONSENT) : '')}
${dl ? `<div class="glass selbar hidden" id="gSelBar"><span id="gSelN">0 seleccionadas</span><button type="button" class="btn sm" id="gSelAll">Todas</button><button type="button" class="btn sm primary" id="gSelDl" disabled>Descargar</button><button type="button" class="btn sm" id="gSelCancel">Cancelar</button></div><dialog id="dlDlg"><div class="dlg"><header><h2>Descargar fotos</h2><button class="btn sm" type="button" data-close>Cerrar</button></header><div class="body"><p class="muted small">${dl.total} fotos en ${dl.parts} ${dl.parts === 1 ? 'archivo ZIP' : 'archivos ZIP'}. También puedes pulsar «Seleccionar» para elegir unas cuantas.</p>${Array.from({ length: dl.parts }, (_, k) => `<a class="btn ${k === 0 ? 'primary' : ''}" style="display:block;margin:8px 0;text-align:center" href="/e/${event.guest_token}/zip?part=${k + 1}">${dl.parts === 1 ? 'Descargar todas (ZIP)' : `Parte ${k + 1}: fotos ${k * dl.partSize + 1}–${Math.min(dl.total, (k + 1) * dl.partSize)}`}</a>`).join('')}</div></div></dialog>` : ''}
${subs.length ? `<dialog id="subShare"><div class="dlg"><header class="dlg-h"><h2 id="subShareName">Compartir</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header><div class="qrbox"><div class="qr" id="subQr"></div></div><div class="linkrow"><code id="subShareUrl"></code></div><footer class="sharefoot"><button class="btn primary" id="subCopy" type="button">Copiar enlace</button><button class="btn" id="subNative" type="button" hidden>Compartir…</button></footer></div></dialog>` : ''}`,
  });
}

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;

const BADGES = { pending: ['En revisión', 'warn'], rejected: ['No publicada', 'bad'] };

