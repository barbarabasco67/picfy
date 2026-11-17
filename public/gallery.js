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
  const fName = $('fName'), fState = $('fState'), fFav = $('fFav'), fGuest = $('fGuest'), fDay = $('fDay');
  const activeFlags = new Set();
  function applyFilter() {
    const q = fName.value.trim().toLowerCase(), st = fState.value, fav = fFav.classList.contains('on');
    let n = 0;
    grid.querySelectorAll('.tile').forEach((t) => {
      const ok = (!q || t.dataset.name.includes(q)) && (!st || t.dataset.state === st) &&
        (!fav || t.dataset.fav === '1') && (!fGuest || !fGuest.value || t.dataset.guest === fGuest.value) && (!fDay || !fDay.value || t.dataset.day === fDay.value) && (!activeFlags.size || activeFlags.has(t.dataset.flag));
      t.classList.toggle('hidden', !ok); if (ok) n++;
    });
    shown.textContent = n + (n === 1 ? ' foto' : ' fotos');
    $('noMatch2').classList.toggle('hidden', n > 0);
  }
  fName.addEventListener('input', applyFilter);
  fState.addEventListener('change', applyFilter);
  if (fGuest) fGuest.addEventListener('change', applyFilter);
  if (fDay) fDay.addEventListener('change', applyFilter);
  const sp = $('showPending');
  if (sp) sp.addEventListener('click', () => { fState.value = 'pending'; applyFilter(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
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
    if (b.dataset.mk === 'dl') { download([id]); return; }
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
      else if (act === 'delete') { if (confirm(`¿Mandar ${ids.length} ${ids.length === 1 ? 'foto' : 'fotos'} a la papelera? Podrás recuperarlas durante 7 días.`)) { await sort.removeIds(ids); applyFilter(); } }
      else if (act === 'top' || act === 'end') {
        const set = new Set(ids), all = [...grid.querySelectorAll('.tile')], mine = all.filter((t) => set.has(t.dataset.id)), rest = all.filter((t) => !set.has(t.dataset.id));
        const order = act === 'top' ? mine.concat(rest) : rest.concat(mine);
        order.forEach((t) => grid.append(t));
        await post(api + '/reorder', { ids: order.map((t) => t.dataset.id) });
        const sb = $('sortBy'); if (!sb.querySelector('[value=manual]')) sb.add(new Option('Orden manual', 'manual')); sb.value = 'manual';
        toast('Orden guardado');
        (act === 'top' ? mine[0] : mine[mine.length - 1]).scrollIntoView({ block: 'center' });
      }
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

  const fo = $('folderTo');
  if (fo) fo.addEventListener('change', async () => {
    const ids = sort.picked(), to = fo.value; if (!ids.length || !to) return;
    try { await post(api + '/folder', { ids, target: to }); toast(`${ids.length} fotos movidas a «${fo.selectedOptions[0].textContent.replace(/\s*\(principal\)$/, '')}»`); setTimeout(() => location.reload(), 700); }
    catch { err(); fo.value = ''; }
  });
  const cov = $('asCover');
  if (cov) cov.addEventListener('click', async () => {
    const ids = sort.picked(); if (ids.length !== 1) { toast('Elige una sola foto'); return; }
    try { await post(api + '/thumb-from', { id: ids[0] }); toast('Portada del cuadro actualizada'); } catch { err(); }
  });

  const size = $('size');
  const apply = () => { grid.style.setProperty('--tile', size.value + 'px'); if (matchMedia('(min-width:861px)').matches) grid.style.gridTemplateColumns = 'repeat(' + Math.max(2, Math.min(8, Math.round(680 / size.value))) + ', 1fr)'; };
  size.addEventListener('input', apply); apply();
})();

// Sedes: copiar enlace y elegir portada del cuadro
(() => {
  const toast = (t) => { const m = document.createElement('div'); m.className = 'toast'; m.textContent = t; document.body.appendChild(m); setTimeout(() => m.remove(), 2200); };
  document.querySelectorAll('[data-sharelink]').forEach((b) => b.addEventListener('click', async (e) => {
    e.preventDefault(); const url = location.origin + b.dataset.sharelink;
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { try { await navigator.share({ url }); return; } catch (x) { /* cancelado */ } }
    try { await navigator.clipboard.writeText(url); } catch (x) { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    toast('Enlace copiado');
  }));
  async function resize(file) {
    const bmp = await createImageBitmap(file); const w = Math.min(900, bmp.width), h = Math.round(bmp.height * w / bmp.width);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return new Promise((r, j) => cv.toBlob((b) => (b ? r(b) : j(new Error('enc'))), 'image/jpeg', 0.85));
  }
  const tdlg = document.getElementById('thumbDlg'), tgrid = document.getElementById('thumbGrid'); let tid = '';
  document.querySelectorAll('[data-thumbpick]').forEach((b) => b.addEventListener('click', async () => {
    tid = b.dataset.thumbpick; tdlg.showModal(); tgrid.textContent = '';
    try {
      const r = await (await fetch(`/api/g/${tid}/photos`)).json();
      tgrid.innerHTML = r.ids && r.ids.length ? r.ids.map((id) => `<button type="button" class="covpick" data-id="${id}"><img src="/m/${id}/m" alt="" loading="lazy"></button>`).join('') : '<p class="muted">Esta galería aún no tiene fotos.</p>';
    } catch (x) { tgrid.innerHTML = '<p class="muted">No se pudieron cargar las fotos.</p>'; }
  }));
  if (tgrid) tgrid.addEventListener('click', async (e) => {
    const b = e.target.closest('.covpick'); if (!b) return;
    try {
      const r = await fetch(`/api/g/${tid}/thumb-from`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: b.dataset.id }) });
      if (!r.ok) throw new Error(r.status);
      location.reload();
    } catch (x) { toast('No se pudo guardar la portada'); }
  });
  document.querySelectorAll('[data-thumbdel]').forEach((b) => b.addEventListener('click', async () => {
    await fetch(`/api/g/${b.dataset.thumbdel}/brand/thumb`, { method: 'DELETE' }); location.reload();
  }));
})();

