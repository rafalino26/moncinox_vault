'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Pemasukan } from '@prisma/client';
import { deletePemasukan } from '@/app/actions/transactionActions';
import ConfirmationModal from '@/app/components/ConfirmationModal';
import { FiTrash2 } from 'react-icons/fi';

export default function PemasukanClientView({ history }: { history: Pemasukan[] }) {
    const router = useRouter();
    // State untuk menyimpan item mana yang akan dihapus
    const [itemToDelete, setItemToDelete] = useState<Pemasukan | null>(null);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        await deletePemasukan(itemToDelete.id);
        setItemToDelete(null); // Tutup modal
        router.refresh(); // Refresh halaman untuk melihat data terbaru
    };

    return (
        <>
            <div className="space-y-3">
                {history.length > 0 ? (
                    history.map(item => (
                        <div key={item.id} className="bg-white/30 backdrop-blur-lg p-4 rounded-xl shadow-lg flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-800">
                                    Pemasukan untuk <span className="text-blue-600">{item.sumber === 'Saya' ? 'Rafa' : 'Monik'}</span>
                                </p>
                                <p className="text-sm text-slate-600">
                                    {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-bold text-md text-green-600">+Rp{item.jumlah.toLocaleString('id-ID')}</p>
                                {/* Tombol ini sekarang hanya membuka modal */}
                                <button onClick={() => setItemToDelete(item)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                    <FiTrash2 />
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

            {/* Tampilkan modal jika ada item yang akan dihapus */}
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