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

  // Bienvenida: un objetivo que se abre, obturador y revelado. Una vez por visita, al llegar al panel.
  const SVG = '<svg viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><mask id="irisM" maskUnits="userSpaceOnUse" x="-1000" y="-1000" width="2000" height="2000"><rect x="-1000" y="-1000" width="2000" height="2000" fill="#fff"/><g class="iris"><polygon points="0.8660,0.5000 0.0000,1.0000 -0.8660,0.5000 -0.8660,-0.5000 -0.0000,-1.0000 0.8660,-0.5000" fill="#000"/></g></mask></defs><rect x="-1000" y="-1000" width="2000" height="2000" fill="#14213d" mask="url(#irisM)"/><g class="iris"><line class="seam" x1="8.660" y1="-4.000" x2="-6.928" y2="5.000"/><line class="seam" x1="7.794" y1="5.500" x2="-7.794" y2="-3.500"/><line class="seam" x1="-0.866" y1="9.500" x2="-0.866" y2="-8.500"/><line class="seam" x1="-8.660" y1="4.000" x2="6.928" y2="-5.000"/><line class="seam" x1="-7.794" y1="-5.500" x2="7.794" y2="3.500"/><line class="seam" x1="0.866" y1="-9.500" x2="0.866" y2="8.500"/></g></svg>';
  const hi = document.documentElement;
  try {
    if (!rm && location.pathname === '/inicio' && !sessionStorage.getItem('picfy_hi')) {
      sessionStorage.setItem('picfy_hi', '1');
      const s = document.createElement('div'); s.className = 'splash'; s.setAttribute('aria-hidden', 'true');
      s.innerHTML = '<div class="sbg"><div class="logo3"><i class="lens"></i><span>Picfy</span></div></div><div class="flash"></div>' + SVG;
      document.body.appendChild(s);
      setTimeout(() => { s.remove(); hi.classList.remove('hi'); }, 2950);
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
