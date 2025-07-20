export const dynamic = 'force-dynamic'; // <-- TAMBAHKAN BARIS INI

import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import StatCards from './components/StatCards';
import DashboardCharts from './components/DashboardCharts';
import { getFilteredTransactions } from '@/app/actions/transactionActions';
import { Suspense } from 'react';
import CollapsibleSection from './components/CollapsibleSection'; // <-- Impor komponen baru

export default async function DashboardPage() {
    const allTransactions = await getFilteredTransactions({ 
        // @ts-ignore
        tipe: undefined,
        rentang: 'bulanan', 
        urutkan: 'terbaru', 
        q: '' 
    });

    return (
        <div className="space-y-8">
            <TransactionForm />

            <Suspense fallback={<div className="text-center p-4">Memuat statistik...</div>}>
                <StatCards />
            </Suspense>

            {/* --- BUNGKUS GRAFIK DENGAN COLLAPSIBLE SECTION --- */}
            <CollapsibleSection title="Grafik & Tren">
                <Suspense fallback={<div className="text-center p-4">Memuat grafik...</div>}>
                    <DashboardCharts />
                </Suspense>
            </CollapsibleSection>
            
            {/* --- BUNGKUS RIWAYAT TRANSAKSI DENGAN COLLAPSIBLE SECTION --- */}
            <CollapsibleSection title="Riwayat Transaksi Terbaru">
                <Suspense fallback={<div className="text-center p-8">Memuat riwayat...</div>}>
                    <TransactionList transactions={allTransactions} />
                </Suspense>
            </CollapsibleSection>
        </div>
    );
}