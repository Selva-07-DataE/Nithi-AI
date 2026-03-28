const CACHE_NAME = 'nithi-ai-v5';
const ASSETS = [
  './index.html',
  './calculators.js',
  './websearch.js',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for API calls — never cache
  if (e.request.url.includes('/api/chat') ||
      e.request.url.includes('/api/search') ||
      e.request.url.includes('openrouter.ai') ||
      e.request.url.includes('generativelanguage.googleapis.com') ||
      e.request.url.includes('api.openai.com') ||
      e.request.url.includes('duckduckgo.com') ||
      e.request.url.includes('wikipedia.org') ||
      e.request.url.includes('open.er-api.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
