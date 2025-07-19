'use client';
import { useEffect } from 'react';
import { FiCheckCircle, FiAlertTriangle, FiX } from 'react-icons/fi';

interface NotificationProps {
    status: { type: 'success' | 'error'; message: string };
    onClose: () => void;
}

export default function NotificationPopup({ status, onClose }: NotificationProps) {
    // Popup akan hilang otomatis setelah 5 detik
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const isSuccess = status.type === 'success';
    const bgColor = isSuccess ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
    const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
    const Icon = isSuccess ? FiCheckCircle : FiAlertTriangle;

    return (
        <div className="fixed top-5 right-5 z-50">
            <div className={`flex items-start p-4 rounded-lg border-l-4 shadow-lg ${bgColor} ${textColor}`}>
                <Icon className="h-6 w-6 mr-3"/>
                <div className="flex-1">
                    <p className="font-bold">{isSuccess ? 'Berhasil!' : 'Gagal!'}</p>
                    <p className="text-sm">{status.message}</p>
                </div>
                <button onClick={onClose} className="ml-4">
                    <FiX className="h-5 w-5"/>
                </button>
            </div>
        </div>
    );
}