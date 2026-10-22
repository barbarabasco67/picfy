(() => {
  const B = document.body, token = B.dataset.token; if (!token) return;
  const kinds = JSON.parse(B.dataset.kinds || '{}');
  const root = document.getElementById('mdList');
  const h = (tag, a, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  let tareas = [];
  async function load() { const r = await fetch('/api/t/' + token); if (!r.ok) return; tareas = (await r.json()).tareas; draw(); }
  async function toggle(t, on) { t.done = on ? 1 : 0; draw(); await fetch(`/api/t/${token}/tareas/${t.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: t.done }) }); }
  function row(t) {
    const k = kinds[t.kind] || { color: '#999', label: '' };
    return h('li', { class: 'mdt' + (t.done ? ' done' : '') },
      h('label', {}, h('input', { type: 'checkbox', checked: !!t.done, onchange: (e) => toggle(t, e.target.checked) }), h('span', { class: 'mdck' }),
        h('span', { class: 'mdtx' }, h('strong', {}, t.title), h('small', {}, [k.label, t.time].filter(Boolean).join(' · ')), t.notes ? h('em', {}, t.notes) : null)),
      h('i', { style: `background:${k.color}` }));
  }
  function section(title, list) { return list.length ? h('section', {}, h('h2', {}, title), h('ul', {}, list.map(row))) : null; }
  function draw() {
    const open = tareas.filter((t) => !t.done);
    const parts = [
      section('Hoy', open.filter((t) => t.date === today)),
      section('Atrasadas', open.filter((t) => t.date && t.date < today)),
      ...[...new Set(open.filter((t) => t.date > today).map((t) => t.date))].map((d) => section(fmt(d), open.filter((t) => t.date === d))),
      section('Sin fecha', open.filter((t) => !t.date)),
      section('Hechas', tareas.filter((t) => t.done)),
    ].filter(Boolean);
    root.replaceChildren(...(parts.length ? parts : [h('p', { class: 'mdsub' }, 'No hay tareas.')]));
  }
  load();
})();
