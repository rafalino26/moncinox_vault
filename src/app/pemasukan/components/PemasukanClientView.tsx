'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Pemasukan } from '@prisma/client';
import { FiArrowDownLeft, FiBarChart2, FiList, FiPlus, FiTrash2 } from 'react-icons/fi';
import { deletePemasukan } from '@/app/actions/transactionActions';
import { useIncomeData, useWallet } from '@/app/components/WalletContext';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import AddUangSakuModal from '@/app/components/AddUangSakuModal';
import DataStatus from '@/app/components/DataStatus';
import LedgerHero from '@/app/components/ledger/LedgerHero';
import LedgerFilters, { useLedgerQuery } from '@/app/components/ledger/LedgerFilters';
import LedgerSelect from '@/app/components/ledger/LedgerSelect';
import { filterIncome, incomeEntries, personName, rupiah, periodLabels } from '@/app/lib/ledger';
import { calendarDateKey, calendarDateLabel } from '@/app/lib/dates';
import { StitchLoading } from '@/app/components/StitchMotion';

const LedgerChart = dynamic(() => import('@/app/components/ledger/LedgerChart'), { ssr: false,
  loading: () => <StitchLoading /> });

export default function PemasukanClientView() {
  const incomeData = useIncomeData();
  const { removeSavedIncome } = useWallet();
  const { filters, update } = useLedgerQuery();
  const view = useSearchParams().get('view') || 'tabel';
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query).trim().toLowerCase();
  const [visibleCount, setVisibleCount] = useState(50);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pemasukan | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<'Saya' | 'Pacar_Saya'>('Saya');
  const [addPerson, setAddPerson] = useState<'Saya' | 'Pacar_Saya' | null>(null);
  const filterKey = JSON.stringify(filters);
  const filtered = useMemo(() => filterIncome(incomeData.data ?? [], JSON.parse(filterKey)).filter(item =>
    !search || `uang saku ${personName(item.sumber)} ${calendarDateLabel(calendarDateKey(item.createdAt))} ${item.jumlah}`.toLowerCase().includes(search)), [incomeData.data, filterKey, search]);
  const entries = useMemo(() => incomeEntries(filtered), [filtered]);
  useEffect(() => { setVisibleCount(50); }, [filterKey, search]);
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setMutationError(null);
    try {
      const result = await deletePemasukan(itemToDelete.id);
      if (result.success) removeSavedIncome(itemToDelete.id, result.wallet);
      else setMutationError(result.error ?? 'Gagal menghapus pemasukan.');
    } catch { setMutationError('Gagal menghapus pemasukan. Silakan coba lagi.'); }
    setItemToDelete(null);
  };
  if (incomeData.isLoading && !incomeData.error) return <StitchLoading centered />;
  return <div className="ledger-page">
    <LedgerHero title="Pemasukan" subtitle="mizukuzuw & puzukuzuw" label="Total pemasukan" total={incomeData.data ? filtered.reduce((sum, item) => sum + item.jumlah, 0) : null}
      period={periodLabels[filters.rentang] || 'Hasil filter'} count={filtered.length} sticker="/stickers/stitchbareng3.png" />
    <div className="ledger-segments" aria-label="Penerima pemasukan">{[['semua', 'Semua'], ['Saya', 'Puskasw'], ['Pacar_Saya', 'Miskasw']].map(([value, label]) =>
      <button type="button" key={value} aria-pressed={filters.sumber === value} onClick={() => update('sumber', value)}>{label}</button>)}</div>
    <LedgerFilters filters={filters} update={update} search={query} onSearch={setQuery} income />
    <div className="ledger-add-income">
      <LedgerSelect<typeof selectedPerson> label="Uang saku untuk" value={selectedPerson} onChange={setSelectedPerson}
        options={[{ value: 'Saya', label: 'Puskasw' }, { value: 'Pacar_Saya', label: 'Miskasw' }]} />
      <button type="button" className="ledger-primary" onClick={() => setAddPerson(selectedPerson)}><FiPlus aria-hidden="true" />Tambah pemasukan</button>
    </div>
    <DataStatus error={incomeData.error} retry={incomeData.retry} loading={incomeData.isLoading} />
    {mutationError && <p role="alert" className="ledger-alert">{mutationError}</p>}
    <section className="ledger-sheet">
      <div className="ledger-view-tabs" aria-label="Tampilan pemasukan">{[{ value: 'tabel', label: 'Daftar', icon: FiList }, { value: 'grafik', label: 'Grafik', icon: FiBarChart2 }].map(item =>
        <button type="button" key={item.value} aria-pressed={view === item.value} onClick={() => update('view', item.value)}><item.icon aria-hidden="true" />{item.label}</button>)}</div>
      {incomeData.data && (view === 'grafik' ? <LedgerChart entries={entries} income /> : <>
        <div className="ledger-section-heading"><h2>Riwayat pemasukan</h2><span>{filtered.length} catatan</span></div>
        {filtered.length ? <ul className="ledger-rows">{filtered.slice(0, visibleCount).map(item => <li key={item.id} className="ledger-row">
          <div className="ledger-row-main"><span className="ledger-row-icon" aria-hidden="true"><FiArrowDownLeft /></span><div className="ledger-row-description"><h3>Uang saku {personName(item.sumber)}</h3><p>{calendarDateLabel(calendarDateKey(item.createdAt))}</p></div><strong className="ledger-amount">+{rupiah(item.jumlah)}</strong></div>
          <div className="ledger-row-footer"><span className="ledger-tag">Pemasukan</span><div className="ledger-row-actions"><button type="button" aria-label={`Hapus pemasukan ${personName(item.sumber)} ${rupiah(item.jumlah)}`} onClick={() => setItemToDelete(item)}><FiTrash2 aria-hidden="true" />Hapus</button></div></div>
        </li>)}</ul> : <p className="ledger-empty">Belum ada pemasukan untuk filter ini. Coba periode lain atau tambah uang saku baru.</p>}
        {filtered.length > visibleCount && <button type="button" className="ledger-load-more" onClick={() => setVisibleCount(value => value + 50)}>Lihat lebih banyak · {visibleCount} dari {filtered.length}</button>}
      </>)}
    </section>
    {addPerson && <AddUangSakuModal person={addPerson} personName={personName(addPerson)} onClose={() => setAddPerson(null)} />}
    {itemToDelete && <ConfirmationModal tone="violet" title="Hapus pemasukan?" message={`Hapus uang saku ${personName(itemToDelete.sumber)} sebesar ${rupiah(itemToDelete.jumlah)}? Saldo akan dikurangi.`} onConfirm={handleDelete} onCancel={() => setItemToDelete(null)} />}
  </div>;
}
