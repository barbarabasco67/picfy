// Agenda personal: vista de mes y de lista, filtros por tipo y cliente, alta y edición de elementos.
(function () {
  const $ = (id) => document.getElementById(id);
  let KINDS;
  try { KINDS = JSON.parse(document.body.dataset.agenda || ''); } catch { return; }
  if (!$('agMonth')) return;

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayIso = () => iso(new Date());
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

  let items = [];
  let view = lsGet('picfy_agenda_view') === 'list' ? 'list' : 'month';
  let fKind = '', fClient = '';
  const now = new Date();
  let cy = now.getFullYear(), cm = now.getMonth();
  let editing = null, dayOpen = null;

  const endOf = (it) => it.end_date || it.date;
  const isDone = (it) => (KINDS[it.kind].done || []).includes(it.status);
  const visible = () => items.filter((it) => (!fKind || it.kind === fKind) && (!fClient || it.client === fClient));
  const onDay = (it, day) => it.date <= day && endOf(it) >= day;
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

  const chip = (it) => `<button type="button" class="agchip${isDone(it) ? ' done' : ''}" data-id="${it.id}" style="--c:${KINDS[it.kind].color}" title="${esc(it.title)}">${it.time ? `<b>${esc(it.time)}</b> ` : ''}${esc(it.title)}</button>`;

  function renderMonth() {
    const first = new Date(cy, cm, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(cy, cm, 1 - offset);
    const list = visible(), today = todayIso();
    let out = `<div class="agweek">${DAYS.map((d) => `<span>${d.slice(0, 3)}</span>`).join('')}</div><div class="aggrid">`;
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (i >= 35 && d.getMonth() !== cm) break;
      const day = iso(d);
      const its = list.filter((it) => onDay(it, day)).sort(sortDay);
      const dots = its.slice(0, 4).map((it) => `<i style="background:${KINDS[it.kind].color}"></i>`).join('');
      out += `<div class="agcell${d.getMonth() !== cm ? ' out' : ''}${day === today ? ' today' : ''}" data-day="${day}">
<button type="button" class="agnum" data-day="${day}" aria-label="${d.getDate()} de ${MONTHS[d.getMonth()]}">${d.getDate()}</button>
<div class="agchips">${its.slice(0, 3).map(chip).join('')}${its.length > 3 ? `<button type="button" class="agmore" data-day="${day}">+${its.length - 3} más</button>` : ''}</div>
<div class="agdots">${dots}</div></div>`;
    }
    $('agMonth').innerHTML = out + '</div>';
    $('agTitle').textContent = `${cap(MONTHS[cm])} ${cy}`;
  }

  function row(it, today) {
    const k = KINDS[it.kind];
    const late = !isDone(it) && endOf(it) < today;
    const range = it.end_date ? ` · hasta ${parse(it.end_date).getDate()} ${MONTHS[parse(it.end_date).getMonth()].slice(0, 3)}` : '';
    return `<div class="agrow${isDone(it) ? ' done' : ''}${late ? ' late' : ''}" data-id="${it.id}" style="--c:${k.color}">
<i class="agdot"></i><div class="agmain"><strong>${esc(it.title)}</strong><span class="muted small">${esc(k.label)}${it.time ? ' · ' + esc(it.time) : ''}${range}${it.client ? ' · ' + esc(it.client) : ''}${it.detail ? ' · ' + esc(it.detail) : ''}</span></div>
<button type="button" class="agst" data-cycle="${it.id}" title="Cambiar estado">${esc(it.status)}</button></div>`;
  }

  function renderList() {
    const list = visible(), today = todayIso();
    const late = list.filter((it) => !isDone(it) && endOf(it) < today).sort((a, b) => a.date.localeCompare(b.date));
    const limit = iso(new Date(Date.now() + 120 * 864e5));
    const up = list.filter((it) => endOf(it) >= today && it.date <= limit).sort((a, b) => a.date.localeCompare(b.date) || sortDay(a, b));
    const groups = new Map();
    for (const it of up) { const k = it.date < today ? today : it.date; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
    const label = (day) => {
      const d = parse(day), diff = Math.round((d - parse(today)) / 864e5);
      const base = `${cap(DAYS[(d.getDay() + 6) % 7])} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
      return diff === 0 ? `Hoy · ${base}` : diff === 1 ? `Mañana · ${base}` : base;
    };
    let out = '';
    if (late.length) out += `<h3 class="aggh bad">Atrasadas · ${late.length}</h3>` + late.map((it) => row(it, today)).join('');
    for (const [day, its] of groups) out += `<h3 class="aggh">${label(day)}</h3>` + its.map((it) => row(it, today)).join('');
    $('agList').innerHTML = out || '<div class="glass emptybox">No hay nada pendiente. Pulsa «Añadir» para crear el primero.</div>';
    $('agTitle').textContent = 'Próximos 4 meses';
  }

  function renderSummary() {
    const today = todayIso(), week = iso(new Date(Date.now() + 7 * 864e5));
    const all = visible();
    const t = all.filter((it) => onDay(it, today) && !isDone(it)).length;
    const w = all.filter((it) => endOf(it) >= today && it.date <= week && !isDone(it)).length;
    const l = all.filter((it) => !isDone(it) && endOf(it) < today).length;
    $('agSum').innerHTML = `<div class="glass agsc"><b>${t}</b><span>hoy</span></div><div class="glass agsc"><b>${w}</b><span>en 7 días</span></div><button type="button" class="glass agsc${l ? ' bad' : ''}" id="agLate"><b>${l}</b><span>atrasadas</span></button>`;
    const lateBtn = $('agLate'); if (lateBtn) lateBtn.addEventListener('click', () => setView('list'));
  }

  function renderClients() {
    const names = [...new Set(items.map((it) => it.client).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const sel = $('agClient');
    sel.innerHTML = '<option value="">Todos los clientes</option>' + names.map((n) => `<option value="${esc(n)}"${n === fClient ? ' selected' : ''}>${esc(n)}</option>`).join('');
    if (fClient && !names.includes(fClient)) { fClient = ''; sel.value = ''; }
    $('agClients').innerHTML = names.map((n) => `<option value="${esc(n)}">`).join('');
  }

  function render() {
    document.querySelectorAll('.agtools .vtog button').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    $('agMonth').hidden = view !== 'month'; $('agList').hidden = view !== 'list';
    document.querySelector('.agnav').classList.toggle('listmode', view === 'list');
    if (view === 'month') renderMonth(); else renderList();
    renderSummary();
    if (dayOpen) renderDay();
  }
  function setView(v) { view = v; lsSet('picfy_agenda_view', v); render(); }

  /* ---------- alta y edición ---------- */

  const dlg = $('agDlg'), form = $('agForm');
  const kindOf = () => (form.querySelector('input[name=kind]:checked') || {}).value || 'tarea';
  function syncKind(keepStatus) {
    const k = KINDS[kindOf()];
    const cur = keepStatus || $('agStatus').value;
    $('agStatus').innerHTML = k.statuses.map((s) => `<option value="${s}"${s === cur ? ' selected' : ''}>${cap(s)}</option>`).join('');
    $('agDetailL').textContent = k.detail;
  }
  form.querySelectorAll('input[name=kind]').forEach((r) => r.addEventListener('change', () => syncKind()));

  function openForm(it, day) {
    editing = it || null;
    form.reset();
    const k = it ? it.kind : (fKind || 'tarea');
    form.querySelector(`input[name=kind][value="${k}"]`).checked = true;
    syncKind(it ? it.status : null);
    $('agDlgT').textContent = it ? 'Editar' : 'Nuevo';
    form.date.value = it ? it.date : (day || todayIso());
    form.end_date.value = it && it.end_date ? it.end_date : '';
    form.time.value = it && it.time ? it.time : '';
    form.title.value = it ? it.title : '';
    form.client.value = it ? it.client || '' : fClient;
    form.detail.value = it ? it.detail || '' : '';
    form.url.value = it ? it.url || '' : '';
    form.notes.value = it ? it.notes || '' : '';
    $('agDel').hidden = !it;
    if ($('agDay').open) $('agDay').close();
    dlg.showModal();
    if (!it) form.title.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      kind: kindOf(), title: form.title.value, date: form.date.value, end_date: form.end_date.value, time: form.time.value,
      status: form.status.value, client: form.client.value, detail: form.detail.value, url: form.url.value, notes: form.notes.value,
    };
    try {
      const r = editing ? await send('PUT', `/api/agenda/${editing.id}`, body) : await send('POST', '/api/agenda', body);
      if (editing) items = items.map((x) => (x.id === editing.id ? r.item : x)); else items.push(r.item);
      dlg.close(); renderClients(); render();
    } catch (err) { toast(err.message === 'title' ? 'Escribe un título.' : err.message === 'date' ? 'Elige una fecha.' : 'No se pudo guardar. Inténtalo de nuevo.'); }
  });

  $('agDel').addEventListener('click', async () => {
    if (!editing || !confirm('¿Borrar «' + editing.title + '»?')) return;
    try { await send('DELETE', `/api/agenda/${editing.id}`); items = items.filter((x) => x.id !== editing.id); dlg.close(); renderClients(); render(); }
    catch { toast('No se pudo borrar.'); }
  });

  async function cycle(id) {
    const it = items.find((x) => x.id === id); if (!it) return;
    const sts = KINDS[it.kind].statuses;
    const next = sts[(sts.indexOf(it.status) + 1) % sts.length];
    const prev = it.status; it.status = next; render();
    try { await send('PUT', `/api/agenda/${id}`, { status: next }); }
    catch { it.status = prev; render(); toast('No se pudo cambiar el estado.'); }
  }

  /* ---------- día ---------- */

  function renderDay() {
    const today = todayIso(), its = visible().filter((it) => onDay(it, dayOpen)).sort(sortDay);
    const d = parse(dayOpen);
    $('agDayT').textContent = `${cap(DAYS[(d.getDay() + 6) % 7])} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
    $('agDayList').innerHTML = its.length ? its.map((it) => row(it, today)).join('') : '<p class="muted">No hay nada este día.</p>';
  }
  function openDay(day) { dayOpen = day; renderDay(); $('agDay').showModal(); }
  $('agDayAdd').addEventListener('click', () => openForm(null, dayOpen));
  $('agDay').addEventListener('close', () => { dayOpen = null; });

  /* ---------- eventos ---------- */

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('dialog [data-close]')) { t.closest('dialog').close(); return; }
    const cyc = t.closest('[data-cycle]'); if (cyc) { e.stopPropagation(); cycle(cyc.dataset.cycle); return; }
    const ch = t.closest('.agchip, .agrow'); if (ch) { const it = items.find((x) => x.id === ch.dataset.id); if (it) openForm(it); return; }
    const more = t.closest('.agmore, .agnum'); if (more) { openDay(more.dataset.day); return; }
    const cell = t.closest('.agcell'); if (cell) { openForm(null, cell.dataset.day); }
  });
  [$('agDlg'), $('agDay')].forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  $('agAdd').addEventListener('click', () => openForm(null, view === 'month' && (cy !== now.getFullYear() || cm !== now.getMonth()) ? iso(new Date(cy, cm, 1)) : todayIso()));
  $('agPrev').addEventListener('click', () => { if (view === 'list') return; cm--; if (cm < 0) { cm = 11; cy--; } render(); });
  $('agNext').addEventListener('click', () => { if (view === 'list') return; cm++; if (cm > 11) { cm = 0; cy++; } render(); });
  $('agToday').addEventListener('click', () => { cy = now.getFullYear(); cm = now.getMonth(); render(); });
  document.querySelectorAll('.agtools .vtog button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('agKinds').addEventListener('click', (e) => {
    const b = e.target.closest('.chipf'); if (!b) return;
    fKind = b.dataset.kind; $('agKinds').querySelectorAll('.chipf').forEach((x) => x.classList.toggle('on', x === b)); render();
  });
  $('agClient').addEventListener('change', () => { fClient = $('agClient').value; render(); });

  api('/api/agenda').then((d) => { items = d.items || []; renderClients(); render(); })
    .catch(() => { $('agMonth').innerHTML = '<div class="glass emptybox">No se pudo cargar la agenda. Recarga la página.</div>'; });
  render();
})();
