'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { Transaction } from '@prisma/client';

// Daftarkan komponen Chart.js yang akan kita gunakan
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PengeluaranChart({ data = [], tipe }: { data: Transaction[], tipe: 'pengeluaran' | 'tabungan' }) {
    // 1. Proses data untuk chart: kelompokkan berdasarkan tanggal & jumlahkan
    const dataDikelompokkan = data.reduce((acc, curr) => {
        const tanggal = new Date(curr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (!acc[tanggal]) {
            acc[tanggal] = 0;
        }
        acc[tanggal] += curr.jumlah;
        return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(dataDikelompokkan).reverse();
    const chartValues = Object.values(dataDikelompokkan).reverse();
    
    // 2. Siapkan data & opsi untuk format Chart.js
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Total Pengeluaran',
                data: chartValues,
                backgroundColor: 'rgba(239, 68, 68, 0.6)', // Merah dengan transparansi
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1,
                borderRadius: 5,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false, // Judul sudah ada di komponen DataView
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
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
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value: any) {
                        return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
                    }
                }
            }
        }
    };

    const colorClass = tipe === 'pengeluaran' ? 'text-red-600' : 'text-green-600';
    
    return (
        <div className="p-4">
            <Bar options={chartOptions} data={chartData} />
        </div>
    );
}