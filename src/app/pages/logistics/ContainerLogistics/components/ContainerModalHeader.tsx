import React from 'react';
import { X, Edit3, Eye } from 'lucide-react';
import { Switch } from '../../../../components/ui/switch';
import { Badge } from '../../../../components/ui/badge';
import { cn } from '../../../../components/ui/utils';

interface ContainerModalHeaderProps {
    containerId: string;
    status: string;
    isEditMode: boolean;
    onToggleEditMode: (val: boolean) => void;
    onClose: () => void;
}

const STATUS_STYLES: Record<string, string> = {
    'DENGIZDA': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'BOJXONADA': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'QABUL QILINDI': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'KECHIKDI': 'bg-red-500/10 text-red-500 border-red-500/20',
    'KUTILMOQDA': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export const ContainerModalHeader: React.FC<ContainerModalHeaderProps> = ({
    containerId,
    status,
    isEditMode,
    onToggleEditMode,
    onClose,
}) => {
    return (
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-white font-mono italic tracking-tighter">
                    {containerId || 'YANGI KONTEYNER'}
                </h2>
                <Badge
                    className={cn(
                        "px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase italic tracking-wider",
                        STATUS_STYLES[status] || STATUS_STYLES['KUTILMOQDA']
                    )}
                >
                    {status || 'KUTILMOQDA'}
                </Badge>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">
                    <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase italic transition-colors", !isEditMode ? "text-indigo-400" : "text-slate-500")}>
                        <Eye size={14} />
                        Ko'rish
                    </div>
                    <Switch
                        checked={isEditMode}
                        onCheckedChange={onToggleEditMode}
                        className="data-[state=checked]:bg-indigo-600"
                    />
                    <div className={cn("flex items-center gap-2 text-[10px] font-black uppercase italic transition-colors", isEditMode ? "text-indigo-400" : "text-slate-500")}>
                        <Edit3 size={14} />
                        Tahrirlash
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-slate-700"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};
