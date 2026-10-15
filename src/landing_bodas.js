// Página de inicio pública de Picfy (picfy.es). HTML y CSS propios, sin depender de la app.
import { ASSET_V } from './version.js';

export const CSS = `
@font-face{font-family:"Bricolage";font-style:normal;font-weight:200 800;font-display:swap;src:url(/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:"Bricolage";font-style:normal;font-weight:200 800;font-display:swap;src:url(/vendor/fonts/bricolage-grotesque-latin-ext-wght-normal.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0}
:root{--ink:#1c1611;--muted:#665c51;--line:#ece4d9;--amber:#edb265;--amber-d:#9b5d0e;--paper:#fff;--tint:#fdf6ec;--r:20px;
  --dusk:linear-gradient(158deg,#2b2150 0%,#74406d 36%,#df7461 68%,#edb265 100%)}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:400 1.0625rem/1.6 "Bricolage",system-ui,-apple-system,"Segoe UI",sans-serif;font-optical-sizing:auto;overflow-x:hidden}
a{color:inherit}
img{display:block;max-width:100%;height:auto}
:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:8px}
.bg{position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(60% 40% at 8% 0%,rgba(237,178,101,.22),transparent 70%),radial-gradient(50% 35% at 100% 18%,rgba(237,178,101,.13),transparent 70%)}
.wrap{width:min(1180px,100% - 40px);margin-inline:auto}
header.top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 0}
.logo{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:1.45rem;letter-spacing:-.03em;text-decoration:none}
.logo i{width:26px;height:26px;border-radius:8px;background:linear-gradient(145deg,#f6c98a,var(--amber));box-shadow:0 4px 12px rgba(237,178,101,.55)}
nav.main{display:flex;align-items:center;gap:6px}
nav.main a{text-decoration:none;padding:8px 14px;border-radius:999px;font-weight:500;color:var(--muted)}
nav.main a:hover{color:var(--ink);background:rgba(237,178,101,.16)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:600;text-decoration:none;border-radius:999px;padding:.8em 1.5em;border:1px solid var(--line);background:#fff;color:var(--ink);transition:transform .15s,box-shadow .15s,background .15s}
.btn:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(60,36,8,.12)}
.btn.primary{background:var(--amber);border-color:var(--amber);box-shadow:0 8px 26px rgba(237,178,101,.5)}
.btn.primary:hover{background:#f2bd78}
.btn.lg{padding:.95em 1.8em;font-size:1.05rem}
/* portada */
.hero{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(24px,4vw,64px);align-items:center;padding:clamp(24px,5vw,56px) 0 clamp(8px,2vw,24px)}
#como{padding-top:clamp(40px,5vw,72px)}
h1{font-size:clamp(2.7rem,6.4vw,5.4rem);line-height:1;letter-spacing:-.045em;font-weight:800;margin:0 0 .35em;text-wrap:balance}
.lead{font-size:clamp(1.1rem,1.7vw,1.3rem);color:var(--muted);max-width:30em;margin:0 0 1.6em;text-wrap:pretty}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.fine{margin:1.4em 0 0;font-size:.95rem;color:var(--muted)}
.stage{position:relative;padding:0 0 70px}
.frame{border-radius:var(--r);overflow:hidden;background:#fff;border:1px solid rgba(60,36,8,.1);box-shadow:0 30px 70px -20px rgba(94,56,10,.35),0 6px 18px rgba(94,56,10,.08)}
.frame img{width:100%}
.phone{position:absolute;left:-4%;bottom:0;width:min(30%,210px);border-radius:30px;border:6px solid var(--ink);overflow:hidden;box-shadow:0 26px 50px -12px rgba(30,16,4,.5);background:#fff}
.phone img{width:100%}
/* secciones */
section{padding:clamp(48px,7vw,104px) 0}
h2{font-size:clamp(1.9rem,4vw,3.1rem);line-height:1.04;letter-spacing:-.035em;font-weight:800;margin:0 0 .5em;text-wrap:balance}
h3{font-size:1.2rem;line-height:1.25;letter-spacing:-.015em;margin:0 0 .3em}
.sub{color:var(--muted);max-width:36em;margin:0;text-wrap:pretty}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,3vw,48px);margin-top:44px;padding:0;list-style:none;counter-reset:s}
.steps li{counter-increment:s;border-top:2px solid var(--ink);padding-top:18px}
.steps li::before{content:counter(s);display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--amber);font-weight:800;margin-bottom:14px}
.steps p{margin:0;color:var(--muted)}
.feat{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(28px,5vw,80px);align-items:center}
.feat.flip{grid-template-columns:minmax(0,6fr) minmax(0,5fr)}
.feat.flip .txt{order:2}
.feat + .feat{margin-top:clamp(64px,9vw,128px)}
.txt p{margin:0 0 1em;color:var(--muted);text-wrap:pretty}
.txt ul{margin:1.2em 0 0;padding:0;list-style:none;display:grid;gap:.55em}
.txt li{position:relative;padding-left:1.6em}
.txt li::before{content:"";position:absolute;left:0;top:.62em;width:.8em;height:.8em;border-radius:50%;background:var(--amber)}
.pic{position:relative}
.pic .frame{border-radius:18px}
.float{position:absolute;border-radius:16px;overflow:hidden;border:1px solid rgba(60,36,8,.1);box-shadow:0 24px 50px -14px rgba(60,32,6,.45);background:#fff}
.pair{display:flex;gap:clamp(12px,3vw,32px);align-items:flex-start;justify-content:center}
.pair .phone{position:static;width:min(46%,250px)}
.pair .float{position:static;width:min(50%,280px);margin-top:48px}
.tall{max-width:420px;margin-inline:auto}
.more{display:grid;grid-template-columns:repeat(3,1fr);gap:36px clamp(24px,4vw,56px);margin-top:44px}
.more div{border-top:1px solid var(--line);padding-top:16px}
.more p{margin:0;color:var(--muted);font-size:1rem}
.end{background:var(--dusk);color:#fff;border-radius:clamp(22px,3vw,36px);padding:clamp(40px,7vw,96px) clamp(24px,6vw,88px);text-align:center;margin-bottom:clamp(40px,6vw,72px)}
.end h2{color:#fff;margin-inline:auto;max-width:14em}
.end p{margin:0 auto 1.8em;max-width:32em;color:rgba(255,255,255,.88)}
.end .cta{justify-content:center}
.end .btn:not(.primary){background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.4);color:#fff}
.end .btn.primary{color:var(--ink)}
footer{display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center;justify-content:space-between;padding:8px 0 40px;color:var(--muted);font-size:.95rem}
footer a{text-decoration:none}footer a:hover{color:var(--ink)}
footer .links{display:flex;gap:22px}
@media (max-width:980px){
  .hero,.feat,.feat.flip{grid-template-columns:1fr}
  .feat.flip .txt{order:0}
  .stage{margin-top:8px}
  .phone{left:0;width:min(34%,170px)}
  .steps,.more{grid-template-columns:1fr 1fr}
}
@media (max-width:640px){
  nav.main a:not(.btn){display:none}
  .steps,.more{grid-template-columns:1fr}
  .stage{padding-bottom:56px}
  .pair .float{margin-top:24px}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn{transition:none}}
`;

