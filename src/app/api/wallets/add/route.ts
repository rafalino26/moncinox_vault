import { NextResponse } from 'next/server';
import { addUangSaku } from '@/app/actions/transactionActions';
import { IncomeSchema } from '@/app/lib/validation';

export async function POST(request: Request) {
  try {
    const parsed = IncomeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
    const { person, amount } = parsed.data;

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
