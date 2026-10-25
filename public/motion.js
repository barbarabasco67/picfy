// Pequeños efectos de la app: escalonado de tarjetas, onda al pulsar botones y bienvenida al entrar.
(() => {
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Escalonado: cada hijo de una rejilla recibe su posición (--i).
  const GRIDS = '.gcards, .grid, .tgrid, .tcards, .plans-grid, .pgrid';
  const index = (root) => root.querySelectorAll ? root.querySelectorAll(GRIDS).forEach((g) => { let n = 0; for (const el of g.children) if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', n++); }) : 0;
  index(document);
  if (!rm) new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    const g = n.parentElement && n.parentElement.matches && n.parentElement.matches(GRIDS) ? n.parentElement : null;
    if (g) n.style.setProperty('--i', Math.min(g.children.length - 1, 8));
  }))).observe(document.body, { childList: true, subtree: true });

  // Onda al pulsar un botón.
  document.addEventListener('pointerdown', (e) => {
    if (rm || e.button) return;
    const b = e.target.closest && e.target.closest('.btn');
    if (!b || b.disabled) return;
    b.classList.add('rip');
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span'); s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 600);
  }, { passive: true });

  // Corazón de "me gusta" con un pequeño rebote.
  document.addEventListener('click', (e) => { const l = e.target.closest && e.target.closest('#lbLike'); if (!l || rm) return; l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop'); setTimeout(() => l.classList.remove('pop'), 450); });

  // Bienvenida: enfoque de cámara, flash y obturador que se abre. Una vez por visita, al llegar al panel.
  const hi = document.documentElement;
  try {
    if (!rm && location.pathname === '/inicio' && !sessionStorage.getItem('picfy_hi')) {
      sessionStorage.setItem('picfy_hi', '1');
      const s = document.createElement('div'); s.className = 'splash'; s.setAttribute('aria-hidden', 'true');
      s.innerHTML = '<div class="cur ct"></div><div class="cur cb"></div><div class="mid"><div class="vf"><i></i><i></i><i></i><i></i></div><div class="mark"></div></div><div class="flash"></div>';
      document.body.appendChild(s);
      setTimeout(() => { s.remove(); hi.classList.remove('hi'); }, 2500);
    } else hi.classList.remove('hi');
  } catch { hi.classList.remove('hi'); }

  // Los números suben de 0 hasta su valor.
  if (!rm) document.querySelectorAll('.dstatgrid b, .dkpis b, .kpis dd, .prof-stats b, .tstats b, .stats dd').forEach((el) => {
    const t = el.textContent.trim(); if (!/^\d{1,7}$/.test(t)) return;
    const to = +t, t0 = performance.now() + (hi.classList.contains('hi') ? 2000 : 250), dur = 1100;
    el.textContent = '0';
    const tick = (now) => { const p = Math.min(1, Math.max(0, (now - t0) / dur)); el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });

  // Al hacer scroll, lo que queda por debajo aparece al llegar.
  if (!rm && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    let k = 0;
    document.querySelectorAll('.gcard-wrap, .tile.ph, .tcard, .dcard, body.app .card').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight) return;
      el.style.setProperty('--d', String((k++) % 6)); el.classList.add('rv'); io.observe(el);
    });
  }
})();
