// Marca de agua: se pinta en el navegador (al subir las fotos y, en lote, en las que ya estaban).
// Los invitados ven la miniatura y la foto grande con marca; el original limpio queda aparte.
(function () {
  const loadImg = (url) => new Promise((res) => {
    if (!url) return res(null);
    const im = new Image();
    im.onload = () => res(im); im.onerror = () => res(null);
    im.src = url;
  });

  const FONT = (px) => `700 ${px}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

  // Pinta la marca sobre un canvas ya dibujado. cfg: { text, pos, op, ... }, logo: imagen o null.
  function draw(ctx, W, H, cfg, logo) {
    const text = String(cfg.text || '').trim();
    if (!text && !logo) return;
    const a = Math.min(0.8, Math.max(0.1, (Number(cfg.op) || 35) / 100));
    const S = Math.sqrt(W * H);
    ctx.save();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';

    const measure = (px) => {
      ctx.font = FONT(px);
      const lg = logo ? px * 1.5 : 0, gap = logo && text ? px * 0.5 : 0, tw = text ? ctx.measureText(text).width : 0;
      return { lg, gap, tw, total: lg + gap + tw };
    };
    const mark = (cx, cy, px) => {
      const m = measure(px);
      let x = cx - m.total / 2;
      if (logo) {
        ctx.save(); ctx.globalAlpha = Math.min(1, a + 0.1);
        ctx.beginPath(); ctx.arc(x + m.lg / 2, cy, m.lg / 2, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(logo, x, cy - m.lg / 2, m.lg, m.lg);
        ctx.restore();
      }
      if (text) {
        x += m.lg + m.gap;
        ctx.font = FONT(px);
        ctx.lineWidth = Math.max(1, px * 0.14);
        ctx.strokeStyle = `rgba(0,0,0,${(a * 0.6).toFixed(3)})`; ctx.strokeText(text, x, cy);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a + 0.2).toFixed(3)})`; ctx.fillText(text, x, cy);
      }
    };

    if (cfg.pos === 'center') {
      mark(W / 2, H / 2, S * 0.085);
    } else if (cfg.pos === 'corner') {
      const px = S * 0.04, m = measure(px), pad = S * 0.035;
      mark(W - pad - m.total / 2, H - pad - px * 0.9, px);
    } else { // repetida en diagonal
      const px = S * 0.05, m = measure(px);
      const stepX = m.total + px * 3, stepY = px * 4.2, D = Math.hypot(W, H);
      ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 6);
      let row = 0;
      for (let y = -D / 2; y <= D / 2 + stepY; y += stepY, row++) {
        for (let x = -D / 2 - (row % 2 ? stepX / 2 : 0); x <= D / 2 + stepX; x += stepX) mark(x, y, px);
      }
    }
    ctx.restore();
  }

  // Redimensiona (lado mayor = maxSide) y pinta la marca si hace falta. Devuelve un JPEG.
  async function render(bmp, maxSide, quality, cfg, logo) {
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    if (cfg && cfg.on) draw(ctx, c.width, c.height, cfg, logo);
    return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('thumb'))), 'image/jpeg', quality));
  }

  const pageCfg = () => { try { const d = JSON.parse(document.body.dataset.wm || ''); return d && d.on ? d : null; } catch { return null; } };
  window.PicfyWm = { draw, render, loadImg, pageCfg };

  /* ---------- vista previa en los ajustes ---------- */
  document.querySelectorAll('canvas[data-wmprev]').forEach((cv) => {
    const form = cv.closest('form');
    let logoImg = null, logoLoaded = false;
    const paint = async () => {
      const f = new FormData(form);
      if (!logoLoaded && cv.dataset.logo) { logoImg = await loadImg(cv.dataset.logo); logoLoaded = true; }
      const ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#6d8aa8'); g.addColorStop(0.55, '#c9a37a'); g.addColorStop(1, '#4b3a2c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(W * 0.3, H * 0.62, H * 0.28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, H * 0.78, W, H * 0.22);
      const text = String(f.get('wm_text') || '').trim() || (form.querySelector('input[name=name]') || {}).value || '';
      draw(ctx, W, H, { text, pos: f.get('wm_pos') || 'diag', op: Number(f.get('wm_op')) || 35 }, f.get('wm_logo') ? logoImg : null);
    };
    form.querySelectorAll('[name=wm],[name=wm_text],[name=wm_pos],[name=wm_op],[name=wm_logo],[name=name]').forEach((el) => el.addEventListener('input', paint));
    document.querySelectorAll('[data-open=setDlg]').forEach((b) => b.addEventListener('click', () => setTimeout(paint, 30)));
    paint();
  });

  /* ---------- aplicar a las fotos que ya estaban (solo en la página del organizador) ---------- */
  const gid = document.body.dataset.gid, gapi = document.body.dataset.gapi;
  if (!gid || !gapi) return;
  let bar = null;
  const show = (msg, pct) => {
    if (!bar) { bar = document.createElement('div'); bar.className = 'wmbar'; bar.innerHTML = '<span></span><i><b></b></i>'; document.body.append(bar); }
    bar.firstChild.textContent = msg; bar.querySelector('b').style.width = Math.round((pct || 0) * 100) + '%';
  };

  async function one(id, job, logo) {
    const r = await fetch(`/m/${id}/o`);
    if (!r.ok) throw new Error('orig');
    let bmp;
    try { bmp = await createImageBitmap(await r.blob(), { imageOrientation: 'from-image' }); } catch { throw new Error('decode'); }
    const cfg = { on: job.on, text: job.text, pos: job.pos, op: job.op };
    try {
      for (const [size, max, q] of [['m', 480, 0.8], ['l', 1600, 0.85]]) {
        const blob = await PicfyWm.render(bmp, max, q, cfg, logo);
        const p = await fetch(`${gapi}/wm/${id}/${size}`, { method: 'PUT', body: blob, headers: { 'content-type': 'image/jpeg' } });
        if (!p.ok) throw new Error('put');
      }
    } finally { if (bmp.close) bmp.close(); }
    const d = await fetch(`${gapi}/wm/${id}/done`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rev: job.on ? job.rev : 0 }) });
    if (!d.ok) throw new Error('done');
    // que este navegador no se quede con la versión anterior
    fetch(`/m/${id}/m`, { cache: 'reload' }).catch(() => {}); fetch(`/m/${id}/l`, { cache: 'reload' }).catch(() => {});
  }

  async function run() {
    let job;
    try { const r = await fetch(`${gapi}/wm/pending`); if (!r.ok) return; job = await r.json(); } catch { return; }
    if (!job.ready || !job.ids.length) return;
    const logo = job.on && job.logoUrl ? await loadImg(job.logoUrl) : null;
    const todo = job.ids.slice(), total = todo.length;
    let done = 0, bad = 0;
    const label = () => (job.on ? 'Poniendo la marca de agua' : 'Quitando la marca de agua') + ` · ${done + bad} de ${total}. No cierres esta pestaña.`;
    show(label(), 0);
    async function worker() {
      while (todo.length) {
        const id = todo.shift();
        try { await one(id, job, logo); done++; } catch { bad++; }
        show(label(), (done + bad) / total);
      }
    }
    await Promise.all([worker(), worker()]);
    show(bad ? `Listo. ${done} fotos al día; ${bad} no se pudieron procesar (formato que el navegador no lee).` : `Listo. ${done} fotos al día.`, 1);
    setTimeout(() => { if (bar) bar.remove(); if (done) location.reload(); }, bad ? 4000 : 1400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
