'use server';
import prisma from '../lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function deleteTransaction(transactionId: string) {
    if (!transactionId) {
        return { error: "ID transaksi tidak valid." };
    }

    try {
        // Gunakan transaksi database untuk memastikan kedua operasi berhasil atau gagal bersamaan
        const deletedTransaction = await prisma.$transaction(async (tx) => {
            // 1. Cari transaksi yang akan dihapus untuk mendapatkan jumlah dan sumbernya
            const transactionToDelete = await tx.transaction.findUnique({
                where: { id: transactionId },
            });

            if (!transactionToDelete) {
                throw new Error("Transaksi tidak ditemukan.");
            }

            // 2. Kembalikan saldo ke dompet yang sesuai
            await tx.wallet.update({
                where: { person: transactionToDelete.sumber },
                data: { balance: { increment: transactionToDelete.jumlah } },
            });

            // 3. Hapus transaksi itu sendiri
            const deleted = await tx.transaction.delete({
                where: { id: transactionId },
            });

            return deleted;
        });

        revalidatePath('/');
        revalidatePath('/pengeluaran');
        revalidatePath('/tabungan');

        return { success: `Transaksi "${deletedTransaction.keterangan}" berhasil dihapus.` };
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

        if (!rafaWallet) {
            rafaWallet = await prisma.wallet.create({ data: { person: 'Saya', balance: 0 } });
        }
        if (!monikWallet) {
            monikWallet = await prisma.wallet.create({ data: { person: 'Pacar_Saya', balance: 0 } });
        }
        
        return { rafaWallet, monikWallet };
    } catch (error) {
        return { rafaWallet: null, monikWallet: null };
    }
}

// --- FUNGSI BARU UNTUK MENAMBAH UANG SAKU ---
export async function addUangSaku(formData: FormData) {
    const person = formData.get('person') as 'Saya' | 'Pacar_Saya';
    const amount = Number(formData.get('amount'));

    if (!person || !amount || amount <= 0) {
        return { error: "Jumlah tidak valid." };
    }

    try {
        await prisma.wallet.update({
            where: { person: person },
            data: { balance: { increment: amount } },
        });
        revalidatePath('/');
        return { success: `Uang saku untuk ${person === 'Saya' ? 'Rafa' : 'Monik'} berhasil ditambahkan!` };
    } catch (error) {
        return { error: "Gagal memperbarui sisa uang." };
    }
}


// ... (skema Zod dan fungsi addTransaction tetap sama)
const TransactionSchema = z.object({
    keterangan: z.string().optional(),
    jumlah: z.coerce.number().positive(),
    tanggal: z.string(),
    tipe: z.enum(['pengeluaran', 'tabungan']),
    sumber: z.enum(['Saya', 'Pacar_Saya']),
});



export async function addTransaction(formData: FormData) {
    const validatedFields = TransactionSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) return { error: "Data tidak valid." };

    const { jumlah, sumber } = validatedFields.data;

    try {
        // Gunakan transaksi database agar aman
        await prisma.$transaction(async (tx) => {
            // 1. Tambah transaksi seperti biasa
            await tx.transaction.create({
                data: {
                    ...validatedFields.data,
                    tanggal: new Date(validatedFields.data.tanggal),
                    keterangan: validatedFields.data.keterangan ?? (validatedFields.data.tipe === 'tabungan' ? 'Tabungan' : ''),
                },
            });
            // 2. Kurangi sisa uang di dompet yang sesuai
            await tx.wallet.update({
                where: { person: sumber },
                data: { balance: { decrement: jumlah } },
            });
        });

        revalidatePath('/');
        revalidatePath('/pengeluaran');
        revalidatePath('/tabungan');
        return { success: "Transaksi berhasil ditambahkan!" };
    } catch (error) {
        console.error(error);
        return { error: "Gagal menyimpan transaksi. Pastikan sisa uang mencukupi." };
    }
}

