// Galería pública, solo para su dueña/o: arrastrar fotos y vídeos para cambiar el orden.
(function () {
  const api = document.body.dataset.sortapi;
  const grid = document.getElementById('gallery');
  if (!api || !grid) return;
  const items = () => [...grid.querySelectorAll('.gitem')];
  let st = null;
  const THRESH = 6;
  const toast = (t) => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 2200); };
  const clear = () => grid.querySelectorAll('.drop-before,.drop-after').forEach((n) => n.classList.remove('drop-before', 'drop-after'));

  grid.addEventListener('dragstart', (e) => e.preventDefault());
  grid.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button, .dlbtn, .lk, input, label')) return;
    const it = e.target.closest('.gitem'); if (!it) return;
    st = { it, x0: e.clientX, y0: e.clientY, touch: e.pointerType === 'touch', active: false, timer: null };
    if (st.touch) st.timer = setTimeout(() => { if (st && !st.active) start(); }, 320);
  });
  function start() {
    st.active = true;
    const on = (f) => { const b = f.querySelector('.selpick'); return b && b.classList.contains('on'); };
    st.group = on(st.it) ? items().filter(on) : [st.it];
    st.group.forEach((f) => f.classList.add('dragging'));
    const g = document.createElement('div'); g.className = 'ghost';
    const im = st.it.querySelector('img'); if (im) g.append(im.cloneNode());
    if (st.group.length > 1) { const n = document.createElement('b'); n.textContent = st.group.length; g.append(n); }
    document.body.append(g); st.ghost = g; document.body.classList.add('no-select');
  }
  document.addEventListener('pointermove', (e) => {
    if (!st) return;
    if (!st.active) {
      const moved = Math.hypot(e.clientX - st.x0, e.clientY - st.y0);
      if (st.touch) { if (moved > 10) { clearTimeout(st.timer); st = null; } return; }
      if (moved < THRESH) return;
      start();
    }
    st.ghost.style.left = e.clientX + 'px'; st.ghost.style.top = e.clientY + 'px';
    const y = e.clientY;
    if (y < 70) window.scrollBy(0, -Math.ceil((70 - y) / 4)); else if (y > innerHeight - 70) window.scrollBy(0, Math.ceil((y - (innerHeight - 70)) / 4));
    clear();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const over = el && el.closest ? el.closest('.gitem') : null;
    if (over && !st.group.includes(over) && grid.contains(over)) {
      const r = over.getBoundingClientRect();
      st.target = over; st.after = e.clientY > r.top + r.height / 2;
      over.classList.add(st.after ? 'drop-after' : 'drop-before');
    } else st.target = null;
  });
  document.addEventListener('touchmove', (e) => { if (st && st.active) e.preventDefault(); }, { passive: false });
  async function finish(cancel) {
    if (!st) return;
    const s = st; st = null; clearTimeout(s.timer);
    document.body.classList.remove('no-select');
    if (!s.active) return;
    s.ghost.remove(); clear(); s.group.forEach((f) => f.classList.remove('dragging'));
    grid.dataset.justdragged = '1'; setTimeout(() => delete grid.dataset.justdragged, 400);
    if (cancel || !s.target) return;
    if (s.after) { const ref = s.target.nextSibling; s.group.forEach((f) => grid.insertBefore(f, ref)); } else s.group.forEach((f) => grid.insertBefore(f, s.target));
    const ids = items().map((n) => (n.querySelector('.tile') || {}).dataset ? n.querySelector('.tile').dataset.id : '').filter(Boolean);
    try {
      const r = await fetch(api + '/reorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids }) });
      if (!r.ok) throw new Error('x'); toast('Orden guardado');
    } catch { toast('No se pudo guardar el orden. Recarga la página.'); }
  }
  document.addEventListener('pointerup', () => finish(false));
  document.addEventListener('pointercancel', () => finish(true));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(true); });
  // Tras arrastrar no se abre el visor.
  document.addEventListener('click', (e) => { if (grid.dataset.justdragged && grid.contains(e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);
})();
