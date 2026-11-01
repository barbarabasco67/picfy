// Entrega al cliente: página pública de solo lectura con los archivos aprobados de un torneo.
import { esc } from './util.js';

const size = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

const css = `*{box-sizing:border-box}body{margin:0;background:#f6f4f0;color:#14213d;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:36px 20px 60px}
.top{display:flex;align-items:center;gap:10px;margin-bottom:22px;font-weight:800;color:#14213d}.top i{width:22px;height:22px;border-radius:7px;background:#edb265;display:block}
h1{margin:0 0 4px;font-size:clamp(1.7rem,4vw,2.4rem);letter-spacing:-.02em}.sub{margin:0 0 6px;color:#6b7488}.desc{margin:0 0 6px;max-width:60ch}
.sede{margin-top:34px}.sh{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.sh h2{margin:0;font-size:1.25rem;flex:1}.sh .n{color:#6b7488;font-size:.9rem}
.btn{display:inline-flex;align-items:center;gap:7px;border:0;background:#14213d;color:#fff;text-decoration:none;font:inherit;font-weight:700;font-size:.88rem;padding:9px 16px;border-radius:99px;cursor:pointer}
.btn svg{width:16px;height:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.it{background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(20,33,61,.08);display:flex;flex-direction:column}
.th{display:block;aspect-ratio:4/3;background:#e6e9f0;overflow:hidden}.th img,.th video{width:100%;height:100%;object-fit:cover;display:block}
.ib{padding:10px 12px;display:flex;align-items:center;gap:8px}.ib .nm{flex:1;min-width:0;font-size:.82rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ib small{color:#6b7488;font-size:.74rem;display:block;font-weight:500}
.dl{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#14213d;background:#f6f4f0;text-decoration:none}.dl svg{width:17px;height:17px}
.empty{background:#fff;border-radius:16px;padding:28px;color:#6b7488;text-align:center}
.foot{margin-top:46px;color:#9aa1b2;font-size:.8rem;text-align:center}
@media(max-width:560px){.grid{grid-template-columns:repeat(2,1fr);gap:10px}.wrap{padding:24px 14px 50px}}`;
const DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/></svg>';

export function entregaPage({ torneo, token = '', sedes = [] }) {
  if (!torneo) {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Enlace no válido</title><style>${css}</style></head><body><div class="wrap"><div class="top"><i></i>Picfy</div><div class="empty">Este enlace ya no está disponible.</div></div></body></html>`;
  }
  const total = sedes.reduce((n, s) => n + s.files.length, 0);
  const body = sedes.filter((s) => s.files.length).map((s) => `<section class="sede"><div class="sh"><h2>${esc(s.name)}</h2><span class="n">${s.files.length} ${s.files.length === 1 ? 'archivo' : 'archivos'}</span><a class="btn" href="/entrega/${token}/zip/${s.id}">${DL} Descargar todo</a></div>
<div class="grid">${s.files.map((f) => {
    const src = `/entrega/${token}/archivo/${f.id}`;
    const media = /^video\//.test(f.mime) ? `<video src="${src}#t=0.1" preload="metadata" controls playsinline></video>` : `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="" loading="lazy"></a>`;
    return `<div class="it"><div class="th">${media}</div><div class="ib"><div class="nm">${esc(f.filename)}<small>${size(f.size)}</small></div><a class="dl" href="${src}?dl=1" aria-label="Descargar" title="Descargar">${DL}</a></div></div>`;
  }).join('')}</div></section>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(torneo.name)}</title><style>${css}</style></head><body><div class="wrap">
<div class="top"><i></i>Picfy</div><h1>${esc(torneo.name)}</h1>${torneo.range ? `<p class="sub">${esc(torneo.range)}</p>` : ''}${torneo.description ? `<p class="desc">${esc(torneo.description)}</p>` : ''}
${total ? body : '<div class="empty" style="margin-top:28px">Todavía no hay archivos para mostrar.</div>'}
<p class="foot">Entrega realizada con Picfy</p></div></body></html>`;
}
