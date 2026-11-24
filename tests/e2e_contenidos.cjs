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
  ok(await p.locator('.ctabs :text("Seguimiento")').count() === 0 && await p.locator('#ctPlan').count() === 0, 'sin Seguimiento ni Estrategia');
  await p.click('#ctAdd'); await p.fill('#ctForm input[name=title]', 'Cartel del sábado');
  const today = new Date().toISOString().slice(0, 10); await p.fill('#ctForm input[name=date]', today);
  await p.check('#ctForm input[name=net][value=instagram]', { force: true });
  await p.selectOption('#ctForm select[name=status]', 'revision'); await p.fill('#ctForm textarea[name=copy]', 'Este sábado volvemos a jugar.');
  await p.setInputFiles('#ctFile', ['/tmp/t1.png', '/tmp/t2.png']); await p.waitForFunction(() => document.querySelectorAll('#ctImgs .ctim').length === 2);
  await p.click('#ctForm [type=submit]'); await p.waitForSelector('.ctcard'); ok(true, 'publicación creada con 2 imágenes');
  await p.click('#ctAdd'); await p.fill('#ctForm input[name=title]', 'Idea interna'); await p.fill('#ctForm input[name=date]', today); await p.click('#ctForm [type=submit]'); await p.waitForFunction(() => document.querySelectorAll('.ctcard').length === 2);
  // campañas
  await p.click('#ctCamp'); await p.click('#ctCampAdd'); await p.fill('[data-kn="0"]', 'Black Friday');
  const d0 = new Date(); const iso = (d) => d.toISOString().slice(0, 10); const a = new Date(d0.getFullYear(), d0.getMonth(), 10), z = new Date(d0.getFullYear(), d0.getMonth(), 14);
  await p.fill('[data-ks="0"]', `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-10`); await p.fill('[data-ke="0"]', `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-14`);
  await p.click('#ctCampForm [type=submit]'); await p.waitForFunction(() => document.querySelectorAll('.ctcamp').length === 5);
  ok((await p.locator('.ctcamp.s').textContent()).includes('Black Friday'), 'campaña de varios días (5 días) en el calendario');
  // enlace
  await p.click('#ctShare'); ok(await p.locator('[name=ctmode]').count() === 2, 'permisos: trabajar juntos / solo ver');
  ok(await p.locator('[name=ctmode][value=edit]').isChecked(), 'por defecto, trabajar juntos'); await p.click('#ctOn');
  const url = await p.inputValue('#ctUrl'); ok(/\/c\/[0-9a-f]{32}$/.test(url), 'enlace creado');
  const q = await (await b.newContext({ viewport: { width: 1300, height: 950 } })).newPage(); q.on('pageerror', (e) => console.log('ERROR JS cliente:', e.message));
  await q.goto(url.replace(/^.*\/c\//, B + '/c/')); await q.waitForSelector('.ctcard');
  ok(await q.locator('[data-cv]').count() === 4, 'el cliente tiene Mes, Lista, Tablero y Feed');
  ok(await q.locator('.ctcard').count() === 2, 'el cliente ve todo, también las ideas');
  ok(await q.locator('#ctShare, #ctPlan').count() === 0 && await q.locator('.ctabs').count() === 0, 'sin enviar, estrategia ni pestañas');
  ok(await q.locator('.ctcamp.s').count() === 1, 'el cliente ve la campaña');
  ok(await q.locator('.ctcard img').first().evaluate((i) => i.complete && i.naturalWidth > 0), 'las imágenes cargan en la vista del cliente');
  await q.screenshot({ path: '/tmp/picfy_shots/ct_client.png' });
  // el cliente crea y edita
  await q.click('#ctAdd'); await q.fill('#ctForm input[name=title]', 'Propuesta del cliente'); await q.fill('#ctForm input[name=date]', today); await q.click('#ctForm [type=submit]');
  await q.waitForFunction(() => document.querySelectorAll('.ctcard').length === 3); ok(true, 'el cliente crea una publicación');
  await q.click('.ctcard:has-text("Cartel del sábado")'); await q.fill('#ctForm textarea[name=copy]', 'Texto editado por el cliente'); await q.fill('#ctCmIn', 'Cambiad la hora'); await q.click('#ctCmBtn');
  await q.waitForFunction(() => document.querySelector('#ctCms').textContent.includes('Tú')); await q.click('#ctForm [type=submit]'); await q.waitForFunction(() => !document.querySelector('#ctDlg').open);
  await q.click('[data-cv=lista]'); await q.waitForSelector('.ctrow'); ok(true, 'el cliente edita y comenta');
  await p.reload(); await p.click('[data-cv=lista]'); await p.click('.ctrow:has-text("Cartel del sábado")');
  ok((await p.inputValue('#ctForm textarea[name=copy]')).includes('editado por el cliente'), 'el dueño ve el cambio del cliente');
  ok((await p.locator('#ctCms').textContent()).includes('Cliente'), 'el dueño ve el comentario como del cliente'); await p.click('#ctDlg [data-close]');
  ok(await p.locator('.ctrow:has-text("Propuesta del cliente")').count() === 1, 'y la publicación nueva del cliente');
  // cliente sube imagen y arrastra
  await q.click('[data-cv=mes]'); await q.click('.ctcard:has-text("Propuesta del cliente")'); await q.setInputFiles('#ctFile', ['/tmp/t1.png']); await q.waitForFunction(() => document.querySelectorAll('#ctImgs .ctim').length === 1); ok(true, 'el cliente sube una imagen'); await q.click('#ctDlg [data-close]');
  // solo ver
  await p.goto(B + '/redes/' + cid); await p.click('#ctShare'); await p.check('[name=ctmode][value=view]', { force: true }); await p.waitForTimeout(1200);
  await q.reload(); await q.waitForSelector('.ctcard');
  ok(await q.locator('#ctAdd').isHidden(), 'solo ver: sin botón de nueva publicación');
  await q.click('.ctcard:has-text("Cartel del sábado")'); ok(await q.locator('#ctForm input[name=title]').isDisabled(), 'solo ver: el editor está bloqueado'); await q.click('#ctDlg [data-close]');
  const st = await q.evaluate(async (u) => (await fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'x' }) })).status, new URL(url).pathname + '/api/posts'); ok(st === 403, 'solo ver: el servidor rechaza cambios');
  // agenda y desactivar
  await p.goto(B + '/agenda'); await p.waitForSelector('#agWeek :text("Cartel del sábado")'); await p.click('#agWeek .agent:has-text("Cartel del sábado")'); await p.waitForURL(/t=contenidos&post=/); await p.waitForSelector('#ctDlg[open]'); ok(true, 'desde el calendario general se abre la publicación');
  await p.goto(B + '/redes/' + cid); await p.click('#ctShare'); await p.click('#ctOff'); await p.waitForSelector('#ctOn');
  const r = await q.goto(B + '/c/' + url.split('/c/')[1]); ok(r.status() === 404, 'enlace desactivado deja de funcionar');
  console.log('TODO OK'); await b.close();
})().catch((e) => { console.log('FALLO', e.message); process.exit(1); });
