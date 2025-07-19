import { getDashboardStats } from "../actions/transactionActions";
import StatCard from "./StatCard";
import { FiArrowUp, FiArrowDown, FiDollarSign, FiAlertTriangle } from 'react-icons/fi';

const formatRupiah = (amount: number) => `Rp${new Intl.NumberFormat('id-ID').format(amount)}`;

export default async function StatCards() {
    const { totalPemasukan, totalPengeluaran, arusKas, pengeluaranTerbesar } = await getDashboardStats();

    return (
        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ringkasan Bulan Ini</h2>
            {/* Grid yang responsif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Pemasukan"
                    value={formatRupiah(totalPemasukan)}
                    Icon={FiArrowUp}
                    color="bg-purple-500"
                />
                <StatCard 
                    title="Total Pengeluaran"
                    value={formatRupiah(totalPengeluaran)}
                    Icon={FiArrowDown}
                    color="bg-purple-500"
                />
                <StatCard 
                    title="Arus Kas Bersih"
                    value={formatRupiah(arusKas)}
                    note={arusKas >= 0 ? "Bulan ini surplus!" : "Awas, bulan ini minus!"}
                    Icon={FiDollarSign}
                    color={arusKas >= 0 ? "bg-purple-500" : "bg-red-500"}
                />
                <StatCard 
                    title="Pengeluaran Terbesar"
                    value={pengeluaranTerbesar ? formatRupiah(pengeluaranTerbesar.jumlah) : 'Rp0'}
                    note={pengeluaranTerbesar?.keterangan || 'Tidak ada pengeluaran'}
                    Icon={FiAlertTriangle}
                    color="bg-purple-500"
                />
            </div>
        </div>
    );
}