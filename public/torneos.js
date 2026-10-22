(() => {
  const B = document.body, tid = B.dataset.torneo; if (!tid) return;
  const kinds = JSON.parse(B.dataset.kinds || '{}');
  const root = document.getElementById('tSedes');
  const api = async (m, u, b) => { const r = await fetch(u, { method: m, headers: { 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined }); if (!r.ok) throw new Error(r.status); return r.json(); };
  const h = (tag, a, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
  const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Sin fecha';
  let data = { sedes: [] };

  const load = async () => { data = await api('GET', '/api/torneos/' + tid); draw(); };

  function draw() {
    root.replaceChildren(...data.sedes.map(sedeCard));
    if (!data.sedes.length) root.append(h('div', { class: 'glass emptybox' }, 'Añade la primera sede.'));
  }

  const PAL = ['#e5604f', '#2f9e6f', '#4a63d6', '#c9376e', '#1f9fb3', '#8e5bd6', '#e5964c', '#6b7280'];

  function taskList(list, names) {
    const days = [...new Set(list.map((t) => t.date))].sort((a, b) => (a || '9').localeCompare(b || '9'));
    return days.map((d) => h('div', { class: 'tdaybox' }, h('h4', { class: 'tday' }, fmt(d)), h('ul', { class: 'ttasks' }, list.filter((t) => t.date === d).map((t) => {
      const k = kinds[t.kind] || { color: '#999', label: t.kind };
      return h('li', { class: t.done ? 'done' : '' },
        h('input', { type: 'checkbox', checked: !!t.done, 'aria-label': 'Hecha', onchange: async (e) => { await api('PUT', '/api/tareas/' + t.id, { done: e.target.checked ? 1 : 0 }); load(); } }),
        h('span', { class: 'tkind', style: `--c:${k.color}` }, k.label),
        h('span', { class: 't' }, t.title, t.time ? h('small', {}, ' · ' + t.time) : null),
        t.done && t.done_by ? h('span', { class: 'by' }, t.done_by === 'hub' ? 'Hecha' : 'Hecha por ' + t.done_by) : null,
        h('button', { class: 'tx', type: 'button', title: 'Borrar tarea', 'aria-label': 'Borrar tarea', onclick: async () => { await api('DELETE', '/api/tareas/' + t.id); load(); } }, '×'));
    }))));
  }

  function personBox(name, color, list, extra) {
    const done = list.filter((t) => t.done).length;
    return h('article', { class: 'tcreator', style: `--pc:${color}` },
      h('header', {}, h('span', { class: 'tdot' }), h('h3', {}, name), h('span', { class: 'tprog' }, `${done}/${list.length}`), extra),
      list.length ? taskList(list) : h('p', { class: 'tnone' }, 'Sin tareas'));
  }

  function sedeCard(s) {
    const done = s.tareas.filter((t) => t.done).length;
    const card = h('section', { class: 'tsede' });
    card.append(h('header', { class: 'tshead' }, h('h2', {}, s.name), h('span', { class: 'tprog' }, `${done}/${s.tareas.length}`),
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
    if (general.length) boxes.append(personBox('Toda la sede', '#14213d', general));
    s.creadores.forEach((c, i) => boxes.append(personBox(c.name, PAL[i % PAL.length], s.tareas.filter((t) => t.creador_id === c.id),
      h('span', { class: 'tact' },
        h('button', { type: 'button', class: 'tcopy', onclick: async (e) => { const url = location.origin + '/t/' + c.token; try { await navigator.clipboard.writeText(url); } catch (x) { prompt('Copia el enlace', url); } e.target.textContent = 'Copiado'; setTimeout(() => (e.target.textContent = 'Copiar enlace'), 1500); } }, 'Copiar enlace'),
        h('button', { type: 'button', class: 'tx', title: 'Quitar creador', 'aria-label': 'Quitar creador', onclick: async () => { if (confirm('¿Quitar a ' + c.name + '? Su enlace dejará de funcionar.')) { await api('DELETE', '/api/creadores/' + c.id); load(); } } }, '×')))));
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
