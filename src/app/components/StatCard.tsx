import type { ElementType } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    note?: string;
    Icon: ElementType | string; // Bisa komponen ikon atau string path gambar
    color: string;
    ActionIcon?: ElementType;
}

export default function StatCard({ title, value, note, Icon, color, ActionIcon }: StatCardProps) {
    return (
        <div className="bg-white/50 p-5 rounded-2xl shadow-lg flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-4">
                {/* Logika untuk menampilkan gambar jika Icon adalah string */}
                {typeof Icon === 'string' ? (
                    <div className="rounded-full overflow-hidden w-12 h-12 flex-shrink-0">
                        <img src={Icon} alt={title} className="object-cover w-full h-full" />
                    </div>
                ) : (
                    // Tampilkan ikon jika bukan string
                    <div className={`p-3 rounded-lg ${color}`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                )}

                <div>
                    <p className="text-sm text-slate-600">{title}</p>
                    <p className="text-base md:text-lg font-bold text-slate-800 break-words">{value}</p>
                    {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
                </div>
            </div>

            {ActionIcon && (
                <div className="p-1 bg-slate-200/50 rounded-full self-start">
                    <ActionIcon className="h-4 w-4 text-slate-600" />
                </div>
            )}
        </div>
    );
}