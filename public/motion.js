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

  // Bienvenida: una vez por visita, al llegar al panel.
  try {
    if (!rm && location.pathname === '/inicio' && !sessionStorage.getItem('picfy_hi')) {
      sessionStorage.setItem('picfy_hi', '1');
      const s = document.createElement('div'); s.className = 'splash'; s.setAttribute('aria-hidden', 'true');
      s.innerHTML = '<span><i></i><b>Picfy</b></span>'; document.body.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
  } catch { /* sin almacenamiento: sin bienvenida */ }
})();
