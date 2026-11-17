// Orden por arrastre en la galería pública (solo dueña/o) y en el panel.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'O'); await p.fill('input[name=email]', `o${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL(/galerias|inicio/);
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Orden'); await p.click('#newDlg button[type=submit]'); await p.waitForURL(/galerias\/\w{16}/);
  const files = [0, 1, 2, 3].map((i) => process.cwd() + `/tests/img/p0${i}.jpg`);
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', files); await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 4); await p.click('#upStart');
  await p.waitForSelector('.toast'); await p.waitForSelector('.tile.ph');
  await p.click('#openShare'); await p.waitForTimeout(400); const gl = (await p.textContent('#guestLink')).trim().replace(/^https?:\/\/[^/]+/, B); await p.keyboard.press('Escape');
  await p.goto(gl); await p.waitForSelector('.gitem');
  const ids = () => p.locator('.gitem .tile').evaluateAll((l) => l.map((e) => e.dataset.id));
  const before = await ids(); ok(before.length === 4, '4 elementos en la galería pública');
  const a = await p.locator('.gitem').nth(0).boundingBox(), z = await p.locator('.gitem').nth(2).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  await p.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 20, { steps: 4 });
  await p.mouse.move(z.x + z.width * 0.8, z.y + z.height / 2, { steps: 8 }); await p.mouse.up();
  await p.waitForSelector('.toast:has-text("Orden guardado")');
  ok(!(await p.locator('.lb.open').count()), 'no se abre el visor tras arrastrar');
  await p.reload(); await p.waitForSelector('.gitem'); const after = await ids();
  ok(after[0] !== before[0] && after.indexOf(before[0]) === 2, 'el orden se guarda: ' + after.map((x) => x.slice(0, 4)).join(','));
  const g = await (await b.newContext()).newPage(); await g.goto(gl); await g.waitForSelector('.gitem');
  ok((await g.evaluate(() => document.body.dataset.sortapi)) === undefined, 'un invitado no puede reordenar');
  ok(JSON.stringify(await g.locator('.gitem .tile').evaluateAll((l) => l.map((e) => e.dataset.id))) === JSON.stringify(after), 'el invitado ve el mismo orden');
  await b.close();
})();
