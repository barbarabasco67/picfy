// Página de inicio pública de Picfy (picfy.es), enfocada a torneos con varias sedes.
// La versión anterior, para bodas, está en landing_bodas.js (imágenes en /landing/).
import { ASSET_V } from './version.js';
import { CSS } from './landing_bodas.js';

const img = (src, alt, w, h, extra = '') => `<img src="/torneos/${src}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;


const CSS2 = `
/* tamaños de la portada */
h1{font-size:clamp(2.1rem,4.4vw,3.6rem);line-height:1.04;letter-spacing:-.04em}
.lead{font-size:clamp(.98rem,1.2vw,1.08rem);line-height:1.6;max-width:32em}
/* móvil a la derecha en la primera imagen */
.stage .phone{left:auto;right:-2%}
/* fondo que se mueve con el scroll */
.bg{background:none;overflow:hidden}
.bg i{position:absolute;display:block;border-radius:50%;will-change:transform,opacity;transform:translate3d(calc(var(--p,0)*var(--dx)),calc(var(--p,0)*var(--dy)),0) scale(calc(1 + var(--p,0)*var(--ds)))}
.bg i b{display:block;width:100%;height:100%;border-radius:50%;background:radial-gradient(closest-side,var(--c),transparent);animation:drift 24s ease-in-out infinite alternate}
.bg .b1{--c:rgba(237,178,101,.36);width:72vmax;height:72vmax;left:-22vmax;top:-28vmax;--dx:34vw;--dy:24vh;--ds:.45;opacity:calc(1 - var(--p,0)*.6)}
.bg .b2{--c:rgba(223,116,97,.22);width:62vmax;height:62vmax;right:-24vmax;top:8vh;--dx:-20vw;--dy:62vh;--ds:.3;opacity:calc(.3 + var(--p,0)*.7)}
.bg .b3{--c:rgba(116,64,109,.17);width:68vmax;height:68vmax;left:8vw;bottom:-36vmax;--dx:22vw;--dy:-52vh;--ds:.2;opacity:calc(.08 + var(--p,0)*.92)}
.bg .b4{--c:rgba(255,226,170,.55);width:46vmax;height:46vmax;right:4vw;top:-12vmax;--dx:-32vw;--dy:44vh;--ds:.5}
.bg .b4 b{animation-duration:30s;animation-direction:alternate-reverse}
@keyframes drift{from{transform:translate(0,0) rotate(0)}to{transform:translate(5vmax,-3vmax) rotate(24deg)}}
/* efecto en las imágenes: inclinación suave, profundidad y un brillo que cruza al hacer scroll */
.frame{position:relative;transform:perspective(1500px) rotateX(calc(var(--ct,0)*4deg)) translateY(calc(var(--ct,0)*-16px));transform-origin:50% 60%;will-change:transform}
.frame::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(112deg,transparent calc(var(--sh,50%) - 22%),rgba(255,255,255,.38) var(--sh,50%),transparent calc(var(--sh,50%) + 22%))}
.phone,.float{transform:translateY(calc(var(--ct,0)*-44px));will-change:transform}
.phone{border-radius:30px}

