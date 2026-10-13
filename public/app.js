// Plataforma Picfy: diálogos, filtro de galerías, copiar enlace y visor.
(function () {
  const $ = (s, r = document) => r.querySelector(s);

  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });

  const nb = $('#newGal'), nd = $('#newDlg');
  if (nb && nd) nb.addEventListener('click', () => { nd.showModal(); const i = nd.querySelector('input[name=name]'); if (i) i.focus(); });

  const sb = $('#openShare'), sd = $('#shareDlg');
  if (sb && sd) sb.addEventListener('click', () => sd.showModal());

  const cp = $('#copyLink');
  if (cp) cp.addEventListener('click', async () => {
    const t = $('#guestLink').textContent.trim();
    try { await navigator.clipboard.writeText(t); }
    catch { const r = document.createRange(); r.selectNodeContents($('#guestLink')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); }
    const old = cp.textContent; cp.textContent = '¡Copiado!'; setTimeout(() => { cp.textContent = old; }, 1600);
  });

  const f = $('#filter');
  if (f) f.addEventListener('input', () => {
    const q = f.value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll('#gcards .gcard').forEach((c) => {
      const ok = !q || c.dataset.name.includes(q);
      c.classList.toggle('hidden', !ok); if (ok) shown++;
    });
    const nm = $('#noMatch'); if (nm) nm.classList.toggle('hidden', shown > 0);
  });

  const grid = $('#pgrid');
  if (grid && window.picfyLightbox) {
    const tiles = [...grid.querySelectorAll('.ptile')];
    const urls = tiles.map((t) => t.dataset.full);
    grid.addEventListener('click', (e) => {
      const t = e.target.closest('.ptile'); if (!t) return;
      e.preventDefault(); window.picfyLightbox.open(urls, tiles.indexOf(t));
    });
  }
})();
