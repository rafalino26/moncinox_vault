import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = performance.now();
  try {
    const data = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data, { headers: {
      'Cache-Control': 'private, no-store',
      'Server-Timing': `db;dur=${(performance.now() - started).toFixed(1)}`,
    } });
  } catch (error) {
    console.error('Gagal memuat transaksi:', error);
    return NextResponse.json({ error: 'Gagal memuat transaksi.' }, { status: 503 });
  }
}
