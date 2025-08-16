import { getPemasukanHistory } from "@/app/actions/transactionActions";
import PemasukanClientView from "./components/PemasukanClientView";
import { Suspense } from "react";

export default async function PemasukanPage() {
    const history = await getPemasukanHistory();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#5c2799]">Riwayat Pemasukan</h1>
                <p className="text-slate-600">Daftar semua uang saku yang pernah ditambahkan.</p>
            </div>
            
            <Suspense fallback={<div className="text-center p-12">Memuat...</div>}>
                <PemasukanClientView history={history} />
            </Suspense>
        </div>
    );
}