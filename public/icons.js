// Iconos propios de Picfy: trazo fino y formas limpias. Se usan solo cuando la persona elige uno.
(function () {
  const P = {
    balon: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5v17M6 6.2c3 2.8 3 9.8 0 11.6M18 6.2c-3 2.8-3 9.8 0 11.6"/>',
    trofeo: '<path d="M8 4h8v5.2a4 4 0 0 1-8 0V4z"/><path d="M8 6H5.2a1 1 0 0 0-1 1.1C4.5 9 5.8 10 8 10.2M16 6h2.8a1 1 0 0 1 1 1.1c-.3 1.9-1.6 2.9-3.8 3.1M12 13.2V17M8.5 20h7M9.5 17h5v3h-5z"/>',
    camara: '<path d="M4 8.5h3l1.4-2h7.2l1.4 2h3V19H4z"/><circle cx="12" cy="13.5" r="3.4"/>',
    video: '<rect x="3.5" y="6.5" width="12.5" height="11" rx="2.5"/><path d="M16 10.4l4.5-2.6v8.4L16 13.6"/>',
    altavoz: '<path d="M4 10.2v3.6h3.2L14 18V6L7.2 10.2H4z"/><path d="M17 9.2a4 4 0 0 1 0 5.6M19.4 6.8a7.4 7.4 0 0 1 0 10.4"/>',
    movil: '<rect x="7" y="3" width="10" height="18" rx="2.6"/><path d="M10.6 18h2.8"/>',
    paquete: '<path d="M12 3.2l7.8 4.3v9L12 20.8l-7.8-4.3v-9L12 3.2z"/><path d="M4.4 7.6l7.6 4.2 7.6-4.2M12 11.8v9"/>',
    calendario: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6"/>',
    personas: '<circle cx="9" cy="8.5" r="3.1"/><path d="M3.6 19c.5-3.3 2.6-5 5.4-5s4.9 1.7 5.4 5"/><circle cx="17" cy="9.4" r="2.4"/><path d="M16.4 14.2c2.4.2 3.8 1.8 4.1 4.6"/>',
    bandera: '<path d="M5.5 21V4M5.5 5h11l-2.2 3.6L16.5 12h-11"/>',
    estrella: '<path d="M12 3.6l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8 6.9 19.6l1-5.8-4.2-4.1 5.8-.8L12 3.6z"/>',
    corazon: '<path d="M12 20s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.5 12 20 12 20z"/>',
    rayo: '<path d="M13.2 3L5.5 13.4h5.7L10.2 21l8.3-10.6h-5.8L13.2 3z"/>',
    reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.2V12l3.2 2"/>',
    sobre: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.6"/><path d="M4.2 7.6l7.8 5.8 7.8-5.8"/>',
    lugar: '<path d="M12 21s-6.6-5.5-6.6-10.6a6.6 6.6 0 0 1 13.2 0C18.6 15.5 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.3"/>',
    maletin: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.6"/><path d="M9 7.5V6.2c0-.7.6-1.2 1.2-1.2h3.6c.6 0 1.2.5 1.2 1.2v1.3M3.5 13h17"/>',
    documento: '<path d="M7 3.5h7l4 4V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M14 3.7V8h4M9 12.8h6M9 16.2h6"/>',
    gota: '<path d="M12 3.4s6 6.1 6 10.4a6 6 0 0 1-12 0C6 9.5 12 3.4 12 3.4z"/>',
    llama: '<path d="M12.2 3c.4 3.2 5.3 5.5 5.3 10.4A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.6c0-2 1-3.4 2-4.3.2 1.4.9 2.2 1.8 2.6-.3-2.4.3-5.6 1.9-8.7z"/>',
    pesas: '<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11"/>',
    paseo: '<circle cx="13.5" cy="4.6" r="1.9"/><path d="M12.2 8.6l-2.6 4.2 3.2 2.4-1.1 5.3M12.2 8.6l3.2 3 3.1.5M9.6 12.8l-2.9 1"/>',
    libro: '<path d="M4 5.3C4 4.6 4.6 4 5.3 4H11v15.2H5.3c-.7 0-1.3.6-1.3 1.3V5.3zM20 5.3c0-.7-.6-1.3-1.3-1.3H13v15.2h5.7c.7 0 1.3.6 1.3 1.3V5.3z"/>',
    luna: '<path d="M19.6 14.6A8 8 0 0 1 9.4 4.4a8 8 0 1 0 10.2 10.2z"/>',
    hoja: '<path d="M5 19.2C5 11 10 5.6 19.2 4.8c0 9-5.2 14-13.2 14.2"/><path d="M5 19.2c2.6-4.2 5.6-6.8 9-8.2"/>',
    diana: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r=".8"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.4l2.6 2.6 5-5.4"/>',
    musica: '<path d="M9 18V6.5l10-2V16"/><circle cx="6.8" cy="18" r="2.2"/><circle cx="16.8" cy="16" r="2.2"/>',
    foco: '<path d="M9.2 17.5h5.6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3.5z"/>',
  };
  const svg = (id, cls) => (P[id] ? `<svg class="${cls || 'ic'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[id]}</svg>` : '');
  // Rejilla de elección: un clic elige, otro clic sobre el mismo la quita. input = <input type="hidden"> donde queda el id.
  function picker(box, input, ids) {
    box.innerHTML = (ids || Object.keys(P)).map((id) => `<button type="button" class="icopt" data-ic="${id}" title="${id}" aria-label="${id}">${svg(id)}</button>`).join('');
    const mark = () => box.querySelectorAll('.icopt').forEach((b) => b.classList.toggle('on', b.dataset.ic === input.value));
    box.addEventListener('click', (e) => { const b = e.target.closest('.icopt'); if (!b) return; input.value = input.value === b.dataset.ic ? '' : b.dataset.ic; mark(); });
    return mark;
  }
  window.PicfyIcons = { svg, picker, has: (id) => !!P[id], ids: Object.keys(P) };
})();
