// Portfolio público de Pablo y Bárbara en picfy.es/portfolio.
// El HTML se genera aquí; estilos, efectos, fotos y vídeos están en /public/portfolio/.
import { ASSET_V } from './version.js';
import D from './portfolio-dims.json';

const P = '/portfolio';
const TEL = '690 770 638';
const TEL_LINK = 'tel:+34690770638';
const WA_LINK = 'https://wa.me/34690770638?text=' + encodeURIComponent('Hola, he visto vuestro portfolio y me gustaría contaros un proyecto.');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

// textos alternativos de las fotos (por orden en la galería)
const PH_ALT = ["Jugador con el balón frente a una pared de colores", "Equipo de 3x3 posando con su entrenador", "Jugadora botando dos balones en pista", "Jugador entrenando saltos junto a su entrenador", "Jugadoras de un equipo preparándose antes del partido", "Clase de ciclo indoor con luces azules", "Jugador preparando un tiro", "Jugador lanzando el balón en pista", "Pasillo de la zona de entrenamiento de Krown Fitness", "Entrenador con el balón entre las manos", "Entrenador con camiseta roja", "Jugador posando con el balón", "Sala de máquinas de Krown Fitness", "Joven jugador en una sesión de fotos", "Niño tumbado en la pista", "Cuatro jugadoras posando en pista", "Mujer colgada de una barra en el gimnasio", "Jugador con gafas deportivas", "Jugadores disputando un rebote bajo la canasta", "Niños dándose la mano durante un partido", "Fachada de Krown Fitness al atardecer", "Clase de ciclo con humo y luces", "Niño lanzando a canasta", "Instructor tumbado dirigiendo una clase", "Jugador lanzando a canasta con gradas naranjas", "Retrato de jugador con luz de contraluz", "Instructor de una clase colectiva con una pelota", "Jugador con el balón y mirada al frente", "Dos jóvenes jugadores de Las Rozas 3x3", "Salto a canasta durante un partido", "Jugador y entrenador de apoyo en un entrenamiento", "Entrenador con camiseta negra", "Jugador de Pro Basket Lab", "Instructor de ciclo con luces de colores", "Instructor señalando durante una clase", "Jugador saltando contra una pared de entrenamiento", "Joven con una pared de luces de reacción", "Mujer en el gimnasio con suplementos", "Jugadora de perfil con coleta", "Joven posando en un gimnasio", "Joven con el balón y el entrenador de espaldas", "Niños con una pizarra durante un entrenamiento", "Jugador de perfil con trenzas", "Equipo con pancartas en pista", "Duelo entre dos jugadores por el balón", "Bicicleta de ciclo indoor en movimiento", "Niño de Las Rozas 3x3 con el balón bajo el brazo", "Retrato de un niño con camiseta de colores", "Dos niños durante un partido", "Niño pasando el balón en pista", "Niño con gafas deportivas mirando hacia arriba", "Niño con camiseta rosa preparando un tiro", "Detalle de un plato de pescado con salsa y brotes", "Bacalao con salsa naranja, jamón crujiente y brotes", "Atún a la plancha sobre pan tostado con verduras", "Carpaccio de carne curada con frutos secos y brotes", "Tarta de tiramisú con frutos rojos", "Porción de tarta de queso con frutos rojos", "Máquinas de gimnasio con neón morado y espejo", "Pasillo de sala de musculación con luces azules", "Racks de pesas con discos de colores", "Zona de banco y poleas bajo carteles motivacionales", "Pared de azulejos con luz azul y barras de pesas", "Rack con discos y logo de Krown en el suelo", "Sala de ciclo con luces verdes y moradas", "Zona de mancuernas con luz roja y espejos", "Fachada de Krown Fitness de noche", "Guiso de carne con puerro frito en un plato blanco", "Jugador lanzando a canasta en el pabellón Aristos", "Niño saltando hacia el aro con el balón", "Jugador de Pro Basket Lab pasando el balón a cámara", "Niño defendiendo un pase en un entrenamiento", "Jugador protegiendo el balón ante un defensor", "Tres jugadores disputando el balón en pista", "Dos jugadores saltando junto al aro", "Jugadoras de Las Rozas 3x3 abrazándose tras el partido"];

