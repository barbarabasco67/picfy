// Papelera: borrar fotos y galerías, recuperar, borrar para siempre y purga a los 30 días.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const B = process.env.BASE || 'http://127.0.0.1:8787';
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
const imgs = (n) => Array.from({ length: n }, (_, i) => `${process.cwd()}/tests/img/p${String(i).padStart(2, '0')}.jpg`);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  p.on('dialog', (d) => d.accept());
  await p.goto(B + '/registro');
  await p.fill('input[name=name]', 'Pap'); await p.fill('input[name=email]', `t${Date.now()}@ejemplo.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/galerias');
  await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Para borrar'); await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/\/galerias\/[0-9a-f]{16}/); const url = p.url().split('?')[0];
  await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
  const link = B + '/e/' + await p.$eval('body', (b) => b.dataset.token); await p.keyboard.press('Escape');
  await p.click('#openUpload').catch(() => {});
  await p.setInputFiles('#fileInput', imgs(4)); await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 4);
  await p.click('#upStart'); await p.waitForSelector('.toast', { timeout: 90000 });
  await p.waitForLoadState('load');
  const count = () => p.evaluate(() => document.querySelectorAll('#sortGrid .tile.ph').length);
  check('4 fotos subidas', (await count()) === 4, await count());

  // borrar 2 fotos -> papelera
  await p.click('#sortGrid .tile.ph >> nth=0 >> .chk'); await p.evaluate(() => document.querySelectorAll('#sortGrid .tile.ph .chk')[1].click());
  await p.click('[data-act=delete]'); await p.waitForTimeout(800);
  await p.goto(url); check('quedan 2 fotos', (await count()) === 2, await count());
  const g = await (await b.newContext()).newPage(); await g.goto(link);
  check('invitados ven 2', (await g.locator('#gallery figure, #gallery .gitem').count()) === 2, await g.locator('#gallery figure, #gallery .gitem').count());
  await p.goto(B + '/papelera'); check('2 fotos en la papelera', (await p.locator('.ttile').count()) === 2, await p.locator('.ttile').count());
  await p.check('.ttile >> nth=0 >> input'); await p.click('text=Recuperar lo marcado'); await p.waitForURL(/papelera\?ok/);
  check('queda 1 en la papelera', (await p.locator('.ttile').count()) === 1);
  await p.goto(url); check('vuelven 3 fotos', (await count()) === 3, await count());

  // borrar galería -> papelera, enlace de invitados muerto, recuperar
  await p.click('[data-open=setDlg]'); await p.click('#setDlg button.danger'); await p.waitForURL('**/galerias?ok*');
  check('la galería ya no está en la lista', (await p.locator('.gcards .gcard').count()) === 0);
  check('invitados: enlace caído', (await g.goto(link)).status() === 404);
  check('admin: 404 de la galería', (await p.goto(url)).status() === 404);
  await p.goto(B + '/papelera'); check('galería en la papelera', await p.isVisible('.trow:has-text("Para borrar")'));
  await p.check('.trow input'); await p.click('text=Recuperar lo marcado'); await p.waitForURL(/papelera\?ok/);
  check('galería recuperada: invitados 200', (await g.goto(link)).status() === 200);
  check('admin 200', (await p.goto(url)).status() === 200);

  // borrar para siempre
  await p.click('#sortGrid .tile.ph >> nth=0 >> .chk'); await p.click('[data-act=delete]'); await p.waitForTimeout(800);
  await p.goto(B + '/papelera'); await p.check('.ttile input >> nth=0'); await p.click('text=Borrar lo marcado para siempre'); await p.waitForURL(/papelera\?ok/);
  check('borrada para siempre', (await p.locator('.ttile').count()) === 1, await p.locator('.ttile').count());
  // pasados 7 días se elimina sola al entrar en la papelera
  require('child_process').execSync(`npx wrangler d1 execute picfy --local --command "UPDATE photos SET deleted_at = 1 WHERE state = 'trashed'"`, { stdio: 'ignore' });
  await p.goto(B + '/papelera');
  check('purga pasados los 7 días al entrar', await p.isVisible('text=La papelera está vacía'));
  if (await p.$('text=Vaciar la papelera')) await p.click('text=Vaciar la papelera');
  console.log(ok ? 'ALL OK' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e.message); process.exit(1); });
