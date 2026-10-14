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
  await p.click('a.avatar'); await p.waitForURL('**/cuenta/datos'); await Promise.all([p.waitForURL('**/galerias'), p.click('.backlink')]); await p.click('a.avatar'); await p.waitForURL('**/cuenta/datos');
  await p.fill('[name=surname]', 'García'); await p.click('form[action="/cuenta/datos"] button');
  await p.waitForSelector('.notice.ok:not(.hidden)'); assert((await p.inputValue('[name=surname]')) === 'García', 'apellidos');
  // foto de perfil
  const fs = require('fs'); const img = 'tests/img/' + fs.readdirSync('tests/img').find((f) => /\.jpe?g$/.test(f));
  await p.setInputFiles('#avFile', img); await p.waitForLoadState('load'); await p.waitForSelector('#avDel');
  assert(/cuenta\/foto/.test(await p.getAttribute('a.avatar', 'style')), 'foto en la cabecera');
  await p.goto(B + '/galerias'); assert(/cuenta\/foto/.test(await p.getAttribute('a.avatar', 'style')), 'foto en galerías');
  const st = await p.evaluate(async () => (await fetch(document.querySelector('a.avatar').style.backgroundImage.slice(5, -2))).status); assert(st === 200, 'imagen servida');
  await p.goto(B + '/cuenta/datos'); await p.click('#avDel'); await p.waitForSelector('#avFile', { state: 'attached' }); await p.waitForTimeout(300);
  assert(!(await p.getAttribute('a.avatar', 'style')), 'foto quitada');
  await p.setInputFiles('#avFile', img); await p.waitForSelector('#avDel');
  // contraseña
  await p.goto(B + '/cuenta/password');
  await p.fill('[name=current]', 'mala'); await p.fill('[name=password]', 'nueva-12345'); await p.fill('[name=password2]', 'nueva-12345');
  await p.click('button.primary'); await p.waitForSelector('.notice.err:not(.hidden)');
  await p.fill('[name=current]', 'clave-12345'); await p.fill('[name=password]', 'nueva-12345'); await p.fill('[name=password2]', 'nueva-12345');
  await p.click('button.primary'); await p.waitForSelector('.notice.ok:not(.hidden)');
  // correo
  await p.goto(B + '/cuenta/datos');
  const e2 = 'n' + email;
  await p.fill('form[action="/cuenta/correo"] [name=email]', e2); await p.fill('form[action="/cuenta/correo"] [name=current]', 'nueva-12345');
  await p.click('form[action="/cuenta/correo"] button'); await p.waitForSelector('.notice.ok:not(.hidden)');
  // predeterminados
  await p.goto(B + '/cuenta/galerias');
  await p.check('[name=allow_download]'); await p.check('[name=show_subs]'); await p.fill('[name=photo_limit]', '7');
  await p.click('button.primary'); await p.waitForSelector('.notice.ok:not(.hidden)');
  await p.goto(B + '/galerias'); await p.click('#newGal');
  assert((await p.inputValue('#newDlg [name=photo_limit]')) === '7', 'prefill límite');
  await p.fill('#newDlg [name=name]', 'Con valores');
  await Promise.all([p.waitForNavigation(), p.click('#newDlg button.primary')]);
  await p.click('#setBtn, [data-open=setDlg], button:has-text("Ajustes")').catch(() => {});
  await p.waitForTimeout(300);
  assert(await p.isChecked('#setDlg [name=allow_download]'), 'descarga por defecto');
  assert(await p.isChecked('#setDlg [name=show_subs]'), 'subs por defecto');
  // salir y entrar con la nueva
  await p.goto(B + '/cuenta/datos'); await p.click('.prof form button'); await p.waitForURL('**/entrar');
  await p.fill('[name=email]', e2); await p.fill('[name=password]', 'nueva-12345');
  await Promise.all([p.waitForNavigation(), p.click('button[type=submit]')]);
  assert(p.url().includes('/galerias'), 'login con datos nuevos');
  console.log('ALL OK'); await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
