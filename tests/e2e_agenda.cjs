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
async function add(p, kind, title, date, extra = {}) {
  await p.click('#agAdd'); await p.waitForSelector('#agDlg[open]');
  await p.click(`#agForm .kradio:has(input[value=${kind}]) span`);
  await p.fill('#agForm input[name=title]', title); await p.fill('#agForm input[name=date]', date);
  if (extra.end) await p.fill('#agForm input[name=end_date]', extra.end);
  if (extra.time) await p.fill('#agForm input[name=time]', extra.time);
  if (extra.client) await p.fill('#agForm input[name=client]', extra.client);
  if (extra.status) await p.selectOption('#agStatus', extra.status);
  await p.click('#agForm button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#agDlg[open]'));
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await reg(b, 'Agenda');
  check('menú con Agenda', !!(await p.$('a.nav[href="/agenda"]')));
  await p.click('a.nav[href="/agenda"]'); await p.waitForURL('**/agenda'); await p.waitForSelector('#agMonth .aggrid');
  const today = iso(new Date());
  await add(p, 'partido', 'Elite vs Rozas', today, { time: '18:30', client: 'Las Rozas 3x3' });
  await add(p, 'tarea', 'Entregar fotos del torneo', iso(off(-2)), { client: 'Behind the Bench' });
  await add(p, 'publicacion', 'Post resumen', iso(off(1)), { status: 'pendiente', client: 'Las Rozas 3x3' });
  await add(p, 'torneo', 'Torneo 3x3', iso(off(2)), { end: iso(off(4)), client: 'Las Rozas 3x3' });
  const here = new Date().getMonth();
  const chips = await p.$$eval('.agchip', (n) => n.map((x) => x.textContent.trim()));
  check('chips en el mes', chips.some((t) => /Elite vs Rozas/.test(t)) && chips.some((t) => /Torneo 3x3/.test(t)), chips.join('|'));
  check('torneo de varios días en 3 casillas', chips.filter((t) => /Torneo 3x3/.test(t)).length >= 2, chips.join('|'));
  check('resumen: atrasadas 1', /1\s*atrasadas/.test((await p.textContent('#agSum')).replace(/\s+/g, ' ')), await p.textContent('#agSum'));
  // filtros
  await p.click('#agKinds .chipf[data-kind=partido]');
  check('filtro partidos', (await p.$$eval('.agchip', (n) => n.length)) === 1);
  await p.click('#agKinds .chipf[data-kind=""]');
  await p.selectOption('#agClient', 'Behind the Bench');
  check('filtro cliente', (await p.$$eval('.agchip', (n) => n.map((x) => x.textContent)).then((a) => a.every((t) => /Entregar/.test(t)))));
  await p.selectOption('#agClient', '');
  // lista + atrasadas + cambiar estado
  await p.click('.agtools .vtog button[data-view=list]');
  check('lista: atrasadas arriba', /Atrasadas · 1/.test(await p.textContent('#agList')));
  await p.click('.agrow.late .agst'); await p.waitForTimeout(300);
  check('estado pasa a en curso', /en curso/.test(await p.textContent('.agrow.late .agst')));
  await p.click('.agrow.late .agst'); await p.waitForTimeout(300);
  check('al llegar a hecha sale de atrasadas', !(await p.$('.agrow.late')));
  await p.reload(); await p.waitForSelector('#agList .agrow');
  check('persiste al recargar', await p.evaluate(async () => (await (await fetch('/api/agenda')).json()).items.some((i) => i.status === 'hecha')));
  // editar y borrar
  await p.click('.agrow >> text=Post resumen'); await p.waitForSelector('#agDlg[open]');
  await p.fill('#agForm input[name=title]', 'Post resumen final'); await p.selectOption('#agStatus', 'publicada');
  await p.click('#agForm button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#agDlg[open]'));
  check('editado', /Post resumen final/.test(await p.textContent('#agList')));
  p.once('dialog', (d) => d.accept());
  await p.click('.agrow >> text=Post resumen final'); await p.waitForSelector('#agDlg[open]'); await p.click('#agDel');
  await p.waitForFunction(() => !document.querySelector('#agDlg[open]'));
  check('borrado', !/Post resumen final/.test(await p.textContent('#agList')));
  await p.click('.agtools .vtog button[data-view=month]');
  await p.screenshot({ path: '/tmp/picfy_shots/agenda_mes.png' });
  // móvil
  const m = await (await b.newContext({ viewport: { width: 390, height: 800 }, storageState: await p.context().storageState() })).newPage();
  await m.goto(B + '/agenda'); await m.waitForSelector('#agMonth .aggrid');
  check('móvil sin scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await m.screenshot({ path: '/tmp/picfy_shots/agenda_movil.png' });
  // seguridad: otra cuenta no ve ni toca lo ajeno; sin sesión no entra
  const id = await p.evaluate(async () => (await (await fetch('/api/agenda')).json()).items[0].id);
  const q = await reg(b, 'Otra');
  const mine = await q.evaluate(async () => (await (await fetch('/api/agenda')).json()).items.length);
  const edit = await q.evaluate(async (id) => (await fetch('/api/agenda/' + id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'x' }) })).status, id);
  const del = await q.evaluate(async (id) => (await fetch('/api/agenda/' + id, { method: 'DELETE' })).status, id);
  check('otra cuenta no ve nada', mine === 0, mine);
  check('otra cuenta no edita (404)', edit === 404, edit);
  const still = await p.evaluate(async () => (await (await fetch('/api/agenda')).json()).items.length);
  check('lo ajeno sigue ahí', still === 3, still);
  const anon = await (await b.newContext()).newPage();
  check('API sin sesión: 401', (await anon.request.get(B + '/api/agenda')).status() === 401);
  const r = await anon.goto(B + '/agenda'); check('página sin sesión pide entrar', /entrar/.test(anon.url()));
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
