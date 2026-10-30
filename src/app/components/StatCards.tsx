'use client';

import { useState } from 'react';
import Image from 'next/image';
import AddUangSakuModal from './AddUangSakuModal';
import type { Wallet } from '@prisma/client';

const formatRupiah = (amount: number | null | undefined) => {
  const val = amount || 0;
  if (val < 0) {
    return `-Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(val))}`;
  }
  return `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;
};

export default function StatCards({
  wallets,
}: {
  wallets: { rafaWallet: Wallet | null; monikWallet: Wallet | null };
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<'Saya' | 'Pacar_Saya' | null>(null);

  const handleCardClick = (person: 'Saya' | 'Pacar_Saya') => {
    setSelectedPerson(person);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Header Section: Singkat "Wallets" */}
        <div className="px-1">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Wallets
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Kartu Dompet 1: Puskasw (Saya / Rafa) */}
          <div 
            onClick={() => handleCardClick('Saya')}
            className="group relative bg-gradient-to-br from-[#3b126d] via-[#4c1d86] to-[#250849] text-white p-4 sm:p-5 rounded-[26px] shadow-lg shadow-purple-950/20 border border-purple-700/50 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[135px]"
            title="Klik untuk tambah uang saku Puskasw"
          >
            {/* Hiasan Stitch Blue di background pojok */}
            <div className="absolute -bottom-2 -right-2 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
              <Image
                src="/stickers/stitchblue2.png"
                alt="Stitch"
                width={75}
                height={75}
                className="object-contain"
              />
            </div>

            {/* Header Kartu: Avatar & Nama */}
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-purple-300/80 shadow-xs flex-shrink-0">
                <Image
                  src="/rafa.png"
                  alt="Puskasw"
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">
                  Puskasw
                </p>
              </div>
            </div>

            {/* Saldo Angka */}
            <div className="mt-3 relative z-10">
              <p className="text-[10px] sm:text-[11px] text-purple-300 font-semibold uppercase tracking-wider">
                Sisa Saldo
              </p>
              <p className="text-base sm:text-xl font-black text-white tracking-tight truncate mt-0.5">
                {formatRupiah(wallets.rafaWallet?.balance)}
              </p>
            </div>
          </div>

          {/* Kartu Dompet 2: Miskasw (Pacar_Saya / Monik) */}
          <div 
            onClick={() => handleCardClick('Pacar_Saya')}
            className="group relative bg-white/95 text-slate-900 p-4 sm:p-5 rounded-[26px] shadow-lg shadow-purple-200/40 border-2 border-[#d9b3ff] cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[135px]"
            title="Klik untuk tambah uang saku Miskasw"
          >
            {/* Hiasan Stitch Pink di background pojok */}
            <div className="absolute -bottom-2 -right-2 opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none">
              <Image
                src="/stickers/stitchpink1.png"
                alt="Angel"
                width={75}
                height={75}
                className="object-contain"
              />
            </div>

            {/* Header Kartu: Avatar & Nama */}
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-pink-300/80 shadow-xs flex-shrink-0">
                <Image
                  src="/monik.png"
                  alt="Miskasw"
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Miskasw
                </p>
              </div>
            </div>

            {/* Saldo Angka */}
            <div className="mt-3 relative z-10">
              <p className="text-[10px] sm:text-[11px] text-purple-700 font-semibold uppercase tracking-wider">
                Sisa Saldo
              </p>
              <p className="text-base sm:text-xl font-black text-[#431478] tracking-tight truncate mt-0.5">
                {formatRupiah(wallets.monikWallet?.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedPerson && (
        <AddUangSakuModal
          person={selectedPerson}
          personName={selectedPerson === 'Saya' ? 'Rafa (Puskasw)' : 'Monik (Miskasw)'}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
