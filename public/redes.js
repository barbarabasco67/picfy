// Redes sociales: lista de clientes y alta de uno nuevo.
(function () {
  const dlg = document.getElementById('rdDlg'), form = document.getElementById('rdForm');
  if (!dlg || !form) return;
  window.PicfyClientForm = window.PicfyClientForm || {
    bind(f) {
      f.querySelectorAll('[data-sw]').forEach((b) => b.addEventListener('click', () => {
        f.color.value = b.dataset.sw; f.querySelectorAll('[data-sw]').forEach((x) => x.classList.toggle('on', x === b));
      }));
      f.color.addEventListener('input', () => f.querySelectorAll('[data-sw]').forEach((x) => x.classList.remove('on')));
    },
    read(f) {
      const networks = {};
      f.querySelectorAll('[data-net]').forEach((i) => { (networks[i.dataset.net] = networks[i.dataset.net] || {})[i.dataset.f] = i.value; });
      return { name: f.name.value, color: f.color.value, font: (f.querySelector('[name=font]:checked') || {}).value || 'sans', networks, notes: f.notes.value };
    },
  };
  PicfyClientForm.bind(form);
  document.getElementById('rdAdd').addEventListener('click', () => { dlg.showModal(); form.name.focus(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try {
      const r = await fetch('/api/redes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(PicfyClientForm.read(form)) });
      const d = await r.json(); if (!r.ok) throw new Error();
      location.href = '/redes/' + d.id;
    } catch { btn.disabled = false; alert('No se pudo crear el cliente.'); }
  });
})();
