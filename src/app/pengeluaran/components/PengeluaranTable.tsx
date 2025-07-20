import type { Transaction } from "@prisma/client";

export default function PengeluaranTable({ data = [], tipe }: { data: Transaction[], tipe: 'pengeluaran' | 'tabungan' }) {
    const colorClass = tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600';
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-black/5">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">Tanggal</th>
                        <th scope="col" className="px-6 py-3">Keterangan</th>
                        <th scope="col" className="px-6 py-3">Sumber</th>
                        <th scope="col" className="px-6 py-3 text-right rounded-r-lg">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((t) => (
                        <tr key={t.id} className="bg-transparent border-b border-black/5">
                            <td className="px-6 py-4 whitespace-nowrap">
                                {/* ↓↓↓ UBAH FORMAT TANGGAL DI SINI ↓↓↓ */}
                                {new Date(t.tanggal).toLocaleDateString('id-ID', {
                                    weekday: 'long', // <-- Tambahkan ini
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric'
                                })}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{t.keterangan}</td>
                            <td className="px-6 py-4">{t.sumber === 'Saya' ? 'Rafa' : 'Monik'}</td>
                            <td className={`px-6 py-4 font-bold ${colorClass} text-right`}>
                                Rp{t.jumlah.toLocaleString('id-ID')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}