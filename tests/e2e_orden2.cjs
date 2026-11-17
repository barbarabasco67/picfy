// Orden en el panel: mover una, mover un grupo, al principio, al final; debe quedar tal cual tras recargar.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'O'); await p.fill('input[name=email]', `o${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL(/galerias|inicio/);
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Orden2'); await p.click('#newDlg button[type=submit]'); await p.waitForURL(/galerias\/\w{16}/);
  const files = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => process.cwd() + `/tests/img/p0${i}.jpg`);
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', files); await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 10); await p.click('#upStart');
  await p.waitForSelector('.toast'); await p.waitForFunction(() => document.querySelectorAll('.tile.ph').length === 10);
  const ids = () => p.locator('.tile.ph').evaluateAll((l) => l.map((e) => e.dataset.id.slice(0, 4)));
  const drag = async (from, to, after) => {
    const a = await p.locator('.tile.ph').nth(from).boundingBox(), z = await p.locator('.tile.ph').nth(to).boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
    await p.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 20, { steps: 4 });
    await p.mouse.move(z.x + z.width * (after ? 0.8 : 0.2), z.y + z.height / 2, { steps: 8 }); await p.mouse.up();
    await p.waitForSelector('.toast:has-text("Orden guardado")'); await p.waitForTimeout(2300);
  };
  const same = async (m) => { const d = await ids(); await p.reload(); await p.waitForSelector('.tile.ph'); const r = await ids(); ok(JSON.stringify(d) === JSON.stringify(r), m + ' → ' + r.join(',')); };
  await drag(9, 0, false); await same('último al principio');
  await drag(0, 5, true); await same('primero a la mitad');
  await drag(2, 9, true); await same('uno al final');
  // grupo: marcar 3 sueltas y moverlas al principio
  for (const i of [3, 5, 7]) await p.locator('.tile.ph').nth(i).locator('.chk').check({ force: true });
  const sel = await p.locator('.tile.ph.picked').evaluateAll((l) => l.map((e) => e.dataset.id.slice(0, 4)));
  await drag(5, 0, false); const after = await ids();
  ok(JSON.stringify(after.slice(0, 3)) === JSON.stringify(sel), 'el grupo se coloca junto al principio: ' + after.join(','));
  await same('grupo al principio');
  for (const i of [0, 1, 2]) await p.locator('.tile.ph').nth(i).locator('.chk').check({ force: true });
  await drag(1, 8, true); await same('grupo al final de la lista');
  for (const i of [4, 6]) await p.locator('.tile.ph').nth(i).locator('.chk').check({ force: true });
  const s2 = await p.locator('.tile.ph.picked').evaluateAll((l) => l.map((e) => e.dataset.id.slice(0, 4)));
  await p.click('#selbar [data-act=end]'); await p.waitForSelector('.toast:has-text("Orden guardado")');
  const e2 = await ids(); ok(JSON.stringify(e2.slice(-2)) === JSON.stringify(s2), 'botón Al final: ' + e2.join(','));
  await same('Al final guardado');
  await p.locator('.tile.ph').nth(3).locator('.chk').check({ force: true });
  await p.click('#selbar [data-act=top]'); await p.waitForSelector('.toast:has-text("Orden guardado")'); await same('botón Al principio guardado');
  await b.close();
})();