const MD_ALT = ['Jugadora de Las Rozas 3x3 con el balón sobre el hombro', 'Jugador con el balón de 3x3 en fondo de estudio', 'Jugador de Las Rozas 3x3 girando el balón', 'Niño de espaldas con el balón',
  'Jugador con el balón bajo el brazo', 'Jugadora con el balón de 3x3 junto a la cara', 'Jugadora con dos balones', 'Jugador señalando a cámara',
  'Jugadora haciendo girar el balón', 'Niño con el balón en la mano', 'Tres jugadores jóvenes posando', 'Tres jugadores con las manos en la cara',
  'Dos jóvenes jugadores espalda con espalda con gafas de sol', 'Pareja de jugadores de 3x3 posando con el balón', 'Jugadora sonriente con el balón 3x3', 'Jugadora tapándose la cara con el balón 3x3',
  'Jugadora de espaldas con el balón bajo el brazo', 'Dos jugadoras riendo con el balón entre ambas', 'Entrenador con el balón en fondo oscuro', 'Jugadora de Las Rozas 3x3 con el balón sobre el hombro',
  'Jugadora sonriente con el balón en fondo oscuro', 'Niño señalando a cámara con el balón', 'Joven jugador señalando a cámara', 'Jugador girando el balón en el dedo'];
const DS_ALT = ['Cartel de jugador Shanghai Future Stars 2026', 'Roster U12 de La Roda Future Stars', 'Cartel Campeonas de la liga de invierno 3x3', 'Cartel de convocatoria con jugadores de Las Rozas 3x3',
  'Cartel Champions Shanghai Future Stars', 'Cartel de roster U12 con camisetas', 'Cartel Masterclass Bike de Scream', 'Cartel Masterclass Body Combat Halloween',
  'Cartel Masterclass Bike de Saw', 'Cartel del curso de liderazgo de Behind the Bench Institute', 'Cartel de La Roda U12W Future Stars', 'Ficha de jugador PBL Elite Combine',
  'Cartel de cuotas de Krown Fitness', 'Banner de Black Friday de Krown Fitness', 'Cartel del torneo internacional de ajedrez de La Roda', 'Manual de identidad visual de Krown Fitness'];

const ph = (n, cls = '', eager = false) => {
  const d = D.photos[n - 1];
  return `<figure class="ph ${cls}" data-r><img src="${P}/ph/${pad(n)}.webp?v=${ASSET_V}" width="${d.w}" height="${d.h}" alt="${esc(PH_ALT[n - 1] || 'Fotografía deportiva')}" data-lb="${P}/ph/${pad(n)}-l.webp?v=${ASSET_V}" data-alt="${esc(PH_ALT[n - 1] || '')}" ${eager ? '' : 'loading="lazy"'} decoding="async"></figure>`;
};
const mdImg = (n) => {
  const d = D.md[n - 1];
  return `<figure class="mdf" data-r style="--d:${(n % 6) * 0.06}s"><img src="${P}/md/${pad(n)}.webp?v=${ASSET_V}" width="${d.w}" height="${d.h}" alt="${esc(MD_ALT[n - 1])}" data-lb="${P}/md/${pad(n)}-l.webp?v=${ASSET_V}" data-alt="${esc(MD_ALT[n - 1])}" loading="lazy" decoding="async"></figure>`;
};
const ds = (n) => {
  const d = D.ds[n - 1];
  return `<img class="poster" src="${P}/ds/${pad(n)}.webp?v=${ASSET_V}" width="${d.w}" height="${d.h}" alt="${esc(DS_ALT[n - 1])}" data-lb="${P}/ds/${pad(n)}.webp?v=${ASSET_V}" data-alt="${esc(DS_ALT[n - 1])}" loading="lazy" decoding="async">`;
};
// vídeo vertical que solo carga y se reproduce cuando se ve
const vid = (k, cls = '', label = '') =>
  `<video class="clip ${cls}" data-src="${P}/vid/${k}.mp4?v=${ASSET_V}" poster="${P}/vid/${k}.jpg?v=${ASSET_V}" muted loop playsinline preload="none" disablepictureinpicture ${label ? `aria-label="${esc(label)}"` : 'aria-hidden="true" tabindex="-1"'}></video>`;
