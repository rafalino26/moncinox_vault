'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import type { Wallet, Transaction } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { getWallets } from '@/app/actions/transactionActions';
import StatCards from './StatCards';
import CollapsibleSection from './CollapsibleSection';
import SpendingAnalysis from './SpendingAnalysis';

export default function DashboardView({
  charts,
  transactionList,
  allTransactions = [],
}: {
  charts: ReactNode;
  transactionList: ReactNode;
  allTransactions?: Transaction[];
}) {
  const router = useRouter();
  const [wallets, setWallets] = useState<{
    rafaWallet: Wallet | null;
    monikWallet: Wallet | null;
  }>({ rafaWallet: null, monikWallet: null });

  // Fungsi terpusat untuk me-refresh saldo dompet
  const refreshData = useCallback(async () => {
    const walletData = await getWallets();
    setWallets(walletData);
    router.refresh();
  }, [router]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="space-y-6 sm:space-y-7 relative overflow-x-clip">
      {/* 1. Kartu Dompet Kembar (Puskasw & Miskasw) Langsung di Atas */}
      <StatCards wallets={wallets} onDataUpdate={refreshData} />

      {/* 2. Spending Analysis (Chevron < MODE > & Swipeable dengan Watermark Stitch) */}
      <SpendingAnalysis transactions={allTransactions} />

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
