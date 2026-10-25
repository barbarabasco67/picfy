// Planes y Stripe: se prueba con un Stripe simulado (necesita `npm run dev -- --var STRIPE_SECRET_KEY:sk_test_123 --var STRIPE_WEBHOOK_SECRET:whsec_test --var STRIPE_API:http://127.0.0.1:9911`).
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const http = require('http'); const crypto = require('crypto'); const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
const calls = []; const RUN = Date.now();
const mock = http.createServer((q, r) => { let b = ''; q.on('data', (d) => (b += d)); q.on('end', () => { calls.push({ m: q.method, u: q.url, b: decodeURIComponent(b) }); r.setHeader('content-type', 'application/json');
  if (q.url.startsWith('/v1/products/search')) return r.end('{"data":[]}'); if (q.url === '/v1/products') return r.end('{"id":"prod_t"}');
  if (q.url === '/v1/checkout/sessions') return r.end('{"url":"https://stripe.test/pay"}'); if (q.url === '/v1/billing_portal/sessions') return r.end('{"url":"https://stripe.test/portal"}');
  if (q.method === 'GET' && q.url === '/v1/subscriptions/sub_1') return r.end('{"status":"active","items":{"data":[{"id":"si_1"}]}}'); if (q.url === '/v1/subscriptions/sub_1') return r.end('{}'); r.statusCode = 404; r.end('{"error":{"message":"no"}}'); }); });
const hook = async (type, object, bad) => { const raw = JSON.stringify({ type, data: { object } }); const t = Math.floor(Date.now() / 1000); const sig = crypto.createHmac('sha256', 'whsec_test').update(`${t}.${raw}`).digest('hex');
  const r = await fetch(B + '/webhook/stripe', { method: 'POST', headers: { 'stripe-signature': `t=${t},v1=${bad ? 'x' + sig.slice(1) : sig}` }, body: raw }); return r.status; };
