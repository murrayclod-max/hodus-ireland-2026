// Field guides only. Every other request passes straight through untouched —
// this worker must never get between the app and its live data.
const CACHE = 'hodus-guides-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const isAerial = url => url.pathname.startsWith('/guides/');
const isGuidePage = url => /^\/courses\/[^/]+\/guide(\/print)?$/.test(url.pathname);

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Aerials never change: serve from cache, fall back to the network
  if (isAerial(url)) {
    event.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
        return res;
      })),
    );
    return;
  }

  // Guide pages: fresh when there's signal, cached when there isn't
  if (isGuidePage(url)) {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
          return res;
        })
        .catch(() => caches.match(request).then(hit => hit || Response.error())),
    );
  }
});
