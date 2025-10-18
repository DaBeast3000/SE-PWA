const CACHE_NAME = 'suncard-cache-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/offline-api.json'
];

self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)));
});

self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);
  if (url.pathname.startsWith('/api/')) {
    evt.respondWith(fetch(evt.request).catch(() => caches.match('/offline-api.json')));
    return;
  }
  evt.respondWith(caches.match(evt.request).then(resp => resp || fetch(evt.request)));
});
