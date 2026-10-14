// Pantallas de la plataforma (cuentas y galerías). Estilo: blanco, #edb265 y cristal.

import { esc } from './util.js';
import { layout, fmtDate, lightbox, uploadDialog } from './views.js';

const ICON = {
  gal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
};
export { ICON };

function appPage({ title, body, scripts = [], bodyAttrs = '' }) {
  return layout({
    title: `${title} · Picfy`,
    bodyAttrs,
    scripts,
    body,
  });
}

const logo = `<a class="logo" href="/galerias"><span class="logo-dot"></span>Picfy</a>`;

// Marco con barra superior y lateral de cristal
function shell({ user, active = 'galerias', crumbs = '', main, collapsible = false, side = '', noside = false }) {
  const initials = (user.name || user.email).trim().slice(0, 2).toUpperCase();
  return `<header class="top glass">
${logo}
<nav class="crumbs">${crumbs}</nav>
<span class="spacer"></span>
<div class="who"><a class="avatar${active === 'cuenta' ? ' on' : ''}" href="/cuenta" title="Mi cuenta · ${esc(user.email)}" aria-label="Mi cuenta"${user.avatar_v ? ` style="background-image:url('/cuenta/foto?v=${user.avatar_v}')"` : ''}>${user.avatar_v ? '' : esc(initials)}</a>
<form method="post" action="/salir"><button class="iconbtn" type="submit" title="Salir" aria-label="Salir">${ICON.out}</button></form></div>
</header>
<div class="frame${collapsible ? ' nav-collapsed' : ''}${noside ? ' no-side' : ''}">
${noside ? '' : `<aside class="side glass${collapsible ? ' collapsed' : ''}">
${collapsible ? '<button class="iconbtn navtoggle" type="button" id="navToggle" aria-expanded="false" aria-label="Mostrar u ocultar el menú" title="Mostrar u ocultar el menú"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>' : ''}
${side || `<p class="side-h">Gestiona tus fotos</p>
<a class="nav ${active === 'galerias' ? 'on' : ''}" href="/galerias">${ICON.gal}<span>Galerías</span></a>
<p class="side-h">Próximamente</p>
<span class="nav off">${ICON.lock}<span>Colecciones</span></span>
<span class="nav off">${ICON.lock}<span>Papelera</span></span>`}
</aside>`}
<main class="main">${main}</main>
</div>`;
}

/* ---------- Entrar / crear cuenta ---------- */

export function authPage({ mode = 'login', error = '', email = '', name = '', needCode = false, firstUser = false }) {
  const login = mode === 'login';
  return appPage({
    title: login ? 'Entrar' : 'Crear cuenta',
    body: `<main class="auth">
<div class="glass auth-card">
${logo}
<h1>${login ? 'Entra en tu espacio' : 'Crea tu cuenta'}</h1>
<p class="muted">${login ? 'Tus galerías, tus fotos, todo en un sitio.' : firstUser ? 'Serás la primera persona de la plataforma.' : 'Solo con invitación.'}</p>
${error ? `<div class="alert">${esc(error)}</div>` : ''}
<form method="post" action="${login ? '/entrar' : '/registro'}">
${login ? '' : `<label class="field"><span>Nombre</span><input type="text" name="name" value="${esc(name)}" maxlength="80" autocomplete="name" required></label>`}
<label class="field"><span>Correo electrónico</span><input type="text" inputmode="email" name="email" value="${esc(email)}" maxlength="254" autocomplete="email" required ${login ? 'autofocus' : ''}></label>
<label class="field"><span>Contraseña${login ? '' : ' (mínimo 8 caracteres)'}</span><input type="password" name="password" autocomplete="${login ? 'current-password' : 'new-password'}" minlength="${login ? 1 : 8}" required></label>
${!login && needCode ? `<label class="field"><span>Código de invitación</span><input type="text" name="code" autocomplete="off" required></label>` : ''}
<button class="btn primary block" type="submit">${login ? 'Entrar' : 'Crear cuenta'}</button>
</form>
<p class="switch">${login ? '¿Todavía no tienes cuenta? <a href="/registro">Crear cuenta</a>' : '¿Ya tienes cuenta? <a href="/entrar">Entrar</a>'}</p>
</div></main>`,
  });
}


