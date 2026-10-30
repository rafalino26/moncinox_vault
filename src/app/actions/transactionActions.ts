'use server';
import prisma from '../lib/prisma';
import type { Pemasukan, Prisma, Transaction, Wallet } from '@prisma/client';
import { IncomeSchema, RecordIdSchema, TransactionSchema, TransactionFilterSchema } from '../lib/validation';
import { parseCalendarDate } from '../lib/dates';

type MutationResult<T> =
    | ({ success: string; error?: undefined } & T)
    | { success?: undefined; error: string };

class TransactionConflict extends Error {}

export async function deleteTransaction(transactionId: string): Promise<MutationResult<{ wallet: Wallet }>> {
    if (!RecordIdSchema.safeParse(transactionId).success) {
        return { error: "ID transaksi tidak valid." };
    }
    transactionId = transactionId.trim();

    try {
        // Gunakan transaksi database untuk memastikan kedua operasi berhasil atau gagal bersamaan
        const saved = await prisma.$transaction(async (tx) => {
            // Lock/remove the record before changing wallets, matching edit lock order.
            const deleted = await tx.transaction.delete({ where: { id: transactionId } });
            const wallet = await tx.wallet.update({
                where: { person: deleted.sumber },
                data: { balance: { increment: deleted.jumlah } },
            });

            return { deleted, wallet };
        });

        return { success: `Transaksi "${saved.deleted.keterangan}" berhasil dihapus.`, wallet: saved.wallet };
    } catch (error) {
        console.error(error);
        return { error: "Gagal menghapus transaksi." };
    }
}

export async function getWallets() {
    try {
        const wallets = await prisma.wallet.findMany();
        // Pastikan kedua dompet ada, jika tidak, buat baru.
        let rafaWallet = wallets.find(w => w.person === 'Saya');
        let monikWallet = wallets.find(w => w.person === 'Pacar_Saya');

        [rafaWallet, monikWallet] = await Promise.all([
            rafaWallet ?? prisma.wallet.upsert({ where: { person: 'Saya' }, create: { person: 'Saya', balance: 0 }, update: {} }),
            monikWallet ?? prisma.wallet.upsert({ where: { person: 'Pacar_Saya' }, create: { person: 'Pacar_Saya', balance: 0 }, update: {} }),
        ]);
        
        return { rafaWallet, monikWallet };
    } catch (error) {
        return { rafaWallet: null, monikWallet: null };
    }
}

export async function addUangSaku(formData: FormData): Promise<MutationResult<{ wallet: Wallet; income: Pemasukan }>> {
    const validated = IncomeSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: "Jumlah tidak valid." };
    const { person, amount } = validated.data;

    try {
        const saved = await prisma.$transaction(async (tx) => {
            // 1. Update saldo dompet
            const updatedWallet = await tx.wallet.update({ where: { person }, data: { balance: { increment: amount } } });
            // 2. Buat catatan di riwayat pemasukan
            const income = await tx.pemasukan.create({ data: { jumlah: amount, sumber: person } });
            return { wallet: updatedWallet, income };
        });
        // Return the committed balance so the submitting client can update directly.
        return { success: "Pemasukan berhasil dicatat!", ...saved };
    } catch (error) { return { error: "Gagal menambah pemasukan." } }
}

// BARU: Fungsi untuk mengambil riwayat pemasukan
export async function getPemasukanHistory() {
    return prisma.pemasukan.findMany({ orderBy: { createdAt: 'desc' } });
}

// BARU: Fungsi untuk menghapus pemasukan (dan mengembalikan saldo)
export async function deletePemasukan(pemasukanId: string): Promise<MutationResult<{ wallet: Wallet }>> {
    if (!RecordIdSchema.safeParse(pemasukanId).success) return { error: 'ID pemasukan tidak valid.' };
    pemasukanId = pemasukanId.trim();
    try {
        const wallet = await prisma.$transaction(async (tx) => {
            const pemasukanToDelete = await tx.pemasukan.delete({ where: { id: pemasukanId } });
            const updatedWallet = await tx.wallet.update({ where: { person: pemasukanToDelete.sumber }, data: { balance: { decrement: pemasukanToDelete.jumlah } } });
            return updatedWallet;
        });
        return { success: "Pemasukan berhasil dihapus.", wallet };
    } catch (error) { return { error: "Gagal menghapus pemasukan." } }
}





