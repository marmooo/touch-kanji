const CACHE_NAME = "2024-10-30 00:43";
const urlsToCache = [
  "/touch-kanji/",
  "/touch-kanji/index.js",
  "/touch-kanji/drill.js",
  "/touch-kanji/drill/",
  "/touch-kanji/mp3/correct1.mp3",
  "/touch-kanji/mp3/correct3.mp3",
  "/touch-kanji/mp3/incorrect1.mp3",
  "/touch-kanji/mp3/stupid5.mp3",
  "/touch-kanji/favicon/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
