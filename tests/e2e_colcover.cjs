// Portada de colección: subir, verla en la lista y en la página pública, quitarla
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'C'); await p.fill('input[name=email]', `c${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  await p.goto(B + '/colecciones'); await p.click('[data-open=newCol]'); await p.fill('#newCol input[name=name]', 'Cliente'); await p.click('#newCol button[type=submit]'); await p.waitForURL(/colecciones\/\w{16}/);
  const colUrl = p.url();
  // una galería con una foto, añadida a la colección
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'G1'); await p.click('#newDlg button[type=submit]'); await p.waitForURL(/galerias\/\w{16}/);
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', [process.cwd() + '/tests/img/p03.jpg']); await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 1); await p.click('#upStart'); await p.waitForSelector('.toast', { timeout: 60000 });
  await p.goto(colUrl); await p.click('[data-open=addGal]'); await p.check('#addGal input[name=gal]'); await Promise.all([p.waitForNavigation(), p.click('#addGal button.primary')]);
  await p.click('#colCoverOpen'); await p.waitForSelector('.covpick'); await p.click('.covpick'); await p.waitForSelector('.toast:has-text("Portada guardada")');
  await p.goto(B + '/colecciones'); ok(await p.locator('.gcard .cover img[src*="/cover?v="]').count() === 1, 'la lista de colecciones usa la portada elegida');
  await p.goto(colUrl); const pub = (await p.textContent('#colLink')).trim().replace(/^https?:\/\/[^/]+/, '');
  const g = await p.context().newPage(); await g.goto(B + pub); ok(await g.locator('.hero-cover').count() === 1, 'la página pública muestra la portada');
  await p.goto(colUrl); await p.click('#colCoverOpen'); await p.click('#colCoverDel'); await p.waitForSelector('.toast:has-text("quitada")'); await p.goto(B + '/colecciones'); ok(await p.locator('.gcard .cover img[src*="/cover?v="]').count() === 0, 'se puede quitar');
  ok(!errs.length, 'sin errores JS ' + errs.join());
  console.log('ALL OK'); await b.close();
})();
