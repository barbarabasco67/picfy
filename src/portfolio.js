// Portfolio público de Pablo y Bárbara (picfy.es/portfolio).
// El HTML se genera aquí; estilos, efectos, fotos y vídeos están en /public/portfolio/.
import { ASSET_V } from './version.js';

const P = '/portfolio';
const TEL = '690 770 638';
const TEL_LINK = 'tel:+34690770638';
const WA_LINK = 'https://wa.me/34690770638?text=' + encodeURIComponent('Hola, he visto vuestro portfolio y me gustaría contaros un proyecto.');

// ancho y alto de cada imagen (evita saltos de maquetación mientras cargan)
const SZ = {
  ph01: [731, 1100], ph02: [756, 995], ph03: [756, 680], ph04: [407, 476], ph05: [605, 476], ph06: [1004, 552],
  ph07: [1004, 607], ph08: [406, 728], ph09: [778, 439], ph10: [420, 439], ph11: [418, 439], ph12: [585, 612],
  ph13: [1100, 1060], ph14: [713, 620], ph15: [418, 670], ph16: [585, 915], ph17: [418, 395], ph18: [757, 478],
  ph19: [410, 478], ph20: [609, 478], ph21: [419, 478], ph22: [747, 665], ph23: [1002, 553], ph24: [712, 1100],
  ph25: [410, 764], ph26: [747, 1030], ph28: [410, 430],
  md1: [735, 459], md2: [393, 459], md3: [587, 459], md4: [395, 650], md5: [552, 512], md6: [530, 816], md7: [552, 765],
  d01: [410, 512], d02: [410, 512], d03: [413, 512], d04: [413, 512], d05: [802, 1000], d06: [804, 1000],
  d07: [486, 651], d08: [526, 651], d09: [520, 651], d10: [755, 945], d11: [780, 945], d12: [615, 1000], d13: [812, 291],
  lg1: [1800, 152], lg2: [1800, 175], lg3: [1800, 128], lg4: [1800, 129], lg5: [1800, 140], hola: [622, 1100], logo: [123, 120],
};

const src = (n) => `${P}/img/${n}.webp?v=${ASSET_V}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const img = (n, alt, extra = '') => `<img src="${src(n)}" width="${SZ[n][0]}" height="${SZ[n][1]}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`;

