// Subir desde la misma pantalla del dueño + personalización (color, perfil, cabecera).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const B = process.env.BASE || 'http://127.0.0.1:8787';
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
const img = (i) => `${process.cwd()}/tests/img/p${String(i).padStart(2, '0')}.jpg`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  p.on('dialog', (d) => d.accept());
  await p.goto(B + '/registro');
  await p.fill('input[name=name]', 'Marca'); await p.fill('input[name=email]', `b${Date.now()}@ejemplo.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/inicio'); await p.goto(B + '/galerias');

  // Crear con personalización
  await p.click('#newGal');
  await p.fill('#newDlg input[name=name]', 'Boda personalizada');
  await p.click('#newDlg [data-dtab=pe]');
  await p.click('#newDlg .sw[data-c="#2f6fed"]');
  await p.setInputFiles('#newDlg [data-brand-file=avatar]', img(2));
  await p.setInputFiles('#newDlg [data-brand-file=cover]', img(5));
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/picfy_shots/b1_crear.png' });
  await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/\/galerias\/[0-9a-f]{16}\?ok/, { timeout: 30000 });
  const galUrl = p.url().split('?')[0];
  check('galería creada con personalización', true);

  // Subir en la misma pantalla
  const before = p.url();
  await p.click('#openUpload');
  check('diálogo de subida en la misma página', await p.isVisible('#upDlg') && p.url() === before);
  check('sin campo de nombre para el dueño', !(await p.isVisible('#guestName')));
  await p.setInputFiles('#fileInput', [img(0), img(1), img(3)]);
  await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 3);
  await p.click('#upStart');
  await p.waitForSelector('.toast', { timeout: 90000 });
  check('subida del dueño', true);
  await p.waitForLoadState('load'); await p.waitForTimeout(600);
  check('3 fotos y publicadas directamente', (await p.$$('.tile.ph[data-state=approved]')).length === 3);

  // Página de invitados con el aspecto elegido
  await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
  const guestUrl = B + '/e/' + await p.$eval('body', (b) => b.dataset.token); await p.keyboard.press('Escape');
  const g = await (await b.newContext({ viewport: { width: 430, height: 860 } })).newPage();
  await g.goto(guestUrl); await g.waitForTimeout(700);
  check('cabecera visible', await g.isVisible('.hero-cover'));
  check('foto de perfil visible', await g.isVisible('.hero-avatar'));
  const bg = await g.$eval('#openUpload', (e) => getComputedStyle(e).backgroundColor);
  check('botón con el color elegido', bg === 'rgb(47, 111, 237)', bg);
  const loaded = await g.$eval('.hero-avatar', (i) => i.complete && i.naturalWidth > 0);
  check('perfil carga', loaded);
  await g.screenshot({ path: '/tmp/picfy_shots/b2_invitado.png' });
  await g.click('[data-view=list]'); await g.waitForTimeout(400); await g.screenshot({ path: '/tmp/picfy_shots/b2l_invitado.png' }); await g.click('[data-view=grid]');
  await g.setViewportSize({ width: 1360, height: 900 }); await g.waitForTimeout(500); await g.screenshot({ path: '/tmp/picfy_shots/b2d_invitado.png' }); await g.setViewportSize({ width: 430, height: 860 });

  // Editar: cambiar color y quitar cabecera
  await p.click('[data-open=brandDlg]');
  await p.click('#brandDlg .sw[data-c="#2f9e5f"]');
  check('el HEX sigue al color', (await p.inputValue('#brandDlg .hexin')) === '#2f9e5f');
  await p.fill('#brandDlg .hexin', '2f9e5f'); await p.fill('#brandDlg .rgbin >> nth=0', '47');
  check('RGB y HEX coinciden', (await p.inputValue('#brandDlg .hexin')) === '#2f9e5f', await p.inputValue('#brandDlg .hexin'));
  await p.check('#brandDlg [data-brand-remove=cover]');
  await p.screenshot({ path: '/tmp/picfy_shots/b3_editar.png' });
  await p.click('#brandDlg button.primary'); await p.waitForSelector('.alert.ok:has-text("Personalización guardada")');
  await g.reload(); await g.waitForTimeout(500);
  check('cabecera quitada', !(await g.isVisible('.hero-cover')));
  const nc = await g.$eval('#openUpload', (e) => getComputedStyle(e).backgroundColor); check('color nuevo', nc === 'rgb(47, 158, 95)', nc);
  check('perfil se mantiene', await g.isVisible('.hero-avatar'));
  const r = await g.request.get(guestUrl.replace(/\/e\/.*/, '/c/' + guestUrl.split('/').pop() + '/cover'));
  check('imagen quitada devuelve 404', r.status() === 404);

  // Subgalería hereda aspecto
  await p.goto(galUrl);
  await p.click('[data-open=subDlg]'); await p.fill('#subDlg input[name=name]', 'Sede A'); await p.click('#subDlg button.primary');
  await p.waitForURL(/\/galerias\/[0-9a-f]{16}\?ok/);
  await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
  const subGuest = B + '/e/' + await p.$eval('body', (b) => b.dataset.token); await p.keyboard.press('Escape');
  await g.goto(subGuest); await g.waitForTimeout(500);
  check('subgalería hereda color y perfil', (await g.$eval('#openUpload', (e) => getComputedStyle(e).backgroundColor)) === 'rgb(47, 158, 95)' && await g.isVisible('.hero-avatar'));

  // Un extraño no puede cambiar la marca
  const o = await (await b.newContext()).request.put(`${B}/api/g/${galUrl.split('/').pop()}/brand/cover`, { data: 'x', headers: { 'content-type': 'image/jpeg' } });
  check('API de marca protegida', o.status() === 403);
  await b.close();
  console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
