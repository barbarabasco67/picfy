// Torneos: lista de comprobación por tarea.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const email = `k${Date.now()}@t.es`;
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Hub'); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --command "UPDATE users SET plan='libre' WHERE email='${email}'"`, { stdio: 'ignore' });
  await p.goto(B + '/torneo'); await p.fill('.tnew input[name=name]', 'Torneo Check'); await p.click('.tnew button'); await p.waitForURL(/torneo\/\w{16}/);
  await p.fill('#sedeForm input[name=name]', 'Bilbao'); await p.click('#sedeForm button'); await p.waitForSelector('.tsede');
  const z = p.locator('.tsede').first();
  await z.locator('.tnewcreator input').fill('Ana'); await z.locator('.tnewcreator button').click(); await p.waitForSelector('.tcreator');
  await z.locator('.tnewtask input[name=title]').fill('Final'); await z.locator('.tnewtask button').click(); await p.waitForSelector('.ttasks li');
  // Añadir puntos desde la ventana de edición
  await p.click('[aria-label="Editar tarea"]'); await p.fill('#taskForm textarea[name=items]', 'Foto de equipo\n3 jugadas\nCeremonia'); await p.click('#taskSave');
  await p.waitForSelector('.tck li'); ok((await p.locator('.tck li').count()) === 3 && (await p.locator('.tckn').innerText()) === '0/3', 'tres puntos creados, 0/3');
  const token = await p.evaluate(async () => (await (await fetch('/api/torneos/' + document.body.dataset.torneo)).json()).sedes[0].creadores[0].token);
  // El hub marca uno
  await p.locator('.tck input').first().check(); await p.waitForFunction(() => document.querySelector('.tckn')?.textContent === '1/3'); ok(true, 'hub marca un punto → 1/3');
  // El creador marca los demás y la tarea se completa sola
  const c = await (await b.newContext({ viewport: { width: 420, height: 900 } })).newPage(); c.on('pageerror', (e) => errs.push(e.message));
  await c.goto(`${B}/t/${token}`); await c.waitForSelector('.mdt .tck');
  ok((await c.locator('.mdt .tck input:checked').count()) === 1, 'creador ve el punto ya marcado');
  const boxes = c.locator('.mdt .tck input[type=checkbox]'); await boxes.nth(1).check(); await c.waitForFunction(() => document.querySelectorAll('.mdt .tck input:checked').length === 2);
  await c.locator('.mdt .tck input[type=checkbox]').nth(2).check(); await c.waitForSelector('.mdt.done'); ok(true, 'al marcar todos la tarea queda hecha');
  await c.screenshot({ path: '/tmp/picfy_shots/tcheck_creador.png', fullPage: true });
  // Desmarcar uno la devuelve a pendiente
  await c.locator('.mdt .tck input[type=checkbox]').nth(0).uncheck(); await c.waitForFunction(() => !document.querySelector('.mdt.done')); ok(true, 'desmarcar un punto la devuelve a pendiente');
  // Hub: ve el progreso y editar mantiene los puntos marcados
  await p.reload(); await p.waitForSelector('.tckn'); ok((await p.locator('.tckn').innerText()) === '2/3', 'hub ve 2/3 tras recargar');
  await p.click('[aria-label="Editar tarea"]'); await p.fill('#taskForm textarea[name=items]', 'Foto de equipo\n3 jugadas\nCeremonia\nEntrevista'); await p.click('#taskSave');
  await p.waitForFunction(() => document.querySelector('.tckn')?.textContent === '2/4'); ok(true, 'añadir punto conserva los marcados');
  await p.screenshot({ path: '/tmp/picfy_shots/tcheck_hub.png', fullPage: true });
  ok(errs.length === 0, 'sin errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
