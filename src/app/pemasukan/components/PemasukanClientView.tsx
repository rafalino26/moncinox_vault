'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Pemasukan } from '@prisma/client';
import { deletePemasukan } from '@/app/actions/transactionActions';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import { FiTrash2 } from 'react-icons/fi';

export default function PemasukanClientView({ history }: { history: Pemasukan[] }) {
    const router = useRouter();
    const [itemToDelete, setItemToDelete] = useState<Pemasukan | null>(null);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        await deletePemasukan(itemToDelete.id);
        setItemToDelete(null);
        router.refresh();
    };

    return (
        <>
            <div className="space-y-3">
                {history.length > 0 ? (
                    history.map(item => (
                        <div key={item.id} className="bg-white/40 backdrop-blur-lg p-3 sm:p-4 rounded-xl shadow-md flex justify-between items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-800 text-sm sm:text-base">
                                    Pemasukan untuk <span className="text-[#5c2799]">{item.sumber === 'Saya' ? 'Rafa' : 'Monik'}</span>
                                </p>
                                <p className="text-xs sm:text-sm text-slate-600 truncate mt-0.5">
                                    {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                <p className="font-bold text-sm sm:text-base text-green-600 whitespace-nowrap">+Rp{item.jumlah.toLocaleString('id-ID')}</p>
                                <button 
                                    onClick={() => setItemToDelete(item)} 
                                    className="p-2 text-slate-400 hover:text-red-600 active:bg-red-100 rounded-full"
                                    aria-label="Hapus pemasukan"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white/30 backdrop-blur-lg text-center p-8 rounded-xl shadow-lg">
                        <p className="text-slate-500">Belum ada riwayat pemasukan.</p>
                    </div>
                )}
            </div>

            {itemToDelete && (
                <ConfirmationModal
                    title="Hapus Pemasukan?"
                    message={`Yakin mau hapus pemasukan untuk ${itemToDelete.sumber === 'Saya' ? 'Rafa' : 'Monik'} senilai Rp${itemToDelete.jumlah.toLocaleString('id-ID')}? Saldo akan dikurangi.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </>
    );
}
