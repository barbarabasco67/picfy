// Acceso con Google, con un «Google de mentira» en el puerto 8799 (solo se usa en local).
const http = require('http');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
let ok = true; const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, c ? '' : x); if (!c) ok = false; };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
let mode = 'ok';
const mock = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/auth') { // «el usuario ya aceptó»: vuelve con un código que lleva el correo
    const code = Buffer.from(u.searchParams.get('login_hint') || global.__who).toString('base64url');
    const back = new URL(u.searchParams.get('redirect_uri'));
    back.searchParams.set('code', code); back.searchParams.set('state', mode === 'badstate' ? 'otro' : u.searchParams.get('state'));
    res.writeHead(302, { location: back.toString() }); return res.end();
  }
  if (u.pathname === '/token') {
    let body = ''; req.on('data', (d) => (body += d)); req.on('end', () => {
      const f = new URLSearchParams(body);
      const [email, name] = Buffer.from(f.get('code'), 'base64url').toString().split('|');
      if (!f.get('code_verifier')) { res.writeHead(400); return res.end('{}'); }
      const p = { iss: 'https://accounts.google.com', aud: mode === 'badaud' ? 'otra-app' : f.get('client_id'), exp: Math.floor(Date.now() / 1000) + 3600, email, email_verified: mode !== 'unverified', name };
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ id_token: `x.${b64(p)}.y` }));
    });
    return;
  }
  res.writeHead(404); res.end();
});
async function fresh(b) { const p = await (await b.newContext()).newPage(); p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; }); return p; }
(async () => {
  await new Promise((r) => mock.listen(8799, '127.0.0.1', r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let p = await fresh(b);
  await p.goto(B + '/entrar'); check('botón de Google al entrar', !!(await p.$('a[href="/auth/google"]')));
  await p.goto(B + '/registro'); check('botón de Google al crear cuenta', !!(await p.$('a[href="/auth/google"]')));
  check('sin código de invitación', !(await p.$('input[name=code]')));
  // alta nueva con Google
  const email = `g${Date.now()}@gmail.com`;
  global.__who = `${email}|Ana Pérez`;
  await p.click('a[href="/auth/google"]'); await p.waitForURL('**/inicio'); await p.goto(B + '/galerias');
  check('entra con Google y crea el perfil', /Ana/.test(await p.textContent('header .avatar')) || (await p.$('header .avatar')) !== null);
  const me = await p.evaluate(async () => (await fetch('/cuenta')).status);
  check('sesión abierta', me === 200);
  // sale y vuelve a entrar: misma cuenta
  await p.evaluate(() => fetch('/salir', { method: 'POST' })); await p.goto(B + '/galerias'); check('sin sesión pide entrar', /entrar/.test(p.url()));
  await p.goto(B + '/entrar'); await p.click('a[href="/auth/google"]'); await p.waitForURL('**/inicio'); await p.goto(B + '/galerias');
  check('vuelve a entrar', /galerias/.test(p.url()));
  // cuenta con contraseña y mismo correo: entra en la misma
  const q = await fresh(b); const email2 = `p${Date.now()}@gmail.com`;
  await q.goto(B + '/registro'); await q.fill('input[name=name]', 'Con clave'); await q.fill('input[name=email]', email2); await q.fill('input[name=password]', 'clave-larga-123'); await q.click('button[type=submit]'); await q.waitForURL('**/inicio'); await q.goto(B + '/galerias');
  await q.evaluate(() => fetch('/salir', { method: 'POST' }));
  global.__who = `${email2}|Otro nombre`;
  await q.goto(B + '/entrar'); await q.click('a[href="/auth/google"]'); await q.waitForURL('**/inicio'); await q.goto(B + '/galerias');
  await q.goto(B + '/cuenta'); check('mismo correo: misma cuenta', /Con clave/.test(await q.content()) || (await q.inputValue('input[name=name]').catch(() => '')) === 'Con clave');
  // fallos: estado distinto, destinatario distinto, correo sin verificar
  for (const m of ['badstate', 'badaud', 'unverified']) {
    mode = m; const r = await fresh(b); global.__who = `x${Date.now()}@gmail.com|X`;
    await r.goto(B + '/entrar'); await r.click('a[href="/auth/google"]'); await r.waitForURL('**/entrar?e=google');
    check('rechaza ' + m, /No se ha podido entrar con Google/.test(await r.textContent('.alert')));
    await r.goto(B + '/galerias'); check('sin sesión tras ' + m, /entrar/.test(r.url()));
  }
  mode = 'ok';
  // callback directo sin pasar por Google
  const s = await fresh(b); await s.goto(B + '/auth/google/callback?code=abc&state=zzz'); check('callback sin cookie: error', /e=google/.test(s.url()));
  await b.close(); mock.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
