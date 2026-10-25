// Planes de Picfy: límites y precios. Todo se cambia aquí.
const GB = 1024 ** 3;
export const THUMB_EST = 380 * 1024; // las miniaturas se estiman por foto (la de 480 px y la de 1600 px)
export const PLANES = {
  gratis: { nombre: 'Gratis', precio: 0, galerias: 2, bytes: 2 * GB, torneos: false },
  fotografo: { nombre: 'Fotógrafo', precio: 12, galerias: 30, bytes: 50 * GB, torneos: false },
  organizador: { nombre: 'Organizador', precio: 39, galerias: 200, bytes: 250 * GB, torneos: true },
};
export const PASE = { nombre: 'Pase por evento', precio: 29, galerias: 1, bytes: 20 * GB, meses: 12 };
// Cuentas anteriores a los planes y las que se dan a mano: sin límites.
export const LIBRE = { nombre: 'Sin límites', precio: 0, galerias: Infinity, bytes: Infinity, torneos: true };

export const usedBytes = (st) => (Number(st && st.bytes) || 0) + (Number(st && st.n) || 0) * THUMB_EST;
export function fmtGB(b) {
  if (!isFinite(b)) return 'Sin límite';
  const g = b / GB; return g >= 10 || Number.isInteger(g) ? `${Math.round(g)} GB` : `${g.toFixed(1).replace('.', ',')} GB`;
}
export const fmtEur = (n) => `${String(n).replace('.', ',')} €`;

// Combina el plan base con los pases por evento que siguen activos.
export function limitsOf(key, pases = 0) {
  const base = key === 'libre' ? LIBRE : PLANES[key] || PLANES.gratis;
  return {
    key: key === 'libre' ? 'libre' : PLANES[key] ? key : 'gratis', nombre: base.nombre,
    galerias: base.galerias + pases * PASE.galerias, bytes: base.bytes + pases * PASE.bytes,
    torneos: base.torneos || pases > 0, pases,
  };
}
