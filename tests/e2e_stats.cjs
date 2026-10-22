const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('[name=name]', 'E'); await p.fill('[name=email]', 'e' + Date.now() + '@e.es'); await p.fill('[name=password]', 'clave-12345');
  const sc = await p.$('[name=code]'); if (sc) await sc.fill('codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]); await p.goto(B + '/galerias');
  await p.click('#newGal'); await p.fill('#newDlg [name=name]', 'Est'); await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  const adminUrl = p.url().split('?')[0];
  await p.click('#openUpload'); await p.waitForTimeout(300);
  await (await p.$('input[type=file]')).setInputFiles(['tests/img/p00.jpg', 'tests/img/p01.jpg']);
  const c = await p.$('#upConsent'); if (c) await c.evaluate((e) => e.click());
  await p.click('#upStart'); await p.waitForTimeout(4000);
  await p.goto(adminUrl); const token = await p.evaluate(() => document.body.dataset.token);
  await p.click('[data-open=setDlg]'); await p.check('[name=allow_download]');
  await Promise.all([p.waitForNavigation(), p.click('#setDlg button.primary')]);
  // el dueño no cuenta
  const ow = await ctx.newPage(); await ow.goto(B + '/e/' + token); await ow.waitForTimeout(800);
  // dos invitados
  for (let i = 0; i < 2; i++) {
    const g = await (await b.newContext()).newPage(); await g.goto(B + '/e/' + token); await g.waitForSelector('a.tile');
    await g.click('a.tile'); await g.waitForTimeout(800);
  }
  const v = await (await b.newContext()).newPage(); await v.goto(B + '/e/' + token); await v.waitForSelector('a.tile .soc');
  ok((await v.textContent('a.tile .soc')).trim() === '2', 'ojito en la galería de invitados');
  await v.click('a.tile'); await v.waitForTimeout(800); ok((await v.textContent('#lbEye')).trim() === '3', 'ojito en el visor se actualiza: ' + (await v.textContent('#lbEye')));
  // descargas: una foto suelta + un ZIP de 2 fotos = 3 (la del dueño no cuenta)
  const rq = (await b.newContext()).request;
  const dlid = await v.evaluate(() => document.querySelector('.dlbtn') && document.querySelector('.dlbtn').getAttribute('href'));
  ok(dlid, 'botón de descarga por foto');
  ok((await rq.get(B + dlid)).ok(), 'descarga una foto');
  ok((await rq.get(B + '/e/' + token + '/zip')).ok(), 'descarga zip');
  await ow.evaluate(async (u) => { await fetch(u); }, dlid);
  await p.goto(adminUrl); await p.click('[data-open=statsDlg]'); await p.waitForTimeout(300);
  const labels = await p.$$eval('.kpis dt', (d) => d.map((x) => x.textContent.trim()));
  const kv = await p.$$eval('.kpis dd', (d) => d.map((x) => x.textContent.trim()));
  const K = Object.fromEntries(labels.map((l, i) => [l, kv[i]]));
  ok(K['Descargas'] === '3', 'descargas = ' + K['Descargas']);
  ok(K['Invitados que suben'] === '1', 'invitados que suben = ' + K['Invitados que suben']);
  ok((await p.$$('.sbars')).length === 3, 'tres gráficos');
  await p.waitForTimeout(400); await p.screenshot({ path: '/tmp/picfy_shots/stats.png' });
  ok((await p.$$('.upl li')).length === 1, 'lista de invitados que suben');
  const k = await p.$$eval('.kpis dd', (d) => d.map((x) => x.textContent.trim()));
  ok(k[0] === '3' && k[1] === '3' && k[2] === '3', 'visitas/visitantes/hoy = ' + k.join(','));
  ok((await p.$$('.stop div')).length === 1, 'foto más abierta');
  await p.keyboard.press('Escape');
  ok((await p.textContent('.tile.ph .soc .eye')).trim() === '3', 'ojito admin');
  await p.waitForTimeout(100);
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
