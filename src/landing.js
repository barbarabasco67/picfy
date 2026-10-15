// Página de inicio pública de Picfy (picfy.es), enfocada a torneos con varias sedes.
// La versión anterior, para bodas, está en landing_bodas.js (imágenes en /landing/).
import { ASSET_V } from './version.js';
import { CSS } from './landing_bodas.js';

const img = (src, alt, w, h, extra = '') => `<img src="/torneos/${src}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;

export function landingPage() {
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
<meta property="og:title" content="Picfy · Las fotos de tu torneo, cada sede en su sitio"><meta property="og:description" content="${desc}">
<meta property="og:url" content="https://picfy.es/"><meta property="og:image" content="https://picfy.es/torneos/og.jpg?v=${ASSET_V}">
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
    <h1>Las fotos de tu torneo, cada sede en su sitio</h1>
    <p class="lead">Una galería por pabellón y un solo enlace para todo el torneo. Fotógrafos, voluntarios y familias suben desde el móvil, y los equipos eligen y descargan las suyas. Sin apps y sin crear cuentas para ellos.</p>
    <div class="cta"><a class="btn primary lg" href="/entrar">Entrar</a><a class="btn lg" href="/registro">Tengo un código de invitación</a></div>
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
        <li>Contraseña distinta por sede, si hace falta</li>
        <li>Cada sede se revisa y se descarga por separado</li>
        <li>Duplica el torneo con sus sedes y ajustes para la próxima edición (las fotos no se copian)</li>
      </ul>
    </div>
    <div class="pic"><div class="frame">${img('guest-desktop.webp', 'Página del torneo con tres tarjetas de sedes: Pabellón Norte, Pista Central y Polideportivo Sur', 1500, 949)}</div></div>
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
    <div class="pic"><div class="frame">${img('admin-sub.webp', 'Panel de la sede Pista Central con fotos marcadas con banderas y favoritas', 1700, 1062)}</div></div>
  </div>

  <div class="feat flip">
    <div class="pic"><div class="frame">${img('lightbox.webp', 'Una foto a pantalla completa con los comentarios de los asistentes', 1500, 949)}</div></div>
    <div class="txt">
      <h2>Los equipos encuentran sus fotos y las descargan</h2>
      <p>Una galería limpia con la portada del torneo, que se abre en cualquier móvil. Las fotos están ordenadas por hora de captura y se ven a pantalla completa.</p>
      <ul>
        <li>Me gusta y comentarios en cada foto</li>
        <li>Descarga una a una, una selección o todo en ZIP, en tamaño original</li>
        <li>Contraseña y fecha de caducidad, si la galería lo necesita</li>
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
      <div class="frame">${img('selection.webp', 'Galería de una sede con fotos elegidas y el botón Enviar al fotógrafo', 1500, 949)}</div>
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
    <div class="pic"><div class="frame">${img('collection.webp', 'Página de una colección con tres galerías de la temporada 2026', 1500, 660)}</div></div>
  </div>
</section>

<section>
  <h2>Y además</h2>
  <div class="more">
    <div><h3>Fotos en su calidad original</h3><p>Se guardan tal como se suben, y las descargas en ZIP se reparten en partes cuando la galería es grande.</p></div>
    <div><h3>Galerías privadas</h3><p>Pon una contraseña a la galería o a una sede concreta.</p></div>
    <div><h3>Caducidad</h3><p>Elige hasta cuándo se puede ver una galería y si se borra después.</p></div>
    <div><h3>Moderación de comentarios</h3><p>Borra cualquier comentario desde el visor. Los asistentes pueden borrar los suyos.</p></div>
    <div><h3>Panel por cuenta</h3><p>Cada organizador ve solo sus galerías, con aviso de selecciones nuevas en la lista.</p></div>
    <div><h3>Pensado para el móvil</h3><p>Fotógrafos, familias y clubes no instalan nada: todo funciona desde el navegador.</p></div>
  </div>
</section>

<div class="end">
  <h2>Prepara tu próximo torneo</h2>
  <p>Entra, crea la galería con una subgalería por sede y reparte los enlaces. Tus fotógrafos pueden empezar a subir fotos en cuanto los reciban.</p>
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
