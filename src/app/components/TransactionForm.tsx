'use client';

import { useWallet } from './WalletContext';
import { useRef, useState, ChangeEvent } from 'react';
import { addTransaction } from "@/app/actions/transactionActions";
import CustomDropdown from "./CustomDropdown";
import NotificationPopup from './NotificationPopup';
import SubmitButton from './SubmitButton';

export default function TransactionForm({ onSuccess }: { onSuccess: () => void }) {
    const formRef = useRef<HTMLFormElement>(null);
    const inputClass = "w-full p-3 bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9b3ff] text-base min-h-[44px]";
    const { addSavedTransaction } = useWallet();
    const submitLock = useRef(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [displayValue, setDisplayValue] = useState('');
    const [realValue, setRealValue] = useState('');
    const [sumber, setSumber] = useState('Saya');

    const sumberOptions = [
        { value: 'Saya', label: 'puskas paling jelek dan buruk dimuka bumi' },
        { value: 'Pacar_Saya', label: 'miskaswwww yanggg palingggg cantikkkkk dimukaaaaaa bumiiiiiiii' },
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
        if (submitLock.current) return;
        submitLock.current = true;
        setStatus(null);
        try {

        const isTabungan = formData.get('isTabungan') === 'on';
        formData.set('tipe', isTabungan ? 'tabungan' : 'pengeluaran');
        
        if (isTabungan && !formData.get('keterangan')) {
            formData.set('keterangan', 'Tabungan');
        }
        
        formData.delete('isTabungan');
        formData.set('jumlah', realValue);
        formData.set('sumber', sumber);

        const result = await addTransaction(formData);

        if (result?.error) {
            setStatus({ type: 'error', message: result.error });
        } else {
            if (result.success) addSavedTransaction(result.transaction, result.wallet);
            setStatus({ type: 'success', message: 'Data berhasil ditambahkan!' });
            formRef.current?.reset();
            setDisplayValue('');
            setRealValue('');
            setSumber('Saya');
            onSuccess();
        }
        } catch {
            setStatus({ type: 'error', message: 'Gagal menyimpan transaksi. Silakan coba lagi.' });
        } finally {
            submitLock.current = false;
        }
    };

    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <>
            {status && <NotificationPopup status={status} onClose={() => setStatus(null)} />}
            
            <div className="bg-gray-50 p-4 sm:p-8 rounded-2xl shadow-lg mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-center text-[#5c2799] mb-4 sm:mb-6">cihuyy mengisi dataww</h2>
                
                <form ref={formRef} action={handleFormSubmit} className="space-y-4">
                    <input type="hidden" name="sumber" value={sumber} />

                    <div>
                        <label htmlFor="keterangan" className="text-sm font-medium text-[#8451b6] mb-1 block">apaaaa jujungkas</label>
                        <input type="text" id="keterangan" name="keterangan" placeholder="jujungkas" className={inputClass} required />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="jumlahDisplay" className="text-sm font-medium text-[#8451b6] mb-1 block">brapaaaa jujungkasss</label>
                            <input type="text" id="jumlahDisplay" name="jumlahDisplay" placeholder="skulungkus" className={inputClass} value={displayValue} onChange={handleAmountChange} inputMode="numeric" required />
                            <input type="hidden" name="jumlah" value={realValue} />
                        </div>
                        <div>
                            <label htmlFor="tanggal" className="text-sm font-medium text-[#8451b6] mb-1 block">tanggal jujungkas</label>
                            <input type="date" id="tanggal" name="tanggal" defaultValue={getTodayString()} className={inputClass} required />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="sumber" className="text-sm font-medium text-[#8451b6] mb-1 block">puskasssswww jelek / miskassswww cantikkk</label>
                        <CustomDropdown options={sumberOptions} selectedValue={sumber} onSelect={setSumber} />
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                        <input 
                            id="isTabungan"
                            name="isTabungan"
                            type="checkbox"
                            className="h-5 w-5 rounded border-gray-300 text-[#743ab7] focus:ring-[#743ab7]"
                        />
                        <label htmlFor="isTabungan" className="font-medium text-slate-700 text-sm sm:text-base cursor-pointer">
                            tabungannn jujungkasswwww
                        </label>
                    </div>
                    
                    <SubmitButton>jujungkasww</SubmitButton>
                </form>
            </div>
        </>
    );
}
