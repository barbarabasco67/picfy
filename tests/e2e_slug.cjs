const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
let ok = true; const check = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n, c ? '' : (x || '')); if (!c) ok = false; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Slug'); await p.fill('input[name=email]', `s${Date.now()}@t.es`);
  await p.fill('input[name=password]', 'clave1234'); if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo'); await p.click('button[type=submit]');
  await p.waitForURL(/galerias/);
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Torneo A'); await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/galerias\/[0-9a-f]{16}/);
  const url = p.url();
  await p.click('[data-open=setDlg]');
  await p.fill('#setDlg input[name=slug]', 'Torneo Las Rozas 2026!');
  await p.click('#setDlg button[type=submit]:not([formaction])');
  await p.waitForLoadState('load');
  check('guardado', /guardados/.test(await p.textContent('body')));
  check('enlace de compartir usa el nombre', (await p.textContent('#guestLink')).trim().endsWith('/g/torneo-las-rozas-2026'));
  const g = await ctx.newPage();
  const r = await g.goto(B + '/g/torneo-las-rozas-2026');
  check('/g/slug abre la galería', r.status() === 200 && /Torneo A/.test(await g.textContent('body')));
  check('slug inexistente 404', (await g.goto(B + '/g/no-existe')).status() === 404);
  // otra galería no puede repetirlo
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Torneo B'); await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/galerias\/[0-9a-f]{16}/);
  await p.click('[data-open=setDlg]'); await p.fill('#setDlg input[name=slug]', 'torneo-las-rozas-2026');
  await p.click('#setDlg button[type=submit]:not([formaction])'); await p.waitForLoadState('load');
  check('repetido avisa', /ya está en uso/.test(await p.textContent('body')));
  check('B sigue sin slug', (await g.goto(B + '/g/torneo-las-rozas-2026')) && /Torneo A/.test(await g.textContent('body')));
  // quitar
  await p.goto(url); await p.click('[data-open=setDlg]'); await p.fill('#setDlg input[name=slug]', '');
  await p.click('#setDlg button[type=submit]:not([formaction])'); await p.waitForLoadState('load');
  check('quitado: 404', (await g.goto(B + '/g/torneo-las-rozas-2026')).status() === 404);
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
