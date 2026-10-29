'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import type { Wallet, Transaction } from '@prisma/client';
import Image from 'next/image';
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
    <div className="space-y-5 sm:space-y-6 relative overflow-x-clip">
      {/* 1. Banner Sapaan Minimalis 1 Baris (Hemat Tempat) */}
      <div className="bg-white/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-purple-100/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-extrabold text-[#5c2799] tracking-tight">
            hellow mizukuzuw & puzuzkuw 💜
          </span>
        </div>
        <div className="w-8 h-8 flex-shrink-0 relative">
          <Image
            src="/stickers/stitchbareng.png"
            alt="Stitch and Angel"
            width={32}
            height={32}
            className="object-contain drop-shadow-xs"
            priority
          />
        </div>
      </div>

      {/* 2. Kartu Dompet Kembar (Puskasw & Miskasw) */}
      <StatCards wallets={wallets} onDataUpdate={refreshData} />

      {/* 3. Spending Analysis (Chevron < MODE > & Swipeable) */}
      <SpendingAnalysis transactions={allTransactions} />

      {/* 4. History (Persis seperti layout screenshot) */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            History
          </h2>
          <p className="text-xs text-slate-400 font-medium">Last 30 Days</p>
        </div>
        {transactionList}
      </div>

      {/* 5. Bagian Grafik & Tren */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
        <CollapsibleSection title="Grafik & Analisis Tren" defaultOpen={false}>
          {charts}
        </CollapsibleSection>
      </div>
    </div>
  );
}
