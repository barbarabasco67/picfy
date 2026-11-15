// Portada de colección: subir, verla en la lista y en la página pública, quitarla
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'C'); await p.fill('input[name=email]', `c${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  await p.goto(B + '/colecciones'); await p.click('[data-open=newCol]'); await p.fill('#newCol input[name=name]', 'Cliente'); await p.click('#newCol button[type=submit]'); await p.waitForURL(/colecciones\/\w{16}/);
  const colUrl = p.url();
  await p.setInputFiles('#colCoverFile', process.cwd() + '/tests/img/p03.jpg'); await p.waitForSelector('.toast:has-text("Portada guardada")');
  await p.reload(); ok(/\/col\/[0-9a-f]{32}\/cover\?v=/.test(await p.locator('#colCoverImg').getAttribute('src')), 'la portada se guarda');
  await p.goto(B + '/colecciones'); ok(await p.locator('.gcard .cover img[src*="/cover?v="]').count() === 1, 'la lista de colecciones usa la portada');
  await p.goto(colUrl); const pub = (await p.textContent('#colLink')).trim().replace(/^https?:\/\/[^/]+/, '');
  const g = await p.context().newPage(); await g.goto(B + pub); ok(await g.locator('.hero-cover').count() === 1, 'la página pública muestra la portada');
  await p.click('#colCoverDel'); await p.waitForSelector('.toast:has-text("quitada")'); await p.reload(); ok(await p.locator('#colCoverDel[hidden]').count() === 1, 'se puede quitar');
  ok(!errs.length, 'sin errores JS ' + errs.join());
  console.log('ALL OK'); await b.close();
})();
