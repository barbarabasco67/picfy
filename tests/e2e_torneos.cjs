const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Hub'); await p.fill('input[name=email]', `t${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345');
  await p.click('.au-submit'); await p.waitForURL('**/inicio');
  await p.click('.side a[href="/torneo"]'); await p.waitForURL('**/torneo');
  await p.fill('.tnew input[name=name]', 'Torneo Final'); await p.click('.tnew button'); await p.waitForURL(/torneo\/\w{16}/);
  const url = p.url();
  await p.fill('#sedeForm input[name=name]', 'Zaragoza'); await p.click('#sedeForm button'); await p.waitForSelector('.tsede');
  await p.fill('#sedeForm input[name=name]', 'Sabadell'); await p.click('#sedeForm button'); await p.waitForFunction(() => document.querySelectorAll('.tsede').length === 2);
  const z = p.locator('.tsede').first();
  await z.locator('.tnewcreator input').fill('Marta'); await z.locator('.tnewcreator button').click(); await p.waitForSelector('.tcreator');
  await p.locator('.tsede').first().locator('.tnewtask input[name=title]').fill('Grabar saludo');
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  await p.locator('.tsede').first().locator('.tnewtask input[name=date]').fill(today);
  await p.locator('.tsede').first().locator('.tnewtask select[name=kind]').selectOption('video');
  await p.locator('.tsede').first().locator('.tnewtask button').click(); await p.waitForSelector('.ttasks li');
  await p.locator('.tsede').first().locator('.tnewtask input[name=title]').fill('Storie del partido');
  await p.locator('.tsede').first().locator('.tnewtask button').click(); await p.waitForFunction(() => document.querySelectorAll('.ttasks li').length === 2);
  await p.click('.tsede >> nth=0 >> .tfold'); ok(await p.isHidden('.tsede >> nth=0 >> .tforms'), 'la sede se pliega'); await p.reload(); await p.waitForSelector('.tsede'); ok(await p.isHidden('.tsede >> nth=0 >> .tforms'), 'recuerda que está plegada'); await p.click('.tsede >> nth=0 >> .tfold'); ok(await p.isVisible('.tsede >> nth=0 >> .tforms'), 'la sede se despliega');
  // enlace del creador
  const token = await p.evaluate(async (u) => { const id = location.pathname.split('/').pop(); const r = await (await fetch('/api/torneos/' + id)).json(); return r.sedes[0].creadores[0].token; });
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const merrs = []; m.on('pageerror', (e) => merrs.push(e.message));
  await m.goto(B + '/t/' + token); await m.waitForSelector('.mdt');
  ok(/Marta/.test(await m.textContent('h1')), 'saludo al creador');
  ok((await m.$$('.mdt')).length === 2, 've las 2 tareas de su sede');
  await m.click('.mdt label >> nth=0'); await m.waitForTimeout(400);
  await m.reload(); await m.waitForSelector('.mdt');
  ok((await m.$$('.mdt.done')).length === 1, 'la tarea marcada se guarda');
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sin scroll horizontal en móvil');
  await m.screenshot({ path: '/tmp/picfy_shots/midia.png' });
  const bad = await m.goto(B + '/t/' + 'a'.repeat(24)); ok(bad.status() === 404, 'enlace falso da 404');
  // el hub ve quién la hizo
  await p.reload(); await p.waitForSelector('.ttasks li');
  ok(/Hecha por Marta/.test(await p.textContent('.tsede')), 'el hub ve quién la hizo');
  // el otro hub no accede
  const o = await (await b.newContext()).newPage(); await o.goto(B + '/registro'); await o.fill('input[name=name]', 'O'); await o.fill('input[name=email]', `o${Date.now()}@t.es`); await o.fill('input[name=password]', 'clave12345'); await o.click('.au-submit'); await o.waitForURL('**/inicio');
  const rs = await o.evaluate(async (id) => (await fetch('/api/torneos/' + id)).status, url.split('/').pop()); ok(rs === 404, 'otra cuenta no ve el torneo ' + rs);
  await p.screenshot({ path: '/tmp/picfy_shots/torneo.png' });
  ok(errs.length + merrs.length === 0, 'errores JS: ' + errs.concat(merrs).join(';'));
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
