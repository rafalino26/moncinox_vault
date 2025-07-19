'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

export default function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
    // State untuk melacak apakah section terbuka atau tertutup
    // Defaultnya adalah false (tertutup) sesuai permintaanmu
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className=" ">
            {/* Header yang bisa diklik */}
            <button 
                className="w-full flex justify-between items-center p-4"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <FiChevronDown 
                    className={`text-2xl text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>
            
            {/* Konten yang akan muncul/hilang */}
            {isOpen && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
}