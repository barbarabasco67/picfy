// Pantallas de la plataforma (cuentas y galerías). Estilo: blanco, #edb265 y cristal.

import { esc, glink } from './util.js';
import { layout, fmtDate, lightbox, uploadDialog, DEFAULT_CONSENT } from './views.js';

const ICON = {
  gal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 100 18c1.4 0 2-.9 2-1.8 0-1.2-1-1.6-1-2.7 0-1 .8-1.5 1.8-1.5H17a4 4 0 004-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/></svg>',
  pipette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.7 3.3a2.4 2.4 0 00-3.4 0l-3 3-1-1-1.4 1.4 1 1L4 15.6V20h4.4l8.2-8.2 1 1 1.4-1.4-1-1 3-3a2.4 2.4 0 000-3.4z"/></svg>',
  coll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="14" height="14" rx="2"/><path d="M3 7v12a2 2 0 002 2h12"/></svg>',
  habit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
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
<a class="nav ${active === 'colecciones' ? 'on' : ''}" href="/colecciones">${ICON.coll}<span>Colecciones</span></a>
<p class="side-h" style="margin-top:14px">Tu trabajo</p>
<a class="nav ${active === 'agenda' ? 'on' : ''}" href="/agenda">${ICON.cal}<span>Agenda</span></a>
<a class="nav trashnav ${active === 'papelera' ? 'on' : ''}" href="/papelera">${ICON.trash}<span>Papelera</span></a>`}
</aside>`}
<main class="main">${main}</main>
</div>`;
}

/* ---------- Entrar / crear cuenta (una sola pantalla con dos pestañas) ---------- */

const GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';

function authForm(mode, { error, email, name }) {
  const login = mode === 'login';
  return `<form class="au-form" method="post" action="${login ? '/entrar' : '/registro'}" data-mode="${mode}">
${error ? `<div class="alert" role="alert">${esc(error)}</div>` : ''}
${login ? '' : `<label class="au-field"><span>Nombre</span><input type="text" name="name" value="${esc(name)}" maxlength="80" autocomplete="name" required></label>`}
<label class="au-field"><span>Correo electrónico</span><input type="text" inputmode="email" name="email" value="${esc(email)}" maxlength="254" autocomplete="email" required></label>
<label class="au-field"><span>Contraseña</span><span class="au-pw"><input type="password" name="password" autocomplete="${login ? 'current-password' : 'new-password'}" minlength="${login ? 1 : 8}" required placeholder="${login ? '' : 'Mínimo 8 caracteres'}"><button type="button" class="au-eye" aria-label="Mostrar la contraseña">${EYE}</button></span></label>
<button class="au-submit" type="submit">${login ? 'Entrar' : 'Crear cuenta'}</button>
</form>`;
}

export function authPage({ mode = 'login', error = '', email = '', name = '', google = false }) {
  const login = mode === 'login';
  const other = login ? 'signup' : 'login';
  const act = { error, email, name }, idle = { error: '', email: '', name: '' };
  const tile = (cls, g) => `<i class="au-tile ${cls}" style="--g:${g}"><b></b></i>`;
  return appPage({
    title: login ? 'Entrar' : 'Crear cuenta',
    scripts: ['/auth.js'],
    body: `<main class="au">
<section class="au-art" aria-hidden="true">
<a class="au-logo" href="/"><span class="logo-dot"></span>Picfy</a>
<div class="au-collage">
${tile('t1', 'linear-gradient(160deg,#f6c27b,#d9703a 55%,#7a2f2a)')}${tile('t2', 'linear-gradient(200deg,#7fb3c9,#3d6a8e 60%,#1d2f4a)')}${tile('t3', 'linear-gradient(150deg,#f3d9b8,#e0a56a 50%,#b46a3a)')}${tile('t4', 'linear-gradient(190deg,#e7a0a8,#b9456a 60%,#4a1f3a)')}${tile('t5', 'linear-gradient(160deg,#9fd3b8,#3f8f73 60%,#173d33)')}${tile('t6', 'linear-gradient(200deg,#cdb8f0,#7b5cc4 60%,#2c1f5c)')}
</div>
</section>
<section class="au-pane"><div class="au-box">
<a class="au-logo dark" href="/"><span class="logo-dot"></span>Picfy</a>
<div class="au-tabs" role="tablist"><a href="/entrar" data-mode="login" role="tab" class="${login ? 'on' : ''}" aria-selected="${login}">Entrar</a><a href="/registro" data-mode="signup" role="tab" class="${login ? '' : 'on'}" aria-selected="${!login}">Crear cuenta</a></div>
<h1 class="au-h" id="auH" data-login="Bienvenido de nuevo" data-signup="Crea tu cuenta">${login ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
${google ? `<a class="au-google" href="/auth/google">${GOOGLE_G}Continuar con Google</a><div class="au-or"><span>o</span></div>` : ''}
<div id="auForms">${authForm(mode, act)}</div>
<template id="auOther" data-mode="${other}">${authForm(other, idle)}</template>
</div></section>
</main>`,
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
<div class="field colormod"><span>Color de los botones</span>
<span class="swrow"><input type="color" name="accent" value="${esc(accent)}" aria-label="Color de los botones">
${SWATCHES.map((c) => `<button type="button" class="sw" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}</span>
<div class="cmod">
<label class="cm"><span>HEX</span><input type="text" class="hexin" maxlength="7" spellcheck="false" autocomplete="off" value="${esc(accent)}" aria-label="Código HEX del color"></label>
<label class="cm"><span>R</span><input type="number" class="rgbin" data-ch="0" min="0" max="255" aria-label="Rojo"></label>
<label class="cm"><span>G</span><input type="number" class="rgbin" data-ch="1" min="0" max="255" aria-label="Verde"></label>
<label class="cm"><span>B</span><input type="number" class="rgbin" data-ch="2" min="0" max="255" aria-label="Azul"></label>
<button type="button" class="btn sm eyedrop" hidden title="Elige un color de cualquier parte de la pantalla">${ICON.pipette} Pipeta</button>
</div></div>
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

