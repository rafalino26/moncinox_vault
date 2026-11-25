import { NextResponse } from 'next/server';
import { deliverOfflineTransaction } from '@/app/lib/offline-delivery';

export async function POST(request: Request) {
  try {
    const result = await deliverOfflineTransaction(await request.json().catch(() => null));
    return NextResponse.json(result, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Temporary failure: client retains the same ID and retries, never creates a new delivery.
    return NextResponse.json({ error: 'Belum bisa mengirim. Catatan tetap tersimpan dan akan dicoba lagi.' }, { status: 503 });
  }
}
