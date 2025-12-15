// Impor hanya tipe datanya saja, bukan fungsinya
import type { Transaction } from '@prisma/client';

// Komponen ini tidak lagi async, dan menerima 'transactions' sebagai prop
export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.map(t => (
          // Gunakan style 'frosted glass' agar konsisten
          <div key={t.id} className="bg-gray-50 p-4 rounded-xl shadow-lg flex justify-between items-center">
            <div className="flex items-start space-x-4">
              <div className={`w-3 h-3 rounded-full mt-3 flex-shrink-0 ${t.tipe === 'pengeluaran' ? 'bg-red-500' : 'bg-green-500'}`}></div>
              {/* ↓↓↓ Batasi lebar teks di sini ↓↓↓ */}
              <div className="flex-1">
                <p className="font-bold text-slate-800 break-words">{t.keterangan}</p>
                <p className="text-sm text-slate-600">
                  {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {t.sumber === 'Saya' ? 'puskassswww' : 'miskassswww'}
                </p>
              </div>
            </div>
            {/* ↓↓↓ Pastikan harga tidak mengecil dan rata kanan ↓↓↓ */}
            <p className={`font-bold text-md whitespace-nowrap text-right ml-4 ${t.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'}`}>
              {t.tipe === 'pengeluaran' ? '-' : '+'}Rp{t.jumlah.toLocaleString('id-ID')}
            </p>
          </div>
        ))
      ) : (
        <div className="bg-white/30 text-center p-8 rounded-xl shadow-lg">
          <p className="text-slate-500">belum ada apaaa apaaa ayanggg</p>
        </div>
      )}
    </div>
  );
}