const ui = (k, alt, extra = '') => {
  const s = D.ui[k];
  return `<img src="${P}/ui/${k}.webp?v=${ASSET_V}" width="${s[0]}" height="${s[1]}" alt="${esc(alt)}" ${extra} loading="lazy" decoding="async">`;
};
const marquee = (items, cls = '', secs = 60) => `<div class="mq ${cls}" style="--t:${secs}s"><div class="mq-in">${items}</div><div class="mq-in" aria-hidden="true">${items}</div></div>`;
const lines = (arr) => arr.map((l, i) => `<span class="ln"><span style="--i:${i}">${l}</span></span>`).join('');


// álbumes de fotografía: [clave, título, fotos [tipo, nº], portadas (posiciones en la lista)]
const ALB = [
  ['baloncesto', 'Baloncesto', [28, 7, 16, 8, 3, 2, 19, 25, 30, 31, 45, 44, 20, 23, 41, 42, 4, 5, 15, 36, 37, 69, 70, 71, 72, 73, 74, 75, 76].map((n) => ['ph', n]), [0, 2, 8, 6, 11]],
  ['retrato', 'Retrato', [1, 10, 11, 12, 14, 18, 26, 29, 32, 33, 39, 40, 43, 38, 47, 48, 49, 50, 51, 52].map((n) => ['ph', n]), [3, 1, 10, 13, 12]],
  ['mediaday', 'Media Day', Array.from({ length: 24 }, (_, i) => ['md', i + 1]), [2, 5, 0, 10, 7]],
  ['gastronomia', 'Gastronomía', [53, 54, 55, 56, 68, 57, 58].map((n) => ['ph', n]), [1, 0, 2, 4, 5]],
  ['espacios', 'Espacios', [21, 13, 9, 59, 60, 61, 62, 63, 64, 65, 66, 67].map((n) => ['ph', n]), [0, 1, 2, 3, 5]],
  ['eventos', 'Eventos', [27, 34, 35, 46, 24, 22, 6, 17].map((n) => ['ph', n]), [5, 1, 2, 7, 0]],
];
const albumHtml = (a) => {
  const [k, t, items, cov] = a;
  const src = ([ty, n], big) => `${P}/${ty}/${pad(n)}${big ? '-l' : ''}.webp?v=${ASSET_V}`;
  const alt = ([ty, n]) => (ty === 'md' ? MD_ALT[n - 1] : PH_ALT[n - 1]);
  const dim = ([ty, n]) => (ty === 'md' ? D.md[n - 1] : D.photos[n - 1]);
  const covers = cov.map((ix) => { const it = items[ix], d = dim(it); return `<img data-ix="${ix}" src="${src(it)}" width="${d.w}" height="${d.h}" alt="${esc(alt(it))}" loading="lazy" decoding="async">`; }).join('');
  return `<article class="album" data-gal="alb-${k}" tabindex="0" role="button" aria-label="Abrir el álbum ${esc(t)}, ${items.length} fotos" data-r>
    <div class="alb-mos${cov.length < 5 ? " m3" : ""}">${covers}</div>
    <div class="alb-cap"><h3>${esc(t)}</h3><span>${items.length} fotos<i aria-hidden="true">→</i></span></div>
    <div hidden aria-hidden="true">${items.map((it) => `<i data-lb="${src(it, true)}" data-alt="${esc(alt(it))}"></i>`).join('')}</div>
  </article>`;
};

const SERVICES = [
  ['apps', 'Apps y herramientas', 'Plataformas propias y herramientas a medida para resolver un problema concreto de tu negocio.'],
  ['webs', 'Diseño y desarrollo web', 'Del dominio y el hosting al SEO: todo el proceso, con tu identidad en cada página.'],
  ['video', 'Grabación y edición de vídeo', 'Piezas para redes, eventos, formación y campañas, adaptadas a cada plataforma.'],
  ['foto', 'Fotografía', 'Retrato, producto, gastronomía y deporte.'],
  ['diseno', 'Diseño gráfico e imagen de marca', 'Redes sociales, carteles, cartas, tarjetas y stands con una identidad coherente.'],
  ['contenido', 'Contenido y community manager', 'Contenido para redes pensado para que tu marca crezca.'],
];

