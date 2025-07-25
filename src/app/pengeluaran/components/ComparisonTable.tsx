import type { ComparisonData } from '@/app/types/index'; // Kita akan buat tipe data ini nanti

interface ComparisonTableProps {
    data: ComparisonData[];
    summary?: { rafa: number; monik: number };
}

export default function ComparisonTable({ data, summary }: ComparisonTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-black/5">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">Tanggal</th>
                        <th scope="col" className="px-6 py-3 text-right">Rafa</th>
                        <th scope="col" className="px-6 py-3 text-right">Monik</th>
                        <th scope="col" className="px-6 py-3 text-right rounded-r-lg">Total Hari Ini</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.tanggal} className="bg-transparent border-b border-black/5">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                                {row.tanggal}
                            </td>
                            <td className="px-6 py-4 text-right">Rp{row.rafa.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-right">Rp{row.monik.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 text-right">
                                Rp{(row.rafa + row.monik).toLocaleString('id-ID')}
                            </td>
                        </tr>
                    ))}
                </tbody>
                {summary && (
                    <tfoot className="font-bold text-slate-800 bg-black/5">
                        <tr>
                            <td className="px-6 py-3 rounded-l-lg">Total Periode Ini</td>
                            <td className="px-6 py-3 text-right">Rp{summary.rafa.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-3 text-right">Rp{summary.monik.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-3 text-right rounded-r-lg">
                                Rp{(summary.rafa + summary.monik).toLocaleString('id-ID')}
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}