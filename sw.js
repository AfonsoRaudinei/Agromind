/* Mapa Fenológico — Service Worker (offline-first) */
const CACHE_NAME = 'mapa-fenologico-v1';
const PRECACHE_URLS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  /* Estratégia: cache-first, depois rede; em caso de falha de rede, retorna cache ou index */
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        /* só cacheia respostas válidas e mesma origem */
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => {
        /* offline e sem cache: tenta servir a página principal */
        return caches.match('./index.html');
      });
    })
  );
});
