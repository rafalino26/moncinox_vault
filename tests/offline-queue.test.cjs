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
    put: async item => { items.set(item.id, structuredClone(item)); }, remove: async id => { items.delete(id); },
    change: async (id, update) => {
      const next = update(structuredClone(items.get(id)));
      if (next === null) items.delete(id); else if (next !== undefined) items.set(id, structuredClone(next));
      return structuredClone(next);
    } };
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

test('an unsent draft can be edited offline with the same ID, and cancellation survives reopening', async () => {
  const disk = storage(); const queue = createOfflineQueue(disk, async () => assert.fail(), async () => {}, () => false);
  const saved = await queue.enqueue(input);
  await queue.edit(saved.id, { ...input, jumlah: 50000, sumber: 'Pacar_Saya' }, 1);
  const edited = queue.getSnapshot().items[0];
  assert.equal(edited.id, saved.id); assert.equal(edited.revision, 2); assert.equal(edited.transaction.jumlah, 50000);
  assert.equal(edited.attempted, false);
  await queue.cancel(saved.id, 2);
  const reopened = createOfflineQueue(disk, async () => assert.fail(), async () => {}, () => true);
  await reopened.sync(); assert.equal(reopened.getSnapshot().items.length, 0);
});

test('stale edit/cancel from a second tab cannot overwrite a newer local revision', async () => {
  const disk = storage(); const first = createOfflineQueue(disk, async () => assert.fail(), async () => {}, () => false);
  const second = createOfflineQueue(disk, async () => assert.fail(), async () => {}, () => false);
  const saved = await first.enqueue(input);
  await first.edit(saved.id, { ...input, jumlah: 50000 }, 1);
  await assert.rejects(second.edit(saved.id, { ...input, jumlah: 1000 }, 1), /tab lain/);
  await assert.rejects(second.cancel(saved.id, 1), /tab lain/);
  assert.equal(disk.items.get(saved.id).transaction.jumlah, 50000);
});

test('durable send claim prevents edits/cancel during flight and after an ambiguous lost response', async () => {
  const disk = storage(); let release;
  const gate = new Promise(resolve => { release = resolve; });
  const first = createOfflineQueue(disk, async () => { await gate; throw Error('lost response'); }, async () => {}, () => true);
  const second = createOfflineQueue(disk, async () => assert.fail(), async () => {}, () => false);
  const saved = await first.enqueue(input); const syncing = first.sync(); await tick();
  assert.equal(disk.items.get(saved.id).attempted, true);
  await assert.rejects(second.edit(saved.id, { ...input, jumlah: 1000 }, 1), /mulai dikirim/);
  await assert.rejects(second.cancel(saved.id, 1), /mulai dikirim/);
  release(); await syncing;
  await assert.rejects(second.cancel(saved.id, 1), /mulai dikirim/);
  assert.equal(disk.items.get(saved.id).transaction.jumlah, 25000);
});

test('sync reads the latest draft atomically and skips a draft canceled after batch enumeration', async () => {
  const disk = storage(); const sent = [];
  const queue = createOfflineQueue(disk, async item => { sent.push(item); return { ok: true }; }, async () => {}, () => true);
  const first = await queue.enqueue(input); const second = await queue.enqueue(input);
  const change = disk.change; let intercepted = false;
  disk.change = async (id, update) => {
    if (!intercepted) {
      intercepted = true;
      await change(first.id, current => ({ ...current, transaction: { ...current.transaction, jumlah: 50000 }, revision: 2 }));
      await change(second.id, () => null);
    }
    return change(id, update);
  };
  await queue.sync();
  assert.equal(sent.length, 1); assert.equal(sent[0].transaction.jumlah, 50000);
  assert.equal(disk.items.size, 0);
});

test('legacy queued records without an attempt flag are conservatively locked but can still sync', async () => {
  const disk = storage([{ id: randomUUID(), transaction: input, createdAt: Date.now(), state: 'waiting' }]);
  const queue = createOfflineQueue(disk, async () => ({ ok: true }), async () => {}, () => true);
  const id = [...disk.items.keys()][0];
  await assert.rejects(queue.edit(id, input, 1), /mulai dikirim/);
  await queue.sync(); assert.equal(disk.items.size, 0);
});

test('target mutation retains its original expected snapshot across local edits and retries', async () => {
  const disk = storage(); const attempts = [];
  const queue = createOfflineQueue(disk, async item => { attempts.push(structuredClone(item)); return { ok: false, retryable: true }; }, async () => {}, () => true);
  const original = { ...input, jumlah: 10000 };
  const item = await queue.enqueue(input, 'update', { id: 'server-row', expected: original });
  await queue.edit(item.id, { ...input, jumlah: 50000 }, 1);
  await queue.sync(); await queue.sync();
  assert.deepEqual(attempts[0].target.expected, { ...original, tanggal: '2026-11-25T00:00:00.000Z' });
  assert.equal(attempts[0].transaction.jumlah, 50000);
  assert.equal(attempts[0].id, attempts[1].id);
});

test('definitive conflict remains visible until explicitly discarded; ambiguous failures cannot be discarded', async () => {
  const disk = storage(); const queue = createOfflineQueue(disk, async () => ({ ok: false, retryable: false, rejected: true, error: 'Partner changed it' }), async () => {}, () => true);
  const item = await queue.enqueue(input, 'delete', { id: 'target', expected: input });
  await assert.rejects(queue.discardRejected(item.id), /belum dipastikan/);
  await queue.sync(); assert.equal(queue.getSnapshot().items[0].rejected, true);
  await queue.discardRejected(item.id); assert.equal(disk.items.size, 0);
});

test('transaction and income operations retain kind, target and fixed delivery ID through offline restore', async () => {
  for (const kind of ['update', 'delete', 'income-create', 'income-delete']) {
    const disk = storage(); const sent = [];
    const queue = createOfflineQueue(disk, async () => assert.fail('offline'), async () => {}, () => false);
    const target = kind === 'income-create' ? undefined : { id: `target-${kind}`, expected: input };
    const saved = await queue.enqueue(input, kind, target);
    const reopened = createOfflineQueue(disk, async item => { sent.push(item); return { ok: true }; }, async () => {}, () => true);
    await reopened.sync();
    assert.equal(sent[0].kind, kind); assert.equal(sent[0].id, saved.id);
    assert.equal(sent[0].target?.id, target?.id); assert.equal(disk.items.size, 0);
  }
});
