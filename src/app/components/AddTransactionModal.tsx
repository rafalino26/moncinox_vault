'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiX, FiLoader } from 'react-icons/fi';
import { addTransaction } from '@/app/actions/transactionActions';
import { useWallet } from './WalletContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({ isOpen, onClose, onSuccess }: AddTransactionModalProps) {
  const { applyOptimisticDelta, addOptimisticTransaction } = useWallet();
  const router = useRouter();
  const [displayValue, setDisplayValue] = useState('');
  const [realValue, setRealValue] = useState('');
  const [tipe, setTipe] = useState<'pengeluaran' | 'tabungan'>('pengeluaran');
  const [sumber, setSumber] = useState<'Saya' | 'Pacar_Saya'>('Saya');
  const [keterangan, setKeterangan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [tanggal, setTanggal] = useState(getTodayString());

  if (!isOpen) return null;

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setRealValue(rawValue);
    if (rawValue) {
      setDisplayValue(new Intl.NumberFormat('id-ID').format(parseInt(rawValue, 10)));
    } else {
      setDisplayValue('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realValue || Number(realValue) <= 0) {
      setErrorMessage('Nominal wajib diisi!');
      return;
    }

    const note = keterangan.trim() || (tipe === 'tabungan' ? 'Tabungan' : '');
    if (!note) {
      setErrorMessage('Keterangan wajib diisi!');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('jumlah', realValue);
      formData.set('tipe', tipe);
      formData.set('sumber', sumber);
      formData.set('keterangan', note);
      formData.set('tanggal', tanggal);

      const result = await addTransaction(formData);

      if (result?.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
      } else {
        // OPTIMISTIC UPDATE: update UI lokal dulu biar terasa cepat,
        // baru refresh dari server lewat onSuccess() sebagai sinkronisasi.
        applyOptimisticDelta(sumber, tipe === 'pengeluaran' ? -Number(realValue) : Number(realValue));

        addOptimisticTransaction({
          id: `optimistic-${Date.now()}`,
          keterangan: note,
          jumlah: Number(realValue),
          tipe,
          sumber,
          tanggal: new Date(tanggal),
          createdAt: new Date(),
        });

        // Reset state
        setDisplayValue('');
        setRealValue('');
        setKeterangan('');
        setTipe('pengeluaran');
        setSumber('Saya');
        setIsSubmitting(false);
        
        // Tutup modal dan refresh data (background sync dari server)
        onClose();
        onSuccess();
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat menyimpan transaksi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-purple-100 max-h-[92vh] overflow-y-auto transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border border-purple-200">
              <Image 
                src="/stickers/stitchbareng.png" 
                alt="Stitch" 
                width={36} 
                height={36} 
                className="object-contain" 
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Catat Transaksi</h3>
              <p className="text-xs text-purple-700 font-medium">moncinox vault</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Tutup"
          >
            <FiX size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Nominal Besar di Tengah ala FinTech */}
          <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-100 text-center">
            <label htmlFor="amount" className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
              Nominal Transaksi
            </label>
            <div className="flex items-center justify-center text-slate-900 font-extrabold text-3xl sm:text-4xl">
              <span className="text-purple-600 text-2xl mr-1">Rp</span>
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={displayValue}
                onChange={handleAmountChange}
                disabled={isSubmitting}
                className="w-full text-center bg-transparent focus:outline-none placeholder-slate-300 font-extrabold text-3xl sm:text-4xl"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Tipe Transaksi (Pill Selector) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTipe('pengeluaran')}
                disabled={isSubmitting}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                  tipe === 'pengeluaran'
                    ? 'bg-[#5c2799] text-white border-[#5c2799] shadow-md shadow-purple-500/20'
                    : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50/50'
                }`}
              >
                <span>💸</span> Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setTipe('tabungan')}
                disabled={isSubmitting}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                  tipe === 'tabungan'
                    ? 'bg-[#5c2799] text-white border-[#5c2799] shadow-md shadow-purple-500/20'
                    : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50/50'
                }`}
              >
                <span>🐷</span> Tabungan
              </button>
            </div>
          </div>

          {/* Sumber Transaksi (Puskasw vs Miskasw) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
              Siapa yang bayar?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSumber('Saya')}
                disabled={isSubmitting}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                  sumber === 'Saya'
                    ? 'bg-[#4b1d83] text-white border-[#4b1d83] shadow-md shadow-purple-900/20'
                    : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50/50'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                  <Image src="/rafa.png" alt="Rafa" width={24} height={24} className="object-cover" />
                </div>
                <span className="truncate">puskasw (Rafa)</span>
              </button>

              <button
                type="button"
                onClick={() => setSumber('Pacar_Saya')}
                disabled={isSubmitting}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                  sumber === 'Pacar_Saya'
                    ? 'bg-[#5c2799] text-white border-[#5c2799] shadow-md shadow-purple-900/20'
                    : 'bg-white text-slate-700 border-purple-100 hover:bg-purple-50/50'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                  <Image src="/monik.png" alt="Monik" width={24} height={24} className="object-cover" />
                </div>
                <span className="truncate">miskasw (Monik)</span>
              </button>
            </div>
          </div>

          {/* Keterangan & Tanggal */}
          <div className="space-y-3">
            <div>
              <label htmlFor="keterangan" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Keterangan
              </label>
              <input
                id="keterangan"
                type="text"
                placeholder={tipe === 'tabungan' ? 'Tabungan...' : 'e.g., Makan bareng, bensin, belanja...'}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 border border-purple-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#743ab7]"
                required={tipe !== 'tabungan'}
              />
            </div>

            <div>
              <label htmlFor="tanggal" className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Tanggal
              </label>
              <input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 bg-slate-50 border border-purple-100 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#743ab7]"
                required
              />
            </div>
          </div>

          {/* Tombol Simpan Transaksi */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#5c2799] to-[#743ab7] hover:from-[#4b1d83] hover:to-[#5c2799] text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin text-xl" />
                <span>Menyimpan Transaksi...</span>
              </>
            ) : (
              <span>Simpan Transaksi 💜</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
