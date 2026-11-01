// Torneos: comentarios en cada entrega y versiones.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const email = `c${Date.now()}@t.es`;
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Hub'); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --command "UPDATE users SET plan='libre' WHERE email='${email}'"`, { stdio: 'ignore' });
  await p.goto(B + '/torneo'); await p.fill('.tnew input[name=name]', 'Torneo Com'); await p.click('.tnew button'); await p.waitForURL(/torneo\/\w{16}/);
  await p.fill('#sedeForm input[name=name]', 'Sevilla'); await p.click('#sedeForm button'); await p.waitForSelector('.tsede');
  const z = p.locator('.tsede').first();
  await z.locator('.tnewcreator input').fill('Marta'); await z.locator('.tnewcreator button').click(); await p.waitForSelector('.tcreator');
  await z.locator('.tnewtask input[name=title]').fill('Saludo'); await z.locator('.tnewtask button').click(); await p.waitForSelector('.ttasks li');
  const d = await p.evaluate(async () => { const r = await (await fetch('/api/torneos/' + document.body.dataset.torneo)).json(); return { tarea: r.sedes[0].tareas[0].id, token: r.sedes[0].creadores[0].token }; });
  const up = (replaces) => p.evaluate(async ([t, tid, rp]) => {
    const data = new Uint8Array(2048).fill(7);
    const a = await (await fetch(`/api/t/${t}/tareas/${tid}/entregas`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ size: data.length, mime: 'image/jpeg', filename: rp ? 'v2.jpg' : 'v1.jpg', replaces: rp }) })).json();
    const pt = await (await fetch(`/api/t/${t}/entregas/${a.id}/parte/1`, { method: 'PUT', body: data })).json();
    await fetch(`/api/t/${t}/entregas/${a.id}/fin`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ partes: [pt] }) }); return a.id;
  }, [d.token, d.tarea, replaces]);
  const e1 = await up();
  await p.reload(); await p.waitForSelector('.tfiles'); await p.click('.tfiles'); await p.waitForSelector('.tfile');
  ok((await p.locator('.tfile .frev').first().innerText()).includes('En revisión'), 'entrega en revisión');
  // El hub pide cambios con nota
  await p.locator('.tfile').first().locator('[aria-label="Pedir cambios"]').click();
  await p.fill('#revDlg textarea', 'Más luz por favor'); await p.locator('#revDlg button[type=submit]').click();
  await p.waitForFunction(() => /Cambios pedidos/.test(document.querySelector('.tfile .frev')?.textContent || ''));
  ok(true, 'hub pide cambios');
  // Creador ve el estado y el comentario
  const c = await (await b.newContext({ viewport: { width: 420, height: 900 } })).newPage(); c.on('pageerror', (e) => errs.push(e.message));
  await c.goto(`${B}/t/${d.token}`); await c.waitForSelector('.mdfile');
  ok((await c.locator('.mdfile .frev').innerText()).includes('Cambios pedidos'), 'creador ve Cambios pedidos');
  await c.locator('.mdfile .mdchat').click(); await c.waitForSelector('.cmsg');
  ok((await c.locator('.cmsg').first().innerText()).includes('Más luz'), 'creador ve la nota del hub');
  await c.fill('.cform input', 'Hecho, subo otra'); await c.click('.cform button'); await c.waitForFunction(() => document.querySelectorAll('.cmsg').length >= 2);
  ok(true, 'creador comenta'); await c.waitForTimeout(900); await c.screenshot({ path: '/tmp/picfy_shots/tcom_creador.png', fullPage: true });
  // Nueva versión
  const e2 = await up(e1);
  await c.reload(); await c.waitForSelector('.mdfile');
  ok((await c.locator('.mdfile').count()) === 2 && (await c.locator('.mdfile.old').count()) === 1, 'versión anterior atenuada');
  // Hub ve v2 y aprueba
  await p.reload(); await p.waitForSelector('.tfiles'); await p.click('.tfiles'); await p.waitForSelector('.tfile');
  ok((await p.locator('.tfile .fver').count()) >= 1, 'hub ve etiqueta de versión');
  const nuevo = p.locator('.tfile').filter({ hasText: 'v2.jpg' });
  await nuevo.locator('[aria-label="Aprobar"]').click(); await p.waitForFunction(() => [...document.querySelectorAll('.tfile')].some((x) => /v2\.jpg/.test(x.textContent) && /Aprobado/.test(x.textContent)));
  ok(true, 'hub aprueba v2');
  // Comentario del hub
  await nuevo.locator('[aria-label="Comentarios"]').first().click(); await p.waitForSelector('.tfile .cform input');
  await p.locator('.tfile .cform input').first().fill('Perfecta'); await p.locator('.tfile .cform button').first().click(); await p.waitForSelector('.tfile .cmsg');
  ok(true, 'hub comenta'); await p.waitForTimeout(1200); await p.screenshot({ path: '/tmp/picfy_shots/tcom.png', fullPage: true });
  ok(errs.length === 0, 'sin errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
