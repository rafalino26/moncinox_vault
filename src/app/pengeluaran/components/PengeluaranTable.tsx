import type { Transaction } from "@prisma/client";
import { FiTrash2, FiEdit2 } from "react-icons/fi";

export default function PengeluaranTable({ data = [], onDelete, onEdit, totalPengeluaran, totalTabungan }: { 
    data: Transaction[], 
    onDelete: (transaction: Transaction) => void,
    onEdit: (transaction: Transaction) => void,
    totalPengeluaran: number,
    totalTabungan: number,
}) {
    const grandTotal = totalPengeluaran + totalTabungan;

    return (
        <div>
            {/* Tampilan Mobile: Kartu per Transaksi */}
            <div className="space-y-3 md:hidden">
                {data.map((t) => (
                    <div key={t.id} className="bg-white/60 p-3.5 rounded-xl border border-black/5 flex items-start justify-between gap-3 shadow-sm">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    t.tipe === 'pengeluaran' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                    {t.tipe}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                    {t.sumber === 'Saya' ? 'puskassswww' : 'miskassswww'}
                                </span>
                                <span className="text-[11px] text-slate-400">•</span>
                                <span className="text-[11px] text-slate-500">
                                    {new Date(t.tanggal).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <p className="font-semibold text-slate-800 text-sm break-words">{t.keterangan}</p>
                            <p className={`font-bold text-sm mt-1 ${
                                t.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'
                            }`}>
                                {t.tipe === 'pengeluaran' ? '-' : '+'}Rp{t.jumlah.toLocaleString('id-ID')}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button 
                                onClick={() => onEdit(t)} 
                                className="p-2 text-slate-400 hover:text-[#5c2799] hover:bg-purple-100 rounded-full"
                                aria-label="Edit transaksi"
                            >
                                <FiEdit2 size={18} />
                            </button>
                            <button 
                                onClick={() => onDelete(t)} 
                                className="p-2 text-slate-400 hover:text-red-600 active:bg-red-100 rounded-full flex-shrink-0"
                                aria-label="Hapus transaksi"
                            >
                                <FiTrash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                <div className="bg-black/5 p-3 rounded-xl flex justify-between items-center text-sm font-bold text-slate-800 mt-2">
                    <span>Total Periode Ini:</span>
                    <span>Rp{grandTotal.toLocaleString('id-ID')}</span>
                </div>
            </div>

            {/* Tampilan Desktop / Tablet: Tabel */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm text-left text-slate-600 table-fixed">
                    <thead className="text-xs text-slate-700 uppercase bg-black/5">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-l-lg w-[200px]">Tanggal</th>
                            <th scope="col" className="px-6 py-3 w-[150px]">Jumlah</th>
                            <th scope="col" className="px-6 py-3 w-[130px]">Sumber</th>
                            <th scope="col" className="px-6 py-3">Keterangan</th>
                            <th scope="col" className="px-6 py-3 text-right rounded-r-lg w-[80px]">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((t) => (
                            <tr key={t.id} className="bg-transparent border-b border-black/5">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(t.tanggal).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        day: '2-digit', 
                                        month: 'short', 
                                        year: 'numeric'
                                    })}
                                </td>
                                <td className={`px-6 py-4 font-bold whitespace-nowrap ${
                                    t.tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600'
                                }`}>
                                    {t.tipe === 'pengeluaran' ? '-' : '+'}Rp{t.jumlah.toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-4">{t.sumber === 'Saya' ? 'puskassswww' : 'miskassswww'}</td>
                                <td className="px-6 py-4 font-bold text-slate-800 break-words">{t.keterangan}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                        <button onClick={() => onEdit(t)} className="p-2 text-slate-500 hover:text-[#5c2799] hover:bg-purple-100 rounded-full" aria-label="Edit transaksi">
                                            <FiEdit2 />
                                        </button>
                                        <button onClick={() => onDelete(t)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold text-slate-800">
                        <tr>
                            <td colSpan={4} className="px-6 py-3">Total Transaksi Keluar Periode Ini</td>
                            <td className="px-6 py-3 text-right text-slate-800">
                                Rp{grandTotal.toLocaleString('id-ID')}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
