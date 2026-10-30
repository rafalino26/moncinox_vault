const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-ts.cjs');
const { TransactionSchema, IncomeSchema, TransactionFilterSchema } = load('src/app/lib/validation.ts');
const { groupTransactionsByDay } = load('src/app/lib/transaction-groups.ts');
const { filterTransactions, getSpendingSummary } = load('src/app/lib/transaction-filters.ts');
const { createResource } = load('src/app/lib/resource.ts');

const base = { id: 'test', keterangan: 'Makan', jumlah: 100, tanggal: new Date(2026, 9, 30),
  createdAt: new Date(2026, 9, 30), sumber: 'Saya', tipe: 'pengeluaran' };

test('web dates, Android ISO timestamps, and Date inputs are accepted without changing their instant', () => {
  for (const date of ['2026-10-30', '2026-10-30T10:15:00.000Z', '2026-10-30T10:15:00+07:00', new Date('2026-10-30')]) {
    const parsed = TransactionSchema.safeParse({ ...base, tanggal: date });
    assert.ok(parsed.success);
    assert.equal(parsed.data.tanggal.getTime(), new Date(date).getTime());
  }
});

test('invalid dates and coerced nonnumeric amounts are rejected before database access', () => {
  for (const date of ['', '2026-02-30', '2026-13-01', '2026-10-32', '2026-02-30T00:00:00Z', new Date(NaN), null, 123]) {
    assert.equal(TransactionSchema.safeParse({ ...base, tanggal: date }).success, false);
  }
  for (const jumlah of [true, false, null, [], {}, '', ' ', -1, 0, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(TransactionSchema.safeParse({ ...base, jumlah }).success, false);
    assert.equal(IncomeSchema.safeParse({ person: 'Saya', amount: jumlah }).success, false);
  }
  assert.equal(TransactionSchema.safeParse({ ...base, keterangan: '   ' }).success, false);
  assert.equal(TransactionSchema.parse({ ...base, keterangan: '  Makan  ', jumlah: '1000' }).keterangan, 'Makan');
});

test('incomplete, reversed, or invalid custom date ranges never expose the entire history', () => {
  for (const filters of [
    { rentang: 'custom' },
    { rentang: 'custom', from: '2026-10-01' },
    { rentang: 'custom', from: '2026-10-30', to: '2026-10-01' },
    { rentang: 'custom', from: '2026-02-30', to: '2026-10-30' },
  ]) {
    assert.deepEqual(filterTransactions([base], filters), []);
    assert.equal(TransactionFilterSchema.safeParse(filters).success, false);
  }
});

test('day grouping is chronological regardless of amount sort and keeps different years separate', () => {
  const data = [
    { ...base, tanggal: new Date(2026, 0, 1), jumlah: 500 },
    { ...base, tanggal: new Date(2025, 0, 1), jumlah: 100 },
    { ...base, tanggal: new Date(2026, 0, 1), jumlah: 200, sumber: 'Pacar_Saya', tipe: 'tabungan' },
  ];
  const days = groupTransactionsByDay(data);
  assert.deepEqual(days.map(day => day.dateKey), ['2025-01-01', '2026-01-01']);
  assert.equal(days[1].total, 700);
  assert.equal(days[1].pengeluaran, 500);
  assert.equal(days[1].tabungan, 200);
  assert.equal(days[1].monik, 200);
});

test('seven-day summary includes today plus six days and excludes future dates', () => {
  const now = new Date(2026, 9, 30, 12);
  const data = [
    base,
    { ...base, tanggal: new Date(2026, 9, 24), jumlah: 200 },
    { ...base, tanggal: new Date(2026, 9, 23, 23), jumlah: 500 },
    { ...base, tanggal: new Date(2026, 9, 31), jumlah: 1000 },
  ];
  assert.equal(getSpendingSummary(data, 'all', 'weekly', now).expense, 300);
  assert.equal(getSpendingSummary(data, 'all', 'daily', now).expense, 100);
  assert.equal(getSpendingSummary(data, 'all', 'all', now).expense, 1800);
});

test('reconnect retries a failed initial resource instead of requiring a manual page reload', async () => {
  let fail = true;
  const resource = createResource(async () => {
    if (fail) throw new Error('offline');
    return ['recovered'];
  });
  await resource.load();
  fail = false;
  resource.revalidateIfLoaded();
  await resource.load();
  assert.deepEqual(resource.getSnapshot().data, ['recovered']);
  assert.equal(resource.getSnapshot().error, null);
});

test('simultaneous edits cannot both reverse the same old wallet amount', async () => {
  let stored = { ...base };
  let balance = 1000;
  let reads = 0;
  let releaseReads;
  const barrier = new Promise(resolve => { releaseReads = resolve; });
  const actions = load('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { $transaction: callback => callback({
      transaction: {
        findUnique: async () => {
          const snapshot = { ...stored };
          if (++reads === 2) releaseReads();
          await barrier;
          return snapshot;
        },
        updateMany: async ({ where, data }) => {
          if (stored.jumlah !== where.jumlah) return { count: 0 };
          stored = { ...stored, ...data };
          return { count: 1 };
        },
      },
      wallet: { update: async ({ data }) => {
        balance += data.balance.increment;
        return { id: 'wallet', person: 'Saya', balance };
      } },
    }) },
  });
  const results = await Promise.all([
    actions.updateTransaction('test', { ...base, jumlah: 200 }),
    actions.updateTransaction('test', { ...base, jumlah: 300 }),
  ]);
  assert.equal(results.filter(result => result.success).length, 1);
  assert.match(results.find(result => result.error).error, /berubah/);
  assert.equal(balance, 1000 + 100 - stored.jumlah);
});

