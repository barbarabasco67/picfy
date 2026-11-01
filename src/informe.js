// Informe del torneo para imprimir o guardar como PDF: lo que se ha hecho, entregado y publicado.
import { esc } from './util.js';

const fmtDate = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha');
const fmtBytes = (b) => (b >= 1073741824 ? (b / 1073741824).toFixed(1).replace('.', ',') + ' GB' : b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(0, Math.round(b / 1024)) + ' KB');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const CSS = `:root{--ink:#14213d;--acc:#edb265;--mut:#5b6478;--line:#e2e5ee}*{box-sizing:border-box}
@page{size:A4;margin:14mm 13mm}
body{margin:0;background:#eceae5;color:var(--ink);font:13px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bar{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:12px 20px;background:#14213d;color:#fff}
.bar a,.bar button{font:inherit;font-weight:700;border:0;border-radius:99px;padding:9px 18px;cursor:pointer;text-decoration:none}
.bar a{background:rgba(255,255,255,.14);color:#fff}.bar button{background:var(--acc);color:#2a1d08}
.sheet{max-width:880px;margin:22px auto;background:#fff;padding:38px 42px 30px;box-shadow:0 10px 40px rgba(20,33,61,.12)}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:17px;letter-spacing:-.01em}.brand i{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#f6cf97,#edb265 60%,#e09a3d)}
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:18px;border-bottom:3px solid var(--tc,#edb265)}
.head h1{margin:6px 0 4px;font-size:30px;line-height:1.1;letter-spacing:-.02em}.head p{margin:0;color:var(--mut)}.head .meta{text-align:right;color:var(--mut);font-size:12px;white-space:nowrap}
h2{margin:26px 0 10px;font-size:15px;letter-spacing:.01em}h2 small{font-weight:500;color:var(--mut);font-size:12px;margin-left:6px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}.kpi{border:1px solid var(--line);border-radius:12px;padding:12px 14px}.kpi b{display:block;font-size:24px;line-height:1.1}.kpi span{font-size:11.5px;color:var(--mut);font-weight:600}.kpi.bad b{color:#d6402f}
.prog{height:8px;border-radius:8px;background:var(--line);overflow:hidden;margin:14px 0 2px}.prog u{display:block;height:100%;background:var(--tc,#edb265);text-decoration:none}
table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);padding:7px 8px;border-bottom:2px solid var(--line)}td{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}tr{break-inside:avoid}tfoot td{font-weight:800;border-top:2px solid var(--line);border-bottom:0}
.st{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700;background:#eef0f6}.st.ok{background:rgba(47,158,95,.15);color:#1f7a47}.st.late{background:rgba(214,64,47,.13);color:#c0392b}.st.retry{background:rgba(237,178,101,.3);color:#8a5a12}
.kind{display:inline-flex;align-items:center;gap:5px}.kind i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.sede{break-before:page}.foot{margin-top:28px;padding-top:12px;border-top:1px solid var(--line);color:var(--mut);font-size:11px;display:flex;justify-content:space-between}
@media print{body{background:#fff}.bar{display:none}.sheet{margin:0;max-width:none;padding:0;box-shadow:none}}
@media (max-width:640px){.sheet{padding:22px 16px}.kpis{grid-template-columns:repeat(2,1fr)}.head{flex-direction:column}.head .meta{text-align:left}table{font-size:11px}}`;

