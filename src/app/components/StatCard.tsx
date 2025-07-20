import type { ElementType } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    note?: string;
    Icon: ElementType;
    color: string;
    ActionIcon?: ElementType;
}

export default function StatCard({ title, value, note, Icon, color, ActionIcon }: StatCardProps) {
    return (
        <div className="bg-white/30 p-5 rounded-2xl shadow-lg flex items-start justify-between w-full h-full">
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${color}`}><Icon className="h-3 w-3 text-white" /></div>
                <div>
                    <p className="text-sm text-slate-600">{title}</p>
                    <p className="text-sm lg:text-2xl font-bold text-slate-800 break-words">{value}</p>
                    {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
                </div>
            </div>
            {ActionIcon && (
                <div className="p-1 bg-slate-200/50 rounded-full">
                    <ActionIcon className="h-3 w-3 text-slate-600" />
                </div>
            )}
        </div>
    );
}