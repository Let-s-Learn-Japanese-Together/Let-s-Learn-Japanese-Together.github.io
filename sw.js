const CACHE_NAME = 'lljt-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  // add other assets you want to pre-cache here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // pre-cache the SPA shell
      return cache.addAll(urlsToCache);
    })
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

// generic fetch handler with navigation fallback for SPA
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // if the request is a navigation to a page, respond with cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((resp) => {
        return (
          resp ||
          fetch(request)
            .then((res) => {
              // cache the fetched page for offline
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              return res;
            })
            .catch(() => caches.match('/index.html'))
        );
      })
    );
    return;
  }

  // for other requests (assets), use network-first so cache stays fresh
  event.respondWith(
    fetch(request)
      .then((res) => {
        // if we get a valid response, update the cache
        if (res && res.status === 200 && res.type === 'basic') {
          const resToCache = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, resToCache);
          });
        }
        return res;
      })
      .catch(() => {
        // if network fails, fall back to cache
        return caches.match(request);
      })
  );
});