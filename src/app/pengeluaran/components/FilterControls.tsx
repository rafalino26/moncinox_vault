'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import CustomDropdown from '../../components/CustomDropdown';

// Opsi untuk setiap dropdown
const rentangOptions = [
    { value: 'harian', label: 'harii inii' }, // <-- Ganti nama & pindah ke atas
    { value: 'mingguan', label: 'mingguu inii' },
    { value: 'bulanan', label: 'sebulan terkahirrr' },
    { value: 'semua', label: 'semuanyaaaa' },
    { value: 'custom', label: 'Pilih Tanggal...' },
];

const urutkanOptions = [{ value: 'terbaru', label: 'palingg baruu' }, { value: 'terbesar', label: 'palingg bewsarr' }, { value: 'terkecil', label: 'palingg kewcill' }];
const sumberOptions = [{ value: 'semua', label: 'beduwaaaaa' }, { value: 'Saya', label: 'puskaswww' }, { value: 'Pacar_Saya', label: 'miskaswww' }];

export default function FilterControls({ onSearchChange }: { onSearchChange: (term: string) => void }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    
    const handleFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);
        // Jika memilih rentang selain custom, hapus parameter from & to
        if (key === 'rentang' && value !== 'custom') {
            params.delete('from');
            params.delete('to');
        }
        replace(`${pathname}?${params.toString()}`);
    };
    
    const handleSearch = useDebouncedCallback((term: string) => onSearchChange(term), 300);

    const currentRentang = searchParams.get('rentang') || 'harian';
    const currentUrutkan = searchParams.get('urutkan') || 'terbaru';
    const currentSumber = searchParams.get('sumber') || 'semua';

    const renderDropdown = (label: string, options: any[], selectedValue: string, onSelect: (value: string) => void) => (
        <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
            <CustomDropdown options={options} selectedValue={selectedValue} onSelect={onSelect} />
        </div>
    );

    return (
        <div>
            {/* Desktop */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-4 p-4 bg-white/30 rounded-2xl shadow-lg"> {/* <-- Diubah dari md */}
                {renderDropdown("kapannn", rentangOptions, currentRentang, (value) => handleFilter('rentang', value))}
                {renderDropdown("urutiinnn", urutkanOptions, currentUrutkan, (value) => handleFilter('urutkan', value))}
                {renderDropdown("jujungkas siapa", sumberOptions, currentSumber, (value) => handleFilter('sumber', value))}
                <div className='self-end'><input type="text" placeholder="nyarii apaaa..." onChange={(e) => handleSearch(e.target.value)} className="w-full p-3 bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c2799]" /></div>
            </div>
            {/* Tampilan Mobile & Tablet Kecil (di bawah lg) */}
            <div className="lg:hidden flex gap-2"> {/* <-- Diubah dari md */}
                <input type="text" placeholder="Cari pengeluaran..." onChange={(e) => handleSearch(e.target.value)} className="flex-grow p-3 bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5c2799]" />
                <button onClick={() => setIsFilterOpen(true)} className="p-3 bg-white/50 border border-black/10 rounded-lg"><FiFilter className="text-xl text-slate-700" /></button>
            </div>
             {currentRentang === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/10">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Dari Tanggal</label>
                            <input type="date" onChange={(e) => handleFilter('from', e.target.value)} defaultValue={searchParams.get('from') || ''} className="w-full p-2 bg-white/50 border border-black/10 rounded-lg"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Sampai Tanggal</label>
                            <input type="date" onChange={(e) => handleFilter('to', e.target.value)} defaultValue={searchParams.get('to') || ''} className="w-full p-2 bg-white/50 border border-black/10 rounded-lg"/>
                        </div>
                    </div>
                )}
            {isFilterOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4" onClick={() => setIsFilterOpen(false)}>
                    <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center"><h3 className="text-lg font-bold">Filter & Urutkan</h3><button onClick={() => setIsFilterOpen(false)}><FiX /></button></div>
                        {renderDropdown("Rentang", rentangOptions, currentRentang, (value) => handleFilter('rentang', value))}
                        {renderDropdown("Urutkan", urutkanOptions, currentUrutkan, (value) => handleFilter('urutkan', value))}
                        {renderDropdown("Sumber", sumberOptions, currentSumber, (value) => handleFilter('sumber', value))}
                    </div>
                </div>
            )}
        </div>
    );
}