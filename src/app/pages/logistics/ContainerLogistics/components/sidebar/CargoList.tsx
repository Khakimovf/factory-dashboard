import React from 'react';
import { Package, Trash2, Edit2, Plus } from 'lucide-react';

const MOCK_CARGO = [
    { id: 1, name: 'ABS Granula (Natural)', qty: '12,000 kg' },
    { id: 2, name: 'ABS Granula (Black)', qty: '4,500 kg' },
    { id: 3, name: 'Plastifikator DOP', qty: '1,500 kg' },
];

export const CargoList: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">📦 Yuk Tarkibi</h4>
                {isEditMode && (
                    <button className="p-1.5 bg-indigo-600/10 text-indigo-400 rounded-lg hover:bg-indigo-600/20 transition-all">
                        <Plus size={14} />
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {MOCK_CARGO.map((item) => (
                    <div key={item.id} className="group flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                                <Package size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-white italic uppercase tracking-tight">{item.name}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase font-mono">{item.qty}</span>
                            </div>
                        </div>

                        {isEditMode && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-white transition-all">
                                    <Edit2 size={12} />
                                </button>
                                <button className="p-1.5 hover:bg-red-500/10 rounded-md text-slate-500 hover:text-red-500 transition-all">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-2">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-black text-slate-600 uppercase italic">Jami Og'irlik:</span>
                    <span className="text-[10px] font-black text-white italic font-mono">18,000 kg</span>
                </div>
            </div>
        </div>
    );
};