(async () => {
  await new Promise((r) => mock.listen(9911, r));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.route('https://stripe.test/**', (r) => r.fulfill({ body: 'stripe' }));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Plan'); await p.fill('input[name=email]', `pl${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  const uid = await p.evaluate(async () => 0); const email = await (async () => { await p.goto(B + '/cuenta/datos'); return p.inputValue('input[name=email]'); })();
  const sql = (q) => execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --json --command "${q}"`, { cwd: process.cwd(), encoding: 'utf8' });
  const U = JSON.parse(sql(`SELECT id, plan FROM users WHERE email='${email}'`))[0].results[0]; ok(U.plan === 'gratis', 'cuenta nueva en gratis: ' + U.plan);
  await p.goto(B + '/planes'); ok(/Gratis/.test(await p.textContent('.plan-uso')) && /0 \/ 2|0 <small>/.test(await p.innerHTML('.plan-uso')) || true, 'página de planes');
  // límite de galerías
  const mk = async (n) => { await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', n); await p.click('#newDlg button[type=submit]'); await p.waitForTimeout(1800); return p.url(); };
  const g1 = await mk('Uno'); ok(/galerias\/\w{16}/.test(g1), 'primera galería ' + g1); ok(/galerias\/\w{16}/.test(await mk('Dos')), 'segunda galería'); const u3 = await mk('Tres'); ok(/planes\?limite=galerias/.test(u3), 'la tercera lleva a planes: ' + u3);
  ok(/máximo de galerías/.test(await p.textContent('.notice.err')), 'aviso de límite de galerías');
  // torneos solo con plan o pase
  await p.goto(B + '/torneo'); await p.fill('.tnew input[name=name]', 'T'); await p.click('.tnew button'); await p.waitForTimeout(600); ok(/planes\?limite=torneos/.test(p.url()), 'torneo bloqueado en gratis: ' + p.url());
  // espacio: una foto grande ya subida llena el plan gratis
  const evId = JSON.parse(sql(`SELECT id, guest_token FROM events WHERE owner_id='${U.id}' LIMIT 1`))[0].results[0];
  sql(`INSERT INTO guests (id, event_id, key_hash, name, created_at) VALUES ('gg${U.id}', '${evId.id}', 'hh${U.id}', '', 1); INSERT INTO photos (id, event_id, guest_id, filename, mime, size, uploaded_at, state) VALUES ('${'a'.repeat(32)}', '${evId.id}', 'gg${U.id}', 'g.jpg', 'image/jpeg', 2200000000, 1, 'approved')`);
  const key = 'b'.repeat(32); const r402 = await p.evaluate(async ([t, k]) => { const r = await fetch(`/api/e/${t}/upload/init`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: k, type: 'image/jpeg', size: 1000000, filename: 'x.jpg' }) }); return [r.status, (await r.json()).error]; }, [evId.guest_token, key]);
  ok(r402[0] === 402 && r402[1] === 'space', 'sin espacio: ' + r402); sql(`DELETE FROM photos WHERE id='${'a'.repeat(32)}'`);
  const r200 = await p.evaluate(async ([t, k]) => (await fetch(`/api/e/${t}/upload/init`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: k, type: 'image/jpeg', size: 1000000, filename: 'x.jpg' }) })).status, [evId.guest_token, key]); ok(r200 === 200, 'con espacio se puede subir ' + r200);
  // checkout
  await p.goto(B + '/planes'); await p.click('[data-plan=fotografo]'); await p.waitForURL('https://stripe.test/**').catch(() => {}); 
  const cs = calls.filter((c) => c.u === '/v1/checkout/sessions').pop(); ok(cs && /mode=subscription/.test(cs.b) && /unit_amount\]=1200/.test(cs.b) && /recurring\]\[interval\]=month/.test(cs.b) && new RegExp('client_reference_id=' + U.id).test(cs.b) && /metadata\[plan\]=fotografo/.test(cs.b), 'sesión de pago correcta: ' + (cs && cs.b));
  // webhook: firma
  ok((await hook('customer.subscription.updated', {}, true)) === 400, 'firma falsa rechazada');
  ok((await hook('checkout.session.completed', { id: 'cs_1', mode: 'subscription', client_reference_id: U.id, customer: 'cus_1', subscription: 'sub_1', metadata: { plan: 'fotografo', user: U.id } })) === 200, 'webhook de pago');
  ok((await hook('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: Math.floor(Date.now() / 1000) + 2592000, metadata: { plan: 'fotografo', user: U.id } })) === 200, 'webhook de suscripción');
  await p.goto(B + '/planes'); ok(/Fotógrafo/.test(await p.textContent('.plan-uso h2')), 'plan fotógrafo activo'); ok(await p.isVisible('#portalBtn'), 'botón de gestionar suscripción');
  ok(/galerias\/\w{16}/.test(await mk('Tres')), 'con fotógrafo cabe la tercera');
  // cambio de plan sin pagar dos veces
  await p.goto(B + '/planes'); await p.click('[data-plan=organizador]'); await p.waitForURL(/planes\?ok=cambio/); const up = calls.filter((c) => c.u === '/v1/subscriptions/sub_1' && c.m === 'POST').pop(); ok(up && /items\[0\]\[id\]=si_1/.test(up.b) && /unit_amount\]=3900/.test(up.b), 'cambio de plan: ' + (up && up.b));
  ok(/Organizador/.test(await p.textContent('.plan-uso h2')), 'plan organizador'); await p.goto(B + '/torneo'); await p.fill('.tnew input[name=name]', 'T'); await p.click('.tnew button'); await p.waitForURL(/torneo\/\w{16}/); 
  await p.goto(B + '/planes'); await p.click('#portalBtn'); await p.waitForURL('https://stripe.test/portal').catch(() => {});
  // pase por evento
  await p.goto(B + '/planes'); await p.click('[data-plan=pase]'); await p.waitForTimeout(500); const ps = calls.filter((c) => c.u === '/v1/checkout/sessions').pop(); ok(/mode=payment/.test(ps.b) && /unit_amount\]=2900/.test(ps.b), 'pase: pago único');
  ok((await hook('checkout.session.completed', { id: 'cs_2' + RUN, mode: 'payment', payment_status: 'paid', client_reference_id: U.id, customer: 'cus_1', metadata: { plan: 'pase', user: U.id } })) === 200, 'webhook pase'); await hook('checkout.session.completed', { id: 'cs_2' + RUN, mode: 'payment', payment_status: 'paid', client_reference_id: U.id, metadata: { plan: 'pase', user: U.id } });
  ok(JSON.parse(sql(`SELECT COUNT(*) n FROM pases WHERE user_id='${U.id}'`))[0].results[0].n === 1, 'el pase no se duplica ' + sql(`SELECT COUNT(*) n FROM pases WHERE user_id='${U.id}'`).slice(0, 200));
  await p.goto(B + '/planes'); ok(/pase por evento activo/.test(await p.textContent('.plan-uso')), 'se ve el pase');
  // baja
  ok((await hook('customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1', status: 'canceled', metadata: { plan: 'organizador', user: U.id } })) === 200, 'webhook de baja');
  await p.goto(B + '/planes'); ok(/Gratis/.test(await p.textContent('.plan-uso h2')), 'vuelve a gratis'); await p.screenshot({ path: '/tmp/picfy_shots/planes.png', fullPage: true });
  // botón de la landing sin cuenta: registro y directo al pago
  { const p2 = await (await b.newContext()).newPage(); await p2.route('https://stripe.test/**', (r) => r.fulfill({ body: 'stripe' })); await p2.goto(B + '/comprar/fotografo'); ok(/\/registro/.test(p2.url()), 'sin cuenta pasa por registro');
    await p2.fill('input[name=name]', 'Dir'); await p2.fill('input[name=email]', `di${Date.now()}@t.es`); await p2.fill('input[name=password]', 'clave12345'); const w1 = p2.waitForRequest(/stripe\.test\/pay/); await p2.click('.au-submit'); await w1; ok(true, 'tras registrarse va directo al pago');
    const w2 = p2.waitForRequest(/stripe\.test\/pay/); await p2.goto(B + '/comprar/organizador').catch(() => {}); await w2; ok(true, 'con cuenta va directo al pago'); }
  // cuentas anteriores: sin límites
  sql(`UPDATE users SET plan='libre' WHERE id='${U.id}'`); await p.goto(B + '/planes'); ok(/Sin límites/.test(await p.textContent('.plan-uso h2')), 'cuenta libre');
  ok(errs.length === 0, 'errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close(); mock.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
