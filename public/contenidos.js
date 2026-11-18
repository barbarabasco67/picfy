// Calendario de contenidos de un cliente: mes, lista y feed; editor con imágenes y copy; enlace para el cliente.
(function () {
  const $ = (id) => document.getElementById(id);
  const board = $('ctBoard');
  if (!board) return;
  const cid = document.body.dataset.client;
  let ST, FM, NETS;
  try { ST = JSON.parse(document.body.dataset.statuses); FM = JSON.parse(document.body.dataset.formats); NETS = JSON.parse(document.body.dataset.nets); } catch { return; }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOW = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const pad = (n) => String(n).padStart(2, '0');
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
  const api = async (method, path, body, raw) => {
    const r = await fetch(path, { method, headers: raw ? { 'content-type': raw.type } : { 'content-type': 'application/json' }, body: raw || (body ? JSON.stringify(body) : undefined) });
    let d = null; try { d = await r.json(); } catch { /* sin json */ }
    if (!r.ok) throw new Error((d && d.error) || 'http' + r.status);
    return d;
  };
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 3500); }

  let posts = [], token = null, view = lsGet('picfy_ct_view') || 'mes', fSt = '';
  const now = new Date();
  let cy = now.getFullYear(), cm = now.getMonth();
  const imgUrl = (i) => '/api/post-img/' + i;
  const pill = (s) => `<span class="ctpill" style="--s:${ST[s].color}">${esc(ST[s].label)}</span>`;
  const dots = (p) => p.networks.map((n) => `<i style="background:${NETS[n].color}" title="${esc(NETS[n].label)}"></i>`).join('');

  function thumb(p) { return p.images.length ? `<img src="${imgUrl(p.images[0])}" alt="" loading="lazy">` : ''; }

  function card(p) {
    return `<button type="button" class="ctcard" data-id="${p.id}" style="--s:${ST[p.status].color}">${thumb(p)}<span class="ctc-t">${esc(p.title)}</span><span class="ctc-m">${dots(p)}</span></button>`;
  }

  function renderChips() {
    const counts = {}; posts.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    $('ctChips').innerHTML = `<button type="button" class="ctchip${fSt ? '' : ' on'}" data-st="">Todas · ${posts.length}</button>` + Object.keys(ST).filter((k) => counts[k]).map((k) => `<button type="button" class="ctchip${fSt === k ? ' on' : ''}" data-st="${k}" style="--c:${ST[k].color}"><i></i>${esc(ST[k].label)} · ${counts[k]}</button>`).join('');
  }

  const shown = () => posts.filter((p) => !fSt || p.status === fSt);

  function renderMonth() {
    const first = new Date(cy, cm, 1), days = new Date(cy, cm + 1, 0).getDate(), off = (first.getDay() + 6) % 7;
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    let cells = '';
    for (let i = 0; i < off; i++) cells += '<div class="ctcell off"></div>';
    for (let d = 1; d <= days; d++) {
      const iso = `${cy}-${pad(cm + 1)}-${pad(d)}`;
      const ps = shown().filter((p) => p.date === iso);
      cells += `<div class="ctcell${iso === today ? ' today' : ''}" data-day="${iso}"><span class="ctn">${d}</span>${ps.map(card).join('')}<button type="button" class="ctplus" data-add="${iso}" aria-label="Añadir el ${d}">+</button></div>`;
    }
    board.innerHTML = `<div class="agbar glass"><div class="agnav"><button class="iconbtn" type="button" id="ctPrev" aria-label="Anterior">‹</button><h2>${MONTHS[cm]} ${cy}</h2><button class="iconbtn" type="button" id="ctNext" aria-label="Siguiente">›</button></div></div>
<div class="ctdow">${DOW.map((x) => `<span>${x}</span>`).join('')}</div><div class="ctgrid">${cells}</div>`;
    $('ctPrev').onclick = () => { cm--; if (cm < 0) { cm = 11; cy--; } renderMonth(); };
    $('ctNext').onclick = () => { cm++; if (cm > 11) { cm = 0; cy++; } renderMonth(); };
  }

  function renderList() {
    const list = shown().filter((p) => p.date).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    const draft = shown().filter((p) => !p.date);
    if (!list.length && !draft.length) { board.innerHTML = '<div class="glass emptybox">Aún no hay publicaciones. Pulsa «Nueva publicación» para empezar.</div>'; return; }
    board.innerHTML = '<div class="ctlist">' + list.concat(draft).map((p) => {
      const [y, m, d] = (p.date || '--').split('-');
      return `<button type="button" class="glass ctrow" data-id="${p.id}" style="--s:${ST[p.status].color}"><span class="ctd">${p.date ? `<b>${+d}</b>${MONTHS[m - 1].slice(0, 3)}` : '—'}</span><span class="ctth">${thumb(p)}</span><span class="ctmain"><strong>${esc(p.title)}</strong><span class="muted small">${esc(FM[p.format] || '')}${p.time ? ' · ' + esc(p.time) : ''}</span><span class="ctc-m">${dots(p)}</span><span class="muted small ctsnip">${esc(p.copy.slice(0, 120))}</span></span>${pill(p.status)}</button>`;
    }).join('') + '</div>';
  }

  function renderFeed() {
    const list = shown().filter((p) => p.images.length).sort((a, b) => b.date.localeCompare(a.date));
    if (!list.length) { board.innerHTML = '<div class="glass emptybox">El feed se forma con las publicaciones que tienen imagen.</div>'; return; }
    board.innerHTML = '<div class="ctfeed">' + list.map((p) => `<button type="button" class="ctf" data-id="${p.id}" style="--s:${ST[p.status].color}"><img src="${imgUrl(p.images[0])}" alt="" loading="lazy">${p.images.length > 1 ? '<em>' + p.images.length + '</em>' : ''}<span>${esc(ST[p.status].label)}</span></button>`).join('') + '</div>';
  }

  function render() {
    document.querySelectorAll('[data-cv]').forEach((b) => b.classList.toggle('on', b.dataset.cv === view));
    renderChips();
    if (view === 'lista') renderList(); else if (view === 'feed') renderFeed(); else renderMonth();
  }

  async function load() {
    try { const d = await api('GET', `/api/redes/${cid}/posts`); posts = d.posts; token = d.token; } catch { toast('No se pudieron cargar las publicaciones.'); }
    render();
    const want = new URLSearchParams(location.search).get('post');
    if (want) { const p = posts.find((x) => x.id === want); if (p) { if (p.date) { cy = +p.date.slice(0, 4); cm = +p.date.slice(5, 7) - 1; render(); } openEdit(p); } }
  }

  /* ---------- editor ---------- */
  const dlg = $('ctDlg'), form = $('ctForm');
  let cur = null;
  const imgs = () => (cur ? cur.images : []);

  function renderImgs() {
    const ids = imgs();
    $('ctImgs').innerHTML = ids.map((i, k) => `<div class="ctim"><img src="${imgUrl(i)}" alt=""><div><button type="button" data-mv="${k}:-1" ${k ? '' : 'disabled'} aria-label="Mover a la izquierda">‹</button><button type="button" data-rm="${i}" aria-label="Quitar">×</button><button type="button" data-mv="${k}:1" ${k < ids.length - 1 ? '' : 'disabled'} aria-label="Mover a la derecha">›</button></div></div>`).join('') + (ids.length < 10 ? '<button type="button" class="ctimadd" id="ctPick">+ Imagen</button>' : '');
    $('ctImgHint').textContent = '';
  }

  const NL = () => { const c = form.copy.value.length; $('ctCount').textContent = c + ' caracteres'; };

  function fill(p) {
    form.title.value = p ? p.title : '';
    form.date.value = p ? p.date : '';
    form.time.value = p ? p.time : '';
    form.format.value = p ? p.format : 'post';
    form.status.value = p ? p.status : 'idea';
    form.copy.value = p ? p.copy : '';
    form.hashtags.value = p ? p.hashtags : '';
    form.link.value = p ? p.link : '';
    form.notes.value = p ? p.notes : '';
    form.querySelectorAll('[name=net]').forEach((c) => { c.checked = !!p && p.networks.includes(c.value); });
    $('ctDel').hidden = !p;
    $('ctDlgT').textContent = p ? 'Editar publicación' : 'Nueva publicación';
    $('ctCmWrap').hidden = !p;
    renderComments();
    NL();
  }
  function renderComments() {
    $('ctCms').innerHTML = cur && cur.comments.length ? cur.comments.map((x) => `<div class="ctcm ${x.author === 'cliente' ? 'cl' : ''}"><b>${x.author === 'cliente' ? 'Cliente' : 'Tú'}</b> ${esc(x.body)}</div>`).join('') : '<p class="muted small">Sin comentarios.</p>';
  }

  function openNew(date) { cur = { id: null, images: [], comments: [] }; fill(null); if (date) form.date.value = date; renderImgs(); dlg.showModal(); form.title.focus(); }
  function openEdit(p) { cur = JSON.parse(JSON.stringify(p)); fill(p); renderImgs(); dlg.showModal(); }

  function formData() {
    return { title: form.title.value, date: form.date.value, time: form.time.value, format: form.format.value, status: form.status.value, copy: form.copy.value, hashtags: form.hashtags.value, link: form.link.value, notes: form.notes.value, networks: [...form.querySelectorAll('[name=net]:checked')].map((c) => c.value) };
  }

  // La publicación se crea al subir la primera imagen, para poder asociarla.
  async function ensureSaved() {
    if (cur.id) return;
    const d = formData();
    if (!d.title.trim()) d.title = 'Sin título';
    const r = await api('POST', `/api/redes/${cid}/posts`, d);
    cur.id = r.id; cur.created = true;
  }

  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
        cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob((b) => (b ? res(b) : rej(new Error('img'))), 'image/jpeg', 0.88);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      im.src = url;
    });
  }

  async function upload(files) {
    const list = [...files].slice(0, 10 - imgs().length);
    if (!list.length) return;
    try {
      await ensureSaved();
      for (let n = 0; n < list.length; n++) {
        $('ctImgHint').textContent = `Subiendo ${n + 1} de ${list.length}…`;
        const blob = await shrink(list[n]);
        const r = await api('POST', `/api/redes/${cid}/posts/${cur.id}/images`, null, blob);
        cur.images.push(r.id);
        renderImgs();
      }
      $('ctImgHint').textContent = '';
    } catch { toast('No se pudo subir una imagen.'); renderImgs(); }
  }

  dlg.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) { dlg.close(); return; }
    if (e.target.closest('#ctPick')) { $('ctFile').click(); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm) { try { await api('DELETE', `/api/redes/${cid}/posts/${cur.id}/images/${rm.dataset.rm}`); cur.images = cur.images.filter((x) => x !== rm.dataset.rm); renderImgs(); } catch { toast('No se pudo quitar.'); } return; }
    const mv = e.target.closest('[data-mv]');
    if (mv) {
      const [k, dir] = mv.dataset.mv.split(':').map(Number), a = cur.images;
      [a[k], a[k + dir]] = [a[k + dir], a[k]];
      renderImgs();
      try { await api('PUT', `/api/redes/${cid}/posts/${cur.id}/order`, { ids: a }); } catch { toast('No se pudo guardar el orden.'); }
    }
  });
  $('ctFile').addEventListener('change', (e) => { upload(e.target.files); e.target.value = ''; });
  form.copy.addEventListener('input', NL);
  dlg.addEventListener('close', () => { if (cur && cur.created && !cur.saved) load(); });

  $('ctCmBtn').addEventListener('click', async () => {
    const v = $('ctCmIn').value.trim();
    if (!v || !cur.id) return;
    try { const r = await api('POST', `/api/redes/${cid}/posts/${cur.id}/notes`, { body: v }); cur.comments.push(r.comment); $('ctCmIn').value = ''; renderComments(); } catch { toast('No se pudo enviar.'); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const d = formData();
      if (cur.id) await api('PUT', `/api/redes/${cid}/posts/${cur.id}`, d); else await api('POST', `/api/redes/${cid}/posts`, d);
      cur.saved = true; dlg.close(); await load();
    } catch { toast('No se pudo guardar.'); }
  });

  $('ctDel').addEventListener('click', async () => {
    if (!confirm('¿Borrar esta publicación y sus imágenes?')) return;
    try { await api('DELETE', `/api/redes/${cid}/posts/${cur.id}`); cur.saved = true; dlg.close(); await load(); } catch { toast('No se pudo borrar.'); }
  });

  /* ---------- enlace para el cliente ---------- */
  const sdlg = $('ctShareDlg');
  function renderShare() {
    const body = $('ctShareBody');
    if (!token) {
      body.innerHTML = '<p>Crea un enlace privado para que el cliente vea sus publicaciones, las apruebe o pida cambios. Solo verá las que estén en «Para revisar» o posteriores.</p><footer><span class="spacer"></span><button class="btn primary" type="button" id="ctOn">Crear enlace</button></footer>';
      $('ctOn').onclick = async () => { try { token = (await api('POST', `/api/redes/${cid}/share`, { on: true })).token; renderShare(); } catch { toast('No se pudo crear.'); } };
      return;
    }
    const url = location.origin + '/c/' + token;
    const pend = posts.filter((p) => p.status === 'revision').length;
    body.innerHTML = `<label class="field"><span>Enlace</span><input type="text" id="ctUrl" readonly value="${esc(url)}"></label><p class="muted small">El cliente ve ${posts.filter((p) => ST[p.status] && ['revision', 'cambios', 'aprobado', 'programado', 'publicado'].includes(p.status)).length} publicaciones (${pend} para revisar).</p>
<footer><button class="btn danger" type="button" id="ctOff">Desactivar</button><span class="spacer"></span><button class="btn" type="button" id="ctNew">Cambiar enlace</button><button class="btn primary" type="button" id="ctCopy">Copiar</button><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Abrir</a></footer>`;
    $('ctCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); } catch { $('ctUrl').select(); document.execCommand('copy'); } toast('Enlace copiado'); };
    $('ctOff').onclick = async () => { try { await api('POST', `/api/redes/${cid}/share`, { on: false }); token = null; renderShare(); } catch { toast('No se pudo.'); } };
    $('ctNew').onclick = async () => { if (!confirm('El enlace anterior dejará de funcionar. ¿Continuar?')) return; try { token = (await api('POST', `/api/redes/${cid}/share`, { on: true, renew: true })).token; renderShare(); } catch { toast('No se pudo.'); } };
  }
  sdlg.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) sdlg.close(); });
  $('ctShare').addEventListener('click', () => { renderShare(); sdlg.showModal(); });

  /* ---------- eventos ---------- */
  $('ctAdd').addEventListener('click', () => openNew(''));
  document.querySelectorAll('[data-cv]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.cv; lsSet('picfy_ct_view', view); render(); }));
  $('ctChips').addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (b) { fSt = b.dataset.st; render(); } });
  board.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { openNew(add.dataset.add); return; }
    const c = e.target.closest('[data-id]');
    if (c) { const p = posts.find((x) => x.id === c.dataset.id); if (p) openEdit(p); }
  });
  load();
})();