const SWATCHES = ['#edb265', '#e4572e', '#d6402f', '#c9376e', '#7b4ae2', '#2f6fed', '#1ba5b8', '#2f9e5f', '#222222'];

// Campos de personalización (se usan al crear y al editar una galería)
function brandFields(event = null) {
  const accent = (event && event.accent) || '#edb265';
  const cover = event && event.cover_v ? `/c/${event.guest_token}/cover?v=${event.cover_v}` : '';
  const avatar = event && event.avatar_v ? `/c/${event.guest_token}/avatar?v=${event.avatar_v}` : '';
  return `<fieldset class="brand" data-brand data-accent-default="#edb265">
<legend>Personalización de la página de invitados</legend>
<div class="bprev" aria-hidden="true">
<div class="bp-cover" ${cover ? `style="background-image:url('${cover}')"` : ''}></div>
<div class="bp-body"><div class="bp-avatar" ${avatar ? `style="background-image:url('${avatar}')"` : ''}></div><b class="bp-title">Así se verá</b><span class="bp-btn">Subir fotos</span></div>
</div>
<div class="brow">
<label class="field"><span>Color de los botones</span>
<span class="swrow"><input type="color" name="accent" value="${esc(accent)}" aria-label="Color de los botones">
${SWATCHES.map((c) => `<button type="button" class="sw" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}</span></label>
</div>
<div class="brow two">
<label class="field"><span>Foto de perfil</span><input type="file" accept="image/*" data-brand-file="avatar">
${avatar ? '<label class="check"><input type="checkbox" data-brand-remove="avatar"> Quitar la foto actual</label>' : ''}</label>
<label class="field"><span>Foto de cabecera</span><input type="file" accept="image/*" data-brand-file="cover">
${cover ? '<label class="check"><input type="checkbox" data-brand-remove="cover"> Quitar la foto actual</label>' : ''}</label>
</div>
</fieldset>`;
}

/* ---------- Galerías ---------- */

export function galleriesPage({ user, events, origin, defaults = {} }) {
  const cards = events
    .map(
      (e) => `<a class="gcard glass" href="/galerias/${e.id}" data-name="${esc(e.name.toLowerCase())}">
<div class="cover">${e.cover ? `<img src="/m/${e.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.gal}</span>`}
${e.pending ? `<span class="chip warn">${e.pending} por revisar</span>` : ''}${e.subs ? `<span class="chip subc">${e.subs} subgalería${e.subs === 1 ? '' : 's'}</span>` : ''}</div>
<div class="gmeta"><strong>${esc(e.name)}</strong><span>${e.approved}</span></div>
${e.event_date ? `<div class="gdate">${esc(fmtDate(e.event_date))}</div>` : ''}
</a>`,
    )
    .join('');
  return appPage({
    title: 'Galerías',
    scripts: ['/app.js', '/brand.js'],
    body: shell({
      user,
      crumbs: '',
      main: `<div class="head"><div><h1>Galerías</h1><p class="muted">Aquí ves tus galerías o creas otras nuevas.</p></div>
