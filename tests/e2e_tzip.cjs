// Torneos: descargar las entregas de una sede o de un creador en zip.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const email = `z${Date.now()}@t.es`;
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Hub'); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --command "UPDATE users SET plan='libre' WHERE email='${email}'"`, { stdio: 'ignore' });
  await p.goto(B + '/torneo'); await p.fill('.tnew input[name=name]', 'Torneo Zip'); await p.click('.tnew button'); await p.waitForURL(/torneo\/\w{16}/);
  await p.fill('#sedeForm input[name=name]', 'Zaragoza'); await p.click('#sedeForm button'); await p.waitForSelector('.tsede');
  const z = p.locator('.tsede').first();
  await z.locator('.tnewcreator input').fill('Marta'); await z.locator('.tnewcreator button').click(); await p.waitForSelector('.tcreator');
  await z.locator('.tnewcreator input').fill('Luis'); await z.locator('.tnewcreator button').click(); await p.waitForFunction(() => document.querySelectorAll('.tcreator').length >= 2);
  await z.locator('.tnewtask input[name=title]').fill('Saludo'); await z.locator('.tnewtask button').click(); await p.waitForSelector('.ttasks li');
  const d = await p.evaluate(async () => { const r = await (await fetch('/api/torneos/' + document.body.dataset.torneo)).json(); return { sede: r.sedes[0].id, tarea: r.sedes[0].tareas[0].id, marta: r.sedes[0].creadores.find((c) => c.name === 'Marta').token, luis: r.sedes[0].creadores.find((c) => c.name === 'Luis').token }; });
  // El enlace de cada creador solo deja subir a tareas suyas o de toda la sede: la tarea es de toda la sede.
  const up = async (token, name) => p.evaluate(async ([t, tid, nm]) => {
    const data = new Uint8Array(2048).fill(7);
    const a = await (await fetch(`/api/t/${t}/tareas/${tid}/entregas`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ size: data.length, mime: 'image/jpeg', filename: nm }) })).json();
    const pt = await (await fetch(`/api/t/${t}/entregas/${a.id}/parte/1`, { method: 'PUT', body: data })).json();
    const f = await fetch(`/api/t/${t}/entregas/${a.id}/fin`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ partes: [pt] }) }); return f.status;
  }, [token, d.tarea, name]);
  ok((await up(d.marta, 'a.jpg')) === 200 && (await up(d.marta, 'b.jpg')) === 200 && (await up(d.luis, 'c.jpg')) === 200, 'tres entregas subidas');
  await p.reload(); await p.waitForSelector('.tsede');
  ok((await p.locator('.tsede .tszip').count()) === 1, 'botón Descargar entregas en la sede');
  ok((await p.locator('.tcreator .ib[aria-label="Descargar sus entregas"]').count()) === 2, 'botón de descarga en cada creador con archivos');
  const zip = (q) => p.evaluate(async (u) => { const r = await fetch(u); const buf = new Uint8Array(await r.arrayBuffer()); return { st: r.status, ct: r.headers.get('content-disposition'), sig: String.fromCharCode(...buf.slice(0, 2)), txt: new TextDecoder().decode(buf) }; }, q);
  const all = await zip(`/api/sedes/${d.sede}/zip`); ok(all.st === 200 && all.sig === 'PK' && /Marta\//.test(all.txt) && /Luis\//.test(all.txt) && /a\.jpg/.test(all.txt) && /c\.jpg/.test(all.txt), 'zip de la sede con carpetas por creador: ' + all.ct);
  const cid = await p.evaluate(async (s) => (await (await fetch('/api/torneos/' + document.body.dataset.torneo)).json()).sedes[0].creadores.find((c) => c.name === 'Luis').id, d.sede);
  const one = await zip(`/api/sedes/${d.sede}/zip?creador=${cid}`); ok(one.st === 200 && /c\.jpg/.test(one.txt) && !/a\.jpg/.test(one.txt) && /Luis/.test(one.ct), 'zip de un solo creador: ' + one.ct);
  const info = await p.evaluate(async (s) => (await fetch(`/api/sedes/${s}/zip?info=1`)).json(), d.sede); ok(info.parts === 1 && info.files === 3, 'info: ' + JSON.stringify(info));
  const other = await (await b.newContext()).newPage(); await other.goto(B + '/'); ok((await other.evaluate(async (u) => (await fetch(u)).status, `/api/sedes/${d.sede}/zip`)) === 401, 'sin sesión no se puede descargar');
  ok(errs.length === 0, 'sin errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
