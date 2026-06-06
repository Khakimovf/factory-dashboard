import React from 'react';
import { Copy, Mail, Printer, FileSpreadsheet, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export const QuickActions: React.FC = () => {
    const actions = [
        {
            icon: Copy, label: 'GTD Nusxalash', color: 'text-indigo-400', onClick: () => {
                navigator.clipboard.writeText('GTD-2026-04821');
                toast.success('GTD raqami nusxalandi');
            }
        },
        {
            icon: Mail, label: 'Deklarantga Xabar', color: 'text-blue-400', onClick: () => {
                toast.info('Xabar yuborish oynasi ochilmoqda');
            }
        },
        {
            icon: Printer, label: 'Hujjatlarni Print', color: 'text-slate-400', onClick: () => {
                window.print();
            }
        },
        {
            icon: FileSpreadsheet, label: 'Excel Export', color: 'text-emerald-400', onClick: () => {
                toast.success('Excel fayl tayyorlanmoqda');
            }
        },
    ];

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                <Share2 size={12} /> Tezkor Amallar
            </h4>

            <div className="grid grid-cols-1 gap-2">
                {actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={action.onClick}
                        className="flex items-center gap-3 w-full p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:bg-slate-800 hover:border-slate-700 transition-all group"
                    >
                        <action.icon size={16} className={`${action.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase italic transition-colors">
                            {action.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
