// Cuenta visitas de la galería y fotos abiertas (una vez por sesión del navegador).
(function () {
  const TOKEN = document.body.dataset.token;
  if (!TOKEN || document.body.dataset.owner === '1') return;
  const ls = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* */ } } };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* */ } } };
  let k = ls.get('picfy_key_' + TOKEN);
  if (!/^[0-9a-f]{32}$/.test(k || '')) { const a = new Uint8Array(16); crypto.getRandomValues(a); k = [...a].map((b) => b.toString(16).padStart(2, '0')).join(''); ls.set('picfy_key_' + TOKEN, k); }
  const send = (extra) => fetch('/api/e/' + TOKEN + '/view', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: k, ...extra }), keepalive: true }).catch(() => {});
  if (!ss.get('picfy_v_' + TOKEN)) { ss.set('picfy_v_' + TOKEN, '1'); send({}); }
  const lb = document.getElementById('lb'), gal = document.getElementById('gallery');
  if (!lb || !gal) return;
  lb.addEventListener('lbshow', (e) => {
    const t = [...gal.querySelectorAll('a.tile')][e.detail.i]; if (!t || !t.dataset.id) return;
    const key = 'picfy_pv_' + t.dataset.id; if (ss.get(key)) return; ss.set(key, '1'); send({ photo: t.dataset.id });
  });
})();
