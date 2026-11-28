'use client';

import TransactionCompose from './TransactionCompose';
import { useOfflineTransactions } from './WalletContext';

export default function AddUangSakuModal({ person, personName, onClose }: {
  person: 'Saya' | 'Pacar_Saya'; personName: string; onClose: () => void;
}) {
  const queue = useOfflineTransactions();
  return <TransactionCompose income title="Tambah pemasukan" subtitle={personName} submitLabel="Simpan pemasukan"
    onClose={onClose} onSave={async input => {
      await queue.enqueue({ ...input, sumber: person, tanggal: new Date().toISOString(), keterangan: 'Uang saku' }, 'income-create');
      void queue.sync();
    }} />;
}
