'use client';

import { useFormStatus } from 'react-dom';
import { FiLoader } from 'react-icons/fi';

export default function SubmitButton({ children, className }: { children: React.ReactNode, className?: string }) {
    // Hook ini akan otomatis memberikan status 'pending' dari form induknya
    const { pending } = useFormStatus();

    return (
        <button 
            type="submit" 
            disabled={pending} 
            className={className || "w-full p-3 text-white bg-[#743ab7] rounded-lg font-semibold hover:bg-[#8451b6] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5c2799] disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center h-[48px]"}
        >
            {pending ? <FiLoader className="animate-spin text-2xl" /> : children}
        </button>
    );
}