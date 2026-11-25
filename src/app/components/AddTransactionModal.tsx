'use client';

import TransactionCompose from './TransactionCompose';
import { useOfflineTransactions } from './WalletContext';

export default function AddTransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queue = useOfflineTransactions();
  return isOpen ? <TransactionCompose onClose={onClose} onSave={async input => {
    await queue.enqueue(input);
    void queue.sync();
  }} /> : null;
}