export async function addTransaction(formData: FormData): Promise<MutationResult<{ transaction: Transaction; wallet: Wallet }>> {
    const validatedFields = TransactionSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) return { error: "Data tidak valid." };

    const { jumlah, sumber } = validatedFields.data;

    try {
        // Gunakan transaksi database agar aman
        const saved = await prisma.$transaction(async (tx) => {
            // 1. Tambah transaksi seperti biasa
            const transaction = await tx.transaction.create({
                data: {
                    ...validatedFields.data,
                    tanggal: validatedFields.data.tanggal,
                    keterangan: validatedFields.data.keterangan ?? (validatedFields.data.tipe === 'tabungan' ? 'Tabungan' : ''),
                },
            });
            // 2. Kurangi sisa uang di dompet yang sesuai
            const wallet = await tx.wallet.update({
                where: { person: sumber },
                data: { balance: { decrement: jumlah } },
            });
            return { transaction, wallet };
        });

        // Return both saved records without a second read or a full route refresh.
        return { success: "Transaksi berhasil ditambahkan!", ...saved };
    } catch (error) {
        console.error(error);
        return { error: "Gagal menyimpan transaksi. Silakan coba lagi." };
    }
}


export async function getFilteredTransactions(filters: {
    tipe?: 'pengeluaran' | 'tabungan';
    rentang: string; 
    urutkan: string;
    sumber?: 'Saya' | 'Pacar_Saya';
    from?: string;
    to?: string;
}) {
    const { tipe, rentang, urutkan, sumber, from, to } = TransactionFilterSchema.parse(filters);
    const whereClause: Prisma.TransactionWhereInput = {};
    if (tipe && tipe !== 'semua') whereClause.tipe = tipe;

    // --- LOGIKA BARU UNTUK RENTANG TANGGAL ---
    if (rentang === 'custom' && from && to) {
        const startDate = parseCalendarDate(from)!;
        const endDate = parseCalendarDate(to)!;
        endDate.setDate(endDate.getDate() + 1);
        whereClause.tanggal = { gte: startDate, lt: endDate };
    } else if (rentang !== 'semua') {
        const now = new Date();
        let tanggalMulai = new Date();
        
        if (rentang === 'harian') tanggalMulai.setHours(0, 0, 0, 0);
        else if (rentang === 'mingguan') {
            const hariIni = now.getDay();
            const jarakKeSenin = hariIni === 0 ? 6 : hariIni - 1;
            tanggalMulai.setDate(now.getDate() - jarakKeSenin);
            tanggalMulai.setHours(0, 0, 0, 0);
        } else if (rentang === 'bulanan') {
            tanggalMulai.setDate(now.getDate() - 29);
            tanggalMulai.setHours(0, 0, 0, 0);
        }
        
        if(rentang !== 'custom') whereClause.tanggal = { gte: tanggalMulai,
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) };
    }
    // Jika rentang === 'semua', kita tidak menambahkan filter tanggal sama sekali.

    if (sumber && sumber !== 'semua') whereClause.sumber = sumber;

    let orderBy: Prisma.TransactionOrderByWithRelationInput = { createdAt: 'desc' };
    if (urutkan === 'terbesar') orderBy = { jumlah: 'desc' };
    else if (urutkan === 'terkecil') orderBy = { jumlah: 'asc' };
    
    return prisma.transaction.findMany({ where: whereClause, orderBy });
}


