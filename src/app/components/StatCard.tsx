import type { ElementType } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    note?: string;
    Icon: ElementType | string;
    color: string;
    ActionIcon?: ElementType;
}

export default function StatCard({ title, value, note, Icon, color, ActionIcon }: StatCardProps) {
    return (
        <div className="bg-white/50 p-3 sm:p-5 rounded-2xl shadow-lg flex items-center justify-between w-full h-full min-w-0 transition-transform active:scale-[0.98]">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                {typeof Icon === 'string' ? (
                    <div className="rounded-full overflow-hidden w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 border border-black/5">
                        <img src={Icon} alt={title} className="object-cover w-full h-full" />
                    </div>
                ) : (
                    <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${color}`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-slate-600 truncate">{title}</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate" title={value}>{value}</p>
                    {note && <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{note}</p>}
                </div>
            </div>

            {ActionIcon && (
                <div className="p-1 bg-slate-200/50 rounded-full self-start flex-shrink-0 ml-1">
                    <ActionIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
                </div>
            )}
        </div>
    );
}
