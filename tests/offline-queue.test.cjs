const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const loadModule = require('./helpers/load-ts.cjs');
const { createOfflineQueue } = loadModule('src/app/lib/offline-queue.ts');

const input = { jumlah: 25000, sumber: 'Saya', tipe: 'pengeluaran', tanggal: '2026-11-25', keterangan: 'Kopi' };
function storage(initial = []) {
  const items = new Map(initial.map(item => [item.id, structuredClone(item)]));
  return { items, list: async () => [...items.values()].map(item => structuredClone(item)),
    add: async item => { assert.equal(items.has(item.id), false); items.set(item.id, structuredClone(item)); },
    put: async item => { items.set(item.id, structuredClone(item)); }, remove: async id => { items.delete(id); } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('offline enqueue commits locally before success, survives remount, and never calls the network offline', async () => {
  const disk = storage();
  let writes = 0;
  const queue = createOfflineQueue(disk, async () => { writes++; }, async () => {}, () => false);
  const saved = await queue.enqueue(input);
  assert.ok(saved.id);
  assert.equal(disk.items.size, 1);
  assert.equal(queue.getSnapshot().items[0].state, 'waiting');
  await queue.sync(); assert.equal(writes, 0);
  const reopened = createOfflineQueue(disk, async () => { writes++; return { ok: true }; }, async () => {}, () => true);
  await reopened.reload(); assert.equal(reopened.getSnapshot().items[0].id, saved.id);
  await reopened.sync(); assert.equal(writes, 1); assert.equal(disk.items.size, 0);
  assert.ok(reopened.getSnapshot().lastSynced);
});

test('quota failures and invalid data leave the form unsaved instead of showing false success', async () => {
  const disk = storage(); disk.add = async () => { throw Error('QuotaExceeded'); };
  const queue = createOfflineQueue(disk, async () => assert.fail(), async () => {}, () => false);
  await assert.rejects(queue.enqueue(input), /QuotaExceeded/);
  await assert.rejects(queue.enqueue({ ...input, jumlah: -1 }), /tidak valid/);
  await assert.rejects(queue.enqueue({ ...input, tanggal: '2026-02-30' }), /tidak valid/);
  assert.equal(queue.getSnapshot().items.length, 0);
});

test('lost server response retries the exact same ID and payload; simultaneous sync callers share a batch', async () => {
  const disk = storage(); const attempts = []; let balance = 100000; const delivered = new Set();
  const queue = createOfflineQueue(disk, async item => {
    attempts.push(structuredClone(item));
    if (!delivered.has(item.id)) { delivered.add(item.id); balance -= item.transaction.jumlah; throw Error('response lost'); }
    return { ok: true };
  }, async () => {}, () => true);
  await queue.enqueue(input);
  const first = queue.sync(); assert.equal(queue.sync(), first); await first;
  assert.equal(disk.items.size, 1); assert.equal(balance, 75000);
  await queue.sync();
  assert.equal(balance, 75000); assert.equal(disk.items.size, 0);
  assert.equal(attempts[0].id, attempts[1].id);
  assert.deepEqual(attempts[0].transaction, attempts[1].transaction);
});

test('partial sync keeps unacknowledged items and resumes after connectivity returns', async () => {
  const disk = storage(); let online = true; let calls = 0;
  const queue = createOfflineQueue(disk, async () => { calls++; online = false; return { ok: true }; }, async () => {}, () => online);
  await queue.enqueue(input); await queue.enqueue({ ...input, keterangan: 'Makan' });
  await queue.sync(); assert.equal(calls, 1); assert.equal(disk.items.size, 1);
  online = true; await queue.sync(); assert.equal(calls, 2); assert.equal(disk.items.size, 0);
});

test('permanent validation/conflict failures remain visible, are not endlessly retried, and permit explicit retry', async () => {
  const disk = storage(); let calls = 0; let valid = false;
  const queue = createOfflineQueue(disk, async () => { calls++; return valid ? { ok: true } : { ok: false, retryable: false, error: 'Perlu diperiksa' }; }, async () => {}, () => true);
  const saved = await queue.enqueue(input); await queue.sync();
  assert.equal(queue.getSnapshot().items[0].state, 'blocked');
  await queue.sync(); assert.equal(calls, 1);
  valid = true; await queue.retryBlocked(saved.id);
  assert.equal(calls, 2); assert.equal(disk.items.size, 0);
});

test('failed refresh or failed local acknowledgement retains the delivery ID for safe retry', async () => {
  const disk = storage(); let refreshFailed = true; let deleteFailed = true; const ids = [];
  const remove = disk.remove;
  disk.remove = async id => { if (deleteFailed) throw Error('disk failed'); return remove(id); };
  const queue = createOfflineQueue(disk, async item => { ids.push(item.id); return { ok: true }; }, async () => { if (refreshFailed) throw Error('refresh failed'); }, () => true);
  await queue.enqueue(input); await queue.sync(); assert.equal(disk.items.size, 1);
  refreshFailed = false; await queue.sync(); assert.equal(disk.items.size, 1);
  deleteFailed = false; await queue.sync(); assert.equal(disk.items.size, 0);
  assert.equal(new Set(ids).size, 1);
});

test('items added while a batch is running are retained for the next batch', async () => {
  const disk = storage(); let release; const gate = new Promise(resolve => { release = resolve; });
  const queue = createOfflineQueue(disk, async () => { await gate; return { ok: true }; }, async () => {}, () => true);
  await queue.enqueue(input); const syncing = queue.sync(); await tick();
  await queue.enqueue({ ...input, keterangan: 'Later' }); release(); await syncing;
  await queue.sync(); assert.equal(disk.items.size, 0);
});

test('corrupt local entries stop automatic delivery and are not erased', async () => {
  const disk = storage([{ id: randomUUID(), transaction: { ...input, jumlah: NaN }, createdAt: Date.now(), state: 'waiting' }]);
  const queue = createOfflineQueue(disk, async () => assert.fail('must not send corrupt data'), async () => {}, () => true);
  await queue.sync(); assert.ok(queue.getSnapshot().error); assert.equal(disk.items.size, 1);
});

test('after acknowledgement, a GET started before the write cannot satisfy the committed refresh', async () => {
  const { createResource } = loadModule('src/app/lib/resource.ts');
  let release; let calls = 0;
  const stale = new Promise(resolve => { release = resolve; });
  const resource = createResource(() => ++calls === 1 ? stale : Promise.resolve(['committed']));
  const oldRead = resource.load(); await tick();
  const refresh = resource.refreshAfterWrite();
  release(['before-write']); await oldRead; await refresh;
  assert.deepEqual(resource.getSnapshot().data, ['committed']);
  assert.equal(calls, 2);
});