// fotografía: [archivo, texto alternativo]
const PHOTOS = [
  ['ph24', 'Jugador de baloncesto de Pro Basket Lab concentrado antes de lanzar'],
  ['ph03', 'Retrato de un jugador de Elite con gafas deportivas'],
  ['ph05', 'Clase de ciclo indoor entre humo y luces'],
  ['ph13', 'Retrato de un entrenador con un balón bajo el brazo'],
  ['ph12', 'Sala de musculación de un gimnasio con luces azules'],
  ['ph02', 'Retrato de una deportista en un gimnasio con luces rojas'],
  ['ph09', 'Jugadora de baloncesto con coleta durante un partido'],
  ['ph14', 'Jugador de 3x3 preparando un lanzamiento'],
  ['ph06', 'Sala de ciclo indoor con las bicis iluminadas'],
  ['ph22', 'Deportista sentada en un cajón de crossfit'],
  ['ph01', 'Retrato de perfil de un jugador sudado en luz cálida'],
  ['ph18', 'Equipo celebrando el título de la Liga 3x3'],
  ['ph16', 'Monitor de ciclo indoor señalando entre luces azules'],
  ['ph10', 'Entrenador con micrófono de cabeza en una clase dirigida'],
  ['ph23', 'Jugador de Pro Basket Lab siguiendo el balón con la mirada'],
  ['ph26', 'Retrato de una chica en un gimnasio con ropa deportiva azul'],
  ['ph15', 'Dos deportistas entrenando boxeo en un estudio'],
  ['ph04', 'Mate durante un partido de baloncesto en un pabellón'],
  ['ph21', 'Jugador saltando hacia la canasta'],
  ['ph07', 'Equipo femenino de Las Rozas 3x3 con un trofeo'],
  ['ph20', 'Plato de cocina fotografiado con detalle'],
  ['ph25', 'Atleta saltando en un entrenamiento de test físico'],
  ['ph17', 'Clase de pilates con pelotas en un gimnasio'],
  ['ph08', 'Ciclista en una clase de spinning con focos'],
  ['ph19', 'Jugadora de Las Rozas 3x3 con el balón en las manos'],
  ['ph11', 'Jugadora lanzando a canasta en un pabellón'],
  ['ph28', 'Cuatro jugadoras de Las Rozas 3x3 posando juntas'],
];
const MEDIA = [
  ['md1', 'Jugadora con un balón Wilson 3x3'], ['md2', 'Jugadora lanzando un balón al aire'],
  ['md3', 'Jugadora sonriendo con dos balones'], ['md4', 'Jugador de Las Rozas 3x3 sujetando un balón'],
  ['md5', 'Jugadora con un balón junto a la cara'], ['md6', 'Jugador de Electromercantil girando un balón en el dedo'],
  ['md7', 'Jugador de Electromercantil señalando a cámara'],
];
const DESIGNS = [
  ['d05', 'Cartel «Campeonas» de la Liga de Invierno FEB 3x3'], ['d01', 'Cartel de masterclass de Halloween'],
  ['d11', 'Cartel «Champions» de Shanghai Future Stars'], ['d02', 'Cartel de presentación de jugadores de un torneo 3x3'],
  ['d07', 'Cartel de curso de liderazgo deportivo'], ['d06', 'Cartel de masterclass de bike inspirado en una película de terror'],
  ['d10', 'Cartel de jugador de Shanghai Future Stars'], ['d03', 'Cartel de masterclass de bike'],
  ['d09', 'Cartel de la Roda U12W Future Stars'], ['d04', 'Cartel de evento de ciclo indoor'],
  ['d12', 'Guía de marca de Krown Fitness'], ['d08', 'Cartel de roster U12 Future Stars'], ['d13', 'Banner de Black Friday de un gimnasio'],
];

const photo = ([n, alt], i) => `<figure data-r data-lb="${src(n)}" data-alt="${esc(alt)}" style="--d:${(i % 3) * 0.08}s">${img(n, alt)}</figure>`;
const md = ([n, alt], dup) => `<figure data-lb="${src(n)}" data-alt="${esc(alt)}"${dup ? ' aria-hidden="true"' : ''}>${img(n, dup ? '' : alt)}</figure>`;
const poster = ([n, alt], dup) => `<div class="poster" data-lb="${src(n)}" data-alt="${esc(alt)}"${dup ? ' aria-hidden="true"' : ''}>${img(n, dup ? '' : alt)}</div>`;

const video = (n, w, h, cls = 'phone', label = '') =>
  `<div class="${cls}"><video data-src="${P}/vid/${n}.mp4?v=${ASSET_V}" poster="${P}/vid/${n}.jpg?v=${ASSET_V}" width="${w}" height="${h}" muted loop playsinline preload="none"${label ? ` aria-label="${esc(label)}"` : ' aria-hidden="true"'}></video></div>`;

const marquee = (inner, t = 36, rev = false) => `<div class="mq${rev ? ' rev' : ''}" style="--t:${t}s"><div>${inner}</div><div aria-hidden="true">${inner}</div></div>`;

const BAND = ['Diseño web', 'Apps y herramientas', 'Vídeo', 'Fotografía', 'Diseño gráfico', 'Contenido']
  .map((t) => `<span>${t}</span><i></i>`).join('').repeat(2);

