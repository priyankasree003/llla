const CACHE_NAME = 'logistics-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .catch((error) => console.log('Cache error:', error))
  );
});

self.addEventListener('fetch', (event) => {
  // Network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((response) => response || new Response('Offline'));
      })
  );
});
