import type { Transaction } from "@prisma/client";
import { FiTrash2 } from "react-icons/fi";

export default function PengeluaranTable({ data = [], onDelete, totalPengeluaran, totalTabungan }: { 
    data: Transaction[], 
    onDelete: (transaction: Transaction) => void,
    totalPengeluaran: number,
    totalTabungan: number,
}) {
    const grandTotal = totalPengeluaran + totalTabungan;

    return (
        <div className="overflow-x-auto">
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
                                <button onClick={() => onDelete(t)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                    <FiTrash2 />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
               <tfoot className="font-bold text-slate-80">
                    <tr>
                        <td colSpan={4} className="px-6 py-3 ">Total Transaksi Keluar Periode Ini</td>
                        <td className="px-6 py-3 text-right text-slate-800 ">
                            Rp{grandTotal.toLocaleString('id-ID')}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}