'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import type { Transaction } from '@prisma/client';
import { useMemo } from 'react';
import { groupTransactionsByDay } from '../lib/transaction-groups';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function TrendChart({ data }: { data: Transaction[] }) {
    // Proses data: kelompokkan pengeluaran per hari
    const days = useMemo(() => groupTransactionsByDay(data), [data]);

    const chartData = {
        labels: days.map(day => day.tanggal),
        datasets: [
            {
                label: 'Pengeluaran Harian',
                data: days.map(day => day.total),
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
