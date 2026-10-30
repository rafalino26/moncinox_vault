'use client';
import { useState } from 'react';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';
import { usePathname, useSearchParams } from 'next/navigation';
import { periodLabels } from '../../lib/ledger';
import { parseCalendarDate } from '../../lib/dates';
import LedgerSelect from './LedgerSelect';

export function useLedgerQuery() {
  const params = useSearchParams();
  const pathname = usePathname();
  const rentang = params.get('rentang') || 'bulanan';
  const filters = { rentang, sumber: params.get('sumber') || 'semua', urutkan: params.get('urutkan') || 'terbaru',
    from: params.get('from') || '', to: params.get('to') || '' };
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value === 'semua' && key !== 'rentang') next.delete(key); else next.set(key, value);
    if (key === 'rentang' && value !== 'custom') { next.delete('from'); next.delete('to'); }
    window.history.replaceState(null, '', `${pathname}?${next}`);
  };
  return { filters, update, tipe: params.get('tipe') || 'semua' };
}

export default function LedgerFilters({ filters, update, search, onSearch, income = false }: {
  filters: ReturnType<typeof useLedgerQuery>['filters']; update: (key: string, value: string) => void;
  search: string; onSearch: (value: string) => void; income?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const select = (label: string, key: keyof typeof filters, options: Record<string, string>) => <LedgerSelect
    label={label} value={filters[key]} onChange={value => update(key, value)}
    options={Object.entries(options).map(([value, text]) => ({ value, label: text }))} />;
  const from = parseCalendarDate(filters.from), to = parseCalendarDate(filters.to);
  return <div className="ledger-filters">
    <div className="ledger-search-row"><label className="ledger-search"><FiSearch aria-hidden="true" /><span className="sr-only">{income ? 'Cari pemasukan' : 'Cari transaksi'}</span>
      <input type="search" value={search} placeholder={income ? 'Cari pemasukan…' : 'Cari transaksi…'} onChange={event => onSearch(event.target.value)} /></label>
      <button type="button" className="ledger-filter-toggle" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? <FiX aria-hidden="true" /> : <FiSliders aria-hidden="true" />}<span>Filter</span>
      </button></div>
    <p className="ledger-help">{periodLabels[filters.rentang] || 'Hasil filter'} · {filters.sumber === 'semua' ? 'Berdua' : filters.sumber === 'Saya' ? 'Puskasw' : 'Miskasw'}</p>
    {expanded && <div className="ledger-filter-panel">
      {select('Periode', 'rentang', periodLabels)}
      {select('Catatan siapa?', 'sumber', { semua: 'Berdua', Saya: 'Puskasw', Pacar_Saya: 'Miskasw' })}
      {select('Urutkan', 'urutkan', { terbaru: 'Paling baru', terbesar: 'Nominal terbesar', terkecil: 'Nominal terkecil' })}
      <p className="ledger-help">Filter berlaku untuk ringkasan, daftar, dan grafik.</p>
    </div>}
    {filters.rentang === 'custom' && <div className="ledger-filter-panel">
      <label className="ledger-select-label"><span>Dari tanggal</span><input type="date" value={filters.from} onChange={event => update('from', event.target.value)} /></label>
      <label className="ledger-select-label"><span>Sampai tanggal</span><input type="date" value={filters.to} min={filters.from || undefined} onChange={event => update('to', event.target.value)} /></label>
      {(!from || !to || from > to) && <p className="ledger-help">Pilih rentang tanggal yang lengkap dan berurutan.</p>}
    </div>}
  </div>;
}
