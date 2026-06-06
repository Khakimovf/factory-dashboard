import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Progress } from '../../../../../components/ui/progress';
import { Copy, User, DollarSign, Calendar, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export const CustomsTab: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    const { register, formState: { errors } } = useFormContext();

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Nusxa olindi: ' + text);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            GTD Raqami
                        </Label>
                        <div className="relative group">
                            <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={18} />
                            <Input
                                {...register('gtd')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-12 text-sm font-mono font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                                placeholder="GTD-2026-XXXXX"
                            />
                            {!isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard('GTD-2026-04821')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <Copy size={16} />
                                </button>
                            )}
                        </div>
                        {errors.gtd && <p className="text-red-500 text-[10px] ml-2 font-bold uppercase italic">{errors.gtd.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Deklarant Ismi
                        </Label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={18} />
                            <Input
                                {...register('declarant')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            To'lov Summasi ($)
                        </Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400" size={18} />
                            <Input
                                type="number"
                                {...register('customsPayment')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-mono font-black text-emerald-400 italic focus:border-emerald-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Tekshiruv Sanasi
                        </Label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                type="date"
                                {...register('inspectionDate')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[32px] space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Bojxona Holati</h4>
                    <span className="text-[10px] font-black text-indigo-400 uppercase italic">Jarayonda (65%)</span>
                </div>
                <Progress value={65} className="h-2 bg-slate-800 [&>div]:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]" />

                <div className="grid grid-cols-4 gap-4 pt-2">
                    {[
                        { label: 'Hujjat Topshirildi', active: true },
                        { label: 'To\'lov Tasdiqladi', active: true },
                        { label: 'Tekshiruvda', active: true },
                        { label: 'Ruxsat Berildi', active: false },
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <div className={`h-1 rounded-full ${step.active ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                            <span className={`text-[8px] font-black uppercase text-center italic ${step.active ? 'text-slate-300' : 'text-slate-600'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
