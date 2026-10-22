const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const anon = await (await b.newContext()).newPage();
  await anon.goto(B + '/inicio'); ok(new URL(anon.url()).pathname === '/entrar', 'sin sesión va a entrar');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Pablo Gómez'); await p.fill('input[name=email]', `d${Date.now()}${w}@t.es`); await p.fill('input[name=password]', 'clave12345');
    await p.click('.au-submit'); await p.waitForURL('**/inicio');
    ok(/Pablo/.test(await p.textContent('.dtop h1')), 'saludo con el nombre');
    ok(await p.$('.side .spbox + .trashnav') && await p.$('.dstats') && await p.$('.dchart') && await p.$('.dcal'), 'bloques del panel');
    // crear galería desde el panel
    await p.goto(B + '/galerias?nueva=1'); await p.waitForSelector('#newDlg[open]'); ok(new URL(p.url()).search === '', 'abre el diálogo y limpia la URL');
    await p.fill('#newDlg input[name=name]', 'Final Four'); await p.click('#newDlg button[type=submit], #newDlg .btn.primary[type=submit]');
    await p.waitForURL(/galerias\/\w+/);
    await p.goto(B + '/inicio'); ok((await p.textContent('.dgals')).includes('Final Four'), 'la galería sale en el panel');
    await p.fill('#dq', 'zzz'); ok(await p.isVisible('#dnone'), 'buscador sin resultados'); await p.fill('#dq', 'final'); ok(!(await p.isVisible('#dnone')), 'buscador con resultados');
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'sin scroll horizontal ' + w);
    await p.screenshot({ path: `/tmp/picfy_shots/dash_${w}.png`, fullPage: true });
    ok(errs.length === 0, 'errores JS: ' + errs.join(';'));
  }
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
