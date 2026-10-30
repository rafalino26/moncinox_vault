const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-ts.cjs');
const { buildLedgerChart, filterIncome, incomeEntries, transactionEntries } = load('src/app/lib/ledger.ts');
const React = require('react');

const rows = [
  { id: 'first', jumlah: 100000, sumber: 'Saya', createdAt: new Date(2026, 9, 26, 9) },
  { id: 'second', jumlah: 40000, sumber: 'Pacar_Saya', createdAt: new Date(2026, 9, 27, 9) },
  { id: 'old', jumlah: 300000, sumber: 'Saya', createdAt: new Date(2025, 0, 1) },
];

test('income filters use real income dates, source and amount ordering without changing input', () => {
  const result = filterIncome(rows, { rentang: 'bulanan', urutkan: 'terbesar' }, new Date(2026, 9, 30));
  assert.deepEqual(result.map(row => row.id), ['first', 'second']);
  assert.equal(result[0], rows[0]);
  assert.deepEqual(filterIncome(rows, { rentang: 'semua', sumber: 'Pacar_Saya' }).map(row => row.id), ['second']);
  assert.equal(filterIncome(rows, { rentang: 'semua' }).length, 3);
  assert.deepEqual(filterIncome(rows, { rentang: 'custom', from: '', to: '' }), []);
});

test('income person chart totals match the full filtered history', () => {
  const chart = buildLedgerChart(incomeEntries(rows), 'orang', 'hari');
  assert.equal(chart.values.reduce((a, b) => a + b, 0), 440000);
  assert.deepEqual(Object.fromEntries(chart.labels.map((label, index) => [label, chart.values[index]])), { Miskasw: 40000, Puskasw: 400000 });
});

test('weekly charts group on Monday and monthly charts keep different years separate', () => {
  const entries = incomeEntries(rows);
  const week = buildLedgerChart(entries.slice(0, 2), 'tren', 'minggu');
  assert.equal(week.labels.length, 1);
  assert.deepEqual(week.values, [140000]);
  const month = buildLedgerChart(entries, 'tren', 'bulan');
  assert.deepEqual(month.values, [300000, 140000]);
});

test('expense chart distinguishes savings from expenses without treating savings as income', () => {
  const expenses = rows.slice(0, 2).map((row, index) => ({ ...row, tanggal: row.createdAt, keterangan: 'Test', tipe: index ? 'tabungan' : 'pengeluaran' }));
  const chart = buildLedgerChart(transactionEntries(expenses), 'jenis', 'hari');
  assert.deepEqual(Object.fromEntries(chart.labels.map((label, index) => [label, chart.values[index]])), { Pengeluaran: 100000, Tabungan: 40000 });
});

test('redesigned transaction rows keep accessible edit/delete actions connected to the correct record', () => {
  const Table = load('src/app/pengeluaran/components/PengeluaranTable.tsx').default;
  const transaction = { ...rows[0], tanggal: rows[0].createdAt, tipe: 'pengeluaran', keterangan: 'Makan bareng' };
  const calls = [];
  const tree = Table({ data: [transaction], totalPengeluaran: transaction.jumlah, totalTabungan: 0,
    onEdit: record => calls.push(['edit', record]), onDelete: record => calls.push(['delete', record]) });
  const buttons = [];
  function walk(element) {
    if (!React.isValidElement(element)) return;
    if (element.type === 'button') buttons.push(element);
    React.Children.forEach(element.props.children, walk);
  }
  walk(tree);
  assert.equal(buttons.length, 2);
  assert.match(buttons[0].props['aria-label'], /Edit transaksi Makan bareng/);
  assert.match(buttons[1].props['aria-label'], /Hapus transaksi Makan bareng/);
  buttons[0].props.onClick();
  buttons[1].props.onClick();
  assert.deepEqual(calls, [['edit', transaction], ['delete', transaction]]);
});
