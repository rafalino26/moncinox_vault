'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import CustomDropdown from '../../components/CustomDropdown';

const rentangOptions = [
    { value: 'harian', label: 'harii inii' },
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);
        if (key === 'rentang' && value !== 'custom') {
            params.delete('from');
            params.delete('to');
        }
        window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
    };
    
    const handleSearch = useDebouncedCallback((term: string) => onSearchChange(term), 300);

    const currentRentang = searchParams.get('rentang') || 'harian';
    const currentUrutkan = searchParams.get('urutkan') || 'terbaru';
    const currentSumber = searchParams.get('sumber') || 'semua';

    const renderDropdown = (label: string, options: any[], selectedValue: string, onSelect: (value: string) => void) => (
        <div>
            <label className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5 block">{label}</label>
            <CustomDropdown options={options} selectedValue={selectedValue} onSelect={onSelect} />
        </div>
    );

    return (
        <div>
            {/* Desktop */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-4 p-4 sm:p-5 bg-white/80 backdrop-blur-md rounded-2xl border border-purple-100 shadow-xs">
                {renderDropdown("kapannn", rentangOptions, currentRentang, (value) => handleFilter('rentang', value))}
                {renderDropdown("urutiinnn", urutkanOptions, currentUrutkan, (value) => handleFilter('urutkan', value))}
                {renderDropdown("jujungkas siapa", sumberOptions, currentSumber, (value) => handleFilter('sumber', value))}
                <div className='self-end'>
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1.5 block">Cari</label>
                    <input 
                        type="text" 
                        placeholder="nyarii apaaa..." 
                        onChange={(e) => handleSearch(e.target.value)} 
                        className="w-full p-3 min-h-[44px] bg-slate-50 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5c2799] text-base" 
                    />
                </div>
            </div>

            {/* Mobile */}
            <div className="lg:hidden flex gap-2">
                <input 
                    type="text" 
                    placeholder="Cari pengeluaran..." 
                    onChange={(e) => handleSearch(e.target.value)} 
                    className="flex-grow p-3 bg-white/90 border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5c2799] text-base shadow-xs" 
                />
                <button 
                    onClick={() => setIsFilterOpen(true)} 
                    className="p-3 bg-white/90 border border-purple-100 rounded-xl text-purple-800 hover:bg-purple-50 shadow-xs flex items-center justify-center min-w-[48px]"
                    aria-label="Filter"
                >
                    <FiFilter className="text-xl" />
                </button>
            </div>

            {currentRentang === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 bg-white/80 rounded-2xl border border-purple-100 shadow-xs">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1 block">Dari Tanggal</label>
                        <input type="date" onChange={(e) => handleFilter('from', e.target.value)} defaultValue={searchParams.get('from') || ''} className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl text-base"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1 block">Sampai Tanggal</label>
                        <input type="date" onChange={(e) => handleFilter('to', e.target.value)} defaultValue={searchParams.get('to') || ''} className="w-full p-2.5 bg-slate-50 border border-purple-100 rounded-xl text-base"/>
                    </div>
                </div>
            )}

            {isFilterOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-0 sm:p-4" onClick={() => setIsFilterOpen(false)}>
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-purple-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center pb-3 border-b border-purple-100">
                            <h3 className="text-base font-bold text-slate-800">Filter & Urutkan</h3>
                            <button onClick={() => setIsFilterOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><FiX size={20} /></button>
                        </div>
                        {renderDropdown("Rentang", rentangOptions, currentRentang, (value) => handleFilter('rentang', value))}
                        {renderDropdown("Urutkan", urutkanOptions, currentUrutkan, (value) => handleFilter('urutkan', value))}
                        {renderDropdown("Sumber", sumberOptions, currentSumber, (value) => handleFilter('sumber', value))}
                    </div>
                </div>
            )}
        </div>
    );
}
