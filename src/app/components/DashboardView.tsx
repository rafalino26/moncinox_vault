'use client';

import { ReactNode } from 'react';

import { useWallet } from './WalletContext';
import StatCards from './StatCards';
import CollapsibleSection from './CollapsibleSection';
import SpendingAnalysis from './SpendingAnalysis';
import TransactionList from './TransactionList';

export default function DashboardView({
  charts,
}: {
  charts: ReactNode;
}) {
  const { wallets, transactions } = useWallet();

  // History (Riwayat Transaksi Terbaru) dari state lokal (supaya bisa optimistic update)
  const transactionList = (
    <TransactionList transactions={transactions.slice(0, 10)} />
  );

  return (
    <div className="space-y-6 sm:space-y-7 relative overflow-x-clip">
      {/* 1. Kartu Dompet Kembar (Puskasw & Miskasw) Langsung di Atas */}
      <StatCards wallets={wallets} />

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
          {charts}
        </CollapsibleSection>
      </div>
    </div>
  );
}
