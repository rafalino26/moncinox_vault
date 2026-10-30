import type { Pemasukan, Transaction } from '@prisma/client';
import { filterTransactions, type TransactionFilters } from './transaction-filters';
import { calendarDateKey, calendarDateLabel } from './dates';

export const rupiah = (value: number) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;
export const personName = (value: string) => value === 'Saya' ? 'Puskasw' : 'Miskasw';
export const periodLabels: Record<string, string> = {
  harian: 'Hari ini', mingguan: 'Minggu ini', bulanan: '30 hari terakhir', semua: 'Semua waktu', custom: 'Tanggal pilihan',
};

// Reuse the same calendar boundaries and sorting for both kinds of history.
export function filterIncome(rows: Pemasukan[], filters: TransactionFilters, now = new Date()) {
  const ids = new Set(filterTransactions(rows.map(row => ({
    ...row, tanggal: row.createdAt, tipe: 'pengeluaran' as const, keterangan: '',
  })), { ...filters, tipe: undefined }, now).map(row => row.id));
  const filtered = rows.filter(row => ids.has(row.id));
  return filtered.sort((a, b) => filters.urutkan === 'terbesar' ? b.jumlah - a.jumlah :
    filters.urutkan === 'terkecil' ? a.jumlah - b.jumlah : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export type LedgerEntry = { id: string; date: Date | string; amount: number; person: string; kind: string };
export const transactionEntries = (rows: Transaction[]): LedgerEntry[] => rows.map(row => ({
  id: row.id, date: row.tanggal, amount: row.jumlah, person: row.sumber, kind: row.tipe,
}));
export const incomeEntries = (rows: Pemasukan[]): LedgerEntry[] => rows.map(row => ({
  id: row.id, date: row.createdAt, amount: row.jumlah, person: row.sumber, kind: 'pemasukan',
}));

export function buildLedgerChart(entries: LedgerEntry[], mode: 'tren' | 'orang' | 'jenis', interval: 'hari' | 'minggu' | 'bulan') {
  const groups = new Map<string, { label: string; amount: number }>();
  for (const entry of entries) {
    const date = new Date(entry.date);
    if (mode === 'tren' && interval === 'minggu') date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    if (mode === 'tren' && interval === 'bulan') date.setDate(1);
    const key = mode === 'orang' ? entry.person : mode === 'jenis' ? entry.kind : calendarDateKey(date);
    const label = mode === 'orang' ? personName(key) : mode === 'jenis' ?
      ({ pengeluaran: 'Pengeluaran', tabungan: 'Tabungan', pemasukan: 'Pemasukan' }[key] ?? key) :
      interval === 'bulan' ? date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) :
      `${interval === 'minggu' ? 'Minggu ' : ''}${calendarDateLabel(key)}`;
    const previous = groups.get(key);
    groups.set(key, { label, amount: (previous?.amount ?? 0) + entry.amount });
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  return { labels: sorted.map(group => group.label), values: sorted.map(group => group.amount) };
}
