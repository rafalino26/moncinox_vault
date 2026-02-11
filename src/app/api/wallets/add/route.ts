import { NextResponse } from 'next/server';
import { addUangSaku } from '@/app/actions/transactionActions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Use 'const' here, not 'final'!
    const { person, amount } = body; 

    // Validate input
    if (!person || !amount) {
        return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    // Convert JSON back to FormData to use your existing action
    const formData = new FormData();
    formData.append('person', person);
    formData.append('amount', amount.toString());

    const result = await addUangSaku(formData);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: result.success });
  } catch (error) {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}