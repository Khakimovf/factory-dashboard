import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { Clock, Ship, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

export const StatusPanel: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    const { watch, setValue } = useFormContext();
    const status = watch('status') || 'DENGIZDA';

    const STATUS_CONFIG: Record<string, { label: string, color: string, progress: number, icon: any }> = {
        'DENGIZDA': { label: 'DENGIZDA', color: 'bg-blue-500', progress: 25, icon: Ship },
        'BOJXONADA': { label: 'BOJXONADA', color: 'bg-amber-500', progress: 75, icon: ShieldCheck },
        'OMBORGA KELDI': { label: 'OMBORGA KELDI', color: 'bg-indigo-500', progress: 90, icon: MapPin },
        'QABUL QILINDI': { label: 'QABUL QILINDI', color: 'bg-emerald-500', progress: 100, icon: CheckCircle2 },
        'KECHIKDI': { label: 'KECHIKDI', color: 'bg-red-500', progress: 40, icon: Clock },
    };

    const current = STATUS_CONFIG[status] || STATUS_CONFIG['DENGIZDA'];

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">📍 Joriy Holat</h4>
                <current.icon size={16} className={current.color.replace('bg-', 'text-')} />
            </div>

            <div className="space-y-4">
                {isEditMode ? (
                    <Select onValueChange={(val) => setValue('status', val)} defaultValue={status}>
                        <SelectTrigger className="w-full bg-slate-950 border-slate-800 rounded-2xl p-4 h-auto text-white font-black italic">
                            <SelectValue placeholder="Holatni tanlang" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-white">
                            {Object.keys(STATUS_CONFIG).map((key) => (
                                <SelectItem key={key} value={key}>{key}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex flex-col gap-2">
                        <span className={`text-xl font-black italic uppercase tracking-tighter ${current.color.replace('bg-', 'text-')}`}>
                            {current.label}
                        </span>
                    </div>
                )}

                <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-slate-600 italic tracking-widest">
                        <span>Progress</span>
                        <span>{current.progress}%</span>
                    </div>
                    <Progress value={current.progress} className={`h-1.5 bg-slate-800 [&>div]:${current.color}`} />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[7px] font-black uppercase text-slate-700 tracking-tighter">
                <div className={`text-center ${current.progress >= 25 ? 'text-indigo-400' : ''}`}>Dengiz</div>
                <div className={`text-center ${current.progress >= 75 ? 'text-indigo-400' : ''}`}>Bojxona</div>
                <div className={`text-center ${current.progress >= 90 ? 'text-indigo-400' : ''}`}>Ombor</div>
                <div className={`text-center ${current.progress === 100 ? 'text-indigo-400' : ''}`}>Qabul</div>
            </div>
        </div>
    );
};
