// Personalización de una galería: vista previa en vivo, recorte de imágenes en el navegador y subida.
(function () {
  // Reduce una foto: la cabecera a 1800 px de ancho y el perfil a un cuadrado de 480 px.
  async function prepare(file, kind) {
    const bmp = await createImageBitmap(file).catch(() => null);
    if (!bmp) throw new Error('decode');
    let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height, w, h;
    if (kind === 'avatar') { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; w = h = Math.min(480, s); }
    else { w = Math.min(1800, sw); h = Math.round(sh * (w / sw)); }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
    if (bmp.close) bmp.close();
    return new Promise((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.86));
  }

  document.querySelectorAll('[data-brand]').forEach((box) => {
    const form = box.closest('form');
    const color = box.querySelector('input[type=color]');
    const prev = box.querySelector('.bprev');
    const blobs = {};
    const paint = () => {
      prev.style.setProperty('--accent', color.value);
      const n = parseInt(color.value.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      prev.style.setProperty('--ink', (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#2a1d08' : '#fff');
    };
    color.addEventListener('input', paint); paint();
    box.querySelectorAll('.sw').forEach((s) => s.addEventListener('click', () => { color.value = s.dataset.c; paint(); }));

    box.querySelectorAll('[data-brand-file]').forEach((inp) => inp.addEventListener('change', async () => {
      const kind = inp.dataset.brandFile, f = inp.files[0];
      if (!f) { delete blobs[kind]; return; }
      try {
        const blob = await prepare(f, kind); blobs[kind] = blob;
        const url = URL.createObjectURL(blob);
        prev.querySelector(kind === 'avatar' ? '.bp-avatar' : '.bp-cover').style.backgroundImage = `url('${url}')`;
        const rm = box.querySelector(`[data-brand-remove=${kind}]`); if (rm) rm.checked = false;
      } catch { msg('No se pudo leer esa imagen. Prueba con otra (JPG o PNG).'); inp.value = ''; }
    }));
    box.querySelectorAll('[data-brand-remove]').forEach((c) => c.addEventListener('change', () => {
      if (!c.checked) return;
      const kind = c.dataset.brandRemove; delete blobs[kind];
      prev.querySelector(kind === 'avatar' ? '.bp-avatar' : '.bp-cover').style.backgroundImage = '';
      const inp = box.querySelector(`[data-brand-file=${kind}]`); if (inp) inp.value = '';
    }));

    const msgEl = form.querySelector('[data-brand-msg]');
    function msg(t) { if (msgEl) { msgEl.textContent = t; msgEl.classList.toggle('hidden', !t); } }

    async function sendImages(api) {
      for (const kind of ['avatar', 'cover']) {
        const rm = box.querySelector(`[data-brand-remove=${kind}]`);
        if (rm && rm.checked) { const r = await fetch(`${api}/brand/${kind}`, { method: 'DELETE' }); if (!r.ok) throw new Error('brand'); }
        if (blobs[kind]) {
          const r = await fetch(`${api}/brand/${kind}`, { method: 'PUT', headers: { 'content-type': 'image/jpeg' }, body: blobs[kind] });
          if (!r.ok) throw new Error('brand');
        }
      }
    }

    form.addEventListener('submit', async (e) => {
      if (e.submitter && e.submitter.hasAttribute('data-nobrand')) return;
      const mode = form.dataset.brandForm;
      e.preventDefault(); msg('');
      const btn = e.submitter || form.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
      try {
        if (mode === 'create') {
          const fd = new FormData(form);
          const r = await fetch(form.action, { method: 'POST', body: fd, headers: { accept: 'application/json' } });
          if (!r.ok) throw new Error('create');
          const j = await r.json();
          await sendImages(`/api/g/${j.id}`).catch(() => {});
          location.href = j.url;
        } else {
          await sendImages(form.dataset.gapi);
          form.submit();
        }
      } catch { msg('No se pudo guardar. Inténtalo de nuevo.'); if (btn) btn.disabled = false; }
    });
  });
})();
