'use client';
import { useState } from 'react';
import { FiEdit2, FiX } from 'react-icons/fi';
import type { HistoryTransaction } from '../lib/transaction-history';
import { useOfflineTransactions } from './WalletContext';
import EditTransactionModal from './EditTransactionModal';
import ConfirmationModal from './ConfirmationModal';

export default function QueuedTransactionActions({ transaction }: { transaction: HistoryTransaction }) {
  const queue = useOfflineTransactions();
  const [editing, setEditing] = useState<HistoryTransaction | null>(null);
  const [canceling, setCanceling] = useState<HistoryTransaction | null>(null);
  return <>
    {(transaction.syncEditable || transaction.syncRejected) && <div className="ledger-row-actions history-local-actions">
      {transaction.syncEditable && !['delete', 'income-delete'].includes(transaction.syncKind || '') && <button type="button" aria-label={`Edit catatan antrean ${transaction.keterangan}`} onClick={() => setEditing(transaction)}><FiEdit2 aria-hidden="true" />Edit</button>}
      <button type="button" aria-label={`Batalkan catatan antrean ${transaction.keterangan}`} onClick={() => setCanceling(transaction)}><FiX aria-hidden="true" />Batalkan</button>
    </div>}
    {editing && <EditTransactionModal transaction={editing} onClose={() => setEditing(null)} onSuccess={() => setEditing(null)} />}
    {canceling && <ConfirmationModal title="Batalkan catatan?" message={`“${canceling.keterangan}” akan dihapus dari antrean HP ini.`}
      confirmLabel="Ya, batalkan" pendingLabel="Membatalkan…" allowOffline onCancel={() => setCanceling(null)} onConfirm={async () => {
        if (canceling.syncRejected) await queue.discardRejected(canceling.syncQueueId || canceling.id);
        else await queue.cancel(canceling.syncQueueId || canceling.id, canceling.syncRevision!);
        setCanceling(null);
      }} />}
  </>;
}
