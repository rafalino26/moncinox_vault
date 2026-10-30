'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Transaction } from '@prisma/client';
import { FiBarChart2, FiList, FiUsers } from 'react-icons/fi';
import { deleteTransaction } from '../actions/transactionActions';
import { useTransactionsData, useWallet } from './WalletContext';
import { filterTransactions } from '../lib/transaction-filters';
import { groupTransactionsByDay } from '../lib/transaction-groups';
import { calendarDateKey, calendarDateLabel } from '../lib/dates';
import { periodLabels, transactionEntries } from '../lib/ledger';
import LedgerHero from './ledger/LedgerHero';
import LedgerFilters, { useLedgerQuery } from './ledger/LedgerFilters';
import DataStatus from './DataStatus';
import PengeluaranTable from '../pengeluaran/components/PengeluaranTable';
import ComparisonTable from '../pengeluaran/components/ComparisonTable';
import ConfirmationModal from './ConfirmationModal';
import ComparisonDetailModal from '../pengeluaran/components/ComparisonDetailModal';
import EditTransactionModal from './EditTransactionModal';
import { StitchLoading } from './StitchMotion';

const LedgerChart = dynamic(() => import('./ledger/LedgerChart'), { ssr: false,
  loading: () => <StitchLoading /> });

export default function TransactionView() {
  const transactionData = useTransactionsData();
  const { removeSavedTransaction } = useWallet();
  const { filters, update, tipe } = useLedgerQuery();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'tabel';
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query).trim().toLowerCase();
  const [visibleCount, setVisibleCount] = useState(50);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const filterKey = JSON.stringify({ ...filters, tipe });
  const filtered = useMemo(() => filterTransactions(transactionData.data ?? [], JSON.parse(filterKey)).filter(transaction =>
    !search || transaction.keterangan.toLowerCase().includes(search) ||
    calendarDateLabel(calendarDateKey(transaction.tanggal)).toLowerCase().includes(search)), [transactionData.data, filterKey, search]);
  useEffect(() => { setVisibleCount(50); }, [filterKey, search]);
  const totals = useMemo(() => filtered.reduce((sum, transaction) => {
    sum[transaction.tipe] += transaction.jumlah; return sum;
  }, { pengeluaran: 0, tabungan: 0 }), [filtered]);
  const comparison = useMemo(() => view === 'perbandingan' ? groupTransactionsByDay(filtered).reverse() : [], [view, filtered]);
  const comparisonSummary = useMemo(() => filtered.reduce((sum, transaction) => {
    sum[transaction.sumber === 'Saya' ? 'rafa' : 'monik'] += transaction.jumlah; return sum;
  }, { rafa: 0, monik: 0 }), [filtered]);
  const entries = useMemo(() => transactionEntries(filtered), [filtered]);
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    setMutationError(null);
    try {
      const result = await deleteTransaction(transactionToDelete.id);
      if (result.success) removeSavedTransaction(transactionToDelete.id, result.wallet);
      else setMutationError(result.error ?? 'Gagal menghapus transaksi.');
    } catch { setMutationError('Gagal menghapus transaksi. Silakan coba lagi.'); }
    setTransactionToDelete(null);
  };
  const count = view === 'perbandingan' ? comparison.length : filtered.length;
  if (transactionData.isLoading && !transactionData.error) return <StitchLoading centered />;
  return <div className="ledger-page">
    <LedgerHero title="Pengeluaran" subtitle="jangan borosw borosw" label={tipe === 'semua' ? 'Pengeluaran & tabungan' : tipe === 'tabungan' ? 'Total tabungan' : 'Total pengeluaran'}
      total={transactionData.data ? totals.pengeluaran + totals.tabungan : null} period={periodLabels[filters.rentang] || 'Hasil filter'} count={filtered.length} sticker="/stickers/stitchblue3.png" />
    <div className="ledger-segments" aria-label="Jenis transaksi">
      {(['semua', 'pengeluaran', 'tabungan'] as const).map(value => <button type="button" key={value} aria-pressed={tipe === value} onClick={() => update('tipe', value)}>
        {{ semua: 'Semua', pengeluaran: 'Pengeluaran', tabungan: 'Tabungan' }[value]}</button>)}
    </div>
    <LedgerFilters filters={filters} update={update} search={query} onSearch={setQuery} />
    <DataStatus error={transactionData.error} retry={transactionData.retry} loading={transactionData.isLoading} />
    {mutationError && <p role="alert" className="ledger-alert">{mutationError}</p>}
    <section className="ledger-sheet">
      <div className="ledger-view-tabs" aria-label="Tampilan catatan">
        {[{ value: 'tabel', label: 'Daftar', icon: FiList }, { value: 'grafik', label: 'Grafik', icon: FiBarChart2 }, { value: 'perbandingan', label: 'Berdua', icon: FiUsers }].map(item =>
          <button type="button" key={item.value} aria-pressed={view === item.value} onClick={() => update('view', item.value)}><item.icon aria-hidden="true" />{item.label}</button>)}
      </div>
      {transactionData.data && (view === 'grafik' ? <LedgerChart entries={entries} /> : <>
        <div className="ledger-section-heading"><h2>{view === 'perbandingan' ? 'Perbandingan' : 'Riwayat transaksi'}</h2><span>{filtered.length} catatan</span></div>
        {view === 'perbandingan' ? <ComparisonTable data={comparison.slice(0, visibleCount)} summary={comparisonSummary} onDetailClick={setDetailDate} /> :
          <PengeluaranTable data={filtered.slice(0, visibleCount)} onDelete={setTransactionToDelete} onEdit={setTransactionToEdit} totalPengeluaran={totals.pengeluaran} totalTabungan={totals.tabungan} />}
        {count > visibleCount && <button type="button" className="ledger-load-more" onClick={() => setVisibleCount(value => value + 50)}>Lihat lebih banyak · {Math.min(visibleCount, count)} dari {count}</button>}
      </>)}
    </section>
    {transactionToDelete && <ConfirmationModal tone="violet" title="Hapus transaksi?" message={`Hapus “${transactionToDelete.keterangan}”? Saldo akan dikembalikan.`} onConfirm={handleConfirmDelete} onCancel={() => setTransactionToDelete(null)} />}
    {transactionToEdit && <EditTransactionModal transaction={transactionToEdit} onClose={() => setTransactionToEdit(null)} onSuccess={() => setTransactionToEdit(null)} />}
    {detailDate && <ComparisonDetailModal date={calendarDateLabel(detailDate)} transactions={filtered.filter(transaction => calendarDateKey(transaction.tanggal) === detailDate)} onClose={() => setDetailDate(null)} />}
  </div>;
}
