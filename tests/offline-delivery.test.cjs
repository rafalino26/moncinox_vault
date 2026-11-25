const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const loadModule = require('./helpers/load-ts.cjs');

const payload = () => ({ id: randomUUID(), transaction: { jumlah: 25000, sumber: 'Saya', tipe: 'pengeluaran', tanggal: '2026-11-25', keterangan: 'Kopi' } });

function server() {
  let state = { receipts: new Map(), transactions: new Map(), balance: 100000 };
  let tail = Promise.resolve(); let calls = 0; let failReceipt = false;
  const prisma = { $transaction(callback) {
    calls++;
    // Simulate PostgreSQL advisory-lock serialization and atomic rollback.
    const pending = tail.then(async () => {
      const draft = structuredClone(state); let locked = false;
      const result = await callback({
        $executeRaw: async (strings, id) => { assert.match(strings.join('?'), /pg_advisory_xact_lock/); assert.ok(id); locked = true; },
        offlineTransactionReceipt: {
          findUnique: async ({ where }) => { assert.ok(locked); return draft.receipts.get(where.id); },
          create: async ({ data }) => { if (failReceipt) throw Error('receipt failed'); draft.receipts.set(data.id, data); return data; },
        },
        transaction: { create: async ({ data }) => { assert.ok(locked); assert.equal(draft.transactions.has(data.id), false); draft.transactions.set(data.id, data); return data; } },
        wallet: { update: async ({ data }) => { draft.balance -= data.balance.decrement; return { balance: draft.balance }; } },
      });
      state = draft; return result;
    });
    tail = pending.catch(() => {}); return pending;
  } };
  const { deliverOfflineTransaction: deliver } = loadModule('src/app/lib/offline-delivery.ts', { './prisma': prisma });
  return { deliver, state: () => state, calls: () => calls, failReceipt: () => { failReceipt = true; } };
}

test('same ID submitted concurrently creates one record and deducts wallet once', async () => {
  const app = server(); const item = payload();
  const results = await Promise.all([app.deliver(item), app.deliver(item), app.deliver(item)]);
  assert.equal(results.filter(result => result.status === 201).length, 1);
  assert.equal(results.filter(result => result.duplicate).length, 2);
  assert.equal(app.state().balance, 75000); assert.equal(app.state().transactions.size, 1); assert.equal(app.state().receipts.size, 1);
});

test('receipt survives deletion and replay never resurrects a removed transaction', async () => {
  const app = server(); const item = payload(); await app.deliver(item);
  app.state().transactions.delete(item.id); app.state().balance += item.transaction.jumlah;
  const replay = await app.deliver(item);
  assert.equal(replay.status, 200); assert.equal(app.state().transactions.size, 0); assert.equal(app.state().balance, 100000);
});

test('different payload under an existing ID is rejected without touching the wallet', async () => {
  const app = server(); const item = payload(); await app.deliver(item);
  const conflict = await app.deliver({ ...item, transaction: { ...item.transaction, jumlah: 50000 } });
  assert.equal(conflict.status, 409); assert.equal(app.state().balance, 75000);
});

test('receipt failure rolls back the transaction and wallet deduction together', async () => {
  const app = server(); app.failReceipt();
  await assert.rejects(app.deliver(payload()), /receipt failed/);
  assert.equal(app.state().balance, 100000); assert.equal(app.state().transactions.size, 0);
});

test('invalid delivery IDs, amounts and dates fail before database access', async () => {
  const app = server();
  for (const data of [null, { ...payload(), id: 'bad' }, { ...payload(), transaction: { ...payload().transaction, jumlah: -1 } }, { ...payload(), transaction: { ...payload().transaction, tanggal: '2026-02-30' } }]) assert.equal((await app.deliver(data)).status, 400);
  assert.equal(app.calls(), 0);
});

test('HTTP endpoint returns retryable temporary failures and never claims success for malformed input', async () => {
  let fail = false;
  const route = loadModule('src/app/api/web/offline-transactions/route.ts', { '@/app/lib/offline-delivery': { deliverOfflineTransaction: async () => { if (fail) throw Error('db down'); return { status: 400, error: 'invalid' }; } } });
  assert.equal((await route.POST(new Request('https://vault.test/api/web/offline-transactions', { method: 'POST', body: 'bad JSON' }))).status, 400);
  fail = true;
  const response = await route.POST(new Request('https://vault.test/api/web/offline-transactions', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 503); assert.ok((await response.json()).error);
});
