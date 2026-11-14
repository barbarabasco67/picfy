// Galerías: subir vídeos (por trozos), verlos en el visor y servirlos con rangos.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
const V1 = process.env.VID_BIG || '/tmp/vid/grande.mp4', V2 = process.env.VID_SMALL || '/tmp/vid/corto.webm';
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'V'); await p.fill('input[name=email]', `v${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Con vídeos'); await p.click('#newDlg button[type=submit]'); await p.waitForURL(/galerias\/\w{16}/);
  await p.click('#openUpload'); await p.setInputFiles('#fileInput', [V1, V2, process.cwd() + '/tests/img/p00.jpg']);
  await p.waitForFunction(() => document.querySelectorAll('.up-item').length === 3); ok(true, 'el selector acepta vídeos y fotos a la vez');
  ok((await p.locator('.up-item.isvid').count()) === 2, 'los vídeos se previsualizan como vídeo');
  await p.click('#upStart'); await p.waitForSelector('.toast', { timeout: 120000 });
  ok(/3 archivos subidos/.test(await p.textContent('.toast')), 'mensaje: ' + (await p.textContent('.toast')));
  await p.waitForSelector('.tile.ph'); ok((await p.locator('.tile.ph').count()) === 3 && (await p.locator('.tile.ph.isvid .vbadge').count()) === 2, 'tres elementos, dos con distintivo de vídeo');
  const vid = p.locator('.tile.ph.isvid').first(); const dv = await vid.getAttribute('data-video'); const vidId = (await vid.getAttribute('data-id'));
  const r = await p.evaluate(async (u) => { const x = await fetch(u, { headers: { range: 'bytes=0-99' } }); return [x.status, x.headers.get('content-range'), x.headers.get('content-type'), (await x.arrayBuffer()).byteLength]; }, dv);
  ok(r[0] === 206 && /^bytes 0-99\//.test(r[1]) && /video\/(mp4|webm)/.test(r[2]) && r[3] === 100, 'el vídeo se sirve por rangos: ' + r.join(' '));
  const sizes = []; for (const u of await p.locator('.tile.ph.isvid').evaluateAll(l => l.map(e => e.dataset.video))) { const rr = await p.evaluate(async (u) => { const x = await fetch(u, { headers: { range: 'bytes=0-9' } }); return x.headers.get('content-range'); }, u); sizes.push(Number(rr.split('/')[1])); } ok(sizes.some(t => t > 8 * 1024 * 1024), 'tamaño guardado ' + sizes.join(','));
  await vid.click(); await p.waitForSelector('.lb.open .lbvid:not([hidden])');
  await p.waitForFunction(() => { const v = document.querySelector('.lbvid'); return v && v.readyState >= 1 && v.duration > 1; }, null, { timeout: 15000 }); ok(true, 'el visor reproduce el vídeo (duración leída)');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400); ok((await p.getAttribute('.lbvid', 'src')) === null, 'al cerrar se detiene el vídeo');
  await p.locator('.tile.ph:not(.isvid)').first().click(); await p.waitForSelector('.lb.open'); ok(await p.isHidden('.lbvid') && await p.isVisible('.lb img'), 'las fotos siguen abriéndose como foto');
  await p.keyboard.press('Escape');
  // El invitado ve el vídeo en la galería pública
  await p.click('#openShare'); await p.waitForTimeout(400); const gl = (await p.textContent('#guestLink')).trim(); await p.keyboard.press('Escape');
  const g = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); g.on('pageerror', (e) => errs.push(e.message)); await g.goto(gl.replace(/^https?:\/\/[^/]+/, B));
  await g.waitForSelector('.tile.isvid .vbadge'); ok((await g.locator('.tile.isvid').count()) === 2, 'galería pública con vídeos marcados');
  ok((await g.locator('.ktog button').allTextContents()).join('|') === 'Todo|Fotos|Vídeos', 'barra Todo/Fotos/Vídeos siempre visible');
  await g.click('.ktog [data-kind=fotos]'); await g.waitForSelector('.tile'); ok((await g.locator('.tile').count()) === 1 && (await g.locator('.tile.isvid').count()) === 0, 'filtro Fotos: solo la foto');
  await g.click('.ktog [data-kind=videos]'); await g.waitForSelector('.tile.isvid'); ok((await g.locator('.tile').count()) === 2 && (await g.locator('.ktog button.on').textContent()) === 'Vídeos' && /2 vídeos/.test(await g.textContent('.gsub')), 'filtro Vídeos: solo vídeos');
  await g.click('.ktog [data-kind=""]'); await g.waitForSelector('.tile'); ok((await g.locator('.tile').count()) === 3, 'Todo vuelve a mostrar todo');
  await g.locator('.gbar').screenshot({ path: '/tmp/picfy_shots/bar.png' });
  const gv = await g.locator('.tile.isvid').first().getAttribute('data-video'); ok(/\/e\/[0-9a-f]{32}\/v\//.test(gv), 'enlace de vídeo público ' + gv);
  const gs = await g.evaluate(async (u) => (await fetch(u, { headers: { range: 'bytes=0-9' } })).status, gv); ok(gs === 206, 'el invitado reproduce con rangos');
  const bad = await g.evaluate(async (u) => (await fetch(u.replace(/\/v\/[0-9a-f]{32}/, '/v/' + '0'.repeat(32)))).status, gv); ok(bad === 404, 'vídeo inexistente 404');
  await g.locator('.tile.isvid').first().click(); await g.waitForSelector('.lb.open .lbvid:not([hidden])'); ok(true, 'el invitado abre el vídeo en el visor');
  await g.screenshot({ path: '/tmp/picfy_shots/video_guest.png' });
  ok(errs.length === 0, 'sin errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
