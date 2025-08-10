'use client';
import type { Transaction } from '@prisma/client';
import { FiX } from 'react-icons/fi';

interface ModalProps {
    date: string;
    transactions: Transaction[];
    onClose: () => void;
}

export default function ComparisonDetailModal({ date, transactions, onClose }: ModalProps) {
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Detail Transaksi - {date}</h3>
                    <button onClick={onClose}><FiX /></button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
                    {transactions.map(t => (
                        <div key={t.id} className="bg-white/50 p-3 rounded-lg flex justify-between items-center text-sm">
                            <div>
                                <p className="font-bold">{t.keterangan}</p>
                                <p className="text-xs text-slate-500">{t.sumber === 'Saya' ? 'Rafa' : 'Monik'}</p>
                            </div>
                            <p className={`font-semibold ${t.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'}`}>
                                {t.tipe === 'pengeluaran' ? '-' : '+'}Rp{t.jumlah.toLocaleString('id-ID')}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}