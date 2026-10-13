// Cuadrícula de fotos que se puede ordenar: arrastrar y soltar (ratón y táctil), selección múltiple con casillas
// o estirando el ratón, y borrado en bloque. Se usa en "Mi álbum" y en el panel del organizador.
(function () {
  const $ = (id) => document.getElementById(id);

  function toast(text) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
    document.body.append(t); setTimeout(() => t.remove(), 2200);
  }

  async function post(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('http' + r.status);
    return r.json();
  }

  /**
   * opts:
   *   grid        elemento contenedor de .tile
   *   onReorder   async (idsEnOrdenDom) => void
   *   onDelete    async (ids) => void   (si no se indica, no hay borrado)
   *   onChange    () => void            (cambia la selección o el número de fotos)
   */
  function init(opts) {
    const grid = opts.grid;
    const picked = new Set();
    const tiles = () => [...grid.querySelectorAll('.tile')];
    const idOf = (t) => t.dataset.id;

    function refresh() {
      tiles().forEach((t) => {
        const on = picked.has(idOf(t));
        t.classList.toggle('picked', on);
        const c = t.querySelector('.chk'); if (c) c.checked = on;
      });
      if (opts.onChange) opts.onChange(picked.size, tiles().length);
    }
    function setPicked(ids) { picked.clear(); ids.forEach((i) => picked.add(i)); refresh(); }

    grid.addEventListener('change', (e) => {
      const t = e.target.closest('.tile');
      if (!t || !e.target.classList.contains('chk')) return;
      if (e.target.checked) picked.add(idOf(t)); else picked.delete(idOf(t));
      refresh();
    });
    grid.addEventListener('dragstart', (e) => e.preventDefault());

    async function removeIds(ids) {
      if (!ids.length || !opts.onDelete) return;
      try {
        await opts.onDelete(ids);
        ids.forEach((id) => { picked.delete(id); const t = grid.querySelector(`.tile[data-id="${id}"]`); if (t) t.remove(); });
        refresh();
        toast(ids.length === 1 ? 'Foto borrada' : `${ids.length} fotos borradas`);
      } catch { toast('No se pudo borrar. Inténtalo de nuevo.'); }
    }

    grid.addEventListener('click', (e) => {
      const tr = e.target.closest('.trash');
      if (tr) {
        e.preventDefault(); e.stopPropagation();
        const t = tr.closest('.tile');
        if (confirm('¿Borrar esta foto? No se puede deshacer.')) removeIds([idOf(t)]);
      }
    });

    /* ----- arrastrar y soltar + clic para ampliar + selección con rectángulo ----- */

    let st = null; // estado del gesto actual
    const THRESH = 6;

    function tileAt(x, y) {
      const el = document.elementFromPoint(x, y);
      return el && el.closest ? el.closest('.tile') : null;
    }
    function clearMarks() { grid.querySelectorAll('.drop-before,.drop-after').forEach((n) => n.classList.remove('drop-before', 'drop-after')); }

    grid.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.chk, .trash, button, a.keep')) return;
      const tile = e.target.closest('.tile');
      if (!tile) return;
      st = { kind: 'tile', tile, x0: e.clientX, y0: e.clientY, touch: e.pointerType === 'touch', active: false, id: e.pointerId, timer: null };
      if (st.touch) st.timer = setTimeout(() => { if (st && !st.active) startDrag(st.x0, st.y0); }, 320);
    });

    // Rectángulo (solo ratón): se empieza en cualquier hueco fuera de las fotos.
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || (e.button !== undefined && e.button !== 0)) return;
      if (e.target.closest('.tile, button, a, input, select, textarea, label, dialog, .lb, .toast')) return;
      if (!e.target.closest('main')) return;
      st = { kind: 'marquee', x0: e.clientX, y0: e.clientY, sy: window.scrollY, active: false, base: new Set(e.ctrlKey || e.metaKey || e.shiftKey ? picked : []), box: null };
    });

    function startDrag(x, y) {
      const t = st.tile;
      const ids = picked.has(idOf(t)) ? tiles().filter((n) => picked.has(idOf(n))) : [t];
      st.active = true; st.group = ids;
      ids.forEach((n) => n.classList.add('dragging'));
      const g = document.createElement('div'); g.className = 'ghost';
      const im = t.querySelector('img'); if (im) g.append(im.cloneNode());
      if (ids.length > 1) { const b = document.createElement('b'); b.textContent = ids.length; g.append(b); }
      document.body.append(g); st.ghost = g;
      document.body.classList.add('no-select');
      moveGhost(x, y);
    }
    function moveGhost(x, y) { st.ghost.style.left = x + 'px'; st.ghost.style.top = y + 'px'; }

    function autoScroll(y) {
      const edge = 70;
      if (y < edge) window.scrollBy(0, -Math.ceil((edge - y) / 4));
      else if (y > window.innerHeight - edge) window.scrollBy(0, Math.ceil((y - (window.innerHeight - edge)) / 4));
    }

    function startMarquee() {
      st.active = true;
      st.box = document.createElement('div'); st.box.className = 'marquee'; document.body.append(st.box);
      document.body.classList.add('no-select');
    }
    function updateMarquee(x, y) {
      // coordenadas respecto al documento, para que siga bien aunque se desplace la página
      const y0 = st.y0 + st.sy - window.scrollY; // el punto de partida se desplaza con la página
      const x1 = Math.min(st.x0, x), x2 = Math.max(st.x0, x);
      const y1 = Math.min(y0, y), y2 = Math.max(y0, y);
      Object.assign(st.box.style, { left: x1 + 'px', top: y1 + 'px', width: x2 - x1 + 'px', height: y2 - y1 + 'px' });
      const hit = new Set(st.base);
      tiles().forEach((t) => {
        const r = t.getBoundingClientRect();
        if (r.right > x1 && r.left < x2 && r.bottom > y1 && r.top < y2) hit.add(idOf(t));
      });
      setPicked([...hit]);
    }

    let lastX = 0, lastY = 0, raf = 0;
    function loop() {
      raf = 0;
      if (!st || !st.active) return;
      autoScroll(lastY);
      if (st.kind === 'marquee') updateMarquee(lastX, lastY);
      raf = requestAnimationFrame(loop);
    }

    document.addEventListener('pointermove', (e) => {
      if (!st) return;
      lastX = e.clientX; lastY = e.clientY;
      const moved = Math.hypot(e.clientX - st.x0, e.clientY - st.y0);
      if (!st.active) {
        if (st.kind === 'tile' && st.touch) { if (moved > 10) { clearTimeout(st.timer); st = null; } return; }
        if (moved < THRESH) return;
        if (st.kind === 'tile') startDrag(e.clientX, e.clientY);
        else startMarquee();
        if (!raf) raf = requestAnimationFrame(loop);
      }
      if (st.kind === 'tile') {
        moveGhost(e.clientX, e.clientY);
        clearMarks();
        const over = tileAt(e.clientX, e.clientY);
        if (over && !st.group.includes(over)) {
          const r = over.getBoundingClientRect();
          st.target = over; st.after = e.clientX > r.left + r.width / 2;
          over.classList.add(st.after ? 'drop-after' : 'drop-before');
        } else st.target = null;
      } else updateMarquee(e.clientX, e.clientY);
    });

    // En táctil, una vez empezado el arrastre se bloquea el desplazamiento de la página.
    document.addEventListener('touchmove', (e) => { if (st && st.active && st.kind === 'tile') e.preventDefault(); }, { passive: false });

    async function finish(cancel) {
      if (!st) return;
      const s = st; st = null;
      clearTimeout(s.timer);
      document.body.classList.remove('no-select');
      if (s.kind === 'marquee') { if (s.box) s.box.remove(); return; }
      if (!s.active) {
        if (!cancel) {
          const all = tiles().filter((t) => t.offsetParent !== null);
          if (window.picfyLightbox) window.picfyLightbox.open(all.map((t) => t.dataset.full), all.indexOf(s.tile));
        }
        return;
      }
      s.ghost.remove(); clearMarks();
      s.group.forEach((n) => n.classList.remove('dragging'));
      if (cancel || !s.target) return;
      const group = s.group; // ya en orden DOM
      if (s.after) { let ref = s.target.nextSibling; group.forEach((n) => grid.insertBefore(n, ref)); }
      else group.forEach((n) => grid.insertBefore(n, s.target));
      try { await opts.onReorder(tiles().map(idOf)); toast('Orden guardado'); }
      catch { toast('No se pudo guardar el orden. Recarga la página.'); }
    }
    document.addEventListener('pointerup', () => finish(false));
    document.addEventListener('pointercancel', () => finish(true));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') finish(true); });

    return {
      pickAll() { const all = tiles().map(idOf); setPicked(picked.size === all.length ? [] : all); },
      clear() { setPicked([]); },
      picked: () => [...picked],
      removeIds,
      refresh,
    };
  }

  window.PicfySort = { init, toast, post };

  /* ----- Mi álbum ----- */
  const api = document.body.dataset.api;
  const grid = $('sortGrid');
  if (api && grid) {
    const delBtn = $('delPicked'), nEl = $('pickedN'), countEl = $('mineCount');
    const sort = init({
      grid,
      onReorder: (ids) => post(api + '/reorder', { ids }),
      onDelete: (ids) => post(api + '/delete', { ids }),
      onChange: (n, total) => {
        delBtn.classList.toggle('hidden', n === 0);
        nEl.textContent = n ? `(${n})` : '';
        countEl.textContent = total + (total === 1 ? ' foto' : ' fotos');
      },
    });
    $('pickAll').addEventListener('click', () => sort.pickAll());
    delBtn.addEventListener('click', () => {
      const ids = sort.picked();
      if (ids.length && confirm(`¿Borrar ${ids.length} fotos? No se puede deshacer.`)) sort.removeIds(ids);
    });
    const size = $('size');
    const apply = () => grid.style.setProperty('--tile', size.value + 'px');
    size.addEventListener('input', apply); apply();
  }
})();
