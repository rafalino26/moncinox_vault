import type { Transaction } from '@prisma/client';
import { parseCalendarDate } from './dates';

export type TransactionFilters = {
  rentang?: string;
  urutkan?: string;
  sumber?: string | null;
  tipe?: string | null;
  from?: string | null;
  to?: string | null;
};

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters, now = new Date()) {
  const { rentang = 'harian', urutkan = 'terbaru', sumber, tipe, from, to } = filters;
  let start: Date | undefined;
  let end: Date | undefined;
  if (rentang === 'custom') {
    if (!from || !to) return [];
    const startDate = parseCalendarDate(from);
    const endDate = parseCalendarDate(to);
    if (!startDate || !endDate || startDate > endDate) return [];
    start = startDate;
    end = endDate;
    end.setDate(end.getDate() + 1);
  } else if (rentang === 'harian') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (rentang === 'mingguan') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (rentang === 'bulanan') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  const filtered = transactions.filter(transaction => {
    if (sumber && sumber !== 'semua' && transaction.sumber !== sumber) return false;
    if (tipe && tipe !== 'semua' && transaction.tipe !== tipe) return false;
    const date = new Date(transaction.tanggal);
    return (!start || date >= start) && (!end || date < end);
  });
  return filtered.sort((a, b) => {
    if (urutkan === 'terbesar') return b.jumlah - a.jumlah;
    if (urutkan === 'terkecil') return a.jumlah - b.jumlah;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getChartStats(transactions: Transaction[], now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let totalPengeluaran = 0;
  let totalPemasukan = 0;
  const weeklySpending: Transaction[] = [];
  for (const transaction of transactions) {
    const date = new Date(transaction.tanggal);
    if (date >= start && date < end) {
      if (transaction.tipe === 'pengeluaran') totalPengeluaran += transaction.jumlah;
      else totalPemasukan += transaction.jumlah;
    }
    if (transaction.tipe === 'pengeluaran' && date >= sevenDaysAgo && date < tomorrow) weeklySpending.push(transaction);
  }
  weeklySpending.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  return { totalPengeluaran, totalPemasukan, weeklySpending };
}

export function getSpendingSummary(transactions: Transaction[], person: string, range: string, now = new Date()) {
  const days = range === 'daily' ? 1 : range === 'weekly' ? 7 : range === 'monthly' ? 30 : null;
  const start = days ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1) : null;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let expense = 0, income = 0;
  for (const transaction of transactions) {
    if (person !== 'all' && transaction.sumber !== person) continue;
    const date = new Date(transaction.tanggal);
    if (start && (date < start || date >= end)) continue;
    if (transaction.tipe === 'pengeluaran') expense += transaction.jumlah;
    else income += transaction.jumlah;
  }
  return { expense, income, totalArusKas: expense + income };
}
