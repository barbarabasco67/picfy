// Agenda personal: eventos y tareas de cualquier tipo. Vista de semana y de mes, categorías propias,
// tareas con casilla, «Por hacer» sin fecha y «Hechas».
(function () {
  const $ = (id) => document.getElementById(id);
  let COLORS;
  try { COLORS = JSON.parse(document.body.dataset.agenda || ''); } catch { return; }
  if (!$('agWeek')) return;

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayIso = () => iso(new Date());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };
  const GREY = '#6b7280';

  let items = [];
  let view = lsGet('picfy_agenda_view') === 'month' ? 'month' : 'week';
  let fCat = '';
  const now = new Date();
  let cy = now.getFullYear(), cm = now.getMonth();
  let wStart = addDays(now, -((now.getDay() + 6) % 7));
  let editing = null, dayOpen = null;

  const endOf = (it) => it.end_date || it.date;
  const hasDate = (it) => !!it.date;
  const colorOf = (it) => it.color || GREY;
  const visible = () => items.filter((it) => !fCat || it.category === fCat);
  const onDay = (it, day) => hasDate(it) && it.date <= day && endOf(it) >= day;
  const sortDay = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title);

  async function api(path, opts) {
    const r = await fetch(path, opts);
    let data = null; try { data = await r.json(); } catch { /* sin json */ }
    if (!r.ok) throw new Error((data && data.error) || 'http' + r.status);
    return data;
  }
  const send = (method, path, body) => api(path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 3500); }

  /* ---------- pintar ---------- */

  const timeTxt = (it) => (it.time ? it.time + (it.end_time ? '–' + it.end_time : '') : '');
  const rangeTxt = (it) => (it.end_date ? ` · hasta ${parse(it.end_date).getDate()} ${MONTHS[parse(it.end_date).getMonth()].slice(0, 3)}` : '');

  function entry(it) {
    const task = it.kind === 'tarea';
    return `<div class="agent${it.done ? ' done' : ''}" data-id="${it.id}" style="--c:${colorOf(it)}">
${task ? `<button type="button" class="agck${it.done ? ' on' : ''}" data-check="${it.id}" aria-label="${it.done ? 'Marcar como pendiente' : 'Marcar como hecha'}"></button>` : '<i class="agdot"></i>'}
<div class="agmain"><strong>${it.icon ? esc(it.icon) + ' ' : ''}${esc(it.title)}</strong><span class="muted small">${[timeTxt(it), it.category ? esc(it.category) : '', task ? '' : 'evento'].filter(Boolean).join(' · ')}${rangeTxt(it)}</span></div></div>`;
  }

  function renderWeek() {
    const list = visible(), today = todayIso();
    let out = '';
    for (let i = 0; i < 7; i++) {
      const d = addDays(wStart, i), day = iso(d);
      const its = list.filter((it) => onDay(it, day)).sort(sortDay);
      out += `<div class="glass agday${day === today ? ' today' : ''}" data-day="${day}"><div class="agdl"><span>${DAYS[i].slice(0, 3)}</span><b>${d.getDate()}</b></div>
<div class="agdi">${its.map(entry).join('')}<button type="button" class="agadd" data-add="${day}">+ Añadir</button></div></div>`;
    }
    $('agWeek').innerHTML = out;
    const e = addDays(wStart, 6);
    $('agTitle').textContent = wStart.getMonth() === e.getMonth() ? `${wStart.getDate()}–${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}` : `${wStart.getDate()} ${MONTHS[wStart.getMonth()].slice(0, 3)} – ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
  }

  const chip = (it) => `<button type="button" class="agchip${it.done ? ' done' : ''}" data-id="${it.id}" style="--c:${colorOf(it)}" title="${esc(it.title)}">${it.time ? `<b>${esc(it.time)}</b> ` : ''}${it.icon ? esc(it.icon) + ' ' : ''}${esc(it.title)}</button>`;

  function renderMonth() {
    const first = new Date(cy, cm, 1);
    const start = new Date(cy, cm, 1 - ((first.getDay() + 6) % 7));
    const list = visible(), today = todayIso();
    let out = `<div class="agweek">${DAYS.map((d) => `<span>${d.slice(0, 3)}</span>`).join('')}</div><div class="aggrid">`;
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== cm) break;
      const day = iso(d);
      const its = list.filter((it) => onDay(it, day)).sort(sortDay);
      const dots = its.slice(0, 4).map((it) => `<i style="background:${colorOf(it)}"></i>`).join('');
      out += `<div class="agcell${d.getMonth() !== cm ? ' out' : ''}${day === today ? ' today' : ''}" data-day="${day}">
<button type="button" class="agnum" data-day="${day}" aria-label="${d.getDate()} de ${MONTHS[d.getMonth()]}">${d.getDate()}</button>
<div class="agchips">${its.slice(0, 3).map(chip).join('')}${its.length > 3 ? `<button type="button" class="agmore" data-day="${day}">+${its.length - 3} más</button>` : ''}</div>
<div class="agdots">${dots}</div></div>`;
    }
    $('agMonth').innerHTML = out + '</div>';
    $('agTitle').textContent = `${cap(MONTHS[cm])} ${cy}`;
  }

  function side() {
    const all = visible(), today = todayIso();
    const limit = iso(addDays(new Date(), 30));
    const late = all.filter((it) => it.kind === 'tarea' && !it.done && hasDate(it) && endOf(it) < today).sort((a, b) => a.date.localeCompare(b.date));
    const next = all.filter((it) => hasDate(it) && !it.done && endOf(it) >= today && it.date <= limit).sort((a, b) => (a.date < today ? today : a.date).localeCompare(b.date < today ? today : b.date) || sortDay(a, b)).slice(0, 8);
    const todo = all.filter((it) => it.kind === 'tarea' && !it.done && !hasDate(it));
    const done = all.filter((it) => it.done).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);
    const nextRow = (it) => { const d = parse(it.date < today ? today : it.date); return `<div class="agnx" data-id="${it.id}" style="--c:${colorOf(it)}"><div class="agdate"><b>${d.getDate()}</b><span>${MONTHS[d.getMonth()].slice(0, 3)}</span></div><div class="agmain"><strong>${it.icon ? esc(it.icon) + ' ' : ''}${esc(it.title)}</strong><span class="muted small">${[timeTxt(it), it.category ? esc(it.category) : ''].filter(Boolean).join(' · ') || (it.kind === 'tarea' ? 'tarea' : 'evento')}</span></div></div>`; };
    const box = (t, n, body, cls) => `<section class="glass agbox ${cls || ''}"><h3>${t}${n ? ` <em>${n}</em>` : ''}</h3>${body}</section>`;
    let out = box('Próximos', '', next.length ? next.map(nextRow).join('') : '<p class="muted small">Nada en los próximos 30 días.</p>');
    if (late.length) out += box('Atrasadas', late.length, late.map(entry).join(''), 'bad');
    out += box('Por hacer', todo.length || '', todo.length ? todo.map(entry).join('') : '<p class="muted small">Nada pendiente sin fecha.</p>');
    out += box('Hechas', '', done.length ? done.map(entry).join('') : '<p class="muted small">Aún no has completado ninguna.</p>');
    $('agSide').innerHTML = out;
  }

  function cats() {
    const m = new Map();
    for (const it of items) if (it.category && !m.has(it.category)) m.set(it.category, it.color || GREY);
    if (fCat && !m.has(fCat)) fCat = '';
    $('agCats').innerHTML = m.size ? `<button type="button" class="chipf${fCat ? '' : ' on'}" data-cat="">Todo</button>` + [...m].map(([n, c]) => `<button type="button" class="chipf${fCat === n ? ' on' : ''}" data-cat="${esc(n)}" style="--c:${c}"><i></i>${esc(n)}</button>`).join('') : '';
    $('agCatList').innerHTML = [...m.keys()].map((n) => `<option value="${esc(n)}">`).join('');
    cats.map = m;
  }

  function render() {
    cats();
    $('agWeek').hidden = view !== 'week'; $('agMonth').hidden = view !== 'month';
    document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    if (view === 'week') renderWeek(); else renderMonth();
    side();
    if (dayOpen) renderDay();
  }
  function setView(v) { view = v; lsSet('picfy_agenda_view', v); render(); }

  /* ---------- alta y edición ---------- */

  const dlg = $('agDlg'), form = $('agForm');
  const kindOf = () => (form.querySelector('input[name=kind]:checked') || {}).value || 'tarea';
  function syncKind() { $('agDateL').textContent = kindOf() === 'evento' ? 'Fecha' : 'Fecha (opcional)'; form.date.required = kindOf() === 'evento'; }
  form.querySelectorAll('input[name=kind]').forEach((r) => r.addEventListener('change', syncKind));
  const setColor = (c) => { const r = form.querySelector(`input[name=color][value="${c}"]`); (r || form.querySelector('input[name=color]')).checked = true; };
  form.category.addEventListener('input', () => {
    const m = cats.map || new Map(), v = form.category.value.trim();
    if (m.has(v)) setColor(m.get(v));
    else if (v && !colorTouched) { const used = new Set(m.values()); setColor(COLORS.find((c) => !used.has(c)) || COLORS[0]); }
  });
  let colorTouched = false;
  form.querySelectorAll('input[name=color]').forEach((r) => r.addEventListener('change', () => { colorTouched = true; }));
  form.querySelectorAll('.emo').forEach((b) => b.addEventListener('click', () => { form.icon.value = form.icon.value === b.dataset.emo ? '' : b.dataset.emo; }));

  function openForm(it, day, kind) {
    editing = it || null; colorTouched = !!it;
    form.reset();
    form.querySelector(`input[name=kind][value="${it ? it.kind : (kind || 'tarea')}"]`).checked = true;
    $('agDlgT').textContent = it ? 'Editar' : 'Nuevo';
    form.title.value = it ? it.title : '';
    form.date.value = it ? it.date : (day || '');
    form.end_date.value = it && it.end_date ? it.end_date : '';
    form.time.value = it && it.time ? it.time : '';
    form.end_time.value = it && it.end_time ? it.end_time : '';
    form.category.value = it && it.category ? it.category : (fCat || '');
    form.icon.value = it && it.icon ? it.icon : '';
    form.url.value = it && it.url ? it.url : '';
    form.notes.value = it && it.notes ? it.notes : '';
    setColor(it && it.color ? it.color : ((cats.map || new Map()).get(fCat) || COLORS[0]));
    syncKind();
    $('agDel').hidden = !it;
    dlg.showModal();
    form.title.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const body = { kind: f.get('kind'), title: f.get('title'), date: f.get('date'), end_date: f.get('end_date'), time: f.get('time'), end_time: f.get('end_time'), category: f.get('category'), color: f.get('color'), icon: f.get('icon'), url: f.get('url'), notes: f.get('notes') };
    if (body.kind === 'evento' && !body.date) { toast('Un evento necesita fecha.'); return; }
    try {
      if (editing) { const r = await send('PUT', `/api/agenda/${editing.id}`, { ...body, done: editing.kind === body.kind ? editing.done : 0 }); items = items.map((x) => (x.id === editing.id ? { ...x, ...r.item } : x)); }
      else { const r = await send('POST', '/api/agenda', body); items.push(r.item); }
      dlg.close(); render();
    } catch (err) { toast('No se ha podido guardar.'); }
  });

  $('agDel').addEventListener('click', async () => {
    if (!editing || !confirm('¿Borrar «' + editing.title + '»?')) return;
    try { await send('DELETE', `/api/agenda/${editing.id}`); items = items.filter((x) => x.id !== editing.id); dlg.close(); render(); }
    catch { toast('No se ha podido borrar.'); }
  });

  $('agQuick').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = $('agQuickT').value.trim(); if (!t) return;
    try { const r = await send('POST', '/api/agenda', { kind: 'tarea', title: t, category: fCat, color: (cats.map || new Map()).get(fCat) || '' }); items.push(r.item); $('agQuickT').value = ''; render(); }
    catch { toast('No se ha podido añadir.'); }
  });

  async function toggle(id) {
    const it = items.find((x) => x.id === id); if (!it) return;
    const prev = it.done; it.done = prev ? 0 : 1; render();
    try { await send('PUT', `/api/agenda/${id}`, { done: it.done }); }
    catch { it.done = prev; render(); toast('No se ha podido cambiar.'); }
  }

  /* ---------- día (desde el mes) ---------- */

  function renderDay() {
    const d = parse(dayOpen);
    $('agDayT').textContent = `${cap(DAYS[(d.getDay() + 6) % 7])}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
    const its = visible().filter((it) => onDay(it, dayOpen)).sort(sortDay);
    $('agDayList').innerHTML = its.length ? its.map(entry).join('') : '<p class="muted">Nada este día.</p>';
  }
  function openDay(day) { dayOpen = day; renderDay(); $('agDay').showModal(); }
  $('agDay').addEventListener('close', () => { dayOpen = null; });
  $('agDayAdd').addEventListener('click', () => { const day = dayOpen; $('agDay').close(); openForm(null, day, 'evento'); });

  /* ---------- eventos ---------- */

  $('agAdd').addEventListener('click', () => openForm(null, view === 'week' ? todayIso() : '', 'tarea'));
  $('agPrev').addEventListener('click', () => { if (view === 'week') wStart = addDays(wStart, -7); else { cm--; if (cm < 0) { cm = 11; cy--; } } render(); });
  $('agNext').addEventListener('click', () => { if (view === 'week') wStart = addDays(wStart, 7); else { cm++; if (cm > 11) { cm = 0; cy++; } } render(); });
  $('agToday').addEventListener('click', () => { const n = new Date(); cy = n.getFullYear(); cm = n.getMonth(); wStart = addDays(n, -((n.getDay() + 6) % 7)); render(); });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('dialog [data-close]')) { t.closest('dialog').close(); return; }
    const v = t.closest('[data-view]'); if (v) { setView(v.dataset.view); return; }
    const cat = t.closest('[data-cat]'); if (cat) { fCat = cat.dataset.cat; render(); return; }
    const ck = t.closest('[data-check]'); if (ck) { toggle(ck.dataset.check); return; }
    const add = t.closest('[data-add]'); if (add) { openForm(null, add.dataset.add, 'evento'); return; }
    const ent = t.closest('.agent[data-id], .agchip[data-id], .agnx[data-id]');
    if (ent) { const it = items.find((x) => x.id === ent.dataset.id); if (it) { if ($('agDay').open) $('agDay').close(); openForm(it); } return; }
    const dn = t.closest('.agnum, .agmore'); if (dn) { openDay(dn.dataset.day); return; }
    const cell = t.closest('.agcell'); if (cell && !t.closest('.agchip')) openDay(cell.dataset.day);
  });

  (async () => {
    try { items = (await api('/api/agenda')).items; }
    catch { toast('No se ha podido cargar la agenda.'); }
    render();
  })();
})();
