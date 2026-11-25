const test = require('node:test');
const assert = require('node:assert/strict');
const loadModule = require('./helpers/load-ts.cjs');
const { mergeTransactionHistory } = loadModule('src/app/lib/transaction-history.ts');
const { filterTransactions } = loadModule('src/app/lib/transaction-filters.ts');
const item = { id: 'pending', transaction: { jumlah: 25000, sumber: 'Saya', tipe: 'pengeluaran', tanggal: '2026-11-25T00:00:00Z', keterangan: 'Offline coffee' }, createdAt: Date.now(), state: 'waiting' };

test('history merges waiting rows without mutating committed balances/history inputs', () => {
  const committed = [{ ...item.transaction, id: 'saved', tanggal: new Date(item.transaction.tanggal), createdAt: new Date(0) }];
  const result = mergeTransactionHistory(committed, [item]);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'pending');
  assert.equal(result[0].syncState, 'waiting');
  assert.equal(committed.length, 1);
  assert.equal(committed[0].syncState, undefined);
  assert.equal(result[0].tanggal instanceof Date, true);
  assert.equal(filterTransactions(result, { rentang: 'semua', sumber: 'Saya' }).length, 2);
  assert.equal(filterTransactions(result, { rentang: 'semua', sumber: 'Pacar_Saya' }).length, 0);
});

test('server acknowledgement with a local item still present shows one row and preserves server edits', () => {
  const saved = { ...item.transaction, id: item.id, keterangan: 'Edited by partner', jumlah: 30000, tanggal: new Date(item.transaction.tanggal), createdAt: new Date(item.createdAt) };
  const result = mergeTransactionHistory([saved], [item]);
  assert.equal(result.length, 1);
  assert.equal(result[0].jumlah, 30000);
  assert.equal(result[0].keterangan, 'Edited by partner');
  assert.equal(result[0].syncState, 'waiting');
  assert.equal(mergeTransactionHistory([saved], [])[0].syncState, undefined);
});

test('blocked delivery keeps its error visible on the affected history row', () => {
  const result = mergeTransactionHistory([], [{ ...item, state: 'blocked', error: 'Perlu diperiksa' }]);
  assert.equal(result[0].syncState, 'blocked');
  assert.equal(result[0].syncError, 'Perlu diperiksa');
});

test('pending expense rows show clock/status and cannot edit or delete a record not committed yet', () => {
  const table = loadModule('src/app/pengeluaran/components/PengeluaranTable.tsx').default;
  const pending = mergeTransactionHistory([], [item]);
  const element = table({ data: pending, onDelete: () => assert.fail(), onEdit: () => assert.fail(), totalPengeluaran: 0, totalTabungan: 0 });
  const nodes = [];
  const visit = value => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    nodes.push(value); visit(value.props?.children);
  };
  visit(element);
  assert.equal(nodes.filter(node => node.type === 'button').length, 0);
  assert.ok(nodes.some(node => node.props?.className?.includes('history-pending')));
  assert.ok(nodes.some(node => node.props?.children === 'Belum tersinkron'));
});
