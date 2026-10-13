// Pantallas de la plataforma (cuentas y galerías). Estilo: blanco, #edb265 y cristal.

import { esc } from './util.js';
import { layout, fmtDate, lightbox } from './views.js';

const ICON = {
  gal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
};
export { ICON };

function appPage({ title, body, scripts = [], bodyAttrs = '' }) {
  return layout({
    title: `${title} · Picfy`,
    head: '<link rel="stylesheet" href="/app.css">',
    bodyAttrs: `class="app" ${bodyAttrs}`,
    scripts,
    body,
  });
}

const logo = `<a class="logo" href="/galerias"><span class="logo-dot"></span>Picfy</a>`;

// Marco con barra superior y lateral de cristal
function shell({ user, active = 'galerias', crumbs = '', main }) {
  const initials = (user.name || user.email).trim().slice(0, 2).toUpperCase();
  return `<div class="bgfx" aria-hidden="true"></div>
<header class="top glass">
${logo}
<nav class="crumbs">${crumbs}</nav>
<span class="spacer"></span>
<div class="who"><span class="avatar" title="${esc(user.email)}">${esc(initials)}</span>
<form method="post" action="/salir"><button class="iconbtn" type="submit" title="Salir" aria-label="Salir">${ICON.out}</button></form></div>
</header>
<div class="frame">
<aside class="side glass">
<p class="side-h">Gestiona tus fotos</p>
<a class="nav ${active === 'galerias' ? 'on' : ''}" href="/galerias">${ICON.gal}<span>Galerías</span></a>
<p class="side-h">Próximamente</p>
<span class="nav off">${ICON.lock}<span>Colecciones</span></span>
<span class="nav off">${ICON.lock}<span>Papelera</span></span>
</aside>
<main class="main">${main}</main>
</div>`;
}

/* ---------- Entrar / crear cuenta ---------- */

