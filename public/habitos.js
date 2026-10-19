// Hábitos: tarjetas con objetivo diario, semana con anillos de progreso y botón «+» para sumar.
(function () {
  const $ = (id) => document.getElementById(id);
  let COLORS;
  try { COLORS = JSON.parse(document.body.dataset.colors || ''); } catch { return; }
  if (!$('hbList')) return;
  const HB = $('hbSection');

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DOW = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = iso(new Date());

  let habits = [], logs = {}; // logs[habitId][date] = valor
  let sel = today;
  let wStart = addDays(new Date(), -((new Date().getDay() + 6) % 7));
  let editing = null;

  async function api(path, opts) {
    const r = await fetch(path, opts);
    let data = null; try { data = await r.json(); } catch { /* sin json */ }
    if (!r.ok) throw new Error((data && data.error) || 'http' + r.status);
    return data;
  }
  const send = (method, path, body) => api(path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  function toast(t) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el); setTimeout(() => el.remove(), 3500); }
  const val = (h, day) => (logs[h.id] && logs[h.id][day]) || 0;

  async function load() {
    const from = iso(wStart), to = iso(addDays(wStart, 6));
    const d = await api(`/api/habits?from=${from}&to=${to}`);
    habits = d.habits;
    for (const h of habits) logs[h.id] = Object.fromEntries(Object.entries(logs[h.id] || {}).filter(([k]) => k < from || k > to));
    for (const l of d.logs) (logs[l.habit_id] = logs[l.habit_id] || {})[l.date] = l.value;
    render();
  }

  const frac = (day) => (habits.length ? habits.reduce((a, h) => a + Math.min(1, val(h, day) / h.goal), 0) / habits.length : 0);

  function renderDays() {
    let out = '';
    for (let i = 0; i < 7; i++) {
      const d = addDays(wStart, i), day = iso(d), f = frac(day);
      out += `<button type="button" class="hbday${day === sel ? ' on' : ''}${day === today ? ' today' : ''}" data-day="${day}" aria-label="${d.getDate()} de ${MONTHS[d.getMonth()]}"><span>${DOW[i]}</span><i style="--p:${Math.round(f * 100)}%"><b>${d.getDate()}</b></i></button>`;
    }
    $('hbDays').innerHTML = out;
  }

  const chipTxt = (h, v) => `${v}/${h.goal}${h.unit ? ' ' + esc(h.unit) : ''}`;

  function renderList() {
    if (!habits.length) { $('hbList').innerHTML = '<div class="glass emptybox">Aún no tienes hábitos. Pulsa «Nuevo hábito» para crear el primero: beber agua, caminar, entrenar…</div>'; return; }
    $('hbList').innerHTML = habits.map((h) => {
      const v = val(h, sel), done = v >= h.goal, single = h.goal === 1;
      return `<div class="hbcard${done ? ' done' : ''}" data-id="${h.id}" style="--c:${h.color}"><span class="hbico">${h.icon ? PicfyIcons.svg(h.icon, 'ic') : '<i></i>'}</span>
<div class="hbmain"><strong>${esc(h.name)}</strong><span class="hbchip">${chipTxt(h, v)}</span></div>
<button type="button" class="hbplus" data-plus="${h.id}" aria-label="${single ? (done ? 'Quitar' : 'Marcar') : 'Sumar'}">${single ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : (done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>')}</button></div>`;
    }).join('');
  }

  function render() {
    renderDays(); renderList();
    const d = parse(sel);
    $('hbSub').textContent = sel === today ? 'Hoy' : `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  }

  async function setVal(h, day, v) {
    v = Math.max(0, Math.min(1000000, Math.round(v)));
    const prev = val(h, day);
    (logs[h.id] = logs[h.id] || {})[day] = v; if (!v) delete logs[h.id][day];
    render();
    try { await send('PUT', `/api/habits/${h.id}/log`, { date: day, value: v }); }
    catch { (logs[h.id] = logs[h.id] || {})[day] = prev; if (!prev) delete logs[h.id][day]; render(); toast('No se ha podido guardar.'); }
  }

  /* ---------- alta y edición ---------- */
  const dlg = $('hbDlg'), form = $('hbForm');
  const markIcons = PicfyIcons.picker($('hbIcons'), form.icon);
  const setColor = (c) => { const r = form.querySelector(`input[name=color][value="${c}"]`); (r || form.querySelector('input[name=color]')).checked = true; };

  function openForm(h) {
    editing = h || null;
    form.reset();
    $('hbDlgT').textContent = h ? 'Editar hábito' : 'Nuevo hábito';
    form.name.value = h ? h.name : '';
    form.icon.value = h ? h.icon || '' : ''; markIcons();
    form.goal.value = h ? h.goal : 1; form.step.value = h ? h.step : 1; form.unit.value = h ? h.unit || '' : '';
    setColor(h ? h.color : COLORS[habits.length % COLORS.length]);
    $('hbValBox').hidden = !h; $('hbDel').hidden = !h;
    if (h) { $('hbValD').textContent = sel === today ? 'hoy' : sel; form.value.value = val(h, sel); }
    dlg.showModal(); form.name.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const body = { name: f.get('name'), icon: f.get('icon'), color: f.get('color'), goal: f.get('goal'), step: f.get('step'), unit: f.get('unit') };
    try {
      if (editing) {
        const r = await send('PUT', `/api/habits/${editing.id}`, body);
        habits = habits.map((x) => (x.id === editing.id ? { ...x, ...r.habit } : x));
        const nv = Number(f.get('value'));
        if (Number.isFinite(nv) && nv !== val(editing, sel)) await setVal(editing, sel, nv);
      } else { const r = await send('POST', '/api/habits', body); habits.push(r.habit); }
      dlg.close(); render();
    } catch { toast('No se ha podido guardar.'); }
  });
  $('hbDel').addEventListener('click', async () => {
    if (!editing || !confirm('¿Borrar el hábito «' + editing.name + '» y todo su progreso?')) return;
    try { await send('DELETE', `/api/habits/${editing.id}`); habits = habits.filter((x) => x.id !== editing.id); dlg.close(); render(); }
    catch { toast('No se ha podido borrar.'); }
  });

  $('hbAdd').addEventListener('click', () => openForm(null));
  $('hbPrev').addEventListener('click', () => { wStart = addDays(wStart, -7); sel = iso(wStart); load(); });
  $('hbNext').addEventListener('click', () => { wStart = addDays(wStart, 7); sel = iso(wStart); load(); });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t.closest('#hbSection') && !t.closest('#hbDlg')) return;
    const dy = t.closest('#hbDays [data-day]'); if (dy) { sel = dy.dataset.day; render(); return; }
    const pl = t.closest('[data-plus]');
    if (pl) {
      const h = habits.find((x) => x.id === pl.dataset.plus); if (!h) return;
      const v = val(h, sel);
      if (h.goal === 1) setVal(h, sel, v >= 1 ? 0 : 1);
      else if (v >= h.goal) setVal(h, sel, 0);
      else setVal(h, sel, v + h.step);
      return;
    }
    const card = t.closest('.hbcard'); if (card) { const h = habits.find((x) => x.id === card.dataset.id); if (h) openForm(h); }
  });

  load().catch(() => toast('No se han podido cargar los hábitos.'));
})();
