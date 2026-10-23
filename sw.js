// Cache aislada por versión. No borrar caches de otras aplicaciones del mismo dominio.
const PREFIX='carrito21-pruebas-';
const CACHE=PREFIX+'v5-20261023';
const FILES=['./','./index.html','./manifest.json','./icono.png','./icono-maskable.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 const req=event.request; const url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 // Para documentos, buscar actualización online y utilizar cache si no hay conexión.
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{if(res.ok){let clone=res.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}return res;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));return;}
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const clone=res.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}return res;})));
});
