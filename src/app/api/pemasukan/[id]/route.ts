import { NextResponse } from 'next/server';
import { deletePemasukan } from '@/app/actions/transactionActions'; // Adjust path if needed

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Next.js 15 format
) {
    const { id } = await params;
    
    const result = await deletePemasukan(id);
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: result.success });
}