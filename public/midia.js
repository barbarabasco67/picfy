(() => {
  const B = document.body, token = B.dataset.token; if (!token) return;
  const kinds = JSON.parse(B.dataset.kinds || '{}');
  const root = document.getElementById('mdList');
  const h = (tag, a, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a || {})) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c)); return e; };
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  let tareas = [], subida = false, view = 'lista', wk = 0;
  try { if (localStorage.getItem('picfy_midia_vista') === 'semana') view = 'semana'; } catch (e) {}
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const mondayOf = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + n * 7); return d; };
  async function load() { const r = await fetch('/api/t/' + token); if (!r.ok) return; const d = await r.json(); tareas = d.tareas; subida = d.subida; draw(); }
  async function toggle(t, on) { t.done = on ? 1 : 0; draw(); await fetch(`/api/t/${token}/tareas/${t.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ done: t.done }) }); }
  const PART = 10 * 1024 * 1024, MAX = 1024 * 1024 * 1024;
  const prog = {};  // por tarea: [{ name, pct, error }]
  const size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(b >= 104857600 ? 0 : 1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const api = (m, u, body, raw) => fetch(u, { method: m, headers: raw ? {} : { 'content-type': 'application/json' }, body: raw || (body ? JSON.stringify(body) : undefined) });
  function bar(tid) { const el = document.querySelector(`[data-prog="${tid}"]`); if (!el) return; const list = prog[tid] || []; el.replaceChildren(...list.map((p) => h('div', { class: 'mdup' + (p.error ? ' err' : '') }, h('span', {}, p.error ? `${p.name}: ${p.error}` : `${p.name} · ${p.pct}%`), p.error ? null : h('i', {}, h('u', { style: `width:${p.pct}%` }))))); }

  async function sendFile(t, file) {
    const p = { name: file.name, pct: 0 }; (prog[t.id] = prog[t.id] || []).push(p); bar(t.id);
    const fail = (m) => { p.error = m; bar(t.id); setTimeout(() => { prog[t.id] = (prog[t.id] || []).filter((x) => x !== p); bar(t.id); }, 6000); };
    if (file.size > MAX) return fail('pesa más de 1 GB');
    if (!/^(image|video)\//.test(file.type)) return fail('solo fotos y vídeos');
    let id;
    try {
      const r = await api('POST', `/api/t/${token}/tareas/${t.id}/entregas`, { filename: file.name, size: file.size, mime: file.type });
      if (!r.ok) return fail('no se pudo empezar');
      id = (await r.json()).id;
      const partes = []; const n = Math.ceil(file.size / PART);
      for (let i = 0; i < n; i++) {
        const blob = file.slice(i * PART, (i + 1) * PART); let ok = null;
        for (let tries = 0; tries < 5 && !ok; tries++) {
          try { const r2 = await api('PUT', `/api/t/${token}/entregas/${id}/parte/${i + 1}`, null, blob); if (r2.ok) ok = await r2.json(); else await new Promise((res) => setTimeout(res, 800 * (tries + 1))); }
          catch (e) { await new Promise((res) => setTimeout(res, 1200 * (tries + 1))); }
        }
        if (!ok) throw new Error('parte');
        partes.push({ partNumber: ok.partNumber, etag: ok.etag }); p.pct = Math.round(((i + 1) / n) * 100); bar(t.id);
      }
      const r3 = await api('POST', `/api/t/${token}/entregas/${id}/fin`, { partes });
      if (!r3.ok) throw new Error('fin');
      t.entregas = (t.entregas || []).concat((await r3.json()).entrega);
      prog[t.id] = (prog[t.id] || []).filter((x) => x !== p); draw();
    } catch (e) {
      if (id) api('DELETE', `/api/t/${token}/entregas/${id}`).catch(() => {});
      fail('se cortó la conexión, inténtalo otra vez');
    }
  }

  function row(t) {
    const k = kinds[t.kind] || { color: '#999', label: '' };
    const files = (t.entregas || []).map((e) => h('li', {}, h('span', {}, e.filename), h('small', {}, size(e.size)),
      h('button', { type: 'button', 'aria-label': 'Quitar archivo', onclick: async () => { if (!confirm('¿Quitar ' + e.filename + '?')) return; await api('DELETE', `/api/t/${token}/entregas/${e.id}`); t.entregas = t.entregas.filter((x) => x.id !== e.id); draw(); } }, '×')));
    const input = h('input', { type: 'file', multiple: true, accept: 'image/*,video/*', hidden: true, onchange: (e) => { const fs = [...e.target.files]; e.target.value = ''; fs.forEach((f) => sendFile(t, f)); } });
    return h('li', { class: 'mdt' + (t.done ? ' done' : '') },
      h('div', { class: 'mdrow' },
        h('label', {}, h('input', { type: 'checkbox', checked: !!t.done, onchange: (e) => toggle(t, e.target.checked) }), h('span', { class: 'mdck' }),
          h('span', { class: 'mdtx' }, h('strong', {}, t.title), h('small', {}, [k.label, t.time].filter(Boolean).join(' · ')), t.notes ? h('em', {}, t.notes) : null)),
        h('i', { style: `background:${k.color}` })),
      subida ? h('div', { class: 'mdup-box' },
        files.length ? h('ul', { class: 'mdfiles' }, files) : null,
        h('div', { 'data-prog': t.id }),
        h('button', { type: 'button', class: 'mdbtn', onclick: () => input.click() }, files.length ? 'Subir más archivos' : 'Subir archivos'), input) : null);
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
