// Galería del dueño: selección, orden, banderas, favoritas, filtros, mover, descargar y borrar.
(function () {
  const $ = (id) => document.getElementById(id);
  const api = document.body.dataset.gapi;
  const gid = document.body.dataset.gid;
  const partSize = Number(document.body.dataset.part) || 40;
  const grid = $('sortGrid');
  if (!api) return;
  const { init, toast, post } = window.PicfySort;

  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => $(b.dataset.open).showModal()));

  const FLAGS = ['', 'red', 'orange', 'green', 'black'];
  const tile = (id) => grid.querySelector(`.tile[data-id="${id}"]`);
  const err = () => toast('No se pudo completar la acción. Inténtalo de nuevo.');

  const approveAll = $('approveAll');
  if (approveAll) approveAll.addEventListener('click', async () => {
    try { await post(api + '/state', { action: 'approve', all: true }); location.reload(); } catch { err(); }
  });

  $('sortBy').addEventListener('change', async (e) => {
    if (e.target.value === 'manual') return;
    try { await post(api + '/sort', { mode: e.target.value }); location.reload(); } catch { err(); }
  });

  if (!grid) return;
  const bar = $('selbar'), selN = $('selN'), shown = $('shown');

  /* ----- filtros ----- */
  const fName = $('fName'), fState = $('fState'), fFav = $('fFav');
  const activeFlags = new Set();
  function applyFilter() {
    const q = fName.value.trim().toLowerCase(), st = fState.value, fav = fFav.classList.contains('on');
    let n = 0;
    grid.querySelectorAll('.tile').forEach((t) => {
      const ok = (!q || t.dataset.name.includes(q)) && (!st || t.dataset.state === st) &&
        (!fav || t.dataset.fav === '1') && (!activeFlags.size || activeFlags.has(t.dataset.flag));
      t.classList.toggle('hidden', !ok); if (ok) n++;
    });
    shown.textContent = n + (n === 1 ? ' foto' : ' fotos');
    $('noMatch2').classList.toggle('hidden', n > 0);
  }
  fName.addEventListener('input', applyFilter);
  fState.addEventListener('change', applyFilter);
  fFav.addEventListener('click', () => { fFav.classList.toggle('on'); applyFilter(); });
  document.querySelectorAll('#fFlags [data-f]').forEach((b) => b.addEventListener('click', () => {
    b.classList.toggle('on'); b.classList.contains('on') ? activeFlags.add(b.dataset.f) : activeFlags.delete(b.dataset.f); applyFilter();
  }));

  /* ----- selección y orden (arrastrar, rectángulo) ----- */
  const sort = init({
    grid,
    onReorder: async (ids) => { await post(api + '/reorder', { ids }); const s = $('sortBy'); if (!s.querySelector('[value=manual]')) s.add(new Option('Orden manual', 'manual')); s.value = 'manual'; },
    onDelete: (ids) => post(api + '/delete', { ids }),
    onChange: (n, total) => { bar.classList.toggle('hidden', n === 0); selN.textContent = n + (n === 1 ? ' seleccionada' : ' seleccionadas'); },
  });
  $('pickAll').addEventListener('click', () => sort.pickAll());

  /* ----- marcas ----- */
  function paint(t) {
    t.querySelector('.favb').classList.toggle('on', t.dataset.fav === '1');
    const f = t.querySelector('.flagb');
    FLAGS.forEach((x) => x && f.classList.toggle(x, t.dataset.flag === x));
    f.classList.toggle('set', !!t.dataset.flag);
  }
  grid.querySelectorAll('.tile').forEach(paint);

  grid.addEventListener('click', async (e) => {
    const b = e.target.closest('.mk'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const t = b.closest('.tile'), id = t.dataset.id;
    try {
      if (b.dataset.mk === 'fav') { const v = t.dataset.fav === '1' ? 0 : 1; await post(api + '/mark', { ids: [id], fav: v }); t.dataset.fav = String(v); }
      else { const next = FLAGS[(FLAGS.indexOf(t.dataset.flag) + 1) % FLAGS.length]; await post(api + '/mark', { ids: [id], flag: next || null }); t.dataset.flag = next; }
      paint(t); applyFilter();
    } catch { err(); }
  });

  async function setFlag(ids, flag) {
    await post(api + '/mark', { ids, flag: flag || null });
    ids.forEach((i) => { const t = tile(i); if (t) { t.dataset.flag = flag; paint(t); } });
    applyFilter();
  }
  const fm = $('flagMenu');
  $('flagMenuBtn').addEventListener('click', (e) => { e.stopPropagation(); fm.classList.toggle('hidden'); });
  document.addEventListener('click', () => fm.classList.add('hidden'));
  fm.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-setflag]'); if (!b) return;
    try { await setFlag(sort.picked(), b.dataset.setflag); } catch { err(); }
  });

  /* ----- acciones de la barra ----- */
  bar.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const ids = sort.picked(); if (!ids.length) return;
    const act = b.dataset.act;
    try {
      if (act === 'clear') sort.clear();
      else if (act === 'delete') { if (confirm(`¿Borrar ${ids.length} ${ids.length === 1 ? 'foto' : 'fotos'}? No se puede deshacer.`)) { await sort.removeIds(ids); applyFilter(); } }
      else if (act === 'approve' || act === 'reject') { await post(api + '/state', { action: act, ids }); location.reload(); }
      else if (act === 'fav') {
        const all = ids.every((i) => tile(i).dataset.fav === '1'); const v = all ? 0 : 1;
        await post(api + '/mark', { ids, fav: v });
        ids.forEach((i) => { const t = tile(i); t.dataset.fav = String(v); paint(t); }); applyFilter();
      } else if (act === 'download') download(ids);
    } catch { err(); }
  });

  function download(ids) {
    if (ids.length === 1) {
      const a = document.createElement('a'); a.href = `/m/${ids[0]}/o?dl=1`; document.body.append(a); a.click(); a.remove(); return;
    }
    const chunks = [];
    for (let i = 0; i < ids.length; i += partSize) chunks.push(ids.slice(i, i + partSize));
    chunks.forEach((c, k) => setTimeout(() => {
      const a = document.createElement('a'); a.href = `/galerias/${gid}/zip?ids=${c.join(',')}`; document.body.append(a); a.click(); a.remove();
    }, k * 900));
    if (chunks.length > 1) toast(`Se descargarán ${chunks.length} partes`);
  }

  const mv = $('moveTo');
  if (mv) mv.addEventListener('change', async () => {
    const ids = sort.picked(), to = mv.value; if (!ids.length || !to) return;
    try {
      await post(api + '/move', { ids, guest_id: to });
      toast(`${ids.length} fotos pasadas al álbum de ${mv.selectedOptions[0].textContent.replace(/\s*\(\d+\)$/, '')}`);
      mv.value = '';
    } catch { err(); }
  });

  const size = $('size');
  const apply = () => grid.style.setProperty('--tile', size.value + 'px');
  size.addEventListener('input', apply); apply();
})();