const img = (src, alt, w, h, extra = '') => `<img src="/landing/${src}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;

export function landingPage() {
  const title = 'Picfy · Galerías de fotos para eventos, con tus invitados y tus clientes';
  const desc = 'Tus invitados suben sus fotos con un enlace, tú las revisas y tu cliente las ve, las elige y las descarga. Galerías compartidas para bodas, eventos y torneos.';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://picfy.es/">
<meta property="og:type" content="website"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="Picfy">
<meta property="og:title" content="Picfy · Las fotos de tu evento, en un solo enlace"><meta property="og:description" content="${desc}">
<meta property="og:url" content="https://picfy.es/"><meta property="og:image" content="https://picfy.es/landing/og.jpg?v=${ASSET_V}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="preload" href="/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
</head>
<body>
<div class="bg" aria-hidden="true"></div>
<div class="wrap">
<header class="top">
  <a class="logo" href="/"><i aria-hidden="true"></i>Picfy</a>
  <nav class="main" aria-label="Principal">
    <a href="#como">Cómo funciona</a><a href="#funciones">Funciones</a><a class="btn" href="/entrar">Entrar</a>
  </nav>
</header>

<main>
<div class="hero">
  <div>
    <h1>Las fotos de tu evento, en un solo enlace</h1>
    <p class="lead">En Picfy tus invitados suben sus fotos y tus clientes ven, eligen y descargan las tuyas. Sin apps y sin crear cuentas para ellos.</p>
    <div class="cta"><a class="btn primary lg" href="/entrar">Entrar</a><a class="btn lg" href="/registro">Tengo un código de invitación</a></div>
    <p class="fine">¿Te han pasado el enlace de una galería? Ábrelo directamente, no necesitas cuenta.</p>
  </div>
  <div class="stage">
    <div class="frame">${img('admin.webp', 'Panel de una galería de boda en Picfy, con fotos, contadores de visitas y me gusta, y herramientas a la izquierda', 1700, 1062, 'fetchpriority="high" loading="eager"')}</div>
    <div class="phone">${img('guest-phone.webp', 'La galería vista desde un móvil, con la portada, el título y las primeras fotos', 560, 1212, 'loading="eager"')}</div>
  </div>
</div>

<section id="como">
  <h2>Así de sencillo</h2>
  <p class="sub">Creas la galería una vez y el resto lo hacen tus invitados y tu cliente desde el móvil.</p>
  <ol class="steps">
    <li><h3>Crea la galería</h3><p>Ponle nombre, portada y tu color. Decides si las fotos se publican al subirlas o las revisas tú antes.</p></li>
    <li><h3>Comparte el enlace</h3><p>Copia el enlace o enseña el código QR. Tus invitados lo abren y suben sus fotos con su nombre.</p></li>
    <li><h3>Revisa y entrega</h3><p>Aprueba lo que se publica, sube tus fotos y envía el mismo enlace a tu cliente para que las elija y las descargue.</p></li>
  </ol>
</section>

<section id="funciones" style="padding-top:0">
  <div class="feat">
    <div class="txt">
      <h2>Tus invitados suben fotos sin registrarse</h2>
      <p>Abren el enlace o escanean el QR, escriben su nombre y suben fotos desde el móvil.</p>
      <ul>
        <li>Límite de fotos por persona, si lo quieres</li>
        <li>Aviso de consentimiento antes de subir, con el texto que tú elijas</li>
        <li>Fotos nuevas en revisión hasta que las apruebes</li>
      </ul>
    </div>
    <div class="pic pair">
      <div class="phone">${img('upload-phone.webp', 'Diálogo para subir fotos desde el móvil, con el nombre del invitado', 560, 1212)}</div>
      <div class="float">${img('share.webp', 'Ventana para compartir la galería con enlace y código QR', 900, 848)}</div>
    </div>
  </div>

  <div class="feat flip">
    <div class="pic"><div class="frame">${img('admin.webp', 'Panel de moderación de la galería con banderas de colores, favoritas y filtros', 1700, 1062)}</div></div>
    <div class="txt">
      <h2>Tú decides qué se publica</h2>
      <p>Revisa las fotos como en una mesa de luz: marca con banderas de colores, destaca tus favoritas y filtra por invitado, por día o por nombre de archivo.</p>
      <ul>
        <li>Aprueba, rechaza o retira fotos con un clic</li>
        <li>Papelera: 7 días para las fotos y 30 para las galerías enteras</li>
        <li>Ordena por hora de captura y arrastra para cambiar el orden</li>
      </ul>
    </div>
  </div>

  <div class="feat">
    <div class="txt">
      <h2>Tu cliente las ve, las comenta y las descarga</h2>
      <p>Una galería limpia, con tu portada y tu foto de perfil. Se abre en cualquier móvil y las fotos se ven a pantalla completa.</p>
      <ul>
        <li>Me gusta y comentarios en cada foto</li>
        <li>Descarga una a una, una selección o todo en ZIP, en tamaño original</li>
        <li>Contraseña y fecha de caducidad, si la galería lo necesita</li>
      </ul>
    </div>
    <div class="pic"><div class="frame">${img('lightbox.webp', 'Una foto a pantalla completa con los comentarios de los invitados', 1500, 949)}</div></div>
  </div>

  <div class="feat flip">
    <div class="pic" style="margin-bottom:9%">
      <div class="frame">${img('selection.webp', 'Galería con siete fotos elegidas y el botón Enviar al fotógrafo', 1500, 949)}</div>
      <div class="float" style="right:-3%;bottom:-12%;width:46%">${img('selections.webp', 'Lista de fotos elegidas por la clienta, con su mensaje, en el panel del fotógrafo', 900, 652)}</div>
    </div>
    <div class="txt">
      <h2>Elige sus favoritas y te las envía</h2>
      <p>Tu cliente toca el círculo de las fotos que más le gustan y pulsa «Enviar al fotógrafo». Te llega la lista con su nombre y su mensaje, y el botón de la galería te avisa de que hay una selección nueva.</p>
      <ul>
        <li>La misma selección sirve para descargar y para enviar</li>
        <li>Con un clic marcas sus fotos como favoritas o ves solo esas</li>
        <li>El aviso por email es opcional</li>
      </ul>
    </div>
  </div>

  <div class="feat">
    <div class="txt">
      <h2>Sabes qué fotos gustan y quién las mueve</h2>
      <p>Cada galería tiene su ventana de estadísticas, y cada foto muestra cuántas veces la han abierto, cuántos me gusta tiene y cuántos comentarios.</p>
      <ul>
        <li>Visitas, visitantes y descargas, día a día</li>
        <li>Fotos subidas por día y los invitados que más suben</li>
        <li>Las fotos más abiertas de la galería</li>
      </ul>
    </div>
    <div class="pic tall"><div class="frame">${img('stats.webp', 'Ventana de estadísticas con visitas, descargas y fotos subidas por día', 900, 1296)}</div></div>
  </div>

  <div class="feat flip">
    <div class="pic"><div class="frame">${img('collection.webp', 'Página de una colección con tres galerías de una misma boda', 1500, 660)}</div></div>
    <div class="txt">
      <h2>Varias galerías, un solo enlace</h2>
      <p>Si un cliente tiene preboda, boda y fiesta, júntalas en una colección y envíale un único enlace. Cada galería conserva sus propios ajustes.</p>
      <ul>
        <li>Subgalerías dentro de una galería, por ejemplo una por sede o por pista</li>
        <li>Duplica una galería con sus ajustes para el siguiente evento</li>
        <li>Color, portada y foto de perfil distintos en cada galería</li>
      </ul>
    </div>
  </div>
</section>

<section>
  <h2>Y además</h2>
  <div class="more">
    <div><h3>Fotos en su calidad original</h3><p>Se guardan tal como se suben, y las descargas en ZIP se reparten en partes cuando la galería es grande.</p></div>
    <div><h3>Galerías privadas</h3><p>Pon una contraseña a la galería o a una subgalería concreta.</p></div>
    <div><h3>Caducidad</h3><p>Elige hasta cuándo se puede ver una galería y si se borra después.</p></div>
    <div><h3>Moderación de comentarios</h3><p>Borra cualquier comentario desde el visor. Los invitados pueden borrar los suyos.</p></div>
    <div><h3>Panel por cuenta</h3><p>Cada fotógrafo ve solo sus galerías, con aviso de selecciones nuevas en la lista.</p></div>
    <div><h3>Pensado para el móvil</h3><p>Los invitados y los clientes no instalan nada: todo funciona desde el navegador.</p></div>
  </div>
</section>

<div class="end">
  <h2>Prepara tu próxima galería</h2>
  <p>Entra, crea la galería y comparte el enlace. Tus invitados pueden empezar a subir fotos en cuanto reciban el enlace.</p>
  <div class="cta"><a class="btn primary lg" href="/entrar">Entrar</a><a class="btn lg" href="/registro">Crear cuenta con código</a></div>
</div>
</main>

<footer>
  <a class="logo" href="/" style="font-size:1.1rem"><i aria-hidden="true" style="width:20px;height:20px;border-radius:6px"></i>Picfy</a>
  <div class="links"><a href="/entrar">Entrar</a><a href="/registro">Crear cuenta</a></div>
</footer>
</div>
</body>
</html>`;
}
