'use client';

import TransactionCompose from './TransactionCompose';
import { useOfflineTransactions } from './WalletContext';
import { transactionInput, type HistoryTransaction } from '../lib/transaction-history';

export default function EditTransactionModal({ transaction, onClose, onSuccess }: {
  transaction: HistoryTransaction; onClose: () => void; onSuccess: () => void;
}) {
  const queue = useOfflineTransactions();
  return <TransactionCompose income={transaction.syncKind === 'income-create'} title={transaction.syncKind === 'income-create' ? 'Edit pemasukan' : 'Edit transaksi'} subtitle="mizukuzuw & puzukuzuw" submitLabel="Simpan perubahan"
    initial={{ jumlah: transaction.jumlah, tipe: transaction.tipe, sumber: transaction.sumber,
      tanggal: new Date(transaction.tanggal).toISOString(), keterangan: transaction.keterangan }}
    onClose={onClose} onSave={async input => {
      if (transaction.syncState) {
        if (!transaction.syncEditable || transaction.syncRevision === undefined) throw Error('Catatan sedang menunggu konfirmasi server.');
        await queue.edit(transaction.syncQueueId || transaction.id, transaction.syncKind === 'income-create' ? { ...input, tanggal: new Date(transaction.tanggal).toISOString() } : input, transaction.syncRevision);
        void queue.sync();
      } else {
        await queue.enqueue(input, 'update', { id: transaction.id, expected: transactionInput(transaction) });
        void queue.sync();
      }
      onSuccess();
    }} />;
}
