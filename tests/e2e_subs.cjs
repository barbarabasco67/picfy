// Subgalerías: crear sedes dentro de un torneo, subir a cada una, ver y borrar en cascada.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const B = process.env.BASE || 'http://127.0.0.1:8787';
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
const imgs = (n) => Array.from({ length: n }, (_, i) => `${process.cwd()}/tests/img/p${String(i).padStart(2, '0')}.jpg`);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  p.on('dialog', (d) => d.accept());
  await p.goto(B + '/registro');
  await p.fill('input[name=name]', 'Sedes'); await p.fill('input[name=email]', `s${Date.now()}@ejemplo.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/galerias');
  await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Torneo grande'); await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/\/galerias\/[0-9a-f]{16}/); const parentUrl = p.url().split('?')[0];

  const subUrls = [];
  for (const n of ['Sede Norte', 'Sede Sur']) {
    await p.goto(parentUrl);
    await p.click('[data-open=subDlg]'); await p.fill('#subDlg input[name=name]', n); await p.click('#subDlg button.primary');
    await p.waitForURL(/\/galerias\/[0-9a-f]{16}\?ok/);
    subUrls.push(p.url().split('?')[0]);
    check('migas con padre', await p.isVisible(`.crumbs a:has-text("Torneo grande")`));
    check('subgalería no ofrece más subgalerías', !(await p.isVisible('[data-open=subDlg]')));
    await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
    const link = (await p.textContent('#guestLink')).trim().replace(/^https?:\/\/[^/]+/, B); await p.keyboard.press('Escape');
    const g = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage();
    await g.goto(link); await g.click('#openUpload');
    const files = imgs(n === 'Sede Norte' ? 3 : 4);
    await g.setInputFiles('#fileInput', files);
    await g.waitForFunction((k) => document.querySelectorAll('.up-item').length === k, files.length);
    await g.click('#upStart'); await g.waitForFunction((k) => document.querySelectorAll('.up-item .st.ok').length === k, files.length, { timeout: 60000 });
  }
  await p.goto(parentUrl);
  check('2 subgalerías listadas', (await p.$$('.subs .gcard')).length === 2);
  check('contadores 3 y 4', (await p.$$eval('.subs .gmeta span', (n) => n.map((x) => x.textContent))).join() === '3,4');
  // mostrar subgalerías a los invitados
  await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
  const pl = (await p.textContent('#guestLink')).trim().replace(/^https?:\/\/[^/]+/, B); await p.keyboard.press('Escape');
  const gp = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage();
  await gp.goto(pl);
  check('sin opción: no se ven sedes', (await gp.$$('.subcard')).length === 0);
  await p.click('[data-open=setDlg]'); await p.check('#setDlg input[name=show_subs]'); await p.click('#setDlg button.primary');
  await p.waitForSelector('.alert.ok:has-text("Ajustes guardados")');
  await gp.goto(pl);
  check('con opción: 2 sedes', (await gp.$$('.subcard')).length === 2);
  await gp.screenshot({ path: '/tmp/picfy_shots/subs_guest.png' });
  await gp.click('.subcard >> nth=0');
  await gp.waitForSelector('h1:has-text("Sede")');
  check('la tarjeta lleva a la sede', /\/e\//.test(gp.url()) && gp.url() !== pl);
  await p.goto(B + '/galerias');
  check('solo la galería principal en la lista', (await p.$$('#gcards .gcard')).length === 1);
  check('chip de subgalerías', await p.isVisible('.chip.subc:has-text("2 subgalerías")'));
  await p.screenshot({ path: '/tmp/picfy_shots/s1_lista.png' });
  await p.goto(parentUrl); await p.screenshot({ path: '/tmp/picfy_shots/s2_padre.png' });
  // borrar el padre borra las hijas
  await p.click('[data-open=setDlg]'); await p.click('#setDlg button.danger');
  await p.waitForURL('**/galerias');
  const r = await p.goto(subUrls[0]);
  check('subgalería borrada en cascada', r.status() === 404);
  await b.close();
  console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
