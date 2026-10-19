const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
let ok = true; const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, c ? '' : x); if (!c) ok = false; };
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const off = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
async function reg(b, name) {
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  await p.goto(B + '/registro'); await p.fill('input[name=name]', name); await p.fill('input[name=email]', `a${Date.now()}${Math.random().toString(36).slice(2, 5)}@t.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/galerias');
  return p;
}
async function add(p, kind, title, date, x = {}) {
  await p.click('#agAdd'); await p.waitForSelector('#agDlg[open]');
  await p.click(`#agForm .kradio:has(input[value=${kind}]) span`);
  if (x.icon) await p.click(`#agIcons .icopt[data-ic=${x.icon}]`);
  if (x.imp) await p.check('#agForm input[name=important]');
  await p.fill('#agForm input[name=title]', title);
  await p.fill('#agForm input[name=date]', date || '');
  if (x.time) await p.fill('#agForm input[name=time]', x.time);
  if (x.end) await p.fill('#agForm input[name=end_date]', x.end);
  if (x.cat) await p.fill('#agForm input[name=category]', x.cat);
  await p.click('#agForm button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#agDlg[open]'));
}
const api = (p, path, o) => p.evaluate(async ([path, o]) => { const r = await fetch(path, o); return { s: r.status, j: await r.json().catch(() => null) }; }, [path, o]);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await reg(b, 'Agenda');
  await p.click('a.nav[href="/agenda"]'); await p.waitForURL('**/agenda'); await p.waitForSelector('#agWeek .agday');
  check('semana con 7 días', (await p.$$('#agWeek .agday')).length === 7);
  // tarea rápida sin fecha → Por hacer
  await p.fill('#agQuickT', 'Preparar convocatoria'); await p.press('#agQuickT', 'Enter');
  await p.waitForSelector('#agSide .agbox:has-text("Por hacer") .agent');
  check('tarea rápida en Por hacer', /Preparar convocatoria/.test(await p.textContent('#agSide')));
  await add(p, 'evento', 'Game Canoe', iso(new Date()), { time: '10:30', cat: 'Las Rozas 3x3', icon: 'balon' });
  await add(p, 'torneo', 'Torneo fin de semana', iso(off(1)), { end: iso(off(3)) });
  await add(p, 'tarea', 'Entregar fotos', iso(off(-2)), { cat: 'Behind the Bench' });
  await add(p, 'grabacion', 'Grabación spot', iso(off(2)));
  await add(p, 'reunion', 'Reunión patrocinador', iso(off(200)), { imp: true });
  check('evento en la semana', /Game Canoe/.test(await p.textContent('#agWeek')) && /10:30/.test(await p.textContent('#agWeek')));
  check('icono solo si se elige', (await p.$$('#agWeek .agic')).length === 1 && !/[\u{1F300}-\u{1FAFF}\u2B50\u2705]/u.test(await p.textContent('#agWeek')));
  check('todos los tipos en el formulario', (await (async () => { await p.click('#agAdd'); const n = await p.$$eval('#agForm .kradio', (x) => x.map((e) => e.textContent.trim())); await p.click('#agDlg [data-close]'); return n; })()).length === 8);
  check('importante lejano en el lateral', /Reunión patrocinador/.test(await p.textContent('#agSide .agbox.imp')));
  check('atrasadas en el lateral', /Entregar fotos/.test(await p.textContent('#agSide .agbox.bad')));
  check('próximos en el lateral', /Game Canoe/.test(await p.textContent('#agSide .agbox:has-text("Próximos")')));
  check('tarea de varios días', await (async () => { await add(p, 'tarea', 'Informe largo', iso(off(0)), { end: iso(off(2)) }); return (await p.$$eval('#agWeek .agent', (n) => n.filter((x) => /Informe largo/.test(x.textContent)).length)) === 3; })());
  check('filtros por tipo', (await p.$$eval('#agCats .chipf', (n) => n.map((x) => x.textContent.trim()))).join('|').includes('Torneos'));
  await p.click('#agCats .chipf:has-text("Torneos")');
  check('filtro por tipo', !/Game Canoe/.test(await p.textContent('#agWeek')) && /Torneo fin/.test(await p.textContent('#agWeek')));
  await p.click('#agCats .chipf:has-text("Todo")');
  // casilla: marcar hecha
  await p.click('#agSide .agbox.bad .agck'); await p.waitForTimeout(300);
  check('al marcar, sale de atrasadas', !(await p.$('#agSide .agbox.bad')));
  check('aparece en Hechas', /Entregar fotos/.test(await p.textContent('#agSide .agbox:has-text("Hechas")')));
  await p.reload(); await p.waitForSelector('#agWeek .agday');
  check('persiste hecha', /Entregar fotos/.test(await p.textContent('#agSide .agbox:has-text("Hechas")')));
  // editar y borrar
  await p.click('#agSide .agbox:has-text("Por hacer") .agent'); await p.waitForSelector('#agDlg[open]');
  await p.fill('#agForm input[name=title]', 'Convocatoria enviada'); await p.click('#agForm button[type=submit]');
  await p.waitForFunction(() => !document.querySelector('#agDlg[open]'));
  check('editado', /Convocatoria enviada/.test(await p.textContent('#agSide')));
  p.once('dialog', (d) => d.accept());
  await p.click('#agSide .agent:has-text("Convocatoria enviada")'); await p.waitForSelector('#agDlg[open]'); await p.click('#agDel');
  await p.waitForFunction(() => !document.querySelector('#agDlg[open]'));
  check('borrado', !/Convocatoria enviada/.test(await p.textContent('#agSide')));
  // validación: evento sin fecha → 400
  check('torneo sin fecha: permitido', (await api(p, '/api/agenda', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'torneo', title: 'Sin fecha aún' }) })).s === 200);
  await p.reload(); await p.waitForSelector('#agWeek .agday');
  check('sin fecha va a Por hacer', /Sin fecha aún/.test(await p.textContent('#agSide .agbox.todo')));
  check('Por hacer sin etiqueta de tipo', !/Torneo/.test(await p.textContent('#agSide .agbox.todo')));
  // arrastrar de Por hacer a un día y de vuelta
  await p.dragAndDrop('#agSide .agbox.todo .agent:has-text("Sin fecha aún")', '#agWeek .agday:nth-child(1)');
  await p.waitForTimeout(500);
  check('arrastrar a un día', /Sin fecha aún/.test(await p.textContent('#agWeek .agday:nth-child(1)')) && !/Sin fecha aún/.test(await p.textContent('#agSide .agbox.todo')));
  await p.dragAndDrop('#agWeek .agday:nth-child(1) .agent:has-text("Sin fecha aún")', '#agWeek .agday:nth-child(2)');
  await p.waitForTimeout(500);
  check('mover entre días', /Sin fecha aún/.test(await p.textContent('#agWeek .agday:nth-child(2)')));
  await p.reload(); await p.waitForSelector('#agWeek .agday');
  check('el cambio de día persiste', /Sin fecha aún/.test(await p.textContent('#agWeek .agday:nth-child(2)')));
  await p.dragAndDrop('#agWeek .agday:nth-child(2) .agent:has-text("Sin fecha aún")', '#agSide .agbox.todo');
  await p.waitForTimeout(500);
  check('volver a Por hacer', /Sin fecha aún/.test(await p.textContent('#agSide .agbox.todo')));
  // menú de la izquierda plegable
  const w0 = await p.evaluate(() => document.querySelector('.frame > .side').getBoundingClientRect().width);
  await p.click('#navToggle'); await p.waitForTimeout(250);
  const w1 = await p.evaluate(() => document.querySelector('.frame > .side').getBoundingClientRect().width);
  check('menú se pliega', w1 < w0 - 60, w0 + ' ' + w1);
  await p.reload(); await p.waitForSelector('#agWeek .agday');
  check('recuerda el menú plegado', (await p.evaluate(() => document.querySelector('.frame > .side').getBoundingClientRect().width)) < w0 - 60);
  await p.click('#navToggle');
  // semana siguiente y mes
  await p.click('#agNext'); await p.click('#agToday');
  // torneo de varios días arrastrado en el mes: conserva su duración
  await p.click('[data-view=month]'); await p.waitForSelector('.aggrid');
  const before = await p.evaluate(async () => (await (await fetch('/api/agenda')).json()).items.find((i) => i.title === 'Torneo fin de semana'));
  const span0 = (new Date(before.end_date) - new Date(before.date)) / 864e5;
  const cells = await p.$$eval('.agcell', (n) => n.map((c) => c.dataset.day));
  const to = cells[cells.indexOf(before.date) + 1];
  await p.dragAndDrop(`.agcell[data-day="${before.date}"] .agchip:has-text("Torneo fin")`, `.agcell[data-day="${to}"]`); await p.waitForTimeout(500);
  const after = await p.evaluate(async () => (await (await fetch('/api/agenda')).json()).items.find((i) => i.title === 'Torneo fin de semana'));
  check('mes: arrastrar mueve el torneo y conserva su duración', after.date === to && (new Date(after.end_date) - new Date(after.date)) / 864e5 === span0, JSON.stringify(after));
  await p.click('[data-view=week]');
  await p.click('[data-view=month]'); await p.waitForSelector('.aggrid');
  check('mes con chips', (await p.$$eval('.agchip', (n) => n.length)) >= 2);
  await p.click('.agcell.today .agnum'); await p.waitForSelector('#agDay[open]');
  check('diálogo del día', /Game Canoe/.test(await p.textContent('#agDayList')));
  await p.click('#agDay [data-close]');
  await p.screenshot({ path: '/tmp/picfy_shots/agenda_mes.png' });
  await p.click('[data-view=week]'); await p.screenshot({ path: '/tmp/picfy_shots/agenda_semana.png' });
  const m = await (await b.newContext({ viewport: { width: 390, height: 800 }, storageState: await p.context().storageState() })).newPage();
  await m.goto(B + '/agenda'); await m.waitForSelector('#agWeek .agday');
  check('móvil sin scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await m.screenshot({ path: '/tmp/picfy_shots/agenda_movil.png' });
  await m.click('[data-view=month]'); await m.waitForSelector('.aggrid');
  check('móvil mes sin scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // seguridad
  const id = (await api(p, '/api/agenda')).j.items[0].id;
  const q = await reg(b, 'Otra');
  check('otra cuenta no ve nada', (await api(q, '/api/agenda')).j.items.length === 0);
  check('otra cuenta no edita (404)', (await api(q, '/api/agenda/' + id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'x' }) })).s === 404);
  check('otra cuenta no borra', ((await api(q, '/api/agenda/' + id, { method: 'DELETE' })), (await api(p, '/api/agenda')).j.items.length === 7));
  const anon = await (await b.newContext()).newPage();
  check('API sin sesión: 401', (await anon.request.get(B + '/api/agenda')).status() === 401);
  await anon.goto(B + '/agenda'); check('página sin sesión pide entrar', /entrar/.test(anon.url()));
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
