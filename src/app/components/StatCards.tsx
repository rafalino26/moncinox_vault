'use client';

import { useState } from "react";
import StatCard from "./StatCard";
import AddUangSakuModal from "./AddUangSakuModal";
import type { Wallet } from "@prisma/client";

const formatRupiah = (amount: number | null | undefined) => `Rp${new Intl.NumberFormat('id-ID').format(amount || 0)}`;

export default function StatCards({ wallets, onDataUpdate }: {
    wallets: { rafaWallet: Wallet | null, monikWallet: Wallet | null },
    onDataUpdate: () => void
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<'Saya' | 'Pacar_Saya' | null>(null);

    const handleCardClick = (person: 'Saya' | 'Pacar_Saya') => {
        setSelectedPerson(person);
        setIsModalOpen(true);
    };
    
    return (
        <>
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">puskassw & miskassww</h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button onClick={() => handleCardClick('Saya')} className="text-left w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-[#743ab7] rounded-2xl">
                        <StatCard title="puskasw" value={formatRupiah(wallets.rafaWallet?.balance)} Icon="/rafa.png" color="transparent" />
                    </button>
                    <button onClick={() => handleCardClick('Pacar_Saya')} className="text-left w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-[#743ab7] rounded-2xl">
                        <StatCard title="miskasw" value={formatRupiah(wallets.monikWallet?.balance)} Icon="/monik.png" color="transparent" />
                    </button>
                </div>
            </div>

            {isModalOpen && selectedPerson && (
                <AddUangSakuModal 
                    person={selectedPerson}
                    personName={selectedPerson === 'Saya' ? 'Rafa' : 'Monik'}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={onDataUpdate}
                />
            )}
        </>
    );
}
