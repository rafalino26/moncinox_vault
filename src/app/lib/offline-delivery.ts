import prisma from './prisma';
import { TransactionSchema, RecordIdSchema } from './validation';
import { z } from 'zod';

const Kind = z.enum(['create', 'update', 'delete', 'income-create', 'income-delete']);
export const DeliverySchema = z.object({ id: z.string().uuid(), transaction: TransactionSchema, kind: Kind.optional(),
  target: z.object({ id: RecordIdSchema, expected: TransactionSchema }).optional(),
}).refine(value => !['update', 'delete', 'income-delete'].includes(value.kind || '') || !!value.target);
const canonical = (data: z.infer<typeof TransactionSchema>) => ({ ...data, tanggal: data.tanggal.toISOString() });

export async function deliverOfflineTransaction(input: unknown) {
  const parsed = DeliverySchema.safeParse(input);
  if (!parsed.success) return { status: 400, error: 'Data transaksi tidak valid. Catatan tetap tersimpan di antrean.' } as const;
  const { id, transaction: data, target } = parsed.data;
  const kind = parsed.data.kind || 'create';
  // Keep the legacy create fingerprint identical for already persisted delivery IDs.
  const payload = JSON.stringify(kind === 'create' ? canonical(data) : { kind, transaction: canonical(data),
    ...(target ? { target: { id: target.id, expected: canonical(target.expected) } } : {}) });
  return prisma.$transaction(async tx => {
    // Serialize only equal delivery IDs across tabs/devices; receipt and balance commit atomically.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
    const receipt = await tx.offlineTransactionReceipt.findUnique({ where: { id } });
    if (receipt && receipt.payload !== payload) return { status: 409, code: 'ID_REUSED', error: 'ID pengiriman sudah dipakai untuk catatan berbeda. Periksa antrean.' } as const;
    if (receipt) return { status: 200, duplicate: true, id } as const;
    const deltas = new Map<string, number>();
    const delta = (person: string, value: number) => deltas.set(person, (deltas.get(person) || 0) + value);
    let recordId = id;
    if (kind === 'create') {
      await tx.transaction.create({ data: { ...data, id } }); delta(data.sumber, -data.jumlah);
    } else if (kind === 'income-create') {
      await tx.pemasukan.create({ data: { id, jumlah: data.jumlah, sumber: data.sumber, createdAt: data.tanggal } });
      delta(data.sumber, data.jumlah);
    } else if (target) {
      recordId = target.id;
      if (kind === 'income-delete') {
        await tx.$queryRaw`SELECT "id" FROM "Pemasukan" WHERE "id" = ${target.id} FOR UPDATE`;
        const current = await tx.pemasukan.findUnique({ where: { id: target.id } });
        if (!current || current.jumlah !== target.expected.jumlah || current.sumber !== target.expected.sumber || current.createdAt.toISOString() !== target.expected.tanggal.toISOString()) {
          return { status: 409, code: 'CONFLICT', error: 'Pemasukan sudah berubah atau dihapus di perangkat lain. Data server dipertahankan.' } as const;
        }
        await tx.pemasukan.delete({ where: { id: target.id } }); delta(current.sumber, -current.jumlah);
      } else {
        await tx.$queryRaw`SELECT "id" FROM "Transaction" WHERE "id" = ${target.id} FOR UPDATE`;
        const current = await tx.transaction.findUnique({ where: { id: target.id } });
        const expected = target.expected;
        if (!current || current.jumlah !== expected.jumlah || current.sumber !== expected.sumber || current.tipe !== expected.tipe ||
            current.keterangan !== expected.keterangan || current.tanggal.toISOString() !== expected.tanggal.toISOString()) {
          return { status: 409, code: 'CONFLICT', error: 'Catatan sudah berubah atau dihapus di perangkat lain. Perubahan ini belum diterapkan.' } as const;
        }
        delta(current.sumber, current.jumlah);
        if (kind === 'delete') await tx.transaction.delete({ where: { id: target.id } });
        else { await tx.transaction.update({ where: { id: target.id }, data }); delta(data.sumber, -data.jumlah); }
      }
    }
    for (const [person, amount] of [...deltas].sort(([a], [b]) => a.localeCompare(b))) {
      if (amount) await tx.wallet.update({ where: { person }, data: { balance: { increment: amount } } });
    }
    await tx.offlineTransactionReceipt.create({ data: { id, payload, transactionId: recordId } });
    return { status: 201, duplicate: false, id } as const;
  });
}
