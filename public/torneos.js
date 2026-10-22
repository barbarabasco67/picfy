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

  function draw() {
    root.replaceChildren(...data.sedes.map(sedeCard));
    if (!data.sedes.length) root.append(h('div', { class: 'glass emptybox' }, 'Añade la primera sede.'));
  }

  const KEY = 'picfy_sedes_cerradas';
  const closed = (() => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } })();
  const saveClosed = () => { try { localStorage.setItem(KEY, JSON.stringify([...closed])); } catch (e) {} };
  const bytes = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const PAL = ['#e5604f', '#2f9e6f', '#4a63d6', '#c9376e', '#1f9fb3', '#8e5bd6', '#e5964c', '#6b7280'];

  function taskList(list, sede) {
    const days = [...new Set(list.map((t) => t.date))].sort((a, b) => (a || '9').localeCompare(b || '9'));
    return days.map((d) => h('div', { class: 'tdaybox' }, h('h4', { class: 'tday' }, fmt(d)), h('ul', { class: 'ttasks' }, list.filter((t) => t.date === d).map((t) => {
      const k = kinds[t.kind] || { color: '#999', label: t.kind };
      return h('li', { class: t.done ? 'done' : '' },
        h('input', { type: 'checkbox', checked: !!t.done, 'aria-label': 'Hecha', onchange: async (e) => { await api('PUT', '/api/tareas/' + t.id, { done: e.target.checked ? 1 : 0 }); load(); } }),
        h('span', { class: 'tkind', style: `--c:${k.color}` }, k.label),
        h('span', { class: 't' }, t.title, t.time ? h('small', {}, ' · ' + t.time) : null),
        t.done && t.done_by ? h('span', { class: 'by' }, t.done_by === 'hub' ? 'Hecha' : 'Hecha por ' + t.done_by) : null,
        (t.entregas || []).length ? h('button', { type: 'button', class: 'tfiles', onclick: (e) => { const ul = e.target.closest('li').querySelector('.tfl'); ul.hidden = !ul.hidden; } }, `${t.entregas.length} ${t.entregas.length === 1 ? 'archivo' : 'archivos'}`) : null,
        h('button', { class: 'tx tedit', type: 'button', title: 'Editar tarea', 'aria-label': 'Editar tarea', onclick: () => editTask(t, sede) }, 'Editar'),
        h('button', { class: 'tx', type: 'button', title: 'Borrar tarea', 'aria-label': 'Borrar tarea', onclick: async () => { await api('DELETE', '/api/tareas/' + t.id); load(); } }, '×'),
        (t.entregas || []).length ? h('ul', { class: 'tfl', hidden: true }, t.entregas.map((f) => h('li', {},
          h('a', { href: `/api/entregas/${f.id}/archivo`, target: '_blank', rel: 'noopener' }, f.filename), h('small', {}, bytes(f.size)),
          h('a', { href: `/api/entregas/${f.id}/archivo?dl=1`, class: 'tdl' }, 'Descargar'),
          h('button', { type: 'button', class: 'tx', 'aria-label': 'Borrar archivo', onclick: async () => { if (confirm('¿Borrar ' + f.filename + '?')) { await api('DELETE', '/api/entregas/' + f.id); load(); } } }, '×')))) : null);
    }))));
  }

  function personBox(name, color, list, extra, sede) {
    const done = list.filter((t) => t.done).length;
    return h('article', { class: 'tcreator', style: `--pc:${color}` },
      h('header', {}, h('span', { class: 'tdot' }), h('h3', {}, name), h('span', { class: 'tprog' }, `${done}/${list.length}`), extra),
      list.length ? taskList(list, sede) : h('p', { class: 'tnone' }, 'Sin tareas'));
  }

  function sedeCard(s) {
    const done = s.tareas.filter((t) => t.done).length;
    const card = h('section', { class: 'tsede' + (closed.has(s.id) ? ' closed' : '') });
    const fold = h('button', { class: 'tfold', type: 'button', 'aria-expanded': String(!closed.has(s.id)), 'aria-label': 'Plegar o desplegar la sede', onclick: () => { if (closed.has(s.id)) closed.delete(s.id); else closed.add(s.id); saveClosed(); card.classList.toggle('closed', closed.has(s.id)); fold.setAttribute('aria-expanded', String(!closed.has(s.id))); } },
      h('svg', {}), h('h2', {}, s.name), h('span', { class: 'tprog' }, `${done}/${s.tareas.length}`));
    fold.firstChild.replaceWith(Object.assign(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {}));
    const sv = fold.firstChild; sv.setAttribute('viewBox', '0 0 24 24'); sv.setAttribute('fill', 'none'); sv.setAttribute('stroke', 'currentColor'); sv.setAttribute('stroke-width', '2.2'); sv.setAttribute('stroke-linecap', 'round'); sv.setAttribute('stroke-linejoin', 'round'); sv.innerHTML = '<path d="M6 9l6 6 6-6"/>';
    card.append(h('header', { class: 'tshead' }, fold,
      h('button', { class: 'iconbtn', type: 'button', title: 'Borrar sede', 'aria-label': 'Borrar sede', onclick: async () => { if (confirm('¿Borrar la sede con sus tareas y creadores?')) { await api('DELETE', '/api/sedes/' + s.id); load(); } } }, '×')));

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
        h('button', { type: 'button', class: 'tcopy', onclick: async (e) => { const url = location.origin + '/t/' + c.token; try { await navigator.clipboard.writeText(url); } catch (x) { prompt('Copia el enlace', url); } e.target.textContent = 'Copiado'; setTimeout(() => (e.target.textContent = 'Copiar enlace'), 1500); } }, 'Copiar enlace'),
        h('button', { type: 'button', class: 'tx', title: 'Quitar creador', 'aria-label': 'Quitar creador', onclick: async () => { if (confirm('¿Quitar a ' + c.name + '? Su enlace dejará de funcionar.')) { await api('DELETE', '/api/creadores/' + c.id); load(); } } }, '×'))), s));
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
