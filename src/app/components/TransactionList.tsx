import type { Transaction } from '@prisma/client';

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.map(t => (
          <div key={t.id} className="bg-gray-50 p-3 sm:p-4 rounded-xl shadow-md flex justify-between items-center gap-2 sm:gap-3">
            <div className="flex items-start space-x-2.5 sm:space-x-4 min-w-0 flex-1">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1.5 flex-shrink-0 ${t.tipe === 'pengeluaran' ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm sm:text-base break-words">{t.keterangan}</p>
                <p className="text-xs sm:text-sm text-slate-600 truncate">
                  {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {t.sumber === 'Saya' ? 'puskassswww' : 'miskassswww'}
                </p>
              </div>
            </div>
            <p className={`font-bold text-xs sm:text-sm md:text-base whitespace-nowrap text-right flex-shrink-0 ${t.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'}`}>
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
