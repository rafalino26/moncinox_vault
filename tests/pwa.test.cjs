const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const loadModule = require('./helpers/load-ts.cjs');

function worker(fetcher = async () => new Response('network')) {
  const listeners = {};
  const stores = new Map();
  const key = request => { const url = new URL(typeof request === 'string' ? request : request.url, 'https://vault.test'); return url.pathname + url.search; };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(requests) { for (const request of requests) store.set(key(request), new Response(`precache:${key(request)}`)); },
        async match(request) { return store.get(key(request))?.clone(); },
        async put(request, response) { store.set(key(request), response); },
        async keys() { return [...store.keys()]; },
        async delete(request) { return store.delete(key(request)); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  class WorkerRequest extends Request { constructor(url, options) { super(new URL(url, 'https://vault.test'), options); } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
    self: { MONCINOX_PWA_BUILD: { id: 'test', pages: { '/': '/offline-pages/dashboard.html', '/pengeluaran': '/offline-pages/pengeluaran.html', '/pemasukan': '/offline-pages/pemasukan.html' }, assets: ['/_next/static/app.js', '/rafa.png'] }, location: { origin: 'https://vault.test' }, clients: { claim: async () => {} }, addEventListener: (name, listener) => { listeners[name] = listener; } },
    importScripts: () => {},
    caches, fetch: fetcher, URL, Request: WorkerRequest, Response,
  });
  return {
    stores, caches,
    async lifecycle(name) { let promise; listeners[name]({ waitUntil: value => { promise = value; } }); await promise; },
    request(pathname, { method = 'GET', headers = {}, mode = 'cors' } = {}) {
      let response;
      listeners.fetch({ request: { url: new URL(pathname, 'https://vault.test').href, method, headers: new Headers(headers), mode }, respondWith: value => { response = value; } });
      return response;
    },
  };
}

test('manifest has standalone identity and real square icons including a maskable icon', async () => {
  const manifest = loadModule('src/app/manifest.ts').default();
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const data = fs.readFileSync(path.join(__dirname, '../public', icon.src));
    const size = Number(icon.sizes.split('x')[0]);
    assert.equal(data.readUInt32BE(16), size);
    assert.equal(data.readUInt32BE(20), size);
  }
});

test('service worker never intercepts financial APIs, writes, RSC, or external requests', () => {
  const sw = worker();
  for (const [url, options] of [
    ['/api/web/wallets', {}], ['/api/transactions', {}], ['/', { method: 'POST' }],
    ['/?_rsc=123', {}], ['/pengeluaran', { headers: { RSC: '1' } }],
    ['/pemasukan', { headers: { 'Next-Router-State-Tree': 'state' } }],
    ['https://other.test/file.js', {}],
  ]) assert.equal(sw.request(url, options), undefined);
});

test('offline navigation uses the normal page shell, preserving the requested route and filters', async () => {
  const sw = worker(async () => { throw new Error('offline'); });
  await sw.lifecycle('install');
  for (const [route, page] of [['/', 'dashboard'], ['/pengeluaran?rentang=semua', 'pengeluaran'], ['/pemasukan/', 'pemasukan']]) {
    assert.equal(await (await sw.request(route, { mode: 'navigate' })).text(), `precache:/offline-pages/${page}.html`);
  }
  assert.equal(await (await sw.request('/unknown', { mode: 'navigate' })).text(), 'precache:/offline.html');
  assert.equal([...sw.stores.values()].some(store => store.has('/pengeluaran')), false);
  const online = worker(async () => new Response('fresh HTML'));
  assert.equal(await (await online.request('/', { mode: 'navigate' })).text(), 'fresh HTML');
  assert.equal(online.stores.size, 0);
});

test('hashed assets are cached with a size bound; errors are not cached', async () => {
  let requests = 0;
  const sw = worker(async request => {
    requests++;
    return new Response('asset', { status: request.url.endsWith('bad.js') ? 500 : 200 });
  });
  await sw.request('/_next/static/one.js');
  await sw.request('/_next/static/one.js');
  assert.equal(requests, 1);
  await sw.request('/_next/static/bad.js');
  await sw.request('/_next/static/bad.js');
  assert.equal(requests, 3);
  for (let i = 0; i < 85; i++) await sw.request(`/_next/static/${i}.js`);
  assert.equal([...sw.stores.values()][0].size, 80);
});

test('activation removes only obsolete Moncinox caches', async () => {
  const sw = worker();
  await sw.caches.open('moncinox-pwa-shell-old');
  await sw.caches.open('another-app');
  await sw.lifecycle('install');
  await sw.lifecycle('activate');
  assert.equal(sw.stores.has('moncinox-pwa-shell-old'), false);
  assert.equal(sw.stores.has('another-app'), true);
  assert.equal(sw.stores.has('moncinox-pwa-shell-v3-test'), true);
});

test('preloaded chunks survive runtime eviction and image optimizer requests fall back to local artwork', async () => {
  const sw = worker(async () => { throw Error('offline'); });
  await sw.lifecycle('install');
  assert.equal(await (await sw.request('/_next/static/app.js')).text(), 'precache:/_next/static/app.js');
  assert.equal(await (await sw.request('/_next/image?url=%2Frafa.png&w=64&q=75')).text(), 'precache:/rafa.png');
  assert.equal(sw.request('/_next/image?url=https%3A%2F%2Fother.test%2Fprivate.png'), undefined);
});