const CARDS = [
  ['Diseño web', '#web'], ['Creación de contenido', '#contenido'], ['Community manager', '#contenido'],
  ['Fotografía', '#foto'], ['Imagen de marca', '#diseno'], ['Grabación y edición', '#video'],
].map(([t, h], i) => `<a class="card" href="${h}" data-r style="--d:${(i % 3) * 0.1}s"><span class="n">0${i + 1}</span><span class="go" aria-hidden="true">→</span><h3>${t}</h3></a>`).join('');

const PILLS = ['Dominio y hosting', 'Diseño web', 'Diseño multimedia', 'Apps y herramientas', 'Optimización y SEO', 'Mantenimiento']
  .map((t) => `<span class="pill${t === 'Apps y herramientas' ? ' hl' : ''}">${t}</span>`).join('');

const WEBS = [
  ['krownfitness.es', 'https://krownfitness.es', 'Web de un gimnasio'],
  ['rentaelite.es', 'https://rentaelite.es', 'Alquiler de viviendas'],
  ['behindthebench.institute', 'https://behindthebench.institute/landing-video', 'Landing de un curso de gestión deportiva'],
].map(([t, h, s], i) => `<a class="wrow" href="${h}" target="_blank" rel="noopener" data-r><span class="i">0${i + 1}</span><span><b>${t}</b><small>${s}</small></span><span class="ar2" aria-hidden="true">→</span></a>`).join('');

// jugada animada de Playbook Finder (bloqueo y continuación)
const PLAY_SVG = `<svg viewBox="0 0 500 470" role="img" aria-label="Jugada animada de bloqueo y continuación sobre una pista de baloncesto">
<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c1c1c"/><stop offset="1" stop-color="#171010"/></linearGradient></defs>
<rect x="2" y="2" width="496" height="466" rx="20" fill="url(#cg)" stroke="#3d2d2d" stroke-width="2"/>
<g fill="none" stroke="#7a5656" stroke-width="2.5">
<rect x="170" y="2" width="160" height="188"/><circle cx="250" cy="190" r="60" stroke-dasharray="6 7"/>
<path d="M30 2V140A237 237 0 0 0 470 140V2"/><path d="M220 38H280"/><circle cx="250" cy="52" r="9" stroke="#e11b1b" stroke-width="3"/>
</g>
<g fill="none" stroke-linecap="round" stroke-width="4">
<path d="M330 170L235 255" pathLength="1" stroke="#ffffff" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" dur="8s" repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;.06;.2;.92;1"/></path>
<path d="M200 330C225 325 305 285 335 215" pathLength="1" stroke="#f6c90e" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" dur="8s" repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;.08;.45;.92;1"/></path>
<path d="M235 255L255 120" pathLength="1" stroke="#93ae9f" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" dur="8s" repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;.4;.6;.92;1"/></path>
<path d="M340 207L258 125" pathLength="1" stroke="#f08a24" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" dur="8s" repeatCount="indefinite" values="1;1;0;0;1" keyTimes="0;.5;.6;.92;1"/></path>
</g>
<g font-family="Anton,Impact,sans-serif" font-size="17" text-anchor="middle">
<g transform="translate(80 230)"><circle r="16" fill="#f3eee5"/><text y="6" fill="#141111">2</text></g>
<g transform="translate(420 230)"><circle r="16" fill="#f3eee5"/><text y="6" fill="#141111">3</text></g>
<g transform="translate(90 70)"><circle r="16" fill="#f3eee5"/><text y="6" fill="#141111">4</text></g>
<g><animateTransform attributeName="transform" type="translate" dur="8s" repeatCount="indefinite" values="330 170;330 170;235 255;235 255;255 120;255 120;330 170" keyTimes="0;.08;.2;.4;.6;.9;1"/><circle r="16" fill="#f3eee5"/><text y="6" fill="#141111">5</text></g>
<g><animateTransform attributeName="transform" type="translate" dur="8s" repeatCount="indefinite" values="200 330;200 330;240 310;290 262;335 215;335 215;200 330" keyTimes="0;.08;.2;.32;.45;.9;1"/><circle r="17" fill="#f6c90e"/><text y="6" fill="#141111">1</text></g>
</g>
<circle r="7.5" fill="#f08a24" stroke="#6b3200" stroke-width="2"><animateTransform attributeName="transform" type="translate" dur="8s" repeatCount="indefinite" values="205 322;205 322;245 302;295 252;340 207;340 207;258 125;250 56;250 56;205 322" keyTimes="0;.08;.2;.32;.45;.5;.6;.72;.9;1"/></circle>
<text x="250" y="452" text-anchor="middle" font-family="Anton,Impact,sans-serif" font-size="15" letter-spacing="3" fill="#a79f93">BLOQUEO Y CONTINUACIÓN</text>
</svg>`;

