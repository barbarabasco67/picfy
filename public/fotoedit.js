/* Editor básico de fotos (todo en el navegador). PicfyEdit.open(url, name) → Promise<{blob, w, h, edited}|null> */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const h = (tag, a, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(a || {})) { if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v === true) e.setAttribute(k, ''); else if (v !== false && v != null) e.setAttribute(k, v); } for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
  const icon = (d) => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = d; return s; };
  const ASPECTS = [['Libre', 0], ['1:1', 1], ['4:5', 4 / 5], ['3:2', 3 / 2], ['16:9', 16 / 9]];
  const SIZES = [['Original', 0], ['Grande (2400 px)', 2400], ['Media (1600 px)', 1600], ['Pequeña (1000 px)', 1000]];
  const DEF = { rot: 0, ang: 0, zoom: 1, ar: 0, px: 0, py: 0, bri: 0, con: 0, sat: 0, sha: 0, size: 0 };

  function open(url, name, sendLabel) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => start(img);
      img.src = url;

      function start(img) {
        const st = { ...DEF };
        const dlg = h('dialog', { class: 'glassdlg pedit' });
        const view = h('canvas', { class: 'pe-view' });
        const sliders = {};
        const sl = (key, label, min, max, step = 1) => {
          const out = h('output', {}, String(st[key]));
          const inp = h('input', { type: 'range', min, max, step, value: st[key], 'aria-label': label, oninput: () => { st[key] = Number(inp.value); out.textContent = inp.value; draw(); } });
          sliders[key] = { inp, out };
          return h('label', { class: 'pe-sl' }, h('span', {}, label), inp, out);
        };
        const chips = h('div', { class: 'pe-chips' }, ASPECTS.map(([l, r]) => h('button', { type: 'button', class: 'pe-chip' + (r === 0 ? ' on' : ''), 'data-r': r, onclick: () => { st.ar = r; st.px = st.py = 0; chips.querySelectorAll('.pe-chip').forEach((b) => b.classList.toggle('on', Number(b.dataset.r) === r)); draw(); } }, l)));
        const sizeSel = h('select', { 'aria-label': 'Tamaño', onchange: () => { st.size = Number(sizeSel.value); } }, SIZES.map(([l, v]) => h('option', { value: v }, l)));
        const go = h('button', { type: 'button', class: 'btn primary', onclick: finish }, sendLabel || 'Enviar');
        const cancel = h('button', { type: 'button', class: 'btn', onclick: () => close(null) }, 'Cancelar');
        const reset = () => { Object.assign(st, DEF); for (const [k, s] of Object.entries(sliders)) { s.inp.value = st[k]; s.out.textContent = st[k]; } sizeSel.value = 0; chips.querySelectorAll('.pe-chip').forEach((b) => b.classList.toggle('on', Number(b.dataset.r) === 0)); draw(); };
        dlg.append(h('div', { class: 'dlgbox' },
          h('header', {}, h('h2', {}, 'Editar foto'), h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Cerrar', onclick: () => close(null) }, '×')),
          h('p', { class: 'muted pe-name' }, name || ''),
          h('div', { class: 'pe-stage' }, view),
          h('div', { class: 'pe-tools' },
            h('div', { class: 'pe-row' },
              h('button', { type: 'button', class: 'ib', title: 'Girar a la izquierda', 'aria-label': 'Girar a la izquierda', onclick: () => { st.rot = (st.rot + 3) % 4; st.px = st.py = 0; draw(); } }, icon('<path d="M4 4v6h6"/><path d="M4.5 14a8 8 0 108-9H4"/>')),
              h('button', { type: 'button', class: 'ib', title: 'Girar a la derecha', 'aria-label': 'Girar a la derecha', onclick: () => { st.rot = (st.rot + 1) % 4; st.px = st.py = 0; draw(); } }, icon('<path d="M20 4v6h-6"/><path d="M19.5 14a8 8 0 11-8-9H20"/>')),
              h('button', { type: 'button', class: 'pe-reset', onclick: reset }, 'Deshacer cambios')),
            chips,
            sl('ang', 'Enderezar', -15, 15, 0.5), sl('zoom', 'Recortar (zoom)', 1, 3, 0.05),
            sl('bri', 'Brillo', -100, 100), sl('con', 'Contraste', -100, 100), sl('sat', 'Saturación', -100, 100), sl('sha', 'Aclarar sombras', 0, 100),
            h('label', { class: 'pe-sl' }, h('span', {}, 'Tamaño'), sizeSel)),
          h('footer', {}, cancel, h('span', { class: 'spacer' }), go)));
        document.body.append(dlg);
        dlg.addEventListener('cancel', () => close(null));
        let done = false;
        function close(v) { if (done) return; done = true; try { dlg.close(); } catch (e) { /* cerrada */ } dlg.remove(); resolve(v); }

        // geometría
        function geom(maxSide) {
          const swap = st.rot % 2 === 1, iw = img.naturalWidth, ih = img.naturalHeight;
          const W = swap ? ih : iw, H = swap ? iw : ih;
          const A = st.ar || W / H;
          let cw = Math.min(W, H * A), ch = cw / A;
          const t = Math.abs(st.ang) * Math.PI / 180;
          const k = t ? Math.cos(t) + Math.sin(t) * Math.max(cw / ch, ch / cw) : 1;
          const z = st.zoom * k;
          cw /= z; ch /= z;
          const lim = (a, b) => Math.max(0, (a - b) / 2);
          const cx = W / 2 + Math.max(-lim(W, cw), Math.min(lim(W, cw), st.px));
          const cy = H / 2 + Math.max(-lim(H, ch), Math.min(lim(H, ch), st.py));
          const sc = Math.min(1, (maxSide || 1e9) / Math.max(cw, ch));
          return { W, H, cw, ch, cx, cy, sc, ow: Math.max(1, Math.round(cw * sc)), oh: Math.max(1, Math.round(ch * sc)), t: st.ang * Math.PI / 180 };
        }
        function paint(cv, maxSide) {
          const g = geom(maxSide);
          cv.width = g.ow; cv.height = g.oh;
          const x = cv.getContext('2d', { willReadFrequently: true });
          x.fillStyle = '#000'; x.fillRect(0, 0, g.ow, g.oh);
          x.save();
          x.translate(g.ow / 2, g.oh / 2); x.rotate(g.t); x.scale(g.sc, g.sc); x.translate(-g.cx, -g.cy);
          x.translate(g.W / 2, g.H / 2); x.rotate(st.rot * Math.PI / 2);
          x.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
          x.restore();
          if (st.bri || st.con || st.sat || st.sha) {
            const d = x.getImageData(0, 0, g.ow, g.oh), p = d.data;
            const b = st.bri * 0.6, c = st.con * 2.55, f = (259 * (c + 255)) / (255 * (259 - c)), s = 1 + st.sat / 100, sh = st.sha / 100 * 90;
            for (let i = 0; i < p.length; i += 4) {
              let r = p[i], gg = p[i + 1], bl = p[i + 2];
              if (sh) { const L = (0.299 * r + 0.587 * gg + 0.114 * bl) / 255, lift = sh * (1 - L) * (1 - L); r += lift; gg += lift; bl += lift; }
              r += b; gg += b; bl += b;
              r = f * (r - 128) + 128; gg = f * (gg - 128) + 128; bl = f * (bl - 128) + 128;
              const y = 0.299 * r + 0.587 * gg + 0.114 * bl;
              p[i] = y + (r - y) * s; p[i + 1] = y + (gg - y) * s; p[i + 2] = y + (bl - y) * s;
            }
            x.putImageData(d, 0, 0);
          }
          return g;
        }
        let raf = 0;
        function draw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => paint(view, 760)); }

        // arrastrar para mover el recorte
        let drag = null;
        view.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, px: st.px, py: st.py }; view.setPointerCapture(e.pointerId); });
        view.addEventListener('pointermove', (e) => {
          if (!drag) return; const g = geom(760), k = g.cw / view.clientWidth;
          st.px = drag.px - (e.clientX - drag.x) * k; st.py = drag.py - (e.clientY - drag.y) * k; draw();
        });
        ['pointerup', 'pointercancel'].forEach((n) => view.addEventListener(n, () => { drag = null; }));

        async function finish() {
          go.disabled = true; go.textContent = 'Preparando…';
          const edited = JSON.stringify(st) !== JSON.stringify(DEF);
          const cv = document.createElement('canvas');
          const g = paint(cv, st.size || 6000);
          const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
          close({ blob, w: g.ow, h: g.oh, edited });
        }
        dlg.showModal(); draw();
      }
    });
  }
  window.PicfyEdit = { open };
})();
