'use client';

import { useState, useMemo } from 'react';
import type { Transaction } from '@prisma/client';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiTrendingUp, 
  FiArrowDown, 
  FiArrowUp, 
  FiEye, 
  FiEyeOff 
} from 'react-icons/fi';

interface SpendingAnalysisProps {
  transactions: Transaction[];
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'all';
type PersonFilter = 'all' | 'Saya' | 'Pacar_Saya';

const timeModes: { key: TimeRange; label: string }[] = [
  { key: 'daily', label: 'DAILY' },
  { key: 'weekly', label: 'WEEKLY' },
  { key: 'monthly', label: 'MONTHLY' },
  { key: 'all', label: 'ALL TIME' },
];

export default function SpendingAnalysis({ transactions }: SpendingAnalysisProps) {
  const [selectedPerson, setSelectedPerson] = useState<PersonFilter>('all');
  const [modeIndex, setModeIndex] = useState(2); // default 'MONTHLY' (index 2)
  const [isAmountHidden, setIsAmountHidden] = useState(false);

  // State untuk gesture swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

  const currentMode = timeModes[modeIndex];

  const handlePrev = () => {
    setModeIndex((prev) => (prev === 0 ? timeModes.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setModeIndex((prev) => (prev === timeModes.length - 1 ? 0 : prev + 1));
  };

  // Touch handlers (Mobile Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext(); // swipe kiri -> geser ke depan
    } else if (diff < -40) {
      handlePrev(); // swipe kanan -> geser ke belakang
    }
    setTouchStartX(null);
  };

  // Mouse drag handlers (Desktop Swipe)
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX === null) return;
    const diff = mouseStartX - e.clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    setMouseStartX(null);
  };

  const formatRupiah = (amount: number) =>
    `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;

  // Filter transaksi
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filtered = transactions.filter((t) => {
      // 1. Filter Sumber Orang
      if (selectedPerson !== 'all' && t.sumber !== selectedPerson) {
        return false;
      }

      // 2. Filter Waktu
      const txDate = new Date(t.tanggal);
      if (currentMode.key === 'daily') {
        return txDate >= todayStart;
      }
      if (currentMode.key === 'weekly') {
        return txDate >= sevenDaysAgo;
      }
      if (currentMode.key === 'monthly') {
        return txDate >= thirtyDaysAgo;
      }
      return true; // 'all'
    });

    let expense = 0;
    let income = 0;

    for (const t of filtered) {
      if (t.tipe === 'pengeluaran') {
        expense += t.jumlah;
      } else if (t.tipe === 'tabungan') {
        income += t.jumlah;
      }
    }

    // Seperti di Flutter: Arus kas total
    const totalArusKas = expense + income;

    return {
      expense,
      income,
      totalArusKas,
    };
  }, [transactions, selectedPerson, currentMode.key]);

  return (
    <div className="space-y-4">
      {/* Judul Bagian */}
      <div className="px-1">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Spending Analysis
        </h2>
      </div>

      {/* 1. Pill Filter Siapa (All | Puskasw | Miskasw) */}
      <div className="flex items-center p-1 bg-white/90 backdrop-blur-md rounded-full border border-purple-100 shadow-xs">
        <button
          type="button"
          onClick={() => setSelectedPerson('all')}
          className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-full transition-all duration-200 ${
            selectedPerson === 'all'
              ? 'bg-[#5c2799] text-white shadow-md shadow-purple-900/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setSelectedPerson('Saya')}
          className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-full transition-all duration-200 ${
            selectedPerson === 'Saya'
              ? 'bg-[#4b1d83] text-white shadow-md shadow-purple-900/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Puskasw
        </button>
        <button
          type="button"
          onClick={() => setSelectedPerson('Pacar_Saya')}
          className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-full transition-all duration-200 ${
            selectedPerson === 'Pacar_Saya'
              ? 'bg-[#5c2799] text-white shadow-md shadow-purple-900/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Miskasw
        </button>
      </div>

      {/* 2. Kartu Utama: Bisa di-klik Chevron & Bisa di-SWIPE */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="relative bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-[28px] border border-purple-100/80 shadow-sm select-none cursor-grab active:cursor-grabbing transition-all hover:border-purple-200"
      >
        {/* Ikon Grafik di Pojok Kanan Atas */}
        <div className="absolute top-6 right-6 text-slate-800">
          <FiTrendingUp size={22} className="stroke-[2.5]" />
        </div>

        {/* Kontrol Chevron < MODE > */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Mode Sebelumnya"
          >
            <FiChevronLeft size={20} className="stroke-[2.5]" />
          </button>

          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-widest min-w-[90px] text-center">
            {currentMode.label}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Mode Berikutnya"
          >
            <FiChevronRight size={20} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Nominal Besar di Tengah + Ikon Mata */}
        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2.5">
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isAmountHidden ? '••••••••' : formatRupiah(stats.totalArusKas)}
          </p>
          <button
            type="button"
            onClick={() => setIsAmountHidden(!isAmountHidden)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Sembunyikan nominal"
          >
            {isAmountHidden ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>

      {/* 3. Dua Kartu di Bawah: Income vs Expense (Persis seperti Screenshot) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Income Card */}
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-[24px] border border-purple-100/80 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FiArrowDown size={18} className="stroke-[2.5]" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-400">Income</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate mt-0.5">
              {isAmountHidden ? '••••••' : formatRupiah(stats.income)}
            </p>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-[24px] border border-purple-100/80 shadow-xs flex flex-col justify-between min-h-[105px]">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <FiArrowUp size={18} className="stroke-[2.5]" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-400">Expense</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate mt-0.5">
              {isAmountHidden ? '••••••' : formatRupiah(stats.expense)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
