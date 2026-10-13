// Panel del organizador: acciones sobre fotos (aprobar, rechazar, mover, ordenar, copiar enlace).
(function () {
  const $ = (id) => document.getElementById(id);
  const api = document.body.dataset.api;
  const { init, toast, post } = window.PicfySort;

  $('copyLink').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('guestLink').textContent.trim()); toast('Enlace copiado'); }
    catch { toast('No se pudo copiar; selecciónalo a mano'); }
  });

  // Moderación
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const id = b.dataset.id, act = b.dataset.act;
    try {
      if (act === 'delete') {
        if (!confirm('¿Borrar esta foto? No se puede deshacer.')) return;
        await post(api + '/delete', { ids: [id] });
      } else await post(api + '/state', { action: act, ids: [id] });
      location.reload();
    } catch { toast('No se pudo completar la acción'); }
  });
  const all = $('approveAll');
  if (all) all.addEventListener('click', async () => {
    try { await post(api + '/state', { action: 'approve', all: true }); location.reload(); }
    catch { toast('No se pudo aprobar'); }
  });

  // Orden por hora
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', async () => {
    try { await post(api + '/sort', { mode: b.dataset.mode }); location.reload(); }
    catch { toast('No se pudo ordenar'); }
  }));

  // Cuadrícula de todas las fotos
  const grid = $('sortGrid');
  if (!grid) return;
  const delBtn = $('delPicked'), nEl = $('pickedN'), moveBox = $('moveBox'), countEl = $('mineCount');
  const sort = init({
    grid,
    onReorder: (ids) => post(api + '/reorder', { ids }),
    onDelete: (ids) => post(api + '/delete', { ids }),
    onChange: (n, total) => {
      delBtn.classList.toggle('hidden', n === 0);
      moveBox.classList.toggle('hidden', n === 0);
      nEl.textContent = n ? `(${n})` : '';
      countEl.textContent = total + (total === 1 ? ' foto' : ' fotos');
    },
  });
  $('pickAll').addEventListener('click', () => sort.pickAll());
  delBtn.addEventListener('click', () => {
    const ids = sort.picked();
    if (ids.length && confirm(`¿Borrar ${ids.length} fotos? No se puede deshacer.`)) sort.removeIds(ids);
  });
  $('moveBtn').addEventListener('click', async () => {
    const ids = sort.picked(), to = $('moveTo').value;
    if (!ids.length || !to) return;
    try {
      await post(api + '/move', { ids, guest_id: to });
      toast(`${ids.length} fotos pasadas al álbum de ${$('moveTo').selectedOptions[0].textContent.replace(/\s*\(\d+\)$/, '')}`);
      setTimeout(() => location.reload(), 900);
    } catch { toast('No se pudo mover'); }
  });
  const size = $('size');
  const apply = () => grid.style.setProperty('--tile', size.value + 'px');
  size.addEventListener('input', apply); apply();
})();
