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
            {/* --- POSISI BARU: STAT CARDS SEKARANG DI ATAS --- */}
            <Suspense fallback={<div className="text-center p-4">Memuat statistik...</div>}>
                <StatCards />
            </Suspense>

            {/* --- POSISI BARU: FORM SEKARANG DI BAWAH STAT CARDS --- */}
            <TransactionForm />

            <CollapsibleSection title="Grafik & Tren">
                <Suspense fallback={<div className="text-center p-4">Memuat grafik...</div>}>
                    <DashboardCharts />
                </Suspense>
            </CollapsibleSection>
            
            <CollapsibleSection title="Riwayat Transaksi Terbaru">
                <Suspense fallback={<div className="text-center p-8">Memuat riwayat...</div>}>
                    <TransactionList transactions={allTransactions} />
                </Suspense>
            </CollapsibleSection>
        </div>
    );
}