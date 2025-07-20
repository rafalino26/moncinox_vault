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
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${t.tipe === 'pengeluaran' ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <div>
                <p className="font-bold text-slate-800">{t.keterangan}</p>
                <p className="text-sm text-slate-600">
                  {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {t.sumber === 'Saya' ? 'Rafa' : 'Monik'}
                </p>
              </div>
            </div>
            <p className={`font-bold text-md ${t.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'}`}>
              {t.tipe === 'pengeluaran' ? '-' : '+'}Rp{t.jumlah.toLocaleString('id-ID')}
            </p>
          </div>
        ))
      ) : (
        <div className="bg-white/30 text-center p-8 rounded-xl shadow-lg">
          <p className="text-slate-500">Belum ada data transaksi.</p>
        </div>
      )}
    </div>
  );
}