// Portada del cuadro desde la galería principal (no solo subgalerías)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'P'); await p.fill('input[name=email]', `p${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Principal'); await p.click('#newDlg button[type=submit]'); await p.waitForURL(/galerias\/\w{16}/);
  const files = [0, 1, 2].map((i) => process.cwd() + `/tests/img/p0${i}.jpg`);
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', files); await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 3); await p.click('#upStart'); await p.waitForSelector('.toast', { timeout: 60000 });
  await p.waitForSelector('.tile.ph'); await p.locator('.tile.ph').nth(2).locator('.chk').check({ force: true });
  ok(await p.locator('#asCover').count() === 1, 'botón Usar de portada en galería principal');
  await p.click('#asCover'); await p.waitForSelector('.toast:has-text("Portada")');
  await p.goto(B + '/galerias'); await p.waitForSelector('.gcard .cover img');
  ok(/\/c\/[0-9a-f]{32}\/thumb\?v=/.test(await p.locator('.gcard .cover img').first().getAttribute('src')), 'la tarjeta usa la portada elegida');
  
  await b.close();
})();
