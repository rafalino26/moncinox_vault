'use client';
import { useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, type ChartOptions } from 'chart.js';
import { buildLedgerChart, rupiah, type LedgerEntry } from '../../lib/ledger';
import LedgerSelect from './LedgerSelect';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);
const colors = ['#7650bd', '#b8a0e1', '#ded2f0'];

export default function LedgerChart({ entries, income = false }: { entries: LedgerEntry[]; income?: boolean }) {
  const [mode, setMode] = useState<'tren' | 'orang' | 'jenis'>('tren');
  const [interval, setInterval] = useState<'hari' | 'minggu' | 'bulan'>('hari');
  const groups = useMemo(() => buildLedgerChart(entries, mode, interval), [entries, mode, interval]);
  const options: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false, animation: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => rupiah(context.parsed.y ?? 0) } } },
    scales: { x: { grid: { display: false }, ticks: { color: '#81708e', maxTicksLimit: 5, maxRotation: 0 } },
      y: { beginAtZero: true, border: { display: false }, grid: { color: '#f0eaf7' }, ticks: { color: '#81708e', maxTicksLimit: 5,
        callback: value => Number(value) >= 1000000 ? `${Number(value) / 1000000} jt` : Number(value) >= 1000 ? `${Number(value) / 1000} rb` : String(value) } } },
  };
  const donutOptions: ChartOptions<'doughnut'> = { responsive: true, maintainAspectRatio: false, animation: false, cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => rupiah(context.parsed) } } } };
  return <section className="ledger-chart-panel" aria-label="Grafik transaksi">
    <div className="ledger-section-heading"><h2>{mode === 'tren' ? 'Tren transaksi' : 'Komposisi transaksi'}</h2></div>
    <div className="ledger-chart-controls"><LedgerSelect<typeof mode> label="Tampilkan" value={mode} onChange={setMode}
      options={[{ value: 'tren', label: 'Tren waktu' }, { value: 'orang', label: 'Per orang' }, ...(!income ? [{ value: 'jenis' as const, label: 'Jenis transaksi' }] : [])]} />
      {mode === 'tren' && <LedgerSelect<typeof interval> label="Kelompok waktu" value={interval} onChange={setInterval}
        options={[{ value: 'hari', label: 'Harian' }, { value: 'minggu', label: 'Mingguan' }, { value: 'bulan', label: 'Bulanan' }]} />}
    </div>
    <p className="ledger-help">Mengikuti periode, pencarian, dan filter di atas. Nilai dalam rupiah.</p>
    {entries.length ? <>
      <div className="ledger-chart-canvas">{mode === 'tren' ? <Bar options={options} data={{ labels: groups.labels, datasets: [{ label: 'Total', data: groups.values, backgroundColor: colors[0], borderRadius: 5, maxBarThickness: 32 }] }} /> :
        <Doughnut options={donutOptions} data={{ labels: groups.labels, datasets: [{ data: groups.values, backgroundColor: colors, borderWidth: 4, borderColor: '#fff' }] }} />}</div>
      {mode !== 'tren' && <ul className="ledger-chart-legend">{groups.labels.map((label, index) => <li key={label}><span><i style={{ background: colors[index % colors.length] }} />{label}</span><strong>{rupiah(groups.values[index])}</strong></li>)}</ul>}
      <p className="ledger-chart-total">Total hasil filter <strong>{rupiah(entries.reduce((total, entry) => total + entry.amount, 0))}</strong></p>
    </> : <p className="ledger-empty">Belum ada catatan untuk filter ini. Coba pilih periode lain.</p>}
  </section>;
}
