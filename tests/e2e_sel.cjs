const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('[name=name]', 'S'); await p.fill('[name=email]', 'sel' + Date.now() + '@e.es'); await p.fill('[name=password]', 'clave-12345');
  const sc = await p.$('[name=code]'); if (sc) await sc.fill('codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  await p.click('#newGal'); await p.fill('#newDlg [name=name]', 'Boda Sel'); await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  const adminUrl = p.url().split('?')[0]; const token = await p.evaluate(() => document.body.dataset.token);
  // selector de archivos en español
  await p.click('[data-open=brandDlg]'); await p.waitForTimeout(300);
  ok((await p.textContent('.fpick .fpbtn')).includes('Elegir imagen'), 'botón en español');
  ok((await p.textContent('.fpick .fptxt')).includes('Ninguna imagen'), 'texto en español');
  await p.keyboard.press('Escape');
  // subir fotos y activar selección
  await p.click('#openUpload'); await p.waitForTimeout(300);
  await (await p.$('input[type=file]')).setInputFiles(['tests/img/p00.jpg', 'tests/img/p01.jpg', 'tests/img/p02.jpg']);
  const c = await p.$('#upConsent'); if (c) await c.evaluate((e) => e.click());
  await p.click('#upStart'); await p.waitForTimeout(4500);
  await p.goto(adminUrl); await p.click('[data-open=setDlg]'); await p.check('[name=selection]'); await p.check('[name=allow_download]');
  await Promise.all([p.waitForNavigation(), p.click('#setDlg button.primary')]);
  // cliente
  const g = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  await g.goto(B + '/e/' + token); await g.waitForSelector('.selpick');
  await g.locator('.selpick').nth(0).click(); await g.locator('.selpick').nth(1).click();
  await g.waitForSelector('#selMine:not(.hidden)');
  ok((await g.textContent('#selMineN')).startsWith('2'), 'barra con 2: ' + (await g.textContent('#selMineN')));
  await g.reload(); await g.waitForSelector('#selMine:not(.hidden)'); // persiste
  ok(await g.$('#selDl'), 'botón descargar en la barra');
  await g.click('#selClear'); await g.waitForTimeout(400); ok((await g.$$('.selpick.on')).length === 0, 'quitar selección');
  await g.click('#selToggle'); await g.waitForSelector('#selMine:not(.hidden)'); ok((await g.textContent('#selMineN')).startsWith('3'), 'elegir todas');
  await g.locator('.selpick').nth(2).click(); await g.waitForTimeout(300);
  await g.click('a.tile'); await g.waitForSelector('#lbSel:not(.hidden)'); await g.screenshot({ path: '/tmp/picfy_shots/sel_lb.png' });
  await g.keyboard.press('Escape'); await g.waitForTimeout(200);
  await g.screenshot({ path: '/tmp/picfy_shots/sel_grid.png' });
  await g.click('#selSendOpen'); await g.fill('#selName', 'Marta'); await g.fill('#selEmail', 'marta@e.es'); await g.fill('#selNote', 'Estas me encantan');
  await g.screenshot({ path: '/tmp/picfy_shots/sel_dlg.png' });
  await g.waitForTimeout(200); await g.screenshot({ path: '/tmp/picfy_shots/sel_dlg.png' }); await g.click('#selSendGo'); await g.waitForSelector('#selOk:not(.hidden)');
  // fotógrafo
  await p.goto(adminUrl); const btn = await p.$('[data-open=selDlg]'); ok(btn, 'botón Selecciones');
  ok((await btn.textContent()).includes('(1)'), 'contador 1');
  await btn.click(); await p.waitForTimeout(300);
  ok((await p.textContent('.selsend')).includes('Marta') && (await p.textContent('.selsend')).includes('Estas me encantan'), 'selección visible');
  await p.screenshot({ path: '/tmp/picfy_shots/sel_admin.png' });
  await p.click('[data-selfav]'); await p.waitForTimeout(600); await p.keyboard.press('Escape');
  ok((await p.$$('.tile.ph[data-fav="1"]')).length === 2, 'favoritas marcadas');
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
