import type { Transaction, Pemasukan } from '@prisma/client';
import type { QueuedTransaction, PendingInput, MutationKind } from './offline-queue';

export type SyncFields = { syncState?: 'waiting' | 'blocked'; syncError?: string; syncEditable?: boolean; syncRevision?: number; syncQueueId?: string; syncKind?: MutationKind; syncRejected?: boolean };
export type HistoryTransaction = Transaction & SyncFields;
export type HistoryIncome = Pemasukan & SyncFields;
export const transactionInput = (row: Transaction): PendingInput => ({ jumlah: row.jumlah, sumber: row.sumber, tipe: row.tipe, tanggal: new Date(row.tanggal).toISOString(), keterangan: row.keterangan });
export const incomeInput = (row: Pemasukan): PendingInput => ({ jumlah: row.jumlah, sumber: row.sumber, tipe: 'pengeluaran', tanggal: new Date(row.createdAt).toISOString(), keterangan: 'Uang saku' });
const fields = (item: QueuedTransaction, editable: boolean): SyncFields => ({ syncState: item.state, syncError: item.error, syncEditable: editable,
  syncRevision: item.revision, syncQueueId: item.id, syncKind: item.kind || 'create', syncRejected: item.rejected });
export function mergeTransactionHistory(committed: Transaction[], queued: QueuedTransaction[]): HistoryTransaction[] {
  const pending = new Map(queued.filter(item => !item.kind?.startsWith('income')).map(item => [item.target?.id || item.id, item]));
  const rows: HistoryTransaction[] = committed.map(row => {
    const item = pending.get(row.id); pending.delete(row.id);
    if (!item) return row;
    return { ...row, ...(item.kind === 'update' ? { ...item.transaction, tanggal: new Date(item.transaction.tanggal) } : {}),
      ...fields(item, !!item.target && item.attempted === false) };
  });
  for (const [id, item] of pending) rows.push({ ...item.transaction, id, tanggal: new Date(item.transaction.tanggal), createdAt: new Date(item.createdAt), ...fields(item, item.attempted === false) });
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function mergeIncomeHistory(committed: Pemasukan[], queued: QueuedTransaction[]): HistoryIncome[] {
  const pending = new Map(queued.filter(item => item.kind?.startsWith('income')).map(item => [item.target?.id || item.id, item]));
  const rows: HistoryIncome[] = committed.map(row => {
    const item = pending.get(row.id); pending.delete(row.id);
    return item ? { ...row, ...fields(item, !!item.target && item.attempted === false) } : row;
  });
  for (const [id, item] of pending) rows.push({ id, jumlah: item.transaction.jumlah, sumber: item.transaction.sumber,
    createdAt: new Date(item.transaction.tanggal), ...fields(item, item.attempted === false) });
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function syncLabel(row: SyncFields) {
  if (row.syncState === 'blocked') return 'Perlu diperiksa';
  if (row.syncKind === 'delete' || row.syncKind === 'income-delete') return 'Menunggu penghapusan';
  if (row.syncKind === 'update') return 'Perubahan belum tersinkron';
  return 'Belum tersinkron';
}
