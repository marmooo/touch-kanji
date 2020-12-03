var CACHE_NAME = '2020-12-03 23:50';
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
  'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/css/bootstrap.min.css',
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