export async function getDashboardStats() {
    const now = new Date();
    // Tentukan awal dan akhir bulan ini
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    try {
        // 1. Hitung total pengeluaran bulan ini
        const pengeluaranQuery = prisma.transaction.aggregate({
            _sum: { jumlah: true },
            where: {
                tipe: 'pengeluaran',
                tanggal: { gte: startOfMonth, lt: endOfMonth },
            },
        });

        // 2. Hitung total pemasukan (tabungan) bulan ini
        const pemasukanQuery = prisma.transaction.aggregate({
            _sum: { jumlah: true },
            where: {
                tipe: 'tabungan',
                tanggal: { gte: startOfMonth, lt: endOfMonth },
            },
        });

        // 3. Cari pengeluaran terbesar bulan ini
        const terbesarQuery = prisma.transaction.findFirst({
            where: {
                tipe: 'pengeluaran',
                tanggal: { gte: startOfMonth, lt: endOfMonth },
            },
            orderBy: {
                jumlah: 'desc',
            },
        });

        // 4. Hitung arus kas bersih

        const weeklyQuery = prisma.transaction.findMany({
            where: {
                tipe: 'pengeluaran',
                tanggal: {
                    gte: sevenDaysAgo,
                    lt: tomorrow,
                },
            },
            orderBy: {
                tanggal: 'asc',
            },
        });

        const [totalPengeluaranResult, totalPemasukanResult, pengeluaranTerbesar, weeklySpending] = await Promise.all([
            pengeluaranQuery, pemasukanQuery, terbesarQuery, weeklyQuery,
        ]);
        const totalPengeluaran = totalPengeluaranResult._sum.jumlah ?? 0;
        const totalPemasukan = totalPemasukanResult._sum.jumlah ?? 0;
        const arusKas = totalPemasukan - totalPengeluaran;
        return {
            totalPemasukan,
            totalPengeluaran,
            arusKas,
            pengeluaranTerbesar,
            weeklySpending, // <-- Kembalikan data baru
        };
    } catch (error) {
        console.error("Gagal mengambil statistik:", error);
        throw error;
    }
}


export async function updateTransaction(transactionId: string, updatedData: unknown): Promise<MutationResult<{ transaction: Transaction; wallets: Wallet[] }>> {
    const validated = TransactionSchema.safeParse(updatedData);
    // Existing web and Android clients may send a Date or an ISO string.
    if (!validated.success || !RecordIdSchema.safeParse(transactionId).success) {
        return { error: 'Data tidak valid.' };
    }
    transactionId = transactionId.trim();
    const data = validated.data;
    try {
        const saved = await prisma.$transaction(async (tx) => {
            // 1. Get the OLD transaction
            const oldTx = await tx.transaction.findUnique({ where: { id: transactionId } });
            if (!oldTx) throw new Error("Transaction not found");

            // Compare-and-set: concurrent edits must not both reverse the same old amount.
            const changed = await tx.transaction.updateMany({
                where: { id: transactionId, jumlah: oldTx.jumlah, sumber: oldTx.sumber,
                    tipe: oldTx.tipe, tanggal: oldTx.tanggal, keterangan: oldTx.keterangan },
                data,
            });
            if (changed.count !== 1) throw new TransactionConflict('Transaksi sudah berubah. Muat ulang data sebelum mencoba lagi.');

            // Use the same wallet lock order for transfers in either direction.
            const deltas = new Map<string, number>();
            deltas.set(oldTx.sumber, oldTx.jumlah);
            deltas.set(data.sumber, (deltas.get(data.sumber) ?? 0) - data.jumlah);
            const wallets: Wallet[] = [];
            for (const person of [...deltas.keys()].sort()) {
                wallets.push(await tx.wallet.update({ where: { person }, data: { balance: { increment: deltas.get(person)! } } }));
            }
            return { transaction: { ...oldTx, ...data }, wallets };
        });

        return { success: 'Transaksi berhasil diperbarui.', ...saved };
    } catch (error) {
        if (error instanceof TransactionConflict) return { error: error.message };
        console.error("Update failed:", error);
        return { error: "Failed to update transaction" };
    }
}
