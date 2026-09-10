/* Service worker for Training Ledger.
   Makes the app installable and usable offline. The whole app is one HTML file,
   so "cache the app shell" = cache index.html (plus the manifest, icons, and
   Google Font files once they've been fetched).

   Strategy:
   - Navigations: serve the cached shell immediately, refresh it from the
     network in the background (stale-while-revalidate). Trade-off: right after
     a deploy you see the previous version, and the new one on the next launch.
   - Everything else (fonts, icons): cache-first, populate on first fetch.

   Bump CACHE to force old caches to be dropped on activate. */
const CACHE = 'training-ledger-v1';
const SHELL = './index.html';
const PRECACHE = [SHELL, './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(SHELL);
        const fresh = fetch(req)
          .then((res) => { cache.put(SHELL, res.clone()); return res; })
          .catch(() => null);
        return cached || (await fresh) || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return cached || Response.error();
      }
    })
  );
});
