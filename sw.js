const CACHE_NAME = 'dayquest-v2-drinks-and-daily-chores-9';
const ASSETS = [
  './', './index.html', './manifest.json', './icon.png',
  './ramen.css', './cottage.css', './dayquest-theme.css', './vendor/dayquest.js',
  './vendor/tailwind.css', './vendor/confetti.js', './vendor/fredoka-latin.woff2', './vendor/plus-jakarta-sans-latin.woff2'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('dayquest-v2-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') await cache.put(request, response.clone());
      return response;
    } catch {
      if (request.mode === 'navigate') return await cache.match('./index.html') ?? Response.error();
      return Response.error();
    }
  })());
});
