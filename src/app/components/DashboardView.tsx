'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import type { Transaction, Wallet } from '@prisma/client';

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