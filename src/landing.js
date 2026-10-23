// Página de inicio pública de Picfy (picfy.es): dos vertientes, álbum participativo para todos y herramienta profesional para fotógrafos y torneos.
// Las fotos de baloncesto son propias (public/landing/baloncesto-N.jpg); si no existen, se ve el fondo azul con las líneas de pista.
import { ASSET_V } from './version.js';

const L = (f, alt, w, h, extra = '') => `<img src="/landing/${f}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;
const T = (f, alt, w, h, extra = '') => `<img src="/torneos/${f}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;
const PHOTOS = ['baloncesto-1.jpg', 'baloncesto-2.jpg', 'baloncesto-3.jpg', 'baloncesto-4.jpg', 'baloncesto-5.jpg', 'baloncesto-6.jpg']; // fotos propias en public/landing/; solo se usan las que existen

const CSS = `
@font-face{font-family:"Bricolage";font-style:normal;font-weight:200 800;font-display:swap;src:url(/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215}
@font-face{font-family:"Bricolage";font-style:normal;font-weight:200 800;font-display:swap;src:url(/vendor/fonts/bricolage-grotesque-latin-ext-wght-normal.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
:root{--navy:#14213d;--deep:#0b1426;--amber:#edb265;--amber2:#e5964c;--paper:#f6f4f0;--ink:#14213d;--muted:#5d6678;--line:#dcd8cf}
*{box-sizing:border-box;margin:0}
html{overflow-x:clip;scroll-behavior:smooth;scroll-padding-top:70px}
body{font-family:Bricolage,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--paper);line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:clip}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.wrap{width:min(1200px,100% - 40px);margin-inline:auto}
.label{font-size:.78rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--amber2)}
h1,h2,h3{font-weight:800;line-height:.98;letter-spacing:-.035em}
h2{font-size:clamp(2rem,4.4vw,3.4rem)}
.btn{display:inline-flex;align-items:center;justify-content:center;font:inherit;font-weight:700;font-size:1rem;padding:.85em 1.7em;border-radius:6px;border:2px solid transparent;cursor:pointer;transition:transform .2s,background .2s,color .2s}
.btn.primary{background:var(--amber);color:var(--navy)}.btn.primary:hover{background:#f6c27f;transform:translateY(-2px)}
.btn.line{border-color:rgba(255,255,255,.5);color:#fff}.btn.line:hover{background:#fff;color:var(--navy)}
.btn.dark{background:var(--navy);color:#fff}.btn.dark:hover{background:#22345e}
.btn.dline{border-color:var(--navy);color:var(--navy)}.btn.dline:hover{background:var(--navy);color:#fff}

.top{position:fixed;inset:0 0 auto 0;z-index:50;transition:background .3s}
.top.solid{background:rgba(11,20,38,.9);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.3rem;color:#fff}
.logo i{width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,#f6cf93,var(--amber2))}
.top nav{display:flex;align-items:center;gap:30px}
.top nav a:not(.btn){color:rgba(255,255,255,.85);font-weight:600;font-size:.95rem;position:relative;padding:4px 0}
.top nav a:not(.btn)::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--amber);transform:scaleX(0);transform-origin:left;transition:transform .25s}
.top nav a:not(.btn):hover::after{transform:scaleX(1)}
.top .btn{padding:.55em 1.3em;font-size:.92rem}

/* portada */
.hero{position:relative;min-height:100svh;background:var(--deep);color:#fff;display:flex;align-items:center;overflow:hidden;isolation:isolate;padding:150px 0 90px}
.ph-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.4s;z-index:-3}
.ph-bg.on{opacity:1}
.hero .ph-bg{animation:kb 26s ease-in-out infinite alternate;transform-origin:60% 40%}
@keyframes kb{to{transform:scale(1.09) translate(-1.5%,-1%)}}
.hero::before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(95deg,rgba(11,20,38,.96) 0%,rgba(11,20,38,.82) 42%,rgba(11,20,38,.35) 100%),linear-gradient(0deg,rgba(11,20,38,.9),transparent 40%)}
.court{position:absolute;right:-6%;bottom:-10%;width:min(900px,100vw);z-index:-1;opacity:.5}
.court *{fill:none;stroke:rgba(237,178,101,.35);stroke-width:2;stroke-dasharray:1400;stroke-dashoffset:1400;animation:draw 3.4s .3s cubic-bezier(.4,0,.2,1) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.hero .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center}
.hero h1{font-size:clamp(2.5rem,5.4vw,4.6rem);line-height:1}
.hero h1 em{font-style:normal;color:var(--amber)}
.hero p.lead{margin-top:26px;font-size:clamp(1.05rem,1.5vw,1.28rem);color:rgba(255,255,255,.82);max-width:30em}
.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
.fine{margin-top:20px;font-size:.88rem;color:rgba(255,255,255,.55)}
.phones{position:relative;height:min(660px,78vh)}
.phone{position:absolute;border-radius:34px;padding:8px;background:#0b1426;box-shadow:0 40px 80px rgba(0,0,0,.55),0 0 0 1.5px rgba(255,255,255,.14)}
.phone img{border-radius:27px;width:100%}
.phones .p1{width:min(250px,48%);left:6%;top:6%;transform:rotate(-5deg)}
.phones .p2{width:min(270px,52%);right:0;top:14%;transform:rotate(4deg)}
.crop{position:absolute;width:26px;height:26px;border:2px solid var(--amber);opacity:.8}
.crop.a{left:-14px;top:-14px;border-right:0;border-bottom:0}.crop.b{right:-14px;top:-14px;border-left:0;border-bottom:0}.crop.c{left:-14px;bottom:-14px;border-right:0;border-top:0}.crop.d{right:-14px;bottom:-14px;border-left:0;border-top:0}
.scroll{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5)}

.over{position:relative;z-index:2;background:var(--paper)}
@media (min-width:921px) and (min-height:700px){
  .hero{position:sticky;top:0;height:100svh;min-height:0;z-index:0}
  .over{border-radius:32px 32px 0 0;overflow:hidden;box-shadow:0 -30px 60px rgba(0,0,0,.35)}
}
.hero .wrap{opacity:calc(1 - var(--hp,0)*.95);transform:translateY(calc(var(--hp,0)*-50px))}
/* dos vertientes */
.two{display:grid;grid-template-columns:1fr 1fr;min-height:520px}
.door{position:relative;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(28px,4vw,56px);color:#fff;overflow:hidden;isolation:isolate;background:var(--navy);transition:flex .3s}
.door:nth-child(2){background:#0b1426}
.door .ph-bg{z-index:-2;transition:opacity 1.2s,transform 1.2s}
.door::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(11,20,38,.96) 8%,rgba(11,20,38,.45) 70%,rgba(11,20,38,.2))}
.door:hover .ph-bg{transform:scale(1.06)}
.door .label{margin-bottom:12px}
.door h3{font-size:clamp(1.8rem,3.4vw,2.7rem);line-height:1.05}
.door p{margin-top:14px;color:rgba(255,255,255,.8);max-width:26em}
.door .go{margin-top:22px;font-weight:700;color:var(--amber);display:inline-flex;gap:10px;align-items:center}
.door .go::after{content:"→";transition:transform .25s}.door:hover .go::after{transform:translateX(6px)}

section.s{padding:clamp(80px,11vw,150px) 0}
.reveal{opacity:0;transform:translateY(30px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0s)}
.reveal.in{opacity:1;transform:none}
.sub{margin-top:20px;font-size:clamp(1.02rem,1.4vw,1.2rem);color:var(--muted);max-width:36em}

/* álbum para todos */
.album .head{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:60px;border-top:2px solid var(--navy)}
.step{padding:28px 26px 10px 0;border-right:1px solid var(--line)}.step:last-child{border:0}.step+.step{padding-left:26px}
.step b{display:block;font-size:3.6rem;line-height:1;font-weight:800;color:var(--amber2);letter-spacing:-.05em}
.step h3{font-size:1.35rem;margin-top:14px;line-height:1.1;text-transform:none;letter-spacing:-.02em}
.step p{margin-top:10px;color:var(--muted)}
.show{display:grid;grid-template-columns:1fr 1.15fr;gap:clamp(30px,6vw,90px);align-items:center;margin-top:90px}
.show .shots{position:relative;display:flex;gap:18px;justify-content:center;align-items:flex-start}
.show .phone{position:relative;box-shadow:0 30px 60px rgba(20,33,61,.3);width:min(250px,46%)}
.show .phone+.phone{margin-top:60px}
.facts{list-style:none;padding:0;display:grid;gap:0;margin-top:26px}
.facts li{padding:16px 0;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr;gap:2px}
.facts li:last-child{border-bottom:1px solid var(--line)}
.facts b{font-size:1.1rem}.facts span{color:var(--muted)}

/* profesional */
.pro{background:var(--deep);color:#fff}
.pro .sub{color:rgba(255,255,255,.7)}
.row{display:grid;grid-template-columns:1fr 1.25fr;gap:clamp(30px,6vw,80px);align-items:center;margin-top:clamp(70px,9vw,120px)}.row.first{margin-top:0}
.row.flip{grid-template-columns:1.25fr 1fr}.row.flip .txt{order:2}
.row h3{font-size:clamp(1.6rem,2.8vw,2.2rem);line-height:1.08}
.row p{margin-top:16px;color:rgba(255,255,255,.72);font-size:1.05rem;max-width:30em}
.fig{position:relative}
.fig .win{border-radius:10px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.12)}
.fig .win img{width:100%}
.fig figcaption{margin-top:12px;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45)}

/* torneos: slider */
.tor{margin-top:clamp(80px,10vw,140px);border-top:1px solid rgba(255,255,255,.14);padding-top:clamp(60px,8vw,100px)}
.tabs{display:flex;gap:26px;overflow-x:auto;margin-top:34px;border-bottom:1px solid rgba(255,255,255,.16);scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;background:none;border:0;color:rgba(255,255,255,.55);font:inherit;font-weight:700;font-size:1rem;padding:0 0 14px;cursor:pointer;position:relative;transition:color .2s}
.tab.on{color:#fff}
.tab::after{content:"";position:absolute;left:0;bottom:-1px;height:3px;background:var(--amber);width:calc(var(--prog,0)*100%)}
.track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin-top:40px}
.track::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;scroll-snap-align:start;display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,6vw,90px);align-items:center}
.slide h3{font-size:clamp(1.6rem,2.9vw,2.3rem);line-height:1.08}
.slide p{margin-top:16px;color:rgba(255,255,255,.72);font-size:1.05rem;max-width:30em}
.slide ul{list-style:none;padding:0;margin-top:22px;display:grid;gap:10px}
.slide li{padding-left:22px;position:relative;font-weight:600}
.slide li::before{content:"";position:absolute;left:0;top:.62em;width:10px;height:3px;background:var(--amber)}
.slide .vis{display:grid;place-items:center}
.slide .phone{position:relative;width:min(270px,70%)}
.edmock{width:min(400px,100%);background:#fff;color:var(--navy);border-radius:14px;padding:14px;box-shadow:0 30px 70px rgba(0,0,0,.5)}
.edmock .pic{height:200px;border-radius:8px;background:#222 var(--bgimg,linear-gradient(135deg,#2a3f6b,#e5964c)) center/cover;position:relative;overflow:hidden}
.edmock .pic u{position:absolute;inset:12px;border:2px solid #fff;animation:crop 5s ease-in-out infinite alternate;box-shadow:0 0 0 999px rgba(0,0,0,.35)}
@keyframes crop{to{inset:26px 60px}}
.edmock .r{display:grid;grid-template-columns:86px 1fr;gap:10px;align-items:center;margin-top:11px;font-size:.8rem;font-weight:700;color:var(--muted)}
.edmock .r s{display:block;height:4px;border-radius:9px;background:#e3e5eb;position:relative}
.edmock .r s::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--v);background:var(--navy);animation:sl 4s ease-in-out infinite alternate}
.edmock .r s::after{content:"";position:absolute;left:var(--v);top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--amber);animation:sl2 4s ease-in-out infinite alternate}
@keyframes sl{to{width:calc(var(--v) + 22%)}}@keyframes sl2{to{left:calc(var(--v) + 22%)}}
.edmock .send{margin-top:14px;text-align:center;background:var(--navy);color:#fff;border-radius:6px;padding:10px;font-weight:700;font-size:.88rem}

/* cierre */
.end{position:relative;min-height:70vh;display:grid;place-items:center;text-align:center;color:#fff;background:var(--navy);overflow:hidden;isolation:isolate;padding:100px 20px}
.end::before{content:"";position:absolute;inset:0;z-index:-1;background:rgba(11,20,38,.7)}
.end h2{font-size:clamp(2.4rem,7vw,5.6rem);max-width:12em;margin:0 auto}
.end h2 em{font-style:normal;color:var(--amber)}
.end p{margin:22px auto 0;max-width:34em;font-size:1.15rem;color:rgba(255,255,255,.82)}
.end .cta{justify-content:center}
footer{position:relative;z-index:2;background:var(--deep);color:rgba(255,255,255,.6);padding:34px 0 44px}
footer .wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;font-weight:600}
footer .links{display:flex;gap:22px}footer .links a:hover{color:#fff}

@media (max-width:920px){
  .hero{padding:120px 0 60px;align-items:flex-start}.hero .wrap{grid-template-columns:1fr}.phones{height:520px;margin-top:20px}
  .two{grid-template-columns:1fr}.door{min-height:420px}
  .album .head,.show,.row,.row.flip,.slide{grid-template-columns:1fr}.row.flip .txt{order:0}
  .steps{grid-template-columns:1fr}.step{border-right:0;border-bottom:1px solid var(--line);padding:24px 0}.step+.step{padding-left:0}
  .top nav a:not(.btn){display:none}.scroll{display:none}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}.court *{stroke-dashoffset:0}html{scroll-behavior:auto}}
`;

