// Página de inicio pública de Picfy (picfy.es). Diseño con secciones tipo slide, colores de marca y efectos al hacer scroll.
// La versión anterior (bodas) sigue en landing_bodas.js por si se necesita; esta página no depende de ella.
import { ASSET_V } from './version.js';

const L = (f, alt, w, h, extra = '') => `<img src="/landing/${f}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;
const T = (f, alt, w, h, extra = '') => `<img src="/torneos/${f}?v=${ASSET_V}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" ${extra}>`;
const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  gal: ic('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.7"/><path d="M21 16l-5-5-8 8"/>'),
  team: ic('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.5" cy="9" r="2.4"/><path d="M17 14.2c2.4.2 4 2.2 4 4.8"/>'),
  cal: ic('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
  up: ic('<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>'),
  edit: ic('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  redo: ic('<path d="M20 11a8 8 0 00-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0014.5 4.5L20 16"/><path d="M20 20v-4h-4"/>'),
  lock: ic('<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
  qr: ic('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 19v1M19 14v1"/>'),
  heart: ic('<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>'),
  zip: ic('<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>'),
  chart: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  phone: ic('<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/>'),
};

const tabs = [
  ['Galerías por sede', I.gal], ['Torneos y sedes', I.cal], ['Creadores', I.team], ['Revisar y repetir', I.redo], ['Editor y borradores', I.edit], ['Tu panel', I.chart],
];

const CSS = `
@font-face{font-family:"Bricolage";font-style:normal;font-weight:200 800;font-display:swap;src:url(/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215}
@font-face{font-family:"Bricolage";font-style:normal;font-weight:200 800;font-display:swap;src:url(/vendor/fonts/bricolage-grotesque-latin-ext-wght-normal.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
:root{--navy:#14213d;--navy2:#1c2d52;--amber:#edb265;--amber2:#e5964c;--bg:#f6f4f0;--ink:#14213d;--muted:#5d6678;--line:#e5e2db;--r:24px}
*{box-sizing:border-box;margin:0}
html{overflow-x:clip;scroll-behavior:smooth;scroll-padding-top:80px}
body{font-family:Bricolage,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:clip}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
svg{width:1em;height:1em}
.wrap{width:min(1180px,100% - 40px);margin-inline:auto}
h1,h2,h3{letter-spacing:-.03em;line-height:1.05;font-weight:700}
h2{font-size:clamp(1.9rem,4vw,3rem)}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--amber2);margin-bottom:14px}
.eyebrow::before{content:"";width:22px;height:2px;background:currentColor;border-radius:2px}
.sub{color:var(--muted);font-size:clamp(1rem,1.3vw,1.15rem);max-width:40em;margin-top:14px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:700;font-size:1rem;padding:.8em 1.5em;border-radius:99px;border:1.5px solid transparent;cursor:pointer;transition:transform .2s,box-shadow .25s,background .2s}
.btn.primary{background:var(--amber);color:var(--navy);box-shadow:0 10px 30px rgba(237,178,101,.35)}
.btn.primary:hover{transform:translateY(-2px);box-shadow:0 16px 38px rgba(237,178,101,.5)}
.btn.ghost{border-color:rgba(255,255,255,.35);color:#fff}
.btn.ghost:hover{background:rgba(255,255,255,.1)}
.btn.dark{background:var(--navy);color:#fff}

/* cabecera */
.top{position:fixed;inset:0 0 auto 0;z-index:50;transition:background .3s,box-shadow .3s,backdrop-filter .3s}
.top.solid{background:rgba(20,33,61,.82);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 6px 30px rgba(0,0,0,.18)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;height:68px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.3rem;color:#fff}
.logo i{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#f6cf93,var(--amber2));box-shadow:0 4px 14px rgba(237,178,101,.5)}
.top nav{display:flex;align-items:center;gap:6px}
.top nav a:not(.btn){color:rgba(255,255,255,.8);padding:8px 14px;border-radius:99px;font-weight:600;font-size:.95rem}
.top nav a:not(.btn):hover{color:#fff;background:rgba(255,255,255,.1)}
.top .btn{padding:.55em 1.2em;font-size:.93rem}

/* hero */
.hero{position:relative;background:radial-gradient(120% 90% at 80% 0%,#243a6b 0%,var(--navy) 55%,#0d1830 100%);color:#fff;overflow:hidden;padding:130px 0 90px;isolation:isolate}
.hero .photo{position:absolute;inset:0;z-index:-2;background:url(/landing/baloncesto-hero.jpg) center/cover no-repeat;opacity:.28;mix-blend-mode:luminosity}
.hero::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(60% 50% at 18% 20%,rgba(237,178,101,.22),transparent 70%),radial-gradient(50% 50% at 90% 80%,rgba(229,150,76,.18),transparent 70%);animation:glow 12s ease-in-out infinite alternate}
@keyframes glow{to{transform:scale(1.12) translate(-2%,2%)}}
.court{position:absolute;right:-8%;top:-4%;width:min(880px,95vw);z-index:-1;opacity:.55}
.court path,.court circle,.court rect{fill:none;stroke:rgba(237,178,101,.34);stroke-width:2.2;stroke-dasharray:1200;stroke-dashoffset:1200;animation:draw 3.2s .3s cubic-bezier(.4,0,.2,1) forwards}
@keyframes draw{to{stroke-dashoffset:0}}
.hero .wrap{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px 6px 8px;border-radius:99px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:.85rem;font-weight:600;margin-bottom:22px}
.pill b{background:var(--amber);color:var(--navy);padding:2px 9px;border-radius:99px;font-size:.72rem}
.hero h1{font-size:clamp(2.5rem,6vw,4.7rem);line-height:.98}
.hero h1 em{font-style:normal;background:linear-gradient(100deg,#f6cf93,var(--amber2));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero p.lead{margin-top:22px;font-size:clamp(1.02rem,1.5vw,1.25rem);color:rgba(255,255,255,.78);max-width:31em}
.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.fine{margin-top:18px;font-size:.88rem;color:rgba(255,255,255,.55)}
.stage{position:relative;height:640px;perspective:1400px}
.dev{position:absolute;border-radius:36px;padding:9px;background:linear-gradient(145deg,#2c3c63,#0f1a33);box-shadow:0 40px 80px rgba(0,0,0,.45),inset 0 0 0 1.5px rgba(255,255,255,.14);will-change:transform}
.dev img{border-radius:28px;width:100%}
.dev.a{width:290px;left:50%;top:0;transform:translateX(-50%) rotateY(calc(-8deg + var(--mx,0)*6deg)) rotateX(calc(2deg - var(--my,0)*4deg));z-index:2;animation:bob 7s ease-in-out infinite}
.dev.b{width:230px;left:0;top:90px;transform:rotate(-7deg) translateY(calc(var(--s,0)*-40px));z-index:1;opacity:.95;animation:bob 8s ease-in-out infinite -2s}
.dev.c{width:230px;right:0;top:120px;transform:rotate(7deg) translateY(calc(var(--s,0)*-70px));z-index:1;animation:bob 9s ease-in-out infinite -4s}
@keyframes bob{0%,100%{translate:0 0}50%{translate:0 -14px}}
.chip{position:absolute;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:16px;background:rgba(255,255,255,.95);color:var(--navy);font-weight:700;font-size:.88rem;box-shadow:0 18px 40px rgba(0,0,0,.3);animation:bob 6s ease-in-out infinite}
.chip svg{width:22px;height:22px;color:var(--amber2)}
.chip small{display:block;font-weight:500;color:var(--muted);font-size:.74rem}
.chip.c1{left:-2%;bottom:12%;animation-delay:-1s}.chip.c2{right:0;top:46%;animation-delay:-3s}.chip.c3{left:12%;top:4%;animation-delay:-5s}

/* banda */
.bandw{overflow:hidden;margin-top:-14px;position:relative;z-index:3;padding:14px 0}
.band{background:var(--amber);color:var(--navy);overflow:hidden;white-space:nowrap;padding:16px 0;font-weight:800;font-size:1.05rem;transform:rotate(-1deg) scale(1.03);box-shadow:0 10px 30px rgba(0,0,0,.14)}
.band div{display:inline-flex;gap:34px;padding-right:34px;animation:mq 34s linear infinite}
.band span::after{content:"●";margin-left:34px;font-size:.5rem;vertical-align:middle;opacity:.55}
@keyframes mq{to{transform:translateX(-50%)}}

section.s{padding:clamp(70px,10vw,130px) 0}
.reveal{opacity:0;transform:translateY(34px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0s)}
.reveal.in{opacity:1;transform:none}

/* showcase */
.show{background:#fff;border-radius:48px 48px 0 0;margin-top:-30px;position:relative;z-index:2}
.tabs{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 14px;margin-top:34px;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;display:inline-flex;align-items:center;gap:8px;font:inherit;font-weight:700;font-size:.93rem;padding:10px 18px;border-radius:99px;border:1.5px solid var(--line);background:#fff;color:var(--muted);cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
.tab svg{width:18px;height:18px}
.tab.on{background:var(--navy);border-color:var(--navy);color:#fff}
.tab.on::after{content:"";position:absolute;left:0;bottom:0;height:3px;background:var(--amber);width:calc(var(--prog,0)*100%)}
.track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;border-radius:32px}
.track::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;scroll-snap-align:start;display:grid;grid-template-columns:1fr 1fr;gap:clamp(24px,5vw,70px);align-items:center;padding:clamp(26px,5vw,60px);background:linear-gradient(150deg,#fbf6ee,#f6f4f0 55%,#eef0f6);min-height:540px}
.slide h3{font-size:clamp(1.6rem,3vw,2.4rem)}
.slide p{color:var(--muted);margin-top:14px;font-size:1.05rem}
.slide ul{list-style:none;padding:0;margin-top:20px;display:grid;gap:10px}
.slide li{display:flex;gap:10px;align-items:flex-start;font-weight:600}
.slide li::before{content:"";flex:none;width:20px;height:20px;margin-top:2px;border-radius:50%;background:var(--amber) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2314213d' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E") center/14px no-repeat}
.vis{display:grid;place-items:center;position:relative}
.vis .dev{position:relative;width:min(270px,70%);transform:none;animation:none}
.vis .dev.a{transform:none;left:auto;top:auto}
.vis .shot{border-radius:20px;overflow:hidden;box-shadow:0 30px 70px rgba(20,33,61,.25);border:1px solid var(--line);width:100%}
.vis .glowb{position:absolute;width:70%;aspect-ratio:1;border-radius:50%;background:radial-gradient(closest-side,rgba(237,178,101,.5),transparent);z-index:0}
.vis>*:not(.glowb){position:relative;z-index:1}
.dots{display:flex;justify-content:center;gap:8px;margin-top:18px}
.dots i{width:8px;height:8px;border-radius:99px;background:#d3d6de;transition:all .3s}
.dots i.on{width:26px;background:var(--navy)}

/* editor mock */
.edmock{width:min(420px,100%);background:#fff;border-radius:22px;padding:16px;box-shadow:0 30px 70px rgba(20,33,61,.25);border:1px solid var(--line)}
.edmock .ph{height:190px;border-radius:14px;background:linear-gradient(135deg,#3d6fb3,#e5964c 70%,#14213d);position:relative;overflow:hidden}
.edmock .ph::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 60% 55%,transparent 20%,transparent 21%),conic-gradient(from 20deg at 62% 60%,transparent,rgba(255,255,255,.12),transparent 40%);}
.edmock .ph b{position:absolute;left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;border:5px solid #fff;opacity:.9}
.edmock .ph u{position:absolute;inset:14px;border:2px dashed rgba(255,255,255,.85);border-radius:6px;animation:crop 5s ease-in-out infinite alternate}
@keyframes crop{to{inset:30px 54px}}
.edmock .row{display:grid;grid-template-columns:90px 1fr;gap:10px;align-items:center;margin-top:12px;font-size:.82rem;font-weight:700;color:var(--muted)}
.edmock .row s{display:block;height:6px;border-radius:9px;background:#e6e9f0;position:relative;text-decoration:none}
.edmock .row s::before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--v);background:var(--amber);border-radius:9px;animation:sl 4s ease-in-out infinite alternate}
.edmock .row s::after{content:"";position:absolute;left:var(--v);top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);animation:sl2 4s ease-in-out infinite alternate}
@keyframes sl{to{width:calc(var(--v) + 22%)}}@keyframes sl2{to{left:calc(var(--v) + 22%)}}
.edmock .send{margin-top:16px;text-align:center;background:var(--navy);color:#fff;border-radius:99px;padding:11px;font-weight:700;font-size:.9rem}

/* bento */
.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:18px;margin-top:46px}
.cell{grid-column:span 2;background:#fff;border-radius:var(--r);padding:28px;border:1px solid var(--line);position:relative;overflow:hidden;transition:transform .35s,box-shadow .35s}
.cell:hover{transform:translateY(-6px);box-shadow:0 26px 60px rgba(20,33,61,.12)}
.cell.w3{grid-column:span 3}.cell.dark{background:var(--navy);color:#fff;border-color:var(--navy)}
.cell.dark p{color:rgba(255,255,255,.72)}
.cell .ico{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:#faecd6;color:#a96a1c;margin-bottom:18px}
.cell.dark .ico{background:rgba(237,178,101,.18);color:var(--amber)}
.cell .ico svg{width:26px;height:26px}
.cell h3{font-size:1.3rem;letter-spacing:-.02em}
.cell p{color:var(--muted);margin-top:10px;font-size:.98rem}
.cell::after{content:"";position:absolute;right:-60px;top:-60px;width:160px;height:160px;border-radius:50%;background:radial-gradient(closest-side,rgba(237,178,101,.3),transparent);opacity:0;transition:opacity .4s}
.cell:hover::after{opacity:1}

/* pasos */
.steps{background:var(--navy);color:#fff;border-radius:48px;margin:0 clamp(0px,2vw,24px);overflow:hidden;position:relative}
.steps .sub{color:rgba(255,255,255,.7)}
.stp{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:50px;counter-reset:n;position:relative}
.stp::before{content:"";position:absolute;left:8%;right:8%;top:30px;height:2px;background:linear-gradient(90deg,var(--amber),rgba(237,178,101,.1));transform-origin:left;transform:scaleX(var(--line,0))}
.stp div{position:relative;padding-top:0}
.stp div::before{counter-increment:n;content:counter(n);display:grid;place-items:center;width:62px;height:62px;border-radius:50%;background:var(--amber);color:var(--navy);font-weight:800;font-size:1.5rem;margin-bottom:22px;box-shadow:0 0 0 8px var(--navy),0 0 0 9px rgba(237,178,101,.4)}
.stp h3{font-size:1.35rem}.stp p{margin-top:10px;color:rgba(255,255,255,.72)}

/* galería de pantallas */
.reel{display:flex;gap:22px;overflow-x:auto;scroll-snap-type:x mandatory;padding:36px max(20px,calc((100vw - 1180px)/2)) 30px;scrollbar-width:none}
.reel::-webkit-scrollbar{display:none}
.rl{flex:0 0 min(640px,82vw);scroll-snap-align:center;background:#fff;border-radius:26px;padding:12px;border:1px solid var(--line);box-shadow:0 22px 50px rgba(20,33,61,.1);transition:transform .35s}
.rl:hover{transform:translateY(-6px) rotate(-.4deg)}
.rl img{border-radius:16px;width:100%}
.rl figcaption{padding:14px 10px 6px;font-weight:700}
.rl figcaption small{display:block;font-weight:500;color:var(--muted)}

/* cifras */
.nums{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:40px}
.nums div{text-align:center;padding:26px 10px;border-radius:var(--r);background:#fff;border:1px solid var(--line)}
.nums b{display:block;font-size:clamp(2.2rem,4vw,3.4rem);letter-spacing:-.04em;color:var(--navy);line-height:1}
.nums b em{font-style:normal;color:var(--amber2)}
.nums span{display:block;margin-top:8px;color:var(--muted);font-weight:600;font-size:.92rem}

/* cierre */
.end{position:relative;background:linear-gradient(140deg,#f6cf93 0%,var(--amber) 50%,var(--amber2) 100%);color:var(--navy);text-align:center;border-radius:48px;margin:0 clamp(0px,2vw,24px) 30px;padding:clamp(60px,9vw,110px) 22px;overflow:hidden;isolation:isolate}
.end .photo{position:absolute;inset:0;z-index:-1;background:url(/landing/baloncesto-cierre.jpg) center/cover no-repeat;opacity:.18;mix-blend-mode:multiply}
.end h2{font-size:clamp(2rem,5vw,3.8rem);max-width:14em;margin:0 auto}
.end p{margin:18px auto 0;max-width:34em;font-size:1.1rem;color:rgba(20,33,61,.8)}
.end .cta{justify-content:center}
.end .btn.ghost{border-color:rgba(20,33,61,.3);color:var(--navy)}
footer{padding:36px 0 50px}
footer .wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;color:var(--muted);font-weight:600}
footer .logo{color:var(--navy)}
footer .links{display:flex;gap:18px}

@media (max-width:900px){
  .hero{padding:104px 0 60px}.hero .wrap{grid-template-columns:1fr}.stage{height:520px;margin-top:10px}
  .dev.a{width:230px}.dev.b,.dev.c{width:170px}.chip{font-size:.78rem;padding:8px 12px}
  .slide{grid-template-columns:1fr;min-height:0}.vis{order:-1}
  .bento{grid-template-columns:1fr 1fr}.cell,.cell.w3{grid-column:span 1}
  .stp{grid-template-columns:1fr}.stp::before{display:none}
  .nums{grid-template-columns:1fr 1fr}
  .top nav a:not(.btn){display:none}
}
@media (max-width:560px){.bento{grid-template-columns:1fr}.show,.steps,.end{border-radius:32px}.stage{height:470px}.dev.b{left:-4%}.dev.c{right:-4%}.chip.c3{display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.reveal{opacity:1;transform:none}.court path,.court circle,.court rect{stroke-dashoffset:0}html{scroll-behavior:auto}}
`;

const JS = `(function(){
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top=document.querySelector('.top'),hero=document.querySelector('.hero'),stage=document.querySelector('.stage');
  function sc(){top.classList.toggle('solid',scrollY>30);var s=Math.min(1,scrollY/700);stage.style.setProperty('--s',s.toFixed(3));
    var st=document.querySelector('.stp');if(st){var r=st.getBoundingClientRect();var p=Math.max(0,Math.min(1,(innerHeight*.85-r.top)/(innerHeight*.5)));st.style.setProperty('--line',p.toFixed(3));}}
  addEventListener('scroll',function(){requestAnimationFrame(sc)},{passive:true});sc();
  if(!rm){hero.addEventListener('pointermove',function(e){var b=hero.getBoundingClientRect();stage.style.setProperty('--mx',((e.clientX-b.left)/b.width-.5).toFixed(3));stage.style.setProperty('--my',((e.clientY-b.top)/b.height-.5).toFixed(3));});}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  // cifras que suben
  var nio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;nio.unobserve(e.target);var b=e.target,to=+b.dataset.to,t0=performance.now();
    (function f(t){var k=Math.min(1,(t-t0)/1200);b.firstChild.nodeValue=Math.round(to*(1-Math.pow(1-k,3)));if(k<1&&!rm)requestAnimationFrame(f);else b.firstChild.nodeValue=to;})(t0);})},{threshold:.6});
  document.querySelectorAll('[data-to]').forEach(function(b){nio.observe(b)});
  // slider de funciones
  var track=document.querySelector('.track'),tabs=[].slice.call(document.querySelectorAll('.tab')),dots=[].slice.call(document.querySelectorAll('.dots i')),cur=0,t0=Date.now(),DUR=7000,hold=false;
  function go(i,smooth){cur=(i+tabs.length)%tabs.length;t0=Date.now();track.scrollTo({left:cur*track.clientWidth,behavior:smooth===false||rm?'auto':'smooth'});mark();}
  function mark(){tabs.forEach(function(t,i){t.classList.toggle('on',i===cur);if(i===cur){var c=t.parentNode;c.scrollTo({left:t.offsetLeft-(c.clientWidth-t.offsetWidth)/2,behavior:'smooth'});}});dots.forEach(function(d,i){d.classList.toggle('on',i===cur)});}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){go(i)})});
  track.addEventListener('scroll',function(){var i=Math.round(track.scrollLeft/track.clientWidth);if(i!==cur&&i>=0&&i<tabs.length){cur=i;t0=Date.now();mark();}},{passive:true});
  ['pointerenter','touchstart','focusin'].forEach(function(n){track.addEventListener(n,function(){hold=true})});
  ['pointerleave','touchend','focusout'].forEach(function(n){track.addEventListener(n,function(){hold=false;t0=Date.now()})});
  var vis=true;new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(track);
  if(!rm)setInterval(function(){if(hold||!vis||document.hidden)return;var p=(Date.now()-t0)/DUR;tabs[cur].style.setProperty('--prog',Math.min(1,p));if(p>=1)go(cur+1);},100);
  mark();
})();`;

export function landingPage(user = null) {
  const goHref = user ? '/inicio' : '/entrar', goText = user ? 'Ir a mi panel' : 'Entrar';
  const title = 'Picfy · Galerías de fotos para torneos con varias sedes';
  const desc = 'Una galería por sede y un solo enlace para todo el torneo. Fotógrafos y creadores suben desde el móvil, tú revisas, editas y publicas, y los equipos eligen y descargan sus fotos.';
  const marquee = ['Una galería por sede', 'Enlace único para el torneo', 'Creadores con su propio enlace', 'Editor de fotos', 'Borradores antes de publicar', 'Vídeos hasta 1 GB', 'Descarga en ZIP', 'Privado con contraseña', 'Código QR'];
  const mq = marquee.map((m) => `<span>${m}</span>`).join('');
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
<meta name="theme-color" content="#14213d">
<link rel="preload" href="/vendor/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="logo" href="/"><i aria-hidden="true"></i>Picfy</a>
  <nav aria-label="Principal"><a href="#funciones">Funciones</a><a href="#como">Cómo funciona</a><a class="btn primary" href="${goHref}">${goText}</a></nav>
</div></header>

<main>
<section class="hero">
  <div class="photo" aria-hidden="true"></div>
  <svg class="court" viewBox="0 0 800 560" aria-hidden="true"><rect x="10" y="10" width="780" height="540" rx="14"/><path d="M400 10v540"/><circle cx="400" cy="280" r="78"/><path d="M10 170h170v220H10M790 170H620v220h170"/><circle cx="180" cy="280" r="62"/><circle cx="620" cy="280" r="62"/><path d="M10 60c260 40 260 440 0 480M790 60c-260 40-260 440 0 480"/></svg>
  <div class="wrap">
    <div>
      <div class="pill"><b>Nuevo</b>Torneos, creadores y editor de fotos</div>
      <h1>Las fotos de tu torneo, <em>en un solo enlace</em></h1>
      <p class="lead">Una galería por sede, un equipo de creadores con su propia lista de tareas y un editor para dejar las fotos listas antes de publicarlas. Todo desde el móvil y sin que nadie instale nada.</p>
      <div class="cta"><a class="btn primary" href="${goHref}">${goText}</a>${user ? '' : '<a class="btn ghost" href="/registro">Crear cuenta</a>'}</div>
      <p class="fine">¿Te han pasado el enlace de una galería? Ábrelo directamente, no necesitas cuenta.</p>
    </div>
    <div class="stage" aria-hidden="false">
      <div class="dev b">${L('app-sedes.webp', 'Lista de sedes de un torneo en Picfy', 640, 975, 'loading="eager"')}</div>
      <div class="dev a">${L('app-panel.webp', 'Panel de Picfy con galerías, fotos subidas y estadísticas', 640, 967, 'loading="eager" fetchpriority="high"')}</div>
      <div class="dev c">${L('app-midia.webp', 'Vista «Mi día» de un creador con sus tareas y archivos subidos', 640, 1117, 'loading="eager"')}</div>
      <div class="chip c1">${I.redo}<div>Repetir tarea<small>Con comentario para el creador</small></div></div>
      <div class="chip c2">${I.edit}<div>Enviada como borrador<small>Tú decides cuándo publicar</small></div></div>
      <div class="chip c3">${I.team}<div>Creador de Madrid<small>3 de 5 tareas hechas</small></div></div>
    </div>
  </div>
</section>
<div class="bandw"><div class="band" aria-hidden="true"><div>${mq}</div><div>${mq}</div></div></div>

<section class="s show" id="funciones"><div class="wrap">
  <div class="reveal"><span class="eyebrow">Todo en un sitio</span><h2>Del primer partido a la última foto</h2>
  <p class="sub">Organiza el torneo, reparte el trabajo, revisa lo que llega y entrega a cada equipo sus fotos.</p></div>
  <div class="tabs reveal" role="tablist">${tabs.map(([t, i]) => `<button class="tab" type="button" role="tab">${i}${t}</button>`).join('')}</div>
  <div class="track reveal">
    <article class="slide"><div><h3>Una galería por sede, bajo un solo torneo</h3><p>Cada sede tiene su enlace, su moderación y su descarga. La página del torneo las enseña como tarjetas y cada equipo entra en la suya.</p>
      <ul><li>Enlaces privados con contraseña si juegan menores</li><li>Cada sede se revisa y se descarga por separado</li><li>Duplica el torneo para la próxima edición</li></ul></div>
      <div class="vis"><span class="glowb"></span><div class="shot">${T('guest-desktop.webp', 'Página del torneo con una tarjeta por sede', 1500, 949)}</div></div></article>
    <article class="slide"><div><h3>Torneos con sedes, fechas y portada</h3><p>Crea el torneo, añade las sedes y deja cada una con su equipo y su calendario. Plega las sedes que no necesitas y ve de un vistazo cuántas tareas llevan hechas.</p>
      <ul><li>Descripción, fechas, color y foto de portada</li><li>Una subgalería de fotos por sede, vinculada con un clic</li><li>Resumen del torneo en tu panel</li></ul></div>
      <div class="vis"><span class="glowb"></span><div class="dev">${L('app-sedes.webp', 'Sedes de un torneo: Madrid, Sabadell, Mallorca y Valencia', 640, 975)}</div></div></article>
    <article class="slide"><div><h3>Cada creador, con su enlace y su día</h3><p>Pasas un enlace a cada creador: sin cuenta y sin app. Ve sus tareas del día o de la semana (Story, vídeo o foto) y sube sus archivos hasta 1 GB, directamente desde el móvil.</p>
      <ul><li>Lista y vista de semana</li><li>Subida con barra de progreso, fotos y vídeos</li><li>Cada creador con su color en el hub</li></ul></div>
      <div class="vis"><span class="glowb"></span><div class="dev">${L('app-midia.webp', 'Mi día: tareas del creador con archivos subidos', 640, 1117)}</div></div></article>
    <article class="slide"><div><h3>Revisa lo entregado y pide repetir</h3><p>Ves quién ha hecho cada tarea y qué ha subido. Si algo no vale, lo devuelves con un comentario y el creador lo ve marcado con un aviso para repetirlo.</p>
      <ul><li>Descarga o abre cada archivo desde el hub</li><li>Devuelve la tarea con indicaciones claras</li><li>Al repetirla, el aviso desaparece solo</li></ul></div>
      <div class="vis"><span class="glowb"></span><div class="dev">${L('app-creadores.webp', 'Hub del torneo con tareas hechas, devolver y archivos subidos', 640, 975)}</div></div></article>
    <article class="slide"><div><h3>Edita antes de publicar</h3><p>Manda las fotos del creador a la galería de su sede como borrador. Antes de enviarlas puedes recortar, enderezar, girar y ajustar la luz. La foto original no se toca.</p>
      <ul><li>Recorte, giro y enderezado</li><li>Brillo, contraste, saturación y sombras</li><li>Entra como borrador: la publicas cuando quieras</li></ul></div>
      <div class="vis"><span class="glowb"></span><div class="edmock"><div class="ph"><u></u><b></b></div>
        <div class="row">Enderezar<s style="--v:42%"></s></div><div class="row">Brillo<s style="--v:58%"></s></div><div class="row">Saturación<s style="--v:35%"></s></div><div class="row">Sombras<s style="--v:48%"></s></div>
        <div class="send">Enviar como borrador</div></div></div></article>
    <article class="slide"><div><h3>Tu panel, de un vistazo</h3><p>Galerías, fotos, pendientes de revisar y torneos en una pantalla. Ves cuántas fotos se han subido cada día, visitas y me gusta de las últimas, y lo que toca hacer hoy.</p>
      <ul><li>Estadísticas de las últimas fotos subidas</li><li>Agenda y tareas pendientes</li><li>Menú lateral en ordenador y barra inferior en el móvil</li></ul></div>
      <div class="vis"><span class="glowb"></span><div class="dev">${L('app-panel.webp', 'Panel de inicio de Picfy', 640, 967)}</div></div></article>
  </div>
  <div class="dots">${tabs.map(() => '<i></i>').join('')}</div>
</div></section>

<section class="s"><div class="wrap">
  <div class="reveal"><span class="eyebrow">Funciones</span><h2>Pensado para torneos de verdad</h2></div>
  <div class="bento">
    <div class="cell w3 dark reveal"><div class="ico">${I.up}</div><h3>Subida desde la pista</h3><p>Fotógrafos, voluntarios y creadores suben desde el móvil con un enlace o un QR. Fotos en calidad original y vídeos de hasta 1 GB, con barra de progreso.</p></div>
    <div class="cell w3 reveal" style="--d:.08s"><div class="ico">${I.edit}</div><h3>Borrador y editor</h3><p>Lo que llega de los creadores entra como borrador. Lo retocas, lo apruebas y solo entonces se publica en la galería de la sede.</p></div>
    <div class="cell reveal"><div class="ico">${I.lock}</div><h3>Privado para familias</h3><p>Contraseña por galería o por sede, aviso de consentimiento y fecha de caducidad.</p></div>
    <div class="cell reveal" style="--d:.08s"><div class="ico">${I.heart}</div><h3>Elegir y descargar</h3><p>Los equipos marcan sus fotos, comentan y te envían la selección. Descarga una a una o en ZIP.</p></div>
    <div class="cell reveal" style="--d:.16s"><div class="ico">${I.qr}</div><h3>Enlace y QR por sede</h3><p>Cada sede comparte el suyo y tú controlas quién sube y cuántas fotos.</p></div>
    <div class="cell reveal"><div class="ico">${I.chart}</div><h3>Estadísticas</h3><p>Visitas, descargas, me gusta y fotos por día, de todo el torneo o de cada sede.</p></div>
    <div class="cell reveal" style="--d:.08s"><div class="ico">${I.zip}</div><h3>Papelera segura</h3><p>7 días para recuperar fotos y 30 para galerías enteras.</p></div>
    <div class="cell reveal" style="--d:.16s"><div class="ico">${I.phone}</div><h3>Hecho para el móvil</h3><p>Nadie instala nada: todo funciona desde el navegador, con barra propia en el móvil.</p></div>
  </div>
</div></section>

<section class="s steps" id="como"><div class="wrap">
  <div class="reveal"><span class="eyebrow">Cómo funciona</span><h2>Montas el torneo una vez</h2><p class="sub">Después, cada persona trabaja con su enlace.</p></div>
  <div class="stp">
    <div class="reveal"><h3>Crea el torneo y las sedes</h3><p>Una galería para el torneo y una subgalería por pabellón, con su enlace y su QR.</p></div>
    <div class="reveal" style="--d:.1s"><h3>Invita a los creadores</h3><p>Cada uno recibe su enlace con sus tareas: story, vídeo o foto, y sube sus archivos.</p></div>
    <div class="reveal" style="--d:.2s"><h3>Revisa, edita y publica</h3><p>Devuelves lo que no vale, retocas lo que sí y lo envías a la galería. Cada equipo descarga lo suyo.</p></div>
  </div>
</div></section>

<section class="s" style="padding-bottom:30px"><div class="wrap reveal"><span class="eyebrow">Así se ve</span><h2>Galerías limpias para los equipos</h2><p class="sub">Arrastra para ver más pantallas.</p></div>
  <div class="reel">
    <figure class="rl">${T('admin-parent.webp', 'Panel de un torneo con sus sedes como subgalerías', 1700, 1062)}<figcaption>El torneo y sus sedes<small>Una subgalería por pabellón</small></figcaption></figure>
    <figure class="rl">${T('lightbox.webp', 'Una foto a pantalla completa con comentarios', 1500, 949)}<figcaption>Visor a pantalla completa<small>Me gusta y comentarios</small></figcaption></figure>
    <figure class="rl">${T('selection.webp', 'Galería con fotos elegidas y botón Enviar al fotógrafo', 1500, 949)}<figcaption>Cada club elige sus fotos<small>Y te las envía con un mensaje</small></figcaption></figure>
    <figure class="rl">${T('admin-sub.webp', 'Panel de una sede con fotos marcadas', 1700, 1062)}<figcaption>Moderación por sede<small>Banderas de colores y favoritas</small></figcaption></figure>
    <figure class="rl">${T('collection.webp', 'Colección con varias galerías de la temporada', 1500, 660)}<figcaption>Toda la temporada bajo un enlace<small>Colecciones de galerías</small></figcaption></figure>
  </div></section>

<section class="s" style="padding-top:20px"><div class="wrap">
  <div class="nums">
    <div class="reveal"><b data-to="1">0</b><span>enlace para todo el torneo</span></div>
    <div class="reveal" style="--d:.06s"><b data-to="1">0</b><span>galería por cada sede</span></div>
    <div class="reveal" style="--d:.12s"><b data-to="1">0<em> GB</em></b><span>por archivo, vídeos incluidos</span></div>
    <div class="reveal" style="--d:.18s"><b data-to="0">0</b><span>apps que instalar</span></div>
  </div>
</div></section>

<section class="end reveal"><div class="photo" aria-hidden="true"></div>
  <h2>Prepara tu próximo torneo</h2>
  <p>Crea el torneo, añade las sedes y reparte los enlaces. Tu equipo puede empezar a subir en cuanto los reciba.</p>
  <div class="cta"><a class="btn dark" href="${goHref}">${goText}</a>${user ? '' : '<a class="btn ghost" href="/registro">Crear cuenta</a>'}</div>
</section>
</main>

<footer><div class="wrap">
  <a class="logo" href="/"><i aria-hidden="true"></i>Picfy</a>
  <div class="links"><a href="${goHref}">${goText}</a>${user ? '' : '<a href="/registro">Crear cuenta</a>'}</div>
</div></footer>
<script>${JS}</script>
</body>
</html>`;
}
