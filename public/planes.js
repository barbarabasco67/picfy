(() => {
  const msg = document.getElementById('planMsg');
  const fail = (t) => { msg.textContent = t; msg.classList.remove('hidden'); };
  async function go(url, body, btn) {
    msg.classList.add('hidden'); if (btn) btn.disabled = true;
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) { location.href = j.url; return; }
      fail(j.error === 'off' ? 'Los pagos se activarán muy pronto.' : j.error === 'libre' ? 'Tu cuenta no tiene límites, no hace falta ningún plan.' : 'No se ha podido abrir el pago. Inténtalo de nuevo en un momento.');
    } catch { fail('Sin conexión. Inténtalo de nuevo.'); }
    if (btn) btn.disabled = false;
  }
  document.querySelectorAll('[data-plan]').forEach((b) => b.addEventListener('click', () => go('/api/billing/checkout', { plan: b.dataset.plan }, b)));
  const p = document.getElementById('portalBtn'); if (p) p.addEventListener('click', () => go('/api/billing/portal', {}, p));
})();
