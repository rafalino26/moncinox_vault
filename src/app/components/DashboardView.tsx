'use client';

import dynamic from 'next/dynamic';
import { useWalletsData, useTransactionsData } from './WalletContext';
import DataStatus from './DataStatus';
import StatCards from './StatCards';
import CollapsibleSection from './CollapsibleSection';
import SpendingAnalysis from './SpendingAnalysis';
import TransactionList from './TransactionList';
import { filterTransactions } from '../lib/transaction-filters';

const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
  loading: () => <p className="p-4 text-sm text-purple-700">Memuat grafik...</p>,
  ssr: false,
});

export default function DashboardView() {
  const walletData = useWalletsData();
  const transactionData = useTransactionsData();
  const transactions = transactionData.data ?? [];

  // History (Riwayat Transaksi Terbaru) dari state lokal (supaya bisa optimistic update)
  const transactionList = (
    <TransactionList transactions={filterTransactions(transactions, { rentang: 'bulanan' }).slice(0, 10)} />
  );

  return (
    <div className="space-y-6 sm:space-y-7 relative overflow-x-clip">
      <DataStatus
        error={walletData.error || transactionData.error}
        loading={walletData.isLoading || transactionData.isLoading}
        retry={() => {
          if (walletData.error) void walletData.retry();
          if (transactionData.error) void transactionData.retry();
        }}
      />
      {/* 1. Kartu Dompet Kembar (Puskasw & Miskasw) Langsung di Atas */}
      {walletData.data && <StatCards wallets={walletData.data} />}

      {transactionData.data && <>
      {/* 2. Spending Analysis (Chevron < MODE > & Swipeable dengan Watermark Stitch) */}
      <SpendingAnalysis transactions={transactions} />

      {/* 3. History (Riwayat Transaksi Terbaru) */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            History
          </h2>
          <p className="text-xs text-slate-400 font-medium">Last 30 Days</p>
        </div>
        {transactionList}
      </div>

      {/* 4. Bagian Grafik & Tren */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <CollapsibleSection title="Grafik & Analisis Tren" defaultOpen={false}>
          <DashboardCharts transactions={transactions} />
        </CollapsibleSection>
      </div>
      </>}
    </div>
  );
}