const WEBS = [
  ['krown', 'Krown Fitness', 'krownfitness.es', 'https://www.krownfitness.es', 'w-krown', 'Página corporativa de un gimnasio, con tarifas, espacios y reserva.'],
  ['renta', 'Renta Élite', 'rentaelite.es', 'https://www.rentaelite.es', 'w-renta', 'Web corporativa con catálogo, servicios y formulario de contacto.'],
  ['bbi', 'Behind the Bench Institute', 'behindthebench.institute', 'https://www.behindthebench.institute/landing-video', 'w-bbi', 'Landing de venta con vídeo para una escuela de entrenadores.'],
];

export function portfolioPage() {
  const v = ASSET_V;
  const title = 'Webs, apps, vídeo, foto y contenido | Portfolio de Pablo y Bárbara';
  const desc = 'Webs, apps y herramientas a medida, grabación y edición de vídeo, fotografía, diseño gráfico y contenido para marcas. Portfolio de Pablo y Bárbara, Madrid.';
  const url = 'https://picfy.es/portfolio';
  const ld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Pablo y Bárbara', url,
    description: desc, telephone: '+34690770638', areaServed: 'ES', address: { '@type': 'PostalAddress', addressLocality: 'Madrid', addressCountry: 'ES' },
    makesOffer: SERVICES.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s[1] } })),
  });
  const albums = ALB.map(albumHtml).join('');
  const logos = D.logos.map((l, i) => `<li class="lg" data-i="${i}"><img src="${P}/logos/${l.k}.webp?v=${v}" width="${l.w}" height="${l.h}" alt="Logotipo de una marca cliente" loading="lazy" decoding="async"></li>`).join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#121110">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="Pablo y Bárbara">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="https://picfy.es${P}/og.jpg?v=${v}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${P}/fonts/league-gothic-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${P}/fonts/montserrat-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="${P}/ph/person.webp?v=${v}">
<link rel="stylesheet" href="${P}/portfolio.css?v=${v}">
<script type="application/ld+json">${ld}</script>
</head>
<body>
<div class="progress" aria-hidden="true"></div>
<div class="glow" aria-hidden="true"></div>

<header class="nav">
  <div class="wrap nav-in">
    <a class="brand" href="#top" aria-label="Inicio"><img src="${P}/logo.webp?v=${v}" alt="" width="256" height="255"></a>
    <nav class="menu" aria-label="Secciones">
      <a href="#apps">Apps</a><a href="#webs">Webs</a><a href="#video">Vídeo</a><a href="#foto">Foto</a><a href="#diseno">Diseño</a><a href="#contenido">Contenido</a><a href="#marcas">Marcas</a>
    </nav>
    <a class="nav-cta" href="#contacto">Hablemos</a>
    <button class="burger" type="button" aria-label="Abrir el menú" aria-expanded="false"><i></i><i></i></button>
  </div>
</header>

<main id="top">

