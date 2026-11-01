// Torneos: entrega al cliente, avisos y duplicar.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
const sql = (q) => execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --json --command "${q}"`, { encoding: 'utf8' });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const email = `e${Date.now()}@t.es`;
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Hub'); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  sql(`UPDATE users SET plan='libre' WHERE email='${email}'`);
  await p.goto(B + '/torneo'); await p.fill('.tnew input[name=name]', 'Torneo Entrega'); await p.click('.tnew button'); await p.waitForURL(/torneo\/\w{16}/);
  const tid = p.url().split('/').pop();
  await p.fill('#sedeForm input[name=name]', 'Valencia'); await p.click('#sedeForm button'); await p.waitForSelector('.tsede');
  const z = p.locator('.tsede').first();
  await z.locator('.tnewcreator input[name=name]').fill('Pau'); await z.locator('.tnewcreator input[name=email]').fill('pau@t.es'); await z.locator('.tnewcreator button').click(); await p.waitForSelector('.tcreator');
  await z.locator('.tnewtask input[name=title]').fill('Final'); await z.locator('.tnewtask input[name=date]').fill('2026-12-10'); await z.locator('.tnewtask button').click(); await p.waitForSelector('.ttasks li');
  await p.click('[aria-label="Editar tarea"]'); await p.fill('#taskForm textarea[name=items]', 'Equipo\nCeremonia'); await p.click('#taskSave'); await p.waitForSelector('.tck li');
  const d = await p.evaluate(async () => { const r = await (await fetch('/api/torneos/' + document.body.dataset.torneo)).json(); return { tarea: r.sedes[0].tareas[0].id, token: r.sedes[0].creadores[0].token }; });
  const up = (name) => p.evaluate(async ([t, tid, nm]) => {
    const data = new Uint8Array(2048).fill(7);
    const a = await (await fetch(`/api/t/${t}/tareas/${tid}/entregas`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ size: data.length, mime: 'image/jpeg', filename: nm }) })).json();
    const pt = await (await fetch(`/api/t/${t}/entregas/${a.id}/parte/1`, { method: 'PUT', body: data })).json();
    await fetch(`/api/t/${t}/entregas/${a.id}/fin`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ partes: [pt] }) }); return a.id;
  }, [d.token, d.tarea, name]);
  const a1 = await up('aprobada.jpg'); await up('pendiente.jpg');
  ok(/"aviso_at":\s*[1-9]/.test(sql(`SELECT aviso_at FROM torneos WHERE id='${tid}'`)), 'subir archivo registra el aviso (anti‑spam activo)');
  await p.evaluate((id) => fetch(`/api/entregas/${id}/revision`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ review: 'ok' }) }), a1);
  // Entrega al cliente
  await p.reload(); await p.click('#shareBtn'); await p.click('#shareBody .btn.primary'); await p.waitForSelector('#shareBody input');
  const url = await p.inputValue('#shareBody input'); ok(/\/entrega\/[0-9a-f]{32}$/.test(url), 'enlace creado ' + url);
  const pub = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); await pub.goto(url);
  ok((await pub.locator('.it').count()) === 1 && /aprobada/.test(await pub.locator('.it').innerText()), 'el cliente solo ve lo aprobado');
  await pub.screenshot({ path: '/tmp/picfy_shots/entrega.png', fullPage: true });
  const tok = url.split('/').pop();
  const st = await pub.evaluate(async (t) => { const r = await fetch(`/entrega/${t}`); const z = await fetch(document.querySelector('.btn').getAttribute('href')); const buf = new Uint8Array(await z.arrayBuffer()); const im = await fetch(document.querySelector('.th img').getAttribute('src')); return [r.status, z.status, String.fromCharCode(...buf.slice(0, 2)), im.status]; }, tok);
  ok(st[1] === 200 && st[2] === 'PK' && st[3] === 200, 'zip y archivo públicos ' + st);
  const other = await pub.evaluate(async ([t]) => (await fetch(`/entrega/${t}/archivo/0000000000000000`)).status, [tok]); ok(other === 404, 'archivo ajeno 404');
  await p.click('#shareBody .btn.danger'); await p.waitForSelector('#shareBody .btn.primary');
  ok((await pub.evaluate(async (u) => (await fetch(u)).status, url)) === 404, 'al dejar de compartir el enlace deja de funcionar');
  // Ajuste de avisos
  await p.keyboard.press('Escape'); await p.click('#editTorneo'); ok(await p.locator('#torneoForm input[name=avisos]').isChecked(), 'avisos activados por defecto');
  await p.locator('#torneoForm input[name=avisos]').uncheck(); await p.click('#torneoForm button[type=submit]'); await p.waitForLoadState('load'); await p.waitForTimeout(600);
  ok(/"avisos":\s*0/.test(sql(`SELECT avisos FROM torneos WHERE id='${tid}'`)), 'avisos desactivados');
  // Duplicar con nueva fecha de inicio
  await p.reload(); await p.click('#editTorneo'); await p.fill('#torneoForm input[name=start_date]', '2026-12-01'); await p.click('#torneoForm button[type=submit]'); await p.waitForLoadState('load'); await p.waitForTimeout(600);
  await p.reload(); await p.click('#dupBtn'); await p.fill('#dupForm input[name=start_date]', '2027-03-01'); await p.click('#dupSave'); await p.waitForURL((u) => /torneo\/\w{16}/.test(u.pathname) && !u.pathname.endsWith(tid));
  await p.waitForSelector('.tsede'); ok((await p.locator('.tsede .tcreator').count()) >= 1, 'copia con sede y creadores');
  const cp = await p.evaluate(async () => (await (await fetch('/api/torneos/' + document.body.dataset.torneo)).json()).sedes[0]);
  ok(cp.tareas.length === 1 && cp.tareas[0].date === '2027-03-10' && cp.tareas[0].items.length === 2 && !cp.tareas[0].done && cp.tareas[0].entregas.length === 0, 'tarea copiada con fecha desplazada, puntos y sin archivos: ' + cp.tareas[0].date);
  ok(cp.creadores[0].token !== d.token, 'enlace de creador nuevo');
  ok(errs.length === 0, 'sin errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
