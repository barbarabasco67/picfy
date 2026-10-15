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
})();