/* botones con menos relleno */
.btn{padding:.52em 1.1em;font-size:.97rem}
.btn.lg{padding:.62em 1.25em;font-size:1rem}
nav.main a:not(.btn){padding:6px 12px}
/* bloque final sin morado: ámbar cálido */
.end{background:linear-gradient(140deg,#f6cf93 0%,#edb265 52%,#e5964c 100%);color:var(--ink)}
.end h2{color:var(--ink)}
.end p{color:rgba(28,22,17,.82)}
.end .btn:not(.primary){background:rgba(255,255,255,.55);border-color:rgba(28,22,17,.18);color:var(--ink)}
.end .btn.primary{background:var(--ink);border-color:var(--ink);color:#fff;box-shadow:0 10px 26px rgba(28,22,17,.28)}
.end .btn.primary:hover{background:#2d241b}
.bg .b3{--c:rgba(229,150,76,.2)}
.bg .b2{--c:rgba(237,140,96,.2)}
/* movimiento propio en algunas fotos */
.kb img{animation:kb 20s ease-in-out infinite alternate;transform-origin:60% 40%}
.kb2 img{animation-duration:26s;animation-delay:-8s;transform-origin:30% 60%}
@keyframes kb{from{transform:scale(1) translate(0,0)}to{transform:scale(1.07) translate(-1.6%,-1.2%)}}
.phone{animation:bob 7s ease-in-out infinite}
.float{animation:bob 8s ease-in-out infinite;animation-delay:-3s}
@keyframes bob{0%,100%{translate:0 0}50%{translate:0 -12px}}
@media (prefers-reduced-motion:reduce){.kb img,.phone,.float{animation:none}}
@media (max-width:980px){.stage .phone{right:0}}
@media (prefers-reduced-motion:reduce){.bg i b{animation:none}.bg i,.frame,.phone,.float{transform:none!important}.frame::after{display:none}}
`;

const JS = `(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var bg=document.querySelector('.bg'), els=[].slice.call(document.querySelectorAll('.pic,.stage')), tick=false;
  function upd(){
    tick=false; var h=innerHeight, max=Math.max(1,document.documentElement.scrollHeight-h), p=Math.min(1,Math.max(0,scrollY/max));
    bg.style.setProperty('--p',p.toFixed(4));
    els.forEach(function(el){
      var r=el.getBoundingClientRect(); if(r.bottom<-200||r.top>h+200) return;
      var ct=((r.top+r.height/2)-h/2)/h; ct=Math.max(-1,Math.min(1,ct));
      el.style.setProperty('--ct',ct.toFixed(3)); el.style.setProperty('--sh',(50-ct*70).toFixed(1)+'%');
    });
  }
  function req(){ if(!tick){ tick=true; requestAnimationFrame(upd); } }
  addEventListener('scroll',req,{passive:true}); addEventListener('resize',req); upd();
})();`;

export function landingPage(user = null) {
  const goHref = user ? '/inicio' : '/entrar', goText = user ? 'Ir a mi panel' : 'Entrar';
  const title = 'Picfy · Galerías de fotos para torneos con varias sedes';
  const desc = 'Una galería por sede y un solo enlace para todo el torneo. Fotógrafos y voluntarios suben desde el móvil, tú revisas y los equipos eligen y descargan sus fotos.';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://picfy.es/">
<meta property="og:type" content="website"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="Picfy">
<meta property="og:title" content="Picfy · Las fotos de tu torneo, en un solo enlace"><meta property="og:description" content="${desc}">
<meta property="og:url" content="https://picfy.es/"><meta property="og:image" content="https://picfy.es/torneos/og.jpg?v=${ASSET_V}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="preload" href="/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}${CSS2}</style>
</head>
<body>
<div class="bg" aria-hidden="true"><i class="b1"><b></b></i><i class="b2"><b></b></i><i class="b3"><b></b></i><i class="b4"><b></b></i></div>
<div class="wrap">
<header class="top">
  <a class="logo" href="/"><i aria-hidden="true"></i>Picfy</a>
  <nav class="main" aria-label="Principal">
    <a href="#como">Cómo funciona</a><a href="#funciones">Funciones</a><a class="btn" href="${goHref}">${goText}</a>
  </nav>
</header>

<main>
<div class="hero">
  <div>
    <h1>Las fotos de tu torneo, en un solo enlace</h1>
    <p class="lead">Una galería por pabellón y un solo enlace para todo el torneo. Fotógrafos, voluntarios y familias suben desde el móvil, y los equipos eligen y descargan las suyas. Sin apps y sin crear cuentas para ellos.</p>
    <div class="cta"><a class="btn primary lg" href="${goHref}">${goText}</a>${user ? '' : '<a class="btn lg" href="/registro">Crear cuenta</a>'}</div>
    <p class="fine">¿Te han pasado el enlace de una galería? Ábrelo directamente, no necesitas cuenta.</p>
  </div>
  <div class="stage">
    <div class="frame">${img('admin-parent.webp', 'Panel de un torneo en Picfy: tres sedes como subgalerías y, debajo, las fotos de todas ellas con sus contadores', 1700, 1062, 'fetchpriority="high" loading="eager"')}</div>
    <div class="phone">${img('guest-phone.webp', 'La galería del torneo vista desde un móvil, con la portada, el título y las sedes', 560, 1212, 'loading="eager"')}</div>
  </div>
</div>

<section id="como">
  <h2>Así de sencillo</h2>
  <p class="sub">Montas el torneo una vez. Las sedes, los fotógrafos y los equipos trabajan cada uno con su enlace.</p>
  <ol class="steps">
    <li><h3>Crea el torneo y una galería por sede</h3><p>Una galería para el torneo y una subgalería por cada pabellón o pista, cada una con su propio enlace.</p></li>
    <li><h3>Reparte los enlaces</h3><p>Cada sede comparte su enlace o su código QR con sus fotógrafos y voluntarios. Cualquiera con el enlace puede subir fotos.</p></li>
    <li><h3>Revisa y entrega</h3><p>Aprueba lo que se publica y envía el enlace del torneo: cada equipo encuentra sus fotos, elige las que quiere y las descarga.</p></li>
  </ol>
</section>

<section id="funciones" style="padding-top:0">
  <div class="feat">
    <div class="txt">
      <h2>Una galería por sede, todas bajo el mismo torneo</h2>
      <p>Cada sede tiene su enlace, su moderación y su descarga. La página del torneo las enseña como tarjetas y quien entra elige la suya.</p>
      <ul>
        <li>Si juegan menores, enlaces privados con contraseña: solo sus familiares pueden verlos</li>
        <li>Cada sede se revisa y se descarga por separado</li>
        <li>Duplica el torneo con sus sedes y ajustes para la próxima edición (las fotos no se copian)</li>
      </ul>
    </div>
    <div class="pic"><div class="frame kb">${img('guest-desktop.webp', 'Página del torneo con tres tarjetas de sedes: Pabellón Norte, Pista Central y Polideportivo Sur', 1500, 949)}</div></div>
  </div>

  <div class="feat flip">
    <div class="pic pair">
      <div class="phone">${img('upload-phone.webp', 'Diálogo para subir fotos desde el móvil en la galería de una sede', 560, 1212)}</div>
      <div class="float">${img('share.webp', 'Ventana para compartir la galería con enlace y código QR', 900, 848)}</div>
    </div>
    <div class="txt">
      <h2>Fotógrafos y voluntarios suben desde la pista</h2>
      <p>Abren el enlace o escanean el QR, escriben su nombre y suben fotos desde el móvil, sin cuentas ni apps.</p>
      <ul>
        <li>Límite de fotos por persona, si lo quieres</li>
        <li>Aviso de consentimiento antes de subir, con el texto que tú elijas: útil si hay jugadores menores</li>
        <li>Fotos nuevas en revisión hasta que las apruebes</li>
      </ul>
    </div>
  </div>

  <div class="feat">
    <div class="txt">
      <h2>Tú decides qué se publica</h2>
      <p>Revisa las fotos de cada sede, marca con banderas de colores las que irán a redes y destaca tus favoritas. Filtra por invitado, por día (cada jornada) o por nombre de archivo.</p>
      <ul>
        <li>Aprueba, rechaza o retira fotos con un clic</li>
        <li>Papelera: 7 días para las fotos y 30 para las galerías enteras</li>
        <li>Ordena por hora de captura y arrastra para cambiar el orden</li>
      </ul>
    </div>
    <div class="pic"><div class="frame kb kb2">${img('admin-sub.webp', 'Panel de la sede Pista Central con fotos marcadas con banderas y favoritas', 1700, 1062)}</div></div>
  </div>

  <div class="feat flip">
    <div class="pic"><div class="frame kb">${img('lightbox.webp', 'Una foto a pantalla completa con los comentarios de los asistentes', 1500, 949)}</div></div>
    <div class="txt">
      <h2>Los equipos encuentran sus fotos y las descargan</h2>
      <p>Una galería limpia con la portada del torneo, que se abre en cualquier móvil. Las fotos están ordenadas por hora de captura y se ven a pantalla completa.</p>
      <ul>
        <li>Me gusta y comentarios en cada foto</li>
        <li>Descarga una a una, una selección o todo en ZIP, en tamaño original</li>
        <li>Enlaces privados con contraseña para que solo las familias puedan verlas, y fecha de caducidad</li>
      </ul>
    </div>
  </div>

  <div class="feat">
    <div class="txt">
      <h2>Cada club elige sus fotos y te las envía</h2>
      <p>El club toca el círculo de las fotos que quiere y pulsa «Enviar al fotógrafo». Te llega la lista con su nombre, su mensaje y la sede de la que son, y el botón de la galería te avisa de que hay una selección nueva.</p>
      <ul>
        <li>La misma selección sirve para descargar y para enviar</li>
        <li>Con un clic marcas sus fotos como favoritas o ves solo esas</li>
        <li>El aviso por email es opcional</li>
      </ul>
    </div>
    <div class="pic" style="margin-bottom:9%">
      <div class="frame kb kb2">${img('selection.webp', 'Galería de una sede con fotos elegidas y el botón Enviar al fotógrafo', 1500, 949)}</div>
      <div class="float" style="right:-3%;bottom:-12%;width:46%">${img('selections.webp', 'Lista de fotos elegidas por un club, con su mensaje, en el panel del fotógrafo', 900, 518)}</div>
    </div>
  </div>

  <div class="feat flip">
    <div class="pic tall"><div class="frame">${img('stats.webp', 'Ventana de estadísticas del torneo con visitas, descargas y fotos subidas por día', 900, 1500)}</div></div>
    <div class="txt">
      <h2>Sabes qué sede y qué fotos mueven más</h2>
      <p>Las estadísticas del torneo suman todas las sedes, y cada sede tiene las suyas. Cada foto muestra cuántas veces la han abierto, cuántos me gusta tiene y cuántos comentarios.</p>
      <ul>
        <li>Visitas, visitantes y descargas, día a día</li>
        <li>Fotos subidas por día y quién sube más</li>
        <li>Las fotos más abiertas de la galería</li>
      </ul>
    </div>
  </div>

  <div class="feat">
    <div class="txt">
      <h2>Toda la temporada bajo un solo enlace</h2>
      <p>Si organizas varios torneos o categorías, júntalos en una colección y envía un único enlace. Cada galería conserva sus propios ajustes.</p>
      <ul>
        <li>Elige el orden en que aparecen las galerías</li>
        <li>Las galerías privadas, cerradas o caducadas no se muestran</li>
        <li>Color, portada y foto de perfil distintos en cada galería</li>
      </ul>
    </div>
    <div class="pic"><div class="frame kb">${img('collection.webp', 'Página de una colección con tres galerías de la temporada 2026', 1500, 660)}</div></div>
  </div>
</section>

<section>
  <h2>Y además</h2>
  <div class="more">
    <div><h3>Fotos en su calidad original</h3><p>Se guardan tal como se suben, y las descargas en ZIP se reparten en partes cuando la galería es grande.</p></div>
    <div><h3>Privado para las familias</h3><p>Si juegan tus hijos o el torneo es de menores, crea enlaces privados con contraseña para que solo sus familiares puedan verlo. Puedes ponerla a toda la galería o a una sede o categoría concreta.</p></div>
    <div><h3>Caducidad</h3><p>Elige hasta cuándo se puede ver una galería y si se borra después.</p></div>
    <div><h3>Moderación de comentarios</h3><p>Borra cualquier comentario desde el visor. Los asistentes pueden borrar los suyos.</p></div>
    <div><h3>Panel por cuenta</h3><p>Cada organizador ve solo sus galerías, con aviso de selecciones nuevas en la lista.</p></div>
    <div><h3>Pensado para el móvil</h3><p>Fotógrafos, familias y clubes no instalan nada: todo funciona desde el navegador.</p></div>
  </div>
</section>

<div class="end">
  <h2>Prepara tu próximo torneo</h2>
  <p>Entra, crea la galería con una subgalería por sede y reparte los enlaces. Tus fotógrafos pueden empezar a subir fotos en cuanto los reciban.</p>
  <div class="cta"><a class="btn primary lg" href="${goHref}">${goText}</a>${user ? '' : '<a class="btn lg" href="/registro">Crear cuenta</a>'}</div>
</div>
</main>

<footer>
  <a class="logo" href="/" style="font-size:1.1rem"><i aria-hidden="true" style="width:20px;height:20px;border-radius:6px"></i>Picfy</a>
  <div class="links"><a href="${goHref}">${goText}</a>${user ? '' : '<a href="/registro">Crear cuenta</a>'}</div>
</footer>
</div>
<script>${JS}</script>
</body>
</html>`;
}
