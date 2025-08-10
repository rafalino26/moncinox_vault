'use client';

import { useFormStatus } from 'react-dom';
import { FiTrash2 } from 'react-icons/fi';
import { deletePemasukan } from '@/app/actions/transactionActions';

export default function DeletePemasukanButton({ id }: { id: string }) {
    const { pending } = useFormStatus();

    return (
        // Ganti 'action' untuk menggunakan fungsi pembungkus
        <form action={async () => {
            // Fungsi pembungkus ini tidak mengembalikan nilai, sehingga errornya hilang
            await deletePemasukan(id);
        }}>
            <button type="submit" disabled={pending} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full disabled:opacity-50">
                {pending ? <span className="animate-spin text-lg">⏳</span> : <FiTrash2 />}
            </button>
        </form>
    );
}