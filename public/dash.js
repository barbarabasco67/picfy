(() => {
  const q = document.getElementById('dq');
  if (!q) return;
  q.addEventListener('input', () => {
    const v = q.value.trim().toLowerCase();
    let n = 0;
    document.querySelectorAll('.dgal').forEach((g) => { const ok = !v || g.dataset.name.includes(v); g.hidden = !ok; if (ok) n++; });
    const none = document.getElementById('dnone');
    if (none) none.classList.toggle('hidden', n > 0);
  });
})();
