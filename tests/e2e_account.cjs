// Mi cuenta: datos, correo, contraseña y valores predeterminados.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
const assert = (c, m) => { if (!c) { console.error('FALLO:', m); process.exitCode = 1; throw new Error(m); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await (await b.newContext()).newPage();
  const email = `cta${Date.now()}@ejemplo.es`;
  await p.goto(B + '/registro');
  await p.fill('[name=name]', 'Ana'); await p.fill('[name=email]', email); await p.fill('[name=password]', 'clave-12345');
  if (await p.$('[name=code]')) await p.fill('[name=code]', 'codigo');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  await p.click('a.avatar'); await p.waitForURL('**/cuenta/datos');
  await p.fill('[name=surname]', 'García'); await p.click('form[action="/cuenta/datos"] button');
  await p.waitForSelector('.notice.ok'); assert((await p.inputValue('[name=surname]')) === 'García', 'apellidos');
  // contraseña
  await p.goto(B + '/cuenta/password');
  await p.fill('[name=current]', 'mala'); await p.fill('[name=password]', 'nueva-12345'); await p.fill('[name=password2]', 'nueva-12345');
  await p.click('button.primary'); await p.waitForSelector('.notice.err');
  await p.fill('[name=current]', 'clave-12345'); await p.fill('[name=password]', 'nueva-12345'); await p.fill('[name=password2]', 'nueva-12345');
  await p.click('button.primary'); await p.waitForSelector('.notice.ok');
  // correo
  await p.goto(B + '/cuenta/datos');
  const e2 = 'n' + email;
  await p.fill('form[action="/cuenta/correo"] [name=email]', e2); await p.fill('form[action="/cuenta/correo"] [name=current]', 'nueva-12345');
  await p.click('form[action="/cuenta/correo"] button'); await p.waitForSelector('.notice.ok');
  // predeterminados
  await p.goto(B + '/cuenta/galerias');
  await p.check('[name=allow_download]'); await p.check('[name=show_subs]'); await p.fill('[name=photo_limit]', '7');
  await p.click('button.primary'); await p.waitForSelector('.notice.ok');
  await p.goto(B + '/galerias'); await p.click('#newGal');
  assert((await p.inputValue('#newDlg [name=photo_limit]')) === '7', 'prefill límite');
  await p.fill('#newDlg [name=name]', 'Con valores');
  await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  await p.click('#setBtn, [data-open=setDlg], button:has-text("Ajustes")').catch(() => {});
  await p.waitForTimeout(300);
  assert(await p.isChecked('#setDlg [name=allow_download]'), 'descarga por defecto');
  assert(await p.isChecked('#setDlg [name=show_subs]'), 'subs por defecto');
  // salir y entrar con la nueva
  await p.goto(B + '/cuenta/datos'); await p.click('.side button.linkbtn'); await p.waitForURL('**/entrar');
  await p.fill('[name=email]', e2); await p.fill('[name=password]', 'nueva-12345');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  assert(p.url().includes('/galerias'), 'login con datos nuevos');
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
