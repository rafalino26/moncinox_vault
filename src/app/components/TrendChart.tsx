'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import type { Transaction } from '@prisma/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function TrendChart({ data }: { data: Transaction[] }) {
    // Proses data: kelompokkan pengeluaran per hari
    const dailyTotals = data.reduce((acc, curr) => {
        const day = new Date(curr.tanggal).toLocaleDateString('id-ID', { weekday: 'short' });
        if (!acc[day]) {
            acc[day] = 0;
        }
        acc[day] += curr.jumlah;
        return acc;
    }, {} as Record<string, number>);

    const chartData = {
        labels: Object.keys(dailyTotals),
        datasets: [
            {
                label: 'Pengeluaran Harian',
                data: Object.values(dailyTotals),
                backgroundColor: 'rgba(139, 92, 246, 0.7)', // Ungu
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1,
            },
        ],
    };
    
    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Kita tidak butuh legend untuk satu data
            },
            title: {
                display: true,
                text: 'iniii 7 hari terakhirrr',
            },
        },
    };

    return <Bar data={chartData} options={options} />;
}