const ARROW_SVG = `<svg class="arrow-d" viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M8 8h18l46 46V28h22v66H28V72h26L8 26z"/></svg>`;

export function portfolioPage() {
  const v = ASSET_V;
  const title = 'Portfolio Pablo & Bárbara · Webs, apps, vídeo, foto y diseño';
  const desc = 'Diseño web, apps y herramientas a medida, vídeo, fotografía, diseño gráfico y contenido para marcas de distintos sectores. Mira nuestros proyectos y cuéntanos el tuyo.';
  const url = 'https://picfy.es/portfolio';
  const logosAlt = 'Marcas con las que hemos trabajado: Krown Fitness, Las Rozas 3x3, Fuenlabrada, Justicia Sanitaria, De Madrid a Europa, Fire Nutrition, Atella espacio, Circuito Colegial, Elite Team, Turkish Basketball Federation, Villafañe & Asociados, Noko Lashes, Gaceta Taxi, Onil 3x3, Jump, FWD, e-Automotive, GO Seguridad, El Tornadillo, Casa Palacio San José, Behind the Bench Institute, Renta Élite, Karbon Black, Pro Basket Lab, ThePower Business School, Max Mobility, Margarito, Abascal, Kilda, Tripl3 Shot, Sukha Lounge y Luike, entre otras.';
  const logoRow = (k, i) => marquee(Array.from({ length: 4 }, (_, j) => img(k, j === 0 && i === 0 ? '' : '', 'aria-hidden="true"')).join(''), 60 + i * 8, i % 2 === 1);
  const ld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'Portfolio Pablo & Bárbara', url,
    description: desc, telephone: '+34690770638', areaServed: 'ES',
    makesOffer: ['Diseño web', 'Apps y herramientas a medida', 'Grabación y edición de vídeo', 'Fotografía', 'Diseño gráfico', 'Creación de contenido'].map((n) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: n } })),
  });

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#141111">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:locale" content="es_ES">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="https://picfy.es${P}/og.jpg?v=${v}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${P}/fonts/anton-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${P}/portfolio.css?v=${v}">
<script type="application/ld+json">${ld}</script>
</head>
<body>
<div class="progress" aria-hidden="true"></div>

<header class="nav">
  <div class="wrap">
    <a class="brand" href="#top" aria-label="Inicio del portfolio"><img src="${src('logo')}" width="${SZ.logo[0]}" height="${SZ.logo[1]}" alt=""><span>Portfolio<small>Pablo &amp; Bárbara</small></span></a>
    <nav class="menu" id="menu" aria-label="Secciones">
      <a href="#servicios">Servicios</a><a href="#web">Web y apps</a><a href="#video">Vídeo</a><a href="#foto">Foto</a><a href="#diseno">Diseño</a><a href="#contenido">Contenido</a>
      <a class="btn y" href="#contacto" style="margin-left:8px;padding:.6em 1.2em;color:#111">Hablemos</a>
    </nav>
    <button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu">Menú</button>
  </div>
</header>

