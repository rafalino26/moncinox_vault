const test = require('node:test');
const assert = require('node:assert/strict');
const loadModule = require('./helpers/load-ts.cjs');

test('IndexedDB enqueue resolves on transaction commit, not request success; aborts are reported and DB closes', async () => {
  const descriptors = Object.fromEntries(['indexedDB', 'BroadcastChannel'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const transactions = []; let closed = 0;
  try {
    Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: class { constructor() { throw Error('blocked channel'); } } });
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: {
      open(name) {
        assert.equal(name, 'moncinox-outbox');
        const request = { result: { close() { closed++; }, transaction(store, mode) {
          assert.equal(store, 'transactions'); assert.equal(mode, 'readwrite');
          const tx = { objectStore: () => ({ add: item => ({ result: item.id }) }) };
          transactions.push(tx); return tx;
        } } };
        setImmediate(() => request.onsuccess());
        return request;
      },
    } });
    const { queueStorage } = loadModule('src/app/lib/offline-queue-storage.ts');
    let complete = false;
    const saving = queueStorage.add({ id: 'durable' }).then(value => { complete = true; return value; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(complete, false);
    transactions[0].oncomplete();
    assert.equal(await saving, 'durable');
    assert.equal(closed, 1);
    const failing = queueStorage.add({ id: 'failed' });
    const rejected = assert.rejects(failing, /Antrean gagal disimpan/);
    await new Promise(resolve => setImmediate(resolve));
    transactions[1].onabort(); await rejected;
    assert.equal(closed, 2);
  } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});

test('atomic draft changes write/delete only after the guard succeeds and preserve the guard error on abort', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  const channel = Object.getOwnPropertyDescriptor(globalThis, 'BroadcastChannel');
  let value = { id: 'draft', revision: 1, attempted: false }; let transactions = 0;
  try {
    Object.defineProperty(globalThis, 'BroadcastChannel', { configurable: true, value: undefined });
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: { open() {
      const request = { result: { close() {}, transaction() {
        transactions++;
        const tx = { abort() { setImmediate(() => tx.onabort()); }, objectStore() { return {
          get() { const read = { result: structuredClone(value) }; setImmediate(() => { read.onsuccess(); }); return read; },
          put(next) { value = structuredClone(next); setImmediate(() => tx.oncomplete()); },
          delete() { value = undefined; setImmediate(() => tx.oncomplete()); },
        }; } };
        return tx;
      } } };
      setImmediate(() => request.onsuccess()); return request;
    } } });
    const { queueStorage } = loadModule('src/app/lib/offline-queue-storage.ts');
    await queueStorage.change('draft', current => ({ ...current, revision: 2 }));
    assert.equal(value.revision, 2);
    await assert.rejects(queueStorage.change('draft', () => { throw Error('Revision changed in another tab'); }), /Revision changed/);
    assert.equal(value.revision, 2);
    await queueStorage.change('draft', () => null);
    assert.equal(value, undefined); assert.equal(transactions, 3);
  } finally {
    for (const [key, original] of [['indexedDB', descriptor], ['BroadcastChannel', channel]]) {
      if (original) Object.defineProperty(globalThis, key, original); else delete globalThis[key];
    }
  }
});

test('outbox v2 upgrades an existing store in place with a unique target index', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  let indexed = false;
  try {
    Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: { open(_name, version) {
      assert.equal(version, 2);
      const store = { indexNames: { contains: () => false }, createIndex(name, key, options) { assert.equal(name, 'targetKey'); assert.equal(key, 'targetKey'); assert.equal(options.unique, true); indexed = true; } };
      const db = { objectStoreNames: { contains: () => true }, close() {},
        createObjectStore() { assert.fail('must preserve existing drafts'); },
        transaction() { const tx = { objectStore() { return { getAll() { const result = { result: [] }; setImmediate(() => tx.oncomplete()); return result; } }; } }; return tx; } };
      const request = { result: db, transaction: { objectStore: () => store } };
      setImmediate(() => { request.onupgradeneeded(); request.onsuccess(); }); return request;
    } } });
    const { queueStorage } = loadModule('src/app/lib/offline-queue-storage.ts');
    assert.deepEqual(await queueStorage.list(), []); assert.equal(indexed, true);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'indexedDB', descriptor); else delete globalThis.indexedDB; }
});