<!-- HERO -->
<section class="hero" aria-labelledby="h1">
  <div class="hero-bg" aria-hidden="true"></div>
  <div class="hero-person" aria-hidden="true"><div class="hp-halo"></div><div class="hp-tilt"><img src="${P}/ph/person.webp?v=${v}" alt="" width="1358" height="904" fetchpriority="high" decoding="async"></div></div>
  <div class="wrap hero-in">
    <div class="hero-txt">
      <p class="eb rise">Pablo &amp; Bárbara&nbsp;·&nbsp;Madrid</p>
      <h1 id="h1" class="mega">${lines(['Webs, apps,', 'vídeo y foto', '<em>a tu imagen</em>'])}</h1>
      <p class="hero-sub rise" style="--i:5">Somos un equipo con ganas y experiencia que digitaliza tu empresa: webs, apps y herramientas a medida, vídeo, fotografía, diseño y contenido para redes.</p>
      <div class="hero-cta rise" style="--i:6">
        <a class="btn gold" href="#apps"><span>Ver proyectos</span><i aria-hidden="true">→</i></a>
        <a class="btn line" href="${WA_LINK}" target="_blank" rel="noopener"><span>Escríbenos por WhatsApp</span></a>
      </div>
    </div>
  </div>
  <div class="wrap hero-facts rise" style="--i:7">
    <div><b class="count" data-to="1.8" data-dec="1" data-suf=" M">1,8 M</b><span>visualizaciones en un solo vídeo</span></div>
    <div><b class="count" data-to="20000">20.000</b><span>seguidores con un solo TikTok</span></div>
    <div><b class="count" data-to="35" data-suf="+">35+</b><span>marcas que han confiado en nosotros</span></div>
    <div><b>6</b><span>servicios con un único equipo</span></div>
  </div>
</section>

<div class="band" aria-hidden="true">${marquee('<span>Webs</span><span>Apps</span><span>Vídeo</span><span>Fotografía</span><span>Diseño</span><span>Contenido</span>', 'ghost', 40)}</div>

<!-- QUÉ HACEMOS -->
<section class="sec" id="servicios" aria-labelledby="srv-t">
  <div class="wrap two">
    <div class="sticky-l">
      <p class="eb" data-r>Qué hacemos</p>
      <h2 class="h2" id="srv-t">${lines(['Un equipo,', 'todo el', 'proceso'])}</h2>
      <p class="lead" data-r>Nos implicamos en cada proyecto como si fuera nuestro y pensamos siempre en tu cliente. A veces entramos en una parte concreta; otras, acompañamos todo el camino, de la idea a la publicación.</p>
    </div>
    <ol class="rows">
      ${SERVICES.map((s, i) => `<li data-r style="--d:${i * 0.05}s"><a class="row" href="#${s[0]}"><span class="n">${pad(i + 1)}</span><span class="t"><b>${s[1]}</b><small>${s[2]}</small></span><span class="go" aria-hidden="true">↘</span></a></li>`).join('')}
    </ol>
  </div>
</section>

