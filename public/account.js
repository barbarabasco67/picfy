// Foto de perfil: recorte cuadrado en el navegador y subida.
(function () {
  const file = document.getElementById('avFile'), msg = document.getElementById('avMsg');
  if (!file) return;
  const say = (t) => { msg.textContent = t; msg.classList.toggle('hidden', !t); };
  file.addEventListener('change', async () => {
    const f = file.files[0]; if (!f) return; say('');
    try {
      const bmp = await createImageBitmap(f);
      const s = Math.min(bmp.width, bmp.height), size = Math.min(480, s);
      const cv = document.createElement('canvas'); cv.width = cv.height = size;
      cv.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.86));
      const r = await fetch('/cuenta/foto', { method: 'PUT', headers: { 'content-type': 'image/jpeg' }, body: blob });
      if (r.status === 409) return say('Falta aplicar la migración 0011 en la base de datos.');
      if (!r.ok) return say('No se pudo subir la foto. Prueba con otra más pequeña.');
      location.reload();
    } catch { say('No se pudo leer esa imagen.'); }
  });
  const del = document.getElementById('avDel');
  if (del) del.addEventListener('click', async () => { await fetch('/cuenta/foto', { method: 'DELETE' }); location.reload(); });
})();
