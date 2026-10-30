import type { ComparisonData } from '@/app/types/index';
import { FiInfo } from 'react-icons/fi';

interface ComparisonTableProps {
    data: ComparisonData[];
    summary?: { rafa: number; monik: number };
    onDetailClick: (date: string) => void;
}

export default function ComparisonTable({ data, summary, onDetailClick }: ComparisonTableProps) {
    return (
        <div>
            {/* Tampilan Mobile: Kartu Perbandingan */}
            <div className="space-y-3 md:hidden">
                {data.map((row) => (
                    <div key={row.dateKey} className="bg-white/60 p-3.5 rounded-xl border border-black/5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between border-b border-black/5 pb-2">
                            <span className="font-semibold text-slate-800 text-sm">{row.tanggal}</span>
                            <button 
                                onClick={() => onDetailClick(row.dateKey)}
                                className="flex items-center gap-1 text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-md"
                            >
                                <FiInfo size={14} />
                                <span>Detail</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-purple-50/60 p-2 rounded-lg">
                                <span className="text-slate-500 block">puskas:</span>
                                <span className="font-bold text-slate-700">Rp{row.rafa.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="bg-pink-50/60 p-2 rounded-lg">
                                <span className="text-slate-500 block">miskas:</span>
                                <span className="font-bold text-slate-700">Rp{row.monik.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-xs font-bold text-slate-800">
                            <span>Total Hari Ini:</span>
                            <span>Rp{(row.rafa + row.monik).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                ))}

                {summary && (
                    <div className="bg-black/5 p-3 rounded-xl space-y-1 text-xs sm:text-sm font-bold text-slate-800 mt-3">
                        <div className="flex justify-between">
                            <span>Total Puskas:</span>
                            <span>Rp{summary.rafa.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Miskas:</span>
                            <span>Rp{summary.monik.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between border-t border-black/10 pt-1 text-sm">
                            <span>Total Keseluruhan:</span>
                            <span>Rp{(summary.rafa + summary.monik).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tampilan Desktop: Tabel */}
            <div className="hidden md:block overflow-x-auto">
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
                            <tr key={row.dateKey} className="bg-transparent border-b border-black/5">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">{row.tanggal}</td>
                                <td className="px-6 py-4 text-right">Rp{row.rafa.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-right">Rp{row.monik.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 font-bold text-slate-800 text-right">Rp{(row.rafa + row.monik).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => onDetailClick(row.dateKey)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded-full">
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
        </div>
    );
}