test('edits within the same wallet use one net balance update and lock the record first', async () => {
  const operations = [];
  const actions = load('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { $transaction: callback => callback({
      transaction: { findUnique: async () => base, updateMany: async () => {
        operations.push('record'); return { count: 1 };
      } },
      wallet: { update: async ({ data }) => {
        operations.push(data.balance.increment);
        return { id: 'wallet', person: 'Saya', balance: 950 };
      } },
    }) },
  });
  assert.ok((await actions.updateTransaction('test', { ...base, jumlah: 150 })).success);
  assert.deepEqual(operations, ['record', -50]);
});

test('invalid deletion IDs are rejected before reaching the database', async () => {
  const actions = load('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { $transaction: () => assert.fail('invalid ID reached the database') },
  });
  assert.ok((await actions.deleteTransaction('')).error);
  assert.ok((await actions.deletePemasukan('')).error);
});

test('delete refunds the actual deleted record and never uses an earlier stale read', async () => {
  const operations = [];
  const actions = load('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { $transaction: callback => callback({
      transaction: { delete: async () => { operations.push('delete'); return { ...base, jumlah: 350, sumber: 'Pacar_Saya' }; } },
      wallet: { update: async args => {
        operations.push(args);
        return { id: 'wallet', person: 'Pacar_Saya', balance: 1350 };
      } },
    }) },
  });
  const result = await actions.deleteTransaction('test');
  assert.ok(result.success);
  assert.equal(operations[0], 'delete');
  assert.deepEqual(operations[1], { where: { person: 'Pacar_Saya' }, data: { balance: { increment: 350 } } });
});

test('dashboard API starts independent queries concurrently and uses an exclusive next-month boundary', async () => {
  let started = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const query = async value => { started++; await gate; return value; };
  const actions = load('src/app/actions/transactionActions.ts', {
    '../lib/prisma': { transaction: {
      aggregate: ({ where }) => {
        assert.equal(where.tanggal.lt.getDate(), 1);
        assert.equal(where.tanggal.lt.getHours(), 0);
        assert.equal(where.tanggal.lte, undefined);
        return query({ _sum: { jumlah: where.tipe === 'pengeluaran' ? 500 : 200 } });
      },
      findFirst: () => query(base),
      findMany: () => query([base]),
    } },
  });
  const pending = actions.getDashboardStats();
  assert.equal(started, 4);
  release();
  const result = await pending;
  assert.equal(result.totalPengeluaran, 500);
  assert.equal(result.arusKas, -300);
});

test('transaction HTTP API passes custom dates and amount sorting through to the query', async () => {
  let received;
  const route = load('src/app/api/transactions/route.ts', {
    '@/app/actions/transactionActions': { getFilteredTransactions: async filters => { received = filters; return []; } },
  });
  const response = await route.GET(new Request('http://localhost/api/transactions?rentang=custom&from=2026-01-01&to=2026-02-01&urutkan=terbesar&sumber=semua'));
  assert.equal(response.status, 200);
  assert.deepEqual(received, { rentang: 'custom', from: '2026-01-01', to: '2026-02-01', urutkan: 'terbesar', sumber: undefined, tipe: undefined });
});

test('malformed transaction JSON and invalid query parameters return 400 before touching the database', async () => {
  const route = load('src/app/api/transactions/route.ts', {
    '@/app/actions/transactionActions': new Proxy({}, { get: () => () => assert.fail('invalid input reached the action') }),
  });
  for (const body of ['null', '{', '[]', '{"jumlah":true}']) {
    const response = await route.POST(new Request('http://localhost/api/transactions', { method: 'POST', body }));
    assert.equal(response.status, 400);
  }
  assert.equal((await route.GET(new Request('http://localhost/api/transactions?rentang=garbage'))).status, 400);
});

test('a database outage returns 503 instead of a successful empty income history', async () => {
  const route = load('src/app/api/pemasukan/route.ts', {
    '@/app/actions/transactionActions': { getPemasukanHistory: async () => { throw new Error('database unavailable'); } },
  });
  const response = await route.GET();
  assert.equal(response.status, 503);
  assert.ok((await response.json()).error);
});