// Moderación rápida desde el visor: A aprobar, R rechazar, F favorita (y pasa a la siguiente).
(() => {
  const lb = document.getElementById('lb'), mod = document.getElementById('lbMod'), grid = document.getElementById('sortGrid');
  const api = document.body.dataset.gapi;
  if (!lb || !mod || !grid || !api) return;
  const { post, toast } = window.PicfySort;
  const LABEL = { approved: 'Publicada', pending: 'En revisión', rejected: 'No publicada' };
  let cur = null;
  const stEl = document.getElementById('lbSt');
  const paint = () => {
    if (!cur) return; stEl.textContent = LABEL[cur.dataset.state] || ''; stEl.dataset.s = cur.dataset.state;
    mod.querySelector('[data-mod=fav]').classList.toggle('on', cur.dataset.fav === '1');
  };
  lb.addEventListener('lbshow', (e) => {
    const all = [...grid.querySelectorAll('.tile')].filter((t) => t.offsetParent !== null);
    cur = all[e.detail.i] || null; paint();
  });
  lb.addEventListener('lbhide', () => { cur = null; const f = document.getElementById('fState'); if (f) f.dispatchEvent(new Event('change')); });
  function chip(t) {
    const old = t.querySelector('.st'); if (old) old.remove();
    if (t.dataset.state !== 'approved') {
      const s = document.createElement('span'); s.className = 'st ' + t.dataset.state; s.textContent = t.dataset.state === 'pending' ? 'En revisión' : 'No publicada';
      t.insertBefore(s, t.querySelector('.cap'));
    }
  }
  async function run(what) {
    if (!cur) return; const t = cur, id = t.dataset.id;
    if (what === 'dl') { const a = document.createElement('a'); a.href = `/m/${id}/o?dl=1`; document.body.append(a); a.click(); a.remove(); return; }
    try {
      if (what === 'fav') { const v = t.dataset.fav === '1' ? 0 : 1; await post(api + '/mark', { ids: [id], fav: v }); t.dataset.fav = String(v); const b = t.querySelector('.favb'); if (b) b.classList.toggle('on', Boolean(v)); paint(); return; }
      await post(api + '/state', { action: what, ids: [id] });
      t.dataset.state = what === 'approve' ? 'approved' : 'rejected'; chip(t); paint();
      lb.querySelector('.next').click(); // siguiente foto
    } catch { toast('No se pudo completar la acción.'); }
  }
  mod.addEventListener('click', (e) => { const b = e.target.closest('[data-mod]'); if (b) run(b.dataset.mod); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open') || e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    const k = e.key.toLowerCase();
    if (k === 'a') run('approve'); else if (k === 'r') run('reject'); else if (k === 'f') run('fav');
  });
})();

