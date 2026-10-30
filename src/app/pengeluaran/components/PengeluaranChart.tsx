'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import type { Transaction } from '@prisma/client';
import { useMemo } from 'react';
import type { ChartOptions } from 'chart.js';
import { groupTransactionsByDay } from '../../lib/transaction-groups';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Hapus 'tipe' dari props
export default function PengeluaranChart({ data = [] }: { data: Transaction[] }) {
    
    // Proses data: kelompokkan berdasarkan tanggal, pisahkan pengeluaran dan tabungan
    const days = useMemo(() => groupTransactionsByDay(data), [data]);
    const labels = days.map(day => day.tanggal);
    const pengeluaranValues = days.map(day => day.pengeluaran);
    const tabunganValues = days.map(day => day.tabungan);
    
    // Siapkan data dengan DUA dataset: satu untuk pengeluaran, satu untuk tabungan
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Pengeluaran',
                data: pengeluaranValues,
                backgroundColor: 'rgba(239, 68, 68, 0.6)', // Merah
                borderRadius: 5,
            },
            {
                label: 'Tabungan',
                data: tabunganValues,
                backgroundColor: 'rgba(34, 197, 94, 0.6)', // Hijau
                borderRadius: 5,
            },
        ],
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        // Buat grafiknya menjadi 'stacked' agar lebih rapi
        scales: {
            x: { stacked: true },
            y: { 
                stacked: true,
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'Rp' + new Intl.NumberFormat('id-ID').format(Number(value));
                    }
                }
            }
        },
    };
    
    return (
        <div className="p-4">
            <Bar options={chartOptions} data={chartData} />
        </div>
    );
}


