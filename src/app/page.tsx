import { Suspense } from 'react';
import DashboardView from "./components/DashboardView";
import DashboardCharts from './components/DashboardCharts';
import TransactionList from './components/TransactionList';
import { getFilteredTransactions } from '@/app/actions/transactionActions';

// Jadikan halaman ini async lagi
export default async function DashboardPage() {
    // Ambil data untuk TransactionList di sini
    // @ts-ignore
    const allTransactions = await getFilteredTransactions({ 
        tipe: undefined,
        rentang: 'bulanan', 
        urutkan: 'terbaru', 
    });
    
    return (
        <Suspense fallback={<div className='text-center p-12'>Memuat Dashboard...</div>}>
            <DashboardView 
                // "Titipkan" komponen server sebagai props
                charts={<DashboardCharts />}
                transactionList={<TransactionList transactions={allTransactions} />}
            />
        </Suspense>
    );
}