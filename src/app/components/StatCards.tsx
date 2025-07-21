'use client';

import { useState } from "react";
import StatCard from "./StatCard";
import AddUangSakuModal from "./AddUangSakuModal";
import { FiPlus, FiPocket } from 'react-icons/fi';
import type { Wallet } from "@prisma/client";

const formatRupiah = (amount: number | null | undefined) => `Rp${new Intl.NumberFormat('id-ID').format(amount || 0)}`;

// Terima 'wallets' dan 'onDataUpdate' sebagai props
export default function StatCards({ wallets, onDataUpdate }: {
    wallets: { rafaWallet: Wallet | null, monikWallet: Wallet | null },
    onDataUpdate: () => void
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<'Saya' | 'Pacar_Saya' | null>(null);

    // Hapus useEffect dari sini

    const handleCardClick = (person: 'Saya' | 'Pacar_Saya') => {
        setSelectedPerson(person);
        setIsModalOpen(true);
    };
    
    return (
        <>
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Ringkasan Saat Ini</h2>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleCardClick('Saya')} className="text-left">
                        <StatCard title="Sisa Uang Rafa" value={formatRupiah(wallets.rafaWallet?.balance)} Icon="/rafa.png" color="transparent" ActionIcon={FiPlus} />
                    </button>
                    <button onClick={() => handleCardClick('Pacar_Saya')} className="text-left">
                        <StatCard title="Sisa Uang Monik" value={formatRupiah(wallets.monikWallet?.balance)} Icon="/monik.png" color="transparent" ActionIcon={FiPlus} />
                    </button>
                </div>
            </div>

            {isModalOpen && selectedPerson && (
                <AddUangSakuModal 
                    person={selectedPerson}
                    personName={selectedPerson === 'Saya' ? 'Rafa' : 'Monik'}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={onDataUpdate} // <-- Gunakan onDataUpdate di sini
                />
            )}
        </>
    );
}