// Calendario de contenidos: crear publicación con imágenes y copy, enlace para el cliente, aprobar / pedir cambios.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const ctx = await b.newContext({ viewport: { width: 1300, height: 950 } }); const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERROR JS:', e.message));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'C'); await p.fill('input[name=email]', `c${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.auth form [type=submit], form [type=submit]'); await p.waitForURL(/inicio|redes|\/$/);
  await p.goto(B + '/redes'); await p.click('#rdAdd'); await p.fill('#rdForm input[name=name]', 'Club Test'); await p.click('#rdForm [data-sw="#8e5bd6"]'); await p.click('#rdForm [type=submit]'); await p.waitForURL(/\/redes\/[0-9a-f]{16}/);
  const cid = p.url().match(/redes\/([0-9a-f]{16})/)[1];
  ok(await p.locator('#ctAdd').count() === 1, 'la pestaña Contenidos es la principal');
  await p.click('#ctAdd'); await p.fill('#ctForm input[name=title]', 'Cartel del sábado');
  const today = new Date().toISOString().slice(0, 10); await p.fill('#ctForm input[name=date]', today);
  await p.check('#ctForm input[name=net][value=instagram]', { force: true }); await p.check('#ctForm input[name=net][value=tiktok]', { force: true });
  await p.selectOption('#ctForm select[name=format]', 'carrusel'); await p.selectOption('#ctForm select[name=status]', 'revision');
  await p.fill('#ctForm textarea[name=copy]', 'Este sábado volvemos a jugar en casa.\nTe esperamos.'); await p.fill('#ctForm input[name=hashtags]', '#basket #madrid');
  await p.setInputFiles('#ctFile', ['/tmp/t1.png', '/tmp/t2.png']); await p.waitForFunction(() => document.querySelectorAll('#ctImgs .ctim').length === 2);
  ok(true, 'se suben 2 imágenes');
  await p.click('#ctImgs [data-mv="0:1"]'); ok(await p.locator('#ctImgs .ctim').count() === 2, 'reordenar imágenes');
  await p.click('#ctForm [type=submit]'); await p.waitForSelector('.ctcard');
  ok(await p.locator('.ctcard img').count() === 1, 'la tarjeta del mes muestra la imagen');
  await p.click('[data-cv=lista]'); await p.waitForSelector('.ctrow'); ok((await p.locator('.ctrow').textContent()).includes('Para revisar'), 'vista lista con estado');
  await p.click('[data-cv=feed]'); await p.waitForSelector('.ctf'); ok(true, 'vista feed');
  await p.click('[data-cv=mes]');
  // estrategia, pilar, responsable, checklist, resultados
  await p.click('#ctPlan'); await p.click('#ctPilAdd'); await p.fill('[data-pn="0"]', 'Resultados'); await p.click('#ctTagAdd'); await p.fill('[data-tn="0"]', 'Base'); await p.fill('[data-tt="0"]', '#lr3x3 #basket'); await p.click('#ctPlanForm [type=submit]');
  await p.waitForSelector('#ctFPil:not([hidden])'); ok(true, 'pilares de contenido');
  await p.click('.ctcard'); await p.selectOption('#ctForm select[name=pillar]', 'Resultados'); await p.fill('#ctForm input[name=owner]', 'Ana'); await p.check('#ctForm input[name=ck_copy]'); await p.check('#ctForm input[name=ck_arte]');
  await p.click('.ctts'); ok((await p.inputValue('#ctForm input[name=hashtags]')).includes('#lr3x3'), 'grupo de hashtags se inserta');
  await p.fill('#ctForm input[name=s_reach]', '1500'); await p.click('#ctForm [type=submit]'); await p.waitForFunction(() => document.querySelector('.ctcard') && document.querySelector('.ctcard').textContent.includes('2/4'));
  ok((await p.locator('.ctcard').textContent()).includes('2/4'), 'progreso de producción en la tarjeta');
  ok((await p.locator('#ctStats').textContent()).includes('1500'), 'alcance en las estadísticas');
  const bgc = await p.locator('.ctcard').evaluate((e) => getComputedStyle(e).backgroundColor); ok(bgc === 'rgb(229, 150, 76)', 'la tarjeta va del color del estado: ' + bgc);
  const bl = await p.locator('.ctcard').evaluate((e) => getComputedStyle(e).borderLeftWidth); ok(bl === '0px', 'sin raya lateral');
  // tablero y arrastrar de estado
  await p.click('[data-cv=tablero]'); await p.waitForSelector('.ctcol[data-status=revision] .ctcard');
  await p.dragAndDrop('.ctcol[data-status=revision] .ctcard', '.ctcol[data-status=diseno]'); await p.waitForSelector('.ctcol[data-status=diseno] .ctcard'); ok(true, 'arrastrar entre estados en el tablero');
  await p.click('.ctcol[data-status=diseno] .ctcard'); await p.selectOption('#ctForm select[name=status]', 'revision'); await p.click('#ctForm [type=submit]'); await p.waitForSelector('.ctcol[data-status=revision] .ctcard');
  await p.click('[data-cv=mes]');
  // duplicar
  await p.click('.ctcard'); await p.click('#ctDup'); await p.waitForFunction(() => document.querySelector('#ctForm input[name=title]').value.includes('(copia)')); ok((await p.inputValue('#ctForm input[name=title]')).includes('(copia)'), 'duplicar publicación'); await p.click('#ctForm [data-close]'); await p.waitForTimeout(300);
  await p.click('.ctcard:has-text("(copia)")'); p.once('dialog', (d) => d.accept()); await p.click('#ctDel'); await p.waitForFunction(() => !document.querySelector('#ctDlg').open); await p.waitForTimeout(800); ok(await p.locator('.ctcard:has-text("(copia)")').count() === 0, 'borrar la copia');
  // enlace
  await p.click('#ctShare'); ok(await p.locator('[name=ctmode]').count() === 3, 'hay que elegir permiso: 3 opciones'); await p.check('[name=ctmode][value=review]', { force: true }); await p.click('#ctOn'); await p.waitForSelector('#ctUrl');
  const url = await p.inputValue('#ctUrl'); ok(/\/c\/[0-9a-f]{32}$/.test(url), 'enlace creado ' + url);
  await p.screenshot({ path: '/tmp/picfy_shots/ct_owner.png' });
  const q = await (await b.newContext({ viewport: { width: 420, height: 900 } })).newPage(); q.on('pageerror', (e) => console.log('ERROR JS cliente:', e.message));
  await q.goto(url.replace(/^.*\/c\//, B + '/c/')); await q.waitForSelector('.card');
  ok((await q.locator('.card h3').textContent()) === 'Cartel del sábado', 'el cliente ve la publicación');
  ok(await q.locator('.card .media img').count() === 2, 'y sus 2 imágenes');
  const loaded = await q.locator('.card .media img').evaluateAll((l) => l.every((i) => i.complete && i.naturalWidth > 0)); ok(loaded, 'las imágenes cargan');
  ok((await q.locator('.copy').textContent()).includes('volvemos a jugar'), 'y el copy');
  await q.screenshot({ path: '/tmp/picfy_shots/ct_client.png', fullPage: true });
  await q.click('[data-v=cal]'); ok(await q.locator('.grid .gp').count() === 1, 'vista calendario del cliente');
  await q.click('[data-v=list]');
  await q.click('[data-act=changes]'); ok(await q.locator('.toast').count() === 1, 'pedir cambios sin texto avisa');
  await q.fill('.card textarea', 'Cambiad la hora a las 19:00'); await Promise.all([q.waitForNavigation(), q.click('[data-act=changes]')]);
  ok((await q.locator('.pill').textContent()) === 'Cambios pedidos', 'estado: cambios pedidos');
  ok((await q.locator('.cms').textContent()).includes('19:00'), 'comentario del cliente visible');
  // dueño ve el comentario y reenvía
  await p.reload(); await p.click('[data-cv=lista]'); await p.click('.ctrow'); ok((await p.locator('#ctCms').textContent()).includes('19:00'), 'el dueño ve el comentario');
  await p.selectOption('#ctForm select[name=status]', 'revision'); await p.click('#ctForm [type=submit]'); await p.waitForSelector('.ctrow');
  await q.reload(); await Promise.all([q.waitForNavigation(), q.click('[data-act=approve]')]);
  ok((await q.locator('.pill').textContent()) === 'Aprobado', 'el cliente aprueba');
  // una idea no se ve
  await p.click('#ctAdd'); await p.fill('#ctForm input[name=title]', 'Idea secreta'); await p.fill('#ctForm input[name=date]', today); await p.click('#ctForm [type=submit]'); await p.waitForSelector('.ctrow:has-text("Idea secreta")');
  await q.reload(); ok(!(await q.content()).includes('Idea secreta'), 'las ideas no las ve el cliente');
  // permisos: solo ver / editar
  await p.goto(B + '/redes/' + cid); await p.click('#ctShare'); await p.check('[name=ctmode][value=view]', { force: true }); await p.waitForSelector('.toast');
  await q.reload(); ok(await q.locator('.acts, [data-act]').count() === 0, 'modo solo ver: sin botones');
  const rr = await q.evaluate(async (u) => (await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })).status, '/c/' + url.split('/c/')[1] + '/posts/' + await q.locator('.card').first().getAttribute('data-id')); ok(rr === 403, 'modo solo ver: el servidor rechaza acciones');
  await p.check('[name=ctmode][value=edit]', { force: true }); await p.waitForTimeout(500);
  await p.click('#ctShareDlg [data-close]');
  await p.click('.ctrow:has-text("Cartel del sábado")'); await p.selectOption('#ctForm select[name=status]', 'revision'); await p.click('#ctForm [type=submit]'); await p.waitForTimeout(800);
  await q.reload(); await q.click('[data-act=open-edit]'); await q.fill('.edit [data-f=copy]', 'Texto editado por el cliente'); await Promise.all([q.waitForNavigation(), q.click('[data-act=edit]')]);
  ok((await q.locator('.copy').textContent()).includes('editado por el cliente'), 'modo editar: el cliente cambia el texto');
  // la imagen de un borrador no se sirve por el enlace
  // agenda general lleva a contenidos
  await p.goto(B + '/agenda'); await p.waitForSelector('#agWeek :text("Cartel del sábado")'); await p.click('#agWeek .agent:has-text("Cartel del sábado")'); await p.waitForURL(/t=contenidos&post=/); await p.waitForSelector('#ctDlg[open]'); ok(true, 'desde el calendario general se abre la publicación');
  // desactivar enlace
  await p.goto(B + '/redes/' + cid); await p.click('#ctShare'); await p.click('#ctOff'); await p.waitForSelector('#ctOn');
  const r = await q.goto(B + '/c/' + url.split('/c/')[1]); ok(r.status() === 404, 'enlace desactivado deja de funcionar');
  console.log('TODO OK'); await b.close();
})().catch((e) => { console.log('FALLO', e.message); process.exit(1); });
