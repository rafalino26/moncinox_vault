'use client';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import type { ComparisonData } from '@/app/types/index';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

//                  ↓↓↓ Pastikan komponen menerima 'data' sebagai prop di sini ↓↓↓
export default function ComparisonChart({ data = [] }: { data: ComparisonData[] }) {
    const chartData = {
        labels: data.map(d => d.tanggal).reverse(),
        datasets: [
            {
                label: 'Rafa',
                data: data.map(d => d.rafa).reverse(),
                backgroundColor: 'rgba(59, 130, 246, 0.7)', // Biru
                borderRadius: 5,
            },
            {
                label: 'Monik',
                data: data.map(d => d.monik).reverse(),
                backgroundColor: 'rgba(236, 72, 153, 0.7)', // Pink
                borderRadius: 5,
            },
        ],
    };

    const chartOptions: any = {
        responsive: true,
        plugins: { 
            legend: { position: 'top' },
            title: {
                display: false, // Judul sudah ada di induknya
            }
        },
        scales: { 
            y: {
                beginAtZero: true,
            }
        },
    };

    return <Bar options={chartOptions} data={chartData} />;
}