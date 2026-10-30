'use client';

import { useMemo } from 'react';
import type { Transaction } from '@prisma/client';
import { getChartStats } from '../lib/transaction-filters';
import DashboardDonutChart from "./DashboardDonutChart";
import TrendChart from "./TrendChart";

export default function DashboardCharts({ transactions }: { transactions: Transaction[] }) {
  const { totalPemasukan, totalPengeluaran, weeklySpending } = useMemo(() => getChartStats(transactions), [transactions]);

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
