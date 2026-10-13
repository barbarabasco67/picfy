// Plataforma: crear cuenta -> galerías -> crear galería -> invitado sube -> se ve en la galería del dueño.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const B = process.env.BASE || 'http://127.0.0.1:8787';
const SHOTS = process.env.SHOTS || '/tmp/picfy_shots';
require('fs').mkdirSync(SHOTS, { recursive: true });
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
const imgs = (n) => Array.from({ length: n }, (_, i) => `${process.cwd()}/tests/img/p${String(i).padStart(2, '0')}.jpg`);
const email = `t${Date.now()}@ejemplo.es`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 860 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  p.on('dialog', (d) => d.accept());

  await p.goto(B + '/galerias');
  check('sin sesión va a /entrar', p.url().endsWith('/entrar'));
  await p.screenshot({ path: SHOTS + '/1_entrar.png' });

  // Registro (primer usuario, o con código si ya hay)
  await p.goto(B + '/registro');
  if (p.url().endsWith('/registro') && await p.$('input[name=name]')) {
    await p.fill('input[name=name]', 'Pablo Prueba');
    await p.fill('input[name=email]', email);
    await p.fill('input[name=password]', 'clave-larga-123');
    if (await p.$('input[name=code]')) await p.fill('input[name=code]', process.env.SIGNUP_CODE || 'codigo');
    await p.click('button[type=submit]');
  }
  await p.waitForURL('**/galerias');
  check('registro lleva a Galerías', await p.isVisible('h1:has-text("Galerías")'));
  check('lista vacía', await p.isVisible('.emptybox'));
  await p.screenshot({ path: SHOTS + '/2_galerias_vacias.png' });

  // Crear galería
  await p.click('#newGal');
  await p.fill('#newDlg input[name=name]', 'Torneo 3x3 Las Rozas');
  await p.fill('#newDlg input[name=event_date]', '2026-10-24');
  await p.screenshot({ path: SHOTS + '/3_crear.png' });
  await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/\/galerias\/[0-9a-f]{16}/);
  check('galería creada', await p.isVisible('.gside h2:has-text("Torneo 3x3")'));
  await p.click('#openShare');
  await p.waitForSelector('#shareDlg .qr svg');
  const guestUrl = (await p.textContent('#guestLink')).trim().replace(/^https?:\/\/[^/]+/, B);
  check('enlace de invitados', /\/e\/[0-9a-f]{32}$/.test(guestUrl), guestUrl);
  await p.screenshot({ path: SHOTS + '/4_compartir.png' });
  await p.keyboard.press('Escape');
  const galUrl = p.url().split('?')[0];

  // Invitado (otro contexto, sin sesión) sube fotos
  const g = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage();
  await g.goto(guestUrl);
  await g.click('#openUpload');
  await g.setInputFiles('#fileInput', imgs(6));
  await g.waitForFunction(() => document.querySelectorAll('.up-item').length === 6);
  await g.click('#upStart');
  await g.waitForFunction(() => document.querySelectorAll('.up-item .st.ok').length === 6, null, { timeout: 60000 });
  check('invitado subió 6', true);

  // El dueño las ve
  await p.goto(galUrl);
  check('6 fotos en la galería del dueño', (await p.$$('.ptile')).length === 6);
  await p.click('.ptile');
  check('visor abre', await p.isVisible('#lb.open'));
  await p.keyboard.press('Escape');
  await p.screenshot({ path: SHOTS + '/5_galeria.png' });
  await p.goto(B + '/galerias');
  check('tarjeta con portada', await p.isVisible('.gcard .cover img'));
  await p.fill('#filter', 'zzz');
  check('filtro oculta', !(await p.isVisible('.gcard')));
  await p.fill('#filter', 'torneo');
  check('filtro muestra', await p.isVisible('.gcard'));
  await p.screenshot({ path: SHOTS + '/6_galerias.png' });

  // Otro usuario no ve esta galería
  const o = await (await b.newContext()).newPage();
  await o.goto(galUrl);
  check('anónimo no entra en la galería', o.url().endsWith('/entrar'));

  // Móvil
  const m = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await m.goto(B + '/entrar');
  await m.fill('input[name=email]', email); await m.fill('input[name=password]', 'clave-larga-123');
  await m.click('button[type=submit]'); await m.waitForURL('**/galerias');
  check('login con contraseña', true);
  await m.screenshot({ path: SHOTS + '/7_movil.png' });
  const sw = await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  check('sin scroll horizontal en móvil', sw);

  // Contraseña mala
  const w = await (await b.newContext()).newPage();
  await w.goto(B + '/entrar'); await w.fill('input[name=email]', email); await w.fill('input[name=password]', 'mala'); await w.click('button[type=submit]');
  check('contraseña incorrecta', await w.isVisible('.alert'));

  // Salir
  await p.goto(B + '/galerias'); await p.click('button[aria-label=Salir]');
  await p.waitForURL('**/entrar');
  await p.goto(B + '/galerias');
  check('tras salir pide entrar', p.url().endsWith('/entrar'));

  await b.close();
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
