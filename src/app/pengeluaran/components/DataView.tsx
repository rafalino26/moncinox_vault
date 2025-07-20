'use client';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PengeluaranChart from "./PengeluaranChart";
import PengeluaranTable from "./PengeluaranTable";
import type { Transaction } from "@prisma/client";

// Tambahkan prop onDelete
export default function DataView({ data, tipe, onDelete }: { 
    data: Transaction[], 
    tipe: 'pengeluaran' | 'tabungan',
    onDelete: (transaction: Transaction) => void
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
        <div className="bg-white/30 p-4 rounded-2xl shadow-lg">
            <div className="flex justify-center mb-4 border-b border-black/10">
                <button onClick={() => setView('tabel')} className={`px-4 py-2 font-semibold transition-colors rounded-t-lg ${view === 'tabel' ? 'border-b-2 border-[#743ab7] text-[#743ab7]' : 'text-slate-500'}`}>Tabel</button>
                <button onClick={() => setView('grafik')} className={`px-4 py-2 font-semibold transition-colors rounded-t-lg ${view === 'grafik' ? 'border-b-2 border-[#743ab7] text-[#743ab7]' : 'text-slate-500'}`}>Grafik</button>
            </div>
            
             {data.length > 0 ? (
                view === 'tabel' ? <PengeluaranTable data={data} tipe={tipe} onDelete={onDelete} /> : <PengeluaranChart data={data} tipe={tipe} />
            ) : (
                <div className="text-center py-12"><p className="text-slate-500">tidakk adaaaa apaaa apaaaa ayangggg</p></div>
            )}
        </div>
    );
}