'use client';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PengeluaranChart from "./PengeluaranChart";
import PengeluaranTable from "./PengeluaranTable";
import type { Transaction } from "@prisma/client";

export default function DataView({ data, onDelete, totalPengeluaran, totalTabungan }: { 
    data: Transaction[], 
    onDelete: (transaction: Transaction) => void,
    totalPengeluaran: number,
    totalTabungan: number,
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const view = searchParams.get('view') || 'tabel';

    const setView = (newView: 'tabel' | 'grafik') => {
        const params = new URLSearchParams(searchParams);
        params.set('view', newView);
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white/85 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-sm">
            <div className="flex justify-center mb-4 border-b border-purple-100">
                <button 
                    onClick={() => setView('tabel')} 
                    className={`px-4 py-2 font-bold transition-all rounded-t-xl text-xs sm:text-sm ${
                        view === 'tabel' ? 'border-b-2 border-[#5c2799] text-[#5c2799]' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Tabel / Kartu
                </button>
                <button 
                    onClick={() => setView('grafik')} 
                    className={`px-4 py-2 font-bold transition-all rounded-t-xl text-xs sm:text-sm ${
                        view === 'grafik' ? 'border-b-2 border-[#5c2799] text-[#5c2799]' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Grafik
                </button>
            </div>
            
            {data.length > 0 ? (
               view === 'tabel' 
                    ? <PengeluaranTable data={data} onDelete={onDelete} totalPengeluaran={totalPengeluaran} totalTabungan={totalTabungan} /> 
                    : <PengeluaranChart data={data} />
            ) : (
                <div className="text-center py-12"><p className="text-slate-500 font-medium">Tidak ada data untuk ditampilkan.</p></div>
            )}
        </div>
    );
}
