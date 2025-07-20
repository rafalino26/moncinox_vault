'use client';

import { useState, useEffect, useCallback, Suspense, ReactNode } from 'react'; // <-- Tambah ReactNode
import type { Wallet } from '@prisma/client';

import { getWallets } from '@/app/actions/transactionActions';

import StatCards from './StatCards';
import TransactionForm from './TransactionForm';
import CollapsibleSection from './CollapsibleSection';

// Terima props baru: charts dan transactionList
export default function DashboardView({ charts, transactionList }: { charts: ReactNode, transactionList: ReactNode }) {
    const [wallets, setWallets] = useState<{ rafaWallet: Wallet | null, monikWallet: Wallet | null }>({ rafaWallet: null, monikWallet: null });
    
    // Fungsi ini sekarang hanya mengambil data wallet
    const refreshData = useCallback(async () => {
        const walletData = await getWallets();
        setWallets(walletData);
    }, []);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    return (
        <div className="space-y-8">
            <StatCards wallets={wallets} onDataUpdate={refreshData} />
            <TransactionForm onSuccess={refreshData} />
            
            <CollapsibleSection title="Grafik & Tren">
                {/* Tampilkan komponen yang dititipkan */}
                {charts}
            </CollapsibleSection>
            
            <CollapsibleSection title="Riwayat Transaksi Terbaru">
                {/* Tampilkan komponen yang dititipkan */}
                {transactionList}
            </CollapsibleSection>
        </div>
    );
}