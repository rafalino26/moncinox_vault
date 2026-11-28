const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const loadModule = require('./helpers/load-ts.cjs');

const payload = () => ({ id: randomUUID(), transaction: { jumlah: 25000, sumber: 'Saya', tipe: 'pengeluaran', tanggal: '2026-11-25', keterangan: 'Kopi' } });

function server() {
  let state = { receipts: new Map(), transactions: new Map(), income: new Map(), balance: 100000, wallets: { Saya: 100000, Pacar_Saya: 100000 } };
  let tail = Promise.resolve(); let calls = 0; let failReceipt = false;
  const prisma = { $transaction(callback) {
    calls++;
    // Simulate PostgreSQL advisory-lock serialization and atomic rollback.
    const pending = tail.then(async () => {
      const draft = structuredClone(state); let locked = false;
      const result = await callback({
        $executeRaw: async (strings, id) => { assert.match(strings.join('?'), /pg_advisory_xact_lock/); assert.ok(id); locked = true; },
        $queryRaw: async () => [],
        offlineTransactionReceipt: {
          findUnique: async ({ where }) => { assert.ok(locked); return draft.receipts.get(where.id); },
          create: async ({ data }) => { if (failReceipt) throw Error('receipt failed'); draft.receipts.set(data.id, data); return data; },
        },
        transaction: {
          create: async ({ data }) => { assert.ok(locked); assert.equal(draft.transactions.has(data.id), false); draft.transactions.set(data.id, data); return data; },
          findUnique: async ({ where }) => draft.transactions.get(where.id),
          update: async ({ where, data }) => { const next = { ...draft.transactions.get(where.id), ...data }; draft.transactions.set(where.id, next); return next; },
          delete: async ({ where }) => { const row = draft.transactions.get(where.id); draft.transactions.delete(where.id); return row; },
        },
        pemasukan: {
          create: async ({ data }) => { draft.income.set(data.id, data); return data; },
          findUnique: async ({ where }) => draft.income.get(where.id),
          delete: async ({ where }) => { const row = draft.income.get(where.id); draft.income.delete(where.id); return row; },
        },
        wallet: { update: async ({ data, where }) => { const delta = data.balance.increment || -(data.balance.decrement || 0); draft.wallets[where.person] += delta; draft.balance = draft.wallets.Saya; return { balance: draft.wallets[where.person] }; } },
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

test('offline edit moves money between the correct wallets once and replay is idempotent', async () => {
  const app = server(); const original = payload(); await app.deliver(original);
  const edit = { id: randomUUID(), kind: 'update', target: { id: original.id, expected: original.transaction }, transaction: { ...original.transaction, sumber: 'Pacar_Saya', jumlah: 40000 } };
  assert.equal((await app.deliver(edit)).status, 201);
  assert.equal(app.state().wallets.Saya, 100000); assert.equal(app.state().wallets.Pacar_Saya, 60000);
  assert.equal((await app.deliver(edit)).status, 200);
  assert.equal(app.state().wallets.Pacar_Saya, 60000);
});

test('offline delete refunds only once; stale partner edits/deletes are rejected without changing balances', async () => {
  const app = server(); const original = payload(); await app.deliver(original);
  app.state().transactions.get(original.id).keterangan = 'Changed by partner';
  const stale = { id: randomUUID(), kind: 'delete', transaction: original.transaction, target: { id: original.id, expected: original.transaction } };
  const conflict = await app.deliver(stale); assert.equal(conflict.status, 409); assert.equal(conflict.code, 'CONFLICT');
  assert.equal(app.state().balance, 75000);
  const remove = { ...stale, id: randomUUID(), target: { ...stale.target, expected: { ...original.transaction, keterangan: 'Changed by partner' } } };
  assert.equal((await app.deliver(remove)).status, 201); assert.equal(app.state().balance, 100000);
  assert.equal((await app.deliver(remove)).status, 200); assert.equal(app.state().balance, 100000);
  assert.equal((await app.deliver({ ...remove, id: randomUUID() })).status, 409);
});

test('income creation/deletion are atomic, replay-safe, and cannot delete a changed income snapshot', async () => {
  const app = server(); const create = { ...payload(), kind: 'income-create' };
  assert.equal((await app.deliver(create)).status, 201); assert.equal(app.state().balance, 125000);
  assert.equal((await app.deliver(create)).status, 200); assert.equal(app.state().balance, 125000);
  const remove = { ...payload(), kind: 'income-delete', target: { id: create.id, expected: create.transaction } };
  assert.equal((await app.deliver({ ...remove, target: { ...remove.target, expected: { ...create.transaction, jumlah: 1 } } })).status, 409);
  assert.equal(app.state().balance, 125000);
  assert.equal((await app.deliver(remove)).status, 201); assert.equal(app.state().balance, 100000);
  assert.equal((await app.deliver(remove)).status, 200); assert.equal(app.state().balance, 100000);
});

test('two different offline edits based on the same snapshot cannot both change a shared balance', async () => {
  const app = server(); const original = payload(); await app.deliver(original);
  const makeEdit = jumlah => ({ id: randomUUID(), kind: 'update', target: { id: original.id, expected: original.transaction }, transaction: { ...original.transaction, jumlah } });
  const results = await Promise.all([app.deliver(makeEdit(40000)), app.deliver(makeEdit(50000))]);
  assert.equal(results.filter(result => result.status === 201).length, 1);
  assert.equal(results.filter(result => result.status === 409).length, 1);
  assert.equal(app.state().balance, 60000);
});