const JS = `(function(){
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top=document.querySelector('.top');
  var hero=document.querySelector('.hero');function sc(){top.classList.toggle('solid',scrollY>40);hero.style.setProperty('--hp',Math.min(1,scrollY/(innerHeight*.9)).toFixed(3))}
  addEventListener('scroll',sc,{passive:true});sc();
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});

  // fotos de baloncesto propias: se usan solo las que existen
  var ids=JSON.parse(document.getElementById('phs').textContent),ok=[],left=ids.length;
  ids.forEach(function(id){var im=new Image();im.onload=function(){ok.push({u:im.src,r:im.naturalWidth/im.naturalHeight});fin()};im.onerror=fin;im.src='/landing/'+id});
  function fin(){if(--left)return;if(!ok.length)return;
    var slots=[].slice.call(document.querySelectorAll('.ph-bg'));
    slots.forEach(function(s,i){var p=ok[i===0?0:1+((i-1)%Math.max(1,ok.length-1))]||ok[0];s.style.backgroundImage='url('+p.u+')';s.classList.add('on');});
    var ed=document.querySelector('.edmock .pic');if(ed)ed.style.setProperty('--bgimg','url('+ok[ok.length-1].u+')');}

  // slider de torneos
  var track=document.querySelector('.track'),tabs=[].slice.call(document.querySelectorAll('.tab')),cur=0,t0=Date.now(),DUR=7500,hold=false;
  function mark(){tabs.forEach(function(t,i){t.classList.toggle('on',i===cur);if(i!==cur)t.style.setProperty('--prog',0);if(i===cur){var c=t.parentNode;c.scrollTo({left:t.offsetLeft-(c.clientWidth-t.offsetWidth)/2,behavior:'smooth'});}});}
  function go(i){cur=(i+tabs.length)%tabs.length;t0=Date.now();track.scrollTo({left:cur*track.clientWidth,behavior:rm?'auto':'smooth'});mark();}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){go(i)})});
  track.addEventListener('scroll',function(){var i=Math.round(track.scrollLeft/track.clientWidth);if(i!==cur&&i>=0&&i<tabs.length){cur=i;t0=Date.now();mark();}},{passive:true});
  ['pointerenter','touchstart','focusin'].forEach(function(n){track.addEventListener(n,function(){hold=true})});
  ['pointerleave','touchend','focusout'].forEach(function(n){track.addEventListener(n,function(){hold=false;t0=Date.now()})});
  var vis=false;new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(track);
  if(!rm)setInterval(function(){if(hold||!vis||document.hidden)return;var p=(Date.now()-t0)/DUR;tabs[cur].style.setProperty('--prog',Math.min(1,p));if(p>=1)go(cur+1);},100);
  mark();
})();`;

