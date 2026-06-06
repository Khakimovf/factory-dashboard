import React from 'react';
import { CheckCircle2, Clock, MapPin, Ship, ShieldCheck, Warehouse, Plus } from 'lucide-react';

const TIMELINE_STEPS = [
    { id: 1, title: 'Jo\'natildi (Shanghai)', date: '2026-05-15 10:30', status: 'completed', icon: Ship, description: 'Konteyner kemaga yuklandi va portdan chiqdi.' },
    { id: 2, title: 'Tranzitda (Malacca Strait)', date: '2026-05-22 14:15', status: 'completed', icon: Ship, description: 'Marshrut bo\'yicha harakatlanmoqda.' },
    { id: 3, title: 'Bojxona Terminaliga Keldi', date: '2026-05-28 09:00', status: 'completed', icon: MapPin, description: 'Toshkent Bojxona postiga yetib keldi.' },
    { id: 4, title: 'Bojxona Rasmiylashtiruvi', date: '2026-05-28 11:30', status: 'active', icon: ShieldCheck, description: 'GTD topshirildi, tekshiruv kutilmoqda.' },
    { id: 5, title: 'Omborga Qabul Qilish', date: '—', status: 'pending', icon: Warehouse, description: 'Loyiha bo\'yicha qabul qilish jarayoni.' },
];

export const TimelineTab: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Vaqt Jadvali (Logistics Milestones)</h4>
                {isEditMode && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-[9px] font-black uppercase italic hover:text-white transition-all">
                        <Plus size={14} />
                        Qadam Qo'shish
                    </button>
                )}
            </div>

            <div className="relative pl-8 space-y-12 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800 before:shadow-[0_0_10px_rgba(30,41,59,0.5)]">
                {TIMELINE_STEPS.map((step, i) => (
                    <div key={step.id} className="relative group">
                        <div className={`absolute -left-[27px] top-1 w-8 h-8 rounded-xl flex items-center justify-center z-10 transition-all ${step.status === 'completed' ? 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white' :
                                step.status === 'active' ? 'bg-indigo-600 animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white' :
                                    'bg-slate-900 border border-slate-800 text-slate-600'
                            }`}>
                            <step.icon size={16} />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <p className={`text-[12px] font-black italic uppercase tracking-tight ${step.status === 'active' ? 'text-indigo-400' :
                                        step.status === 'completed' ? 'text-white' : 'text-slate-600'
                                    }`}>
                                    {step.title}
                                </p>
                                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono">{step.date}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed max-w-md italic">
                                {step.description}
                            </p>

                            {step.status === 'active' && isEditMode && (
                                <div className="flex gap-2 mt-3">
                                    <button className="px-3 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase italic hover:bg-emerald-600/20 transition-all">
                                        Tasdiqlash
                                    </button>
                                    <button className="px-3 py-1 bg-slate-800 text-slate-500 rounded-lg text-[8px] font-black uppercase italic hover:text-white transition-all">
                                        Tahrirlash
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