export function informePage({ user, torneo, kinds, sedes, today }) {
  const all = sedes.flatMap((s) => s.tareas.map((t) => ({ ...t, sede: s })));
  const done = all.filter((t) => t.done).length;
  const late = (t) => !t.done && t.date && t.date < today;
  const lateN = all.filter(late).length;
  const files = sedes.flatMap((s) => s.entregas);
  const img = files.filter((e) => /^image\//.test(e.mime)).length, vid = files.filter((e) => /^video\//.test(e.mime)).length;
  const bytes = files.reduce((n, e) => n + e.size, 0);
  const galPhotos = sedes.reduce((n, s) => n + (s.fotos || 0), 0);
  const creators = sedes.flatMap((s) => s.creadores.map((c) => ({ c, s })));
  const range = torneo.start_date ? fmtDate(torneo.start_date) + (torneo.end_date && torneo.end_date !== torneo.start_date ? ' – ' + fmtDate(torneo.end_date) : '') : '';
  const now = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });
  const kpi = (n, l, cls = '') => `<div class="kpi ${cls}"><b>${n}</b><span>${l}</span></div>`;

  const sedeRows = sedes.map((s) => {
    const d = s.tareas.filter((t) => t.done).length, l = s.tareas.filter(late).length;
    return `<tr><td><b>${esc(s.name)}</b></td><td class="n">${s.creadores.length}</td><td class="n">${d}/${s.tareas.length}</td><td class="n">${pct(d, s.tareas.length)}%</td><td class="n">${l || '–'}</td><td class="n">${s.entregas.length}</td><td class="n">${s.fotos == null ? '–' : s.fotos}</td></tr>`;
  }).join('');
  const sedeFoot = `<tr><td>Total</td><td class="n">${creators.length}</td><td class="n">${done}/${all.length}</td><td class="n">${pct(done, all.length)}%</td><td class="n">${lateN || '–'}</td><td class="n">${files.length}</td><td class="n">${sedes.some((s) => s.fotos != null) ? galPhotos : '–'}</td></tr>`;

  const crRows = creators.map(({ c, s }) => {
    const mine = s.tareas.filter((t) => t.creador_id === c.id), d = mine.filter((t) => t.done).length, l = mine.filter(late).length;
    const f = s.entregas.filter((e) => e.creador_id === c.id), fi = f.filter((e) => /^image\//.test(e.mime)).length, fv = f.filter((e) => /^video\//.test(e.mime)).length;
    return `<tr><td><b>${esc(c.name)}</b></td><td>${esc(s.name)}</td><td class="n">${d}/${mine.length}</td><td class="n">${l || '–'}</td><td class="n">${f.length}</td><td class="n">${fi}</td><td class="n">${fv}</td><td class="n">${fmtBytes(f.reduce((n, e) => n + e.size, 0))}</td></tr>`;
  }).join('');

  const detail = sedes.map((s) => {
    const rows = s.tareas.map((t) => {
      const k = kinds[t.kind] || { label: t.kind, color: '#999' }, c = s.creadores.find((x) => x.id === t.creador_id);
      const st = t.done ? `<span class="st ok">Hecha</span>` : t.retry ? `<span class="st retry">A repetir</span>` : late(t) ? `<span class="st late">Con retraso</span>` : `<span class="st">Pendiente</span>`;
      const n = s.entregas.filter((e) => e.tarea_id === t.id).length;
      return `<tr><td>${fmtDate(t.date)}${t.time ? ' · ' + esc(t.time) : ''}</td><td><span class="kind" style="--c:${k.color}"><i></i>${esc(k.label)}</span></td><td>${esc(t.title)}</td><td>${c ? esc(c.name) : 'Toda la sede'}</td><td>${st}</td><td class="n">${n || '–'}</td></tr>`;
    }).join('');
    return `<section class="sede"><h2>${esc(s.name)}<small>${plural(s.tareas.length, 'tarea', 'tareas')} · ${plural(s.entregas.length, 'archivo entregado', 'archivos entregados')}${s.fotos != null ? ' · ' + plural(s.fotos, 'foto publicada', 'fotos publicadas') : ''}</small></h2>
${s.tareas.length ? `<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Tarea</th><th>Asignada a</th><th>Estado</th><th class="n">Archivos</th></tr></thead><tbody>${rows}</tbody></table>` : '<p style="color:var(--mut)">Sin tareas.</p>'}</section>`;
  }).join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Informe · ${esc(torneo.name)}</title><link rel="icon" href="/pwa/favicon.png"><style>${CSS}</style></head>
<body style="--tc:${esc(torneo.color || '#edb265')}"><div class="bar"><a href="/torneo/${esc(torneo.id)}">Volver al torneo</a><button type="button" id="printBtn">Descargar PDF</button></div>
<main class="sheet">
<header class="head"><div><div class="brand"><i></i>Picfy</div><h1>${esc(torneo.name)}</h1><p>Informe del torneo${range ? ' · ' + esc(range) : ''}</p>${torneo.description ? `<p style="margin-top:6px">${esc(torneo.description)}</p>` : ''}</div><div class="meta">Preparado por ${esc(user.name || user.email)}<br>${esc(now)}</div></header>
<div class="prog"><u style="width:${pct(done, all.length)}%"></u></div>
<div class="kpis">${kpi(`${done}<small style="font-size:14px;color:var(--mut)">/${all.length}</small>`, `Tareas cumplidas (${pct(done, all.length)}%)`)}${kpi(lateN, 'Tareas con retraso', lateN ? 'bad' : '')}${kpi(files.length, `${files.length === 1 ? 'Archivo entregado' : 'Archivos entregados'} · ${plural(img, 'foto', 'fotos')}, ${plural(vid, 'vídeo', 'vídeos')}`)}${kpi(sedes.some((s) => s.fotos != null) ? galPhotos : '–', 'Fotos publicadas en galerías')}${kpi(sedes.length, sedes.length === 1 ? 'Sede' : 'Sedes')}${kpi(creators.length, creators.length === 1 ? 'Creador' : 'Creadores')}${kpi(all.length, 'Tareas planificadas')}${kpi(fmtBytes(bytes), 'Material entregado')}</div>
<h2>Resumen por sede</h2>
<table><thead><tr><th>Sede</th><th class="n">Creadores</th><th class="n">Tareas</th><th class="n">Cumplido</th><th class="n">Retraso</th><th class="n">Entregas</th><th class="n">Fotos publicadas</th></tr></thead><tbody>${sedeRows}</tbody><tfoot>${sedeFoot}</tfoot></table>
${creators.length ? `<h2>Resumen por creador</h2><table><thead><tr><th>Creador</th><th>Sede</th><th class="n">Tareas</th><th class="n">Retraso</th><th class="n">Entregas</th><th class="n">Fotos</th><th class="n">Vídeos</th><th class="n">Peso</th></tr></thead><tbody>${crRows}</tbody></table>` : ''}
${detail}
<footer class="foot"><span>Informe generado con Picfy · picfy.es</span><span>${esc(now)}</span></footer>
</main><script src="/informe.js" defer></script></body></html>`;
}
