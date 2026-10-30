import type { Transaction } from '@prisma/client';
import { FiArrowUpRight, FiBookmark, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { calendarDateKey, calendarDateLabel } from '../../lib/dates';
import { personName, rupiah } from '../../lib/ledger';

export default function PengeluaranTable({ data, onDelete, onEdit, totalPengeluaran, totalTabungan }: {
  data: Transaction[]; onDelete: (transaction: Transaction) => void; onEdit: (transaction: Transaction) => void;
  totalPengeluaran: number; totalTabungan: number;
}) {
  return <>
    {data.length ? <ul className="ledger-rows">{data.map(transaction => <li className="ledger-row" key={transaction.id}>
      <div className="ledger-row-main"><span className="ledger-row-icon" aria-hidden="true">{transaction.tipe === 'tabungan' ? <FiBookmark /> : <FiArrowUpRight />}</span>
        <div className="ledger-row-description"><h3>{transaction.keterangan}</h3><p>{personName(transaction.sumber)}<span>·</span>{calendarDateLabel(calendarDateKey(transaction.tanggal))}</p></div>
        <strong className="ledger-amount">{transaction.tipe === 'pengeluaran' ? '−' : ''}{rupiah(transaction.jumlah)}</strong>
      </div>
      <div className="ledger-row-footer"><span className="ledger-tag">{transaction.tipe === 'tabungan' ? 'Tabungan' : 'Pengeluaran'}</span>
        <div className="ledger-row-actions"><button type="button" aria-label={`Edit transaksi ${transaction.keterangan}`} onClick={() => onEdit(transaction)}><FiEdit2 aria-hidden="true" />Edit</button>
          <button type="button" aria-label={`Hapus transaksi ${transaction.keterangan}`} onClick={() => onDelete(transaction)}><FiTrash2 aria-hidden="true" />Hapus</button></div>
      </div>
    </li>)}</ul> : <p className="ledger-empty">Belum ada catatan di sini. Coba periode lain atau catat momen baru lewat tombol +.</p>}
    <div className="ledger-totals"><span>Pengeluaran<strong>{rupiah(totalPengeluaran)}</strong></span><span>Tabungan<strong>{rupiah(totalTabungan)}</strong></span></div>
  </>;
}