// Espacio: originales (exacto) + miniaturas (estimado, ~380 KB por foto: la de 480px y la de 1600px).
const THUMB_EST = 380 * 1024;
const FREE_BYTES = 10 * 1024 ** 3; // Cloudflare R2: 10 GB gratis al mes
const sizeOf = (bytes, n) => (Number(bytes) || 0) + (Number(n) || 0) * THUMB_EST;
export function fmtSize(b) {
  const u = b >= 1024 ** 3 ? [1024 ** 3, 'GB'] : b >= 1024 ** 2 ? [1024 ** 2, 'MB'] : [1024, 'KB'];
  const v = b / u[0];
  return `${v >= 100 || u[1] === 'KB' ? Math.round(v) : v.toFixed(1).replace('.', ',')} ${u[1]}`;
}
function storageBox(st) {
  if (!st) return '';
  const used = sizeOf(st.bytes, st.n);
  const pct = Math.min(100, (used / FREE_BYTES) * 100);
  const over = Math.max(0, used - FREE_BYTES);
  const cost = (over / 1024 ** 3) * 0.015;
  const state = over ? `Has pasado el espacio gratuito. Pagarías unos <b>${cost.toFixed(2).replace('.', ',')} $ al mes</b> por el exceso.`
    : pct >= 80 ? `Te acercas al límite gratuito: quedan ${fmtSize(FREE_BYTES - used)}.`
    : `Quedan ${fmtSize(FREE_BYTES - used)} dentro del espacio gratuito.`;
  return `<div class="glass storage"><div class="strow"><div><span class="stl">Espacio ocupado</span><strong class="stv">${fmtSize(used)}</strong><span class="muted small"> de ${fmtSize(FREE_BYTES)} gratis · ${st.n} fotos</span></div></div>
<div class="stbar${over ? ' over' : pct >= 80 ? ' warn' : ''}"><i style="width:${Math.max(pct, used ? 1.5 : 0).toFixed(1)}%"></i></div>
<p class="muted small" style="margin:8px 0 0">${state} Cloudflare cobra unos 0,015 $ por GB al mes pasados los 10 GB. Incluye los originales y una estimación de las miniaturas, y también lo que está en la papelera.</p></div>`;
}
export function galleriesPage({ user, events, origin, defaults = {}, ok = '', storage = null }) {
  const cards = events
    .map(
      (e) => `<a class="gcard glass" href="/galerias/${e.id}" data-name="${esc(e.name.toLowerCase())}">
<div class="cover">${e.cover ? `<img src="/m/${e.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.gal}</span>`}
${e.new_sel ? `<span class="chip newsel">${e.new_sel === 1 ? 'Selección nueva' : e.new_sel + ' selecciones nuevas'}</span>` : ''}${e.pending ? `<span class="chip warn">${e.pending} por revisar</span>` : ''}${e.subs ? `<span class="chip subc">${e.subs} subgalería${e.subs === 1 ? '' : 's'}</span>` : ''}</div>
<div class="gmeta"><strong>${esc(e.name)}</strong><span>${e.approved}</span></div>
<div class="gdate">${e.event_date ? esc(fmtDate(e.event_date)) + ' · ' : ''}${fmtSize(sizeOf(e.bytes, e.nph))}</div>
</a>`,
    )
    .join('');
  return appPage({
    title: 'Galerías',
    scripts: ['/app.js', '/brand.js', '/filepick.js'],
    body: shell({
      user,
      crumbs: '',
      main: `${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}<div class="head"><div><h1>Galerías</h1><p class="muted">Aquí ves tus galerías o creas otras nuevas.</p></div>
<input class="search glass" type="search" id="filter" placeholder="Filtrar" aria-label="Filtrar galerías"></div>
<button class="btn primary" id="newGal" type="button">${ICON.plus} Crear una nueva galería</button>
${storageBox(storage)}
<h2 class="sec">Tus galerías</h2>
${events.length ? `<div class="gcards" id="gcards">${cards}</div><p class="muted hidden" id="noMatch">Ninguna galería coincide.</p>` : `<div class="glass emptybox">Todavía no tienes galerías. Crea la primera y comparte el enlace con tus invitados.</div>`}
<dialog id="newDlg" class="glassdlg wide"><form method="post" action="/galerias" class="dlgbox" data-brand-form="create">
<header><h2>Crear una nueva galería</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<div class="dtabs" role="tablist"><button type="button" role="tab" class="on" data-dtab="aj">Datos</button><button type="button" role="tab" data-dtab="pe">Personalización</button></div>
<div data-dpanel="aj">
<label class="field"><span>Título de la galería</span><input type="text" name="name" maxlength="120" required placeholder="Boda de Ana y Luis"></label>
<div class="row2">
<label class="field"><span>Fecha (opcional)</span><input type="date" name="event_date"></label>
<label class="field"><span>Máx. fotos por persona (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="${defaults.photo_limit || 0}"></label>
</div>
<label class="field"><span>Mensaje de bienvenida (opcional)</span><textarea name="lead" maxlength="400" placeholder="Los mejores recuerdos se viven juntos. Sube las fotos que hiciste."></textarea></label>
<label class="check"><input type="checkbox" name="auto_approve" value="1" ${defaults.auto_approve === 0 ? '' : 'checked'}> Publicar las fotos al subirlas (si no, las revisas tú antes)</label>
</div>
<div data-dpanel="pe" hidden>
${brandFields(defaults.accent ? { accent: defaults.accent } : null)}
</div>
<div class="notice err hidden" data-brand-msg></div>
<footer><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Crear y abrir</button></footer>
</form></dialog>`,
    }),
  });
}

/* ---------- Una galería ---------- */

const FLAG_NAMES = { red: 'Roja', orange: 'Naranja', green: 'Verde', black: 'Negra' };
const flagDot = (f) => `<span class="fdot ${f}"></span>`;

function expiryBanner(event) {
  if (!event.expires_at) return '';
  const days = Math.ceil((event.expires_at - Date.now()) / 86400000);
  const when = new Date(event.expires_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const act = event.expire_delete ? 'Se borrará con todas sus fotos' : 'Dejará de verse y de aceptar fotos';
  if (event.expires_at < Date.now()) return `<div class="alert">Esta galería caducó el ${esc(when)}. Los invitados ya no pueden verla${event.expire_delete ? '; se borrará en la próxima limpieza automática' : ''}.</div>`;
  return `<div class="alert${days <= 7 ? '' : ' ok'}">Caduca el ${esc(when)} (${days <= 1 ? 'mañana o hoy' : `en ${days} días`}). ${act}.</div>`;
}

function selectionsDialog(sels) {
  if (!sels || !sels.ready) return '';
  const when = (ms) => new Date(Number(ms)).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const list = sels.sends.length ? sels.sends.map((r) => `<article class="selsend" data-ids="${r.ids.join(',')}">
<header><b>${esc(r.name || 'Sin nombre')}</b>${r.isnew ? '<span class="newsel">Nueva</span>' : ''}<span>${esc(when(r.created_at))} · ${r.n} ${r.n === 1 ? 'foto' : 'fotos'}${r.ename ? ' · ' + esc(r.ename) : ''}</span></header>
${r.email ? `<p class="muted small">${esc(r.email)}</p>` : ''}${r.note ? `<p class="selnote">${esc(r.note)}</p>` : ''}
<div class="stop">${r.ids.slice(0, 12).map((id) => `<div><img src="/m/${id}/m" alt="" loading="lazy"></div>`).join('')}${r.ids.length > 12 ? `<div class="more"><b>+${r.ids.length - 12}</b></div>` : ''}</div>
<div class="selacts"><button class="btn sm" type="button" data-selshow>Ver solo estas en la galería</button><button class="btn sm" type="button" data-selfav>Marcar como favoritas</button></div></article>`).join('') : '<p class="muted">Todavía no has recibido ninguna selección.</p>';
  return `<dialog id="selDlg" class="glassdlg wide"><div class="dlgbox"><header><h2>Selecciones del cliente</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>${list}</div></dialog>`;
}

function statsDialog(st) {
  if (!st) return '';
  const num = (n) => Number(n || 0).toLocaleString('es-ES');
  const max = Math.max(1, ...st.days.map((x) => x.views));
  const dl = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const barsOf = (arr, key) => { const mx = Math.max(1, ...arr.map((x) => x[key])); return arr.map((x) => `<div class="sbar" title="${esc(dl(x.d))}: ${x[key]}"><i style="height:${Math.round((x[key] / mx) * 100)}%"></i><span>${x.d.slice(8)}</span></div>`).join(''); };
  const bars = barsOf(st.days.map((x) => ({ d: x.d, v: x.views })), 'v');
  const upBars = st.up && st.up.length ? `<h3 class="gh">Fotos subidas por día</h3><div class="sbars">${barsOf(st.up, 'n')}</div>` : '';
  const dlBars = st.dl && st.dl.length ? `<h3 class="gh">Descargas por día</h3><div class="sbars">${barsOf(st.dl, 'n')}</div>` : '';
  const people = st.uploaders && st.uploaders.length ? `<h3 class="gh">Invitados que más suben</h3><ol class="upl">${st.uploaders.map((u) => `<li><span>${esc(u.name || 'Invitado ' + String(u.id).slice(0, 4))}</span><b>${num(u.n)}</b></li>`).join('')}</ol>` : '';
  const top = st.top.length ? `<h3 class="gh">Fotos más abiertas</h3><div class="stop">${st.top.map((t) => `<div><img src="/m/${t.id}/m" alt="" loading="lazy"><b>${num(t.n)}</b></div>`).join('')}</div>` : '';
  return `<dialog id="statsDlg" class="glassdlg wide"><div class="dlgbox">
<header><h2>Estadísticas</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
${st.ready ? '' : '<p class="notice">Las visitas aún no se están contando: falta activar el contador en la base de datos.</p>'}
${st.dlReady ? '' : '<p class="notice">Las descargas aún no se están contando: falta activar el contador en la base de datos.</p>'}
<div class="kpis"><div><dt>Visitas</dt><dd>${num(st.views)}</dd></div><div><dt>Visitantes</dt><dd>${num(st.visitors)}</dd></div><div><dt>Hoy</dt><dd>${num(st.today)}</dd></div><div><dt>Fotos</dt><dd>${num(st.photos)}</dd></div><div><dt>Invitados que suben</dt><dd>${num(st.uploadersN)}</dd></div><div><dt>Descargas</dt><dd>${num(st.downloads)}</dd></div><div><dt>Me gusta</dt><dd>${num(st.likes)}</dd></div><div><dt>Comentarios</dt><dd>${num(st.comments)}</dd></div></div>
<h3 class="gh">Visitas por día (últimos 14 días)</h3><div class="sbars">${bars}</div>
${upBars}
${dlBars}
${people}
${top}
</div></dialog>`;
}

const dayOf = (ms) => (ms ? new Date(Number(ms)).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }) : '');
const dayLabel = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

export function galleryPage({ wm = null, best = null, sels = null, stats = null, user, event, photos, subs = [], parent = null, guests, counts, origin, partSize, zipParts, folders = [], note = '' }) {
  const guestUrl = origin + glink(event);
  const gname = new Map(guests.map((g) => [g.id, g.name || `Invitado ${g.id.slice(0, 4)}`]));
  const tiles = photos
    .map((p) => `<div class="tile ph" data-id="${p.id}" data-full="/m/${p.id}/l" data-state="${p.state}" data-flag="${p.flag || ''}" data-fav="${p.fav ? 1 : 0}" data-name="${esc((p.filename || '').toLowerCase())}" data-guest="${p.guest_id}" data-day="${dayOf(p.ts)}" title="${esc(gname.get(p.guest_id) || '')}${p.event_id !== event.id && p.ename ? ' · ' + esc(p.ename) : ''}">
${p.event_id !== event.id && p.ename ? `<span class="sedechip">${esc(p.ename)}</span>` : ''}
<input class="chk" type="checkbox" aria-label="Seleccionar foto">
<img src="/m/${p.id}/l" loading="lazy" decoding="async" alt="">
<button class="mk flagb" type="button" data-mk="flag" aria-label="Bandera">${ICON.flag}</button>
<button class="mk favb ${p.fav ? 'on' : ''}" type="button" data-mk="fav" aria-label="Destacada" title="Destacada (mejor foto)">${ICON.heart}</button>
${p.state !== 'approved' ? `<span class="st ${p.state}">${p.state === 'pending' ? 'En revisión' : 'No publicada'}</span>` : ''}
<span class="soc"><i class="eye">${ICON.eye}${p.views || 0}</i>${p.likes ? `<i>♥ ${p.likes}</i>` : ''}${p.coms ? `<i>💬 ${p.coms}</i>` : ''}</span><span class="cap">${esc(p.filename || '')}</span></div>`)
    .join('');
  const dayCount = new Map(); photos.forEach((p) => { const d = dayOf(p.ts); if (d) dayCount.set(d, (dayCount.get(d) || 0) + 1); });
  const days = [...dayCount.entries()].sort();
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
    bodyAttrs: `data-gapi="/api/g/${event.id}" data-gid="${event.id}" data-part="${partSize}" data-token="${event.guest_token}" data-limit="0" data-auto="1" data-owner="1" data-owner-name="${esc(user.name || 'Organizador')}"${wm && wm.on ? ` data-wm="${esc(JSON.stringify({ on: 1, text: wm.text || wm.name || '', pos: wm.pos, op: wm.op, logoUrl: wm.logoUrl, rev: wm.rev }))}"` : ''}`,
    scripts: ['/vendor/qrcode.js', '/qr.js', '/lightbox.js', '/reorder.js', '/app.js', '/wm.js', '/guest.js', '/brand.js', '/filepick.js', '/gallery.js'],
    body: shell({
      user,
      collapsible: true,
      crumbs: `<a href="/galerias">Galerías</a><span>/</span>${parent ? `<a href="/galerias/${parent.id}">${esc(parent.name)}</a><span>/</span>` : ''}<b>${esc(event.name)}</b>`,
      main: `${note ? `<div class="alert ok">${esc(note)}</div>` : ''}${expiryBanner(event)}
<div class="gwrap">
<aside class="gside glass" id="gside">
<h2>${esc(event.name)}</h2>
${event.event_date ? `<p class="muted small" style="margin:0">${esc(fmtDate(event.event_date))}</p>` : ''}
<div class="trio">
<button class="tool" type="button" data-open="setDlg">${ICON.cog}<span>Ajustes</span></button>
<button class="tool" type="button" data-open="brandDlg">${ICON.brush}<span>Personalizar</span></button>
<a class="tool" href="${glink(event)}" target="_blank" rel="noopener">${ICON.eye}<span>Vista previa</span></a>
<button class="tool" type="button" id="openShare">${ICON.share}<span>Compartir</span></button>
</div>
<div class="sidebtns">
<button class="btn primary block" type="button" id="openUpload" title="Subir archivos" aria-label="Subir archivos">${ICON.up}<span class="lbl">Subir archivos</span></button>
<button class="btn block" type="button" data-open="zipDlg" title="Descargar ${counts.approved} archivos" aria-label="Descargar">${ICON.down}<span class="lbl">Descargar</span></button>
<button class="btn block" type="button" data-open="statsDlg" title="Estadísticas" aria-label="Estadísticas">${ICON.chart}<span class="lbl">Estadísticas</span></button>
${sels && sels.ready && (sels.sends.length || event.selection) ? `<button class="btn block" type="button" data-open="selDlg" title="Selecciones del cliente" aria-label="Selecciones del cliente">${ICON.heart}<span class="lbl">Selecciones${sels.sends.length ? ` (${sels.sends.length})` : ''}</span>${sels.newCount ? `<span class="newsel dot">${sels.newCount} ${sels.newCount === 1 ? 'nueva' : 'nuevas'}</span>` : ''}</button>` : ''}
${counts.pending ? `<button class="btn" type="button" id="showPending" title="Ver solo las pendientes">Revisar pendientes</button>` : ''}
${counts.pending ? `<button class="btn" type="button" id="approveAll" title="Aprobar las ${counts.pending} pendientes" aria-label="Aprobar las ${counts.pending} pendientes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg><span class="lbl">Aprobar las ${counts.pending} pendientes</span><span class="badge">${counts.pending}</span></button>` : ''}
</div>
<dl class="stats"><div><dt>Publicadas</dt><dd>${counts.approved}</dd></div><div><dt>Por revisar</dt><dd>${counts.pending}</dd></div></dl>
<h3 class="gh">Filtro</h3>
<input class="search2" type="search" id="fName" placeholder="Nombre del archivo" aria-label="Filtrar por nombre">
<div class="fbar" id="fFlags">${flagBtns}<button type="button" class="ftoggle" id="fFav" title="Solo destacadas" aria-label="Solo destacadas">${ICON.heart}</button></div>
${gname.size > 1 ? `<select id="fGuest" aria-label="Autor"><option value="">Todos los autores</option>${guests.map((g) => `<option value="${g.id}">${esc(g.name || `Invitado ${g.id.slice(0, 4)}`)} (${g.n})</option>`).join('')}</select>` : ''}
${days.length > 1 ? `<select id="fDay" aria-label="Día"><option value="">Todos los días</option>${days.map(([d, n]) => `<option value="${d}">${esc(dayLabel(d))} (${n})</option>`).join('')}</select>` : ''}
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
${subs.length ? `<div class="gcards small">${subs.map((s) => `<div class="gcard-wrap"><a class="gcard glass" href="/galerias/${s.id}"><div class="cover">${s.thumb_v ? `<img src="/c/${s.guest_token}/thumb?v=${s.thumb_v}" alt="" loading="lazy">` : s.cover ? `<img src="/m/${s.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.gal}</span>`}${s.new_sel ? `<span class="chip newsel">${s.new_sel === 1 ? 'Selección nueva' : s.new_sel + ' selecciones nuevas'}</span>` : ''}${s.pending ? `<span class="chip warn">${s.pending} por revisar</span>` : ''}</div><div class="gmeta"><strong>${esc(s.name)}</strong><span>${s.approved} · ${fmtSize(sizeOf(s.bytes, s.nph))}</span></div></a>
${s.is_private ? `<span class="privchip" title="Privada: no sale en la galería general">${ICON.lock} Privada${s.has_pw ? ' · con contraseña' : ''}</span>` : ''}
<div class="cardtools"><button type="button" class="cardbtn" data-sharelink="${glink(s)}" data-sharename="${esc(s.name)}" title="Compartir enlace" aria-label="Compartir ${esc(s.name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></button><label class="cardbtn wide" title="Elegir la imagen del cuadro" aria-label="Elegir portada de ${esc(s.name)}">${ICON.up}<span>Portada</span><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-thumb="${s.id}"></label>${s.thumb_v ? `<button type="button" class="cardbtn" data-thumbdel="${s.id}" title="Quitar portada" aria-label="Quitar portada">${ICON.trash}</button>` : ''}</div></div>`).join('')}</div>` : `<p class="muted small" style="margin:8px 0 0">Una subgalería tiene su propio enlace, moderación y descarga. Úsala, por ejemplo, para cada sede de un torneo.</p>`}</div>`}
<div class="gtools"><span class="muted small" id="shown">${photos.length} fotos</span><span class="spacer"></span><button class="btn sm" type="button" id="pickAll">Seleccionar todo</button></div>
${photos.length ? `<div class="grid sort-grid pgrid2" id="sortGrid">${tiles}</div><p class="muted hidden" id="noMatch2">Ninguna foto coincide con el filtro.</p>` : `<div class="glass emptybox">Esta galería todavía no tiene fotos. Comparte el enlace para que tus invitados suban las suyas.</div>`}
</section></div>

<div class="selbar glass hidden" id="selbar" role="toolbar" aria-label="Acciones sobre la selección">
<button class="sb ic" type="button" data-act="clear" title="Quitar selección" aria-label="Quitar selección">×</button>
<b id="selN">0</b>
<span class="sepv"></span>
<button class="sb" type="button" data-act="approve" title="Aprobar">Aprobar</button>
<button class="sb" type="button" data-act="reject" title="Quitar de la galería">Rechazar</button>
<span class="sepv"></span>
<span class="menuwrap"><button class="sb ic" type="button" id="flagMenuBtn" title="Bandera" aria-label="Bandera">${ICON.flag}</button><div class="menu glass hidden" id="flagMenu">${flagMenu}</div></span>
<button class="sb ic" type="button" data-act="fav" title="Destacar" aria-label="Destacar">${ICON.heart}</button>
${folders.length > 1 ? `<select id="folderTo" aria-label="Mover a carpeta"><option value="">Mover a…</option>${folders.map((f) => `<option value="${f.id}">${f.parent_id ? esc(f.name) : esc(f.name) + ' (principal)'}</option>`).join('')}</select>` : ''}
${event.parent_id ? `<button class="sb" type="button" id="asCover" title="Usar la foto seleccionada como portada del cuadro de esta subgalería">Usar de portada</button>` : ''}
${guests.length ? `<select id="moveTo" aria-label="Pasar al álbum de…"><option value="">Pasar al álbum de…</option>${opts}</select>` : ''}
<button class="sb ic" type="button" data-act="download" title="Descargar" aria-label="Descargar">${ICON.down}</button>
<button class="sb ic danger" type="button" data-act="delete" title="Borrar" aria-label="Borrar">${ICON.trash}</button>
</div>

${statsDialog(stats)}
${selectionsDialog(sels)}
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

<dialog id="setDlg" class="glassdlg wide"><form method="post" action="/galerias/${event.id}/ajustes" class="dlgbox" >
<header><h2>Configuración</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Nombre</span><input type="text" name="name" maxlength="120" value="${esc(event.name)}" required></label>
<div class="row2">
<label class="field"><span>Fecha</span><input type="date" name="event_date" value="${esc(event.event_date || '')}"></label>
<label class="field"><span>Máx. fotos por persona (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="${event.photo_limit}"></label>
</div>
<label class="field"><span>${event.parent_id ? 'Descripción de la subgalería' : 'Mensaje de bienvenida'}</span><textarea name="lead" maxlength="400">${esc(event.lead)}</textarea></label>
<label class="field"><span>Terminación del enlace (opcional)</span><span class="slugrow"><i>${esc(new URL(guestUrl).host)}/g/</i><input type="text" name="slug" maxlength="40" autocomplete="off" spellcheck="false" value="${esc(event.slug || '')}" placeholder="torneo-las-rozas"></span></label>
<p class="muted small" style="margin:-4px 0 6px">Solo letras, números y guiones. El enlace largo de siempre sigue funcionando. Si lo dejas vacío se crea solo a partir del nombre de la galería.</p>
<label class="check"><input type="checkbox" name="auto_approve" value="1" ${event.auto_approve ? 'checked' : ''}> Publicar las fotos al subirlas</label>
<label class="check"><input type="checkbox" name="upload_open" value="1" ${event.upload_open ? 'checked' : ''}> Subida de fotos abierta</label>
<label class="check"><input type="checkbox" name="gallery_open" value="1" ${event.gallery_open ? 'checked' : ''}> Galería visible para los invitados</label>
<label class="check"><input type="checkbox" name="allow_download" value="1" ${event.allow_download ? 'checked' : ''}> Permitir que los invitados descarguen fotos (una a una, selección o ZIP)${event.parent_id ? '' : ' · se aplica también a las subgalerías'}</label>
<label class="check"><input type="checkbox" name="social" value="1" ${event.social === 0 ? '' : 'checked'}> Permitir «me gusta» y comentarios en las fotos</label>
<label class="check"><input type="checkbox" name="selection" value="1" ${event.selection ? 'checked' : ''}> Permitir que el cliente elija sus fotos favoritas y te envíe la selección</label>
${!event.parent_id ? `<label class="check"><input type="checkbox" name="show_subs" value="1" ${event.show_subs ? 'checked' : ''}> Mostrar las subgalerías en la página de invitados${subs.length ? '' : ' (aún no hay ninguna)'}</label>` : ''}
${event.parent_id ? `<fieldset class="privbox"><legend>Privacidad</legend>
<label class="check"><input type="checkbox" name="is_private" value="1" ${event.is_private ? 'checked' : ''}> Subgalería privada: no sale en la galería general ni en su lista de sedes; solo se entra con su enlace</label>
<label class="field"><span>Contraseña de acceso (opcional)${event.access_hash ? ' · ya hay una puesta; escribe otra para cambiarla' : ''}</span><input type="text" name="access_password" maxlength="60" autocomplete="off" placeholder="${event.access_hash ? 'Nueva contraseña' : 'Sin contraseña'}"></label>
${event.access_hash ? '<label class="check"><input type="checkbox" name="access_clear" value="1"> Quitar la contraseña</label>' : ''}
<p class="muted small" style="margin:0">Ideal para fotos de menores: manda el enlace (y la contraseña) solo a sus familias, y activa «Permitir que los invitados descarguen fotos» si quieres que se las bajen.</p></fieldset>` : ''}
${!event.parent_id ? `<fieldset class="privbox wmbox" id="wmBox"><legend>Marca de agua</legend>
<input type="hidden" name="wm_form" value="1">
<label class="check"><input type="checkbox" name="wm" value="1" ${wm && wm.on ? 'checked' : ''}> Poner marca de agua en las fotos que ven los invitados</label>
<div class="wmopts">
<label class="field"><span>Texto (si lo dejas vacío, el nombre de la galería)</span><input type="text" name="wm_text" maxlength="60" value="${esc(wm ? wm.text : '')}" placeholder="${esc(event.name)}"></label>
<div class="row2">
<label class="field"><span>Posición</span><select name="wm_pos">${[['diag', 'Repetida en diagonal'], ['center', 'Centrada'], ['corner', 'En una esquina']].map(([k, t]) => `<option value="${k}" ${wm && wm.pos === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
<label class="field"><span>Intensidad</span><input type="range" name="wm_op" min="10" max="80" step="5" value="${wm ? wm.op : 35}"></label>
</div>
${event.avatar_v ? `<label class="check"><input type="checkbox" name="wm_logo" value="1" ${wm && wm.logo ? 'checked' : ''}> Incluir el logo de la galería (la foto de perfil)</label>` : ''}
<canvas class="wmprev" width="640" height="400" data-wmprev data-logo="${event.avatar_v ? `/c/${event.guest_token}/avatar?v=${event.avatar_v}` : ''}" aria-label="Vista previa de la marca de agua"></canvas>
</div>
<p class="muted small" style="margin:0">La marca se pinta en la miniatura y en la foto grande. El original limpio solo se descarga si activas «Permitir que los invitados descarguen fotos». Al guardar, las fotos que ya tienes se rehacen solas desde tu navegador (verás el avance abajo; no cierres la pestaña hasta que termine).</p></fieldset>
<fieldset class="privbox"><legend>Fotos destacadas</legend>
<input type="hidden" name="best_form" value="1">
<p class="muted small" style="margin:0">Marca con el corazón las mejores fotos desde el panel. Aquí eliges qué ven los invitados.</p>
<label class="check"><input type="checkbox" name="best_first" value="1" ${best && best.first ? 'checked' : ''}> Mostrar primero las destacadas</label>
<label class="check"><input type="checkbox" name="best_tab" value="1" ${best && best.tab ? 'checked' : ''}> Crear una pestaña con solo las destacadas (por ejemplo, «Lo mejor del torneo»)</label>
<label class="field"><span>Nombre de la pestaña</span><input type="text" name="best_title" maxlength="40" value="${esc(best ? best.raw : '')}" placeholder="Lo mejor"></label>
</fieldset>
<fieldset class="privbox"><legend>Consentimiento y caducidad</legend>
<label class="check"><input type="checkbox" name="consent" value="1" ${event.consent ? 'checked' : ''}> Pedir consentimiento antes de subir fotos (los invitados marcan una casilla)</label>
<label class="field"><span>Texto del aviso (si lo dejas vacío se usa el estándar)</span><textarea name="consent_text" maxlength="600" placeholder="${esc(DEFAULT_CONSENT)}">${esc(event.consent_text || '')}</textarea></label>
<label class="field"><span>La galería caduca el (opcional)</span><input type="date" name="expires" value="${event.expires_at ? new Date(event.expires_at).toISOString().slice(0, 10) : ''}"></label>
<label class="check"><input type="checkbox" name="expire_delete" value="1" ${event.expire_delete ? 'checked' : ''}> Al caducar, borrar la galería y todas sus fotos (si no, solo deja de verse y de aceptar fotos)</label>
<p class="muted small" style="margin:0">Se aplica también a las subgalerías. Tras la fecha, los invitados ya no pueden ver, subir ni descargar. Tú sigues viéndola hasta que se borre.</p></fieldset>` : '<p class="muted small">El consentimiento, la caducidad y la marca de agua se heredan de la galería principal.</p>'}

<div class="notice err hidden" data-brand-msg></div>
<footer>
<button class="btn danger" type="submit" formaction="/galerias/${event.id}/borrar" formnovalidate data-nobrand onclick="return confirm('${event.parent_id ? 'Se borrará esta subgalería. Sus fotos NO se borran: pasan a la galería principal. ¿Seguir?' : 'La galería, sus subgalerías y todas sus fotos irán a la papelera. Podrás recuperarlas durante 30 días. ¿Seguir?'}')">${ICON.trash} ${event.parent_id ? 'Borrar subgalería' : 'Borrar galería'}</button>
<span class="spacer"></span>
${event.parent_id ? '' : `<button class="btn" type="submit" formaction="/galerias/${event.id}/duplicar" formnovalidate data-nobrand title="Crea otra galería con los mismos ajustes y subgalerías, sin fotos">${ICON.plus} Duplicar</button>`}
<button class="btn primary" type="submit">Guardar</button></footer>
</form></dialog>
<dialog id="brandDlg" class="glassdlg wide"><form method="post" action="/galerias/${event.id}/personalizar" class="dlgbox" data-brand-form="settings" data-gapi="/api/g/${event.id}">
<header><h2>Personalización</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
${brandFields(event)}
<div class="notice err hidden" data-brand-msg></div>
<footer><span class="spacer"></span><button class="btn primary" type="submit">Guardar</button></footer>
</form></dialog>
${lightbox(false, true)}`,
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
<label class="field"><span>Nombre de usuario</span><input type="text" name="username" value="${esc(user.username || '')}" maxlength="30" pattern="[a-zA-Z0-9._\-]{3,30}" autocomplete="username" placeholder="por ejemplo, barbarab"></label>
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
<div class="prof-id"><h1>${esc(full)}</h1>${user.username ? `<p class="handle">@${esc(user.username)}</p>` : ''}${since ? `<p class="since">Con Picfy desde ${esc(since)}</p>` : ''}</div>
<div class="prof-stats"><div><b>${stats.galleries || 0}</b><span>Galerías</span></div><div><b>${stats.photos || 0}</b><span>Fotos</span></div></div>
<div class="prof-act"><form method="post" action="/salir"><button class="btn" type="submit">${ICON.out} Cerrar sesión</button></form></div>
</div>
<div class="notice err hidden" id="avMsg"></div>
<nav class="tabs" aria-label="Mi cuenta">${tab('datos', 'Datos y correo')}${tab('password', 'Contraseña')}${tab('galerias', 'Galerías nuevas')}</nav>
${msg}<div class="accgrid">${forms[section] || forms.datos}</div>`,
    }),
  });
}


/* ---------- Papelera ---------- */

export function trashPage({ user, galleries = [], photos = [], ready = true, ok = '' }) {
  const left = (t, days) => Math.max(0, Math.ceil((t + days * 86400000 - Date.now()) / 86400000));
  const dleft = (t, days) => { const d = left(t, days); return d <= 1 ? 'se borra hoy o mañana' : `quedan ${d} días`; };
  const empty = !galleries.length && !photos.length;
  const gal = galleries.map((g) => `<label class="trow glass"><input type="checkbox" name="gal" value="${g.id}"><span class="tname"><b>${esc(g.name)}</b><small>${g.n} ${g.n === 1 ? 'foto' : 'fotos'} · ${dleft(g.deleted_at, 30)}</small></span></label>`).join('');
  const ph = photos.map((p) => `<label class="ttile"><input type="checkbox" name="foto" value="${p.id}"><img src="/m/${p.id}/m" loading="lazy" alt=""><span>${esc(p.ename)} · ${dleft(p.deleted_at, 7)}</span></label>`).join('');
  return appPage({
    title: 'Papelera',
    body: shell({
      user, active: 'papelera', crumbs: '<a href="/galerias">Galerías</a><span>/</span><b>Papelera</b>',
      main: `<div class="head"><div><h1>Papelera</h1><p class="muted">Las fotos que borras se guardan aquí 7 días y las galerías enteras 30. Pasado ese tiempo se eliminan para siempre.</p></div></div>
${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}
${!ready ? '<div class="alert">Falta la actualización de la base de datos (migración 0014) para usar la papelera.</div>' : ''}
${empty ? '<div class="glass emptybox">La papelera está vacía.</div>' : `<form method="post" class="trashform">
${galleries.length ? `<h2 class="sec">Galerías</h2><div class="tlist">${gal}</div>` : ''}
${photos.length ? `<h2 class="sec">Fotos</h2><div class="tgrid">${ph}</div>` : ''}
<div class="tbar glass"><button class="btn primary" type="submit" formaction="/papelera/restaurar">Recuperar lo marcado</button>
<button class="btn danger" type="submit" formaction="/papelera/borrar" onclick="return confirm('Se borrará para siempre lo que has marcado. ¿Seguir?')">Borrar lo marcado para siempre</button>
<span class="spacer"></span>
<button class="btn" type="submit" formaction="/papelera/vaciar" onclick="return confirm('Se vaciará la papelera y no se podrá recuperar nada. ¿Seguir?')">Vaciar la papelera</button></div></form>`}`,
    }),
  });
}


/* ---------- Colecciones ---------- */

const noTables = '<div class="alert">Colecciones aún no está activado en la base de datos. Hay que pegar un código una sola vez (te lo ha pasado Claude).</div>';

export function collectionsPage({ user, collections = [], ready = true, ok = '' }) {
  const cards = collections.map((c) => `<a class="gcard glass" href="/colecciones/${c.id}">
<div class="cover">${c.cover ? `<img src="/m/${c.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.coll}</span>`}<span class="chip subc">${c.n} ${c.n === 1 ? 'galería' : 'galerías'}</span></div>
<div class="gmeta"><strong>${esc(c.name)}</strong></div>${c.lead ? `<div class="gdate">${esc(c.lead)}</div>` : ''}</a>`).join('');
  return appPage({
    title: 'Colecciones',
    scripts: ['/app.js', '/colecciones.js'],
    body: shell({
      user, active: 'colecciones', crumbs: '<b>Colecciones</b>',
      main: `${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}${ready ? '' : noTables}<div class="head"><div><h1>Colecciones</h1><p class="muted">Agrupa varias galerías de un mismo cliente y compártelas con un único enlace.</p></div></div>
${ready ? `<button class="btn primary" type="button" data-open="newCol">${ICON.plus} Crear una colección</button>` : ''}
<h2 class="sec">Tus colecciones</h2>
${collections.length ? `<div class="gcards">${cards}</div>` : '<div class="glass emptybox">Todavía no tienes colecciones. Crea una, por ejemplo con el nombre de un cliente, y añade sus galerías.</div>'}
<dialog id="newCol" class="glassdlg"><form method="post" action="/colecciones" class="dlgbox">
<header><h2>Crear una colección</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Nombre</span><input class="txt" type="text" name="name" maxlength="120" placeholder="Por ejemplo: Boda de Marta y Luis" required></label>
<label class="field"><span>Descripción (opcional)</span><input class="txt" type="text" name="lead" maxlength="400" placeholder="Una frase que verá tu cliente"></label>
<footer><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Crear colección</button></footer>
</form></dialog>`,
    }),
  });
}

export function collectionPage({ user, col, items = [], available = [], origin, ok = '' }) {
  const url = `${origin}/col/${col.token}`;
  const last = items.length - 1;
  const cards = items.map((g, i) => `<div class="colitem glass">
<a class="colcover" href="/galerias/${g.id}">${g.thumb_v ? `<img src="/c/${g.guest_token}/thumb?v=${g.thumb_v}" alt="" loading="lazy">` : g.cover ? `<img src="/m/${g.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.gal}</span>`}</a>
<div class="colinfo"><a href="/galerias/${g.id}"><b>${esc(g.name)}</b></a><span class="muted small">${g.n} ${g.n === 1 ? 'foto' : 'fotos'}${g.event_date ? ' · ' + esc(fmtDate(g.event_date)) : ''}</span></div>
<div class="colacts">
<form method="post" action="/colecciones/${col.id}/mover"><input type="hidden" name="event_id" value="${g.id}"><button class="iconbtn" name="dir" value="up" aria-label="Subir" title="Subir" ${i === 0 ? 'disabled' : ''}>↑</button><button class="iconbtn" name="dir" value="down" aria-label="Bajar" title="Bajar" ${i === last ? 'disabled' : ''}>↓</button></form>
<form method="post" action="/colecciones/${col.id}/quitar"><input type="hidden" name="event_id" value="${g.id}"><button class="iconbtn" aria-label="Quitar de la colección" title="Quitar de la colección">×</button></form>
</div></div>`).join('');
  const avail = available.length ? available.map((g) => `<label class="check colpick"><input type="checkbox" name="gal" value="${g.id}"> <span><b>${esc(g.name)}</b> <small class="muted">${g.n} ${g.n === 1 ? 'foto' : 'fotos'}</small></span></label>`).join('') : '<p class="muted">Todas tus galerías ya están en esta colección.</p>';
  return appPage({
    title: col.name,
    scripts: ['/app.js', '/colecciones.js'],
    body: shell({
      user, active: 'colecciones', crumbs: `<a href="/colecciones">Colecciones</a><span>/</span><b>${esc(col.name)}</b>`,
      main: `${ok ? `<div class="alert ok">${esc(ok)}</div>` : ''}<div class="head"><div><h1>${esc(col.name)}</h1>${col.lead ? `<p class="muted">${esc(col.lead)}</p>` : ''}</div></div>
<div class="glass colshare"><span class="muted small">Enlace para tu cliente</span><div class="linkbox" id="colLink">${esc(url)}</div>
<div class="colbtns"><button class="btn primary" type="button" id="copyCol">Copiar enlace</button><a class="btn" href="/col/${col.token}" target="_blank" rel="noopener">${ICON.eye} Vista previa</a><button class="btn" type="button" data-open="editCol">Editar nombre</button></div></div>
<h2 class="sec">Galerías de la colección</h2>
<button class="btn" type="button" data-open="addGal">${ICON.plus} Añadir galerías</button>
${items.length ? `<div class="collist">${cards}</div>` : '<div class="glass emptybox">Esta colección está vacía. Añade galerías para que tu cliente las vea juntas.</div>'}
<form method="post" action="/colecciones/${col.id}/borrar" class="coldel" onsubmit="return confirm('Se eliminará la colección y su enlace. Las galerías no se borran. ¿Seguir?')"><button class="btn danger" type="submit">Eliminar colección</button></form>
<dialog id="addGal" class="glassdlg"><form method="post" action="/colecciones/${col.id}/galerias" class="dlgbox">
<header><h2>Añadir galerías</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<div class="colpicks">${avail}</div>
<footer><button class="btn" type="button" data-close>Cancelar</button>${available.length ? '<button class="btn primary" type="submit">Añadir las marcadas</button>' : ''}</footer></form></dialog>
<dialog id="editCol" class="glassdlg"><form method="post" action="/colecciones/${col.id}/ajustes" class="dlgbox">
<header><h2>Editar la colección</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Nombre</span><input class="txt" type="text" name="name" maxlength="120" value="${esc(col.name)}" required></label>
<label class="field"><span>Descripción (opcional)</span><input class="txt" type="text" name="lead" maxlength="400" value="${esc(col.lead || '')}"></label>
<footer><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Guardar</button></footer></form></dialog>`,
    }),
  });
}

/* ---------- Agenda ---------- */

export function agendaPage({ user, ready, kinds, colors, habitsOk }) {
  const radios = Object.entries(kinds).map(([k, v]) => `<label class="kradio" style="--c:${v.color}"><input type="radio" name="kind" value="${k}"${k === 'tarea' ? ' checked' : ''}><span><i></i>${esc(v.label)}</span></label>`).join('');
  return appPage({
    title: 'Agenda',
    scripts: ['/app.js', '/navtoggle.js', '/icons.js', '/agenda.js', '/habitos.js'],
    bodyAttrs: `data-agenda="${esc(JSON.stringify(kinds))}" data-colors="${esc(JSON.stringify(colors))}"`,
    body: shell({
      user, active: 'agenda', crumbs: '<span>Agenda</span>', collapsible: true,
      main: !ready ? `<div class="head"><div><h1>Agenda</h1></div></div><div class="glass emptybox">Falta una actualización de la base de datos (migración 0026) para activar la agenda.</div>` : `<div class="head"><div><h1>Agenda</h1></div>
<button class="btn primary" type="button" id="agAdd">${ICON.plus} Añadir</button></div>
<form class="glass agquick" id="agQuick" autocomplete="off"><input type="text" id="agQuickT" maxlength="160" placeholder="Nueva tarea… (escribe y pulsa Intro)" aria-label="Nueva tarea"><button class="btn primary" type="submit">Añadir tarea</button></form>
<div class="aglayout"><div class="agmainc">
<div class="glass agbar"><div class="agnav"><button class="iconbtn" type="button" id="agPrev" aria-label="Anterior">‹</button><h2 id="agTitle"></h2><button class="iconbtn" type="button" id="agNext" aria-label="Siguiente">›</button><button class="btn sm" type="button" id="agToday">Hoy</button></div>
<div class="vtog" role="group" aria-label="Vista"><button type="button" data-view="week" class="on">Semana</button><button type="button" data-view="month">Mes</button></div></div>
<div class="agchips" id="agCats"></div>
<div id="agWeek" class="agweekv"></div><div id="agMonth" class="agmonth" hidden></div>
</div><aside class="agside" id="agSide"></aside></div>
${habitsSection(colors, habitsOk)}

<dialog id="agDlg" class="glassdlg"><form class="dlgbox" id="agForm" autocomplete="off">
<header><h2 id="agDlgT">Nuevo</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<div class="kradios">${radios}</div>
<label class="field"><span>Título</span><input type="text" name="title" maxlength="160" required placeholder="Ej.: Preparar convocatoria del sábado"></label>
<div class="row2"><label class="field"><span id="agDateL">Fecha de inicio</span><input type="date" name="date"></label><label class="field"><span>Fecha de fin (opcional)</span><input type="date" name="end_date"></label></div>
<div class="row2"><label class="field"><span>Hora (opcional)</span><input type="time" name="time"></label><label class="field"><span>Hora fin (opcional)</span><input type="time" name="end_time"></label></div>
<label class="field"><span>Cliente o proyecto (opcional)</span><input type="text" name="category" maxlength="80" placeholder="Ej.: Las Rozas 3x3"></label>
<label class="agimp"><input type="checkbox" name="important"><span>Importante</span></label>
<div class="field"><span>Icono (opcional)</span><input type="hidden" name="icon"><div class="icopick" id="agIcons"></div></div>
<label class="field"><span>Enlace (opcional)</span><input type="text" name="url" maxlength="400" placeholder="https://"></label>
<label class="field"><span>Notas</span><textarea name="notes" maxlength="2000" rows="3" placeholder="Lugar, rival, lo que necesites…"></textarea></label>
<footer><button class="btn danger" type="button" id="agDel" hidden>${ICON.trash} Borrar</button><span class="spacer"></span><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Guardar</button></footer>
</form></dialog>
<dialog id="agDay" class="glassdlg"><div class="dlgbox"><header><h2 id="agDayT"></h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header><div id="agDayList"></div><footer><span class="spacer"></span><button class="btn primary" type="button" id="agDayAdd">${ICON.plus} Añadir aquí</button></footer></div></dialog>`,
    }),
  });
}

/* ---------- Hábitos ---------- */

function habitsSection(colors, ready) {
  const sw = colors.map((c, i) => `<label class="swatch" style="--c:${c}"><input type="radio" name="color" value="${c}"${i === 0 ? ' checked' : ''}><span></span></label>`).join('');
  if (!ready) return '<section class="hbsec" id="hbSection"><div class="glass emptybox">Falta una actualización de la base de datos (migración 0026) para activar los hábitos.</div></section>';
  return `<section class="hbsec" id="hbSection"><div class="head hbhead"><div><h2>Hábitos</h2><p class="muted" id="hbSub"></p></div>
<button class="btn primary" type="button" id="hbAdd">${ICON.plus} Nuevo hábito</button></div>
<div class="glass hbweek"><button class="iconbtn" type="button" id="hbPrev" aria-label="Semana anterior">‹</button><div class="hbdays" id="hbDays"></div><button class="iconbtn" type="button" id="hbNext" aria-label="Semana siguiente">›</button></div>
<div id="hbList" class="hblist"></div>
<dialog id="hbDlg" class="glassdlg"><form class="dlgbox" id="hbForm" autocomplete="off">
<header><h2 id="hbDlgT">Nuevo hábito</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Nombre</span><input type="text" name="name" maxlength="60" required placeholder="Ej.: Beber agua"></label>
<div class="field"><span>Icono (opcional)</span><input type="hidden" name="icon"><div class="icopick" id="hbIcons"></div></div>
<div class="field"><span>Color</span><div class="swatches">${sw}</div></div>
<div class="row2"><label class="field"><span>Objetivo al día</span><input type="number" name="goal" min="1" max="1000000" value="1" required></label>
<label class="field"><span>Unidad (opcional)</span><input type="text" name="unit" maxlength="12" placeholder="ml, hr, pasos…"></label></div>
<label class="field"><span>Suma por pulsación</span><input type="number" name="step" min="1" max="1000000" value="1" required></label>
<div class="field" id="hbValBox" hidden><span>Valor de <b id="hbValD"></b></span><input type="number" name="value" min="0" max="1000000"></div>
<footer><button class="btn danger" type="button" id="hbDel" hidden>${ICON.trash} Borrar</button><span class="spacer"></span><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Guardar</button></footer>
</form></dialog></section>`;
}
