// Informe del torneo: el botón abre el diálogo de impresión (Guardar como PDF).
(() => {
  const b = document.getElementById('printBtn'); if (!b) return;
  b.addEventListener('click', () => window.print());
  if (/[?&]print=1/.test(location.search)) setTimeout(() => window.print(), 400);
})();