<input class="search glass" type="search" id="filter" placeholder="Filtrar" aria-label="Filtrar galerías"></div>
<button class="btn primary" id="newGal" type="button">${ICON.plus} Crear una nueva galería</button>
<h2 class="sec">Tus galerías</h2>
${events.length ? `<div class="gcards" id="gcards">${cards}</div><p class="muted hidden" id="noMatch">Ninguna galería coincide.</p>` : `<div class="glass emptybox">Todavía no tienes galerías. Crea la primera y comparte el enlace con tus invitados.</div>`}
<dialog id="newDlg" class="glassdlg wide"><form method="post" action="/galerias" class="dlgbox" data-brand-form="create">
<header><h2>Crear una nueva galería</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Título de la galería</span><input type="text" name="name" maxlength="120" required placeholder="Boda de Ana y Luis"></label>
<div class="row2">
<label class="field"><span>Fecha (opcional)</span><input type="date" name="event_date"></label>
<label class="field"><span>Máx. fotos por persona (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="${defaults.photo_limit || 0}"></label>
</div>
<label class="field"><span>Mensaje de bienvenida (opcional)</span><textarea name="lead" maxlength="400" placeholder="Los mejores recuerdos se viven juntos. Sube las fotos que hiciste."></textarea></label>
<label class="check"><input type="checkbox" name="auto_approve" value="1" ${defaults.auto_approve === 0 ? '' : 'checked'}> Publicar las fotos al subirlas (si no, las revisas tú antes)</label>
${brandFields(defaults.accent ? { accent: defaults.accent } : null)}
<div class="notice err hidden" data-brand-msg></div>
<footer><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Crear y abrir</button></footer>
</form></dialog>`,
    }),
  });
}

/* ---------- Una galería ---------- */

const FLAG_NAMES = { red: 'Roja', orange: 'Naranja', green: 'Verde', black: 'Negra' };
const flagDot = (f) => `<span class="fdot ${f}"></span>`;

export function galleryPage({ user, event, photos, subs = [], parent = null, guests, counts, origin, partSize, zipParts, folders = [], note = '' }) {
  const guestUrl = `${origin}/e/${event.guest_token}`;
  const gname = new Map(guests.map((g) => [g.id, g.name || `Invitado ${g.id.slice(0, 4)}`]));
  const tiles = photos
    .map((p) => `<div class="tile ph" data-id="${p.id}" data-full="/m/${p.id}/l" data-state="${p.state}" data-flag="${p.flag || ''}" data-fav="${p.fav ? 1 : 0}" data-name="${esc((p.filename || '').toLowerCase())}" title="${esc(gname.get(p.guest_id) || '')}${p.event_id !== event.id && p.ename ? ' · ' + esc(p.ename) : ''}">
${p.event_id !== event.id && p.ename ? `<span class="sedechip">${esc(p.ename)}</span>` : ''}
<input class="chk" type="checkbox" aria-label="Seleccionar foto">
<img src="/m/${p.id}/m" loading="lazy" decoding="async" alt="">
<button class="mk flagb" type="button" data-mk="flag" aria-label="Bandera">${ICON.flag}</button>
<button class="mk favb ${p.fav ? 'on' : ''}" type="button" data-mk="fav" aria-label="Favorita">${ICON.heart}</button>
${p.state !== 'approved' ? `<span class="st ${p.state}">${p.state === 'pending' ? 'En revisión' : 'No publicada'}</span>` : ''}
<span class="cap">${esc(p.filename || '')}</span></div>`)
    .join('');
  const flagBtns = ['red', 'orange', 'green', 'black'].map((f) => `<button type="button" class="ftoggle" data-f="${f}" title="${FLAG_NAMES[f]}" aria-label="Bandera ${FLAG_NAMES[f].toLowerCase()}">${ICON.flag.replace('<svg', `<svg class="fl ${f}"`)}</button>`).join('');
  const flagMenu = ['red', 'orange', 'green', 'black'].map((f) => `<button type="button" data-setflag="${f}">${flagDot(f)} ${FLAG_NAMES[f]}</button>`).join('') + `<button type="button" data-setflag="">Quitar bandera</button>`;
  const opts = guests.map((g) => `<option value="${g.id}">${esc(g.name || `Invitado ${g.id.slice(0, 4)}`)} (${g.n})</option>`).join('');
  const mode = event.sort_mode;
  const sel = (m, t) => `<option value="${m}" ${mode === m ? 'selected' : ''}>${t}</option>`;
  const zipList = zipParts.length
    ? zipParts.map((z, i) => `<a class="btn" href="/galerias/${event.id}/zip?part=${i + 1}">${zipParts.length > 1 ? `Parte ${i + 1} de ${zipParts.length} · ${z.count} fotos` : `Descargar todo · ${z.count} fotos`}</a>`).join('')
    : '<p class="muted">Todavía no hay fotos publicadas.</p>';
  return appPage({
    title: event.name,
    bodyAttrs: `data-gapi="/api/g/${event.id}" data-gid="${event.id}" data-part="${partSize}" data-token="${event.guest_token}" data-limit="0" data-auto="1" data-owner="1" data-owner-name="${esc(user.name || 'Organizador')}"`,
    scripts: ['/vendor/qrcode.js', '/qr.js', '/lightbox.js', '/reorder.js', '/app.js', '/guest.js', '/brand.js', '/gallery.js'],
    body: shell({
      user,
      collapsible: true,
      crumbs: `<a href="/galerias">Galerías</a><span>/</span>${parent ? `<a href="/galerias/${parent.id}">${esc(parent.name)}</a><span>/</span>` : ''}<b>${esc(event.name)}</b>`,
      main: `${note ? `<div class="alert ok">${esc(note)}</div>` : ''}
<div class="gwrap">
<aside class="gside glass" id="gside">
<h2>${esc(event.name)}</h2>
${event.event_date ? `<p class="muted small" style="margin:0">${esc(fmtDate(event.event_date))}</p>` : ''}
<div class="trio">
<button class="tool" type="button" data-open="setDlg">${ICON.cog}<span>Ajustes</span></button>
<a class="tool" href="/e/${event.guest_token}" target="_blank" rel="noopener">${ICON.eye}<span>Vista previa</span></a>
<button class="tool" type="button" id="openShare">${ICON.share}<span>Compartir</span></button>
</div>
<div class="sidebtns">
<button class="btn primary block" type="button" id="openUpload" title="Subir nuevos archivos" aria-label="Subir nuevos archivos">${ICON.up}<span class="lbl">Subir nuevos archivos</span></button>
<button class="btn block" type="button" data-open="zipDlg" title="Descargar ${counts.approved} archivos" aria-label="Descargar ${counts.approved} archivos">${ICON.down}<span class="lbl">Descargar ${counts.approved} archivos</span></button>
${counts.pending ? `<button class="btn" type="button" id="approveAll" title="Aprobar las ${counts.pending} pendientes" aria-label="Aprobar las ${counts.pending} pendientes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg><span class="lbl">Aprobar las ${counts.pending} pendientes</span><span class="badge">${counts.pending}</span></button>` : ''}
</div>
<dl class="stats"><div><dt>Publicadas</dt><dd>${counts.approved}</dd></div><div><dt>Por revisar</dt><dd>${counts.pending}</dd></div></dl>
<h3 class="gh">Filtro</h3>
<input class="search2" type="search" id="fName" placeholder="Nombre del archivo" aria-label="Filtrar por nombre">
<div class="fbar" id="fFlags">${flagBtns}<button type="button" class="ftoggle" id="fFav" title="Favoritas" aria-label="Solo favoritas">${ICON.heart}</button></div>
<select id="fState" aria-label="Estado"><option value="">Todas las fotos</option><option value="approved">Publicadas</option><option value="pending">En revisión</option><option value="rejected">No publicadas</option></select>
<h3 class="gh">Disposición</h3>
<label class="field"><span>Ordenar por…</span>
<select id="sortBy">${sel('time', 'Hora de captura')}${sel('time_desc', 'Más recientes primero')}${sel('name', 'Nombre del archivo')}${mode === 'manual' ? sel('manual', 'Orden manual') : ''}</select></label>
<label class="size-ctl">Tamaño <input type="range" id="size" min="90" max="320" value="170"></label>
<p class="muted small" style="margin:0">Arrastra las fotos para ordenarlas a mano. Estira un rectángulo para seleccionar varias.</p>
</aside>
<section class="gmain">
${event.parent_id ? '' : `<div class="subs"><div class="bar"><h2 class="sec" style="margin:0">Subgalerías</h2><span class="spacer"></span><button class="btn sm" type="button" data-open="subDlg">${ICON.plus} Crear subgalería</button></div>
<form method="post" action="/galerias/${event.id}/mostrar-subs" class="subtog"><label class="check"><input type="checkbox" name="show_subs" value="1" ${event.show_subs ? 'checked' : ''} onchange="this.form.submit()"> Mostrarlas en la página de invitados</label></form>
${subs.length ? `<div class="gcards small">${subs.map((s) => `<div class="gcard-wrap"><a class="gcard glass" href="/galerias/${s.id}"><div class="cover">${s.thumb_v ? `<img src="/c/${s.guest_token}/thumb?v=${s.thumb_v}" alt="" loading="lazy">` : s.cover ? `<img src="/m/${s.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.gal}</span>`}${s.pending ? `<span class="chip warn">${s.pending} por revisar</span>` : ''}</div><div class="gmeta"><strong>${esc(s.name)}</strong><span>${s.approved}</span></div></a>
${s.is_private ? `<span class="privchip" title="Privada: no sale en la galería general">${ICON.lock} Privada${s.has_pw ? ' · con contraseña' : ''}</span>` : ''}
<div class="cardtools"><button type="button" class="cardbtn" data-sharelink="/e/${s.guest_token}" data-sharename="${esc(s.name)}" title="Compartir enlace" aria-label="Compartir ${esc(s.name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></button><label class="cardbtn wide" title="Elegir la imagen del cuadro" aria-label="Elegir portada de ${esc(s.name)}">${ICON.up}<span>Portada</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-thumb="${s.id}"></label>${s.thumb_v ? `<button type="button" class="cardbtn" data-thumbdel="${s.id}" title="Quitar portada" aria-label="Quitar portada">${ICON.trash}</button>` : ''}</div></div>`).join('')}</div>` : `<p class="muted small" style="margin:8px 0 0">Una subgalería tiene su propio enlace, moderación y descarga. Úsala, por ejemplo, para cada sede de un torneo.</p>`}</div>`}
<div class="gtools"><span class="muted small" id="shown">${photos.length} fotos</span><span class="spacer"></span><button class="btn sm" type="button" id="pickAll">Seleccionar todo</button></div>
${photos.length ? `<div class="grid sort-grid pgrid2" id="sortGrid" style="--tile:170px">${tiles}</div><p class="muted hidden" id="noMatch2">Ninguna foto coincide con el filtro.</p>` : `<div class="glass emptybox">Esta galería todavía no tiene fotos. Comparte el enlace para que tus invitados suban las suyas.</div>`}
</section></div>

<div class="selbar glass hidden" id="selbar" role="toolbar" aria-label="Acciones sobre la selección">
<b id="selN">0</b>
<span class="sepv"></span>
<button class="sb" type="button" data-act="approve" title="Aprobar">Aprobar</button>
<button class="sb" type="button" data-act="reject" title="Quitar de la galería">Rechazar</button>
<span class="sepv"></span>
<span class="menuwrap"><button class="sb ic" type="button" id="flagMenuBtn" title="Bandera" aria-label="Bandera">${ICON.flag}</button><div class="menu glass hidden" id="flagMenu">${flagMenu}</div></span>
<button class="sb ic" type="button" data-act="fav" title="Favorita" aria-label="Favorita">${ICON.heart}</button>
${folders.length > 1 ? `<select id="folderTo" aria-label="Mover a carpeta"><option value="">Mover a…</option>${folders.map((f) => `<option value="${f.id}">${f.parent_id ? esc(f.name) : esc(f.name) + ' (principal)'}</option>`).join('')}</select>` : ''}
${event.parent_id ? `<button class="sb" type="button" id="asCover" title="Usar la foto seleccionada como portada del cuadro de esta subgalería">Usar de portada</button>` : ''}
${guests.length ? `<select id="moveTo" aria-label="Pasar al álbum de…"><option value="">Pasar al álbum de…</option>${opts}</select>` : ''}
<button class="sb ic" type="button" data-act="download" title="Descargar" aria-label="Descargar">${ICON.down}</button>
<button class="sb ic danger" type="button" data-act="delete" title="Borrar" aria-label="Borrar">${ICON.trash}</button>
<button class="sb ic" type="button" data-act="clear" title="Quitar selección" aria-label="Quitar selección">×</button>
</div>

<dialog id="shareDlg" class="glassdlg"><div class="dlgbox">
<header><h2>Compartir galería</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<p class="muted">Copia el enlace y envíaselo a tus invitados. Cualquiera con el enlace puede subir fotos.</p>
<div class="linkbox" id="guestLink">${esc(guestUrl)}</div>
<div class="sharerow"><button class="btn primary" type="button" id="copyLink">Copiar enlace</button></div>
<div class="qr" data-qr="${esc(guestUrl)}"></div>
</div></dialog>

${uploadDialog(event.parent_id ? null : event, subs.map((s) => ({ ...s, upload_open: 1 })))}

<dialog id="subDlg" class="glassdlg"><form method="post" action="/galerias/${event.id}/sub" class="dlgbox">
<header><h2>Crear subgalería</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Nombre (por ejemplo, la sede)</span><input type="text" name="name" maxlength="120" required placeholder="Sede Norte"></label>
<label class="field"><span>Descripción (opcional, sale bajo el nombre en su página)</span><textarea name="lead" maxlength="400" placeholder="Ej.: Pabellón municipal, sábado por la mañana"></textarea></label>
<footer><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Crear y abrir</button></footer>
</form></dialog>

<dialog id="zipDlg" class="glassdlg"><div class="dlgbox">
<header><h2>Descargar</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<p class="muted">Fotos originales publicadas, en el orden de la galería. En galerías grandes se reparten en varias partes.</p>
<div class="zips">${zipList}</div>
</div></dialog>

<dialog id="setDlg" class="glassdlg wide"><form method="post" action="/galerias/${event.id}/ajustes" class="dlgbox" data-brand-form="settings" data-gapi="/api/g/${event.id}">
<header><h2>Configuración</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Nombre</span><input type="text" name="name" maxlength="120" value="${esc(event.name)}" required></label>
<div class="row2">
<label class="field"><span>Fecha</span><input type="date" name="event_date" value="${esc(event.event_date || '')}"></label>
<label class="field"><span>Máx. fotos por persona (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="${event.photo_limit}"></label>
</div>
<label class="field"><span>${event.parent_id ? 'Descripción de la subgalería' : 'Mensaje de bienvenida'}</span><textarea name="lead" maxlength="400">${esc(event.lead)}</textarea></label>
<label class="check"><input type="checkbox" name="auto_approve" value="1" ${event.auto_approve ? 'checked' : ''}> Publicar las fotos al subirlas</label>
<label class="check"><input type="checkbox" name="upload_open" value="1" ${event.upload_open ? 'checked' : ''}> Subida de fotos abierta</label>
<label class="check"><input type="checkbox" name="gallery_open" value="1" ${event.gallery_open ? 'checked' : ''}> Galería visible para los invitados</label>
<label class="check"><input type="checkbox" name="allow_download" value="1" ${event.allow_download ? 'checked' : ''}> Permitir que los invitados descarguen fotos (una a una, selección o ZIP)${event.parent_id ? '' : ' · se aplica también a las subgalerías'}</label>
${!event.parent_id ? `<label class="check"><input type="checkbox" name="show_subs" value="1" ${event.show_subs ? 'checked' : ''}> Mostrar las subgalerías en la página de invitados${subs.length ? '' : ' (aún no hay ninguna)'}</label>` : ''}
${event.parent_id ? `<fieldset class="privbox"><legend>Privacidad</legend>
<label class="check"><input type="checkbox" name="is_private" value="1" ${event.is_private ? 'checked' : ''}> Subgalería privada: no sale en la galería general ni en su lista de sedes; solo se entra con su enlace</label>
<label class="field"><span>Contraseña de acceso (opcional)${event.access_hash ? ' · ya hay una puesta; escribe otra para cambiarla' : ''}</span><input type="text" name="access_password" maxlength="60" autocomplete="off" placeholder="${event.access_hash ? 'Nueva contraseña' : 'Sin contraseña'}"></label>
${event.access_hash ? '<label class="check"><input type="checkbox" name="access_clear" value="1"> Quitar la contraseña</label>' : ''}
<p class="muted small" style="margin:0">Ideal para fotos de menores: manda el enlace (y la contraseña) solo a sus familias, y activa «Permitir que los invitados descarguen fotos» si quieres que se las bajen.</p></fieldset>` : ''}
${brandFields(event)}
<div class="notice err hidden" data-brand-msg></div>
<footer>
<button class="btn danger" type="submit" formaction="/galerias/${event.id}/borrar" formnovalidate data-nobrand onclick="return confirm('${event.parent_id ? 'Se borrará esta subgalería. Sus fotos NO se borran: pasan a la galería principal. ¿Seguir?' : 'Se borrará la galería, sus subgalerías y TODAS sus fotos. No se puede deshacer. ¿Seguir?'}')">${ICON.trash} ${event.parent_id ? 'Borrar subgalería' : 'Borrar galería'}</button>
<span class="spacer"></span>
<button class="btn primary" type="submit">Guardar</button></footer>
</form></dialog>
${lightbox()}`,
    }),
  });
}


/* ---------- Mi cuenta ---------- */

export function accountPage({ user, section = 'datos', ok = '', error = '', defaults = {}, stats = {} }) {
  const tab = (k, label) => `<a class="tab ${section === k ? 'on' : ''}" href="/cuenta/${k}">${label}</a>`;
  const full = [user.name, user.surname].filter(Boolean).join(' ') || user.email;
  const initials = ((user.name || user.email)[0] + (user.surname ? user.surname[0] : '')).toUpperCase();
  const since = user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '';
  const msg = `${ok ? `<div class="notice ok">${esc(ok)}</div>` : ''}${error ? `<div class="notice err">${esc(error)}</div>` : ''}`;
  const d = defaults;
  const forms = {
    datos: `<section class="glass card-s"><h2>Datos personales</h2><p class="muted">Así te ven tus invitados cuando suben fotos desde tu enlace.</p>
<form method="post" action="/cuenta/datos">
<label class="field"><span>Nombre</span><input type="text" name="name" value="${esc(user.name || '')}" maxlength="80" autocomplete="given-name" required></label>
<label class="field"><span>Apellidos</span><input type="text" name="surname" value="${esc(user.surname || '')}" maxlength="120" autocomplete="family-name"></label>
<footer class="rowend"><button class="btn primary" type="submit">Guardar cambios</button></footer></form></section>
<section class="glass card-s"><h2>Correo electrónico</h2><p class="muted">Es con el que entras. Para cambiarlo confirmamos tu contraseña.</p>
<form method="post" action="/cuenta/correo">
<label class="field"><span>Dirección de correo</span><input type="text" inputmode="email" name="email" value="${esc(user.email)}" maxlength="254" autocomplete="email" required></label>
<label class="field"><span>Contraseña actual</span><input type="password" name="current" autocomplete="current-password" required></label>
<footer class="rowend"><button class="btn primary" type="submit">Guardar cambios</button></footer></form></section>`,
    password: `<section class="glass card-s"><h2>Cambiar la contraseña</h2>
<form method="post" action="/cuenta/password">
<label class="field"><span>Contraseña actual</span><input type="password" name="current" autocomplete="current-password" required></label>
<label class="field"><span>Nueva contraseña (mínimo 8 caracteres)</span><input type="password" name="password" minlength="8" autocomplete="new-password" required></label>
<label class="field"><span>Repite la nueva contraseña</span><input type="password" name="password2" minlength="8" autocomplete="new-password" required></label>
<footer class="rowend"><button class="btn primary" type="submit">Cambiar contraseña</button></footer></form></section>
<section class="glass card-s tips"><h2>Para tu seguridad</h2>
<ul><li>Usa una contraseña que no tengas en ningún otro sitio.</li><li>Al cambiarla se cierran las sesiones abiertas en otros dispositivos.</li><li>Nunca guardamos tu contraseña, solo una huella que no se puede deshacer.</li></ul></section>`,
    galerias: `<section class="glass card-s span2"><h2>Valores predeterminados de las galerías</h2>
<p class="muted">Se aplican a las galerías que crees a partir de ahora. Las que ya tienes no cambian.</p>
<form method="post" action="/cuenta/galerias" class="defgrid">
<div>
<label class="field"><span>Color de acento</span><input type="color" name="accent" value="${esc(d.accent || '#edb265')}" class="colorin"></label>
<label class="field"><span>Máx. fotos por persona (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="${d.photo_limit || 0}"></label>
</div>
<div class="checks">
<label class="check"><input type="checkbox" name="auto_approve" value="1" ${d.auto_approve === 0 ? '' : 'checked'}> Publicar las fotos al subirlas (si no, las revisas tú antes)</label>
<label class="check"><input type="checkbox" name="allow_download" value="1" ${d.allow_download ? 'checked' : ''}> Permitir que los invitados descarguen las fotos</label>
<label class="check"><input type="checkbox" name="show_subs" value="1" ${d.show_subs ? 'checked' : ''}> Mostrar las subgalerías en la página de invitados</label>
</div>
<footer class="rowend span2"><button class="btn primary" type="submit">Guardar cambios</button></footer></form></section>`,
  };
  return appPage({
    title: 'Mi cuenta',
    scripts: ['/account.js'],
    body: shell({
      user, active: 'cuenta', noside: true,
      crumbs: '<a href="/galerias">Galerías</a><span class="sep">/</span><b>Mi cuenta</b>',
      main: `<a class="backlink" href="/galerias">← Volver a mis galerías</a>
<div class="prof glass">
<div class="prof-avbox"><span class="prof-av" id="profAv"${user.avatar_v ? ` style="background-image:url('/cuenta/foto?v=${user.avatar_v}')"` : ''}>${user.avatar_v ? '' : esc(initials)}</span>
<label class="avedit" title="Cambiar la foto de perfil" aria-label="Cambiar la foto de perfil">${ICON.up}<input type="file" id="avFile" accept="image/jpeg,image/png,image/webp" hidden></label>
${user.avatar_v ? '<button class="avdel" type="button" id="avDel" title="Quitar la foto" aria-label="Quitar la foto">×</button>' : ''}</div>
<div class="prof-id"><h1>${esc(full)}</h1><p>${esc(user.email)}</p>${since ? `<p class="since">Con Picfy desde ${esc(since)}</p>` : ''}</div>
<div class="prof-stats"><div><b>${stats.galleries || 0}</b><span>Galerías</span></div><div><b>${stats.photos || 0}</b><span>Fotos</span></div></div>
<div class="prof-act"><form method="post" action="/salir"><button class="btn" type="submit">${ICON.out} Cerrar sesión</button></form></div>
</div>
<div class="notice err hidden" id="avMsg"></div>
<nav class="tabs" aria-label="Mi cuenta">${tab('datos', 'Datos y correo')}${tab('password', 'Contraseña')}${tab('galerias', 'Galerías nuevas')}</nav>
${msg}<div class="accgrid">${forms[section] || forms.datos}</div>`,
    }),
  });
}
