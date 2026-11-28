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

test('offline update/delete proposals replace the displayed target without duplicating committed rows', () => {
  const server = { ...item.transaction, id: 'target', tanggal: new Date(item.transaction.tanggal), createdAt: new Date(0) };
  const edit = { ...item, id: 'edit-op', kind: 'update', target: { id: server.id, expected: item.transaction }, transaction: { ...item.transaction, jumlah: 50000 }, attempted: false, revision: 1 };
  const merged = mergeTransactionHistory([server], [edit]);
  assert.equal(merged.length, 1); assert.equal(merged[0].jumlah, 50000); assert.equal(merged[0].syncQueueId, 'edit-op');
  assert.equal(server.jumlah, 25000); assert.equal(merged[0].syncEditable, true);
  const remove = mergeTransactionHistory([server], [{ ...edit, kind: 'delete' }]);
  assert.equal(remove[0].jumlah, 25000); assert.equal(remove[0].syncKind, 'delete');
});

test('income and transaction pending histories stay separate and income acknowledgement has no duplicate', () => {
  const { mergeIncomeHistory } = loadModule('src/app/lib/transaction-history.ts');
  const income = { ...item, kind: 'income-create', attempted: false, revision: 1 };
  assert.equal(mergeTransactionHistory([], [income]).length, 0);
  assert.equal(mergeIncomeHistory([], [item]).length, 0);
  assert.equal(mergeIncomeHistory([], [income])[0].syncEditable, true);
  const server = { id: income.id, jumlah: 25000, sumber: 'Saya', createdAt: new Date(item.transaction.tanggal) };
  const rows = mergeIncomeHistory([server], [income]);
  assert.equal(rows.length, 1); assert.equal(rows[0].syncEditable, false);
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

test('only known unsent local drafts have edit permission; server rows and legacy items stay locked', () => {
  const draft = { ...item, attempted: false, revision: 1 };
  assert.equal(mergeTransactionHistory([], [draft])[0].syncEditable, true);
  assert.equal(mergeTransactionHistory([], [{ ...draft, attempted: true }])[0].syncEditable, false);
  assert.equal(mergeTransactionHistory([], [item])[0].syncEditable, false);
  const server = { ...item.transaction, id: item.id, tanggal: new Date(item.transaction.tanggal), createdAt: new Date(item.createdAt) };
  assert.equal(mergeTransactionHistory([server], [draft])[0].syncEditable, false);
});

test('pending expense rows show clock/status and cannot edit or delete a record not committed yet', () => {
  const table = loadModule('src/app/pengeluaran/components/PengeluaranTable.tsx', { '../../components/QueuedTransactionActions': () => null }).default;
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
