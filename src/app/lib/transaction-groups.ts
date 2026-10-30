import type { Transaction } from '@prisma/client';
import { calendarDateKey, calendarDateLabel } from './dates';

export function groupTransactionsByDay(transactions: Transaction[]) {
  const grouped = new Map<string, {
    dateKey: string; tanggal: string; rafa: number; monik: number;
    pengeluaran: number; tabungan: number; total: number;
  }>();
  for (const transaction of transactions) {
    const dateKey = calendarDateKey(transaction.tanggal);
    let row = grouped.get(dateKey);
    if (!row) {
      row = { dateKey, tanggal: calendarDateLabel(dateKey), rafa: 0, monik: 0, pengeluaran: 0, tabungan: 0, total: 0 };
      grouped.set(dateKey, row);
    }
    row[transaction.sumber === 'Saya' ? 'rafa' : 'monik'] += transaction.jumlah;
    row[transaction.tipe] += transaction.jumlah;
    row.total += transaction.jumlah;
  }
  return [...grouped.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
