'use client';

import { useState, useMemo, useEffect, useCallback } from 'react'; // <-- Tambahkan useCallback
import { useSearchParams } from 'next/navigation';
import type { Transaction } from '@prisma/client';
import { getFilteredTransactions, deleteTransaction } from '@/app/actions/transactionActions';
import FilterControls from '../pengeluaran/components/FilterControls';
import DataView from '../pengeluaran/components/DataView';
import ConfirmationModal from './ConfirmationModal';
import ComparisonTable from '../pengeluaran/components/ComparisonTable';
import ComparisonChart from '../pengeluaran/components/ComparisonChart';
import type { ComparisonData } from '@/app/types/index';

export default function TransactionView({ tipe }: { tipe: 'pengeluaran' | 'tabungan' }) {
    const searchParams = useSearchParams();
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
    const [viewMode, setViewMode] = useState<'semua' | 'perbandingan'>('semua');

    // --- Buat fungsi khusus untuk mengambil data ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const rentang = searchParams.get('rentang') || 'harian';
        const urutkan = searchParams.get('urutkan') || 'terbaru';
        const sumber = searchParams.get('sumber') as 'Saya' | 'Pacar_Saya' | undefined;

        const data = await getFilteredTransactions({
            tipe: tipe,
            rentang,
            urutkan,
            sumber,
        });
        setTransactions(data);
        setIsLoading(false);
    }, [searchParams, tipe]); // <-- Dependency-nya adalah searchParams dan tipe

    // Gunakan useEffect untuk memanggil fetchData saat filter berubah
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
            if (t.sumber === 'Saya') {
                acc.rafa += t.jumlah;
            } else if (t.sumber === 'Pacar_Saya') {
                acc.monik += t.jumlah;
            }
            return acc;
        }, { rafa: 0, monik: 0 });
    }, [filteredTransactions]);

     const comparisonData = useMemo((): ComparisonData[] => {
        const groupedData = filteredTransactions.reduce((acc, t) => {
            const tanggal = new Date(t.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' });
            if (!acc[tanggal]) {
                acc[tanggal] = { tanggal, rafa: 0, monik: 0 };
            }
            if (t.sumber === 'Saya') {
                acc[tanggal].rafa += t.jumlah;
            } else if (t.sumber === 'Pacar_Saya') {
                acc[tanggal].monik += t.jumlah;
            }
            return acc;
        }, {} as Record<string, ComparisonData>);
        return Object.values(groupedData);
    }, [filteredTransactions]);
    
    const total = filteredTransactions.reduce((sum, t) => sum + t.jumlah, 0);
    const colorClass = tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600';
    const baseButtonClass = "px-4 py-2 font-semibold transition-colors rounded-t-lg text-sm";
    const active_ButtonClass = "border-b-2 border-[#743ab7] text-[#743ab7]";
    const inactiveButtonClass = "text-slate-500";
    const rentang = searchParams.get('rentang') || 'harian';

    const handleDeleteClick = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
    };

   const handleConfirmDelete = async () => {
        if (!transactionToDelete) return;
        
        await deleteTransaction(transactionToDelete.id);
        setTransactionToDelete(null); // Tutup modal
        await fetchData(); // <-- Panggil fetchData secara manual untuk refresh!
    };

    return (
        <>
        <div className='space-y-6'>
            <FilterControls onSearchChange={setQuery} />

            {isLoading ? (
                <div className="text-center p-12">Memuat data...</div>
            ) : (
                <>
                    <div className="mb-6">
                        <p className="text-slate-600">
                            inii totalnyaa buat filter inii: 
                            <span className={`font-bold ${colorClass}`}> Rp{total.toLocaleString('id-ID')}</span>
                        </p>
                    </div>
                      <div className="flex items-center justify-center mb-4 border-b border-black/10">
                        <button onClick={() => setViewMode('semua')} className={`${baseButtonClass} ${viewMode === 'semua' ? active_ButtonClass : inactiveButtonClass}`}>semuaaaa</button>
                        <button onClick={() => setViewMode('perbandingan')} className={`${baseButtonClass} ${viewMode === 'perbandingan' ? active_ButtonClass : inactiveButtonClass}`}>perbandingannn</button>
                    </div>
                     {viewMode === 'semua' ? (
                        <DataView data={filteredTransactions} tipe={tipe} onDelete={handleDeleteClick} />
                    ) : (
                        <div className='space-y-6'>
                            <div className="bg-white/30 backdrop-blur-lg p-4 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">inii tabel perbandingann antara torang pe pengelurannn sayangg</h3>
                                {/* Berikan data total ke ComparisonTable jika rentang adalah mingguan/bulanan */}
                                <ComparisonTable 
                                    data={comparisonData}
                                    summary={(rentang === 'mingguan' || rentang === 'bulanan') ? comparisonSummary : undefined}
                                />
                            </div>
                            <div className="bg-white/30 backdrop-blur-lg p-4 rounded-2xl shadow-lg">
                                <h3 className="text-lg font-bold text-slate-800 mb-2 text-center">teruss ini grafiknyaaa</h3>
                                <ComparisonChart data={comparisonData} />
                            </div>
                        </div>
                    )} 
                </>
            )}
        </div>
         {/* Tampilkan modal jika ada transaksi yang akan dihapus */}
            {transactionToDelete && (
                <ConfirmationModal
                    title="Hapus Transaksi?"
                    message={`Yakin mau hapus transaksi "${transactionToDelete.keterangan}" senilai Rp${transactionToDelete.jumlah.toLocaleString('id-ID')}? Saldo akan dikembalikan.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setTransactionToDelete(null)}
                />
            )}
        </>
    );
}