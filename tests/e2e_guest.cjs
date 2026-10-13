// Prueba de extremo a extremo: administración -> invitado sube -> galería por hora -> Mi álbum (orden y borrado).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const B = process.env.BASE || 'http://127.0.0.1:8787';
const PASS = process.env.ADMIN_PASSWORD || 'prueba-local-123';
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
const imgs = (n) => Array.from({ length: n }, (_, i) => `${process.cwd()}/tests/img/p${String(i).padStart(2, '0')}.jpg`);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  p.on('dialog', (d) => d.accept());

  // 1. Admin crea un evento
  await p.goto(B + '/admin');
  await p.fill('input[name=password]', PASS); await p.click('button[type=submit]');
  await p.waitForSelector('text=Nuevo evento');
  await p.fill('input[name=name]', 'Boda de prueba');
  await p.fill('textarea[name=lead]', 'Sube tus fotos.');
  await p.click('button:has-text("Crear evento")');
  await p.waitForSelector('text=Enlace para invitados');
  const links = await p.$$eval('.linkbox', (n) => n.map((x) => x.textContent));
  await p.waitForSelector('.qr svg', { timeout: 5000 }).catch(() => {});
  check('QR dibujado', (await p.$$('.qr svg')).length === 1);
  const [guestUrl, manageUrl] = links.map((l) => l.replace(/^https?:\/\/[^/]+/, B));
  check('enlaces con formato', /\/e\/[0-9a-f]{32}$/.test(guestUrl) && /\/o\/[0-9a-f]{64}$/.test(manageUrl), guestUrl);
  require('fs').writeFileSync('/tmp/picfy_links.json', JSON.stringify({ guestUrl, manageUrl }));

  // 2. Invitado sube 12 fotos
  await p.goto(guestUrl);
  check('sin fotos todavía', await p.isVisible('.empty'));
  await p.click('#openUpload');
  await p.fill('#guestName', 'Marta');
  await p.setInputFiles('#fileInput', imgs(12));
  await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 12);
  check('botón subir activo', !(await p.$eval('#upStart', (e) => e.disabled)));
  // marcar 2 y quitarlas (borrado múltiple en el diálogo)
  const chks = await p.$$('.up-item .chk');
  await chks[0].click(); await chks[1].click();
  await p.click('#upRemove');
  check('quitadas 2 del diálogo', (await p.$$('.up-item')).length === 10);
  await p.setInputFiles('#fileInput', imgs(2)); // se vuelven a añadir p00 y p01
  await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 12);
  await p.click('#upStart');
  await p.waitForSelector('#upMsg:not(.hidden)', { timeout: 60000 });
  const msg = await p.textContent('#upMsg');
  check('mensaje de éxito', /12 fotos subidas y publicadas/.test(msg), msg);
  check('estados ok', (await p.$$('.up-item .st.ok')).length === 12);
  await p.click('#upClose');
  await p.waitForLoadState('load');

  // 3. Galería por hora de captura: p08(0) p07(1) p10(2) p02(3) p05(4) p11(5) p09(6) p00(7) p04(8) p06(9) p03(10) p01(11)
  await p.waitForSelector('#gallery .tile');
  check('12 fotos en galería', (await p.$$('#gallery .tile')).length === 12);
  const gIds = await p.$$eval('#gallery .tile', (n) => n.map((t) => t.dataset.id));
  const sizes = [];
  for (const id of gIds) sizes.push(await p.evaluate(async (id) => (await createImageBitmap(await (await fetch(`/m/${id}/m`)).blob())).width, id));
  check('miniaturas generadas (≤480px)', sizes.every((w) => w > 0 && w <= 480), sizes.join(','));
  check('sin pill Mi álbum', !(await p.$('#minePill')));
  const mr = await p.goto(B + '/e/x/mine/' + 'a'.repeat(32));
  check('página Mi álbum eliminada', mr.status() === 404);

  await b.close();
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
