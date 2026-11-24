// Calendario de contenidos de un cliente: mes, lista, tablero y feed; editor completo; estrategia; enlace para el cliente.
(function () {
  const $ = (id) => document.getElementById(id);
  const board = $('ctBoard');
  if (!board) return;
  const cid = document.body.dataset.client;
  const SH = document.body.dataset.token || '';
  const BASE = SH ? `/c/${SH}/api` : `/api/redes/${cid}`;
  let RO = false;
  let ST, FM, NETS;
  try { ST = JSON.parse(document.body.dataset.statuses); FM = JSON.parse(document.body.dataset.formats); NETS = JSON.parse(document.body.dataset.nets); } catch { return; }
  const CHECKS = { copy: 'Texto', arte: 'Diseño', tags: 'Hashtags', prog: 'Programado' };
  const LIMITS = { instagram: 2200, tiktok: 2200, x: 280, linkedin: 3000 };
  const ABBR = { instagram: 'IG', tiktok: 'TT', facebook: 'FB', youtube: 'YT', x: 'X', linkedin: 'IN' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOW = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  const pad = (n) => String(n).padStart(2, '0');
  const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmt = (n) => Number(n).toLocaleString('es-ES');
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
  const ink = (hex) => { const n = parseInt(hex.slice(1), 16); return (((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000) > 165 ? '#14213d' : '#ffffff'; };
  const api = async (method, path, body, raw) => {
    const r = await fetch(path, { method, headers: raw ? { 'content-type': raw.type } : { 'content-type': 'application/json' }, body: raw || (body ? JSON.stringify(body) : undefined) });
    let d = null; try { d = await r.json(); } catch { /* sin json */ }
    if (!r.ok) throw new Error((d && d.error) || 'http' + r.status);
    return d;
  };
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 3500); }
  const IC = {
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>',
    img: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/></svg>',
  };

  let posts = [], token = null, mode = 'review', modeOk = false, planOk = false, plan = { pillars: [], tagsets: [] }, camps = [];
  let view = lsGet('picfy_ct_view'); if (!['mes', 'lista', 'tablero', 'feed'].includes(view)) view = 'mes';
  let fSt = '', fNet = '', fPil = '', fOwn = '', q = '';
  const now = new Date();
  let cy = now.getFullYear(), cm = now.getMonth();
  const imgUrl = (i) => (SH ? `/c/${SH}/img/` : '/api/post-img/') + i;
  const pilarColor = (n) => (plan.pillars.find((x) => x.name === n) || {}).color || '#8a8f98';

  const shown = () => posts.filter((p) => (!fSt || p.status === fSt) && (!fNet || p.networks.includes(fNet)) && (!fPil || p.pillar === fPil) && (!fOwn || p.owner === fOwn)
    && (!q || (p.title + ' ' + p.copy + ' ' + p.hashtags + ' ' + p.pillar).toLowerCase().includes(q)));

  /* ---------- piezas ---------- */
  const thumb = (p) => (p.images.length ? `<span class="ctimg"><img src="${imgUrl(p.images[0])}" alt="" loading="lazy">${p.images.length > 1 ? `<em>${p.images.length}</em>` : ''}</span>` : '');
  const nets = (p) => p.networks.map((n) => `<i>${ABBR[n] || n}</i>`).join('');
  const prog = (p) => { const n = Object.keys(CHECKS).filter((k) => p.check && p.check[k]).length; return n ? `<i>${n}/4</i>` : ''; };
  const cmts = (p) => (p.comments.length ? `<i class="ctcmi">${IC.msg}${p.comments.length}</i>` : '');
  const pil = (p) => (p.pillar ? `<span class="ctpil">${esc(p.pillar)}</span>` : '');
  function card(p) {
    const c = ST[p.status].color;
    return `<button type="button" class="ctcard" draggable="true" data-id="${p.id}" style="--s:${c};--si:${ink(c)}">${thumb(p)}<span class="ctc-t">${esc(p.title)}</span><span class="ctc-m">${nets(p)}${prog(p)}${cmts(p)}</span></button>`;
  }

  /* ---------- cabecera: estadísticas y filtros ---------- */
  function renderStats() {
    const mk = `${cy}-${pad(cm + 1)}`;
    const mp = posts.filter((p) => p.date.startsWith(mk));
    const reach = mp.reduce((a, p) => a + (p.stats.reach || 0), 0);
    const tiles = [
      ['Este mes', mp.length], ['Por revisar', posts.filter((p) => p.status === 'revision').length], ['Cambios pedidos', posts.filter((p) => p.status === 'cambios').length],
      ['Aprobadas', mp.filter((p) => p.status === 'aprobado' || p.status === 'programado').length], ['Publicadas', mp.filter((p) => p.status === 'publicado').length],
    ];
    if (reach) tiles.push(['Alcance', fmt(reach)]);
    let html = tiles.map(([l, v]) => `<div class="ctst"><b>${v}</b><span>${l}</span></div>`).join('');
    // huecos: tramo de 3 o más días seguidos sin publicar en los próximos 14
    const has = new Set(posts.filter((p) => p.date && p.status !== 'idea').map((p) => p.date));
    let run = [], best = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (!has.has(isoOf(d))) { run.push(d); if (run.length > best.length) best = run.slice(); } else run = [];
    }
    if (best.length >= 3) { const a = best[0], z = best[best.length - 1]; html += `<div class="ctst gap"><b>${best.length} días</b><span>Sin publicar · ${a.getDate()} ${MONTHS[a.getMonth()].slice(0, 3)} – ${z.getDate()} ${MONTHS[z.getMonth()].slice(0, 3)}</span></div>`; }
    $('ctStats').innerHTML = html;
  }

  function renderFilters() {
    const counts = {}; posts.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    $('ctChips').innerHTML = `<button type="button" class="ctchip${fSt ? '' : ' on'}" data-st="">Todas · ${posts.length}</button>` + Object.keys(ST).filter((k) => counts[k]).map((k) => `<button type="button" class="ctchip${fSt === k ? ' on' : ''}" data-st="${k}" style="--c:${ST[k].color}"><i></i>${esc(ST[k].label)} · ${counts[k]}</button>`).join('');
    const sel = (id, label, opts, cur) => { const el = $(id); el.innerHTML = `<option value="">${label}</option>` + opts.map(([v, t]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(t)}</option>`).join(''); };
    sel('ctFNet', 'Todas las redes', Object.keys(NETS).map((k) => [k, NETS[k].label]), fNet);
    const pills = plan.pillars.map((x) => x.name); $('ctFPil').hidden = !pills.length; sel('ctFPil', 'Todos los pilares', pills.map((n) => [n, n]), fPil);
    const owners = [...new Set(posts.map((p) => p.owner).filter(Boolean))]; $('ctFOwn').hidden = !owners.length; sel('ctFOwn', 'Todos los responsables', owners.map((n) => [n, n]), fOwn);
    $('ctOwners').innerHTML = owners.map((o) => `<option value="${esc(o)}">`).join('');
  }

  /* ---------- vistas ---------- */
  function renderMonth() {
    const first = new Date(cy, cm, 1), days = new Date(cy, cm + 1, 0).getDate(), off = (first.getDay() + 6) % 7;
    const today = isoOf(now), list = shown();
    let cells = '';
    for (let i = 0; i < off; i++) cells += '<div class="ctcell off"></div>';
    for (let d = 1; d <= days; d++) {
      const iso = `${cy}-${pad(cm + 1)}-${pad(d)}`;
      const bars = camps.filter((k) => k.start <= iso && iso <= k.end).map((k) => {
        const st = k.start === iso, en = k.end === iso || (off + d) % 7 === 0, show = st || d === 1 || (off + d - 1) % 7 === 0;
        return `<span class="ctcamp${st ? ' s' : ''}${en ? ' e' : ''}" style="--k:${esc(k.color)};--ki:${ink(k.color)}" title="${esc(k.name)}">${show ? esc(k.name) : '&nbsp;'}</span>`;
      }).join('');
      cells += `<div class="ctcell${iso === today ? ' today' : ''}" data-day="${iso}"><span class="ctn">${d}</span>${bars}${list.filter((p) => p.date === iso).map(card).join('')}<button type="button" class="ctplus" data-add="${iso}" aria-label="Añadir el ${d}">+</button></div>`;
    }
    const und = list.filter((p) => !p.date);
    board.innerHTML = `<div class="ctnav"><button class="iconbtn" type="button" id="ctPrev" aria-label="Anterior">‹</button><h2>${MONTHS[cm]} ${cy}</h2><button class="iconbtn" type="button" id="ctNext" aria-label="Siguiente">›</button><button class="btn sm" type="button" id="ctToday">Hoy</button></div>
${und.length ? `<div class="cttray" data-day=""><b>Sin fecha</b>${und.map(card).join('')}</div>` : ''}
<div class="ctdow">${DOW.map((x) => `<span>${x}</span>`).join('')}</div><div class="ctgrid">${cells}</div>`;
    $('ctPrev').onclick = () => { cm--; if (cm < 0) { cm = 11; cy--; } render(); };
    $('ctNext').onclick = () => { cm++; if (cm > 11) { cm = 0; cy++; } render(); };
    $('ctToday').onclick = () => { cy = now.getFullYear(); cm = now.getMonth(); render(); };
  }

  function renderList() {
    const list = shown().slice().sort((a, b) => (a.date ? (a.date + (a.time || '')) : '9').localeCompare(b.date ? (b.date + (b.time || '')) : '9'));
    if (!list.length) { board.innerHTML = '<div class="glass emptybox">Sin publicaciones.</div>'; return; }
    board.innerHTML = '<div class="ctlist">' + list.map((p) => {
      const c = ST[p.status].color, [, m, d] = (p.date || '--').split('-');
      return `<button type="button" class="ctrow" data-id="${p.id}" style="--s:${c};--si:${ink(c)}"><span class="ctd">${p.date ? `<b>${+d}</b>${MONTHS[m - 1].slice(0, 3)}` : '—'}</span>${thumb(p) || '<span class="ctimg none"></span>'}<span class="ctmain"><strong>${esc(p.title)}</strong><span class="ctsub">${esc(FM[p.format] || '')}${p.time ? ' · ' + esc(p.time) : ''}${p.owner ? ' · ' + esc(p.owner) : ''}</span><span class="ctc-m">${nets(p)}${prog(p)}${cmts(p)}</span></span><span class="ctstate">${esc(ST[p.status].label)}</span></button>`;
    }).join('') + '</div>';
  }

  function renderBoard() {
    const list = shown();
    board.innerHTML = '<div class="ctkan">' + Object.keys(ST).map((k) => {
      const col = list.filter((p) => p.status === k).sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
      return `<section class="ctcol" data-status="${k}"><header><i style="background:${ST[k].color}"></i>${esc(ST[k].label)}<em>${col.length}</em></header>${col.map((p) => `<div class="ctkw">${p.date ? `<small>${+p.date.slice(8)} ${MONTHS[+p.date.slice(5, 7) - 1].slice(0, 3)}</small>` : ''}${card(p)}</div>`).join('')}</section>`;
    }).join('') + '</div>';
  }

  function renderFeed() {
    const list = shown().filter((p) => p.images.length).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!list.length) { board.innerHTML = '<div class="glass emptybox">El feed se forma con las publicaciones que tienen imagen.</div>'; return; }
    board.innerHTML = '<div class="ctfeed">' + list.map((p) => `<button type="button" class="ctf" data-id="${p.id}" style="--s:${ST[p.status].color}"><img src="${imgUrl(p.images[0])}" alt="" loading="lazy">${p.images.length > 1 ? '<em>' + p.images.length + '</em>' : ''}<span>${esc(ST[p.status].label)}</span></button>`).join('') + '</div>';
  }

  function render() {
    document.querySelectorAll('[data-cv]').forEach((b) => b.classList.toggle('on', b.dataset.cv === view));
    renderStats(); renderFilters();
    ({ mes: renderMonth, lista: renderList, tablero: renderBoard, feed: renderFeed })[view]();
  }

  async function load() {
    try { const d = await api('GET', `${BASE}/posts`); posts = d.posts; token = d.token; mode = d.mode; modeOk = d.modeOk; planOk = d.planOk; plan = { pillars: [], tagsets: [], ...(d.plan || {}) }; camps = d.campaigns || []; } catch { toast('No se pudieron cargar las publicaciones.'); }
    RO = !!SH && mode === 'view';
    $('ctAdd').hidden = RO;
    render();
    const want = new URLSearchParams(location.search).get('post');
    if (want) { const p = posts.find((x) => x.id === want); if (p) { if (p.date) { cy = +p.date.slice(0, 4); cm = +p.date.slice(5, 7) - 1; render(); } openEdit(p); } history.replaceState(null, '', location.pathname + '?t=contenidos'); }
  }

  /* ---------- editor ---------- */
  const dlg = $('ctDlg'), form = $('ctForm');
  let cur = null;
  const imgs = () => (cur ? cur.images : []);

  function renderImgs() {
    const ids = imgs();
    $('ctImgs').innerHTML = ids.map((i, k) => `<div class="ctim"><img src="${imgUrl(i)}" alt=""><div><button type="button" data-mv="${k}:-1" ${k ? '' : 'disabled'} aria-label="Mover a la izquierda">‹</button><button type="button" data-rm="${i}" aria-label="Quitar">×</button><button type="button" data-mv="${k}:1" ${k < ids.length - 1 ? '' : 'disabled'} aria-label="Mover a la derecha">›</button></div></div>`).join('') + (ids.length < 10 ? `<button type="button" class="ctimadd" id="ctPick">${IC.img}<span>Añadir</span></button>` : '');
    $('ctImgHint').textContent = '';
  }

  function counter() {
    const txt = form.copy.value + (form.hashtags.value ? '\n\n' + form.hashtags.value : ''), n = txt.length;
    const sel = [...form.querySelectorAll('[name=net]:checked')].map((c) => c.value).filter((k) => LIMITS[k]);
    $('ctCount').innerHTML = `${fmt(n)} caracteres` + sel.map((k) => `<span class="${n > LIMITS[k] ? 'over' : ''}">${esc(NETS[k].label)} ${fmt(n)}/${fmt(LIMITS[k])}</span>`).join('');
  }

  function renderChecks(ck) {
    $('ctChecks').innerHTML = Object.entries(CHECKS).map(([k, l]) => `<label class="ctck"><input type="checkbox" name="ck_${k}"${ck && ck[k] ? ' checked' : ''}><span>${l}</span></label>`).join('');
  }

  function renderTagsets() {
    $('ctTagsets').innerHTML = plan.tagsets.map((t, i) => `<button type="button" class="ctts" data-ts="${i}">${esc(t.name)}</button>`).join('');
  }

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
    form.goal.value = p ? p.goal : '';
    form.place.value = p ? p.place : '';
    form.mentions.value = p ? p.mentions : '';
    form.owner.value = p ? p.owner : '';
    for (const k of ['reach', 'likes', 'comments', 'saves', 'shares']) form['s_' + k].value = p && p.stats[k] != null ? p.stats[k] : '';
    form.querySelectorAll('[name=net]').forEach((c) => { c.checked = !!p && p.networks.includes(c.value); });
    $('ctPilarF').hidden = !plan.pillars.length;
    form.pillar.innerHTML = '<option value="">Sin pilar</option>' + plan.pillars.map((x) => `<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');
    form.pillar.value = p ? p.pillar : '';
    renderChecks(p ? p.check : {}); renderTagsets();
    $('ctDel').hidden = !p; $('ctDup').hidden = !p;
    $('ctDlgT').textContent = p ? 'Editar publicación' : 'Nueva publicación';
    $('ctCmWrap').hidden = !p;
    renderComments(); counter();
  }
  function renderComments() {
    $('ctCms').innerHTML = cur && cur.comments.length ? cur.comments.map((x) => `<div class="ctcm ${x.author === 'cliente' ? 'cl' : ''}"><b>${SH ? (x.author === 'cliente' ? 'Tú' : 'Equipo') : (x.author === 'cliente' ? 'Cliente' : 'Tú')}</b> ${esc(x.body)}</div>`).join('') : '';
  }

  function openNew(date, status) { cur = { id: null, images: [], comments: [] }; fill(null); if (date) form.date.value = date; if (status) form.status.value = status; renderImgs(); dlg.showModal(); form.title.focus(); }
  function openEdit(p) { cur = JSON.parse(JSON.stringify(p)); fill(p); renderImgs(); lock(); dlg.showModal(); }
  function lock() {
    form.querySelectorAll('input,select,textarea,button').forEach((el) => { if (el.id === 'ctCmIn' || el.id === 'ctCmBtn' || el.hasAttribute('data-close')) return; if (RO) el.disabled = true; });
    form.querySelectorAll('footer .btn:not([data-close])').forEach((b) => { if (RO) b.hidden = true; });
    if (RO) { $('ctCmWrap').hidden = !cur.id; $('ctImgs').classList.add('ro'); }
  }

  function formData() {
    const check = {}; Object.keys(CHECKS).forEach((k) => { check[k] = form['ck_' + k].checked; });
    const stats = {}; ['reach', 'likes', 'comments', 'saves', 'shares'].forEach((k) => { stats[k] = form['s_' + k].value; });
    return { title: form.title.value, date: form.date.value, time: form.time.value, format: form.format.value, status: form.status.value, copy: form.copy.value, hashtags: form.hashtags.value, link: form.link.value, notes: form.notes.value, goal: form.goal.value, place: form.place.value, mentions: form.mentions.value, owner: form.owner.value, pillar: form.pillar.value, check, stats, networks: [...form.querySelectorAll('[name=net]:checked')].map((c) => c.value) };
  }

  // La publicación se crea al subir la primera imagen, para poder asociarla.
  async function ensureSaved() {
    if (cur.id) return;
    const d = formData();
    if (!d.title.trim()) d.title = 'Sin título';
    cur.id = (await api('POST', `${BASE}/posts`, d)).id; cur.created = true;
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
        const r = await api('POST', `${BASE}/posts/${cur.id}/images`, null, await shrink(list[n]));
        cur.images.push(r.id); renderImgs();
      }
      $('ctImgHint').textContent = '';
    } catch { toast('No se pudo subir una imagen.'); renderImgs(); }
  }

  dlg.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) { dlg.close(); return; }
    if (e.target.closest('#ctPick')) { $('ctFile').click(); return; }
    const ts = e.target.closest('[data-ts]');
    if (ts) { const t = plan.tagsets[+ts.dataset.ts].tags; form.hashtags.value = (form.hashtags.value ? form.hashtags.value.trim() + ' ' : '') + t; counter(); return; }
    const rm = e.target.closest('[data-rm]');
    if (rm) { try { await api('DELETE', `${BASE}/posts/${cur.id}/images/${rm.dataset.rm}`); cur.images = cur.images.filter((x) => x !== rm.dataset.rm); renderImgs(); } catch { toast('No se pudo quitar.'); } return; }
    const mv = e.target.closest('[data-mv]');
    if (mv) {
      const [k, dir] = mv.dataset.mv.split(':').map(Number), a = cur.images;
      [a[k], a[k + dir]] = [a[k + dir], a[k]]; renderImgs();
      try { await api('PUT', `${BASE}/posts/${cur.id}/order`, { ids: a }); } catch { toast('No se pudo guardar el orden.'); }
    }
  });
  $('ctFile').addEventListener('change', (e) => { upload(e.target.files); e.target.value = ''; });
  form.copy.addEventListener('input', counter); form.hashtags.addEventListener('input', counter);
  form.querySelectorAll('[name=net]').forEach((c) => c.addEventListener('change', counter));
  dlg.addEventListener('close', () => { if (cur && cur.created && !cur.saved) load(); });

  $('ctCmBtn').addEventListener('click', async () => {
    const v = $('ctCmIn').value.trim();
    if (!v || !cur.id) return;
    try { const r = await api('POST', `${BASE}/posts/${cur.id}/notes`, { body: v }); cur.comments.push(r.comment); $('ctCmIn').value = ''; renderComments(); } catch { toast('No se pudo enviar.'); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const d = formData();
      if (cur.id) await api('PUT', `${BASE}/posts/${cur.id}`, d); else await api('POST', `${BASE}/posts`, d);
      cur.saved = true; dlg.close(); await load();
    } catch { toast('No se pudo guardar.'); }
  });

  $('ctDel').addEventListener('click', async () => {
    if (!confirm('¿Borrar esta publicación y sus imágenes?')) return;
    try { await api('DELETE', `${BASE}/posts/${cur.id}`); cur.saved = true; dlg.close(); await load(); } catch { toast('No se pudo borrar.'); }
  });
  $('ctDup').addEventListener('click', async () => {
    try { await api('PUT', `${BASE}/posts/${cur.id}`, formData()); const r = await api('POST', `${BASE}/posts/${cur.id}/duplicate`); cur.saved = true; dlg.close(); await load(); const p = posts.find((x) => x.id === r.id); if (p) openEdit(p); } catch { toast('No se pudo duplicar.'); }
  });

  /* ---------- estrategia: pilares y grupos de hashtags ---------- */
  /* ---------- campañas ---------- */
  const cdlg = $('ctCampDlg');
  const campRows = () => {
    $('ctCamps').innerHTML = camps.map((k, i) => `<div class="ctprow camp"><input type="color" value="${esc(k.color)}" data-kc="${i}" aria-label="Color"><input type="text" value="${esc(k.name)}" maxlength="60" data-kn="${i}" placeholder="Ej.: Black Friday" aria-label="Nombre"><input type="date" value="${esc(k.start)}" data-ks="${i}" aria-label="Desde"><input type="date" value="${esc(k.end)}" data-ke="${i}" aria-label="Hasta">${RO ? '' : `<button type="button" class="iconbtn" data-kd="${i}" aria-label="Quitar">×</button>`}</div>`).join('') || '<p class="muted small">Sin campañas.</p>';
    cdlg.querySelectorAll('input').forEach((el) => { el.disabled = RO; });
    $('ctCampAdd').hidden = RO; cdlg.querySelector('[type=submit]').hidden = RO;
  };
  const campSync = () => {
    cdlg.querySelectorAll('[data-kn]').forEach((i) => { camps[+i.dataset.kn].name = i.value; });
    cdlg.querySelectorAll('[data-kc]').forEach((i) => { camps[+i.dataset.kc].color = i.value; });
    cdlg.querySelectorAll('[data-ks]').forEach((i) => { camps[+i.dataset.ks].start = i.value; });
    cdlg.querySelectorAll('[data-ke]').forEach((i) => { camps[+i.dataset.ke].end = i.value; });
  };
  $('ctCamp').addEventListener('click', () => { campRows(); cdlg.showModal(); });
  cdlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { cdlg.close(); load(); return; }
    if (RO) return;
    campSync();
    if (e.target.closest('#ctCampAdd')) { const t = isoOf(new Date(cy, cm, 1)); camps.push({ name: '', color: '#8e5bd6', start: t, end: t }); campRows(); return; }
    const kd = e.target.closest('[data-kd]'); if (kd) { camps.splice(+kd.dataset.kd, 1); campRows(); }
  });
  $('ctCampForm').addEventListener('submit', async (e) => {
    e.preventDefault(); campSync();
    try { camps = (await api('PUT', `${BASE}/campaigns`, { campaigns: camps })).campaigns; cdlg.close(); render(); } catch { toast('No se pudo guardar.'); }
  });

  /* ---------- enlace para el cliente ---------- */
  const sdlg = $('ctShareDlg');
  if (!SH) {
  const MODES = [['edit', 'Trabajar juntos (ver y editar todo)'], ['view', 'Solo ver']];
  const modeRadios = () => (modeOk ? `<div class="ctmodes" role="radiogroup" aria-label="Permiso del cliente">${MODES.map(([k, l]) => `<label class="ctmode"><input type="radio" name="ctmode" value="${k}"${(mode === k || (k === 'edit' && mode !== 'view')) ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>` : '');
  function renderShare() {
    const body = $('ctShareBody');
    if (!token) {
      body.innerHTML = `${modeRadios()}<footer><span class="spacer"></span><button class="btn primary" type="button" id="ctOn">Crear enlace</button></footer>`;
      body.querySelectorAll('[name=ctmode]').forEach((r) => r.addEventListener('change', () => { mode = r.value; }));
      $('ctOn').onclick = async () => { try { const r = await api('POST', `${BASE}/share`, { on: true, mode }); token = r.token; mode = r.mode; renderShare(); } catch { toast('No se pudo crear.'); } };
      return;
    }
    const url = location.origin + '/c/' + token;
    body.innerHTML = `<label class="field"><span>Enlace</span><input type="text" id="ctUrl" readonly value="${esc(url)}"></label>${modeRadios()}
<footer><button class="btn danger" type="button" id="ctOff">Desactivar</button><span class="spacer"></span><button class="btn" type="button" id="ctNew">Cambiar enlace</button><button class="btn primary" type="button" id="ctCopy">Copiar</button><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Abrir</a></footer>`;
    body.querySelectorAll('[name=ctmode]').forEach((r) => r.addEventListener('change', async () => { try { mode = (await api('POST', `${BASE}/share`, { mode: r.value })).mode; toast('Permiso actualizado'); } catch { toast('No se pudo cambiar.'); } }));
    $('ctCopy').onclick = async () => { try { await navigator.clipboard.writeText(url); } catch { $('ctUrl').select(); document.execCommand('copy'); } toast('Enlace copiado'); };
    $('ctOff').onclick = async () => { try { await api('POST', `${BASE}/share`, { on: false }); token = null; renderShare(); } catch { toast('No se pudo.'); } };
    $('ctNew').onclick = async () => { if (!confirm('El enlace anterior dejará de funcionar. ¿Continuar?')) return; try { token = (await api('POST', `${BASE}/share`, { on: true, renew: true })).token; renderShare(); } catch { toast('No se pudo.'); } };
  }
  sdlg.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) sdlg.close(); });
  $('ctShare').addEventListener('click', () => { renderShare(); sdlg.showModal(); });
  }

  /* ---------- eventos ---------- */
  $('ctAdd').addEventListener('click', () => openNew('', ''));
  document.querySelectorAll('[data-cv]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.cv; lsSet('picfy_ct_view', view); render(); }));
  $('ctChips').addEventListener('click', (e) => { const b = e.target.closest('[data-st]'); if (b) { fSt = b.dataset.st; render(); } });
  $('ctFNet').addEventListener('change', (e) => { fNet = e.target.value; render(); });
  $('ctFPil').addEventListener('change', (e) => { fPil = e.target.value; render(); });
  $('ctFOwn').addEventListener('change', (e) => { fOwn = e.target.value; render(); });
  $('ctQ').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); render(); });
  board.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) { openNew(add.dataset.add, ''); return; }
    const c = e.target.closest('[data-id]');
    if (c) { const p = posts.find((x) => x.id === c.dataset.id); if (p) openEdit(p); }
  });

  /* arrastrar: cambiar de día (mes) o de estado (tablero) */
  let dragId = null;
  board.addEventListener('dragstart', (e) => { if (RO) { e.preventDefault(); return; } const c = e.target.closest('[data-id]'); if (!c) return; dragId = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch { /* sin datos */ } c.classList.add('drag'); });
  board.addEventListener('dragend', () => { dragId = null; board.querySelectorAll('.drag, .over').forEach((x) => x.classList.remove('drag', 'over')); });
  board.addEventListener('dragover', (e) => { const t = e.target.closest('.ctcell:not(.off), .cttray, .ctcol'); if (t && dragId) { e.preventDefault(); board.querySelectorAll('.over').forEach((x) => x !== t && x.classList.remove('over')); t.classList.add('over'); } });
  board.addEventListener('drop', async (e) => {
    const t = e.target.closest('.ctcell:not(.off), .cttray, .ctcol'); if (!t || !dragId) return;
    e.preventDefault();
    const id = dragId, body = t.dataset.status ? { status: t.dataset.status } : { date: t.dataset.day };
    const p = posts.find((x) => x.id === id); if (!p) return;
    try { await api('PUT', `${BASE}/posts/${id}`, body); Object.assign(p, body.status ? { status: body.status } : { date: body.date, time: body.date ? p.time : '' }); render(); } catch { toast('No se pudo mover.'); }
  });
  load();
})();
