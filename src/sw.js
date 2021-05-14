var CACHE_NAME = '2021-05-14 10:10';
var urlsToCache = [
  '/touch-kanji/',
  '/touch-kanji/index.js',
  '/touch-kanji/drill.js',
  '/touch-kanji/drill/',
  '/touch-kanji/svg/eraser.svg',
  '/touch-kanji/svg/dict.svg',
  '/touch-kanji/mp3/correct1.mp3',
  '/touch-kanji/mp3/correct3.mp3',
  '/touch-kanji/mp3/incorrect1.mp3',
  '/touch-kanji/mp3/stupid5.mp3',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
