'use client';

import { FiX, FiLoader } from "react-icons/fi";
import { addUangSaku } from "@/app/actions/transactionActions";
import { useState, ChangeEvent } from "react";
import { useRouter } from 'next/navigation';
import SubmitButton from "./SubmitButton";

interface ModalProps {
    person: 'Saya' | 'Pacar_Saya';
    personName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddUangSakuModal({ person, personName, onClose, onSuccess }: ModalProps) {
    const router = useRouter();
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
        formData.set('amount', realValue);

        const result = await addUangSaku(formData);
       

        if (result.error) {
            alert(result.error);
        } else {
            router.refresh();
            onClose(); 
            onSuccess();  // <-- Tutup modal
        }
    };
    return (

        <>

            <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
                <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Tambah Uang Saku {personName}</h3>
                        <button onClick={onClose}><FiX /></button>
                    </div>
                    <form action={handleSubmit} className="space-y-3">
                        <input type="hidden" name="person" value={person} />
                        <div>
                            <label htmlFor="amountDisplay" className="text-sm font-medium text-slate-700 mb-1 block">Jumlah (Rp)</label>
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
                            <input type="hidden" name="amount" value={realValue} />
                        </div>
                        <SubmitButton>Tambah</SubmitButton>
                    </form>
                </div>
            </div>
        </>
    );
}