<!-- APPS -->
<section class="sec apps" id="apps" aria-labelledby="app-t">
  <div class="wrap">
    <div class="head">
      <p class="eb" data-r>01&nbsp;—&nbsp;Apps y herramientas</p>
      <h2 class="h2" id="app-t">${lines(['Hechas para', 'el baloncesto'])}</h2>
      <p class="lead" data-r>Además de webs, desarrollamos apps y herramientas propias o a medida. Estas son dos que creamos, mantenemos y usamos a diario.</p>
    </div>

    <article class="app pbf">
      <div class="app-vis" aria-label="Capturas de Playbook Finder">
        <div class="shot s1" data-speed="0.05" data-r="zoom">${ui('pb-dash', 'Panel de entrenamientos de Playbook Finder', `data-lb="${P}/ui/pb-dash.webp?v=${v}" data-alt="Panel de entrenamientos de Playbook Finder"`)}</div>
        <div class="shot s2" data-speed="0.18" data-r="zoom" style="--d:.1s">${ui('pb-editor', 'Editor de jugadas de Playbook Finder', `data-lb="${P}/ui/pb-editor.webp?v=${v}" data-alt="Editor de jugadas de Playbook Finder"`)}</div>
        <div class="shot s3" data-speed="0.3" data-r="zoom" style="--d:.2s">${ui('pb-lib', 'Biblioteca de jugadas de Playbook Finder', `data-lb="${P}/ui/pb-lib.webp?v=${v}" data-alt="Biblioteca de jugadas de Playbook Finder"`)}</div>
        <div class="shot s4" data-speed="0.1" data-r="zoom" style="--d:.3s">${ui('pb-scout', 'Análisis de vídeo de Playbook Finder', `data-lb="${P}/ui/pb-scout.webp?v=${v}" data-alt="Análisis de vídeo de Playbook Finder"`)}</div>
      </div>
      <div class="app-txt">
        <p class="eb" data-r>App web&nbsp;·&nbsp;Baloncesto</p>
        <h3 class="h3" data-r>Playbook Finder</h3>
        <p data-r>La biblioteca de jugadas animadas para entrenadores. Busca, guarda y crea tus propias jugadas, planifica entrenamientos y analiza vídeo, todo desde un mismo sitio.</p>
        <ul class="ticks" data-r><li>Biblioteca de jugadas</li><li>Editor de jugadas</li><li>Análisis de vídeo</li><li>Panel de entrenamientos</li></ul>
        <a class="btn gold" data-r href="https://playbookfinder.com" target="_blank" rel="noopener"><span>playbookfinder.com</span><i aria-hidden="true">↗</i></a>
      </div>
    </article>

    <article class="app pcf">
      <div class="app-txt">
        <p class="eb" data-r>App web&nbsp;·&nbsp;Fotografía de eventos y organización de creadores</p>
        <h3 class="h3" data-r>Picfy</h3>
        <p data-r>Las fotos de tu torneo, en un solo enlace. Una galería por pabellón o evento donde equipos, voluntarios y familias suben y descargan sus fotos, sin crear cuentas.</p>
        <p data-r>Y también para organizar a tu equipo de creadores: reparte el trabajo entre ellos y controla lo que entregan. Cada creador tiene su enlace con sus tareas (story, vídeo, foto…), marca lo que va terminando y sube ahí sus archivos, y tú ves de un vistazo qué está hecho y qué falta.</p>
        <ul class="ticks" data-r><li>Un enlace por evento</li><li>Subida desde el móvil</li><li>Descarga por equipos</li><li>Gestión para la organización</li><li>Reparto de tareas entre creadores</li><li>Control de lo que entregan</li></ul>
        <a class="btn gold" data-r href="/?landing"><span>picfy.es</span><i aria-hidden="true">↗</i></a>
      </div>
      <div class="app-vis" aria-label="Capturas de Picfy en el móvil">
        <div class="ph-s p1" data-speed="0.04" data-r="zoom">${ui('pf1', 'Reparto de tareas entre creadores y control de entregas en Picfy', `data-lb="${P}/ui/pf1.webp?v=${v}" data-alt="Reparto de tareas entre creadores y control de entregas en Picfy"`)}</div>
        <div class="ph-s p2" data-speed="0.22" data-r="zoom" style="--d:.1s">${ui('pf2', 'Galería de un torneo en Picfy', `data-lb="${P}/ui/pf2.webp?v=${v}" data-alt="Galería de un torneo en Picfy"`)}</div>
        <div class="ph-s p3" data-speed="0.08" data-r="zoom" style="--d:.2s">${ui('pf3', 'Fotos compartidas en Picfy', `data-lb="${P}/ui/pf3.webp?v=${v}" data-alt="Fotos compartidas en Picfy"`)}</div>
        <div class="ph-s p4" data-speed="0.3" data-r="zoom" style="--d:.3s">${ui('pf4', 'Gestión de la galería en Picfy', `data-lb="${P}/ui/pf4.webp?v=${v}" data-alt="Gestión de la galería en Picfy"`)}</div>
      </div>
    </article>
  </div>
</section>

<!-- WEBS -->
<section class="sec webs" id="webs" aria-labelledby="web-t">
  <div class="wrap">
    <div class="head split">
      <div>
        <p class="eb" data-r>02&nbsp;—&nbsp;Webs</p>
        <h2 class="h2" id="web-t">${lines(['Webs que', 'cuentan tu marca'])}</h2>
      </div>
      <div>
        <p class="lead" data-r>Páginas y landings corporativas en WordPress, diseñadas para transmitir tu marca y para que tus clientes encuentren lo que buscan a la primera.</p>
        <ul class="chips" data-r><li>Dominio y hosting</li><li>Diseño web</li><li>Contenido y textos</li><li>SEO y optimización</li><li>Mantenimiento</li></ul>
      </div>
    </div>
    <div class="browsers">
      ${WEBS.map((w, i) => `<a class="bw" href="${w[3]}" target="_blank" rel="noopener" data-r style="--d:${i * 0.12}s" aria-label="Visitar ${w[2]}">
        <div class="bw-bar"><i></i><i></i><i></i><span>${w[2]}</span></div>
        <div class="bw-v"><img src="${P}/ui/${w[4]}.webp?v=${v}" width="${D.ui[w[4]][0]}" height="${D.ui[w[4]][1]}" alt="Captura completa de la web de ${w[1]}" loading="lazy" decoding="async" style="--s:${[26, 30, 24][i]}s"></div>
        <div class="bw-meta"><b>${w[1]}</b><span>${w[5]}</span><em>Visitar web ↗</em></div>
      </a>`).join('')}
    </div>
  </div>
