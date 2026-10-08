// Little Boutique service worker
// Bump CACHE_VERSION whenever you upload a new version of the app,
// so phones drop the old cached copy.
const CACHE_VERSION = 'boutique-v3';

const APP_FILES = [
  './',
  './My_LittleBoutique.html',
  './Storefront.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install: save the app files for offline use
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // one failing file (e.g. Storefront not uploaded yet) won't block install
      Promise.all(APP_FILES.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// Activate: delete old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first (so updates arrive), cache as the offline fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isOurs = url.origin === self.location.origin;
  const isJsPdf = url.hostname === 'cdnjs.cloudflare.com';
  if (!isOurs && !isJsPdf) return; // QR codes, Google APIs etc. go straight to network

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./My_LittleBoutique.html')))
  );
});
