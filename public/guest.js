// Página de invitados: subida de fotos (miniaturas, hora de captura, reintentos) y acceso a "Mi álbum".
(function () {
  const TOKEN = document.body.dataset.token;
  let UP = TOKEN; // galería de destino de la subida
  const AUTO = document.body.dataset.auto === '1';
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };

  // Clave personal de este dispositivo para este evento (solo se guarda su hash en el servidor).
  function myKey() {
    let k = ls.get('picfy_key_' + UP);
    if (!/^[0-9a-f]{32}$/.test(k || '')) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      k = [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
      ls.set('picfy_key_' + UP, k);
    }
    return k;
  }
  const target = $('upTarget');
  if (target) target.addEventListener('change', () => { UP = target.value; });
  const dlg = $('upDlg');
  if (!dlg) return;
  const fileInput = $('fileInput'), drop = $('drop'), list = $('upList'), tools = $('upTools');
  const startBtn = $('upStart'), msg = $('upMsg'), nameInput = $('guestName'), consentBox = $('upConsent');
  const OWNER = document.body.dataset.owner === '1';
  nameInput.value = OWNER ? (document.body.dataset.ownerName || 'Organizador') : (ls.get('picfy_name') || '');

  const items = [];
  let uploading = false;
  let wmLogo = null;
  try {
    const t = sessionStorage.getItem('picfy_upok');
    if (t) {
      sessionStorage.removeItem('picfy_upok');
      const el = document.createElement('div'); el.className = 'toast'; el.textContent = t; document.body.append(el);
      setTimeout(() => el.remove(), 5000);
    }
  } catch { /* sin almacenamiento */ }

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
    startBtn.disabled = uploading || !waiting || Boolean(consentBox && !consentBox.checked);
  }

  if (consentBox) consentBox.addEventListener('change', () => count());

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
      if (code === 'consent') return 'Marca la casilla de consentimiento para subir.';
      if (code === 'access') return 'Esta galería ya no admite fotos.';
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
    const WM = window.PicfyWm ? PicfyWm.pageCfg() : null;
    let logo = null;
    if (WM && WM.logoUrl) { wmLogo = wmLogo || PicfyWm.loadImg(WM.logoUrl); logo = await wmLogo; }
    // con marca de agua activa, la miniatura y la foto grande se suben ya con la marca pintada
    const [m, l] = WM
      ? [await PicfyWm.render(bmp, 480, 0.8, WM, logo), await PicfyWm.render(bmp, 1600, 0.85, WM, logo)]
      : [await thumb(bmp, 480, 0.8), await thumb(bmp, 1600, 0.85)];
    if (bmp.close) bmp.close();
    const crc = crc32(buf);
    const base = `/api/e/${UP}`;
    setStatus(it, 'Subiendo…');
    const init = await retry(() => api(`${base}/upload/init`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: myKey(), name: nameInput.value.trim(), filename: f.name, type: f.type || 'image/jpeg', size: f.size, taken, w, h, crc, consent: Boolean(consentBox && consentBox.checked) }),
    }));
    const id = init.id;
    await retry(() => put(`${base}/upload/${id}/m`, m));
    await retry(() => put(`${base}/upload/${id}/l`, l));
    await retry(() => put(`${base}/upload/${id}/o`, f, (p) => { it.bar.style.width = Math.round(p * 100) + '%'; }));
    const done = await retry(() => api(`${base}/upload/${id}/commit`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: myKey(), wm: WM ? WM.rev : 0 }),
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
          if (e instanceof HttpErr && e.body && ['limit', 'closed', 'consent', 'access'].includes(e.body.error)) fatal = e;
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    uploading = false;
    const ok = items.filter((i) => i.state === 'ok').length;
    const bad = items.filter((i) => i.state === 'err').length;
    if (!fatal && !bad && ok) {
      // Todo subido: cerramos la ventana y recargamos para ver las fotos.
      try { sessionStorage.setItem('picfy_upok', AUTO ? `¡Listo! ${ok} fotos subidas y publicadas.` : `¡Listo! ${ok} fotos subidas. Aparecerán cuando el organizador las apruebe.`); } catch { /* sin almacenamiento */ }
      dlg.close(); location.reload(); return;
    }
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
  let size = touched ? Number(ls.get('picfy_size')) : 40;
  grid.querySelectorAll('.gitem img').forEach((img) => {
    const fig = img.closest('.gitem'); if (fig.style.getPropertyValue('--ar')) return;
    const set = () => fig.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight || 1).toFixed(4));
    if (img.complete) set(); else img.addEventListener('load', set, { once: true });
  });
  function apply() {
    grid.classList.toggle('list', view === 'list');
    btns.forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    grid.style.removeProperty('--cw'); grid.style.removeProperty('--lw');
    if (view === 'list') {
      grid.style.setProperty('--lw', Math.round(110 + size * 2.4) + 'px');
      if (size > 50) grid.querySelectorAll('.tile img').forEach((i) => { const f = i.closest('.tile').dataset.full; if (f && i.getAttribute('src') !== f) i.src = f; });
    } else if (touched) grid.style.setProperty('--cw', Math.round(110 + size * 4.5) + 'px');
    if (slider) slider.value = size;
  }
  btns.forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; ls.set('picfy_view', view); apply(); }));
  if (slider) slider.addEventListener('input', () => { size = Number(slider.value); touched = true; ls.set('picfy_size', size); apply(); });
  apply();
})();

