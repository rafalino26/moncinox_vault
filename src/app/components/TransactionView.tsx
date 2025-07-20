'use client';

import { useState, useMemo, useEffect, useCallback } from 'react'; // <-- Tambahkan useCallback
import { useSearchParams } from 'next/navigation';
import type { Transaction } from '@prisma/client';
import { getFilteredTransactions, deleteTransaction } from '@/app/actions/transactionActions';
import FilterControls from '../pengeluaran/components/FilterControls';
import DataView from '../pengeluaran/components/DataView';
import ConfirmationModal from './ConfirmationModal';

export default function TransactionView({ tipe }: { tipe: 'pengeluaran' | 'tabungan' }) {
    const searchParams = useSearchParams();
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

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
    
    const total = filteredTransactions.reduce((sum, t) => sum + t.jumlah, 0);
    const colorClass = tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600';

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
                    {/* Beri tahu DataView tipe apa yang sedang ditampilkan */}
                    <DataView data={filteredTransactions} tipe={tipe} onDelete={handleDeleteClick} />  
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