// Me gusta y comentarios en la galería de invitados (se apoya en el visor de lightbox.js).
(function () {
  const TOKEN = document.body.dataset.token;
  const lb = document.getElementById('lb'), gal = document.getElementById('gallery');
  const bar = document.getElementById('lbSoc');
  if (!TOKEN || !lb || !gal || !bar || document.body.dataset.social !== '1') return;
  const $ = (id) => document.getElementById(id);
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  };
  function myKey() {
    let k = ls.get('picfy_key_' + TOKEN);
    if (!/^[0-9a-f]{32}$/.test(k || '')) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      k = [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
      ls.set('picfy_key_' + TOKEN, k);
    }
    return k;
  }
  const KEY = myKey();
  const api = async (path, body) => {
    const r = await fetch('/api/e/' + TOKEN + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: KEY, ...body }) });
    if (!r.ok) { const e = new Error('http'); e.status = r.status; throw e; }
    return r.json();
  };
  const HEART = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7-4.6-9.2-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.2 11C19 15.4 12 20 12 20z"/></svg>';
  const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  const likeBtn = $('lbLike'), comBtn = $('lbCom'), panel = $('lbPanel'), list = $('lbList'), form = $('lbForm');
  const state = {}; // id -> { l, m, c }
  let isOwner = false, curId = null, tiles = [];

  const get = (id) => state[id] || (state[id] = { l: 0, m: 0, c: 0 });
  function badge(id) {
    const t = tiles.find((x) => x.dataset.id === id); if (!t) return;
    let b = t.querySelector('.soc'); const s = get(id);
    if (!s.l && !s.c) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'soc'; t.appendChild(b); }
    b.innerHTML = (s.l ? `<i class="${s.m ? 'me' : ''}">${HEART}${s.l}</i>` : '') + (s.c ? `<i>${CHAT}${s.c}</i>` : '');
  }
  function paint() {
    if (!curId) return; const s = get(curId);
    likeBtn.innerHTML = HEART + '<span>' + s.l + '</span>'; likeBtn.classList.toggle('on', Boolean(s.m));
    comBtn.innerHTML = CHAT + '<span>' + s.c + '</span>';
  }
  const fmt = (ms) => new Date(ms).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function row(cm) {
    const d = document.createElement('div'); d.className = 'cm';
    const h = document.createElement('div'); h.className = 'cmh';
    const n = document.createElement('strong'); n.textContent = cm.author || 'Invitado';
    const t = document.createElement('span'); t.textContent = fmt(cm.at);
    h.append(n, t);
    if (cm.mine || isOwner) {
      const x = document.createElement('button'); x.type = 'button'; x.textContent = 'Borrar'; x.className = 'cmx';
      x.addEventListener('click', async () => {
        try { await api('/comment/' + cm.id + '/delete'); d.remove(); get(curId).c = Math.max(0, get(curId).c - 1); paint(); badge(curId); } catch { /* se queda */ }
      });
      h.append(x);
    }
    const p = document.createElement('p'); p.textContent = cm.body;
    d.append(h, p); return d;
  }
  async function loadComments() {
    const id = curId; list.textContent = '';
    try {
      const r = await api('/p/' + id + '/comments');
      if (id !== curId || r.off) return;
      isOwner = Boolean(r.owner);
      if (!r.comments.length) { const e = document.createElement('p'); e.className = 'cmempty'; e.textContent = 'Aún no hay comentarios.'; list.append(e); }
      r.comments.forEach((cm) => list.append(row(cm)));
      get(id).c = r.comments.length; paint(); badge(id);
    } catch { list.textContent = 'No se han podido cargar los comentarios.'; }
  }
  function setPanel(open) {
    panel.classList.toggle('hidden', !open); comBtn.classList.toggle('on', open);
    if (open) loadComments();
  }

  lb.addEventListener('lbshow', (e) => {
    if (document.body.dataset.social !== '1') return;
    tiles = [...gal.querySelectorAll('a.tile')];
    const t = tiles[e.detail.i]; if (!t) return;
    curId = t.dataset.id; bar.classList.remove('hidden'); paint();
    if (!panel.classList.contains('hidden')) loadComments();
  });
  lb.addEventListener('lbhide', () => { curId = null; panel.classList.add('hidden'); comBtn.classList.remove('on'); });

  likeBtn.addEventListener('click', async () => {
    if (!curId) return; const id = curId, s = get(id);
    s.m = s.m ? 0 : 1; s.l += s.m ? 1 : -1; paint(); badge(id); // respuesta inmediata
    try { const r = await api('/p/' + id + '/like'); s.m = r.liked ? 1 : 0; s.l = r.likes; }
    catch { s.m = s.m ? 0 : 1; s.l += s.m ? 1 : -1; }
    paint(); badge(id);
  });
  comBtn.addEventListener('click', () => setPanel(panel.classList.contains('hidden')));
  $('lbPanelX').addEventListener('click', (e) => { e.stopPropagation(); setPanel(false); });
  const nameIn = $('lbName'), textIn = $('lbText');
  nameIn.value = ls.get('picfy_name') || '';
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = textIn.value.trim(); if (!body || !curId) return;
    const id = curId; ls.set('picfy_name', nameIn.value.trim());
    form.querySelector('button').disabled = true;
    try {
      const r = await api('/p/' + id + '/comment', { name: nameIn.value.trim(), body });
      textIn.value = '';
      if (id === curId) { const e0 = list.querySelector('.cmempty'); if (e0) e0.remove(); list.append(row(r.comment)); list.scrollTop = list.scrollHeight; }
      get(id).c += 1; paint(); badge(id);
    } catch (x) { textIn.placeholder = x.status === 429 ? 'Demasiados comentarios seguidos, espera un poco.' : 'No se pudo enviar. Inténtalo de nuevo.'; }
    form.querySelector('button').disabled = false;
  });

  // Resumen de la página (insignias en las miniaturas).
  (async function () {
    tiles = [...gal.querySelectorAll('a.tile')];
    const ids = tiles.map((t) => t.dataset.id).filter(Boolean);
    if (!ids.length) return;
    try {
      const r = await api('/social', { ids });
      if (r.off) { document.body.dataset.social = '0'; return; }
      isOwner = Boolean(r.owner);
      Object.entries(r.items).forEach(([id, v]) => { state[id] = v; badge(id); });
    } catch { /* sin conexión: se queda sin insignias */ }
  })();
})();