// Compartir el enlace de una sede: ventana con enlace y QR
(() => {
  const dlg = document.getElementById('subShare'); if (!dlg) return;
  const urlEl = document.getElementById('subShareUrl'), qr = document.getElementById('subQr'), nameEl = document.getElementById('subShareName');
  const copy = document.getElementById('subCopy'), nat = document.getElementById('subNative');
  let cur = '';
  if (navigator.share) nat.hidden = false;
  document.querySelectorAll('[data-sharelink]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    cur = location.origin + b.dataset.sharelink;
    nameEl.textContent = b.dataset.sharename || 'Compartir'; urlEl.textContent = cur; copy.textContent = 'Copiar enlace';
    try { const q = qrcode(0, 'M'); q.addData(cur); q.make(); qr.innerHTML = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); const s = qr.querySelector('svg'); if (s) { s.setAttribute('width', '200'); s.setAttribute('height', '200'); } } catch (x) { qr.textContent = ''; }
    dlg.showModal();
  }));
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(cur); } catch (x) { const r = document.createRange(); r.selectNodeContents(urlEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); }
    copy.textContent = '¡Copiado!';
  });
  nat.addEventListener('click', () => { navigator.share({ url: cur, title: nameEl.textContent }).catch(() => {}); });
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();

// Sedes en carrusel
(() => {
  const sec = document.querySelector('.subs-g'); if (!sec) return;
  const track = sec.querySelector('.subs-track'), prev = sec.querySelector('.prev'), next = sec.querySelector('.next');
  const upd = () => {
    const more = track.scrollWidth > track.clientWidth + 4;
    prev.hidden = !more || track.scrollLeft < 4;
    next.hidden = !more || track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  const go = (d) => track.scrollBy({ left: d * Math.max(240, track.clientWidth * 0.8), behavior: 'smooth' });
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  setTimeout(upd, 400);
})();

// Descargas (solo si el organizador las permite): el botón «Descargar» abre el ZIP; la selección va en selection.js
(() => {
  const open = document.getElementById('dlOpen'); if (!open) return;
  const dlg = document.getElementById('dlDlg');
  open.addEventListener('click', () => dlg.showModal());
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
})();

// Orden de las fotos (lo resuelve el servidor para que también valga entre páginas)
(() => {
  const dd = document.getElementById('gorder'); if (!dd) return;
  const btn = document.getElementById('gorderBtn'), menu = dd.querySelector('.ddmenu');
  const close = () => { menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
  const open = () => { menu.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true'); const s = menu.querySelector('[aria-selected=true]'); if (s) s.focus(); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.contains('hidden') ? open() : close(); });
  document.addEventListener('click', (e) => { if (!dd.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  menu.addEventListener('keydown', (e) => {
    const items = [...menu.querySelectorAll('li')], i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.activeElement.click(); }
  });
  menu.querySelectorAll('li').forEach((li) => li.addEventListener('click', () => {
    const u = new URL(location.href); u.searchParams.delete('page');
    if (li.dataset.v) u.searchParams.set('orden', li.dataset.v); else u.searchParams.delete('orden');
    close(); location.href = u.toString();
  }));
})();
