import prisma from './prisma';
import { TransactionSchema } from './validation';
import { z } from 'zod';

export const DeliverySchema = z.object({ id: z.string().uuid(), transaction: TransactionSchema });

export async function deliverOfflineTransaction(input: unknown) {
  const parsed = DeliverySchema.safeParse(input);
  if (!parsed.success) return { status: 400, error: 'Data transaksi tidak valid. Catatan tetap tersimpan di antrean.' } as const;
  const { id, transaction: data } = parsed.data;
  const payload = JSON.stringify({ ...data, tanggal: data.tanggal.toISOString() });
  return prisma.$transaction(async tx => {
    // Serialize only equal delivery IDs across tabs/devices; receipt and balance commit atomically.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
    const receipt = await tx.offlineTransactionReceipt.findUnique({ where: { id } });
    if (receipt && receipt.payload !== payload) return { status: 409, error: 'ID pengiriman sudah dipakai untuk catatan berbeda. Periksa antrean.' } as const;
    if (receipt) return { status: 200, duplicate: true, id } as const;
    const transaction = await tx.transaction.create({ data: { ...data, id } });
    await tx.wallet.update({ where: { person: data.sumber }, data: { balance: { decrement: data.jumlah } } });
    await tx.offlineTransactionReceipt.create({ data: { id, payload, transactionId: transaction.id } });
    return { status: 201, duplicate: false, id } as const;
  });
}
