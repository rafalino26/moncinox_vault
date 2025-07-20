'use client';

import { FiAlertTriangle, FiLoader } from "react-icons/fi";
import { useState } from "react";

interface ModalProps {
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

export default function ConfirmationModal({ title, message, onConfirm, onCancel }: ModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        await onConfirm();
        // isLoading akan tetap true karena komponen akan ditutup setelahnya
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-600">{message}</p>
                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} disabled={isLoading} className="w-full p-2 text-slate-700 bg-slate-200 rounded-lg font-semibold hover:bg-slate-300">
                        Batal
                    </button>
                    <button onClick={handleConfirm} disabled={isLoading} className="w-full p-2 text-white bg-red-600 rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-400">
                        {isLoading ? <FiLoader className="animate-spin mx-auto" /> : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}