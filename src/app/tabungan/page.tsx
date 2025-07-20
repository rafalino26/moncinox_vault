import { Suspense } from 'react';
import TransactionView from '../components/TransactionView'; // <-- Panggil komponen yang SAMA

export default function TabunganPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#5c2799]">iniii tabungann</h1>
            </div>
            
            <Suspense fallback={<div className="text-center p-12">Memuat...</div>}>
                {/* Satu-satunya perbedaan adalah di sini:
                  Kita memberitahu komponen untuk menampilkan data 'tabungan'.
                */}
                <TransactionView tipe="tabungan" />
            </Suspense>
        </div>
    );
}