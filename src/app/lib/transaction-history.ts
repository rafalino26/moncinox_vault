import type { Transaction } from '@prisma/client';
import type { QueuedTransaction } from './offline-queue';

export type HistoryTransaction = Transaction & { syncState?: 'waiting' | 'blocked'; syncError?: string; syncEditable?: boolean; syncRevision?: number };

// Display-only projection. Never put queued entries into the committed resource or financial totals.
export function mergeTransactionHistory(committed: Transaction[], queued: QueuedTransaction[]): HistoryTransaction[] {
  const pending = new Map(queued.map(item => [item.id, item]));
  const rows: HistoryTransaction[] = committed.map(transaction => {
    const item = pending.get(transaction.id);
    pending.delete(transaction.id);
    return item ? { ...transaction, syncState: item.state, syncError: item.error, syncEditable: false } : transaction;
  });
  for (const item of pending.values()) rows.push({
    ...item.transaction, id: item.id, tanggal: new Date(item.transaction.tanggal), createdAt: new Date(item.createdAt),
    syncState: item.state, syncError: item.error, syncEditable: item.attempted === false, syncRevision: item.revision,
  });
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
