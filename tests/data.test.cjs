const { test } = require('node:test');
const assert = require('node:assert/strict');
const loadModule = require('./helpers/load-ts.cjs');
const { createResource } = loadModule('src/app/lib/resource.ts');
const { filterTransactions, getChartStats } = loadModule('src/app/lib/transaction-filters.ts');

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test('simultaneous readers share one request and route remounts reuse fresh data', async () => {
  const response = deferred();
  let requests = 0;
  const resource = createResource(() => { requests++; return response.promise; });
  const first = resource.load();
  assert.equal(resource.load(), first);
  await Promise.resolve();
  assert.equal(requests, 1);
  response.resolve(['transaction']);
  await first;
  await resource.load();
  assert.equal(requests, 1);
  assert.deepEqual(resource.getSnapshot().data, ['transaction']);
  assert.equal(resource.getServerSnapshot().data, undefined);
});

test('background refresh keeps existing data visible; a failure is retryable', async () => {
  let fail = false;
  const resource = createResource(async () => {
    if (fail) throw new Error('offline');
    return [1];
  });
  await resource.load();
  fail = true;
  const refreshing = resource.load(true);
  assert.deepEqual(resource.getSnapshot().data, [1]);
  assert.equal(resource.getSnapshot().isRefreshing, true);
  await refreshing;
  assert.deepEqual(resource.getSnapshot().data, [1]);
  assert.equal(resource.getSnapshot().error, 'offline');
  fail = false;
  await resource.load(true);
  assert.equal(resource.getSnapshot().error, null);
});

test('a read started before a write cannot restore a deleted transaction', async () => {
  const staleRead = deferred();
  const freshRead = deferred();
  let calls = 0;
  const resource = createResource(async () => {
    calls++;
    if (calls === 1) return ['keep', 'deleted'];
    return calls === 2 ? staleRead.promise : freshRead.promise;
  });
  await resource.load();
  const refreshing = resource.load(true);
  await Promise.resolve();
  resource.mutate(rows => rows.filter(row => row !== 'deleted'));
  staleRead.resolve(['keep', 'deleted']);
  await refreshing;
  assert.deepEqual(resource.getSnapshot().data, ['keep']);
  freshRead.resolve(['keep', 'external-write']);
  await resource.load();
  assert.deepEqual(resource.getSnapshot().data, ['keep', 'external-write']);
});

test('a write during the first read triggers a fresh read instead of caching an incomplete list', async () => {
  const first = deferred();
  let calls = 0;
  const resource = createResource(() => ++calls === 1 ? first.promise : Promise.resolve(['old', 'new']));
  const loading = resource.load();
  await Promise.resolve();
  resource.mutate(rows => [...rows, 'new']);
  first.resolve(['old']);
  await loading;
  await resource.load();
  assert.deepEqual(resource.getSnapshot().data, ['old', 'new']);
});

test('resources do not leak data across separate providers', async () => {
  const first = createResource(async () => ['private']);
  const second = createResource(async () => []);
  await first.load();
  assert.equal(second.getSnapshot().data, undefined);
});

test('initial request failures are not presented as an empty financial history', async () => {
  const resource = createResource(async () => { throw new Error('unavailable'); });
  await resource.load();
  assert.equal(resource.getSnapshot().data, undefined);
  assert.equal(resource.getSnapshot().error, 'unavailable');
  assert.equal(resource.getSnapshot().isRefreshing, false);
});

test('stale data reloads without clearing the cached list', async () => {
  let count = 0;
  const resource = createResource(async () => [++count], -1);
  await resource.load();
  const pending = resource.load();
  assert.deepEqual(resource.getSnapshot().data, [1]);
  await pending;
  assert.deepEqual(resource.getSnapshot().data, [2]);
});

const transaction = (id, date, jumlah = 100, sumber = 'Saya', tipe = 'pengeluaran') => ({
  id, tanggal: new Date(date), createdAt: new Date(date), jumlah, sumber, tipe, keterangan: id,
});
const now = new Date(2026, 9, 30, 12);
const rows = [
  transaction('today', new Date(2026, 9, 30, 9), 200),
  transaction('week', new Date(2026, 9, 26, 10), 300, 'Pacar_Saya'),
  transaction('month', new Date(2026, 9, 5, 10), 400, 'Saya', 'tabungan'),
  transaction('old', new Date(2025, 1, 1), 500),
];

test('day, Monday-based week, rolling month, and all-time filters keep their meaning', () => {
  assert.deepEqual(filterTransactions(rows, { rentang: 'harian' }, now).map(t => t.id), ['today']);
  assert.deepEqual(filterTransactions(rows, { rentang: 'mingguan' }, now).map(t => t.id), ['today', 'week']);
  assert.deepEqual(filterTransactions(rows, { rentang: 'bulanan' }, now).map(t => t.id), ['today', 'week', 'month']);
  assert.equal(filterTransactions(rows, { rentang: 'semua' }, now).length, 4);
});

test('custom range includes the entire final day and excludes the next midnight', () => {
  const data = [transaction('end', new Date(2026, 9, 30, 23, 59, 59)), transaction('next', new Date(2026, 9, 31))];
  assert.deepEqual(filterTransactions(data, { rentang: 'custom', from: '2026-10-30', to: '2026-10-30' }).map(t => t.id), ['end']);
});

test('source, type, sorting, and every record remain available without refetching', () => {
  assert.deepEqual(filterTransactions(rows, { rentang: 'semua', sumber: 'Pacar_Saya' }).map(t => t.id), ['week']);
  assert.deepEqual(filterTransactions(rows, { rentang: 'semua', tipe: 'tabungan' }).map(t => t.id), ['month']);
  assert.deepEqual(filterTransactions(rows, { rentang: 'semua', urutkan: 'terbesar' }).map(t => t.jumlah), [500, 400, 300, 200]);
  assert.equal(rows[0].id, 'today');
});

test('dashboard chart totals include the last day of the calendar month', () => {
  const stats = getChartStats([...rows, transaction('last', new Date(2026, 9, 31, 23), 50)], now);
  assert.equal(stats.totalPengeluaran, 550);
  assert.equal(stats.totalPemasukan, 400);
  assert.deepEqual(stats.weeklySpending.map(t => t.id), ['week', 'today', 'last']);
});

test('editing savings reverses the old deduction and applies the new deduction in the right wallets', async () => {
  const updates = [];
  const actions = loadModule('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { $transaction: async callback => callback({
      transaction: {
        findUnique: async () => rows[2],
        update: async ({ data }) => ({ ...rows[2], ...data }),
      },
      wallet: { update: async args => {
        updates.push(args);
        return { id: args.where.person, person: args.where.person, balance: 1000 };
      } },
    }) },
  });
  const result = await actions.updateTransaction('month', {
    tanggal: new Date(2026, 9, 30), jumlah: 600, sumber: 'Pacar_Saya', tipe: 'tabungan', keterangan: 'Edited',
  });
  assert.ok(result.success);
  assert.deepEqual(updates.map(update => update.data.balance), [{ increment: 400 }, { decrement: 600 }]);
  assert.deepEqual(result.wallets.map(wallet => wallet.person), ['Saya', 'Pacar_Saya']);
  assert.equal(result.transaction.jumlah, 600);
});
