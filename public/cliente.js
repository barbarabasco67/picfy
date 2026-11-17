// Página de un cliente: ajustes (color, letra, redes) y seguimiento de métricas.
(function () {
  const $ = (id) => document.getElementById(id);
  const cid = document.body.dataset.client;
  if (!cid) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const send = (method, path, body) => fetch(path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'http'); return d; });
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 3000); }

  /* Ajustes */
  const cs = $('csForm');
  if (cs) {
    const F = {
      bind(f) { f.querySelectorAll('[data-sw]').forEach((b) => b.addEventListener('click', () => { f.color.value = b.dataset.sw; f.querySelectorAll('[data-sw]').forEach((x) => x.classList.toggle('on', x === b)); })); f.color.addEventListener('input', () => f.querySelectorAll('[data-sw]').forEach((x) => x.classList.remove('on'))); },
      read(f) { const networks = {}; f.querySelectorAll('[data-net]').forEach((i) => { (networks[i.dataset.net] = networks[i.dataset.net] || {})[i.dataset.f] = i.value; }); return { name: f.name.value, color: f.color.value, font: (f.querySelector('[name=font]:checked') || {}).value || 'sans', networks, notes: f.notes.value }; },
    };
    F.bind(cs);
    cs.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await send('PUT', '/api/redes/' + cid, F.read(cs)); location.href = '/redes/' + cid + '?t=ajustes'; } catch { toast('No se pudo guardar.'); }
    });
    $('csDel').addEventListener('click', async () => {
      if (!confirm('¿Borrar este cliente? Sus tareas y publicaciones se quedan en la agenda general, sin cliente.')) return;
      try { await send('DELETE', '/api/redes/' + cid); location.href = '/redes'; } catch { toast('No se pudo borrar.'); }
    });
  }

  /* Seguimiento */
  const board = $('mtBoard');
  if (!board) return;
  let NETS, metrics;
  try { NETS = JSON.parse(document.body.dataset.nets); metrics = JSON.parse(document.body.dataset.metrics); } catch { return; }
  const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('es-ES'));
  const fdate = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y.slice(2)}`; };
  const KEYS = [['followers', 'Seguidores'], ['posts', 'Publicaciones'], ['reach', 'Alcance'], ['interactions', 'Interacciones']];

  function spark(rows, color) {
    const pts = rows.filter((r) => r.followers != null);
    if (pts.length < 2) return '<p class="muted small">Anota al menos dos fechas para ver la evolución.</p>';
    const W = 320, H = 90, P = 6;
    const vals = pts.map((r) => r.followers), min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
    const x = (i) => P + (i * (W - 2 * P)) / (pts.length - 1), y = (v) => H - P - ((v - min) * (H - 2 * P)) / span;
    const d = pts.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r.followers).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evolución de seguidores"><path d="${d} L${x(pts.length - 1)} ${H - P} L${x(0)} ${H - P} Z" fill="${color}" opacity=".12"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function render() {
    const used = Object.keys(NETS).filter((k) => metrics.some((m) => m.network === k));
    if (!used.length) { board.innerHTML = '<div class="glass emptybox">Aún no hay datos. Pulsa «Anotar datos» y apunta los seguidores y el alcance de cada red cuando los revises.</div>'; return; }
    board.innerHTML = used.map((k) => {
      const rows = metrics.filter((m) => m.network === k).sort((a, b) => a.date.localeCompare(b.date));
      const last = rows[rows.length - 1], prev = rows[rows.length - 2];
      const delta = (key) => { if (!prev || last[key] == null || prev[key] == null) return ''; const d = last[key] - prev[key]; return `<em class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : ''}${fmt(d)}</em>`; };
      const stats = KEYS.map(([key, label]) => `<div class="mtst"><span>${label}</span><b>${fmt(last[key])}</b>${delta(key)}</div>`).join('');
      const hist = rows.slice().reverse().slice(0, 8).map((r) => `<tr><td>${fdate(r.date)}</td><td>${fmt(r.followers)}</td><td>${fmt(r.posts)}</td><td>${fmt(r.reach)}</td><td>${fmt(r.interactions)}</td><td class="mtnote">${esc(r.note || '')}</td><td><button type="button" class="iconbtn" data-del="${r.id}" aria-label="Borrar">×</button></td></tr>`).join('');
      return `<section class="glass mtcard" style="--c:${NETS[k].color}"><header><h3>${esc(NETS[k].label)}</h3><span class="muted small">Último dato: ${fdate(last.date)}</span></header>
<div class="mtstats">${stats}</div>${spark(rows, NETS[k].color)}
<details class="mthist"><summary>Historial</summary><table><thead><tr><th>Fecha</th><th>Seguid.</th><th>Public.</th><th>Alcance</th><th>Interac.</th><th></th><th></th></tr></thead><tbody>${hist}</tbody></table></details></section>`;
    }).join('');
  }
  render();

  const dlg = $('mtDlg'), form = $('mtForm');
  $('mtAdd').addEventListener('click', () => { form.date.value = new Date().toISOString().slice(0, 10); dlg.showModal(); form.followers.focus(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = { network: form.network.value, date: form.date.value, followers: form.followers.value, posts: form.posts.value, reach: form.reach.value, interactions: form.interactions.value, note: form.note.value };
    try { const d = await send('POST', '/api/redes/' + cid + '/metrics', b); metrics.push(d.metric); form.reset(); dlg.close(); render(); toast('Guardado'); }
    catch (err) { toast(err.message === 'empty' ? 'Rellena al menos un dato.' : 'No se pudo guardar.'); }
  });
  board.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    if (!confirm('¿Borrar este dato?')) return;
    try { await send('DELETE', '/api/redes/' + cid + '/metrics/' + b.dataset.del); metrics = metrics.filter((m) => m.id !== b.dataset.del); render(); } catch { toast('No se pudo borrar.'); }
  });
})();
