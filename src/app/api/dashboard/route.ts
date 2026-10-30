import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/app/actions/transactionActions';

export async function GET() {
  try {
    return NextResponse.json(await getDashboardStats());
  } catch {
    return NextResponse.json({ error: 'Gagal memuat dashboard.' }, { status: 503 });
  }
}
