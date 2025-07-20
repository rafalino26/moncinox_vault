'use client';
// Impor useState dan ChangeEvent
import { addTransaction } from "../actions/transactionActions";
import { useRef, useState, ChangeEvent } from 'react';
import { FiTrendingDown, FiTrendingUp, FiLoader } from 'react-icons/fi';
import CustomDropdown from "./CustomDropdown";
import NotificationPopup from './NotificationPopup';

// Definisikan tipe untuk state kita agar lebih aman
type TransactionType = 'pengeluaran' | 'tabungan';

export default function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
    const formRef = useRef<HTMLFormElement>(null);
    const inputClass = "w-full p-3 bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9b3ff]";

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // State untuk tipe transaksi, default-nya 'pengeluaran' (kaluar doi)
    const [tipe, setTipe] = useState<TransactionType>('pengeluaran');

    // State untuk format angka, ini tetap sama
    const [displayValue, setDisplayValue] = useState('');
    const [realValue, setRealValue] = useState('');
    const [sumber, setSumber] = useState('Saya');

      const sumberOptions = [
        { value: 'Saya', label: 'Rafa' },
        { value: 'Pacar_Saya', label: 'Monik' },
    ];

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        setRealValue(rawValue);
        if (rawValue) {
            setDisplayValue(new Intl.NumberFormat('id-ID').format(parseInt(rawValue)));
        } else {
            setDisplayValue('');
        }
    };

    const handleFormSubmit = async (formData: FormData) => {
        setIsLoading(true); // Mulai loading
        setStatus(null); // Hapus notifikasi lama

        formData.set('jumlah', realValue);
        formData.set('sumber', sumber);
        if (tipe === 'tabungan') formData.set('keterangan', 'Tabungan');

        const result = await addTransaction(formData);

        setIsLoading(false); // Selesai loading

        if (result?.error) {
            setStatus({ type: 'error', message: result.error });
        } else {
            setStatus({ type: 'success', message: 'Data berhasil ditambahkan!' });
            // Reset form hanya jika berhasil
            formRef.current?.reset();
            setDisplayValue('');
            setRealValue('');
            setTipe('pengeluaran');
            setSumber('Saya');
            onSuccess();
        }
    };

      const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        // getMonth() dimulai dari 0 (Januari), jadi tambah 1
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Style untuk tombol pilihan tipe
    const baseButtonClass = "w-full p-3 rounded-lg font-semibold transition-all";
    const active_ButtonClass = "bg-[#743ab7] text-white shadow-md";
    const inactiveButtonClass = "bg-white/50 text-[#8451b6] hover:bg-white/70";

    return (
        <>
         {/* Tampilkan Popup Notifikasi jika ada status */}
            {status && <NotificationPopup status={status} onClose={() => setStatus(null)} />}

            {/* Tampilkan Loading Overlay jika sedang loading */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/30 z-50 flex justify-center items-center">
                    <FiLoader className="text-white text-5xl animate-spin" />
                </div>
            )}
        <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-center text-[#5c2799] mb-4">BATAMBAH DATA ANJAY</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
            <button type="button" onClick={() => setTipe('pengeluaran')} className={`${baseButtonClass} ${tipe === 'pengeluaran' ? active_ButtonClass : inactiveButtonClass}`}>
                <FiTrendingDown className="inline-block mr-2" /> Kaluar Doi
            </button>
            <button type="button" onClick={() => setTipe('tabungan')} className={`${baseButtonClass} ${tipe === 'tabungan' ? active_ButtonClass : inactiveButtonClass}`}>
                <FiTrendingUp className="inline-block mr-2" /> Batabung
            </button>
            </div>

            <form ref={formRef} action={handleFormSubmit} className="space-y-4">
                {/* Input tersembunyi untuk mengirim tipe transaksi */}
                <input type="hidden" name="tipe" value={tipe} />
                 <input type="hidden" name="sumber" value={sumber} />

                {/* --- Kolom Keterangan (Hanya muncul jika 'kaluar doi') --- */}
                {tipe === 'pengeluaran' && (
                    <div>
                        <label htmlFor="keterangan" className="text-sm font-medium text-[#8451b6] mb-1 block">Ada kaluar doi for apa?</label>
                        <input type="text" id="keterangan" name="keterangan" placeholder="KEBUTUHAN BUKAN KEINGINAN" className={inputClass} required />
                    </div>
                )}
                
                {/* --- Kolom Jumlah dan Tanggal (Selalu muncul) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="jumlahDisplay" className="text-sm font-medium text-[#8451b6] mb-1 block">Brapa?</label>
                        <input type="text" id="jumlahDisplay" name="jumlahDisplay" placeholder={tipe === 'pengeluaran' ? "JANGAN BA BOROS!" : "RAJIN-RAJIN MENABUNG"} className={inputClass} value={displayValue} onChange={handleAmountChange} inputMode="numeric" required />
                        <input type="hidden" name="jumlah" value={realValue} />
                    </div>
                    <div>
                            <label htmlFor="tanggal" className="text-sm font-medium text-[#8451b6] mb-1 block">Tanggal brapa?</label>
                            {/* Gunakan fungsi baru kita untuk defaultValue */}
                            <input 
                                type="date" 
                                id="tanggal" 
                                name="tanggal" 
                                defaultValue={getTodayString()} 
                                className={inputClass} 
                                required 
                            />
                        </div>
                </div>

                {/* --- Kolom Sumber (Selalu muncul) --- */}
                <div>
                    <label htmlFor="sumber" className="text-sm font-medium text-[#8451b6] mb-1 block">Sapa pe doi ini?</label>
                    <CustomDropdown 
                        options={sumberOptions}
                        selectedValue={sumber}
                        onSelect={setSumber}
                    />
                </div>
                
                 <button type="submit" disabled={isLoading} className="w-full p-3 text-white bg-[#743ab7] rounded-lg font-semibold hover:bg-[#8451b6] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5c2799] disabled:bg-slate-400 disabled:cursor-not-allowed">
                        {isLoading ? 'LOADING..' : 'SO BTUL?'}
                    </button>
            </form>
        </div>
        </>
    );
}