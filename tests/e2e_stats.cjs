const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('[name=name]', 'E'); await p.fill('[name=email]', 'e' + Date.now() + '@e.es'); await p.fill('[name=password]', 'clave-12345');
  const sc = await p.$('[name=code]'); if (sc) await sc.fill('codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  await p.click('#newGal'); await p.fill('#newDlg [name=name]', 'Est'); await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  const adminUrl = p.url().split('?')[0];
  await p.click('#openUpload'); await p.waitForTimeout(300);
  await (await p.$('input[type=file]')).setInputFiles(['tests/img/p00.jpg', 'tests/img/p01.jpg']);
  const c = await p.$('#upConsent'); if (c) await c.evaluate((e) => e.click());
  await p.click('#upStart'); await p.waitForTimeout(4000);
  await p.goto(adminUrl); const token = await p.evaluate(() => document.body.dataset.token);
  // el dueño no cuenta
  const ow = await ctx.newPage(); await ow.goto(B + '/e/' + token); await ow.waitForTimeout(800);
  // dos invitados
  for (let i = 0; i < 2; i++) {
    const g = await (await b.newContext()).newPage(); await g.goto(B + '/e/' + token); await g.waitForSelector('a.tile');
    await g.click('a.tile'); await g.waitForTimeout(800);
  }
  await p.goto(adminUrl); await p.click('[data-open=statsDlg]'); await p.waitForTimeout(300);
  const k = await p.$$eval('.kpis dd', (d) => d.map((x) => x.textContent.trim()));
  ok(k[0] === '2' && k[1] === '2' && k[2] === '2', 'visitas/visitantes/hoy = ' + k.join(','));
  ok((await p.$$('.stop div')).length === 1, 'foto más abierta');
  await p.keyboard.press('Escape');
  ok((await p.textContent('.tile.ph .soc .eye')).trim() === '2', 'ojito con 2 visualizaciones');
  await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/picfy_shots/stats.png', clip: { x: 360, y: 300, width: 500, height: 300 } });
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
