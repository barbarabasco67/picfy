(() => {
  const B = document.body, tid = B.dataset.torneo; if (!tid) return;
  const kinds = JSON.parse(B.dataset.kinds || '{}');
  const root = document.getElementById('tSedes');
  const api = async (m, u, b) => { const r = await fetch(u, { method: m, headers: { 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(r.status); return r.json(); };
  const h = (tag, a, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
  const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sin fecha';
  let data = { sedes: [] };

  // Editar tarea
  const taskDlg = document.getElementById('taskDlg'), taskForm = document.getElementById('taskForm'); let editing = null;
  function editTask(t, s) {
    editing = t; const f = taskForm;
    f.title.value = t.title; f.kind.value = t.kind in kinds ? t.kind : Object.keys(kinds)[0]; f.date.value = t.date || ''; f.time.value = t.time || ''; f.notes.value = t.notes || '';
    f.creador_id.replaceChildren(h('option', { value: '' }, 'Toda la sede'), ...s.creadores.map((c) => h('option', { value: c.id }, c.name))); f.creador_id.value = t.creador_id || '';
    taskDlg.showModal();
  }
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = taskForm; if (!editing || !f.title.value.trim()) return;
    await api('PUT', '/api/tareas/' + editing.id, { title: f.title.value, kind: f.kind.value, date: f.date.value, time: f.time.value, notes: f.notes.value, creador_id: f.creador_id.value });
    taskDlg.close(); load();
  });

  // Pedir que se repita
  const retryDlg = document.getElementById('retryDlg'), retryForm = document.getElementById('retryForm'); let retrying = null;
  function askRetry(t) { retrying = t; document.getElementById('retryTitle').textContent = t.title; retryForm.note.value = ''; retryDlg.showModal(); }
  retryForm.addEventListener('submit', async (e) => { e.preventDefault(); if (!retrying || !retryForm.note.value.trim()) return; await api('POST', `/api/tareas/${retrying.id}/devolver`, { note: retryForm.note.value }); retryDlg.close(); load(); });

  // Editar torneo
  const tDlg = document.getElementById('torneoDlg'), tForm = document.getElementById('torneoForm'); let coverFile = null, coverDel = false;
  document.getElementById('editTorneo').addEventListener('click', () => tDlg.showModal());
  const pick = document.getElementById('tcPick');
  if (pick) {
    const file = document.getElementById('tcFile'), prev = document.getElementById('tcPrev'), del = document.getElementById('tcDel');
    pick.addEventListener('click', () => file.click());
    file.addEventListener('change', () => { const f = file.files[0]; if (!f) return; coverFile = f; coverDel = false; prev.src = URL.createObjectURL(f); prev.hidden = false; del.hidden = false; });
    del.addEventListener('click', () => { coverFile = null; coverDel = true; prev.hidden = true; del.hidden = true; });
  }
  const shrink = (file) => new Promise((res, rej) => {
    const img = new Image(); img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob((b) => (b ? res(b) : rej(new Error('img'))), 'image/jpeg', 0.85); };
    img.onerror = () => rej(new Error('img')); img.src = URL.createObjectURL(file);
  });
  tForm.addEventListener('submit', async (e) => {
    e.preventDefault(); const f = tForm; if (!f.name.value.trim()) return;
    const body = { name: f.name.value }; if (f.description) Object.assign(body, { description: f.description.value, start_date: f.start_date.value, end_date: f.end_date.value, color: (f.querySelector('input[name=color]:checked') || {}).value });
    await api('PUT', '/api/torneos/' + tid, body);
    if (coverDel) await fetch(`/api/torneos/${tid}/portada`, { method: 'DELETE' });
    if (coverFile) { try { const blob = await shrink(coverFile); await fetch(`/api/torneos/${tid}/portada`, { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob }); } catch (x) { /* sin portada */ } }
    location.reload();
  });
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); }));

  const load = async () => { data = await api('GET', '/api/torneos/' + tid); draw(); };


  // Panel de progreso: cuánto va hecho, qué se retrasa y quién lo lleva
  const todayStr = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function bar(a, b, cls) { const i = h('i', { class: 'tpgbar' + (cls ? ' ' + cls : '') }); const u = h('u', {}); u.style.width = pct(a, b) + '%'; i.append(u); return i; }
  function progress() {
    const all = data.sedes.flatMap((s) => s.tareas.map((t) => ({ ...t, sede: s })));
    if (!all.length) return null;
    const today = todayStr();
    const late = (t) => !t.done && t.date && t.date < today;
    const done = all.filter((t) => t.done).length, lateN = all.filter(late).length, todayN = all.filter((t) => !t.done && t.date === today).length;
    const retryN = all.filter((t) => t.retry && !t.done).length, files = all.reduce((n, t) => n + (t.entregas || []).length, 0);
    const P = pct(done, all.length), R = 42, C = 2 * Math.PI * R;
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ring.setAttribute('viewBox', '0 0 100 100'); ring.setAttribute('class', 'tpgring');
    ring.innerHTML = `<circle cx="50" cy="50" r="${R}" class="bg"/><circle cx="50" cy="50" r="${R}" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - P / 100)}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle">${P}%</text>`;
    const stat = (n, label, cls) => h('div', { class: 'tpgstat' + (cls ? ' ' + cls : '') }, h('b', {}, String(n)), h('span', {}, label));
    const rows = [];
    for (const s of data.sedes) {
      const d = s.tareas.filter((t) => t.done).length, l = s.tareas.filter(late).length;
      if (s.tareas.length) rows.push(h('div', { class: 'tpgrow' }, h('span', { class: 'n' }, s.name), bar(d, s.tareas.length, l ? 'warn' : ''), h('span', { class: 'v' }, `${d}/${s.tareas.length}`), l ? h('span', { class: 'tpgl' }, `${l} con retraso`) : h('span', { class: 'tpgl ok' }, d === s.tareas.length ? 'Completa' : '')));
    }
    const crows = [];
    for (const s of data.sedes) for (const c of s.creadores) {
      const mine = s.tareas.filter((t) => t.creador_id === c.id); if (!mine.length) continue;
      const d = mine.filter((t) => t.done).length, l = mine.filter(late).length, f = mine.reduce((n, t) => n + (t.entregas || []).length, 0);
      crows.push({ l, d, n: mine.length, el: h('div', { class: 'tpgrow' }, h('span', { class: 'n' }, c.name, h('small', {}, s.name)), bar(d, mine.length, l ? 'warn' : ''), h('span', { class: 'v' }, `${d}/${mine.length}`), h('span', { class: 'tpgl' + (l ? '' : ' ok') }, l ? `${l} con retraso` : f ? `${f} ${f === 1 ? 'archivo' : 'archivos'}` : '')) });
    }
    crows.sort((a, b) => b.l - a.l || (a.d / a.n) - (b.d / b.n));
    const lateList = all.filter(late).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    const who = (t) => { const c = t.creador_id && t.sede.creadores.find((x) => x.id === t.creador_id); return c ? c.name : 'Toda la sede'; };
    return h('section', { class: 'glass tpg' },
      h('div', { class: 'tpgtop' }, ring, h('div', { class: 'tpgstats' }, stat(done, 'Hechas'), stat(all.length - done, 'Pendientes'), stat(lateN, 'Con retraso', lateN ? 'bad' : ''), stat(todayN, 'Para hoy'), stat(retryN, 'A repetir', retryN ? 'warn' : ''), stat(files, 'Archivos'))),
      lateList.length ? h('div', { class: 'tpgbox' }, h('h3', {}, 'Con retraso'), h('ul', { class: 'tpgwait' }, lateList.map((t) => h('li', {}, h('b', {}, t.title), h('span', {}, `${t.sede.name} · ${who(t)} · ${fmt(t.date)}`))))) : null,
      h('div', { class: 'tpgcols' }, h('div', { class: 'tpgbox' }, h('h3', {}, 'Por sede'), ...rows), crows.length ? h('div', { class: 'tpgbox' }, h('h3', {}, 'Por creador'), ...crows.map((c) => c.el)) : null));
  }


  // Calendario: un día cada vez, una columna por sede y cada tarea en su hora
  let view = 'sedes', calDay = '';
  try { view = localStorage.getItem('picfy_tview_' + tid) === 'cal' ? 'cal' : 'sedes'; } catch (e) { /* sin almacenamiento */ }
  const setView = (v) => { view = v; try { localStorage.setItem('picfy_tview_' + tid, v); } catch (e) { /* nada */ } draw(); };
  const HOUR = 60, mins = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const dayLong = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  function viewbar() {
    const seg = (v, label) => h('button', { type: 'button', class: view === v ? 'on' : '', 'aria-pressed': String(view === v), onclick: () => setView(v) }, label);
    return h('div', { class: 'tviewbar' }, h('div', { class: 'tseg' }, seg('sedes', 'Sedes'), seg('cal', 'Calendario')));
  }
  function calendar() {
    const all = data.sedes.flatMap((s) => s.tareas.map((t) => ({ t, s }))).filter((x) => x.t.date);
    if (!all.length) return h('div', { class: 'glass emptybox' }, 'Cuando pongas fecha a las tareas, aparecerán aquí por día y por hora.');
    const days = [...new Set(all.map((x) => x.t.date))].sort(), today = todayStr();
    if (!days.includes(calDay)) calDay = days.includes(today) ? today : (days.find((d) => d >= today) || days[days.length - 1]);
    const tabs = h('div', { class: 'tcaltabs', role: 'tablist' }, days.map((d) => {
      const n = all.filter((x) => x.t.date === d).length, late = all.some((x) => x.t.date === d && !x.t.done && d < today);
      return h('button', { type: 'button', role: 'tab', class: 'tcaltab' + (d === calDay ? ' on' : '') + (d === today ? ' today' : ''), 'aria-selected': String(d === calDay), onclick: () => { calDay = d; draw(); } },
        h('span', {}, new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' })), h('b', {}, new Date(d + 'T12:00:00').getDate()), h('small', {}, `${n} ${n === 1 ? 'tarea' : 'tareas'}`), late ? h('i', { class: 'dot' }) : null);
    }));
    const dayTasks = all.filter((x) => x.t.date === calDay);
    const timed = dayTasks.filter((x) => mins(x.t.time) !== null), untimed = dayTasks.filter((x) => mins(x.t.time) === null);
    let lo = 8 * 60, hi = 21 * 60;
    for (const x of timed) { const m = mins(x.t.time); lo = Math.min(lo, Math.floor(m / 60) * 60); hi = Math.max(hi, Math.ceil((m + HOUR) / 60) * 60); }
    const height = ((hi - lo) / 60) * HOUR;
    const gutter = h('div', { class: 'tcalgut', style: `height:${height}px` }); for (let m = lo; m < hi; m += 60) { const l = h('span', {}, hhmm(m)); l.style.top = ((m - lo) / 60) * HOUR + 'px'; gutter.append(l); }
    const cols = data.sedes.map((s) => {
      const mine = timed.filter((x) => x.s.id === s.id).sort((a, b) => mins(a.t.time) - mins(b.t.time));
      const body = h('div', { class: 'tcalbody', style: `height:${height}px` });
      let cluster = [], end = -1; const flush = () => { const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1)); cluster.forEach((c) => { c.el.style.width = `calc(${100 / lanes}% - 4px)`; c.el.style.left = `calc(${(100 / lanes) * c.lane}% + 2px)`; }); cluster = []; };
      const laneEnd = [];
      for (const x of mine) {
        const m = mins(x.t.time);
        if (m >= end && cluster.length) { flush(); laneEnd.length = 0; }
        let lane = laneEnd.findIndex((e) => e <= m); if (lane < 0) { lane = laneEnd.length; laneEnd.push(0); } laneEnd[lane] = m + HOUR; end = Math.max(end, m + HOUR);
        const k = kinds[x.t.kind] || { color: '#999', label: x.t.kind }, c = x.s.creadores.find((c) => c.id === x.t.creador_id);
        const late = !x.t.done && x.t.date < today;
        const el = h('button', { type: 'button', class: 'tcalev' + (x.t.done ? ' done' : '') + (late ? ' late' : ''), style: `--c:${k.color};top:${((m - lo) / 60) * HOUR}px;height:${HOUR - 4}px`, title: `${x.t.title} · ${c ? c.name : 'Toda la sede'}`, onclick: () => editTask(x.t, x.s) },
          h('b', {}, x.t.time), h('span', { class: 't' }, x.t.title), h('small', {}, (c ? c.name : 'Toda la sede') + (x.t.done ? ' · Hecha' : late ? ' · Con retraso' : '')));
        body.append(el); cluster.push({ el, lane });
      }
      if (cluster.length) flush();
      if (calDay === today) { const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' })); const nm = now.getHours() * 60 + now.getMinutes(); if (nm >= lo && nm <= hi) { const ln = h('i', { class: 'tcalnow' }); ln.style.top = ((nm - lo) / 60) * HOUR + 'px'; body.append(ln); } }
      const un = untimed.filter((x) => x.s.id === s.id);
      return {
        head: h('header', { class: 'tcalch' }, h('b', {}, s.name), h('small', {}, `${dayTasks.filter((x) => x.s.id === s.id).length} ${dayTasks.filter((x) => x.s.id === s.id).length === 1 ? 'tarea' : 'tareas'}`)),
        un: h('div', { class: 'tcalun' }, un.map((x) => { const k = kinds[x.t.kind] || { color: '#999' }, c = x.s.creadores.find((c) => c.id === x.t.creador_id); return h('button', { type: 'button', class: 'tcalev flat' + (x.t.done ? ' done' : ''), style: `--c:${k.color}`, onclick: () => editTask(x.t, x.s) }, h('span', { class: 't' }, x.t.title), h('small', {}, (c ? c.name : 'Toda la sede') + (x.t.done ? ' · Hecha' : ''))); })),
        body,
      };
    });
    const hasUn = untimed.length > 0, cell = (cls, ...kids) => h('div', { class: 'tcalcell ' + cls }, ...kids);
    const cells = [cell('gut head'), ...cols.map((c) => c.head)];
    if (hasUn) cells.push(cell('gut un', h('span', { class: 'lab' }, 'Sin hora')), ...cols.map((c) => c.un));
    cells.push(cell('gut', gutter), ...cols.map((c) => c.body));
    return h('section', { class: 'glass tcal' }, h('h2', { class: 'tcalday' }, dayLong(calDay)), tabs, h('div', { class: 'tcalscroll' }, h('div', { class: 'tcalgrid', style: `--n:${Math.max(1, data.sedes.length)}` }, ...cells)));
  }

  function draw() {
    const top = data.galerias ? [h('div', { class: 'glass tgalbar' }, galSelect('Galería del torneo', data.galeria, data.galerias.filter((g) => !g.parent_id), (v) => api('PUT', `/api/torneos/${tid}/galeria`, { event_id: v }), 'Crear galería del torneo'))] : [];
    root.replaceChildren(...[progress()].filter(Boolean), viewbar(), ...(view === 'cal' ? [calendar()] : [...top, ...data.sedes.map(sedeCard)]));
    if (!data.sedes.length && view !== 'cal') root.append(h('div', { class: 'glass emptybox' }, 'Añade la primera sede.'));
  }

  const KEY = 'picfy_sedes_cerradas';
  const closed = (() => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } })();
  const saveClosed = () => { try { localStorage.setItem(KEY, JSON.stringify([...closed])); } catch (e) {} };
  const bytes = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const PAL = ['#e5604f', '#2f9e6f', '#4a63d6', '#c9376e', '#1f9fb3', '#8e5bd6', '#e5964c', '#6b7280'];

  function svgi(path) { const v = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); v.setAttribute('viewBox', '0 0 24 24'); v.setAttribute('fill', 'none'); v.setAttribute('stroke', 'currentColor'); v.setAttribute('stroke-width', '2'); v.setAttribute('stroke-linecap', 'round'); v.setAttribute('stroke-linejoin', 'round'); v.innerHTML = path; return v; }
  function ico(path, label, fn) { const b = h('button', { type: 'button', class: 'ib', title: label, 'aria-label': label, onclick: fn }); b.append(svgi(path)); return b; }
  /* ----- Galería de la sede: enviar fotos como borrador ----- */
  const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (buf) => { const u = new Uint8Array(buf); let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = crcT[(c ^ u[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const scaled = (img, side, q) => new Promise((res) => { const k = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight)); const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); cv.toBlob(res, 'image/jpeg', q); });
  const loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const toast = (msg) => { const t = h('div', { class: 'ttoast' }, msg); document.body.append(t); setTimeout(() => t.remove(), 3500); };

  async function sendPhoto(f, sede) {
    const name = f.filename;
    const g = await api('GET', `/api/sedes/${sede.id}/galeria`).catch(() => null);
    if (!g) { toast('Esta sede no tiene galería'); return; }
    const src = await (await fetch(`/api/entregas/${f.id}/archivo`)).blob();
    const url = URL.createObjectURL(src);
    const res = await window.PicfyEdit.open(url, name, 'Enviar como borrador');
    if (!res) { URL.revokeObjectURL(url); return; }
    toast('Enviando…');
    let ou = url;
    try {
      const o = res.edited ? res.blob : src;
      if (res.edited) ou = URL.createObjectURL(o);
      const im = await loadImg(ou);
      const [m, l] = await Promise.all([scaled(im, 480, 0.8), scaled(im, 1600, 0.85)]);
      const buf = await o.arrayBuffer();
      const rid = f.creador_id || sede.id, key = rid + rid;
      const creador = sede.creadores.find((c) => c.id === f.creador_id);
      const base = `/api/e/${g.token}`;
      const jh = { 'content-type': 'application/json' };
      const type = res.edited ? 'image/jpeg' : (src.type || 'image/jpeg');
      const ext = res.edited ? '.jpg' : (name.match(/\.[^.]+$/) || ['.jpg'])[0];
      const init = await fetch(`${base}/upload/init`, { method: 'POST', headers: jh, body: JSON.stringify({ key, name: creador ? creador.name : sede.name, filename: name.replace(/\.[^.]+$/, '') + ext, type, size: o.size, w: im.naturalWidth, h: im.naturalHeight, crc: crc32(buf), consent: true }) }).then((r) => r.json());
      if (!init.id) throw new Error('init');
      for (const [sz, bl] of [['m', m], ['l', l], ['o', o]]) { const r = await fetch(`${base}/upload/${init.id}/${sz}`, { method: 'PUT', headers: { 'x-picfy-key': key }, body: bl }); if (!r.ok) throw new Error(sz); }
      const done = await fetch(`${base}/upload/${init.id}/commit`, { method: 'POST', headers: jh, body: JSON.stringify({ key, draft: true }) }).then((r) => r.json());
      if (!done.ok) throw new Error('commit');
      await api('POST', `/api/entregas/${f.id}/enviada`, { photo: init.id });
      toast('Enviada a la galería como borrador');
    } catch (e) { toast('No se pudo enviar la foto'); }
    if (ou !== url) URL.revokeObjectURL(ou);
    URL.revokeObjectURL(url);
    load();
  }

  function galSelect(label, current, options, onPick, newLabel) {
    const sel = h('select', { 'aria-label': label, onchange: async (e) => { await onPick(e.target.value); load(); } },
      h('option', { value: '' }, 'Sin galería'), options.map((o) => h('option', { value: o.id, selected: o.id === current }, (o.parent_id ? '↳ ' : '') + o.name)),
      h('option', { value: 'new' }, newLabel));
    return h('label', { class: 'tgalsel' }, h('span', {}, label), sel, current ? h('a', { class: 'tgalgo', href: '/galerias/' + current }, 'Abrir') : null);
  }

  function taskList(list, sede) {
    const days = [...new Set(list.map((t) => t.date))].sort((a, b) => (a || '9').localeCompare(b || '9'));
    return days.map((d) => h('div', { class: 'tdaybox' }, h('h4', { class: 'tday' }, fmt(d)), h('ul', { class: 'ttasks' }, list.filter((t) => t.date === d).map((t) => {
      const k = kinds[t.kind] || { color: '#999', label: t.kind };
      const files = t.entregas || [];
      return h('li', { class: (t.done ? 'done' : '') + (t.retry && !t.done ? ' retry' : '') },
        h('input', { type: 'checkbox', checked: !!t.done, 'aria-label': 'Hecha', onchange: async (e) => { await api('PUT', '/api/tareas/' + t.id, { done: e.target.checked ? 1 : 0 }); load(); } }),
        h('div', { class: 'tbd' },
          h('div', { class: 'tmain' }, h('span', { class: 'tkind', style: `--c:${k.color}` }, k.label), h('span', { class: 't' }, t.title, t.time ? h('small', {}, ' · ' + t.time) : null)),
          t.retry && !t.done || t.done && t.done_by || files.length ? h('div', { class: 'tmeta' },
            t.retry && !t.done ? h('span', { class: 'tretry', title: t.retry_note || '' }, 'Repetir') : null,
            t.done && t.done_by ? h('span', { class: 'by' }, t.done_by === 'hub' ? 'Hecha' : 'Hecha por ' + t.done_by) : null,
            files.length ? h('button', { type: 'button', class: 'tfiles', onclick: (e) => { const ul = e.target.closest('li').querySelector('.tfl'); ul.hidden = !ul.hidden; } }, `${files.length} ${files.length === 1 ? 'archivo' : 'archivos'}`) : null) : null,
          t.retry && !t.done && t.retry_note ? h('p', { class: 'tnote' }, t.retry_note) : null),
        h('div', { class: 'tacts' },
          t.done ? ico('<path d="M20 11a8 8 0 00-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0014.5 4.5L20 16"/><path d="M20 20v-4h-4"/>', 'Devolver al creador', () => askRetry(t)) : null,
          ico('<path d="M4 20h4L19 9l-4-4L4 16v4z"/>', 'Editar tarea', () => editTask(t, sede)),
          ico('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', 'Borrar tarea', async () => { await api('DELETE', '/api/tareas/' + t.id); load(); })),
        files.length ? h('ul', { class: 'tfl', hidden: true }, files.map((f) => {
          const isImg = /^image\//.test(f.mime || '');
          return h('li', {},
            isImg ? h('img', { class: 'fth', loading: 'lazy', alt: '', src: `/api/entregas/${f.id}/archivo` }) : h('span', { class: 'fth vid' }, 'Vídeo'),
            h('a', { href: `/api/entregas/${f.id}/archivo`, target: '_blank', rel: 'noopener', class: 'fn' }, f.filename), h('small', {}, bytes(f.size)),
            isImg && f.sent_id ? h('span', { class: 'fsent', title: 'Enviada a la galería como borrador' }, 'Enviada') : null,
            isImg && sede.event_id && !f.sent_id ? ico('<path d="M5 12l5 5L20 7"/><path d="M4 20h16"/>', 'Enviar a la galería', () => sendPhoto(f, sede)) : null,
            h('a', { href: `/api/entregas/${f.id}/archivo?dl=1`, class: 'ib', title: 'Descargar', 'aria-label': 'Descargar' }, svgi('<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>')),
            ico('<path d="M6 6l12 12M18 6L6 18"/>', 'Borrar archivo', async () => { if (confirm('¿Borrar ' + f.filename + '?')) { await api('DELETE', '/api/entregas/' + f.id); load(); } }));
        })) : null);
    }))));
  }

  // Descargar todas las entregas de una sede o de un creador en zip (en partes si pesan mucho)
  async function dlZip(sedeId, creador) {
    try {
      const q = creador ? '&creador=' + creador : '';
      const info = await api('GET', `/api/sedes/${sedeId}/zip?info=1${q}`);
      if (!info.parts) return;
      for (let k = 1; k <= info.parts; k++) setTimeout(() => { const a = document.createElement('a'); a.href = `/api/sedes/${sedeId}/zip?part=${k}${q}`; document.body.append(a); a.click(); a.remove(); }, (k - 1) * 900);
    } catch (x) { alert('No se ha podido preparar la descarga.'); }
  }

  function personBox(name, color, list, extra, sede) {
    const done = list.filter((t) => t.done).length;
    return h('article', { class: 'tcreator', style: `--pc:${color}` },
      h('header', {}, h('span', { class: 'tdot' }), h('h3', {}, name), h('span', { class: 'tprog' }, `${done}/${list.length}`), extra),
      list.length ? taskList(list, sede) : h('p', { class: 'tnone' }, 'Sin tareas'));
  }

  // Vistazo de la sede: avance, creadores, archivos, retrasos y lo siguiente que toca
  function sedeSummary(s) {
    const today = todayStr(), total = s.tareas.length, done = s.tareas.filter((t) => t.done).length;
    const late = s.tareas.filter((t) => !t.done && t.date && t.date < today).length, files = s.tareas.reduce((n, t) => n + (t.entregas || []).length, 0);
    const next = s.tareas.filter((t) => !t.done && t.date && t.date >= today).sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')))[0];
    const chip = (txt, cls) => h('span', { class: 'tschip' + (cls ? ' ' + cls : '') }, txt);
    const n = s.creadores.length;
    return h('div', { class: 'tsum' },
      total ? h('div', { class: 'tsumbar' }, bar(done, total, late ? 'warn' : ''), h('b', {}, pct(done, total) + '%')) : null,
      h('div', { class: 'tschips' },
        chip(`${n} ${n === 1 ? 'creador' : 'creadores'}`), chip(`${total} ${total === 1 ? 'tarea' : 'tareas'}`), chip(`${files} ${files === 1 ? 'archivo' : 'archivos'}`),
        late ? chip(`${late} con retraso`, 'bad') : (total && done === total ? chip('Completa', 'ok') : null),
        next ? chip(`Próxima: ${fmt(next.date)}${next.time ? ' · ' + next.time : ''} · ${next.title}`, 'next') : null));
  }

  function sedeCard(s) {
    const done = s.tareas.filter((t) => t.done).length;
    const card = h('section', { class: 'tsede' + (closed.has(s.id) ? ' closed' : '') });
    const fold = h('button', { class: 'tfold', type: 'button', 'aria-expanded': String(!closed.has(s.id)), 'aria-label': 'Plegar o desplegar la sede', onclick: () => { if (closed.has(s.id)) closed.delete(s.id); else closed.add(s.id); saveClosed(); card.classList.toggle('closed', closed.has(s.id)); fold.setAttribute('aria-expanded', String(!closed.has(s.id))); } },
      h('svg', {}), h('h2', {}, s.name), h('span', { class: 'tprog' }, `${done}/${s.tareas.length}`));
    fold.firstChild.replaceWith(Object.assign(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {}));
    const sv = fold.firstChild; sv.setAttribute('viewBox', '0 0 24 24'); sv.setAttribute('fill', 'none'); sv.setAttribute('stroke', 'currentColor'); sv.setAttribute('stroke-width', '2.2'); sv.setAttribute('stroke-linecap', 'round'); sv.setAttribute('stroke-linejoin', 'round'); sv.innerHTML = '<path d="M6 9l6 6 6-6"/>';
    card.append(h('header', { class: 'tshead' }, fold,
      s.tareas.some((t) => (t.entregas || []).length) ? h('button', { class: 'btn sm tszip', type: 'button', onclick: () => dlZip(s.id) }, 'Descargar entregas') : null,
      s.event_id ? h('a', { class: 'btn primary sm tsopen', href: '/galerias/' + s.event_id }, 'Abrir galería') : null,
      h('button', { class: 'iconbtn', type: 'button', title: 'Borrar sede', 'aria-label': 'Borrar sede', onclick: async () => { if (confirm('¿Borrar la sede con sus tareas y creadores?')) { await api('DELETE', '/api/sedes/' + s.id); load(); } } }, '×')));
    card.append(sedeSummary(s));

    if (data.galerias) card.append(h('div', { class: 'tgalrow' }, galSelect('Galería de la sede', s.event_id, data.galerias.slice().sort((x, y) => (y.parent_id ? 1 : 0) - (x.parent_id ? 1 : 0)), (v) => api('PUT', `/api/sedes/${s.id}/galeria`, { event_id: v }), 'Crear subgalería de la sede')));

    // Cuadros para añadir (separados de las tareas)
    const cf = h('form', { class: 'tform tnewcreator', onsubmit: async (e) => { e.preventDefault(); const v = e.target.name.value.trim(); if (!v) return; await api('POST', `/api/sedes/${s.id}/creadores`, { name: v }); load(); } },
      h('h3', {}, 'Nuevo creador'), h('input', { type: 'text', name: 'name', maxlength: 80, placeholder: 'Nombre', 'aria-label': 'Nombre del creador', required: true }), h('button', { class: 'btn sm', type: 'submit' }, 'Añadir creador'));
    const tf = h('form', { class: 'tform tnewtask', onsubmit: async (e) => {
      e.preventDefault(); const f = e.target; const title = f.title.value.trim(); if (!title) return;
      await api('POST', `/api/sedes/${s.id}/tareas`, { title, kind: f.kind.value, date: f.date.value, time: f.time.value, creador_id: f.creador_id.value });
      load();
    } },
      h('h3', {}, 'Nueva tarea'),
      h('input', { type: 'text', name: 'title', maxlength: 160, placeholder: 'Qué hay que hacer', 'aria-label': 'Tarea', required: true }),
      h('div', { class: 'trow' }, h('select', { name: 'kind', 'aria-label': 'Tipo' }, Object.entries(kinds).map(([k, v]) => h('option', { value: k }, v.label))),
        h('select', { name: 'creador_id', 'aria-label': 'Asignada a' }, h('option', { value: '' }, 'Toda la sede'), s.creadores.map((c) => h('option', { value: c.id }, c.name)))),
      h('div', { class: 'trow' }, h('input', { type: 'date', name: 'date', 'aria-label': 'Fecha' }), h('input', { type: 'time', name: 'time', 'aria-label': 'Hora' })),
      h('button', { class: 'btn primary sm', type: 'submit' }, 'Añadir tarea'));
    card.append(h('div', { class: 'tforms' }, tf, cf));

    // Un cuadro por persona, cada una con su color
    const boxes = h('div', { class: 'tboxes' });
    const general = s.tareas.filter((t) => !t.creador_id || !s.creadores.some((c) => c.id === t.creador_id));
    if (general.length) boxes.append(personBox('Toda la sede', '#14213d', general, null, s));
    s.creadores.forEach((c, i) => boxes.append(personBox(c.name, PAL[i % PAL.length], s.tareas.filter((t) => t.creador_id === c.id),
      h('span', { class: 'tact' },
        s.tareas.some((t) => (t.entregas || []).some((f) => f.creador_id === c.id)) ? ico('<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M5 21h14"/>', 'Descargar sus entregas', () => dlZip(s.id, c.id)) : null,
        h('button', { type: 'button', class: 'tcopy', onclick: async (e) => { const url = location.origin + '/t/' + c.token; try { await navigator.clipboard.writeText(url); } catch (x) { prompt('Copia el enlace', url); } e.target.textContent = 'Copiado'; setTimeout(() => (e.target.textContent = 'Copiar enlace'), 1500); } }, 'Copiar enlace'),
        h('button', { type: 'button', class: 'tx', title: 'Quitar creador', 'aria-label': 'Quitar creador', onclick: async () => { if (confirm('¿Quitar a ' + c.name + '? Su enlace dejará de funcionar.')) { await api('DELETE', '/api/creadores/' + c.id); load(); } } }, '×')), s)));
    if (!boxes.children.length) boxes.append(h('p', { class: 'tnone' }, 'Añade un creador o una tarea para empezar.'));
    card.append(boxes);
    return card;
  }

  document.getElementById('sedeForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const v = e.target.name.value.trim(); if (!v) return;
    await api('POST', `/api/torneos/${tid}/sedes`, { name: v }); e.target.reset(); load();
  });
  load();
})();
