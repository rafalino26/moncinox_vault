'use server';
import prisma from '../lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
    if (!validatedFields.success) {
        return { error: "Data tidak valid." };
    }

    // ↓↓↓ PERUBAHAN UTAMA ADA DI SINI ↓↓↓
    try {
        const { keterangan, ...restOfData } = validatedFields.data;

        // Siapkan data untuk disimpan.
        // Jika keterangan tidak ada (undefined), beri nilai default "Tabungan".
        const dataToSave = {
            ...restOfData,
            tanggal: new Date(validatedFields.data.tanggal),
            keterangan: keterangan ?? 'Tabungan', // Operator '??' memberikan nilai default
        };

        // Kirim data yang sudah aman ke Prisma
        await prisma.transaction.create({
            data: dataToSave,
        });

        revalidatePath('/');
        revalidatePath('/pengeluaran');
        revalidatePath('/tabungan');

        return { success: "Transaksi berhasil ditambahkan." };
    } catch (error) {
        console.error(error);
        return { error: "Gagal menyimpan ke database." };
    }
}
// --- FUNGSI BARU YANG LEBIH CANGGIH ---
export async function getFilteredTransactions({
    tipe,
    rentang, 
    urutkan,
    sumber,
}: {
    tipe: 'pengeluaran' | 'tabungan';
    rentang: string;
    urutkan: string;
    sumber?: 'Saya' | 'Pacar_Saya';
}) {
    let whereClause: any = { tipe: tipe };

    if (rentang !== 'semua') {
        const now = new Date();
        let tanggalMulai = new Date();
        if (rentang === 'harian') tanggalMulai.setHours(0, 0, 0, 0); 
        else if (rentang === 'mingguan') tanggalMulai.setDate(now.getDate() - 7);
        else if (rentang === 'bulanan') tanggalMulai.setMonth(now.getMonth() - 1);
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