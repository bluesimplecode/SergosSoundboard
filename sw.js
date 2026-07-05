const CACHE_NAME = 'sergo-soundbot-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/ocean.css',
  './css/angel.css',
  './css/booming.css',
  './css/elements.css',
  './css/spellschools.css',
  './js/app.js',
  './js/storage.js',
  './js/noiseSynth.js',
  './js/oceanTab.js',
  './js/angelAudio.js',
  './js/boomingAudio.js',
  './js/angelTab.js',
  './js/boomingTab.js',
  './js/elementsTab.js',
  './js/spellSchoolsTab.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
