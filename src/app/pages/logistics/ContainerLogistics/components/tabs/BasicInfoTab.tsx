import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { MapPin, Truck, Calendar, Hash, Anchor } from 'lucide-react';

export const BasicInfoTab: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    const { register, formState: { errors }, setValue, watch } = useFormContext();

    const type = watch('type');
    const carrier = watch('carrier');
    const origin = watch('origin');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Konteyner Tipi
                        </Label>
                        {isEditMode ? (
                            <Select onValueChange={(val) => setValue('type', val)} defaultValue={type}>
                                <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 rounded-2xl p-6 h-auto text-white font-black italic">
                                    <SelectValue placeholder="Tanlang" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                    <SelectItem value="20' Dry">20' Dry</SelectItem>
                                    <SelectItem value="40' Dry">40' Dry</SelectItem>
                                    <SelectItem value="40' HC">40' HC</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-3">
                                <Hash size={18} className="text-indigo-400" />
                                <span className="text-sm font-black text-white italic uppercase">{type || '—'}</span>
                            </div>
                        )}
                        {errors.type && <p className="text-red-500 text-[10px] ml-2 font-bold uppercase italic italic">{errors.type.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Tashuvchi Kompaniya (Carrier)
                        </Label>
                        {isEditMode ? (
                            <Select onValueChange={(val) => setValue('carrier', val)} defaultValue={carrier}>
                                <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 rounded-2xl p-6 h-auto text-white font-black italic">
                                    <SelectValue placeholder="Tanlang" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                    <SelectItem value="MAERSK">MAERSK</SelectItem>
                                    <SelectItem value="MSC">MSC</SelectItem>
                                    <SelectItem value="HAPAG">HAPAG</SelectItem>
                                    <SelectItem value="CMA-CGM">CMA-CGM</SelectItem>
                                    <SelectItem value="EVERGREEN">EVERGREEN</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-3">
                                <Truck size={18} className="text-indigo-400" />
                                <span className="text-sm font-black text-white italic uppercase">{carrier || '—'}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Muhr (Seal) raqami
                        </Label>
                        <div className="relative group">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={18} />
                            <Input
                                {...register('seal')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                                placeholder="ML-2026-XXXXX"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Kelib chiqish porti
                        </Label>
                        <div className="relative group">
                            <Anchor className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={18} />
                            <Input
                                {...register('port')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 pl-12 pr-4 text-sm font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                                placeholder="Shanghai, Busan, etc..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                                Jo'natish sanasi
                            </Label>
                            <Input
                                type="date"
                                {...register('shipmentDate')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 px-4 text-sm font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                                ETA (Kutilgan kelish)
                            </Label>
                            <Input
                                type="date"
                                {...register('etaDate')}
                                disabled={!isEditMode}
                                className="w-full bg-slate-900/50 border-slate-800 rounded-2xl py-6 px-4 text-sm font-black text-white italic focus:border-indigo-500 disabled:opacity-100 disabled:bg-slate-900/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">
                            Mamlakat
                        </Label>
                        {isEditMode ? (
                            <Select onValueChange={(val) => setValue('origin', val)} defaultValue={origin}>
                                <SelectTrigger className="w-full bg-slate-900/50 border-slate-800 rounded-2xl p-6 h-auto text-white font-black italic">
                                    <SelectValue placeholder="Tanlang" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                    <SelectItem value="Xitoy">Xitoy</SelectItem>
                                    <SelectItem value="Janubiy Koreya">Janubiy Koreya</SelectItem>
                                    <SelectItem value="Germaniya">Germaniya</SelectItem>
                                    <SelectItem value="Rossiya">Rossiya</SelectItem>
                                    <SelectItem value="Turkiya">Turkiya</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl flex items-center gap-3">
                                <MapPin size={18} className="text-indigo-400" />
                                <span className="text-sm font-black text-white italic uppercase">{origin || '—'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">📦 Materiallar Ro'yxati</h4>
                    {isEditMode && (
                        <button type="button" className="text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase italic">+ Yangi qo'shish</button>
                    )}
                </div>
                <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 border-b border-slate-800/50 uppercase font-black tracking-tighter">
                            <tr>
                                <th className="p-3">Material</th>
                                <th className="p-3 text-right">Miqdor (kg)</th>
                                <th className="p-3 text-right">Narxi (USD)</th>
                                {isEditMode && <th className="p-3"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30 text-white font-bold italic">
                            <tr>
                                <td className="p-3 uppercase">ABS Granula (Natural)</td>
                                <td className="p-3 text-right font-mono">12,000</td>
                                <td className="p-3 text-right font-mono">$24,500</td>
                                {isEditMode && <td className="p-3"></td>}
                            </tr>
                            <tr>
                                <td className="p-3 uppercase">ABS Granula (Black)</td>
                                <td className="p-3 text-right font-mono">4,500</td>
                                <td className="p-3 text-right font-mono">$9,200</td>
                                {isEditMode && <td className="p-3"></td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
