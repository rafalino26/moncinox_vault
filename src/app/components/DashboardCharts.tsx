import { getDashboardStats } from "../actions/transactionActions";
import ComparisonChart from "./ComparisonChart";
import TrendChart from "./TrendChart";

export default async function DashboardCharts() {
    const { totalPemasukan, totalPengeluaran, weeklySpending } = await getDashboardStats();

    return (
        <div className="mb-8">
            {/* Grid yang responsif untuk dua grafik */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white/30 backdrop-blur-lg p-5 rounded-2xl shadow-lg">
                    <ComparisonChart pemasukan={totalPemasukan} pengeluaran={totalPengeluaran} />
                </div>
                <div className="bg-white/30 backdrop-blur-lg p-5 rounded-2xl shadow-lg">
                    <TrendChart data={weeklySpending} />
                </div>
            </div>
        </div>
    );
}