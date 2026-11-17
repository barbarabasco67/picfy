// Importación de fotos del plugin antiguo (ov_album/<álbum>/<foto>/{m,l,o}) a una galería nueva. Solo administrador.
import { randomHex, html, json } from './util.js';

const PRE = 'ov_album/';

function page() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Importar</title>
<style>body{font:16px system-ui;background:#f6f4f0;color:#14213d;max-width:640px;margin:32px auto;padding:0 16px}h1{font-size:22px}
.c{background:#fff;border:1px solid #e4dfd6;border-radius:12px;padding:14px;margin:10px 0;display:flex;gap:10px;align-items:center;justify-content:space-between}
button{background:#14213d;color:#fff;border:0;border-radius:10px;padding:10px 16px;font:inherit;cursor:pointer}button:disabled{opacity:.5}
input{font:inherit;padding:9px;border:1px solid #d9d3c7;border-radius:10px;width:100%;box-sizing:border-box}</style></head><body>
<h1>Importar del plugin antiguo</h1>
<select id="em" style="font:inherit;padding:9px;border:1px solid #d9d3c7;border-radius:10px;width:100%" aria-label="Cuenta"></select>
<p><button id="mv">Juntar galerías importadas en esta cuenta</button> <span id="ms"></span></p>
<div id="l"><p>Buscando…</p></div>
<script>
const $=s=>document.querySelector(s);const L=$('#l');
async function albums(){const a={};let cur='';let n=0;let root='';
 for(;;){const r=await (await fetch('/admin/import/albums?cursor='+encodeURIComponent(cur))).json();
  if(r.error){L.textContent='No has entrado como administrador. Entra en /admin y vuelve.';return}
  if(r.raiz&&r.raiz.length)root=r.raiz.join(' ');
  for(const k in r.albums){a[k]=(a[k]||0)+r.albums[k]}
  n+=r.keys;L.innerHTML='<p>Buscando… '+n+' archivos</p>';
  if(!r.cursor)break;cur=r.cursor}
 const ids=Object.keys(a);
 if(!ids.length){L.innerHTML='<p>No hay álbumes en ov_album/. Carpetas que veo en este bucket: '+(root||'ninguna')+'</p>';return}
 L.innerHTML=ids.map(k=>'<div class="c"><span>Álbum '+k+' · '+a[k]+' fotos</span><button data-a="'+k+'">Importar</button></div>').join('')+'<p id="st"></p>';
 L.querySelectorAll('button').forEach(b=>b.onclick=()=>run(b));}
async function run(b){document.querySelectorAll('button').forEach(x=>x.disabled=true);
 let ev='',cur='',done=0,fail=0,sc=0;const st=$('#st');
 for(;;){let r=null;
  for(let t=0;t<6&&!r;t++){try{const x=await fetch('/admin/import/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({album:b.dataset.a,email:$('#em').value,event:ev,cursor:cur})});r=await x.json()}catch(e){await new Promise(z=>setTimeout(z,1500))}}
  if(!r){st.textContent='Se cortó. Vuelve a pulsar Importar: continúa donde lo dejó.';document.querySelectorAll('button').forEach(x=>x.disabled=false);return}
  if(r.error){st.textContent='Error: '+r.error;return}
  ev=r.event;cur=r.cursor;done+=r.done;fail+=r.fail||0;st.textContent='Revisadas '+(sc+=r.again?0:(r.scanned||0))+' · importadas '+done+(fail?' · fallidas '+fail:'')+'…';
  if(!cur&&!r.again){st.innerHTML='Listo: '+done+' fotos. <a href="/galerias/'+ev+'">Abrir galería</a>';return}}}
fetch('/admin/import/users').then(r=>r.json()).then(u=>{$('#em').innerHTML=(u.users||[]).map(x=>'<option value="'+x.email+'">'+x.email+' · '+x.n+' galerías</option>').join('')});
$('#mv').onclick=async()=>{const r=await (await fetch('/admin/import/merge',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('#em').value})})).json();$('#ms').textContent=r.error||('Listo: '+r.moved+' fotos en '+r.galleries+' galería(s)')};
albums();
</script></body></html>`;
}

export function importRoutes(app, { isAdmin }) {
  app.get('/admin/import', async (c) => {
    if (!(await isAdmin(c))) return c.redirect('/admin', 303);
    return html(page());
  });

  // Cuenta fotos por álbum, por tandas de claves.
  app.get('/admin/import/albums', async (c) => {
    if (!(await isAdmin(c))) return json({ error: 'admin' }, 401);
    const l = await c.env.PHOTOS.list({ prefix: PRE, limit: 1000, cursor: c.req.query('cursor') || undefined });
    const albums = {};
    for (const o of l.objects) {
      const p = o.key.slice(PRE.length).split('/');
      if (p.length === 3 && (p[2] === 'm' || p[2] === 'l')) albums[p[0]] = (albums[p[0]] || 0) + (p[2] === 'm' ? 1 : 0);
    }
    let raiz = [];
    if (!c.req.query('cursor') && !l.objects.length) raiz = (await c.env.PHOTOS.list({ delimiter: '/', limit: 50 })).delimitedPrefixes;
    return json({ albums, keys: l.objects.length, raiz, cursor: l.truncated ? l.cursor : '' });
  });

  app.get('/admin/import/users', async (c) => {
    if (!(await isAdmin(c))) return json({ error: 'admin' }, 401);
    const r = await c.env.DB.prepare('SELECT u.email, (SELECT COUNT(*) FROM events e WHERE e.owner_id = u.id AND e.parent_id IS NULL) AS n FROM users u ORDER BY n DESC, u.created_at DESC LIMIT 200').all();
    return json({ users: r.results });
  });

  // Junta todas las galerías "Importado (álbum X)" de cualquier cuenta en una sola por álbum, dentro de la cuenta elegida.
  app.post('/admin/import/merge', async (c) => {
    if (!(await isAdmin(c))) return json({ error: 'admin' }, 401);
    const b = await c.req.json().catch(() => ({}));
    const db = c.env.DB;
    const u = await db.prepare('SELECT id FROM users WHERE email = ?').bind(String(b.email || '').trim().toLowerCase()).first();
    if (!u) return json({ error: 'No existe esa cuenta' }, 404);
    const evs = (await db.prepare("SELECT id, name FROM events WHERE name LIKE 'Importado (álbum %' AND parent_id IS NULL ORDER BY created_at").all()).results;
    const byName = {};
    for (const e of evs) (byName[e.name] = byName[e.name] || []).push(e.id);
    let moved = 0; let galleries = 0;
    for (const ids of Object.values(byName)) {
      const keep = ids[0]; galleries++;
      await db.prepare('UPDATE events SET owner_id = ? WHERE id = ?').bind(u.id, keep).run();
      const gid = `imp${keep}`.slice(0, 24);
      await db.prepare('INSERT OR IGNORE INTO guests (id, event_id, key_hash, name, created_at) VALUES (?, ?, ?, ?, ?)').bind(gid, keep, 'imp-merge', 'Importado', Date.now()).run();
      for (const other of ids.slice(1)) {
        const r = await db.prepare('UPDATE photos SET event_id = ?, guest_id = ? WHERE event_id = ? AND filename NOT IN (SELECT filename FROM photos WHERE event_id = ?)').bind(keep, gid, other, keep).run();
        moved += (r.meta && r.meta.changes) || 0;
        const rest = (await db.prepare('SELECT id FROM photos WHERE event_id = ?').bind(other).all()).results;
        for (const p of rest) { await c.env.PHOTOS.delete(['o', 'm', 'l'].map((s) => `p/${p.id}/${s}`)); await db.prepare('DELETE FROM photos WHERE id = ?').bind(p.id).run(); }
        await db.prepare('DELETE FROM guests WHERE event_id = ?').bind(other).run();
        await db.prepare('DELETE FROM events WHERE id = ?').bind(other).run();
      }
    }
    return json({ moved, galleries });
  });

  app.post('/admin/import/run', async (c) => {
    if (!(await isAdmin(c))) return json({ error: 'admin' }, 401);
    const b = await c.req.json().catch(() => ({}));
    const album = String(b.album || '');
    if (!/^[\w-]{1,40}$/.test(album)) return json({ error: 'álbum' }, 400);
    const db = c.env.DB;
    let evId = String(b.event || '');
    const u = await db.prepare('SELECT id FROM users WHERE email = ?').bind(String(b.email || '').trim().toLowerCase()).first();
    if (!/^[0-9a-f]{16}$/.test(evId)) {
      if (!u) return json({ error: 'No existe esa cuenta en Picfy' }, 404);
      const nm = `Importado (álbum ${album})`;
      const old = await db.prepare('SELECT id FROM events WHERE owner_id = ? AND name = ? AND deleted_at IS NULL ORDER BY created_at LIMIT 1').bind(u.id, nm).first().catch(() => null);
      if (old) evId = old.id;
    }
    if (!/^[0-9a-f]{16}$/.test(evId)) {
      evId = randomHex(8);
      await db.prepare(
        `INSERT INTO events (id, name, lead, event_date, guest_token, manage_hash, auto_approve, photo_limit, created_at, owner_id)
         VALUES (?, ?, '', NULL, ?, ?, 1, 0, ?, ?)`,
      ).bind(evId, `Importado (álbum ${album})`, randomHex(16), randomHex(32), Date.now(), u.id).run();
    }
    const ev = await db.prepare('SELECT id FROM events WHERE id = ?').bind(evId).first();
    if (!ev) return json({ error: 'galería' }, 404);
    const gid = `imp${evId}`.slice(0, 24);
    await db.prepare('INSERT OR IGNORE INTO guests (id, event_id, key_hash, name, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(gid, evId, `imp-${album}`, 'Importado', Date.now()).run();
    const folders = await c.env.PHOTOS.list({ prefix: `${PRE}${album}/`, delimiter: '/', limit: 40, cursor: b.cursor || undefined });
    let done = 0; let fail = 0; let capped = false;
    const names = folders.delimitedPrefixes.map((pre) => `plugin-${pre.slice(PRE.length + album.length + 1).replace(/\/$/, '')}`.slice(0, 120));
    const have = new Set();
    for (let i = 0; i < names.length; i += 40) {
      const q = names.slice(i, i + 40);
      (await db.prepare(`SELECT filename FROM photos WHERE event_id = ? AND filename IN (${q.map(() => '?').join(',')})`).bind(evId, ...q).all()).results.forEach((r) => have.add(r.filename));
    }
    for (const pre of folders.delimitedPrefixes) {
      if (done >= 4) { capped = true; break; }
      const src = pre.slice(PRE.length + album.length + 1).replace(/\/$/, '');
      const fname = `plugin-${src}`.slice(0, 120);
      if (have.has(fname)) continue;
      try {
      const objs = {};
      for (const s of ['o', 'l', 'm']) { const h = await c.env.PHOTOS.head(`${pre}${s}`); if (h) objs[s] = h; }
      const best = objs.o || objs.l || objs.m;
      if (!best) continue;
      const id = randomHex(16);
      for (const s of ['o', 'l', 'm']) {
        const from = objs[s] || (s === 'o' ? best : objs.l || objs.o || objs.m);
        const body = await c.env.PHOTOS.get(from.key);
        if (!body) continue;
        await c.env.PHOTOS.put(`p/${id}/${s}`, body.body, { httpMetadata: { contentType: from.httpMetadata?.contentType || 'image/jpeg' } });
      }
      await db.prepare(
        `INSERT INTO photos (id, event_id, guest_id, filename, mime, size, crc32, w, h, taken_at, uploaded_at, state)
         VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, ?, 'approved')`,
      ).bind(id, evId, gid, fname, best.httpMetadata?.contentType || 'image/jpeg', best.size, new Date(best.uploaded).getTime() || Date.now()).run();
      done++;
      } catch (e) { fail++; }
    }
    return json({ event: evId, done, fail, scanned: folders.delimitedPrefixes.length, cursor: capped ? (b.cursor || '') : folders.truncated ? folders.cursor : '', again: capped });
  });
}
