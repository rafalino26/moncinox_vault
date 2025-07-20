'use client';

import { FiX, FiLoader } from "react-icons/fi";
import { addUangSaku } from "@/app/actions/transactionActions";
import { useState, ChangeEvent } from "react"; // <-- Tambahkan ChangeEvent

interface ModalProps {
    person: 'Saya' | 'Pacar_Saya';
    personName: string;
    onClose: () => void;
}

export default function AddUangSakuModal({ person, personName, onClose }: ModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    // State baru untuk format angka
    const [displayValue, setDisplayValue] = useState('');
    const [realValue, setRealValue] = useState('');

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        setRealValue(rawValue);
        if (rawValue) {
            setDisplayValue(new Intl.NumberFormat('id-ID').format(parseInt(rawValue)));
        } else {
            setDisplayValue('');
        }
    };
    
    const handleSubmit = async (formData: FormData) => {
        // Ganti nilai 'amount' dengan nilai asli sebelum dikirim
        formData.set('amount', realValue);

        setIsLoading(true);
        const result = await addUangSaku(formData);
        if (result.error) {
            alert(result.error);
        } else {
            onClose(); // Tutup modal jika berhasil
        }
        setIsLoading(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Tambah Uang Saku {personName}</h3>
                    <button onClick={onClose}><FiX /></button>
                </div>
                <form action={handleSubmit} className="space-y-3">
                    <input type="hidden" name="person" value={person} />
                    
                    {/* --- PERUBAHAN UTAMA DI SINI --- */}
                    <div>
                        <label htmlFor="amountDisplay" className="text-sm font-medium text-slate-700 mb-1 block">Jumlah (Rp)</label>
                        {/* Input yang dilihat pengguna */}
                        <input 
                            type="text" 
                            id="amountDisplay" 
                            placeholder="e.g., 300.000" 
                            required 
                            className="w-full p-3 bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9b3ff]"
                            value={displayValue}
                            onChange={handleAmountChange}
                            inputMode="numeric"
                        />
                        {/* Input tersembunyi untuk dikirim ke server */}
                        <input 
                            type="hidden" 
                            name="amount" 
                            value={realValue}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full p-3 text-white bg-[#743ab7] rounded-lg font-semibold hover:bg-[#8451b6] disabled:bg-slate-400">
                        {isLoading ? <FiLoader className="animate-spin mx-auto" /> : 'Tambah'}
                    </button>
                </form>
            </div>
        </div>
    );
}