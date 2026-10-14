const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('[name=name]', 'M'); await p.fill('[name=email]', 'm' + Date.now() + '@e.es'); await p.fill('[name=password]', 'clave-12345');
  const sc = await p.$('[name=code]'); if (sc) await sc.fill('codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  await p.click('#newGal'); await p.fill('#newDlg [name=name]', 'Mod');
  const au = await p.$('#newDlg [name=auto_approve]'); if (au && await au.isChecked()) await au.uncheck();
  await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  const adminUrl = p.url().split('?')[0];
  const token = await p.evaluate(() => document.body.dataset.token);
  // dos invitados distintos suben una foto cada uno
  for (const [n, f] of [['Ana', 'p00'], ['Luis', 'p01']]) {
    const g = await (await b.newContext()).newPage(); await g.goto(B + '/e/' + token);
    await g.click('#openUpload'); await g.fill('#guestName', n);
    await (await g.$('input[type=file]')).setInputFiles(['tests/img/' + f + '.jpg']);
    const c = await g.$('#upConsent'); if (c) await c.evaluate((e) => e.click());
    await g.click('#upStart'); await g.waitForTimeout(3500);
  }
  await p.goto(adminUrl);
  ok((await p.$$('.tile.ph')).length === 2, '2 fotos');
  ok(await p.$('#fGuest'), 'filtro por autor');
  await p.selectOption('#fGuest', { label: /Ana/ }.test ? undefined : undefined).catch(() => {});
  const opt = await p.$$eval('#fGuest option', (o) => o.map((x) => [x.value, x.textContent]));
  const ana = opt.find((o) => o[1].includes('Ana'));
  await p.selectOption('#fGuest', ana[0]);
  ok((await p.$$('.tile.ph:not(.hidden)')).length === 1, 'filtra por autor');
  await p.selectOption('#fGuest', '');
  await p.click('#showPending');
  ok((await p.$$('.tile.ph:not(.hidden)')).length === 2, 'pendientes visibles');
  // visor: A aprueba y avanza; R rechaza
  await p.locator('.tile.ph').first().click({ position: { x: 60, y: 120 } });
  await p.waitForSelector('#lb.open'); await p.waitForTimeout(800); await p.screenshot({ path: '/tmp/picfy_shots/mod.png' }); await p.keyboard.press('a'); await p.waitForTimeout(600);
  await p.keyboard.press('r'); await p.waitForTimeout(600);
  await p.keyboard.press('Escape');
  const states = await p.$$eval('.tile.ph', (t) => t.map((x) => x.dataset.state).sort());
  ok(states.join() === 'approved,rejected', 'estados ' + states.join());
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
