import type { ElementType } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    note?: string;
    Icon: ElementType;
    color: string;
}

export default function StatCard({ title, value, note, Icon, color }: StatCardProps) {
    return (
        <div className="bg-gray-50 p-5 rounded-2xl shadow-lg flex items-start gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-600">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
            </div>
        </div>
    );
}