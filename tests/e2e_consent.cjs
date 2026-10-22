// Consentimiento al subir y caducidad de galerías (cierre y borrado automático).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const B = process.env.BASE || 'http://127.0.0.1:8787';
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  await p.goto(B + '/registro');
  await p.fill('input[name=name]', 'Cons'); await p.fill('input[name=email]', `c${Date.now()}@ejemplo.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/inicio'); await p.goto(B + '/galerias');
  await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Campus menores'); await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/\/galerias\/[0-9a-f]{16}/); const url = p.url().split('?')[0];
  const settings = async (fn) => { await p.goto(url); await p.click('[data-open=setDlg]'); await fn(); await p.click('#setDlg button.primary'); await p.waitForURL(/\?ok/); };
  await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
  const link = B + '/e/' + await p.$eval('body', (b) => b.dataset.token); await p.keyboard.press('Escape');

  await settings(async () => { await p.check('#setDlg [name=consent]'); await p.fill('#setDlg [name=consent_text]', 'Tengo permiso de las familias.'); });
  const g = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage();
  await g.goto(link); await g.click('#openUpload');
  check('aparece el aviso de consentimiento', (await g.textContent('.consent')).includes('Tengo permiso de las familias.'));
  await g.setInputFiles('#fileInput', [`${process.cwd()}/tests/img/p00.jpg`]);
  await g.waitForSelector('.up-item');
  check('sin marcar no se puede subir', await g.isDisabled('#upStart'));
  await g.check('#upConsent');
  check('marcado se puede subir', !(await g.isDisabled('#upStart')));
  await g.click('#upStart'); await g.waitForSelector('.toast', { timeout: 30000 });
  check('subida con consentimiento', true);
  const key = await g.evaluate(() => Object.keys(localStorage).find((k) => k.startsWith('picfy_key_')) && localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('picfy_key_'))));
  const tok = link.split('/e/')[1];
  const r = await g.evaluate(async ([t, k]) => (await fetch(`/api/e/${t}/upload/init`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: k, name: '', filename: 'a.jpg', type: 'image/jpeg', size: 1000, w: 1, h: 1, crc: 1 }) })).status, [tok, key]);
  check('el servidor exige el consentimiento (400)', r === 400, r);

  // caducada sin borrar: invitados fuera, dueño dentro
  await settings(async () => { await p.fill('#setDlg [name=expires]', '2020-01-01'); });
  const gs = await g.goto(link);
  check('invitados: 410 caducada', gs.status() === 410, gs.status());
  await p.goto(url); check('dueño ve la galería con aviso de caducada', (await p.textContent('.alert:has-text("caducó")')).length > 0);

  // caducada con borrado: se elimina al primer acceso
  await settings(async () => { await p.check('#setDlg [name=expire_delete]'); });
  const cr = await g.goto(link); check('primer acceso tras caducar: 410', cr.status() === 410, cr.status());
  await new Promise((r2) => setTimeout(r2, 1500));
  const after = await p.goto(url); check('galería borrada tras la caducidad', after.status() === 404 || p.url().includes('/galerias') && !p.url().includes(url.split('/').pop()), after.status() + ' ' + p.url());
  const g2 = await g.goto(link); check('enlace de invitados ya no existe', g2.status() === 404, g2.status());
  console.log(ok ? 'ALL OK' : 'SOME FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e.message); process.exit(1); });
