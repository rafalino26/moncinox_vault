import { NextResponse } from 'next/server';
import { getWallets } from '@/app/actions/transactionActions'; // Adjust import path to your transaction.ts

export async function GET() {
  // 1. Reuse your existing server action logic
  const data = await getWallets();
  if (!data.rafaWallet || !data.monikWallet) {
    return NextResponse.json({ error: 'Gagal memuat wallet.' }, { status: 503 });
  }
  
  // 2. Return standard JSON
  return NextResponse.json(data);
}
