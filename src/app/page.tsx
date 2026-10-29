import { Suspense } from 'react';
import DashboardView from './components/DashboardView';
import DashboardCharts from './components/DashboardCharts';
import TransactionList from './components/TransactionList';
import { getWallets, getFilteredTransactions } from '@/app/actions/transactionActions';

export default async function DashboardPage() {
  // Ambil data transaksi untuk TransactionList dan SpendingAnalysis
  // @ts-ignore
  const allTransactions = await getFilteredTransactions({ 
    tipe: undefined, 
    rentang: 'semua', 
    urutkan: 'terbaru', 
  });

  // Ambil data dompet (Wallets) dari server
  const wallets = await getWallets();

  return (
    <Suspense fallback={<div className="text-center p-12 text-purple-700 font-bold">Memuat Dashboard...</div>}>
      <DashboardView 
        charts={<DashboardCharts />}
        transactionList={<TransactionList transactions={allTransactions.slice(0, 10)} />}
        allTransactions={allTransactions}
        wallets={wallets}
      />
    </Suspense>
  );
}
