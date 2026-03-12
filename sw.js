const CACHE_NAME = 'lljt-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  // add other assets you want to pre-cache here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (cacheWhitelist.indexOf(key) === -1) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((res) => {
        // optionally cache new requests
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        const resToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resToCache);
        });
        return res;
      });
    })
  );
});