export function authPage({ mode = 'login', error = '', email = '', name = '', needCode = false, firstUser = false }) {
  const login = mode === 'login';
  return appPage({
    title: login ? 'Entrar' : 'Crear cuenta',
    body: `<div class="bgfx" aria-hidden="true"></div>
<main class="auth">
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

/* ---------- Galerías ---------- */

export function galleriesPage({ user, events, origin }) {
  const cards = events
    .map(
      (e) => `<a class="gcard glass" href="/galerias/${e.id}" data-name="${esc(e.name.toLowerCase())}">
<div class="cover">${e.cover ? `<img src="/m/${e.cover}/m" alt="" loading="lazy">` : `<span class="nocover">${ICON.gal}</span>`}
${e.pending ? `<span class="chip warn">${e.pending} por revisar</span>` : ''}</div>
<div class="gmeta"><strong>${esc(e.name)}</strong><span>${e.approved}</span></div>
${e.event_date ? `<div class="gdate">${esc(fmtDate(e.event_date))}</div>` : ''}
</a>`,
    )
    .join('');
  return appPage({
    title: 'Galerías',
    scripts: ['/app.js'],
    body: shell({
      user,
      crumbs: '',
      main: `<div class="head"><div><h1>Galerías</h1><p class="muted">Aquí ves tus galerías o creas otras nuevas.</p></div>
<input class="search glass" type="search" id="filter" placeholder="Filtrar" aria-label="Filtrar galerías"></div>
<button class="btn primary" id="newGal" type="button">${ICON.plus} Crear una nueva galería</button>
<h2 class="sec">Tus galerías</h2>
${events.length ? `<div class="gcards" id="gcards">${cards}</div><p class="muted hidden" id="noMatch">Ninguna galería coincide.</p>` : `<div class="glass emptybox">Todavía no tienes galerías. Crea la primera y comparte el enlace con tus invitados.</div>`}
<dialog id="newDlg" class="glassdlg"><form method="post" action="/galerias" class="dlgbox">
<header><h2>Crear una nueva galería</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<label class="field"><span>Título de la galería</span><input type="text" name="name" maxlength="120" required placeholder="Boda de Ana y Luis"></label>
<div class="row2">
<label class="field"><span>Fecha (opcional)</span><input type="date" name="event_date"></label>
<label class="field"><span>Máx. fotos por persona (0 = sin límite)</span><input type="number" name="photo_limit" min="0" max="2000" value="0"></label>
</div>
<label class="field"><span>Mensaje de bienvenida (opcional)</span><textarea name="lead" maxlength="400" placeholder="Los mejores recuerdos se viven juntos. Sube las fotos que hiciste."></textarea></label>
<label class="check"><input type="checkbox" name="auto_approve" value="1" checked> Publicar las fotos al subirlas (si no, las revisas tú antes)</label>
<footer><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit">Crear y abrir</button></footer>
</form></dialog>`,
    }),
  });
}

/* ---------- Una galería ---------- */

export function galleryPage({ user, event, photos, counts, origin, note = '' }) {
  const guestUrl = `${origin}/e/${event.guest_token}`;
  const tiles = photos
    .map(
      (p) => `<a class="ptile" href="/m/${p.id}/l" data-full="/m/${p.id}/l">
<img src="/m/${p.id}/m" loading="lazy" decoding="async" alt="">${p.state === 'pending' ? '<span class="chip warn">En revisión</span>' : ''}</a>`,
    )
    .join('');
  return appPage({
    title: event.name,
    scripts: ['/vendor/qrcode.js', '/qr.js', '/lightbox.js', '/app.js'],
    body: shell({
      user,
      crumbs: `<a href="/galerias">Galerías</a><span>/</span><b>${esc(event.name)}</b>`,
      main: `${note ? `<div class="alert ok">${esc(note)}</div>` : ''}
<div class="gwrap">
<aside class="gside glass">
<h2>${esc(event.name)}</h2>
${event.event_date ? `<p class="muted small">${esc(fmtDate(event.event_date))}</p>` : ''}
<div class="trio">
<button class="tool" type="button" id="openShare">${ICON.share}<span>Compartir</span></button>
<a class="tool" href="/e/${event.guest_token}" target="_blank" rel="noopener">${ICON.eye}<span>Vista previa</span></a>
<form method="post" action="/galerias/${event.id}/borrar" onsubmit="return confirm('Se borrará la galería y TODAS sus fotos. No se puede deshacer. ¿Seguir?')"><button class="tool danger" type="submit">${ICON.trash}<span>Borrar</span></button></form>
</div>
<a class="btn primary block" href="/e/${event.guest_token}" target="_blank" rel="noopener">${ICON.up} Subir fotos</a>
<dl class="stats"><div><dt>Publicadas</dt><dd>${counts.approved}</dd></div><div><dt>Por revisar</dt><dd>${counts.pending}</dd></div></dl>
<p class="muted small">Moderar, ordenar y descargar llegan en el siguiente paso.</p>
</aside>
<section class="gmain">
${photos.length ? `<div class="pgrid" id="pgrid">${tiles}</div>` : `<div class="glass emptybox">Esta galería todavía no tiene fotos. Comparte el enlace para que tus invitados suban las suyas.</div>`}
</section></div>
<dialog id="shareDlg" class="glassdlg"><div class="dlgbox">
<header><h2>Compartir galería</h2><button class="iconbtn" type="button" data-close aria-label="Cerrar">×</button></header>
<p class="muted">Copia el enlace y envíaselo a tus invitados. Cualquiera con el enlace puede subir fotos.</p>
<div class="linkbox" id="guestLink">${esc(guestUrl)}</div>
<div class="sharerow"><button class="btn primary" type="button" id="copyLink">Copiar enlace</button></div>
<div class="qr" data-qr="${esc(guestUrl)}"></div>
</div></dialog>
${lightbox()}`,
    }),
  });
}