<main id="top">
<section class="hero" aria-labelledby="h1">
  <div class="hero-bg" aria-hidden="true"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
  <div class="hero-ph hp1" aria-hidden="true">${img('ph13', '')}</div>
  <div class="hero-ph hp2" aria-hidden="true">${img('ph03', '')}</div>
  <div class="hero-ph hp3" aria-hidden="true">${img('ph05', '')}</div>
  <div class="hero-ph hp4" aria-hidden="true">${img('ph02', '')}</div>
  <div class="wrap">
    <p class="eyebrow">Pablo &amp; Bárbara</p>
    <h1 class="mega" id="h1" aria-label="Portfolio">${'PORTFOLIO'.split('').map((c, i) => `<span style="--i:${i}" aria-hidden="true">${c}</span>`).join('')}</h1>
    <p class="hero-sub">Servicios para digitalizar tu empresa: <b>webs, apps y herramientas a medida</b>, vídeo, fotografía, diseño gráfico y contenido para marcas de distintos sectores.</p>
    <div class="hero-cta">
      <a class="btn y" href="#servicios">Ver proyectos <span class="ar" aria-hidden="true">↓</span></a>
      <a class="btn" href="${TEL_LINK}">Llamar al ${TEL}</a>
    </div>
  </div>
  <span class="scroll" aria-hidden="true"></span>
</section>

<div class="band" aria-hidden="true">${marquee(BAND, 34)}</div>

<section class="sec hola" aria-labelledby="hola-t">
  <div class="wrap grid">
    <div>
      <h2 class="ttl" id="hola-t" data-r="clip"><span class="scr" aria-hidden="true">Hello</span>Hola</h2>
      <p class="lead" data-r>La pasión que ponemos en nuestro trabajo es una de nuestras principales señas de identidad; somos un equipo lleno de ganas y experiencia profesional que ofrece servicios para digitalizar tu empresa. Nos implicamos en los proyectos haciéndolos nuestros, siempre empatizando con tu situación y con la de tus clientes.</p>
      <p class="lead" data-r>¿Necesitas alguno de nuestros servicios? Si tienes un proyecto cuenta con nosotros, queremos vivir esta ilusión contigo.</p>
      <p style="margin-top:28px" data-r><a class="btn y" href="#contacto">Cuéntanos tu proyecto <span class="ar" aria-hidden="true">↗</span></a></p>
    </div>
    <div style="position:relative">
      <div class="ph1" data-r="left">${img('hola', 'Jugadora de baloncesto sonriendo con un balón de 3x3 bajo el brazo', 'style="aspect-ratio:622/1100"')}</div>
      ${ARROW_SVG}
    </div>
  </div>
</section>

<section class="sec" id="servicios" aria-labelledby="serv-t" style="padding-top:0">
  <div class="wrap">
    <h2 class="ttl s" id="serv-t" data-r="clip">Proyectos</h2>
    <h3 class="sub" style="margin-top:0" data-r>Funciones a realizar dentro de un proyecto</h3>
    <p class="lead" data-r>Hemos tenido la suerte de poder participar en proyectos muy diversos, trabajando en ocasiones en una parte del proyecto, y en otras en el transcurso del proyecto completo. Esto me ha permitido poder desarrollar distintas funciones y aprender de cada una de ellas para estar en constante formación durante mis experiencias laborales.</p>
    <div class="cards">${CARDS}</div>
  </div>
</section>

