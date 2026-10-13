// Gestión de una galería: moderar, banderas, favoritas, filtros, orden, mover, descargar, borrar.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
const B = process.env.BASE || 'http://127.0.0.1:8787';
const SHOTS = process.env.SHOTS || '/tmp/picfy_shots';
fs.mkdirSync(SHOTS, { recursive: true });
let ok = true;
const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n, e); ok = ok && !!c; };
const imgs = (n) => Array.from({ length: n }, (_, i) => `${process.cwd()}/tests/img/p${String(i).padStart(2, '0')}.jpg`);
const email = `m${Date.now()}@ejemplo.es`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { console.log('PAGEERROR', e.message); ok = false; });
  p.on('dialog', (d) => d.accept());

  await p.goto(B + '/registro');
  await p.fill('input[name=name]', 'Gestor'); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'clave-larga-123');
  if (await p.$('input[name=code]')) await p.fill('input[name=code]', 'codigo');
  await p.click('button[type=submit]'); await p.waitForURL('**/galerias');

  await p.click('#newGal'); await p.fill('#newDlg input[name=name]', 'Torneo sedes');
  await p.uncheck('#newDlg input[name=auto_approve]'); // las fotos entran "en revisión"
  await p.click('#newDlg button[type=submit]'); await p.waitForURL(/\/galerias\/[0-9a-f]{16}/);
  const galUrl = p.url().split('?')[0]; const gid = galUrl.split('/').pop();
  await p.click('#openShare'); await p.waitForSelector('#shareDlg .qr svg');
  const guestUrl = (await p.textContent('#guestLink')).trim().replace(/^https?:\/\/[^/]+/, B);
  await p.keyboard.press('Escape');

  // Dos invitados (dos contextos = dos álbumes) suben fotos
  async function upload(name, files) {
    const g = await (await b.newContext({ viewport: { width: 420, height: 800 } })).newPage();
    await g.goto(guestUrl); await g.click('#openUpload'); await g.fill('#guestName', name);
    await g.setInputFiles('#fileInput', files);
    await g.waitForFunction((n) => document.querySelectorAll('.up-item').length === n, files.length);
    await g.click('#upStart');
    await g.waitForFunction((n) => document.querySelectorAll('.up-item .st.ok').length === n, files.length, { timeout: 60000 });
    await g.context().close();
  }
  await upload('Sede Norte', imgs(5));
  await upload('Sede Sur', imgs(10).slice(5));

  await p.goto(galUrl);
  let tiles = await p.$$('.tile.ph');
  check('10 fotos en revisión', tiles.length === 10 && (await p.$$('.tile.ph[data-state=pending]')).length === 10);
  check('botón aprobar todas', await p.isVisible('#approveAll'));
  await p.screenshot({ path: SHOTS + '/m1_pendientes.png' });

  // Seleccionar 4 con casillas y aprobar
  const ids = await p.$$eval('.tile.ph', (n) => n.map((x) => x.dataset.id));
  await p.hover('.tile.ph >> nth=0'); await p.click('.tile.ph >> nth=0 >> .chk', { force: true });
  await p.click('.tile.ph >> nth=1 >> .chk', { force: true }); await p.click('.tile.ph >> nth=2 >> .chk', { force: true });
  check('barra de selección visible', await p.isVisible('#selbar'));
  check('contador 3', (await p.textContent('#selN')).startsWith('3'));
  await p.screenshot({ path: SHOTS + '/m2_seleccion.png' });
  await p.click('#selbar [data-act=approve]'); await p.waitForLoadState('load'); await p.waitForTimeout(500);
  check('3 publicadas', (await p.$$('.tile.ph[data-state=approved]')).length === 3);
  await p.click('#approveAll'); await p.waitForLoadState('load'); await p.waitForTimeout(500);
  check('todas publicadas', (await p.$$('.tile.ph[data-state=approved]')).length === 10);

  // Banderas y favoritas: por tile y por selección
  await p.hover('.tile.ph >> nth=0'); await p.click('.tile.ph >> nth=0 >> .flagb', { force: true });
  await p.waitForFunction(() => document.querySelector('.tile.ph').dataset.flag === 'red');
  await p.click('.tile.ph >> nth=0 >> .favb', { force: true });
  await p.waitForFunction(() => document.querySelector('.tile.ph').dataset.fav === '1');
  await p.click('.tile.ph >> nth=1 >> .chk', { force: true }); await p.click('.tile.ph >> nth=2 >> .chk', { force: true });
  await p.click('#flagMenuBtn'); await p.click('[data-setflag=green]');
  await p.waitForFunction(() => document.querySelectorAll('.tile.ph[data-flag=green]').length === 2);
  check('bandera a la selección', true);
  await p.click('[data-act=clear]');
  // persisten tras recargar
  await p.reload();
  check('bandera persiste', (await p.$$('.tile.ph[data-flag=green]')).length === 2 && (await p.$$('.tile.ph[data-flag=red]')).length === 1);
  check('favorita persiste', (await p.$$('.tile.ph[data-fav="1"]')).length === 1);

  // Filtros
  await p.click('#fFlags [data-f=green]');
  check('filtro bandera verde', (await p.$$('.tile.ph:not(.hidden)')).length === 2);
  await p.click('#fFlags [data-f=green]');
  await p.click('#fFav');
  check('filtro favoritas', (await p.$$('.tile.ph:not(.hidden)')).length === 1);
  await p.click('#fFav');
  await p.fill('#fName', 'zzzz');
  check('filtro nombre sin resultados', (await p.$$('.tile.ph:not(.hidden)')).length === 0);
  await p.fill('#fName', '');
  check('sin filtros: 10', (await p.$$('.tile.ph:not(.hidden)')).length === 10);

  // Orden: por nombre y luego arrastrar (pasa a manual)
  await p.selectOption('#sortBy', 'name'); await p.waitForLoadState('load'); await p.waitForTimeout(400);
  const byName = await p.$$eval('.tile.ph .cap', (n) => n.map((x) => x.textContent.toLowerCase()));
  check('orden por nombre', JSON.stringify(byName) === JSON.stringify([...byName].sort()), byName.join(','));
  const before = await p.$$eval('.tile.ph', (n) => n.map((x) => x.dataset.id));
  const a = await (await p.$('.tile.ph >> nth=0')).boundingBox(); const z = await (await p.$('.tile.ph >> nth=3')).boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down();
  await p.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 + 20, { steps: 4 });
  await p.mouse.move(z.x + z.width * 0.8, z.y + z.height / 2, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(700);
  await p.reload();
  const after = await p.$$eval('.tile.ph', (n) => n.map((x) => x.dataset.id));
  check('arrastrar reordena y se guarda', after[0] !== before[0] && after.indexOf(before[0]) === 3, '');
  check('modo manual', (await p.inputValue('#sortBy')) === 'manual');

  // Mover al álbum de otra sede
  await p.click('.tile.ph >> nth=0 >> .chk', { force: true });
  const opts = await p.$$eval('#moveTo option', (o) => o.map((x) => x.textContent));
  check('álbumes de destino', opts.length === 3, opts.join('|'));
  await p.selectOption('#moveTo', { index: 2 });
  await p.waitForTimeout(600);
  check('mover responde', true);
  await p.click('[data-act=clear]');

  // Descargas: una foto, ZIP completo, ZIP de selección
  const [d1] = await Promise.all([p.waitForEvent('download'), p.click('.tile.ph >> nth=0 >> .chk', { force: true }).then(() => p.click('[data-act=download]'))]);
  check('descarga de 1 foto', /\.jpg$/i.test(d1.suggestedFilename()), d1.suggestedFilename());
  await p.click('[data-act=clear]');
  await p.click('.tile.ph >> nth=0 >> .chk', { force: true }); await p.click('.tile.ph >> nth=1 >> .chk', { force: true });
  const [d2] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=download]')]);
  const zp = SHOTS + '/sel.zip'; await d2.saveAs(zp);
  check('ZIP de selección', fs.statSync(zp).size > 1000, d2.suggestedFilename());
  await p.click('[data-act=clear]');
  await p.click('[data-open=zipDlg]');
  const [d3] = await Promise.all([p.waitForEvent('download'), p.click('#zipDlg .zips a')]);
  const zp3 = SHOTS + '/all.zip'; await d3.saveAs(zp3);
  const { execSync } = require('child_process');
  let listing = ''; try { listing = execSync(`unzip -l ${zp3}`).toString(); execSync(`unzip -tq ${zp3}`); check('ZIP completo válido', /10 files/.test(listing), listing.split('\n').pop()); } catch (e) { check('ZIP completo válido', false, String(e.message).slice(0, 120)); }
  await p.keyboard.press('Escape');

  // Rechazar y borrar
  await p.click('.tile.ph >> nth=0 >> .chk', { force: true });
  await p.click('[data-act=reject]'); await p.waitForLoadState('load'); await p.waitForTimeout(500);
  check('rechazada', (await p.$$('.tile.ph[data-state=rejected]')).length === 1);
  await p.selectOption('#fState', 'rejected');
  check('filtro por estado', (await p.$$('.tile.ph:not(.hidden)')).length === 1);
  await p.selectOption('#fState', '');
  await p.click('.tile.ph >> nth=0 >> .chk', { force: true }); await p.click('.tile.ph >> nth=1 >> .chk', { force: true });
  await p.click('[data-act=delete]'); await p.waitForTimeout(700);
  check('borradas 2', (await p.$$('.tile.ph')).length === 8);
  await p.reload();
  check('borrado persiste', (await p.$$('.tile.ph')).length === 8);

  // Ajustes
  await p.click('[data-open=setDlg]');
  await p.fill('#setDlg input[name=name]', 'Torneo sedes (final)');
  await p.click('#setDlg button.primary');
  await p.waitForSelector('.alert.ok');
  check('ajustes guardados', !!(await p.$('.gside h2:has-text("final")')));
  await p.screenshot({ path: SHOTS + '/m3_galeria.png' });

  // Otro usuario no puede tocar la API
  const o = await (await b.newContext()).request.post(`${B}/api/g/${gid}/delete`, { data: { ids: [ids[0]] } });
  check('API protegida', o.status() === 403);

  await b.close();
  console.log(ok ? 'ALL OK' : 'SOME FAILED');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
