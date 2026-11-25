'use client';

import TransactionCompose from './TransactionCompose';
import { addUangSaku } from '../actions/transactionActions';
import { useWallet } from './WalletContext';
import { offlineWriteError } from '../lib/connection';

export default function AddUangSakuModal({ person, personName, onClose }: {
  person: 'Saya' | 'Pacar_Saya'; personName: string; onClose: () => void;
}) {
  const { addSavedIncome } = useWallet();
  return <TransactionCompose income title="Tambah pemasukan" subtitle={personName} submitLabel="Simpan pemasukan"
    onClose={onClose} onSave={async input => {
      const offlineError = offlineWriteError();
      if (offlineError) throw Error(offlineError);
      const data = new FormData(); data.set('person', person); data.set('amount', String(input.jumlah));
      const result = await addUangSaku(data);
      if (!result.success) throw Error(result.error || 'Gagal menambahkan pemasukan.');
      addSavedIncome(result.income, result.wallet);
    }} />;
}
