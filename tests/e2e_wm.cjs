const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787';
let ok = true; const check = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, c ? '' : x); if (!c) ok = false; };
const img = (i) => `${process.cwd()}/tests/img/p0${i}.jpg`;
// diferencia media entre la foto servida y el original reducido a su tamaño
const diff = (page, id) => page.evaluate(async (id) => {
  const get = async (u) => createImageBitmap(await (await fetch(u)).blob());
  const a = await get(`/m/${id}/l`), o = await get(`/m/${id}/o`);
  const c1 = new OffscreenCanvas(a.width, a.height), c2 = new OffscreenCanvas(a.width, a.height);
  c1.getContext('2d').drawImage(a, 0, 0); c2.getContext('2d').drawImage(o, 0, 0, a.width, a.height);
  const d1 = c1.getContext('2d').getImageData(0, 0, a.width, a.height).data, d2 = c2.getContext('2d').getImageData(0, 0, a.width, a.height).data;
  let s = 0; for (let i = 0; i < d1.length; i += 4) s += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
  return s / (d1.length / 4) / 3;
}, id);
async function settle(p, g) { // esperar a que el navegador termine de rehacer las fotos y la página se recargue
  await p.waitForURL(/ok=/);
  for (let i = 0; i < 90; i++) {
    await p.waitForTimeout(1000);
    try {
      const r = await p.evaluate(async (g) => (await (await fetch(`/api/g/${g}/wm/pending`)).json()).ids.length, g);
      if (r === 0 && !(await p.$('.wmbar'))) break;
    } catch { /* la página se está recargando */ }
  }
  await p.waitForLoadState('load'); await p.waitForTimeout(500);
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'Marca'); await p.fill('input[name=email]', `w${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/galerias');
  await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Con marca'); await p.click('#newDlg button[type=submit]');
  await p.waitForURL(/galerias\/[0-9a-f]{16}/); const gurl = p.url().split('?')[0];
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', [img(0), img(1), img(2)]);
  await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 3); await p.click('#upStart'); await p.waitForSelector('.toast', { timeout: 60000 });
  const ids = await p.$$eval('#photoGrid .tile, .tile', (n) => n.map((t) => t.dataset.id).filter(Boolean));
  check('3 fotos', ids.length === 3, ids.length);
  const clean = await diff(p, ids[0]);
  check('sin marca: igual que el original', clean < 6, clean);

  // activar la marca de agua
  await p.click('[data-open=setDlg]');
  await p.check('#setDlg input[name=wm]'); await p.fill('#setDlg input[name=wm_text]', 'MARCA PICFY');
  check('vista previa dibujada', await p.$eval('canvas[data-wmprev]', (c) => c.getContext('2d').getImageData(10, 10, 1, 1).data[3] > 0));
  await p.click('#setDlg button[type=submit]:not([formaction])');
  await settle(p, gurl.split('/').pop());
  const pend = await p.evaluate(async (g) => (await (await fetch(`/api/g/${g}/wm/pending`)).json()), gurl.split('/').pop());
  check('nada pendiente tras aplicar', pend.ready && pend.ids.length === 0 && pend.on === 1, JSON.stringify(pend));
  const marked = await diff(p, ids[0]);
  check('con marca: la foto cambia', marked > clean + 2, `${clean} -> ${marked}`);

  // invitados: ven la marca y no pueden sacar el original
  const tok = await p.$eval('body', (b) => b.dataset.token);
  const g = await (await b.newContext()).newPage();
  await g.goto(B + '/e/' + tok);
  check('la página lleva la configuración', !!(await g.getAttribute('body', 'data-wm')));
  check('el invitado no ve el original', (await g.request.get(B + `/m/${ids[0]}/o`)).status() === 404);
  check('el dueño sí lo ve', (await p.evaluate(async (id) => (await fetch(`/m/${id}/o`)).status, ids[0])) === 200);
  const gl = await g.request.get(B + `/m/${ids[0]}/l`);
  check('el invitado recibe la versión con marca', gl.ok() && (await gl.body()).length > 1000);

  // una foto nueva ya sube con marca y no queda pendiente
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', [img(3)]);
  await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 1); await p.click('#upStart'); await p.waitForSelector('.toast', { timeout: 60000 });
  const pend2 = await p.evaluate(async (g) => (await (await fetch(`/api/g/${g}/wm/pending`)).json()), gurl.split('/').pop());
  check('foto nueva sube con marca', pend2.ids.length === 0, JSON.stringify(pend2.ids));
  const ids2 = await p.$$eval('.tile', (n) => n.map((t) => t.dataset.id).filter(Boolean));
  const newId = ids2.find((i) => !ids.includes(i));
  check('la nueva lleva marca', (await diff(p, newId)) > clean + 2);

  // quitar la marca: vuelve la versión limpia
  await p.click('[data-open=setDlg]'); await p.uncheck('#setDlg input[name=wm]');
  await p.click('#setDlg button[type=submit]:not([formaction])');
  await settle(p, gurl.split('/').pop());
  const back = await diff(p, ids[0]);
  check('sin marca otra vez', back < 6, back);
  await p.screenshot({ path: '/tmp/picfy_shots/wm_settings.png' });
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
