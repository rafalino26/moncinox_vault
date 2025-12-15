'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import type { Transaction, Wallet } from '@prisma/client';
import Sticker from "@/app/components/Sticker";

import { getWallets, getFilteredTransactions } from '@/app/actions/transactionActions';

import StatCards from './StatCards';
import TransactionForm from './TransactionForm';
import CollapsibleSection from './CollapsibleSection';

export default function DashboardView({ charts, transactionList }: { charts: ReactNode, transactionList: ReactNode }) {
    const [wallets, setWallets] = useState<{ rafaWallet: Wallet | null, monikWallet: Wallet | null }>({ rafaWallet: null, monikWallet: null });
    
    // Fungsi terpusat untuk me-refresh semua data
    const refreshData = useCallback(async () => {
        const walletData = await getWallets();
        setWallets(walletData);
        // Kita juga bisa refresh data lain di sini jika perlu di masa depan
    }, []);

    // Ambil data hanya sekali saat komponen dimuat
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <div className="space-y-8">
            <Sticker
        src="/stickers/stitchblue.png"
        alt="star"
        size={60}
        className="top-43 -left-3 rotate-[-12deg] opacity-95"
      />
      <Sticker
        src="/stickers/stitchpink.png"
        alt="love"
        size={60}
        className=" -right-4 rotate-[10deg] opacity-95"
      />
      <Sticker
        src="/stickers/stitchbareng.png"
        alt="love"
        size={60}
        className="top-50 -right-0 rotate-[10deg] opacity-95"
      />
      <Sticker
        src="/stickers/stitchbareng1.png"
        alt="love"
        size={100}
        className="top-180 -left-6 opacity-95"
      />
      <Sticker
        src="/stickers/stitchbareng2.png"
        alt="love"
        size={60}
        className="top-116 right-6 opacity-95"
      />
      <Sticker
        src="/stickers/stitchblue2.png"
        alt="love"
        size={60}
        className="top-76 right-45 opacity-95"
      />
      <Sticker
        src="/stickers/stitchblue3.png"
        alt="love"
        size={55}
        className="top-176 right-2 rotate-[20deg] opacity-95"
      />
            {/* Berikan data & fungsi refresh ke StatCards */}
            <StatCards wallets={wallets} onDataUpdate={refreshData} />

            {/* Berikan fungsi refresh ke TransactionForm */}
            <TransactionForm onSuccess={refreshData} />
            
            <CollapsibleSection title="Grafik & Tren">
                {charts}
            </CollapsibleSection>
            
            <CollapsibleSection title="Riwayat Transaksi Terbaru">
                {transactionList}
            </CollapsibleSection>
        </div>
    );
}