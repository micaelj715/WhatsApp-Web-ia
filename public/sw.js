// Permite instalar como app. Busca sempre a versão nova; sem internet, mostra a última guardada.
const CACHE = "micael-v2";
const STATIC = ["/", "/app.css", "/i18n.js", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && STATIC.includes(url.pathname)) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("/"))));
});