</section>

<!-- VÍDEO -->
<section class="sec video" id="video" aria-labelledby="vid-t">
  <div class="wrap">
    <div class="head split">
      <div>
        <p class="eb" data-r>03&nbsp;—&nbsp;Grabación y edición de vídeo</p>
        <h2 class="h2" id="vid-t">${lines(['Vídeo adaptado', 'a cada plataforma'])}</h2>
      </div>
      <div>
        <p class="lead" data-r>Material promocional, cobertura de eventos para marcas, vídeos para deportistas profesionales y contenido formativo para escuelas de negocios.</p>
        <ul class="chips" data-r><li>Final Cut Pro</li><li>Premiere Pro</li><li>CapCut</li></ul>
      </div>
    </div>
    <div class="vwide">
      <figure class="vbig" data-r="zoom">
        ${`<video class="clip fill" data-src="${P}/vid/bbi.mp4?v=${v}" poster="${P}/vid/bbi.jpg?v=${v}" muted loop playsinline preload="none" aria-label="Vídeo formativo de Behind the Bench Institute"></video>`}
        <button class="snd" type="button" aria-label="Activar el sonido" data-for="bbi"><span aria-hidden="true">🔇</span></button>
        <figcaption>Behind the Bench Institute<small>Vídeo formativo</small></figcaption>
      </figure>
      <figure class="vbig vsec" data-r="zoom" style="--d:.15s">
        <video class="clip fill" data-src="${P}/vid/team.mp4?v=${v}" poster="${P}/vid/team.jpg?v=${v}" muted loop playsinline preload="none" aria-label="Vídeo de equipo en Shanghai"></video>
        <figcaption>Elite Team · Shanghai<small>Cobertura de evento</small></figcaption>
      </figure>
    </div>
  </div>
  <div class="vs" data-r role="region" aria-roledescription="carrusel" aria-label="Vídeos verticales">
    <div class="vs-track">${['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'].map((k) => `<div class="pv">${vid(k, 'fill')}</div>`).join('')}</div>
    <div class="vs-ctl"><button class="vs-b prev" type="button" aria-label="Anterior">←</button><button class="vs-b next" type="button" aria-label="Siguiente">→</button></div>
  </div>
</section>

<!-- FOTO -->
<section class="sec foto" id="foto" aria-labelledby="fot-t">
  <div class="wrap">
    <div class="head split">
      <div>
        <p class="eb" data-r>04&nbsp;—&nbsp;Fotografía y edición</p>
        <h2 class="h2" id="fot-t">${lines(['La acción, el retrato', 'y el detalle'])}</h2>
      </div>
      <div>
        <p class="lead" data-r>Retrato, producto, gastronomía y deporte. Cada sesión se edita después con herramientas profesionales para sacar el mejor resultado de cada imagen.</p>
        <ul class="chips" data-r><li>Lightroom</li><li>Photoshop</li><li>Picsart</li></ul>
      </div>
    </div>
    <div class="albums">${albums}</div>
  </div>
</section>

