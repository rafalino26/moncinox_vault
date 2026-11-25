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
