// Página de invitados: subida de fotos (miniaturas, hora de captura, reintentos) y acceso a "Mi álbum".
(function () {
  const TOKEN = document.body.dataset.token;
  const AUTO = document.body.dataset.auto === '1';
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };

  // Clave personal de este dispositivo para este evento (solo se guarda su hash en el servidor).
  function myKey() {
    let k = ls.get('picfy_key_' + TOKEN);
    if (!/^[0-9a-f]{32}$/.test(k || '')) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      k = [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
      ls.set('picfy_key_' + TOKEN, k);
    }
    return k;
  }
  const dlg = $('upDlg');
  if (!dlg) return;
  const fileInput = $('fileInput'), drop = $('drop'), list = $('upList'), tools = $('upTools');
  const startBtn = $('upStart'), msg = $('upMsg'), nameInput = $('guestName');
  const OWNER = document.body.dataset.owner === '1';
  nameInput.value = OWNER ? (document.body.dataset.ownerName || 'Organizador') : (ls.get('picfy_name') || '');

  const items = [];
  let uploading = false;

  /* ---------- utilidades ---------- */

  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf) {
    const u = new Uint8Array(buf);
    let c = 0xffffffff;
    for (let i = 0; i < u.length; i++) c = crcTable[(c ^ u[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // Hora de captura (EXIF DateTimeOriginal) de un JPEG. Devuelve milisegundos "tal cual en la cámara", o null.
  async function readTaken(file) {
    try {
      if (!/jpe?g/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) return null;
      const buf = await file.slice(0, 262144).arrayBuffer();
      const v = new DataView(buf);
      if (v.getUint16(0) !== 0xffd8) return null;
      let off = 2;
      while (off + 4 < v.byteLength) {
        const marker = v.getUint16(off); const len = v.getUint16(off + 2);
        if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) { // "Exif"
          const t = off + 10; // inicio TIFF
          const le = v.getUint16(t) === 0x4949;
          const u16 = (p) => v.getUint16(p, le), u32 = (p) => v.getUint32(p, le);
          const readStr = (p, n) => { let s = ''; for (let i = 0; i < n - 1; i++) s += String.fromCharCode(v.getUint8(p + i)); return s; };
          const findTag = (ifd, tag) => {
            const n = u16(ifd);
            for (let i = 0; i < n; i++) {
              const e = ifd + 2 + i * 12;
              if (u16(e) === tag) return { type: u16(e + 2), count: u32(e + 4), val: e + 8 };
            }
            return null;
          };
          const ifd0 = t + u32(t + 4);
          const exifPtr = findTag(ifd0, 0x8769);
          let e = null;
          if (exifPtr) {
            const exifIfd = t + u32(exifPtr.val);
            e = findTag(exifIfd, 0x9003) || findTag(exifIfd, 0x9004);
          }
          if (!e) e = findTag(ifd0, 0x0132);
          if (!e || e.count < 19) return null;
          const s = readStr(t + u32(e.val), e.count);
          const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(s);
          if (!m) return null;
          const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
          return ms > 0 ? ms : null;
        }
        if ((marker & 0xff00) !== 0xff00) break;
        off += 2 + len;
      }
    } catch { /* sin EXIF legible */ }
    return null;
  }

  async function decode(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch {
      return await new Promise((res, rej) => {
        const url = URL.createObjectURL(file); const im = new Image();
        im.onload = () => { URL.revokeObjectURL(url); res(im); };
        im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); };
        im.src = url;
      });
    }
  }

  async function thumb(bmp, maxSide, quality) {
    const w0 = bmp.width, h0 = bmp.height;
    const k = Math.min(1, maxSide / Math.max(w0, h0));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('thumb'))), 'image/jpeg', quality));
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  class HttpErr extends Error { constructor(s, body) { super('http' + s); this.status = s; this.body = body; } }

  async function api(path, opts) {
    const r = await fetch(path, opts);
    let data = null; try { data = await r.json(); } catch { /* sin json */ }
    if (!r.ok) throw new HttpErr(r.status, data);
    return data;
  }
  async function retry(fn, tries = 4) {
    let last;
    for (let i = 0; i < tries; i++) {
      try { return await fn(); } catch (e) {
        last = e;
        if (e instanceof HttpErr && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429) throw e;
        await sleep(600 * (i + 1) ** 2);
      }
    }
    throw last;
  }

  function put(url, blob, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('PUT', url);
      x.setRequestHeader('x-picfy-key', myKey());
      x.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new HttpErr(x.status)));
      x.onerror = () => reject(new Error('network'));
      x.ontimeout = () => reject(new Error('timeout'));
      x.send(blob);
    });
  }

  /* ---------- lista de selección ---------- */

  function setStatus(it, text, cls) {
    it.st.textContent = text; it.st.className = 'st' + (cls ? ' ' + cls : '');
  }
  function count() {
    const waiting = items.filter((i) => i.state === 'wait' || i.state === 'err').length;
    const picked = items.filter((i) => i.picked).length;
    $('upCount').textContent = items.length ? `${items.length} fotos${picked ? ` · ${picked} marcadas` : ''}` : '';
    tools.classList.toggle('hidden', !items.length);
    startBtn.disabled = uploading || !waiting;
  }

  function addFiles(files) {
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const el = document.createElement('div'); el.className = 'up-item';
      const img = document.createElement('img'); img.alt = '';
      img.src = URL.createObjectURL(f);
      const chk = document.createElement('input'); chk.type = 'checkbox'; chk.className = 'chk'; chk.setAttribute('aria-label', 'Marcar');
      const st = document.createElement('div'); st.className = 'st'; st.textContent = 'Lista';
      const bar = document.createElement('div'); bar.className = 'bar';
      el.append(img, chk, st, bar); list.append(el);
      const it = { file: f, el, st, bar, chk, picked: false, state: 'wait' };
      chk.addEventListener('change', () => { it.picked = chk.checked; el.classList.toggle('picked', it.picked); count(); });
      items.push(it);
    }
    count();
  }

  $('upAll').addEventListener('click', () => {
    const all = items.some((i) => !i.picked);
    items.forEach((i) => { if (i.state === 'ok') return; i.picked = all; i.chk.checked = all; i.el.classList.toggle('picked', all); });
    count();
  });
  $('upRemove').addEventListener('click', () => {
    for (let n = items.length - 1; n >= 0; n--) {
      const it = items[n];
      if (it.picked && it.state !== 'busy') { it.el.remove(); items.splice(n, 1); }
    }
    count();
  });

  drop.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  $('openUpload').addEventListener('click', () => { msg.classList.add('hidden'); dlg.showModal(); });
  $('upClose').addEventListener('click', () => {
    dlg.close();
    if (items.some((i) => i.state === 'ok')) location.reload();
  });

  /* ---------- subida ---------- */

  function showMsg(text, cls) { msg.textContent = text; msg.className = 'notice ' + (cls || ''); }
  const errText = (e) => {
    if (e instanceof HttpErr) {
      const code = e.body && e.body.error;
      if (code === 'limit') return 'Has llegado al máximo de fotos permitido en este evento.';
      if (code === 'closed') return 'La subida de fotos está cerrada.';
      if (code === 'type') return 'Formato no admitido (usa JPG, PNG, WebP o HEIC).';
      if (code === 'size') return 'La foto es demasiado grande.';
      return 'Error ' + e.message;
    }
    return e && e.message === 'decode' ? 'No se pudo leer esta foto (prueba con JPG)' : 'Sin conexión estable';
  };

  async function uploadOne(it) {
    it.state = 'busy'; setStatus(it, 'Preparando…');
    const f = it.file;
    const [taken, buf] = await Promise.all([readTaken(f), f.arrayBuffer()]);
    const bmp = await decode(f);
    const w = bmp.width, h = bmp.height;
    const [m, l] = [await thumb(bmp, 480, 0.8), await thumb(bmp, 1600, 0.85)];
    if (bmp.close) bmp.close();
    const crc = crc32(buf);
    const base = `/api/e/${TOKEN}`;
    setStatus(it, 'Subiendo…');
    const init = await retry(() => api(`${base}/upload/init`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: myKey(), name: nameInput.value.trim(), filename: f.name, type: f.type || 'image/jpeg', size: f.size, taken, w, h, crc }),
    }));
    const id = init.id;
    await retry(() => put(`${base}/upload/${id}/m`, m));
    await retry(() => put(`${base}/upload/${id}/l`, l));
    await retry(() => put(`${base}/upload/${id}/o`, f, (p) => { it.bar.style.width = Math.round(p * 100) + '%'; }));
    const done = await retry(() => api(`${base}/upload/${id}/commit`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: myKey() }),
    }), 5);
    it.state = 'ok'; it.bar.style.width = '100%';
    setStatus(it, done.state === 'pending' ? 'En revisión' : 'Subida', 'ok');
    it.chk.remove();
  }

  startBtn.addEventListener('click', async () => {
    if (!OWNER) ls.set('picfy_name', nameInput.value.trim());
    uploading = true; startBtn.disabled = true; msg.classList.add('hidden');
    const queue = items.filter((i) => i.state === 'wait' || i.state === 'err');
    let fatal = null;
    async function worker() {
      while (queue.length && !fatal) {
        const it = queue.shift();
        try { await uploadOne(it); }
        catch (e) {
          it.state = 'err'; setStatus(it, errText(e), 'err');
          if (e instanceof HttpErr && e.body && ['limit', 'closed'].includes(e.body.error)) fatal = e;
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    uploading = false;
    const ok = items.filter((i) => i.state === 'ok').length;
    const bad = items.filter((i) => i.state === 'err').length;
    if (ok) { }
    if (fatal) showMsg(errText(fatal), 'err');
    else if (bad) showMsg(`${ok} subidas, ${bad} con error. Pulsa «Subir» para reintentar las que fallaron.`, 'err');
    else if (ok) showMsg(AUTO ? `¡Listo! ${ok} fotos subidas y publicadas.` : `¡Listo! ${ok} fotos subidas. Aparecerán en la galería cuando el organizador las apruebe.`, 'ok');
    count();
  });
})();

(() => {
  const grid = document.getElementById('gallery');
  const btns = document.querySelectorAll('.vtog button');
  const slider = document.getElementById('gsize');
  if (!grid || !btns.length) return;
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  let view = ls.get('picfy_view') === 'list' ? 'list' : 'grid';
  let touched = ls.get('picfy_size') !== null;
  const dflt = () => (view === 'list' ? 22 : 40);
  let size = touched ? Number(ls.get('picfy_size')) : dflt();
  const ratio = (img) => { const w = img.getAttribute('width') || img.naturalWidth, h = img.getAttribute('height') || img.naturalHeight; return w && h ? w / h : 1.5; };
  function ratios() {
    grid.querySelectorAll('.gitem').forEach((it) => {
      const img = it.querySelector('img');
      const set = () => it.style.setProperty('--ar', ratio(img).toFixed(4));
      set(); if (!img.complete) img.addEventListener('load', set, { once: true });
    });
  }
  function apply() {
    grid.classList.toggle('list', view === 'list');
    btns.forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    if (view === 'list') {
      ratios();
      grid.querySelectorAll('.tile img').forEach((i) => { const f = i.closest('.tile').dataset.full; if (f && i.getAttribute('src') !== f && size > 55) i.src = f; });
      grid.style.setProperty('--rh', Math.round(90 + size * 2.6) + 'px');
      grid.style.removeProperty('--cw');
    } else {
      grid.style.removeProperty('--rh');
      if (touched) grid.style.setProperty('--cw', Math.round(110 + size * 4.5) + 'px'); else grid.style.removeProperty('--cw');
    }
    if (slider) slider.value = size;
  }
  btns.forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; ls.set('picfy_view', view); if (!touched) size = dflt(); apply(); }));
  if (slider) slider.addEventListener('input', () => { size = Number(slider.value); touched = true; ls.set('picfy_size', size); apply(); });
  apply();
})();
