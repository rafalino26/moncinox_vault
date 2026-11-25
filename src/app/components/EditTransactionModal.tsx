'use client';

import TransactionCompose from './TransactionCompose';
import { updateTransaction } from '../actions/transactionActions';
import { useOfflineTransactions, useWallet } from './WalletContext';
import { offlineWriteError } from '../lib/connection';
import type { HistoryTransaction } from '../lib/transaction-history';

export default function EditTransactionModal({ transaction, onClose, onSuccess }: {
  transaction: HistoryTransaction; onClose: () => void; onSuccess: () => void;
}) {
  const queue = useOfflineTransactions();
  const { updateSavedTransaction } = useWallet();
  return <TransactionCompose title="Edit transaksi" subtitle="mizukuzuw & puzukuzuw" submitLabel="Simpan perubahan"
    initial={{ jumlah: transaction.jumlah, tipe: transaction.tipe, sumber: transaction.sumber,
      tanggal: new Date(transaction.tanggal).toISOString(), keterangan: transaction.keterangan }}
    onClose={onClose} onSave={async input => {
      if (transaction.syncState) {
        if (!transaction.syncEditable || transaction.syncRevision === undefined) throw Error('Catatan sedang menunggu konfirmasi server.');
        await queue.edit(transaction.id, input, transaction.syncRevision);
        void queue.sync();
      } else {
        const offlineError = offlineWriteError();
        if (offlineError) throw Error(offlineError);
        const result = await updateTransaction(transaction.id, input);
        if (!result.success) throw Error(result.error || 'Gagal menyimpan perubahan.');
        updateSavedTransaction(result.transaction, result.wallets);
      }
      onSuccess();
    }} />;
}