// Selecciones del cliente: ver solo esas fotos o marcarlas como favoritas.
(() => {
  const dlg = document.getElementById('selDlg'), grid = document.getElementById('sortGrid');
  if (!dlg || !grid) return;
  const { post, toast } = window.PicfySort; const api = document.body.dataset.gapi;
  dlg.addEventListener('click', async (e) => {
    const art = e.target.closest('.selsend'); if (!art) return;
    const ids = art.dataset.ids.split(',').filter(Boolean);
    if (e.target.closest('[data-selshow]')) {
      const set = new Set(ids); let n = 0;
      grid.querySelectorAll('.tile').forEach((t) => { const ok = set.has(t.dataset.id); t.classList.toggle('hidden', !ok); if (ok) n++; });
      const sh = document.getElementById('shown'); if (sh) sh.textContent = n + (n === 1 ? ' foto' : ' fotos');
      dlg.close(); toast('Mostrando solo la selección. Recarga la página para volver a verlas todas.');
    } else if (e.target.closest('[data-selfav]')) {
      try { await post(api + '/mark', { ids, fav: 1 }); ids.forEach((id) => { const t = grid.querySelector(`.tile[data-id="${id}"]`); if (t) { t.dataset.fav = '1'; const b = t.querySelector('.favb'); if (b) b.classList.add('on'); } }); toast('Marcadas como favoritas'); }
      catch { toast('No se pudo completar la acción.'); }
    }
  });
})();

// Al abrir las selecciones se marcan como vistas (desaparece el aviso).
(() => {
  const btn = document.querySelector('[data-open=selDlg]'), gid = document.body.dataset.gid;
  if (!btn || !gid) return;
  btn.addEventListener('click', () => {
    if (!btn.querySelector('.newsel')) return;
    fetch('/galerias/' + gid + '/selecciones/vistas', { method: 'POST' }).then(() => btn.querySelectorAll('.newsel').forEach((x) => x.remove())).catch(() => {});
  });
})();

// Calcula el CRC de originales antiguos (para que sus ZIP los abra bien el Mac). Lo hace el servidor por trozos.
// Si hay algo pendiente, el botón de descargar espera a que termine; si falla, lo dice.
(() => {
  const m = location.pathname.match(/^\/galerias\/([0-9a-f]{16})$/); if (!m) return;
  const id = m[1];
  const state = { pending: null, error: '', done: 0, total: 0 };
  window.__crc = state;
  const post = (u, b) => fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  async function one(pid) {
    let off = 0, st = null, fails = 0;
    for (;;) {
      let r; try { r = await post(`/api/g/${id}/crc-step`, { id: pid, off, st }); } catch { r = null; }
      if (!r || !r.ok) { if (++fails > 4) throw new Error(r ? 'HTTP ' + r.status : 'sin conexión'); await new Promise((x) => setTimeout(x, 700 * fails)); continue; }
      fails = 0; const d = await r.json(); if (d.done) return; off = d.off; st = d.st;
    }
  }
  const run = () => { state.total = 0; state.done = 0; state.pending = (async () => {
    try {
      for (let round = 0; round < 200; round++) {
        const { ids } = await (await fetch(`/api/g/${id}/nocrc`)).json();
        if (!ids || !ids.length) break;
        state.total += ids.length;
        await Promise.all(ids.map((pid) => one(pid).then(() => { state.done++; })));
      }
    } catch (e) { state.error = String(e.message || e); }
    state.pending = null;
  })(); };
  run();
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-zipa], [data-zipall]');
    if (!a) return;
    if (!state.pending && !state.error && !state.retry) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const label = a.dataset.lbl || a.textContent; a.dataset.lbl = label;
    if (state.retry) { state.retry = false; state.error = ''; run(); }
    a.setAttribute('aria-busy', 'true');
    const tick = setInterval(() => { a.textContent = `Preparando vídeos… ${state.done}/${state.total || '?'}`; }, 400);
    if (state.pending) await state.pending;
    clearInterval(tick); a.removeAttribute('aria-busy');
    if (state.error) {
      a.textContent = `No se pudieron preparar los vídeos (${state.error}). Toca para reintentar`;
      state.error = ''; state.retry = true; return;
    }
    a.textContent = label; a.click();
  }, true);
})();
