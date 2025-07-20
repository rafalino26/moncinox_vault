'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ComparisonChartProps {
    pemasukan: number;
    pengeluaran: number;
}

export default function ComparisonChart({ pemasukan, pengeluaran }: ComparisonChartProps) {
    const data = {
        labels: ['ini tabungann', 'ini keluarrr'],
        datasets: [
            {
                label: 'Jumlah (Rp)',
                data: [pemasukan, pengeluaran],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',  // Hijau
                    'rgba(239, 68, 68, 0.7)',   // Merah
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'bulan iniiiiii',
            },
        },
    };

    return <Doughnut data={data} options={options} />;
}