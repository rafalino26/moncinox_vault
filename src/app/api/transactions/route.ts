import { NextResponse } from 'next/server';
import { getFilteredTransactions, addTransaction } from '@/app/actions/transactionActions'; // Adjust path if needed
import { TransactionFilterSchema, TransactionSchema } from '@/app/lib/validation';

// ==========================================
// GET: Fetch Transaction History
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const parsed = TransactionFilterSchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return NextResponse.json({ error: 'Filter tidak valid.' }, { status: 400 });
    const { sumber, tipe, ...filters } = parsed.data;
    const transactions = await getFilteredTransactions({ ...filters,
      sumber: sumber === 'semua' ? undefined : sumber,
      tipe: tipe === 'semua' ? undefined : tipe,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data transaksi." }, { status: 503 });
  }
}

// ==========================================
// POST: Add a New Transaction
// ==========================================
export async function POST(request: Request) {
  try {
    // 1. Parse the incoming JSON from the Flutter app
    const parsed = TransactionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    const body = parsed.data;
    
    // 2. Map the JSON data into a FormData object
    // This allows us to reuse your existing server action without changing it!
    const formData = new FormData();
    
    if (body.keterangan) formData.append('keterangan', body.keterangan);
    if (body.jumlah) formData.append('jumlah', body.jumlah.toString());
    formData.append('tanggal', body.tanggal.toISOString());
    if (body.tipe) formData.append('tipe', body.tipe);
    if (body.sumber) formData.append('sumber', body.sumber); // 'Saya' or 'Pacar_Saya'

    // 3. Call your existing server action
    const result = await addTransaction(formData);

    // 4. Handle the response based on what your action returns
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: result.success }, { status: 201 });
    
  } catch (error) {
    console.error("Error adding transaction:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." }, 
      { status: 500 }
    );
  }
}
