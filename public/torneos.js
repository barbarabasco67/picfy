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

  function sedeCard(s) {
    const done = s.tareas.filter((t) => t.done).length;
    const days = [...new Set(s.tareas.map((t) => t.date))].sort((a, b) => (a || '9').localeCompare(b || '9'));
    const names = Object.fromEntries(s.creadores.map((c) => [c.id, c.name]));
    const card = h('section', { class: 'tsede' });
    card.append(h('header', {}, h('h2', {}, s.name), h('span', { class: 'tprog' }, `${done}/${s.tareas.length}`),
      h('button', { class: 'iconbtn', type: 'button', title: 'Borrar sede', 'aria-label': 'Borrar sede', onclick: async () => { if (confirm('¿Borrar la sede con sus tareas y creadores?')) { await api('DELETE', '/api/sedes/' + s.id); load(); } } }, '×')));
    // creadores
    const chips = h('div', { class: 'tchips' }, s.creadores.map((c) => h('span', { class: 'tchip' }, c.name,
      h('button', { type: 'button', class: 'tcopy', onclick: async (e) => { const url = location.origin + '/t/' + c.token; try { await navigator.clipboard.writeText(url); } catch (x) { prompt('Copia el enlace', url); } e.target.textContent = 'Copiado'; setTimeout(() => (e.target.textContent = 'Copiar enlace'), 1500); } }, 'Copiar enlace'),
      h('button', { type: 'button', class: 'tx', title: 'Quitar creador', 'aria-label': 'Quitar creador', onclick: async () => { if (confirm('¿Quitar a ' + c.name + '? Su enlace dejará de funcionar.')) { await api('DELETE', '/api/creadores/' + c.id); load(); } } }, '×'))));
    const cf = h('form', { class: 'tinline', onsubmit: async (e) => { e.preventDefault(); const v = e.target.name.value.trim(); if (!v) return; await api('POST', `/api/sedes/${s.id}/creadores`, { name: v }); load(); } },
      h('input', { type: 'text', name: 'name', maxlength: 80, placeholder: 'Nuevo creador', 'aria-label': 'Nuevo creador' }), h('button', { class: 'btn sm', type: 'submit' }, 'Añadir'));
    card.append(chips, cf);
    // tareas por día
    for (const d of days) {
      card.append(h('h3', { class: 'tday' }, fmt(d)));
      card.append(h('ul', { class: 'ttasks' }, s.tareas.filter((t) => t.date === d).map((t) => {
        const k = kinds[t.kind] || { color: '#999', label: '' };
        return h('li', { class: t.done ? 'done' : '' },
          h('input', { type: 'checkbox', checked: !!t.done, 'aria-label': 'Hecha', onchange: async (e) => { await api('PUT', '/api/tareas/' + t.id, { done: e.target.checked ? 1 : 0 }); load(); } }),
          h('i', { style: `background:${k.color}` }),
          h('span', { class: 't' }, t.title, t.time ? h('small', {}, ' · ' + t.time) : null),
          h('span', { class: 'who' }, t.creador_id && names[t.creador_id] ? names[t.creador_id] : 'Toda la sede'),
          t.done && t.done_by ? h('span', { class: 'by' }, 'Hecha por ' + (t.done_by === 'hub' ? 'ti' : t.done_by)) : null,
          h('button', { class: 'tx', type: 'button', title: 'Borrar tarea', 'aria-label': 'Borrar tarea', onclick: async () => { await api('DELETE', '/api/tareas/' + t.id); load(); } }, '×'));
      })));
    }
    // nueva tarea
    const tf = h('form', { class: 'tnewtask', onsubmit: async (e) => {
      e.preventDefault(); const f = e.target; const title = f.title.value.trim(); if (!title) return;
      await api('POST', `/api/sedes/${s.id}/tareas`, { title, kind: f.kind.value, date: f.date.value, time: f.time.value, creador_id: f.creador_id.value });
      load();
    } },
      h('input', { type: 'text', name: 'title', maxlength: 160, placeholder: 'Nueva tarea', 'aria-label': 'Nueva tarea', required: true }),
      h('select', { name: 'kind', 'aria-label': 'Tipo' }, Object.entries(kinds).map(([k, v]) => h('option', { value: k }, v.label))),
      h('input', { type: 'date', name: 'date', 'aria-label': 'Fecha' }), h('input', { type: 'time', name: 'time', 'aria-label': 'Hora' }),
      h('select', { name: 'creador_id', 'aria-label': 'Asignada a' }, h('option', { value: '' }, 'Toda la sede'), s.creadores.map((c) => h('option', { value: c.id }, c.name))),
      h('button', { class: 'btn primary sm', type: 'submit' }, 'Añadir tarea'));
    card.append(tf);
    return card;
  }

  document.getElementById('sedeForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const v = e.target.name.value.trim(); if (!v) return;
    await api('POST', `/api/torneos/${tid}/sedes`, { name: v }); e.target.reset(); load();
  });
  load();
})();
