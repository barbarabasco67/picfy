// Cambia el selector de archivos del navegador («Choose File») por un botón en español.
(function () {
  document.querySelectorAll('input[type=file][data-brand-file]').forEach((inp) => {
    if (inp.dataset.fp) return; inp.dataset.fp = '1';
    const multi = inp.multiple;
    const wrap = document.createElement('div'); wrap.className = 'fpick';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fpbtn'; btn.textContent = multi ? 'Elegir archivos' : 'Elegir imagen';
    const txt = document.createElement('span'); txt.className = 'fptxt';
    const empty = multi ? 'Ningún archivo seleccionado' : 'Ninguna imagen seleccionada';
    const sync = () => { const n = inp.files ? inp.files.length : 0; txt.textContent = n === 0 ? empty : n === 1 ? inp.files[0].name : n + ' archivos'; };
    inp.classList.add('fphide'); inp.parentNode.insertBefore(wrap, inp); wrap.append(btn, txt, inp);
    btn.addEventListener('click', () => inp.click());
    inp.addEventListener('change', sync);
    new MutationObserver(sync).observe(inp, { attributes: true });
    // brand.js vacía el campo con inp.value = '' (no lanza «change»), así que se repasa al hacer clic en el diálogo
    document.addEventListener('click', () => setTimeout(sync, 0), true);
    sync();
  });
})();
