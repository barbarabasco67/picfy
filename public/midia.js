(() => {
  const B = document.body, token = B.dataset.token; if (!token) return;
  const kinds = JSON.parse(B.dataset.kinds || '{}');
  const root = document.getElementById('mdList');
  const h = (tag, a, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  let tareas = [], view = 'lista', wk = 0;
  try { if (localStorage.getItem('picfy_midia_vista') === 'semana') view = 'semana'; } catch (e) {}
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const mondayOf = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + n * 7); return d; };
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
  function tabs() {
    const set = (v) => { view = v; try { localStorage.setItem('picfy_midia_vista', v); } catch (e) {} draw(); };
    return h('div', { class: 'mdtabs', role: 'tablist' },
      h('button', { type: 'button', role: 'tab', class: view === 'lista' ? 'on' : '', onclick: () => set('lista') }, 'Lista'),
      h('button', { type: 'button', role: 'tab', class: view === 'semana' ? 'on' : '', onclick: () => set('semana') }, 'Semana'));
  }
  function weekView() {
    const mon = mondayOf(wk), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
    const end = days[6], mf = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const nav = h('div', { class: 'mdweek' },
      h('button', { type: 'button', 'aria-label': 'Semana anterior', onclick: () => { wk--; draw(); } }, '‹'),
      h('strong', {}, `${mf(mon)} – ${mf(end)}`),
      h('button', { type: 'button', 'aria-label': 'Semana siguiente', onclick: () => { wk++; draw(); } }, '›'));
    const cols = days.map((d) => {
      const key = iso(d), list = tareas.filter((t) => t.date === key), isToday = key === today;
      return h('section', { class: 'mdday' + (isToday ? ' now' : '') },
        h('header', {}, h('b', {}, d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')), h('span', {}, String(d.getDate())), list.length ? h('em', {}, `${list.filter((t) => t.done).length}/${list.length}`) : null),
        list.length ? h('ul', {}, list.map(row)) : h('p', {}, 'Libre'));
    });
    const jump = wk !== 0 ? h('button', { type: 'button', class: 'mdnow', onclick: () => { wk = 0; draw(); } }, 'Volver a esta semana') : null;
    return [nav, jump, ...cols].filter(Boolean);
  }
  function listView() {
    const open = tareas.filter((t) => !t.done);
    const parts = [
      section('Hoy', open.filter((t) => t.date === today)),
      section('Atrasadas', open.filter((t) => t.date && t.date < today)),
      ...[...new Set(open.filter((t) => t.date > today).map((t) => t.date))].map((d) => section(fmt(d), open.filter((t) => t.date === d))),
      section('Sin fecha', open.filter((t) => !t.date)),
      section('Hechas', tareas.filter((t) => t.done)),
    ].filter(Boolean);
    return parts.length ? parts : [h('p', { class: 'mdsub' }, 'No hay tareas.')];
  }
  function draw() { root.replaceChildren(tabs(), ...(view === 'semana' ? weekView() : listView())); }
  load();
})();
