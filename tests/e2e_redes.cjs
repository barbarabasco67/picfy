// Redes sociales por cliente: alta, calendario del cliente, agenda general, seguimiento y borrado.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1300, height: 950 } })).newPage();
  p.on('pageerror', (e) => { console.log('ERROR JS:', e.message); });
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'R'); await p.fill('input[name=email]', `r${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL(/galerias|inicio/);
  await p.goto(B + '/redes'); ok(await p.locator('#rdAdd').count() === 1, 'página de redes con botón Nuevo cliente');
  await p.click('#rdAdd'); await p.fill('#rdForm input[name=name]', 'Las Rozas 3x3');
  await p.click('#rdForm [data-sw="#8e5bd6"]'); await p.check('#rdForm input[name=font][value=deporte]', { force: true });
  await p.fill('#rdForm [data-net=instagram][data-f=handle]', '@lasrozas3x3'); await p.fill('#rdForm [data-net=instagram][data-f=url]', 'instagram.com/lasrozas3x3');
  await p.click('#rdForm [type=submit]'); await p.waitForURL(/\/redes\/[0-9a-f]{16}/);
  const cid = p.url().match(/redes\/([0-9a-f]{16})/)[1];
  ok(await p.locator('.cliente .chead h1').textContent() === 'Las Rozas 3x3', 'se crea el cliente y se abre su página');
  const bg = await p.locator('.cliente .chead').evaluate((e) => getComputedStyle(e).backgroundColor); ok(bg === 'rgb(142, 91, 214)', 'la cabecera usa el color elegido: ' + bg);
  const ff = await p.locator('.cliente .chead h1').evaluate((e) => getComputedStyle(e).fontFamily); ok(/Impact/.test(ff), 'y la letra elegida: ' + ff);
  ok(await p.locator('.chead a.cnet[href^="https://instagram.com"]').count() === 1, 'enlace a su Instagram');
  // calendario del cliente
  await p.goto(B + '/redes/' + cid + '?t=calendario');
  await p.waitForSelector('#agWeek .agday');
  await p.fill('#agQuickT', 'Preparar reel del torneo'); await p.press('#agQuickT', 'Enter'); await p.waitForSelector('#agSide :text("Preparar reel del torneo")');
  await p.click('#agAdd'); await p.check('#agForm input[name=kind][value=publicacion]', { force: true }); await p.fill('#agForm input[name=title]', 'Post resumen jornada');
  const today = new Date().toISOString().slice(0, 10); await p.fill('#agForm input[name=date]', today); await p.fill('#agForm input[name=time]', '18:30'); await p.click('#agForm [type=submit]');
  await p.waitForSelector('#agWeek :text("Post resumen jornada")'); ok(true, 'publicación en el calendario del cliente');
  // agenda general
  await p.goto(B + '/agenda'); await p.waitForSelector('#agWeek .agday');
  await p.waitForSelector('#agWeek :text("Post resumen jornada")');
  const c = await p.locator('#agWeek .agent:has-text("Post resumen jornada")').evaluate((e) => getComputedStyle(e).getPropertyValue('--c').trim()); ok(c.toLowerCase() === '#8e5bd6', 'sale en la agenda general con el color del cliente: ' + c);
  ok(await p.locator('#agClients [data-client="' + cid + '"]').count() === 1, 'filtro por cliente en la agenda general');
  await p.click('#agClients [data-client="' + cid + '"]'); ok(await p.locator('#agWeek .agent').count() >= 1, 'filtrar por cliente');
  await p.reload();
  // ajustes y borrado
  await p.goto(B + '/redes/' + cid + '?t=ajustes'); await p.click('#csForm [data-sw="#2f9e5f"]'); await Promise.all([p.waitForNavigation(), p.click('#csForm [type=submit]')]);
  const bg2 = await p.locator('.cliente .chead').evaluate((e) => getComputedStyle(e).backgroundColor); ok(bg2 === 'rgb(47, 158, 95)', 'cambiar el color se guarda: ' + bg2);
  p.once('dialog', (d) => d.accept()); await p.click('#csDel'); await p.waitForURL(/\/redes$/);
  await p.goto(B + '/agenda'); await p.waitForSelector('#agWeek :text("Post resumen jornada")'); ok(true, 'al borrar el cliente las publicaciones siguen en la agenda');
  await p.goto(B + '/redes'); ok(await p.locator('.ccard').count() === 0, 'lista de clientes vacía');
  await b.close();
})();
