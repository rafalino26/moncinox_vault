'use client';

import { useState } from 'react';
import type { Pemasukan } from '@prisma/client';
import { deletePemasukan } from '@/app/actions/transactionActions';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import { FiTrash2 } from 'react-icons/fi';
import { useIncomeData, useWallet } from '@/app/components/WalletContext';
import DataStatus from '@/app/components/DataStatus';

export default function PemasukanClientView() {
    const incomeData = useIncomeData();
    const { removeSavedIncome } = useWallet();
    const history = incomeData.data ?? [];
    const [visibleCount, setVisibleCount] = useState(50);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Pemasukan | null>(null);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setMutationError(null);
        try {
            const result = await deletePemasukan(itemToDelete.id);
            if (result.success) removeSavedIncome(itemToDelete.id, result.wallet);
            else setMutationError(result.error ?? 'Gagal menghapus pemasukan.');
        } catch {
            setMutationError('Gagal menghapus pemasukan. Silakan coba lagi.');
        }
        setItemToDelete(null);
    };

    return (
        <>
            <DataStatus error={incomeData.error} retry={incomeData.retry} loading={incomeData.isLoading} />
            {mutationError && <p role="alert" className="text-sm text-red-700">{mutationError}</p>}
            {incomeData.data && <>
            <div className="space-y-3">
                {history.length > 0 ? (
                    history.slice(0, visibleCount).map(item => (
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
            {history.length > visibleCount && <button type="button" onClick={() => setVisibleCount(count => count + 50)} className="mt-4 w-full rounded-xl bg-purple-50 p-3 text-sm font-semibold text-purple-800">Tampilkan lebih banyak ({visibleCount} dari {history.length})</button>}
            </>}

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
