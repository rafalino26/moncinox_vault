import type { HistoryTransaction } from '../lib/transaction-history';
import Image from 'next/image';
import { FiClock, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import QueuedTransactionActions from './QueuedTransactionActions';

export default function TransactionList({ transactions }: { transactions: HistoryTransaction[] }) {
  return (
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.map((t) => (
          <div
            key={t.id}
            className={`${t.syncState ? 'history-pending ' : ''}bg-white/95 p-3.5 sm:p-4 rounded-[22px] border border-purple-100/70 shadow-xs flex justify-between items-center gap-3 transition-colors hover:bg-white`}
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Ikon Lingkaran Kiri */}
              <div
                className={`history-item-icon w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.tipe === 'pengeluaran'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {t.syncState ? <FiClock size={18} aria-hidden="true" /> : t.tipe === 'pengeluaran' ? (
                  <FiTrendingDown size={18} className="stroke-[2]" />
                ) : (
                  <FiTrendingUp size={18} className="stroke-[2]" />
                )}
              </div>

              {/* Keterangan & Sumber + Tanggal */}
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900 text-sm sm:text-base break-words leading-tight">
                  {t.keterangan}
                </p>
                {t.syncState && <span className="history-sync-status">{t.syncState === 'blocked' ? 'Perlu diperiksa' : 'Belum tersinkron'}</span>}
                {t.syncState === 'blocked' && t.syncError && <p className="history-sync-error">{t.syncError}</p>}
                {t.syncState && <QueuedTransactionActions transaction={t} />}
                <p className="text-xs text-slate-400 font-medium truncate mt-1">
                  <span>{t.sumber === 'Saya' ? 'Puskasw' : 'Miskasw'}</span>
                  <span className="mx-1.5">•</span>
                  <span>
                    {new Date(t.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* Nominal Kanan */}
            <p
              className={`font-black text-sm sm:text-base whitespace-nowrap text-right flex-shrink-0 ${
                t.tipe === 'pengeluaran' ? 'text-rose-500' : 'text-emerald-600'
              }`}
            >
              {t.tipe === 'pengeluaran' ? '-' : '+'}Rp {new Intl.NumberFormat('id-ID').format(t.jumlah)}
            </p>
          </div>
        ))
      ) : (
        <div className="bg-white/60 text-center p-8 rounded-[24px] border border-purple-100 flex flex-col items-center">
          <div className="w-16 h-16 mb-2">
            <Image
              src="/stickers/stitchbareng.png"
              alt="Empty"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <p className="text-slate-700 font-bold text-sm">Belum ada catatan di sini.</p>
          <p className="text-xs text-slate-400 mt-1">Klik tombol (+) di kanan bawah buat nambah</p>
        </div>
      )}
    </div>
  );
}
