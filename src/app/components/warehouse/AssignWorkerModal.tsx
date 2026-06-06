import React, { useState } from 'react';
import { X, User, CheckCircle2 } from 'lucide-react';

export const AssignWorkerModal = ({ onAssign, onClose }: { onAssign: (name: string) => void, onClose: () => void }) => {
    const [selected, setSelected] = useState('');
    const workers = ['Alex Johnson', 'Sarah Miller', 'Mike Ross', 'Elena Petrova'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#0b0e14] border border-white/10 rounded-[2.5rem] p-8 w-[450px] shadow-[0_0_80px_rgba(0,0,0,0.6)]"
                style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-blue-500 text-[9px] font-black tracking-[0.3em] uppercase mb-1">Resource Selection</p>
                        <h3 className="text-white font-black text-2xl tracking-tighter uppercase">Assign Picking Task</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-3 mb-8">
                    {workers.map(w => (
                        <button key={w} onClick={() => setSelected(w)}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-sm transition-all border flex items-center justify-between group ${selected === w
                                    ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/10'
                                    : 'bg-white/2 border-white/5 text-slate-500 hover:bg-white/5'
                                }`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selected === w ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-600'}`}>
                                    <User className="w-4 h-4" />
                                </div>
                                <span className="font-black uppercase tracking-tight">{w}</span>
                            </div>
                            {selected === w && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => selected && onAssign(selected)}
                        disabled={!selected}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:grayscale text-white rounded-[1.5rem] text-[11px] font-black tracking-widest uppercase transition-all shadow-xl shadow-emerald-900/20"
                    >
                        Confirm & Release Order ({selected || 'Select Employee'})
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-slate-600 hover:text-white text-[9px] font-black tracking-widest uppercase transition-colors">
                        Cancel Task Release
                    </button>
                </div>
            </div>
        </div>
    );
};
