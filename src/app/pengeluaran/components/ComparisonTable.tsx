import type { ComparisonData } from '@/app/types/index';
import { FiInfo } from 'react-icons/fi';

interface ComparisonTableProps {
    data: ComparisonData[];
    summary?: { rafa: number; monik: number };
    onDetailClick: (date: string) => void; // Prop baru untuk menangani klik
}

export default function ComparisonTable({ data, summary, onDetailClick }: ComparisonTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-black/5">
                    <tr>
                        <th scope="col" className="px-6 py-3 rounded-l-lg">Tanggal</th>
                        <th scope="col" className="px-6 py-3 text-right">puskas</th>
                        <th scope="col" className="px-6 py-3 text-right">miskas</th>
                        <th scope="col" className="px-6 py-3 text-right">Total Hari Ini</th>
                        <th scope="col" className="px-6 py-3 text-center rounded-r-lg">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr key={row.tanggal} className="bg-transparent border-b border-black/5">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{row.tanggal}</td>
                            <td className="px-6 py-4 text-right">Rp{row.rafa.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-right">Rp{row.monik.toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 text-right">Rp{(row.rafa + row.monik).toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => onDetailClick(row.tanggal)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full">
                                    <FiInfo />
                                </button>
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
                            <td className="px-6 py-3 text-right">Rp{(summary.rafa + summary.monik).toLocaleString('id-ID')}</td>
                            <td className="px-6 py-3 rounded-r-lg"></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}