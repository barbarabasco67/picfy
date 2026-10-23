const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const r = await p.goto(B + '/'); ok(r.status() === 200, 'status 200');
    ok((await p.textContent('h1')).includes('Un solo enlace'), 'titular');
    ok(await p.$('a[href="/entrar"]') && await p.$('a[href="/registro"]'), 'enlaces a entrar y registro');
    await p.evaluate(async () => { for (const i of document.images) i.loading = 'eager'; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
    const bad = await p.$$eval('img', (a) => a.filter((i) => !i.naturalWidth).map((i) => i.src)); ok(bad.length === 0, 'imágenes rotas: ' + bad.join(','));
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'sin scroll horizontal a ' + w);
    ok(!(await p.content()).includes('127.0.0.1'), 'sin direcciones locales en la página');
    ok(errs.length === 0, 'errores JS: ' + errs.join(';'));
    ok(await p.evaluate(() => document.fonts.check('16px Bricolage')), 'tipografía cargada');
  }
  const f = await b.newPage(); const html = await (await f.request.get(B + '/torneos/og.jpg')).status(); ok(html === 200, 'og.jpg');
  const m = await (await f.request.get(B + '/')).text(); ok(m.includes('name="description"') && !m.includes('noindex'), 'meta descripción e indexable');
  { // con sesión iniciada, picfy.es también enseña la página de inicio (no te manda al panel)
    const u = await (await b.newContext()).newPage();
    await u.goto(B + '/registro'); await u.fill('input[name=name]', 'L'); await u.fill('input[name=email]', `l${Date.now()}@t.es`); await u.fill('input[name=password]', 'clave-larga-123'); await u.click('.au-submit'); await u.waitForURL('**/inicio'); await u.goto(B + '/galerias');
    await u.goto(B + '/'); ok(new URL(u.url()).pathname === '/', 'con sesión se queda en la página de inicio');
    ok(/Ir a mi panel/.test(await u.textContent('nav, header')), 'botón «Ir a mi panel»');
    const o = await (await b.newContext()).newPage(); await o.goto(B + '/'); ok(!/Ir a mi panel/.test(await o.content()) && /Crear cuenta/.test(await o.content()), 'sin sesión: Entrar y Crear cuenta');
  }
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
