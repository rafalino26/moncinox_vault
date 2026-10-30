import { Suspense } from 'react';
import DashboardView from './components/DashboardView';
import DashboardCharts from './components/DashboardCharts';

export default async function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-center p-12 text-purple-700 font-bold">Memuat Dashboard...</div>}>
      <DashboardView 
        charts={<DashboardCharts />}
      />
    </Suspense>
  );
}
