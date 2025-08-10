import { getDashboardStats } from "@/app/actions/transactionActions";
import DashboardDonutChart from "./DashboardDonutChart"; // <-- Impor komponen yang benar
import TrendChart from "./TrendChart";

export default async function DashboardCharts() {
    const { totalPemasukan, totalPengeluaran, weeklySpending } = await getDashboardStats();

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Grafik & Tren</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/30 backdrop-blur-lg p-5 rounded-2xl shadow-lg">
                    {/* Panggil komponen yang benar di sini */}
                    <DashboardDonutChart pemasukan={totalPemasukan} pengeluaran={totalPengeluaran} />
                </div>
                <div className="bg-white/30 backdrop-blur-lg p-5 rounded-2xl shadow-lg">
                    <TrendChart data={weeklySpending} />
                </div>
            </div>
        </div>
    );
}