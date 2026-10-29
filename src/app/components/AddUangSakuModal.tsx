'use client';

import { FiX, FiLoader } from 'react-icons/fi';
import { addUangSaku } from '@/app/actions/transactionActions';
import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ModalProps {
  person: 'Saya' | 'Pacar_Saya';
  personName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUangSakuModal({
  person,
  personName,
  onClose,
  onSuccess,
}: ModalProps) {
  const router = useRouter();
  const [displayValue, setDisplayValue] = useState('');
  const [realValue, setRealValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.set('person', person);
      formData.set('amount', realValue);

      const result = await addUangSaku(formData);

      if (result?.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
        onSuccess();
        router.refresh();
      }
    } catch (err) {
      setErrorMessage('Gagal menambahkan pemasukan.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm border border-purple-100 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-purple-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-200">
              <Image
                src={person === 'Saya' ? '/rafa.png' : '/monik.png'}
                alt={personName}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Isi Saldo / Uang Saku</h3>
              <p className="text-xs text-purple-700 font-semibold">{personName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
          >
            <FiX size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 text-center">
            <label
              htmlFor="amountDisplay"
              className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1"
            >
              Jumlah Uang Saku
            </label>
            <div className="flex items-center justify-center text-slate-900 font-extrabold text-2xl sm:text-3xl">
              <span className="text-purple-600 text-xl mr-1">Rp</span>
              <input
                type="text"
                id="amountDisplay"
                placeholder="0"
                required
                className="w-full text-center bg-transparent focus:outline-none placeholder-slate-300 font-extrabold text-2xl sm:text-3xl"
                value={displayValue}
                onChange={handleAmountChange}
                inputMode="numeric"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#5c2799] to-[#743ab7] hover:from-[#4b1d83] hover:to-[#5c2799] text-white font-bold rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed h-[46px]"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin text-lg" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Tambah Uang Saku 💜</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
