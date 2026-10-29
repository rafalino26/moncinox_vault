'use client';
import { useEffect } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';

interface NotificationProps {
    status: { type: 'success' | 'error'; message: string };
    onClose: () => void;
}

export default function NotificationPopup({ status, onClose }: NotificationProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = status.type === 'success';
    const bgColor = isSuccess ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
    const textColor = isSuccess ? 'text-green-900' : 'text-red-900';
    const Icon = isSuccess ? FiCheckCircle : FiAlertTriangle;

    return (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-5 sm:right-5 z-50 sm:max-w-md pointer-events-none transition-all">
            <div className={`flex items-start p-4 rounded-xl border-l-4 shadow-xl pointer-events-auto backdrop-blur-md ${bgColor} ${textColor}`}>
                <Icon className="h-6 w-6 mr-3 flex-shrink-0 mt-0.5"/>
                <div className="flex-1 min-w-0 mr-2">
                    <p className="font-bold text-sm sm:text-base">{isSuccess ? 'Berhasil!' : 'Gagal!'}</p>
                    <p className="text-xs sm:text-sm mt-0.5 break-words">{status.message}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5 flex-shrink-0" aria-label="Tutup notifikasi">
                    <FiX className="h-5 w-5"/>
                </button>
            </div>
        </div>
    );
}
