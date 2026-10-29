'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import type { Wallet } from '@prisma/client';
import Sticker from "@/app/components/Sticker";

import { getWallets } from '@/app/actions/transactionActions';

import StatCards from './StatCards';
import TransactionForm from './TransactionForm';
import CollapsibleSection from './CollapsibleSection';

export default function DashboardView({ charts, transactionList }: { charts: ReactNode, transactionList: ReactNode }) {
    const [wallets, setWallets] = useState<{ rafaWallet: Wallet | null, monikWallet: Wallet | null }>({ rafaWallet: null, monikWallet: null });
    
    // Fungsi terpusat untuk me-refresh semua data
    const refreshData = useCallback(async () => {
        const walletData = await getWallets();
        setWallets(walletData);
    }, []);

    // Ambil data hanya sekali saat komponen dimuat
    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <div className="space-y-6 sm:space-y-8 relative overflow-x-clip">
            <Sticker
                src="/stickers/stitchblue.png"
                alt="star"
                size={50}
                className="top-40 left-0 rotate-[-12deg] opacity-90 hidden sm:block pointer-events-none"
            />
            <Sticker
                src="/stickers/stitchpink.png"
                alt="love"
                size={50}
                className="top-10 right-1 rotate-[10deg] opacity-90 hidden sm:block pointer-events-none"
            />
            <Sticker
                src="/stickers/stitchbareng.png"
                alt="love"
                size={50}
                className="top-52 right-0 rotate-[10deg] opacity-90 hidden sm:block pointer-events-none"
            />
            <Sticker
                src="/stickers/stitchbareng1.png"
                alt="love"
                size={70}
                className="top-180 left-0 opacity-90 hidden md:block pointer-events-none"
            />
            <Sticker
                src="/stickers/stitchbareng2.png"
                alt="love"
                size={50}
                className="top-116 right-4 opacity-90 hidden md:block pointer-events-none"
            />
            <Sticker
                src="/stickers/stitchblue2.png"
                alt="love"
                size={50}
                className="top-76 right-36 opacity-90 hidden md:block pointer-events-none"
            />
            <Sticker
                src="/stickers/stitchblue3.png"
                alt="love"
                size={50}
                className="top-176 right-2 rotate-[20deg] opacity-90 hidden md:block pointer-events-none"
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
