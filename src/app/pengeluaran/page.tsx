import { Suspense } from 'react';
import TransactionView from '../components/TransactionView';

export default function PengeluaranPage() {
    return (
        <div className="space-y-6">
            <div>
                {/* Ganti judul agar lebih sesuai */}
                <h1 className="text-3xl font-bold text-[#5c2799]">Riwayat Transaksi</h1>
            </div>
            
            <Suspense fallback={<div className="text-center p-12">Memuat...</div>}>
                {/* Panggil TransactionView tanpa prop 'tipe' agar ia mengambil semua data */}
                <TransactionView />
            </Suspense>
        </div>
    );
}