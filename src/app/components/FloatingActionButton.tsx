'use client';

import { FiPlus } from 'react-icons/fi';
import Image from 'next/image';

interface FABProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FABProps) {
  return (
    <div className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-40 group">
      {/* Stitch sticker kecil di atas FAB */}
      <div className="absolute -top-6 -right-1 pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
        <Image
          src="/stickers/stitchblue.png"
          alt="Stitch peek"
          width={30}
          height={30}
          className="object-contain drop-shadow-md"
        />
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#5c2799] to-[#8b46e3] text-white shadow-xl shadow-purple-950/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-300"
        aria-label="Tambah Transaksi Baru"
      >
        <FiPlus size={24} className="stroke-[2.5]" />
      </button>
    </div>
  );
}
