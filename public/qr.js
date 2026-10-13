// Dibuja los códigos QR de la página (elementos con data-qr).
document.querySelectorAll('[data-qr]').forEach((el) => {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(el.dataset.qr);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
    const svg = el.querySelector('svg');
    if (svg) { svg.setAttribute('width', '200'); svg.setAttribute('height', '200'); }
  } catch (e) { el.textContent = 'No se pudo generar el QR.'; }
});
