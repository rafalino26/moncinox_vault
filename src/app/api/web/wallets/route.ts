import { NextResponse } from 'next/server';
import { getWallets } from '@/app/actions/transactionActions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = performance.now();
  const wallets = await getWallets();
  if (!wallets.rafaWallet || !wallets.monikWallet) {
    return NextResponse.json({ error: 'Gagal memuat wallet.' }, { status: 503 });
  }
  return NextResponse.json(wallets, { headers: {
    'Cache-Control': 'private, no-store',
    'Server-Timing': `db;dur=${(performance.now() - started).toFixed(1)}`,
  } });
}
