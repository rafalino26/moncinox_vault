'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="w-full">
      {/* Header yang bisa diklik */}
      <button
        type="button"
        aria-expanded={isOpen}
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left focus:outline-none transition-colors hover:bg-purple-50/40"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h2>
        <div className={`p-1.5 rounded-full bg-purple-100/70 text-[#5c2799] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <FiChevronDown size={18} />
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden px-4 pb-4 sm:px-5 sm:pb-5">
          {isOpen && children}
        </div>
      </div>
    </div>
  );
}
