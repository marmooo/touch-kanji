var CACHE_NAME = '2022-07-05 11:30';
var urlsToCache = [
  "/touch-kanji/",
  "/touch-kanji/index.js",
  "/touch-kanji/drill.js",
  "/touch-kanji/drill/",
  "/touch-kanji/svg/eraser.svg",
  "/touch-kanji/svg/dict.svg",
  "/touch-kanji/mp3/correct1.mp3",
  "/touch-kanji/mp3/correct3.mp3",
  "/touch-kanji/mp3/incorrect1.mp3",
  "/touch-kanji/mp3/stupid5.mp3",
  "/touch-kanji/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/signature_pad@4.0.5/dist/signature_pad.umd.min.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
