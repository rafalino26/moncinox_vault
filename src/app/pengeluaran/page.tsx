import { Suspense } from 'react';
import TransactionView from '../components/TransactionView'; // <-- Panggil komponen REUSABLE yang baru

export default function PengeluaranPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#5c2799]">liatt pengeluarannn</h1>
            </div>
            
            <Suspense fallback={<div className="text-center p-12">Memuat...</div>}>
                {/* Kita panggil komponen TransactionView dan cukup beri tahu dia
                  untuk menampilkan data dengan tipe "pengeluaran".
                */}
                <TransactionView tipe="pengeluaran" />
            </Suspense>
        </div>
    );
}