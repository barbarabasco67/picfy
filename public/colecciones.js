// Colecciones: abrir diálogos y copiar el enlace.
(function () {
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => { const d = $(b.dataset.open); if (d) { d.showModal(); const i = d.querySelector('input[type=text]'); if (i) i.focus(); } }));
  const cp = $('copyCol');
  if (cp) cp.addEventListener('click', async () => {
    const t = $('colLink').textContent.trim();
    try { await navigator.clipboard.writeText(t); }
    catch { const r = document.createRange(); r.selectNodeContents($('colLink')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); }
    const old = cp.textContent; cp.textContent = '¡Copiado!'; setTimeout(() => { cp.textContent = old; }, 1600);
  });
  // Portada de la colección
  const cf = $('colCoverFile'), cd = $('colCoverDel'), ci = $('colCoverImg');
  async function shrink(file) {
    const bmp = await createImageBitmap(file); const w = Math.min(1600, bmp.width), h = Math.round(bmp.height * w / bmp.width);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
    return new Promise((r, j2) => cv.toBlob((b) => (b ? r(b) : j2(new Error('enc'))), 'image/jpeg', 0.85));
  }
  const say = (t) => { const m = document.createElement('div'); m.className = 'toast'; m.textContent = t; document.body.append(m); setTimeout(() => m.remove(), 2200); };
  if (cf) cf.addEventListener('change', async () => {
    const f = cf.files[0]; if (!f) return;
    try {
      const r = await fetch(`/api/col/${cf.dataset.col}/cover`, { method: 'PUT', headers: { 'content-type': 'image/jpeg' }, body: await shrink(f) });
      if (!r.ok) throw new Error(r.status);
      ci.src = URL.createObjectURL(f); ci.hidden = false; cd.hidden = false; say('Portada guardada');
    } catch { say('No se pudo guardar la portada.'); }
  });
  if (cd) cd.addEventListener('click', async () => {
    await fetch(`/api/col/${cd.dataset.col}/cover`, { method: 'DELETE' }); ci.hidden = true; cd.hidden = true; say('Portada quitada');
  });
})();
