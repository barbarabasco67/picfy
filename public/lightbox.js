// Visor de fotos a pantalla completa. Uso: picfyLightbox.open(['url1', 'url2', ...], indice)
(function () {
  const lb = document.getElementById('lb');
  if (!lb) return;
  const img = lb.querySelector('img');
  let list = [], i = 0;

  function show() { img.src = list[i]; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
  function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); img.removeAttribute('src'); }
  function step(d) { if (!list.length) return; i = (i + d + list.length) % list.length; show(); }

  lb.querySelector('.x').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  lb.querySelector('.next').addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
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
