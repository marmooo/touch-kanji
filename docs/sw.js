const CACHE_NAME="2024-04-25 10:10",urlsToCache=["/touch-kanji/","/touch-kanji/index.js","/touch-kanji/drill.js","/touch-kanji/drill/","/touch-kanji/mp3/correct1.mp3","/touch-kanji/mp3/correct3.mp3","/touch-kanji/mp3/incorrect1.mp3","/touch-kanji/mp3/stupid5.mp3","/touch-kanji/favicon/favicon.svg"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})