export function landingPage(user = null) {
  const goHref = user ? '/inicio' : '/entrar', goText = user ? 'Ir a mi panel' : 'Entrar';
  const title = 'Picfy · Álbumes de fotos compartidos para torneos y eventos';
  const desc = 'Crea el álbum de tu torneo o evento y comparte un enlace o un QR para que suba fotos todo el mundo. Y si eres fotógrafo: galerías por sede, selección de clubes, creadores y editor.';
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://picfy.es/">
<meta property="og:type" content="website"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="Picfy">
<meta property="og:title" content="Picfy · Todas las fotos del partido, en un solo enlace"><meta property="og:description" content="${desc}">
<meta property="og:url" content="https://picfy.es/"><meta property="og:image" content="https://picfy.es/torneos/og.jpg?v=${ASSET_V}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b1426">
<link rel="preload" href="/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="/"><i aria-hidden="true"></i>Picfy</a>
  <nav aria-label="Principal"><a href="#album">Álbum colaborativo</a><a href="#pro">Fotógrafos y organizadores</a><a class="btn primary" href="${goHref}">${goText}</a></nav>
</div></header>

<main>
<section class="hero">
  <div class="ph-bg" aria-hidden="true"></div>
  <svg class="court" viewBox="0 0 800 560" aria-hidden="true"><rect x="10" y="10" width="780" height="540" rx="10"/><path d="M400 10v540"/><circle cx="400" cy="280" r="78"/><path d="M10 170h170v220H10M790 170H620v220h170"/><circle cx="180" cy="280" r="62"/><circle cx="620" cy="280" r="62"/><path d="M10 60c260 40 260 440 0 480M790 60c-260 40-260 440 0 480"/></svg>
  <div class="wrap">
    <div>
      <p class="label">Álbumes de fotos para torneos y eventos</p>
      <h1 style="margin-top:18px">Las fotos de tu torneo, <em>en un solo enlace</em></h1>
      <p class="lead">Crea el álbum de tu torneo, campus o evento y comparte el enlace o el código QR. Jugadores, familias, aficionados y fotógrafos suben sus fotos desde el móvil, sin app y sin cuenta.</p>
      <div class="cta"><a class="btn primary" href="${goHref}">${goText}</a>${user ? '' : '<a class="btn line" href="/registro">Crear cuenta</a>'}</div>
      <p class="fine">¿Te han pasado el enlace de un álbum? Ábrelo directamente, no necesitas cuenta.</p>
    </div>
    <div class="phones">
      <div class="phone p1"><span class="crop a"></span><span class="crop d"></span>${T('upload-phone.webp', 'Subir fotos a un álbum desde el móvil', 560, 1212, 'loading="eager"')}</div>
      <div class="phone p2">${T('guest-phone.webp', 'El álbum de un torneo en el móvil, con sus sedes', 560, 1212, 'loading="eager"')}</div>
    </div>
  </div>
  <span class="scroll" aria-hidden="true">Desliza</span>
</section>

<div class="over">
<div class="two">
  <a class="door" href="#album"><div class="ph-bg" aria-hidden="true"></div><span class="label">Para torneos y eventos</span><h3>Álbum colaborativo</h3><p>Para torneos, campus y eventos: un enlace y un QR para que suba fotos todo el que esté allí.</p><span class="go">Ver el álbum</span></a>
  <a class="door" href="#pro"><div class="ph-bg" aria-hidden="true"></div><span class="label">Para profesionales</span><h3>Fotógrafos y organizadores</h3><p>Galerías por sede, revisión de fotos, selección de clubes, creadores con tareas y editor.</p><span class="go">Ver herramientas</span></a>
</div>

<section class="s album" id="album"><div class="wrap">
  <div class="head reveal"><div><span class="label">Álbum colaborativo</span><h2 style="margin-top:14px">Todas las fotos del evento, en un mismo álbum</h2></div>
  <p class="sub" style="margin-top:0">No todas las buenas fotos las hace el fotógrafo. También las hacen las familias, los jugadores y los aficionados. Con Picfy las reúnes todas en un solo sitio.</p></div>
  <div class="steps">
    <div class="step reveal"><b>01</b><h3>Crea el álbum</h3><p>Ponle nombre, fecha y portada. Ya tienes un enlace y un código QR.</p></div>
    <div class="step reveal" style="--d:.1s"><b>02</b><h3>Comparte el enlace o el QR</h3><p>El QR en la entrada del pabellón, el enlace en el grupo de WhatsApp de los equipos.</p></div>
    <div class="step reveal" style="--d:.2s"><b>03</b><h3>Todos suben sus fotos</h3><p>Desde el móvil, sin instalar nada. Tú revisas lo que se publica o lo dejas salir directamente.</p></div>
  </div>
  <div class="show">
    <div class="reveal"><span class="label">Qué pueden hacer los invitados</span><h2 style="font-size:clamp(1.7rem,3vw,2.5rem);margin-top:12px">Subir, mirar y descargar, sin complicaciones</h2>
      <ul class="facts">
        <li><b>Sin app y sin cuenta</b><span>Se abre en el navegador, desde el enlace o el QR.</span></li>
        <li><b>Dar me gusta y comentar</b><span>Cada foto se abre a pantalla completa, con sus me gusta y sus comentarios.</span></li>
        <li><b>Descarga en calidad original</b><span>Una a una, una selección o todo el álbum en ZIP.</span></li>
        <li><b>Tú controlas la privacidad</b><span>Contraseña, aviso de consentimiento si juegan menores y fecha de caducidad.</span></li>
      </ul></div>
    <div class="shots reveal" style="--d:.1s"><div class="phone">${T('guest-phone.webp', 'Álbum del torneo con sus sedes en el móvil', 560, 1212)}</div><div class="phone">${T('upload-phone.webp', 'Ventana de subida de fotos en el móvil', 560, 1212)}</div></div>
  </div>
</div></section>

<section class="s pro" id="pro"><div class="wrap">
  <div class="row first">
    <div class="txt reveal"><span class="label">Fotógrafos y organizadores</span><h2 style="margin-top:14px">Una galería por sede, todas bajo el mismo torneo</h2><p>Cada pabellón tiene su enlace, su revisión y su descarga. La página del torneo las enseña como tarjetas y cada club entra en la suya. Y para la próxima edición, duplicas el torneo con sus sedes y ajustes.</p></div>
    <figure class="fig reveal" style="--d:.1s"><div class="win">${T('admin-parent.webp', 'Panel de un torneo con sus sedes como subgalerías', 1700, 1062)}</div><figcaption>El torneo y sus sedes</figcaption></figure>
  </div>
  <div class="row flip">
    <figure class="fig reveal"><div class="win">${T('admin-sub.webp', 'Panel de una sede con fotos marcadas por colores', 1700, 1062)}</div><figcaption>Revisión por sede</figcaption></figure>
    <div class="txt reveal" style="--d:.1s"><h3>Tú decides qué se publica</h3><p>Aprueba o rechaza, marca con banderas de colores las que irán a redes y destaca tus favoritas. Filtra por autor, por día o por nombre de archivo. Marca de agua y papelera incluidas.</p></div>
  </div>
  <div class="row">
    <div class="txt reveal"><h3>Cada club elige sus fotos y te las envía</h3><p>El club toca las fotos que quiere y pulsa «Enviar al fotógrafo». Te llega la lista con su nombre, su mensaje y la sede. Con estadísticas de visitas, descargas y me gusta de todo el torneo.</p></div>
    <figure class="fig reveal" style="--d:.1s"><div class="win">${T('selection.webp', 'Galería de una sede con fotos elegidas y botón Enviar al fotógrafo', 1500, 949)}</div><figcaption>Selección del club</figcaption></figure>
  </div>

  <div class="tor">
    <div class="reveal"><span class="label">Torneos con varias sedes</span><h2 style="margin-top:14px;max-width:14em">Reparte el trabajo entre creadores y controla lo que entregan</h2></div>
    <div class="tabs reveal" role="tablist"><button class="tab" type="button" role="tab">Sedes</button><button class="tab" type="button" role="tab">Creadores</button><button class="tab" type="button" role="tab">Revisar y repetir</button><button class="tab" type="button" role="tab">Editar y publicar</button><button class="tab" type="button" role="tab">Tu panel</button></div>
    <div class="track reveal">
      <article class="slide"><div><h3>Sedes con su equipo y su calendario</h3><p>Crea el torneo con fechas, color y portada, añade las sedes y deja cada una con sus creadores y sus tareas. Ves de un vistazo lo que lleva hecho cada una.</p><ul><li>Cada sede, vinculada a su subgalería de fotos</li><li>Se pliegan las que no necesitas</li><li>Resumen del torneo en tu panel</li></ul></div><div class="vis"><div class="phone">${L('app-sedes.webp', 'Sedes de un torneo: Madrid, Sabadell, Mallorca y Valencia', 620, 1285)}</div></div></article>
      <article class="slide"><div><h3>Cada creador, con su enlace y su día</h3><p>Pasas un enlace a cada creador, sin cuenta y sin app. Ve sus tareas del día o de la semana (story, vídeo o foto) y sube sus archivos, de hasta 1 GB, desde el móvil.</p><ul><li>Vista de lista y de semana</li><li>Subida con barra de progreso</li><li>Cada creador con su color en el hub</li></ul></div><div class="vis"><div class="phone">${L('app-midia.webp', 'Mi día: las tareas del creador con sus archivos subidos', 620, 1285)}</div></div></article>
      <article class="slide"><div><h3>Revisa lo entregado y pide repetir</h3><p>Ves quién ha hecho cada tarea y qué ha subido. Si algo no vale, lo devuelves con un comentario y el creador lo ve marcado para repetirlo.</p><ul><li>Abre o descarga cada archivo</li><li>Devuelve la tarea con indicaciones</li><li>Al repetirla, el aviso desaparece</li></ul></div><div class="vis"><div class="phone">${L('app-creadores.webp', 'Hub del torneo con tareas hechas, devolver y archivos subidos', 620, 1285)}</div></div></article>
      <article class="slide"><div><h3>Edita antes de publicar</h3><p>Manda las fotos de un creador a la galería de su sede como borrador. Antes puedes recortar, enderezar, girar y ajustar la luz. El original no se toca y tú publicas cuando quieras.</p><ul><li>Recorte, giro y enderezado</li><li>Brillo, contraste, saturación y sombras</li><li>Entra como borrador hasta que la apruebes</li></ul></div><div class="vis"><div class="edmock"><div class="pic"><u></u></div><div class="r">Enderezar<s style="--v:42%"></s></div><div class="r">Brillo<s style="--v:58%"></s></div><div class="r">Saturación<s style="--v:35%"></s></div><div class="r">Sombras<s style="--v:48%"></s></div><div class="send">Enviar como borrador</div></div></div></article>
      <article class="slide"><div><h3>Tu panel, de un vistazo</h3><p>Galerías, fotos, pendientes de revisar y torneos en una pantalla, con las fotos subidas cada día, visitas y me gusta de las últimas, y la agenda de lo que toca hoy.</p><ul><li>Menú lateral en ordenador, barra inferior en el móvil</li><li>Agenda y tareas pendientes</li></ul></div><div class="vis"><div class="phone">${L('app-panel.webp', 'Panel de inicio de Picfy', 620, 1285)}</div></div></article>
    </div>
  </div>
</div></section>

<section class="end"><div class="ph-bg" aria-hidden="true"></div>
  <div class="reveal"><h2>Crea el álbum de tu próximo <em>torneo o evento</em></h2>
  <p>En un minuto tienes el enlace y el QR para compartir con quien estuvo allí.</p>
  <div class="cta"><a class="btn primary" href="${goHref}">${goText}</a>${user ? '' : '<a class="btn line" href="/registro">Crear cuenta</a>'}</div></div>
</section>
</div>
</main>

<footer><div class="wrap">
  <a class="logo" href="/"><i aria-hidden="true"></i>Picfy</a>
  <div class="links"><a href="#album">Álbum colaborativo</a><a href="#pro">Fotógrafos y organizadores</a><a href="${goHref}">${goText}</a></div>
</div></footer>
<script type="application/json" id="phs">${JSON.stringify(PHOTOS)}</script>
<script>${JS}</script>
</body>
</html>`;
}
