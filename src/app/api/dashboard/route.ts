import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/app/actions/transactionActions';

export async function GET() {
  const data = await getDashboardStats();
  
  // You might need to serialize Dates if your stats contain raw Date objects
  // But NextResponse.json handles basic JSON serialization automatically
  return NextResponse.json(data);
}