<section class="sec web" id="web" aria-labelledby="web-t">
  <div class="wrap">
    <div class="two">
      <div>
        <h2 class="ttl y" id="web-t" data-r="clip"><span class="scr" aria-hidden="true">Corporativo</span>Diseño web y app</h2>
        <p class="lead" data-r>Realización de páginas web y landing corporativas para empresas de distintos sectores a través del CMS WordPress, además del desarrollo de apps y herramientas a medida. Gestión y elaboración de todo el proceso web, desde la obtención del dominio y hosting, pasando por el diseño web y la ejecución de este, hasta la elaboración del contenido multimedia y textos, para finalizar con la optimización, SEO y posicionamiento.</p>
        <p class="lead" data-r>Diseños centrados en las necesidades de cada cliente, transmitiendo su identidad corporativa y permitiendo una experiencia de usuario óptima en cada una de las páginas de la web. Inclusión e instalación de herramientas y plugins necesarios para el correcto desempeño del sitio web. Desarrollamos también apps y herramientas propias o a medida, pensadas para resolver necesidades concretas de cada negocio.</p>
      </div>
      <div class="pills" data-r="right" style="align-self:center">${PILLS}</div>
    </div>

    <h3 class="sub" data-r>Nuestras apps <em>HERRAMIENTAS PROPIAS</em></h3>
    <div class="apps">
      <article class="app pf" data-r>
        <div class="vis"><div class="pbs">
          <div class="win w1"><img src="/portfolio/img/pb1.webp?v=${v}" width="840" height="404" alt="Panel de control de entrenamientos de Playbook Finder" data-lb="/portfolio/img/pb1.webp?v=${v}" data-alt="Panel de control de entrenamientos de Playbook Finder" loading="lazy" decoding="async"></div>
          <div class="win w2"><img src="/portfolio/img/pb2.webp?v=${v}" width="698" height="336" alt="Biblioteca de jugadas de Playbook Finder" data-lb="/portfolio/img/pb2.webp?v=${v}" data-alt="Biblioteca de jugadas de Playbook Finder" loading="lazy" decoding="async"></div>
          <div class="win w3"><img src="/portfolio/img/pb3.webp?v=${v}" width="844" height="412" alt="Editor de jugadas de Playbook Finder" data-lb="/portfolio/img/pb3.webp?v=${v}" data-alt="Editor de jugadas de Playbook Finder" loading="lazy" decoding="async"></div>
          <div class="win w4"><img src="/portfolio/img/pb4.webp?v=${v}" width="620" height="296" alt="Análisis de vídeo (video scouting) de Playbook Finder" data-lb="/portfolio/img/pb4.webp?v=${v}" data-alt="Análisis de vídeo (video scouting) de Playbook Finder" loading="lazy" decoding="async"></div>
        </div></div>
        <div class="txt">
          <h3>Playbook Finder</h3>
          <p>Biblioteca de jugadas animadas y herramientas de gestión para entrenadores de baloncesto. Una plataforma web hecha por gente de baloncesto para gente de baloncesto.</p>
          <div class="lnk"><a class="btn y" href="https://playbookfinder.com" target="_blank" rel="noopener">playbookfinder.com <span class="ar" aria-hidden="true">↗</span></a></div>
        </div>
      </article>
      <article class="app pc" data-r style="--d:.12s">
        <div class="vis">
          <div class="ph-frame a"><img src="/torneos/guest-phone.webp?v=${v}" width="560" height="1212" alt="Álbum de un torneo en Picfy visto desde el móvil" loading="lazy" decoding="async"></div>
          <div class="ph-frame b"><img src="/torneos/upload-phone.webp?v=${v}" width="560" height="1212" alt="Subida de fotos a un álbum de Picfy desde el móvil" loading="lazy" decoding="async"></div>
        </div>
        <div class="txt">
          <h3>Picfy</h3>
          <p>Las fotos del torneo o del evento, en un solo enlace. Álbumes compartidos para que cada sede o invitado suba sus fotos y la organización las gestione en un único sitio.</p>
          <div class="lnk"><a class="btn y" href="/">picfy.es <span class="ar" aria-hidden="true">↗</span></a></div>
        </div>
      </article>
    </div>

    <h3 class="sub" data-r>Nuestras webs</h3>
    <div class="webs">${WEBS}</div>
  </div>
</section>

