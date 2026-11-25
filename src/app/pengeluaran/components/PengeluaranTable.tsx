import type { Transaction } from '@prisma/client';
import type { HistoryTransaction } from '../../lib/transaction-history';
import { FiArrowUpRight, FiBookmark, FiClock, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { calendarDateKey, calendarDateLabel } from '../../lib/dates';
import { personName, rupiah } from '../../lib/ledger';
import QueuedTransactionActions from '../../components/QueuedTransactionActions';

export default function PengeluaranTable({ data, onDelete, onEdit, totalPengeluaran, totalTabungan }: {
  data: HistoryTransaction[]; onDelete: (transaction: Transaction) => void; onEdit: (transaction: Transaction) => void;
  totalPengeluaran: number; totalTabungan: number;
}) {
  return <>
    {data.length ? <ul className="ledger-rows">{data.map(transaction => <li className={`ledger-row${transaction.syncState ? ' history-pending' : ''}`} key={transaction.id}>
      <div className="ledger-row-main"><span className="ledger-row-icon" aria-hidden="true">{transaction.syncState ? <FiClock /> : transaction.tipe === 'tabungan' ? <FiBookmark /> : <FiArrowUpRight />}</span>
        <div className="ledger-row-description"><h3>{transaction.keterangan}</h3><p>{personName(transaction.sumber)}<span>·</span>{calendarDateLabel(calendarDateKey(transaction.tanggal))}</p></div>
        <strong className="ledger-amount">{transaction.tipe === 'pengeluaran' ? '−' : ''}{rupiah(transaction.jumlah)}</strong>
      </div>
      <div className="ledger-row-footer"><span className="ledger-tag">{transaction.syncState ? transaction.syncState === 'blocked' ? 'Perlu diperiksa' : 'Belum tersinkron' : transaction.tipe === 'tabungan' ? 'Tabungan' : 'Pengeluaran'}</span>
        {transaction.syncState ? <QueuedTransactionActions transaction={transaction} /> : <div className="ledger-row-actions"><button type="button" aria-label={`Edit transaksi ${transaction.keterangan}`} onClick={() => onEdit(transaction)}><FiEdit2 aria-hidden="true" />Edit</button>
          <button type="button" aria-label={`Hapus transaksi ${transaction.keterangan}`} onClick={() => onDelete(transaction)}><FiTrash2 aria-hidden="true" />Hapus</button></div>}
      </div>
      {transaction.syncState === 'blocked' && transaction.syncError && <p className="history-sync-error">{transaction.syncError}</p>}
    </li>)}</ul> : <p className="ledger-empty">Belum ada catatan di sini. Coba periode lain atau catat momen baru lewat tombol +.</p>}
    <div className="ledger-totals"><span>Pengeluaran<strong>{rupiah(totalPengeluaran)}</strong></span><span>Tabungan<strong>{rupiah(totalTabungan)}</strong></span></div>
  </>;
}
