// Vídeos antiguos sin CRC: el panel los calcula por pasos y el ZIP sale sin descriptores
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const { execSync } = require('child_process');
const B = 'http://127.0.0.1:8787'; const ok = (c, m) => { if (!c) { console.log('FALLO:', m); process.exit(1); } console.log('PASS', m); };
const q = (s) => JSON.parse(execSync(`npx wrangler d1 execute picfy --local --persist-to .wrangler/state --json --command "${s}"`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString())[0].results;
(async () => {
  const ev = q("SELECT e.id FROM events e WHERE EXISTS (SELECT 1 FROM photos WHERE event_id=e.id AND mime LIKE 'video/%') ORDER BY rowid DESC LIMIT 1")[0].id;
  q(`UPDATE photos SET crc32 = NULL WHERE event_id='${ev}' AND mime LIKE 'video/%'`);
  const owner = q(`SELECT u.email FROM users u JOIN events e ON e.owner_id=u.id WHERE e.id='${ev}'`)[0].email;
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await (await b.newContext()).newPage();
  await p.goto(B + '/entrar'); await p.fill('input[name=email]', owner); await p.fill('input[name=password]', 'clave12345'); await p.click('button[type=submit]'); await p.waitForTimeout(1500);
  await p.goto(B + '/galerias/' + ev);
  await p.click('[data-open=zipDlg]');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#zipDlg a[data-zipa] >> nth=0')]);
  await dl.saveAs('/tmp/vid/crcfill.zip');
  ok(q(`SELECT COUNT(*) n FROM photos WHERE event_id='${ev}' AND crc32 IS NULL`)[0].n === 0, 'CRC calculado antes de descargar');
  const r = require('child_process').spawnSync('unzip', ['-tq', '/tmp/vid/crcfill.zip']).stdout.toString();
  ok(/No errors/.test(r), 'unzip -t sin errores: ' + r.trim());
  await b.close(); console.log('ALL OK');
})();
