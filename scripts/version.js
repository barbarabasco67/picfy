// Se ejecuta antes de cada arranque/despliegue: marca los archivos estáticos con una versión
// para que los móviles no se queden con un CSS o JS antiguo en caché.
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('../src/version.js', import.meta.url), `export const ASSET_V = '${Date.now().toString(36)}';\n`);
