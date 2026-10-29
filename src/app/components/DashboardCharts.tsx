import { getDashboardStats } from "@/app/actions/transactionActions";
import DashboardDonutChart from "./DashboardDonutChart";
import TrendChart from "./TrendChart";

export default async function DashboardCharts() {
  const { totalPemasukan, totalPengeluaran, weeklySpending } = await getDashboardStats();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white/80 p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-xs">
        <DashboardDonutChart pemasukan={totalPemasukan} pengeluaran={totalPengeluaran} />
      </div>
      <div className="bg-white/80 p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-xs">
        <TrendChart data={weeklySpending} />
      </div>
    </div>
  );
}
