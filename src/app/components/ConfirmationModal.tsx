'use client';

import { FiAlertTriangle } from "react-icons/fi";
import { StitchActionLabel } from './StitchMotion';
import { useState, useRef } from "react";

interface ModalProps {
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    tone?: 'default' | 'violet';
}

export default function ConfirmationModal({ title, message, onConfirm, onCancel, tone = 'default' }: ModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submitLock = useRef(false);

    const handleConfirm = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        setError(null);
        setIsLoading(true);
        try {
            await onConfirm();
        } catch {
            setError('Proses gagal. Silakan coba lagi.');
        } finally {
            submitLock.current = false;
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${tone === 'violet' ? 'bg-purple-100' : 'bg-red-100'}`}>
                    <FiAlertTriangle className={`h-6 w-6 ${tone === 'violet' ? 'text-purple-700' : 'text-red-600'}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-600">{message}</p>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} disabled={isLoading} className="w-full p-2 text-slate-700 bg-slate-200 rounded-lg font-semibold hover:bg-slate-300">
                        Batal
                    </button>
                    <button onClick={handleConfirm} disabled={isLoading} aria-busy={isLoading} className={`w-full min-h-[48px] p-2 text-white rounded-lg font-semibold ${tone === 'violet' ? 'bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400' : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'}`}>
                        <StitchActionLabel pending={isLoading} pendingLabel="Menghapus…">Ya, Hapus</StitchActionLabel>
                    </button>
                </div>
            </div>
        </div>
    );
}
