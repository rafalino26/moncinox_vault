'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import type { Transaction } from '@prisma/client';
import { getFilteredTransactions, deleteTransaction } from '../actions/transactionActions';
import FilterControls from '../pengeluaran/components/FilterControls';
import DataView from '../pengeluaran/components/DataView';
import ConfirmationModal from './ConfirmationModal';
import ComparisonTable from '../pengeluaran/components/ComparisonTable';
import ComparisonChart from './ComparisonChart';
import type { ComparisonData } from '../types';
import ComparisonDetailModal from '../pengeluaran/components/ComparisonDetailModal';

export default function TransactionView() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [viewMode, setViewMode] = useState<'semua' | 'perbandingan'>('semua');
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailData, setDetailData] = useState<{ date: string; transactions: Transaction[] }>({ date: '', transactions: [] });
     const activeTipe = (searchParams.get('tipe') as 'pengeluaran' | 'tabungan' | null) || 'semua';


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const rentang = searchParams.get('rentang') || 'harian';
        const urutkan = searchParams.get('urutkan') || 'terbaru';
        const sumber = searchParams.get('sumber') as 'Saya' | 'Pacar_Saya' | undefined;
        const from = searchParams.get('from') || undefined;
        const to = searchParams.get('to') || undefined;
        // Ambil 'tipe' dari URL di sini
        const tipe = searchParams.get('tipe') as 'pengeluaran' | 'tabungan' | undefined;

        const data = await getFilteredTransactions({
            rentang,
            urutkan,
            sumber,
            from,
            to,
            tipe, // <-- Kirim 'tipe' ke backend
        });
        setTransactions(data);
        setIsLoading(false);
    }, [searchParams]); // <-- dependency sudah benar


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredTransactions = useMemo(() => {
        if (!query) return transactions;
        const queryLower = query.toLowerCase();
        return transactions.filter(t => 
            t.keterangan?.toLowerCase().includes(queryLower) ||
            new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase().includes(queryLower)
        );
    }, [transactions, query]);

    const comparisonSummary = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.sumber === 'Saya') acc.rafa += t.jumlah;
            else if (t.sumber === 'Pacar_Saya') acc.monik += t.jumlah;
            return acc;
        }, { rafa: 0, monik: 0 });
    }, [filteredTransactions]);

    const comparisonData = useMemo((): ComparisonData[] => {
        const groupedData = filteredTransactions.reduce((acc, t) => {
            const tanggal = new Date(t.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
            if (!acc[tanggal]) acc[tanggal] = { tanggal, rafa: 0, monik: 0 };
            if (t.sumber === 'Saya') acc[tanggal].rafa += t.jumlah;
            else if (t.sumber === 'Pacar_Saya') acc[tanggal].monik += t.jumlah;
            return acc;
        }, {} as Record<string, ComparisonData>);
        return Object.values(groupedData).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [filteredTransactions]);

    const totalPengeluaran = filteredTransactions
        .filter(t => t.tipe === 'pengeluaran')
        .reduce((sum, t) => sum + t.jumlah, 0);
    const totalTabungan = filteredTransactions
        .filter(t => t.tipe === 'tabungan')
        .reduce((sum, t) => sum + t.jumlah, 0);

    
    const baseButtonClass = "px-4 py-2 font-semibold transition-colors rounded-t-lg text-sm";
    const active_ButtonClass = "border-b-2 border-[#743ab7] text-[#743ab7]";
    const inactiveButtonClass = "text-slate-500";
    
    const handleDeleteClick = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
    };

    const handleConfirmDelete = async () => {
        if (!transactionToDelete) return;
        await deleteTransaction(transactionToDelete.id);
        setTransactionToDelete(null);
        await fetchData();
    };

     const handleDetailClick = (date: string) => {
        // Saring semua transaksi untuk menemukan yang cocok dengan tanggal yang diklik
        const dailyTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
            return transactionDate === date;
        });

        setDetailData({ date, transactions: dailyTransactions });
        setIsDetailModalOpen(true);
    };

    const handleTipeChange = (tipe: 'semua' | 'pengeluaran' | 'tabungan') => {
        const params = new URLSearchParams(searchParams);
        if (tipe === 'semua') {
            params.delete('tipe');
        } else {
            params.set('tipe', tipe);
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <>
        <div className='space-y-6'>
            <div className="flex items-center justify-center p-1 bg-white/30 backdrop-blur-lg rounded-xl shadow-lg">
                    <button onClick={() => handleTipeChange('semua')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTipe === 'semua' ? 'bg-[#d9b3ff]' : 'text-slate-600'}`}>Semua</button>
                    <button onClick={() => handleTipeChange('pengeluaran')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTipe === 'pengeluaran' ? 'bg-[#d9b3ff]' : 'text-slate-600'}`}>Pengeluaran</button>
                    <button onClick={() => handleTipeChange('tabungan')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTipe === 'tabungan' ? 'bg-[#d9b3ff]' : 'text-slate-600'}`}>Tabungan</button>
                </div>
            <FilterControls onSearchChange={setQuery} />

            {isLoading ? ( <div className="text-center p-12">Memuat data...</div> ) : (
                <>
                    <div className="flex items-center justify-center mb-4 border-b border-black/10">
                        <button onClick={() => setViewMode('semua')} className={`${baseButtonClass} ${viewMode === 'semua' ? active_ButtonClass : inactiveButtonClass}`}>Semua</button>
                        <button onClick={() => setViewMode('perbandingan')} className={`${baseButtonClass} ${viewMode === 'perbandingan' ? active_ButtonClass : inactiveButtonClass}`}>Perbandingan</button>
                    </div>

                   {viewMode === 'semua' ? (
                        <DataView 
                            data={filteredTransactions} 
                            onDelete={handleDeleteClick}
                            // <-- Tambahkan total di sini
                            totalPengeluaran={totalPengeluaran}
                            totalTabungan={totalTabungan}
                        />
                    ) : (
                        <div className='space-y-6'>
                            <div className="bg-white/30 backdrop-blur-lg p-4 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">Tabel Perbandingan (Total Transaksi)</h3>
                                <ComparisonTable 
                                    data={comparisonData}
                                    summary={comparisonSummary}
                                    onDetailClick={handleDetailClick} 
                                />
                            </div>
                            <div className="bg-white/30 backdrop-blur-lg p-4 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">Grafik Perbandingan (Total Transaksi)</h3>
                                <ComparisonChart data={comparisonData} />
                            </div>
                        </div>
                    )} 
                </>
            )}
        </div>
        {transactionToDelete && (
            <ConfirmationModal
                title="Hapus Transaksi?"
                message={`Yakin mau hapus transaksi "${transactionToDelete.keterangan}"? Saldo akan dikembalikan.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setTransactionToDelete(null)}
            />
        )}
        {isDetailModalOpen && (
                <ComparisonDetailModal 
                    date={detailData.date}
                    transactions={detailData.transactions}
                    onClose={() => setIsDetailModalOpen(false)}
                />
            )}
        </>
    );
}