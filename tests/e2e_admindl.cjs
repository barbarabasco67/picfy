// Administrador: botón "Abrir galería" al compartir y descarga de cada foto.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(B + '/registro'); await p.fill('input[name=name]', 'D'); await p.fill('input[name=email]', `dl${Date.now()}@t.es`); await p.fill('input[name=password]', 'clave12345'); await p.click('.au-submit'); await p.waitForURL('**/inicio');
  await p.goto(B + '/galerias'); await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'G'); await p.click('#newDlg button[type=submit]'); await p.waitForURL(/galerias\/\w{16}/);
  const id = p.url().split('/').pop().split('?')[0];
  const sql = (q) => execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --command "${q}"`, { encoding: 'utf8' });
  sql(`INSERT INTO guests (id, event_id, key_hash, name, created_at) VALUES ('gg${id}', '${id}', 'hh${id}', '', 1); INSERT INTO photos (id, event_id, guest_id, filename, mime, size, uploaded_at, state) VALUES ('${'b'.repeat(32)}', '${id}', 'gg${id}', 'g.jpg', 'image/jpeg', 1000, 1, 'approved')`);
  await p.reload();
  ok((await p.locator('.tile.ph .dlb').count()) === 1, 'cada foto tiene botón de descarga');
  await p.click('#openShare'); await p.waitForTimeout(500);
  const href = await p.getAttribute('#openGallery', 'href'); ok(href === (await p.textContent('#guestLink')).trim() && (await p.getAttribute('#openGallery', 'target')) === '_blank', 'Abrir galería apunta al enlace público: ' + href);
  await p.keyboard.press('Escape');
  ok((await p.locator('#lbMod [data-mod=dl]').count()) === 1, 'el visor del administrador tiene Descargar');
  const reqs = []; p.on('request', (r) => { if (/\/o\?dl=1/.test(r.url())) reqs.push(r.url()); });
  await p.locator('.tile.ph').first().hover(); await p.click('.tile.ph .dlb'); await p.waitForTimeout(700);
  ok(reqs.length === 1 && reqs[0].includes('b'.repeat(32)), 'pulsar descarga pide el original: ' + reqs.join());
  ok(errs.length === 0, 'sin errores JS: ' + errs.join(';')); console.log('ALL OK'); await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
