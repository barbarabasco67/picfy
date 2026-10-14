// Selección de favoritas del cliente: elegir fotos y enviarlas al fotógrafo.
(function () {
  const TOKEN = document.body.dataset.token;
  if (!TOKEN || document.body.dataset.selection !== '1') return;
  const $ = (id) => document.getElementById(id);
  const lb = $('lb'), gal = $('gallery'), bar = $('selMine');
  if (!gal || !bar) return;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* */ } } };
  let key = ls.get('picfy_key_' + TOKEN);
  if (!/^[0-9a-f]{32}$/.test(key || '')) { const a = new Uint8Array(16); crypto.getRandomValues(a); key = [...a].map((b) => b.toString(16).padStart(2, '0')).join(''); ls.set('picfy_key_' + TOKEN, key); }
  const api = async (path, body) => {
    const r = await fetch('/api/e/' + TOKEN + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, ...body }) });
    if (!r.ok) { const e = new Error('http'); e.status = r.status; try { e.data = await r.json(); } catch { /* */ } throw e; }
    return r.json();
  };
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
  const sel = new Set(); let total = 0, enabled = true;
  const hint = $('selHint'); if (hint) gal.parentNode.insertBefore(hint, gal.previousElementSibling && gal.previousElementSibling.classList.contains('gbar') ? gal.previousElementSibling : gal);
  const figs = () => [...gal.querySelectorAll('figure.gitem')];

  function paintTile(fig) {
    const id = fig.querySelector('a.tile').dataset.id, b = fig.querySelector('.selpick'); if (!b) return;
    b.classList.toggle('on', sel.has(id)); b.setAttribute('aria-pressed', sel.has(id) ? 'true' : 'false');
    b.title = sel.has(id) ? 'Quitar de mi selección' : 'Añadir a mi selección';
  }
  function paintBar() {
    total = sel.size; bar.classList.toggle('hidden', !total); if (hint) hint.classList.toggle('hidden', total > 0);
    $('selMineN').textContent = total + (total === 1 ? ' foto elegida' : ' fotos elegidas');
    figs().forEach(paintTile); paintLb();
  }
  let curId = null;
  function paintLb() {
    const b = $('lbSel'); if (!b) return;
    b.classList.toggle('hidden', !curId); b.classList.toggle('on', sel.has(curId));
    b.innerHTML = CHECK + '<span>' + (sel.has(curId) ? 'En mi selección' : 'Elegir esta foto') + '</span>';
  }
  async function toggle(id) {
    const had = sel.has(id); had ? sel.delete(id) : sel.add(id); paintBar();
    try { const r = await api('/sel/toggle', { photo: id }); if (r.off) { enabled = false; } }
    catch { had ? sel.add(id) : sel.delete(id); paintBar(); }
  }
  figs().forEach((fig) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'selpick'; b.innerHTML = CHECK; b.setAttribute('aria-label', 'Elegir foto');
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(fig.querySelector('a.tile').dataset.id); });
    fig.appendChild(b);
  });
  if (lb) {
    lb.addEventListener('lbshow', (e) => { const t = [...gal.querySelectorAll('a.tile')][e.detail.i]; curId = t ? t.dataset.id : null; paintLb(); });
    lb.addEventListener('lbhide', () => { curId = null; });
    const lbSel = $('lbSel'); if (lbSel) lbSel.addEventListener('click', (e) => { e.stopPropagation(); if (curId) toggle(curId); });
  }
  (async function () {
    try {
      const r = await api('/sel/list', {});
      if (r.off) { document.querySelectorAll('.selpick').forEach((b) => b.remove()); bar.remove(); const l = $('lbSel'); if (l) l.remove(); return; }
      r.ids.forEach((i) => sel.add(i)); paintBar();
    } catch { /* sin conexión */ }
  })();

  // Enviar
  const dlg = $('selSendDlg'), form = $('selSendForm'), err = $('selErr'), ok = $('selOk');
  $('selSendOpen').addEventListener('click', () => {
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
