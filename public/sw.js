// The generated import changes with every build, so worker updates also track deployments.
importScripts('/pwa-build.js');
const BUILD = self.MONCINOX_PWA_BUILD;
const PREFIX = 'moncinox-pwa-';
const VERSION = `v3-${BUILD.id}`;
const SHELL = `${PREFIX}shell-${VERSION}`;
const ASSETS = `${PREFIX}assets-${VERSION}`;
const OFFLINE = '/offline.html';
const PRECACHE = [...new Set([OFFLINE, '/offline-store.js', '/offline-reader.js', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png', '/stickers/stitchblue3.png', ...Object.values(BUILD.pages), ...BUILD.assets])];
const MAX_ASSETS = 80;
let updateCheck = null;
self.addEventListener('message', event => {
  if (event.data?.type !== 'PWA_TRY_UPDATE') return;
  if (!updateCheck) updateCheck = (async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const ask = (commit) => Promise.all(clients.map(client => new Promise(resolve => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 2000);
      channel.port1.onmessage = message => { clearTimeout(timer); channel.port1.close(); resolve(message.data?.ready === true); };
      client.postMessage({ type: 'PWA_CAN_UPDATE', commit }, [channel.port2]);
    })));
    const ready = await ask(false);
    const committed = ready.every(Boolean) ? await ask(true) : [];
    const current = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const sameClients = current.every(client => clients.some(previous => previous.id === client.id));
    if (ready.every(Boolean) && committed.length === clients.length && committed.every(Boolean) && sameClients) await self.skipWaiting();
    else current.forEach(client => client.postMessage({ type: 'PWA_UPDATE_ABORT' }));
  })().catch(async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: 'PWA_UPDATE_ABORT' }));
  }).finally(() => { updateCheck = null; });
  event.waitUntil(updateCheck);
});

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(
    PRECACHE.map(url => new Request(url, { cache: 'reload' })),
  )));
  // Let an update wait until existing app windows close; never reload a form.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Retain one prior build for an old tab that becomes busy/offline during handover.
    const previous = names.filter(name => name.startsWith(`${PREFIX}shell-v`) && name !== SHELL).pop();
    const previousAssets = previous?.replace(`${PREFIX}shell-`, `${PREFIX}assets-`);
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && ![SHELL, ASSETS, previous, previousAssets].includes(name)).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function staticAsset(request) {
  let cache;
  try {
    cache = await caches.open(ASSETS);
    const cached = await caches.open(SHELL).then(shell => shell.match(request)) || await cache.match(request);
    if (cached) return cached;
    for (const name of await caches.keys()) {
      if (name !== SHELL && name.startsWith(`${PREFIX}shell-v`)) {
        const old = await caches.open(name).then(shell => shell.match(request));
        if (old) return old;
      }
    }
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
        const route = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '');
        const cached = await caches.open(SHELL).then(async cache =>
          (BUILD.pages[route] && await cache.match(BUILD.pages[route])) || await cache.match(OFFLINE));
        if (cached) return cached;
      } catch { /* Fall back even when device storage is unavailable. */ }
      return new Response('Koneksi terputus. Sambungkan internet lalu muat ulang halaman.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }));
    return;
  }

  if (url.pathname === '/_next/image') {
    // Reuse original cached artwork if the image optimizer cannot be reached offline.
    const original = url.searchParams.get('url');
    if (original && BUILD.assets.includes(original)) {
      event.respondWith(fetch(request).catch(async () => {
        const image = await caches.open(SHELL).then(cache => cache.match(original));
        if (image) return image;
        throw new Error('Offline image unavailable');
      }));
    }
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staticAsset(request));
  } else if (!url.search && PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.open(SHELL).then(cache => cache.match(request)).catch(() => undefined).then(cached => cached || fetch(request)));
  }
});
