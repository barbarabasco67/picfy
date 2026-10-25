// Service worker mínimo: solo hace que Picfy se pueda instalar. No guarda nada en caché.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