<section class="sec" id="video" aria-labelledby="vid-t">
  <div class="wrap">
    <div class="two">
      <div>
        <h2 class="ttl s" id="vid-t" data-r="clip"><span class="scr" aria-hidden="true">Grabación y</span>Edición de vídeo</h2>
      </div>
      <div>
        <p class="lead" data-r>Contamos con experiencia en la grabación y edición de vídeos adaptados a las exigencias de distintas plataformas de contenido.</p>
        <p class="lead" data-r>Nuestra trayectoria incluye la elaboración de material promocional y la cobertura de eventos para marcas y negocios de diversa temática, la producción de vídeos para deportistas profesionales, así como el desarrollo de contenidos formativos para la escuela de negocios ThePower Business School.</p>
        <div class="tools" data-r><h3>Herramientas más utilizadas</h3><span class="chip">Final Cut Pro</span><span class="chip">Premiere Pro</span><span class="chip">CapCut</span></div>
      </div>
    </div>
    <figure class="bbi" data-r>
      <video data-src="${P}/vid/bbi.mp4?v=${v}" poster="${P}/vid/bbi.jpg?v=${v}" width="1250" height="703" muted loop playsinline preload="none" aria-label="Vídeo formativo de Behind the Bench Institute"></video>
      <figcaption>Contenido formativo · Behind the Bench Institute</figcaption>
    </figure>
  </div>
  <div class="phones" data-r tabindex="0" aria-label="Vídeos verticales (desliza para ver más)">
    ${['ed1', 'ed2', 'ed3', 'ed4', 'ed5', 'ed6'].map((n) => video(n, 350, 724)).join('')}
  </div>
</section>

<section class="sec" id="foto" aria-labelledby="foto-t" style="padding-top:clamp(30px,5vw,60px)">
  <div class="wrap">
    <div class="two">
      <h2 class="ttl y" id="foto-t" data-r="clip"><span class="scr" aria-hidden="true">y Edición</span>Fotografía</h2>
      <div>
        <p class="lead" data-r>Realización de fotografías de distinta tipología y temática: retrato, producto, alimentación o deporte. Posterior edición, para ofrecer el mejor resultado con herramientas profesionales de edición de fotografía.</p>
        <div class="tools" data-r><h3>Herramientas más utilizadas</h3><span class="chip">Lightroom</span><span class="chip">Photoshop</span></div>
      </div>
    </div>
    <div class="gal">${PHOTOS.map(photo).join('')}</div>

    <div class="md">
      <h3 class="ttl s" style="font-size:clamp(3rem,9vw,8rem)" data-r="clip">Media days</h3>
      <div class="row" data-r><div class="mqp" role="list">${[...MEDIA, ...MEDIA, ...MEDIA, ...MEDIA].map((x, i) => md(x, i >= MEDIA.length)).join('')}</div></div>
    </div>
  </div>
</section>

<section class="sec" id="diseno" aria-labelledby="dis-t" style="padding-bottom:clamp(40px,6vw,80px)">
  <div class="wrap">
    <div class="two">
      <h2 class="ttl y" id="dis-t" data-r="clip">Diseño gráfico</h2>
      <div>
        <p class="lead" data-r>Realización de diseños gráficos de distinta temática, formato y plataforma: con especialización en el diseño para redes sociales y carteles para festividades y eventos. He realizado también banners, tarjetas de visita, cartas de restaurantes, diseños para libretas y stands corporativos, entre otros.</p>
        <div class="tools" data-r><h3>Herramientas más utilizadas</h3><span class="chip">Photoshop</span><span class="chip">Illustrator</span><span class="chip">Canva</span></div>
      </div>
    </div>
  </div>
  <div class="posters" data-r>
    <div class="mq" style="--t:70s"><div>${DESIGNS.map((x) => poster(x, false)).join('')}</div><div aria-hidden="true">${DESIGNS.map((x) => poster(x, true)).join('')}</div></div>
    <div class="mq rev" style="--t:80s"><div>${[...DESIGNS].reverse().map((x) => poster(x, true)).join('')}</div><div aria-hidden="true">${[...DESIGNS].reverse().map((x) => poster(x, true)).join('')}</div></div>
  </div>
