// Menú lateral: se pliega a iconos para dar más sitio. Empieza abierto en todas las páginas y recuerda la elección.
(() => {
  const more = document.getElementById('tabMore'), sheet = document.getElementById('moreSheet');
  if (more && sheet) {
    const close = () => { sheet.hidden = true; more.setAttribute('aria-expanded', 'false'); };
    more.addEventListener('click', (e) => { e.stopPropagation(); sheet.hidden = !sheet.hidden; more.setAttribute('aria-expanded', String(!sheet.hidden)); });
    document.addEventListener('click', (e) => { if (!sheet.hidden && !sheet.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
})();
(() => {
  const side = document.querySelector('.frame > .side'), btn = document.getElementById('navToggle'); if (!side || !btn) return;
  const frame = side.parentElement, key = 'picfy_nav';
  const set = (open) => {
    side.classList.toggle('collapsed', !open); frame.classList.toggle('nav-collapsed', !open); btn.setAttribute('aria-expanded', String(open));
    try { localStorage.setItem(key, open ? 'open' : 'closed'); } catch (e) {}
  };
  let saved = null; try { saved = localStorage.getItem(key); } catch (e) {}
  set(saved !== 'closed');
  btn.addEventListener('click', () => set(side.classList.contains('collapsed')));
})();
