import { z } from 'zod';
import { parseCalendarDate, parseTransactionDate } from './dates';

export const PersonSchema = z.enum(['Saya', 'Pacar_Saya']);
export const RecordIdSchema = z.string().trim().min(1).max(128);
const AmountSchema = z.preprocess(
  value => typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  z.number().finite().positive().max(Number.MAX_SAFE_INTEGER),
);

export const TransactionSchema = z.object({
  keterangan: z.string().trim().min(1).max(1000),
  jumlah: AmountSchema,
  tanggal: z.unknown().transform((value, ctx) => {
    const date = parseTransactionDate(value);
    if (!date) {
      ctx.addIssue({ code: 'custom', message: 'Tanggal tidak valid.' });
      return z.NEVER;
    }
    return date;
  }),
  tipe: z.enum(['pengeluaran', 'tabungan']),
  sumber: PersonSchema,
});

export const IncomeSchema = z.object({ person: PersonSchema, amount: AmountSchema });

export const TransactionFilterSchema = z.object({
  rentang: z.enum(['harian', 'mingguan', 'bulanan', 'semua', 'custom']).default('bulanan'),
  urutkan: z.enum(['terbaru', 'terbesar', 'terkecil']).default('terbaru'),
  sumber: z.enum(['Saya', 'Pacar_Saya', 'semua']).optional(),
  tipe: z.enum(['pengeluaran', 'tabungan', 'semua']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.rentang !== 'custom') return;
  const from = value.from ? parseCalendarDate(value.from) : null;
  const to = value.to ? parseCalendarDate(value.to) : null;
  if (!from || !to || from > to) {
    ctx.addIssue({ code: 'custom', message: 'Rentang tanggal tidak valid.' });
  }
});
