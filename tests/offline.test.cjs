const test = require('node:test');
const assert = require('node:assert/strict');
const loadModule = require('./helpers/load-ts.cjs');
const { createResource } = loadModule('src/app/lib/resource.ts');
const { validRecord, createFinancePersistence } = require('../public/offline-store.js');

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const savedAt = Date.now() - 60000;
const record = data => ({ version: 1, updatedAt: savedAt, data });

test('offline reads restore saved data and its real timestamp instead of showing empty history', async () => {
  const resource = createResource(async () => { throw Error('offline'); }, 30000, {
    read: async () => record(['saved']), write: async () => assert.fail('must not persist failed reads'),
  });
  await resource.load();
  assert.deepEqual(resource.getSnapshot().data, ['saved']);
  assert.equal(resource.getSnapshot().lastUpdated, savedAt);
  assert.equal(resource.getSnapshot().fromCache, true);
  assert.equal(resource.getSnapshot().error, 'offline');
  assert.equal(resource.getServerSnapshot().data, undefined);
});

test('a slow disk read never delays the network or replaces fresh server data', async () => {
  const disk = deferred();
  const writes = [];
  const resource = createResource(async () => ['fresh'], 30000, { read: () => disk.promise, write: async value => writes.push(value) });
  await resource.load();
  assert.deepEqual(resource.getSnapshot().data, ['fresh']);
  disk.resolve(record(['old']));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(resource.getSnapshot().data, ['fresh']);
  assert.equal(resource.getSnapshot().fromCache, false);
  assert.deepEqual(writes[0].data, ['fresh']);
});

test('committed edits and deletion replace the persisted snapshot; late disk restore cannot undo them', async () => {
  const disk = deferred();
  const writes = [];
  const resource = createResource(async () => ['keep', 'delete'], 30000, { read: () => disk.promise, write: async value => writes.push(value) });
  await resource.load();
  resource.mutate(data => data.filter(value => value !== 'delete'));
  disk.resolve(record(['keep', 'delete']));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(resource.getSnapshot().data, ['keep']);
  assert.deepEqual(writes.at(-1).data, ['keep']);
});

test('reconnection revalidates saved data even when its disk timestamp is recent', async () => {
  let online = false;
  const resource = createResource(async () => { if (!online) throw Error('offline'); return ['latest']; }, 30000, {
    read: async () => record(['saved']), write: async () => {},
  });
  await resource.load();
  online = true;
  resource.revalidateIfLoaded();
  await resource.load();
  assert.deepEqual(resource.getSnapshot().data, ['latest']);
  assert.equal(resource.getSnapshot().fromCache, false);
  assert.equal(resource.getSnapshot().error, null);
});

test('unavailable or full storage never prevents successful reads or committed local updates', async () => {
  const resource = createResource(async () => ['saved'], 30000, {
    read: async () => { throw Error('blocked'); }, write: async () => { throw Error('quota'); },
  });
  await resource.load();
  resource.mutate(() => ['changed']);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(resource.getSnapshot().data, ['changed']);
  assert.equal(resource.getSnapshot().error, null);
});

test('snapshot validator rejects schema mismatches, corrupt amounts, wrong owners and invalid dates', () => {
  assert.equal(validRecord('income', record([])), true);
  assert.equal(validRecord('income', { ...record([]), version: 2 }), false);
  assert.equal(validRecord('income', { ...record([]), updatedAt: Date.now() + 86400000 }), false);
  assert.equal(validRecord('wallets', record({ rafaWallet: null, monikWallet: null })), true);
  assert.equal(validRecord('wallets', record({ rafaWallet: { id: '1', person: 'Pacar_Saya', balance: 100 }, monikWallet: null })), false);
  const transaction = { id: '1', jumlah: 100, sumber: 'Saya', createdAt: '2026-11-20T12:00:00Z', tanggal: '2026-11-20T12:00:00Z', tipe: 'pengeluaran', keterangan: '<script>unsafe</script>' };
  assert.equal(validRecord('transactions', record([transaction])), true);
  for (const change of [{ jumlah: Infinity }, { jumlah: -1 }, { tanggal: 'bad' }, { sumber: 'unknown' }, { tipe: 'unknown' }]) assert.equal(validRecord('transactions', record([{ ...transaction, ...change }])), false);
});

test('storage unavailable is reported to the reader rather than returning a fake empty list', async () => {
  await assert.rejects(createFinancePersistence('income').read(), /Penyimpanan offline tidak tersedia/);
});

test('write guard distinguishes known offline from an online connection', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const { offlineWriteError } = loadModule('src/app/lib/connection.ts');
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
    assert.match(offlineWriteError(), /hanya bisa dibaca/);
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
    assert.equal(offlineWriteError(), null);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); else delete globalThis.navigator; }
});
