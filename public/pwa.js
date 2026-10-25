(() => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  const btn = document.getElementById('installApp'); let ev = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ev = e; if (btn) btn.hidden = false; });
  if (btn) btn.addEventListener('click', async () => { if (!ev) return; ev.prompt(); await ev.userChoice.catch(() => {}); ev = null; btn.hidden = true; });
  addEventListener('appinstalled', () => { if (btn) btn.hidden = true; });
})();
