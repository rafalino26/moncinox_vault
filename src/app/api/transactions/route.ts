import { NextResponse } from 'next/server';
import { getFilteredTransactions, addTransaction } from '@/app/actions/transactionActions'; // Adjust path if needed

// ==========================================
// GET: Fetch Transaction History
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Default to bulanan (monthly) if no param is provided
    const rentang = searchParams.get('rentang') || 'bulanan'; 
    const sumberParam = searchParams.get('sumber');
    const tipeParam = searchParams.get('tipe');

    // Prepare arguments for your existing Prisma action
    const args: any = { rentang, urutkan: 'terbaru' };
    if (sumberParam && sumberParam !== 'semua') args.sumber = sumberParam;
    if (tipeParam && tipeParam !== 'semua') args.tipe = tipeParam;

    const transactions = await getFilteredTransactions(args);

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data transaksi." }, { status: 500 });
  }
}

// ==========================================
// POST: Add a New Transaction
// ==========================================
export async function POST(request: Request) {
  try {
    // 1. Parse the incoming JSON from the Flutter app
    const body = await request.json();
    
    // 2. Map the JSON data into a FormData object
    // This allows us to reuse your existing server action without changing it!
    const formData = new FormData();
    
    if (body.keterangan) formData.append('keterangan', body.keterangan);
    if (body.jumlah) formData.append('jumlah', body.jumlah.toString());
    if (body.tanggal) formData.append('tanggal', body.tanggal);
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