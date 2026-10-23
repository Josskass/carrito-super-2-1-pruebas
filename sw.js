// Carrito 2.1: version de pruebas independiente; nunca borrar caches de otras apps.
const PREFIX = 'carrito21-pruebas-';
const CACHE = PREFIX + 'v10-share-nombre-20261023';
const SCOPE = new URL(self.registration.scope);
const HOME = new URL('./index.html', SCOPE).href;
const ASSETS = ['./manifest.json', './icono.png', './icono-maskable.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Guarda la pagina actual bajo UNA clave canonica, independientemente
    // de las variantes ?utm_source=..., que no deben producir HTML distinto.
    const res = await fetch(new Request(HOME, {cache: 'reload'}));
    if (!res.ok) throw new Error('No se pudo guardar index.html');
    await cache.put(HOME, res);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Solo caches antiguas de esta misma aplicacion 2.1.
    // El cache v4 anterior pertenecia exclusivamente al laboratorio 2.1.
    await Promise.all(names.filter(n =>
      (n.startsWith(PREFIX) && n !== CACHE) || n === 'carrito-super-v4-20261023'
    ).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req, {cache: 'no-store'});
        if (res.ok && res.type === 'basic') {
          // Actualiza tambien la copia offline; sin query strings ni restos antiguos.
          await cache.put(HOME, res.clone());
        }
        return res;
      } catch (_) {
        const offline = await cache.match(HOME);
        return offline || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, {ignoreSearch: true});
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type === 'basic') await cache.put(req, res.clone());
    return res;
  })());
});
