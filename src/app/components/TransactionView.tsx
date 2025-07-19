'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Transaction } from '@prisma/client';
import { getFilteredTransactions } from '@/app/actions/transactionActions';
import FilterControls from '../pengeluaran/components/FilterControls';
import DataView from '../pengeluaran/components/DataView';

// Komponen ini sekarang menerima 'tipe' sebagai prop
export default function TransactionView({ tipe }: { tipe: 'pengeluaran' | 'tabungan' }) {
    const searchParams = useSearchParams();
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        setIsLoading(true);
        const rentang = searchParams.get('rentang') || 'harian';
        const urutkan = searchParams.get('urutkan') || 'terbaru';
        const sumber = searchParams.get('sumber') as 'Saya' | 'Pacar_Saya' | undefined;

        // Gunakan 'tipe' dari prop untuk mengambil data yang benar
        getFilteredTransactions({
            tipe: tipe,
            rentang,
            urutkan,
            sumber,
        }).then(data => {
            setTransactions(data);
            setIsLoading(false);
        });
    }, [searchParams, tipe]); // Tambahkan 'tipe' sebagai dependency

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

    return (
        <div className='space-y-6'>
            <FilterControls onSearchChange={setQuery} />

            {isLoading ? (
                <div className="text-center p-12">Memuat data...</div>
            ) : (
                <>
                    <div className="mb-6">
                        <p className="text-slate-600">
                            Total untuk filter ini: 
                            <span className={`font-bold ${colorClass}`}> Rp{total.toLocaleString('id-ID')}</span>
                        </p>
                    </div>
                    {/* Beri tahu DataView tipe apa yang sedang ditampilkan */}
                    <DataView data={filteredTransactions} tipe={tipe} /> 
                </>
            )}
        </div>
    );
}