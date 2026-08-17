/* Піднімай версію нижче щоразу, коли міняється index.html,
   інакше телефон і далі показуватиме стару копію. */
const CACHE_VERSION = "klaptyk-v1";

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Спершу мережа, потім кеш — щоб нова версія приїжджала одразу,
   але офлайн усе одно працювало. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const url = new URL(req.url);
        const cacheable = res.status === 200 && (
          url.origin === location.origin ||
          url.hostname.endsWith("fonts.googleapis.com") ||
          url.hostname.endsWith("fonts.gstatic.com")
        );
        if (cacheable) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
