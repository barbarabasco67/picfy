const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('[name=name]', 'S'); await p.fill('[name=email]', 's' + Date.now() + '@e.es'); await p.fill('[name=password]', 'clave-12345');
  const sc = await p.$('[name=code]'); if (sc) await sc.fill('codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  await p.click('#newGal'); await p.fill('#newDlg [name=name]', 'Social'); await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  const adminUrl = p.url().split('?')[0];
  await p.click('#openUpload'); await p.waitForTimeout(300);
  await (await p.$('input[type=file]')).setInputFiles(['tests/img/p00.jpg', 'tests/img/p01.jpg']);
  const c = await p.$('#upConsent'); if (c) await c.evaluate((e) => e.click());
  await p.click('#upStart'); await p.waitForTimeout(4000);
  await p.goto(adminUrl);
  const token = await p.evaluate(() => document.body.dataset.token);
  // invitado distinto (sin sesión)
  const g = await (await b.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
  await g.goto(B + '/e/' + token); await g.waitForSelector('a.tile');
  await g.click('a.tile'); await g.waitForSelector('#lbSoc:not(.hidden)');
  await g.click('#lbLike'); await g.waitForTimeout(500);
  ok((await g.textContent('#lbLike')).trim() === '1', 'like cuenta 1');
  await g.click('#lbCom'); await g.fill('#lbName', 'Ana'); await g.fill('#lbText', 'Qué foto más bonita');
  await g.click('#lbForm button'); await g.waitForSelector('.cm');
  ok((await g.textContent('.cm')).includes('Qué foto más bonita'), 'comentario visible');
  ok((await g.textContent('#lbCom')).trim() === '1', 'contador comentarios 1');
  await g.keyboard.press('Escape'); await g.keyboard.press('Escape');
  await g.reload(); await g.waitForSelector('a.tile .soc');
  ok((await g.textContent('a.tile .soc')).includes('1'), 'insignia tras recargar');
  // el administrador ve los contadores y puede borrar
  await p.goto(adminUrl); await p.waitForSelector('.tile.ph .soc');
  const pv = await ctx.newPage(); await pv.goto(B + '/e/' + token); await pv.click('a.tile'); await pv.click('#lbCom'); await pv.waitForSelector('.cm .cmx');
  await pv.click('.cm .cmx'); await pv.waitForTimeout(500);
  ok((await pv.$$('.cm')).length === 0, 'dueño borra comentario');
  // desactivar
  await p.goto(adminUrl); await p.click('[data-open=setDlg]'); await p.uncheck('[name=social]');
  await Promise.all([p.waitForNavigation(), p.click('#setDlg button.primary')]);
  await g.reload(); await g.waitForSelector('a.tile');
  ok((await g.$('#lbSoc')) === null, 'sin social al desactivar');
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
