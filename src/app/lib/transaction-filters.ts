import type { Transaction } from '@prisma/client';

export type TransactionFilters = {
  rentang?: string;
  urutkan?: string;
  sumber?: string | null;
  tipe?: string | null;
  from?: string | null;
  to?: string | null;
};

function localDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters, now = new Date()) {
  const { rentang = 'harian', urutkan = 'terbaru', sumber, tipe, from, to } = filters;
  let start: Date | undefined;
  let end: Date | undefined;
  if (rentang === 'custom' && from && to) {
    start = localDate(from);
    end = localDate(to);
    end.setDate(end.getDate() + 1);
  } else if (rentang === 'harian') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (rentang === 'mingguan') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else if (rentang === 'bulanan') {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
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
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  let totalPengeluaran = 0;
  let totalPemasukan = 0;
  const weeklySpending: Transaction[] = [];
  for (const transaction of transactions) {
    const date = new Date(transaction.tanggal);
    if (date >= start && date < end) {
      if (transaction.tipe === 'pengeluaran') totalPengeluaran += transaction.jumlah;
      else totalPemasukan += transaction.jumlah;
    }
    if (transaction.tipe === 'pengeluaran' && date >= sevenDaysAgo) weeklySpending.push(transaction);
  }
  weeklySpending.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  return { totalPengeluaran, totalPemasukan, weeklySpending };
}
