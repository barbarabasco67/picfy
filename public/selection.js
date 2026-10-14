// Selección del invitado: elegir fotos para descargarlas y/o enviárselas al fotógrafo como favoritas.
(function () {
  const TOKEN = document.body.dataset.token;
  const SERVER = document.body.dataset.selection === '1', DL = document.body.dataset.dl === '1';
  if (!TOKEN || (!SERVER && !DL)) return;
  const $ = (id) => document.getElementById(id);
  const lb = $('lb'), gal = $('gallery'), bar = $('selMine');
  if (!gal || !bar) return;
  const MAXDL = 40;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* */ } } };
  let key = ls.get('picfy_key_' + TOKEN);
  if (!/^[0-9a-f]{32}$/.test(key || '')) { const a = new Uint8Array(16); crypto.getRandomValues(a); key = [...a].map((b) => b.toString(16).padStart(2, '0')).join(''); ls.set('picfy_key_' + TOKEN, key); }
  const api = async (path, body) => {
    const r = await fetch('/api/e/' + TOKEN + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, ...body }) });
    if (!r.ok) { const e = new Error('http'); e.status = r.status; try { e.data = await r.json(); } catch { /* */ } throw e; }
    return r.json();
  };
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
  const sel = new Set(); let curId = null;
  const hint = $('selHint');
  const figs = () => [...gal.querySelectorAll('figure.gitem')];
  const idOf = (fig) => fig.querySelector('a.tile').dataset.id;
  if (hint) gal.parentNode.insertBefore(hint, gal.previousElementSibling && gal.previousElementSibling.classList.contains('gbar') ? gal.previousElementSibling : gal);

  function paint() {
    const total = sel.size;
    bar.classList.toggle('hidden', !total); if (hint) hint.classList.toggle('hidden', total > 0);
    $('selMineN').textContent = total + (total === 1 ? ' foto elegida' : ' fotos elegidas');
    figs().forEach((fig) => { const b = fig.querySelector('.selpick'), on = sel.has(idOf(fig)); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Quitar de mi selección' : 'Elegir esta foto'; });
    const all = figs().length && figs().every((f) => sel.has(idOf(f)));
    const t = $('selToggle'); if (t) t.textContent = all ? 'Quitar selección' : 'Elegir todas';
    const lbb = $('lbSel');
    if (lbb) { lbb.classList.toggle('hidden', !curId); lbb.classList.toggle('on', sel.has(curId)); lbb.innerHTML = CHECK + '<span>' + (sel.has(curId) ? 'Elegida' : 'Elegir esta foto') + '</span>'; }
    const dl = $('selDl'); if (dl) dl.disabled = false;
  }
  async function toggle(id) {
    const had = sel.has(id); had ? sel.delete(id) : sel.add(id); paint();
    if (!SERVER) return;
    try { await api('/sel/toggle', { photo: id }); } catch { had ? sel.add(id) : sel.delete(id); paint(); }
  }
  async function setMany(ids, on) {
    const before = new Set(sel); ids.forEach((i) => (on ? sel.add(i) : sel.delete(i))); paint();
    if (!SERVER) return;
    try { await api('/sel/bulk', { photos: ids, on }); } catch { sel.clear(); before.forEach((i) => sel.add(i)); paint(); }
  }
  figs().forEach((fig) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'selpick'; b.innerHTML = CHECK; b.setAttribute('aria-label', 'Elegir foto');
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(idOf(fig)); });
    fig.appendChild(b);
  });
  const tg = $('selToggle');
  if (tg) tg.addEventListener('click', () => { const ids = figs().map(idOf); setMany(ids, !ids.every((i) => sel.has(i))); });
  $('selClear').addEventListener('click', async () => {
    const before = new Set(sel); sel.clear(); paint();
    if (SERVER) { try { await api('/sel/clear', {}); } catch { before.forEach((i) => sel.add(i)); paint(); } }
  });
  if (lb) {
    lb.addEventListener('lbshow', (e) => { const t = [...gal.querySelectorAll('a.tile')][e.detail.i]; curId = t ? t.dataset.id : null; paint(); });
    lb.addEventListener('lbhide', () => { curId = null; paint(); });
    const lbSel = $('lbSel'); if (lbSel) lbSel.addEventListener('click', (e) => { e.stopPropagation(); if (curId) toggle(curId); });
  }
  if (SERVER) (async function () {
    try {
      const r = await api('/sel/list', {});
      if (r.off) return;
      r.ids.forEach((i) => sel.add(i)); paint();
    } catch { /* sin conexión */ }
  })();

  // Descargar la selección
  const dlBtn = $('selDl');
  if (dlBtn) dlBtn.addEventListener('click', () => {
    const ids = [...sel];
    if (!ids.length) return;
    if (ids.length > MAXDL) { alert('Puedes descargar hasta ' + MAXDL + ' fotos cada vez. Quita algunas o usa «Descargar» (arriba) para bajar el ZIP completo.'); return; }
    if (ids.length === 1) { location.href = '/e/' + TOKEN + '/dl/' + ids[0]; return; }
    location.href = '/e/' + TOKEN + '/zip?ids=' + ids.join(',');
  });

  // Enviar al fotógrafo
  const dlg = $('selSendDlg'); if (!dlg) return;
  const form = $('selSendForm'), err = $('selErr'), ok = $('selOk');
  $('selSendOpen').addEventListener('click', () => {
    const total = sel.size;
    $('selSendInfo').textContent = 'Le llegará la lista de las ' + total + (total === 1 ? ' foto que has elegido' : ' fotos que has elegido') + ', para que sepa cuáles te gustan más.';
    $('selName').value = ls.get('picfy_name') || ''; err.classList.add('hidden'); ok.classList.add('hidden'); $('selSendGo').disabled = false;
    dlg.showModal();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); err.classList.add('hidden');
    const name = $('selName').value.trim(); if (!name) return;
    ls.set('picfy_name', name); $('selSendGo').disabled = true;
    try {
      await api('/sel/send', { name, email: $('selEmail').value.trim(), note: $('selNote').value.trim() });
      ok.classList.remove('hidden'); setTimeout(() => dlg.close(), 1800);
    } catch (x) {
      const c = x.data && x.data.error;
      err.textContent = c === 'rate' ? 'Has enviado demasiadas veces seguidas. Espera un poco.' : c === 'email' ? 'Ese email no parece válido.' : c === 'empty' ? 'Aún no has elegido ninguna foto.' : 'No se pudo enviar. Inténtalo de nuevo.';
      err.classList.remove('hidden'); $('selSendGo').disabled = false;
    }
  });
})();
