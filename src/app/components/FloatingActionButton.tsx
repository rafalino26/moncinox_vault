'use client';

import { FiPlus } from 'react-icons/fi';
import Image from 'next/image';

interface FABProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FABProps) {
  return (
    <div className="fixed bottom-[5.5rem] right-4 sm:bottom-8 sm:right-8 z-40 group">
      {/* Stitch sticker kecil di atas FAB */}
      <div className="absolute -top-7 -right-1 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
        <Image
          src="/stickers/stitchblue.png"
          alt="Stitch peek"
          width={34}
          height={34}
          className="object-contain drop-shadow-md"
        />
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5c2799] to-[#8b46e3] text-white shadow-2xl shadow-purple-950/40 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300"
        aria-label="Tambah Transaksi Baru"
      >
        <FiPlus size={28} className="stroke-[2.5]" />
      </button>
    </div>
  );
}
