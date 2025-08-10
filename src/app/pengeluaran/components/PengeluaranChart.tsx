'use client';

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import type { Transaction } from '@prisma/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Hapus 'tipe' dari props
export default function PengeluaranChart({ data = [] }: { data: Transaction[] }) {
    
    // Proses data: kelompokkan berdasarkan tanggal, pisahkan pengeluaran dan tabungan
    const dataDikelompokkan = data.reduce((acc, curr) => {
        const tanggal = new Date(curr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        if (!acc[tanggal]) {
            acc[tanggal] = { pengeluaran: 0, tabungan: 0 };
        }
        if (curr.tipe === 'pengeluaran') {
            acc[tanggal].pengeluaran += curr.jumlah;
        } else {
            acc[tanggal].tabungan += curr.jumlah;
        }
        return acc;
    }, {} as Record<string, { pengeluaran: number, tabungan: number }>);

    const labels = Object.keys(dataDikelompokkan).reverse();
    const pengeluaranValues = Object.values(dataDikelompokkan).map(d => d.pengeluaran).reverse();
    const tabunganValues = Object.values(dataDikelompokkan).map(d => d.tabungan).reverse();
    
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

    const chartOptions: any = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
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
        // Buat grafiknya menjadi 'stacked' agar lebih rapi
        scales: {
            x: { stacked: true },
            y: { 
                stacked: true,
                beginAtZero: true,
                ticks: {
                    callback: function(value: any) {
                        return 'Rp' + new Intl.NumberFormat('id-ID').format(value);
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


