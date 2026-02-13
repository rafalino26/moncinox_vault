import { NextResponse } from 'next/server';
// ADJUST THIS IMPORT PATH to wherever your Server Actions file is located!
import { deleteTransaction, updateTransaction } from '@/app/actions/transactionActions'; 

// ==========================================
// 1. THIS LISTENS FOR FLUTTER'S "DELETE" SWIPE
// ==========================================
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // <-- NEXT.JS 15 FIX: Typed as Promise
) {
    // <-- NEXT.JS 15 FIX: Await the params
    const { id: transactionId } = await params;

    const result = await deleteTransaction(transactionId);

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.success });
}

// ==========================================
// 2. THIS LISTENS FOR FLUTTER'S "EDIT" SAVE BUTTON
// ==========================================
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // <-- NEXT.JS 15 FIX: Typed as Promise
) {
    // <-- NEXT.JS 15 FIX: Await the params
    const { id: transactionId } = await params;

    try {
        const body = await request.json(); 

        const result = await updateTransaction(transactionId, body);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request" }, { status: 500 });
    }
}