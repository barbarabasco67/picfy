(() => {
  const slot = document.getElementById('spSlot'); if (!slot) return;
  fetch('/api/espacio', { credentials: 'same-origin' }).then((r) => (r.ok ? r.text() : '')).then((h) => { if (h) slot.outerHTML = h; }).catch(() => {});
})();
