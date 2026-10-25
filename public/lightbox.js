// Visor de fotos a pantalla completa. Uso: picfyLightbox.open(['url1', 'url2', ...], indice)
(function () {
  const lb = document.getElementById('lb');
  if (!lb) return;
  const img = lb.querySelector('img');
  let list = [], i = 0;

  let from = null;
  document.addEventListener('click', (e) => { from = e.target.closest ? e.target.closest('.tile, .gcard img, .ph') : null; }, true);
  function flip() {
    const t = from && from.isConnected ? (from.matches('img') ? from : from.querySelector('img') || from) : null;
    if (!t) { lb.style.removeProperty('--tx'); return false; }
    const r = t.getBoundingClientRect(); if (!r.width) return false;
    lb.style.setProperty('--tx', (r.left + r.width / 2 - innerWidth / 2) + 'px'); lb.style.setProperty('--ty', (r.top + r.height / 2 - innerHeight / 2) + 'px');
    lb.style.setProperty('--ts', Math.max(.08, Math.min(.9, r.width / Math.min(innerWidth * .9, 900))).toFixed(3));
    return true;
  }
  function show(dir) { const wasOpen = lb.classList.contains('open'); img.classList.remove('nx', 'pv', 'from'); void img.offsetWidth; if (dir) img.classList.add(dir > 0 ? 'nx' : 'pv'); else if (!wasOpen && flip()) img.classList.add('from'); img.src = list[i]; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); lb.dispatchEvent(new CustomEvent('lbshow', { detail: { i } })); }
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function close() {
    if (!lb.classList.contains('open') || lb.classList.contains('closing')) return;
    const done = () => { lb.classList.remove('open', 'closing'); img.removeAttribute('src'); };
    lb.setAttribute('aria-hidden', 'true'); lb.dispatchEvent(new Event('lbhide'));
    if (rm) done(); else { lb.classList.add('closing'); setTimeout(done, 190); }
  }
  function step(d) { if (!list.length) return; i = (i + d + list.length) % list.length; show(d); }

  lb.querySelector('.x').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  lb.querySelector('.next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.target.closest && e.target.closest('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'Escape') { const pn = document.getElementById('lbPanel'); if (pn && !pn.classList.contains('hidden')) { document.getElementById('lbPanelX').click(); return; } close(); }
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { if (e.target.closest('.lbsoc')) { x0 = null; return; } x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });

  window.picfyLightbox = { open(urls, index) { list = urls; i = index || 0; show(); } };

  // Galería pública: los enlaces .tile con data-full abren el visor.
  const gal = document.getElementById('gallery');
  if (gal) {
    gal.addEventListener('click', (e) => {
      const a = e.target.closest('a.tile');
      if (!a) return;
      e.preventDefault();
      const tiles = [...gal.querySelectorAll('a.tile')];
      window.picfyLightbox.open(tiles.map((t) => t.dataset.full), tiles.indexOf(a));
    });
  }
})();
