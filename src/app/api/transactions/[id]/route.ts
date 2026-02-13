import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// ==========================================
// HANDLE DELETE REQUESTS
// ==========================================
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const transactionId = params.id;

    if (!transactionId) {
        return NextResponse.json({ error: "ID transaksi tidak valid." }, { status: 400 });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Find the transaction
            const transactionToDelete = await tx.transaction.findUnique({
                where: { id: transactionId },
            });

            if (!transactionToDelete) {
                throw new Error("Transaksi tidak ditemukan.");
            }

            // 2. Reverse the math in the wallet
            await tx.wallet.update({
                where: { person: transactionToDelete.sumber },
                data: { 
                    balance: transactionToDelete.tipe === 'pengeluaran' 
                        ? { increment: transactionToDelete.jumlah } 
                        : { decrement: transactionToDelete.jumlah } 
                },
            });

            // 3. Delete the transaction
            await tx.transaction.delete({
                where: { id: transactionId },
            });
        });

        return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus." });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Gagal menghapus transaksi." }, { status: 500 });
    }
}

// ==========================================
// HANDLE PUT (EDIT) REQUESTS
// ==========================================
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const transactionId = params.id;

    try {
        const body = await request.json();
        const { keterangan, jumlah, tanggal, tipe, sumber } = body;

        await prisma.$transaction(async (tx) => {
            // 1. Get the OLD transaction
            const oldTx = await tx.transaction.findUnique({ where: { id: transactionId } });
            if (!oldTx) throw new Error("Transaction not found");

            // 2. REVERSE the old math from the old wallet
            await tx.wallet.update({
                where: { person: oldTx.sumber },
                data: {
                    balance: oldTx.tipe === 'pengeluaran' 
                        ? { increment: oldTx.jumlah } 
                        : { decrement: oldTx.jumlah }
                }
            });

            // 3. APPLY the new math to the new wallet
            await tx.wallet.update({
                where: { person: sumber },
                data: {
                    balance: tipe === 'pengeluaran'
                        ? { decrement: Number(jumlah) }
                        : { increment: Number(jumlah) }
                }
            });

            // 4. UPDATE the transaction record
            await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    keterangan: keterangan,
                    jumlah: Number(jumlah),
                    tipe: tipe,
                    sumber: sumber,
                    tanggal: new Date(tanggal),
                }
            });
        });

        return NextResponse.json({ success: true, message: "Transaksi berhasil diupdate." });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: "Gagal mengupdate transaksi." }, { status: 500 });
    }
}