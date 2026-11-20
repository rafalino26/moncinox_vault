// Increment the version when changing precached files or the cache policy.
const PREFIX = 'moncinox-pwa-';
const VERSION = 'v2';
const SHELL = `${PREFIX}shell-${VERSION}`;
const ASSETS = `${PREFIX}assets-${VERSION}`;
const OFFLINE = '/offline.html';
const PRECACHE = [OFFLINE, '/offline-store.js', '/offline-reader.js', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png', '/stickers/stitchblue3.png'];
const MAX_ASSETS = 80;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(
    PRECACHE.map(url => new Request(url, { cache: 'reload' })),
  )));
  // Let an update wait until existing app windows close; never reload a form.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== SHELL && name !== ASSETS).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function staticAsset(request) {
  let cache;
  try {
    cache = await caches.open(ASSETS);
    const cached = await cache.match(request);
    if (cached) return cached;
  } catch { /* Storage can be unavailable; the network still works. */ }
  const response = await fetch(request);
  if (cache && response.ok && response.type !== 'opaque') {
    try {
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map(key => cache.delete(key)));
    } catch { /* A full cache must not break asset delivery. */ }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Financial APIs, Server Actions, and Next.js RSC/prefetch payloads always use the network.
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      url.pathname.startsWith('/api/') || url.searchParams.has('_rsc') ||
      request.headers.has('RSC') || request.headers.has('Next-Router-State-Tree')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      try {
        const cached = await caches.open(SHELL).then(cache => cache.match(OFFLINE));
        if (cached) return cached;
      } catch { /* Fall back even when device storage is unavailable. */ }
      return new Response('Koneksi terputus. Sambungkan internet lalu muat ulang halaman.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staticAsset(request));
  } else if (!url.search && PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.open(SHELL).then(cache => cache.match(request)).catch(() => undefined).then(cached => cached || fetch(request)));
  }
});
