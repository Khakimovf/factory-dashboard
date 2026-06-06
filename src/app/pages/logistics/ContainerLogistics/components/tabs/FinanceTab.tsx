import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { DollarSign, TrendingUp, Calculator, AlertTriangle } from 'lucide-react';

export const FinanceTab: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    const { register, watch } = useFormContext();
    const [useUZS, setUseUZS] = useState(false);

    // Use watch to get values for automatic Landed Cost calculator
    const fob = Number(watch('fobPrice') || 0);
    const freight = Number(watch('freightCost') || 0);
    const insurance = Number(watch('insuranceCost') || 0);
    const duty = Number(watch('customsDuty') || 0);
    const vat = Number(watch('vatCost') || 0);

    const landedCost = fob + freight + insurance + duty + vat;
    const exchangeRate = 12850; // Mock rate

    const formatCurrency = (val: number) => {
        const amount = useUZS ? val * exchangeRate : val;
        return new Intl.NumberFormat(useUZS ? 'uz-UZ' : 'en-US', {
            style: 'currency',
            currency: useUZS ? 'UZS' : 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setUseUZS(false)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all ${!useUZS ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    >
                        USD
                    </button>
                    <button
                        onClick={() => setUseUZS(true)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all ${useUZS ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                    >
                        UZS
                    </button>
                </div>

                <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-[20px]">
                    <Calculator size={18} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase italic">Landed Cost:</span>
                    <span className="text-sm font-black text-white italic font-mono">{formatCurrency(landedCost)}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">FOB Narxi (Invoice)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                type="number" {...register('fobPrice')} disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white font-mono focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Freight (Tashish)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                type="number" {...register('freightCost')} disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white font-mono focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Insurance (Sug'urta)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                type="number" {...register('insuranceCost')} disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white font-mono focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Bojxona Boji (Duty)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                type="number" {...register('customsDuty')} disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white font-mono focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">VAT / QQS (12%)</Label>
                        <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <Input
                                type="number" {...register('vatCost')} disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white font-mono focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>

                    <div className="p-6 bg-indigo-600/5 border border-indigo-500/20 rounded-[32px] space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-400 uppercase italic">Jami Landed Cost</span>
                            <TrendingUp size={16} className="text-indigo-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-white font-mono italic tracking-tighter">
                                {formatCurrency(landedCost)}
                            </span>
                            <span className="text-[8px] font-bold text-slate-600 uppercase mt-1">
                                * Barcha xarajatlar kiritildi
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {landedCost > 100000 && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
                    <AlertTriangle className="text-amber-500" size={18} />
                    <p className="text-[10px] font-black text-amber-500 uppercase italic">
                        Diqqat: Yuqori qiymatli yuk ($100k+). Qo'shimcha tekshiruv talab qilinishi mumkin.
                    </p>
                </div>
            )}
        </div>
    );
};
