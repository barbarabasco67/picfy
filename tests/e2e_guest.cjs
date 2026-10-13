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
  check('botón Ver mi álbum', await p.isVisible('#goMine'));
  await p.click('#upClose');
  await p.waitForLoadState('load');

  // 3. Galería por hora de captura: p08(0) p07(1) p10(2) p02(3) p05(4) p11(5) p09(6) p00(7) p04(8) p06(9) p03(10) p01(11)
  await p.waitForSelector('#gallery .tile');
  check('12 fotos en galería', (await p.$$('#gallery .tile')).length === 12);
  const gIds = await p.$$eval('#gallery .tile', (n) => n.map((t) => t.dataset.id));
  const sizes = [];
  for (const id of gIds) sizes.push(await p.evaluate(async (id) => (await createImageBitmap(await (await fetch(`/m/${id}/m`)).blob())).width, id));
  check('miniaturas generadas (≤480px)', sizes.every((w) => w > 0 && w <= 480), sizes.join(','));
  check('pill Mi álbum visible', await p.isVisible('#minePill'));

  const mineHref = await p.$eval('#minePill', (a) => a.getAttribute('href'));
  await p.goto(B + mineHref);
  await p.waitForSelector('#sortGrid .tile');
  const order0 = await p.$$eval('#sortGrid .tile img', (n) => n.map((i) => i.naturalWidth));
  const ids0 = await p.$$eval('#sortGrid .tile', (n) => n.map((t) => t.dataset.id));
  check('Mi álbum con 12 fotos', ids0.length === 12);
  // el orden esperado por hora: comprobar contra el servidor
  const expectedNames = ['p08', 'p07', 'p10', 'p02', 'p05', 'p11', 'p09', 'p00', 'p04', 'p06', 'p03', 'p01'];
  const sh = await p.screenshot({ path: '/tmp/picfy_mine.png' });
  await p.goto(guestUrl); await p.waitForSelector('#gallery .tile');
  const galIds = await p.$$eval('#gallery .tile', (n) => n.map((t) => t.dataset.id));
  check('mismo orden en Mi álbum y galería', JSON.stringify(galIds) === JSON.stringify(ids0));
  // verificar orden por EXIF: las fotos se crearon con ancho 1000+30*i, la miniatura es 480 de ancho; usar la l (1600 > ancho) = ancho real (1000+30*i)
  const widths = [];
  for (const id of galIds) widths.push(await p.evaluate(async (id) => { const r = await fetch(`/m/${id}/l`); const bm = await createImageBitmap(await r.blob()); return bm.width; }, id));
  const nameByW = (w) => 'p' + String(Math.round((w - 1000) / 30)).padStart(2, '0');
  check('orden por hora de captura', JSON.stringify(widths.map(nameByW)) === JSON.stringify(expectedNames), widths.map(nameByW).join(','));

  // 4. Mover en Mi álbum: arrastrar la última al principio
  await p.goto(B + mineHref); await p.waitForSelector('#sortGrid .tile');
  const tiles = await p.$$('#sortGrid .tile');
  const last = tiles[tiles.length - 1], first = tiles[0];
  await last.scrollIntoViewIfNeeded();
  const fb = await first.boundingBox(), lb = await last.boundingBox();
  await p.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await p.mouse.down();
  await p.mouse.move(lb.x + lb.width / 2 + 20, lb.y + lb.height / 2 + 20, { steps: 4 });
  await p.mouse.move(fb.x + 5, fb.y + fb.height / 2, { steps: 12 });
  await p.mouse.up();
  await p.waitForSelector('.toast:has-text("Orden guardado")', { timeout: 5000 }).catch(() => {});
  const ids1 = await p.$$eval('#sortGrid .tile', (n) => n.map((t) => t.dataset.id));
  check('foto movida al principio', ids1[0] === ids0[11] && ids1[1] === ids0[0], ids1.slice(0, 2).join('|'));
  await p.reload(); await p.waitForSelector('#sortGrid .tile');
  const ids2 = await p.$$eval('#sortGrid .tile', (n) => n.map((t) => t.dataset.id));
  check('orden persistido tras recargar', JSON.stringify(ids2) === JSON.stringify(ids1));
  await p.goto(guestUrl); await p.waitForSelector('#gallery .tile');
  const gal2 = await p.$$eval('#gallery .tile', (n) => n.map((t) => t.dataset.id));
  check('galería general sigue el orden del invitado', JSON.stringify(gal2) === JSON.stringify(ids1));

  // 5. Selección con rectángulo y borrado en bloque
  await p.goto(B + mineHref); await p.waitForSelector('#sortGrid .tile');
  await p.fill('#size', '96');
  const t0 = await (await p.$$('#sortGrid .tile'))[0].boundingBox();
  const t3 = await (await p.$$('#sortGrid .tile'))[3].boundingBox();
  await p.mouse.move(t0.x - 8, t0.y - 8);
  await p.mouse.down();
  await p.mouse.move(t3.x + t3.width - 4, t3.y + t3.height - 4, { steps: 10 });
  await p.mouse.up();
  const nPicked = await p.$$eval('#sortGrid .tile.picked', (n) => n.length);
  check('rectángulo marca 4 fotos', nPicked === 4, nPicked);
  check('botón borrar marcadas visible', await p.isVisible('#delPicked'));
  await p.click('#delPicked');
  await p.waitForFunction(() => document.querySelectorAll('#sortGrid .tile').length === 8, null, { timeout: 8000 });
  check('quedan 8 tras borrar 4', true);
  // papelera individual
  await p.hover('#sortGrid .tile >> nth=0');
  await p.click('#sortGrid .tile >> nth=0 >> .trash');
  await p.waitForFunction(() => document.querySelectorAll('#sortGrid .tile').length === 7, null, { timeout: 8000 });
  check('papelera individual', true);
  await p.reload(); await p.waitForSelector('#sortGrid .tile');
  check('persistido: 7 fotos', (await p.$$('#sortGrid .tile')).length === 7);

  await b.close();
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