</section>

<section class="sec" id="contenido" aria-labelledby="con-t">
  <div class="wrap ugc-wrap">
    <div>
      <h2 class="ttl s" id="con-t" data-r="clip"><span class="scr" aria-hidden="true">UGC</span>Creación de contenido</h2>
      <p class="lead" data-r>Hemos creado contenido para las redes sociales de empresas de distintos sectores, así como vídeos corporativos, lo que me ha permitido tener un amplio conocimiento de las necesidades de cada marca, como pueden ser los vídeos de producto, eventos, promoción, formación o novedades de cada negocio.</p>
      <p class="lead" data-r>Así, hemos conseguido crear un amplio número de vídeos virales, consiguiendo el correspondiente crecimiento en redes. Estos son algunos de los últimos:</p>
      <div class="stats" data-r>
        <div class="stat"><b class="count" data-to="1.8" data-dec="1" data-suf="M">1,8M</b><span>reproducciones en uno de los vídeos anclados</span></div>
        <div class="stat"><b class="count" data-to="742" data-suf=" mil">742 mil</b><span>reproducciones en otro de los vídeos anclados</span></div>
      </div>
    </div>
    <div class="wall">
      <div class="col c1" data-speed="0.12">${video('ug1', 336, 736, 'phone ugc')}${video('ug5', 340, 696, 'phone ugc')}</div>
      <div class="col c2" data-speed="0.3">${video('ug2', 336, 736, 'phone ugc')}${video('ug6', 340, 696, 'phone ugc')}</div>
      <div class="col c3" data-speed="0.05">${video('ug3', 336, 736, 'phone ugc')}${video('ug4', 336, 736, 'phone ugc')}</div>
    </div>
  </div>
</section>

<section class="sec" id="clientes" aria-labelledby="cli-t" style="padding-top:clamp(30px,5vw,60px)">
  <div class="wrap">
    <h2 class="ttl s" id="cli-t" data-r="clip" style="font-size:clamp(2.6rem,8vw,7rem)">Hemos trabajado con…</h2>
    <p class="sr">${esc(logosAlt)}</p>
    <div class="logos" data-r aria-hidden="true">${['lg1', 'lg2', 'lg3', 'lg4', 'lg5'].map(logoRow).join('')}</div>
  </div>
</section>

<section class="sec cta" id="contacto" aria-labelledby="cta-t">
  <div class="wrap">
    <h2 class="ttl" id="cta-t" data-r="clip">Let's work</h2>
    <p class="lead" data-r>Contacta con nosotros para resolver tus dudas, recibir más información o contarnos qué necesitas. Estudiaremos tu proyecto y elaboraremos una propuesta de colaboración enfocada en tus necesidades y metas. ¡Nos vemos pronto!</p>
    <a class="tel" href="${TEL_LINK}" data-r>${TEL}</a>
    <div class="acts" data-r>
      <a class="btn y" href="${TEL_LINK}">Llamar <span class="ar" aria-hidden="true">↗</span></a>
      <a class="btn" href="${WA_LINK}" target="_blank" rel="noopener">WhatsApp <span class="ar" aria-hidden="true">↗</span></a>
    </div>
  </div>
</section>
</main>

<footer>
  <div class="wrap"><span>© ${new Date().getFullYear()} Pablo &amp; Bárbara · Portfolio</span><span><a href="#top">Volver arriba ↑</a></span></div>
</footer>

<div class="lb" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
  <button class="x" type="button" aria-label="Cerrar">×</button><button class="pv" type="button" aria-label="Anterior">‹</button><button class="nx" type="button" aria-label="Siguiente">›</button>
  <img alt="">
</div>
<script src="${P}/portfolio.js?v=${v}" defer></script>
</body>
</html>`;
}
