import { NextResponse } from 'next/server';
import { getPemasukanHistory } from '@/app/actions/transactionActions'; // Adjust path if needed

export async function GET() {
    try {
        const history = await getPemasukanHistory();
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}