const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
  await p.goto(B + '/registro'); await p.fill('[name=name]', 'C'); await p.fill('[name=email]', 'col' + Date.now() + '@e.es'); await p.fill('[name=password]', 'clave-12345');
  const sc = await p.$('[name=code]'); if (sc) await sc.fill('codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  for (const n of ['Ceremonia', 'Banquete', 'Otra']) {
    await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg [name=name]', n);
    await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
    if (n !== 'Otra') {
      await p.click('#openUpload'); await p.waitForTimeout(300);
      await (await p.$('input[type=file]')).setInputFiles(['tests/img/p00.jpg']);
      const c = await p.$('#upConsent'); if (c) await c.evaluate((e) => e.click());
      await p.click('#upStart'); await p.waitForTimeout(3500);
    }
  }
  // sidebar
  await p.goto(B + '/galerias'); await p.click('a.nav[href="/colecciones"]'); await p.waitForURL('**/colecciones');
  await p.click('[data-open=newCol]'); await p.fill('#newCol [name=name]', 'Boda de Marta'); await p.fill('#newCol [name=lead]', 'Todo el día');
  await Promise.all([p.waitForNavigation(), p.click('#newCol button.primary')]);
  ok(/\/colecciones\/[0-9a-f]{16}/.test(p.url()), 'colección creada');
  await p.click('[data-open=addGal]'); await p.waitForTimeout(200);
  ok((await p.$$('#addGal input[name=gal]')).length === 3, '3 galerías disponibles');
  const boxes = await p.$$('#addGal input[name=gal]'); await boxes[0].check(); await boxes[1].check();
  await Promise.all([p.waitForNavigation(), p.click('#addGal button.primary')]);
  ok((await p.$$('.colitem')).length === 2, '2 galerías en la colección');
  const first = (await p.textContent('.colitem .colinfo b')).trim();
  await Promise.all([p.waitForNavigation(), p.click('.colitem:first-child button[value=down]')]);
  ok((await p.textContent('.colitem .colinfo b')).trim() !== first, 'reordenada');
  await p.screenshot({ path: '/tmp/picfy_shots/col_admin.png' });
  const link = (await p.textContent('#colLink')).trim();
  // público (sin sesión)
  const g = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  await g.goto(link); await g.waitForSelector('.colcard');
  ok((await g.$$('.colcard')).length === 2 && (await g.textContent('h1')).includes('Boda de Marta'), 'página pública');
  await g.screenshot({ path: '/tmp/picfy_shots/col_public.png' });
  await Promise.all([g.waitForNavigation(), g.click('.colcard')]); ok(/\/e\/[0-9a-f]{32}/.test(g.url()), 'enlaza a la galería');
  // quitar y borrar
  await Promise.all([p.waitForNavigation(), p.click('.colitem:first-child form[action$=quitar] button')]);
  ok((await p.$$('.colitem')).length === 1, 'quitada');
  p.on('dialog', (d) => d.accept());
  await Promise.all([p.waitForNavigation(), p.click('.coldel button')]);
  const r = await g.goto(link); ok(r.status() === 404, 'enlace muerto tras borrar');
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
