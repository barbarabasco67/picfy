const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
let ok = true; const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, c ? '' : x); if (!c) ok = false; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  await p.goto(B + '/entrar');
  check('sin texto explicativo', !/todo en un sitio/i.test(await p.textContent('body')));
  check('al entrar solo está el formulario de entrar', (await p.$$('form.au-form')).length === 1 && !(await p.$('input[name=name]')));
  // cambiar a «Crear cuenta» sin recargar
  await p.evaluate(() => { window.__mark = 1; });
  await p.click('.au-tabs a[data-mode=signup]');
  check('misma página, sin recargar', (await p.evaluate(() => window.__mark)) === 1);
  check('aparece el nombre', !!(await p.$('input[name=name]')));
  check('la dirección pasa a /registro', /\/registro$/.test(p.url()));
  // el correo escrito se conserva al cambiar
  await p.click('.au-tabs a[data-mode=login]'); await p.fill('input[name=email]', 'alguien@correo.es'); await p.click('.au-tabs a[data-mode=signup]');
  check('conserva el correo', (await p.inputValue('input[name=email]')) === 'alguien@correo.es');
  // ojo de la contraseña
  await p.fill('input[name=password]', 'secreta-123'); await p.click('.au-eye');
  check('mostrar contraseña', (await p.getAttribute('input[name=password]', 'type')) === 'text');
  await p.click('.au-eye'); check('ocultar contraseña', (await p.getAttribute('input[name=password]', 'type')) === 'password');
  // crear cuenta desde la pantalla de entrar
  const mail = `au${Date.now()}@t.es`;
  await p.fill('input[name=name]', 'Persona Uno'); await p.fill('input[name=email]', mail); await p.fill('input[name=password]', 'clave-larga-123');
  await p.click('.au-submit'); await p.waitForURL('**/galerias');
  check('cuenta creada desde la misma pantalla', /galerias/.test(p.url()));
  // error de contraseña: se queda en «Entrar» con el aviso
  const q = await (await b.newContext()).newPage();
  await q.goto(B + '/entrar'); await q.fill('input[name=email]', mail); await q.fill('input[name=password]', 'mala'); await q.click('.au-submit');
  await q.waitForSelector('.alert');
  check('error de contraseña en la pestaña Entrar', /incorrectos/.test(await q.textContent('.alert')) && (await q.getAttribute('.au-tabs a.on', 'data-mode')) === 'login');
  await q.click('.au-tabs a[data-mode=signup]');
  check('el aviso no pasa a la otra pestaña', !(await q.$('.alert')));
  // /registro abre directamente en «Crear cuenta»; correo repetido avisa ahí
  await q.goto(B + '/registro'); await q.fill('input[name=name]', 'X'); await q.fill('input[name=email]', mail); await q.fill('input[name=password]', 'clave-larga-123'); await q.click('.au-submit');
  await q.waitForSelector('.alert');
  check('correo repetido avisa en Crear cuenta', /Ya existe/.test(await q.textContent('.alert')) && (await q.getAttribute('.au-tabs a.on', 'data-mode')) === 'signup');
  // móvil
  const m = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await m.goto(B + '/registro');
  check('móvil sin scroll horizontal', await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
