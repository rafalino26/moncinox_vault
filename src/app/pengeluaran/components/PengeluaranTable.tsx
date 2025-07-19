import type { Transaction } from "@prisma/client";

export default function PengeluaranTable({ data = [], tipe }: { data: Transaction[], tipe: 'pengeluaran' | 'tabungan' }) {
    const colorClass = tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600';
    return (
        // Wrapper ini memungkinkan tabel di-scroll ke samping di HP
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-black/5">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">
                            Tanggal
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Jumlah
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Sumber
                        </th>
                        <th scope="col" className="px-6 py-3 text-right rounded-r-lg">
                            Keterangan
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((t) => (
                        <tr key={t.id} className="bg-transparent border-b border-black/5">
                            <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(t.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                            </td>
                            <td className="px-6 py-4 font-bold text-[#5c2799]">
                                Rp{t.jumlah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-6 py-4">
                                {t.sumber === 'Saya' ? 'Rafa' : 'Monik'}
                            </td>
                            <td className="px-6 py-4 font-bold text-[#5c2799] text-right">
                                {t.keterangan}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}