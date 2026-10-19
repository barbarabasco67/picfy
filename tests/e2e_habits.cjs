const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
let ok = true; const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, c ? '' : x); if (!c) ok = false; };
async function reg(b, name, vp) {
  const p = await (await b.newContext({ viewport: vp || { width: 1100, height: 900 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  await p.goto(B + '/registro'); await p.fill('input[name=name]', name); await p.fill('input[name=email]', `h${Date.now()}${Math.random().toString(36).slice(2, 5)}@t.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/galerias');
  return p;
}
const api = (p, path, o) => p.evaluate(async ([path, o]) => { const r = await fetch(path, o); return { s: r.status, j: await r.json().catch(() => null) }; }, [path, o]);
async function add(p, name, o = {}) {
  await p.click('#hbAdd'); await p.waitForSelector('#hbDlg[open]');
  await p.fill('#hbForm input[name=name]', name);
  if (o.icon) await p.click(`#hbIcons .icopt[data-ic=${o.icon}]`);
  await p.fill('#hbForm input[name=goal]', String(o.goal || 1)); await p.fill('#hbForm input[name=step]', String(o.step || 1));
  if (o.unit) await p.fill('#hbForm input[name=unit]', o.unit);
  await p.click('#hbForm button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#hbDlg[open]'));
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await reg(b, 'Habitos');
  await p.goto(B + '/habitos'); check('/habitos lleva a la agenda', /\/agenda/.test(p.url())); await p.waitForSelector('#hbDays .hbday');
  check('semana con 7 días', (await p.$$('#hbDays .hbday')).length === 7);
  await add(p, 'Beber agua', { icon: 'gota', goal: 2000, step: 250, unit: 'ml' });
  await add(p, 'Gimnasio', { icon: 'pesas' });
  check('tarjetas creadas', (await p.$$('.hbcard')).length === 2);
  check('chip 0/2000 ml', /0\/2000 ml/.test(await p.textContent('.hbcard:has-text("Beber agua")')));
  await p.click('.hbcard:has-text("Beber agua") .hbplus'); await p.click('.hbcard:has-text("Beber agua") .hbplus');
  await p.waitForTimeout(300);
  check('suma de 250 en 250', /500\/2000 ml/.test(await p.textContent('.hbcard:has-text("Beber agua")')));
  await p.click('.hbcard:has-text("Gimnasio") .hbplus'); await p.waitForTimeout(300);
  check('hábito de 1/1 se marca', (await p.$('.hbcard.done:has-text("Gimnasio")')) !== null);
  check('anillo del día con progreso', /--p:(?!0%)/.test(await p.getAttribute('.hbday.today i', 'style')));
  await p.reload(); await p.waitForSelector('.hbcard');
  check('persiste al recargar', /500\/2000/.test(await p.textContent('.hbcard:has-text("Beber agua")')) && (await p.$('.hbcard.done:has-text("Gimnasio")')) !== null);
  // otro día
  await p.click('#hbDays .hbday:not(.today) >> nth=0'); await p.waitForTimeout(200);
  check('otro día empieza a cero', /0\/2000/.test(await p.textContent('.hbcard:has-text("Beber agua")')));
  await p.click('.hbday.today'); 
  // editar valor exacto
  await p.click('.hbcard:has-text("Beber agua") .hbmain'); await p.waitForSelector('#hbDlg[open]');
  await p.fill('#hbForm input[name=value]', '2000'); await p.click('#hbForm button[type=submit]'); await p.waitForFunction(() => !document.querySelector('#hbDlg[open]'));
  await p.waitForTimeout(300);
  check('valor exacto y completado', (await p.$('.hbcard.done:has-text("Beber agua")')) !== null);
  // borrar
  p.once('dialog', (d) => d.accept());
  await p.click('.hbcard:has-text("Gimnasio") .hbmain'); await p.waitForSelector('#hbDlg[open]'); await p.click('#hbDel');
  await p.waitForFunction(() => !document.querySelector('#hbDlg[open]'));
  check('borrado', (await p.$$('.hbcard')).length === 1);
  await p.screenshot({ path: '/tmp/picfy_shots/habitos.png' });
  const m = await (await b.newContext({ viewport: { width: 390, height: 800 }, storageState: await p.context().storageState() })).newPage();
  await m.goto(B + '/agenda'); await m.waitForSelector('.hbcard');
  check('móvil sin scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await m.screenshot({ path: '/tmp/picfy_shots/habitos_movil.png' });
  // seguridad
  const hid = (await api(p, '/api/habits')).j.habits[0].id;
  const q = await reg(b, 'Otra');
  check('otra cuenta no ve hábitos', (await api(q, '/api/habits')).j.habits.length === 0);
  check('otra cuenta no puede registrar', (await api(q, `/api/habits/${hid}/log`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ date: '2026-10-19', value: 5 }) })).s === 404);
  check('otra cuenta no puede borrar', (await api(q, `/api/habits/${hid}`, { method: 'DELETE' })).s === 404);
  const anon = await (await b.newContext()).newPage();
  check('API sin sesión: 401', (await anon.request.get(B + '/api/habits')).status() === 401);
  await anon.goto(B + '/agenda'); check('página sin sesión pide entrar', /entrar/.test(anon.url()));
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