// --- FUNGSI BARU YANG LEBIH CANGGIH ---
export async function getFilteredTransactions({
    tipe,
    rentang, 
    urutkan,
    sumber,
}: {
    tipe?: 'pengeluaran' | 'tabungan';
    rentang: string;
    urutkan: string;
    sumber?: 'Saya' | 'Pacar_Saya';
}) {
    let whereClause: any = {};
    
    if (tipe) {
        whereClause.tipe = tipe;
    }

    if (rentang !== 'semua') {
        const now = new Date();
        let tanggalMulai = new Date();
        
        // --- LOGIKA BARU DI SINI ---
        if (rentang === 'harian') {
            tanggalMulai.setHours(0, 0, 0, 0); // Awal hari ini
        } else if (rentang === 'mingguan') {
            const hariIni = now.getDay(); // Minggu = 0, Senin = 1, ...
            const jarakKeSenin = hariIni === 0 ? 6 : hariIni - 1;
            tanggalMulai.setDate(now.getDate() - jarakKeSenin);
            tanggalMulai.setHours(0, 0, 0, 0); // Set ke awal hari Senin
        } else if (rentang === 'bulanan') {
            tanggalMulai = new Date(now.getFullYear(), now.getMonth(), 1); // Tanggal 1 bulan ini
        }
        
        whereClause.tanggal = { gte: tanggalMulai };
    }

    if (sumber) {
        whereClause.sumber = sumber;
    }

    let orderBy: any = { tanggal: 'desc' };
    if (urutkan === 'terbesar') orderBy = { jumlah: 'desc' };
    else if (urutkan === 'terkecil') orderBy = { jumlah: 'asc' };
    
    try {
        const transactions = await prisma.transaction.findMany({ where: whereClause, orderBy: orderBy });
        return transactions;
    } catch (error) {
        console.error("Gagal mengambil transaksi:", error);
        return [];
    }
}

export async function getDashboardStats() {
    const now = new Date();
    // Tentukan awal dan akhir bulan ini
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    try {
        // 1. Hitung total pengeluaran bulan ini
        const totalPengeluaranResult = await prisma.transaction.aggregate({
            _sum: { jumlah: true },
            where: {
                tipe: 'pengeluaran',
                tanggal: { gte: startOfMonth, lte: endOfMonth },
            },
        });
        const totalPengeluaran = totalPengeluaranResult._sum.jumlah || 0;

        // 2. Hitung total pemasukan (tabungan) bulan ini
        const totalPemasukanResult = await prisma.transaction.aggregate({
            _sum: { jumlah: true },
            where: {
                tipe: 'tabungan',
                tanggal: { gte: startOfMonth, lte: endOfMonth },
            },
        });
        const totalPemasukan = totalPemasukanResult._sum.jumlah || 0;

        // 3. Cari pengeluaran terbesar bulan ini
        const pengeluaranTerbesar = await prisma.transaction.findFirst({
            where: {
                tipe: 'pengeluaran',
                tanggal: { gte: startOfMonth, lte: endOfMonth },
            },
            orderBy: {
                jumlah: 'desc',
            },
        });

        // 4. Hitung arus kas bersih
        const arusKas = totalPemasukan - totalPengeluaran;

        const weeklySpending = await prisma.transaction.findMany({
            where: {
                tipe: 'pengeluaran',
                tanggal: {
                    gte: sevenDaysAgo,
                },
            },
            orderBy: {
                tanggal: 'asc',
            },
        });

        return {
            totalPemasukan,
            totalPengeluaran,
            arusKas,
            pengeluaranTerbesar,
            weeklySpending, // <-- Kembalikan data baru
        };
    } catch (error) {
        console.error("Gagal mengambil statistik:", error);
        // Kembalikan nilai default jika ada error
        return { totalPemasukan: 0, totalPengeluaran: 0, arusKas: 0, pengeluaranTerbesar: null, weeklySpending: [] };
    }
}