<!-- DISEÑO -->
<section class="sec diseno" id="diseno" aria-labelledby="dis-t">
  <div class="wrap">
    <div class="head split">
      <div>
        <p class="eb" data-r>05&nbsp;—&nbsp;Diseño gráfico</p>
        <h2 class="h2" id="dis-t">${lines(['Carteles, redes', 'y marca'])}</h2>
      </div>
      <div>
        <p class="lead" data-r>Diseño para redes sociales y carteles de festividades y eventos, además de banners, tarjetas de visita, cartas de restaurante, libretas y stands corporativos.</p>
        <ul class="chips" data-r><li>Photoshop</li><li>Illustrator</li><li>Canva</li></ul>
      </div>
    </div>
  </div>
  <div class="posters" data-gal="ds">
    ${marquee([1, 2, 3, 4, 5, 6, 7, 8].map(ds).join(''), 'p-a', 80)}
    ${marquee([9, 10, 11, 12, 15, 16].map(ds).join(''), 'p-b rev', 90)}
  </div>
</section>

<!-- CONTENIDO -->
<section class="sec contenido" id="contenido" aria-labelledby="con-t">
  <div class="wrap two">
    <div class="sticky-l">
      <p class="eb" data-r>06&nbsp;—&nbsp;Contenido y UGC</p>
      <h2 class="h2" id="con-t">${lines(['Vídeos con', 'identidad de marca'])}</h2>
      <p class="lead" data-r>Creamos contenido para redes y vídeos corporativos: producto, eventos, promoción, formación, novedades y activación de marca.</p>
    </div>
    <div class="wall">
      <div class="col c1" data-speed="0.1">${['gym', 'u2', 'u5', 'e8'].map((k) => `<div class="pv">${vid(k, 'fill')}</div>`).join('')}</div>
      <div class="col c2" data-speed="0.3">${['hola', 'u1', 'u3', 'u7'].map((k) => `<div class="pv">${vid(k, 'fill')}</div>`).join('')}</div>
      <div class="col c3" data-speed="0.05">${['u4', 'u6', 'u8', 'u9'].map((k) => `<div class="pv">${vid(k, 'fill')}</div>`).join('')}</div>
    </div>
  </div>
</section>

<!-- MARCAS -->
<section class="sec marcas" id="marcas" aria-labelledby="mar-t">
  <div class="wrap">
    <p class="eb center" data-r>07&nbsp;—&nbsp;Marcas</p>
    <h2 class="h2 center" id="mar-t">${lines(['Hemos trabajado con…'])}</h2>
  </div>
  <div class="slider" role="region" aria-roledescription="carrusel" aria-label="Marcas con las que hemos trabajado" tabindex="0">
    <ul class="track">${logos}</ul>
    <button class="sl-b prev" type="button" aria-label="Marca anterior">←</button>
    <button class="sl-b next" type="button" aria-label="Marca siguiente">→</button>
  </div>
</section>

<!-- CONTACTO -->
<section class="sec cta" id="contacto" aria-labelledby="cta-t">
  <div class="wrap">
    <p class="eb center" data-r>Siguiente paso</p>
    <h2 class="mega center" id="cta-t">${lines(['Hablemos de', '<em>tu proyecto</em>'])}</h2>
    <p class="lead center" data-r>Cuéntanos qué necesitas y estudiaremos tu proyecto para prepararte una propuesta de colaboración enfocada en tus metas. ¡Nos vemos pronto!</p>
    <a class="tel" href="${TEL_LINK}" data-r>${TEL}</a>
    <div class="hero-cta center" data-r>
      <a class="btn gold" href="${TEL_LINK}"><span>Llamar ahora</span><i aria-hidden="true">↗</i></a>
      <a class="btn line" href="${WA_LINK}" target="_blank" rel="noopener"><span>Escribir por WhatsApp</span></a>
    </div>
  </div>
</section>
</main>

<footer>
  <div class="wrap foot"><span class="brand">Pablo &amp; Bárbara</span><span>© ${new Date().getFullYear()} · Madrid</span><a href="#top">Volver arriba&nbsp;↑</a></div>
</footer>

<div class="lb" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
  <button class="x" type="button" aria-label="Cerrar">×</button><button class="pv-b" type="button" aria-label="Anterior">‹</button><button class="nx-b" type="button" aria-label="Siguiente">›</button>
  <img alt="">
</div>
<script src="${P}/portfolio.js?v=${v}" defer></script>
</body>
</html>`;
}
