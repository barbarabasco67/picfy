// Colecciones: abrir diálogos y copiar el enlace.
(function () {
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => { const d = $(b.dataset.open); if (d) { d.showModal(); const i = d.querySelector('input[type=text]'); if (i) i.focus(); } }));
  const cp = $('copyCol');
  if (cp) cp.addEventListener('click', async () => {
    const t = $('colLink').textContent.trim();
    try { await navigator.clipboard.writeText(t); }
    catch { const r = document.createRange(); r.selectNodeContents($('colLink')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); }
    const old = cp.textContent; cp.textContent = '¡Copiado!'; setTimeout(() => { cp.textContent = old; }, 1600);
  });
  // Portada de la colección: se elige entre las fotos ya subidas
  const open = $('colCoverOpen'), dlg = $('colCoverDlg'), grid = $('colCoverGrid'), cd = $('colCoverDel');
  const say = (t) => { const m = document.createElement('div'); m.className = 'toast'; m.textContent = t; document.body.append(m); setTimeout(() => m.remove(), 2200); };
  if (open) open.addEventListener('click', async () => {
    dlg.showModal(); grid.textContent = '';
    try {
      const r = await (await fetch(`/api/col/${open.dataset.col}/photos`)).json();
      if (!r.ids || !r.ids.length) { grid.innerHTML = '<p class="muted">Aún no hay fotos en las galerías de esta colección.</p>'; return; }
      grid.innerHTML = r.ids.map((id) => `<button type="button" class="covpick" data-id="${id}"><img src="/m/${id}/m" alt="" loading="lazy"></button>`).join('');
    } catch { grid.innerHTML = '<p class="muted">No se pudieron cargar las fotos.</p>'; }
  });
  if (grid) grid.addEventListener('click', async (e) => {
    const b = e.target.closest('.covpick'); if (!b) return;
    try {
      const r = await fetch(`/api/col/${open.dataset.col}/cover-from`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: b.dataset.id }) });
      if (!r.ok) throw new Error(r.status);
      dlg.close(); say('Portada guardada'); if (cd) cd.hidden = false;
    } catch { say('No se pudo guardar la portada.'); }
  });
  if (cd) cd.addEventListener('click', async () => { await fetch(`/api/col/${cd.dataset.col}/cover`, { method: 'DELETE' }); cd.hidden = true; dlg.close(); say('Portada quitada'); });
})();
