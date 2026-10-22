// Entrar y crear cuenta en la misma pantalla: las pestañas cambian el formulario sin recargar.
(function () {
  const forms = document.getElementById('auForms'), tpl = document.getElementById('auOther'), head = document.getElementById('auH');
  if (!forms || !tpl) return;
  const tabs = document.querySelectorAll('.au-tabs a');
  const first = () => { const i = forms.querySelector('input'); if (i) i.focus(); };

  function show(mode, push) {
    const cur = forms.firstElementChild;
    if (!cur || cur.dataset.mode === mode) return;
    const next = tpl.content.firstElementChild;
    if (!next || next.dataset.mode !== mode) return;
    // lo que se había escrito (correo) se pasa de un formulario al otro
    const mail = cur.querySelector('input[name=email]'), mail2 = next.querySelector('input[name=email]');
    if (mail && mail2 && mail.value && !mail2.value) mail2.value = mail.value;
    forms.replaceChildren(next); tpl.content.replaceChildren(cur); tpl.dataset.mode = cur.dataset.mode;
    const al = forms.querySelector('.alert'); if (al && !push) al.remove();
    tabs.forEach((t) => { const on = t.dataset.mode === mode; t.classList.toggle('on', on); t.setAttribute('aria-selected', String(on)); });
    head.textContent = head.dataset[mode];
    document.title = (mode === 'login' ? 'Entrar' : 'Crear cuenta') + ' · Picfy';
    if (push) { try { history.replaceState(null, '', mode === 'login' ? '/entrar' : '/registro'); } catch { /* sin historial */ } first(); }
  }
  tabs.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); show(t.dataset.mode, true); }));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.au-eye'); if (!b) return;
    const i = b.previousElementSibling, hide = i.type === 'text';
    i.type = hide ? 'password' : 'text'; b.classList.toggle('on', !hide); b.setAttribute('aria-label', hide ? 'Mostrar la contraseña' : 'Ocultar la contraseña');
  });
  first();
})();
