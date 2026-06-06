import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Package, AlertTriangle, CheckCircle2, ShoppingCart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_BOM: Record<string, { material: string, qty: number, unit: string, moldId: string }[]> = {
    'DOOR-PANEL-FL': [
        { material: 'Polimer ABS', qty: 2.5, unit: 'kg', moldId: 'MOLD-001' },
        { material: 'Rang-Qora', qty: 15, unit: 'g', moldId: 'MOLD-001' }
    ],
    'DASHBOARD-COVER': [
        { material: 'Polimer PP', qty: 4.2, unit: 'kg', moldId: 'MOLD-042' },
        { material: 'Rang-Kulrang', qty: 20, unit: 'g', moldId: 'MOLD-042' }
    ],
    'GLOVE-BOX': [
        { material: 'Polimer ABS', qty: 1.2, unit: 'kg', moldId: 'MOLD-015' },
        { material: 'Rang-Qora', qty: 8, unit: 'g', moldId: 'MOLD-015' }
    ]
};

const MOCK_INVENTORY = {
    'Polimer ABS': 850,
    'Polimer PP': 1200,
    'Rang-Qora': 890,
    'Rang-Kulrang': 320,
    'Rang-Qizil': 45
};

export function MRPPage() {
    const [planData, setPlanData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadTime, setUploadTime] = useState<string | null>(null);
    const [materialNeeds, setMaterialNeeds] = useState<Record<string, number>>({});

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setUploadTime(new Date().toLocaleString());

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setPlanData(data);
            calculateNeeds(data);
        };
        reader.readAsBinaryString(file);
    };

    const calculateNeeds = (data: any[]) => {
        const total: Record<string, number> = {};
        data.forEach((row: any) => {
            const partName = row['Detal nomi'] || '';
            const qty = Number(row['Miqdor (dona)']) || 0;
            const bom = MOCK_BOM[partName as keyof typeof MOCK_BOM];
            if (bom) {
                bom.forEach(item => {
                    total[item.material] = (total[item.material] || 0) + (item.qty * qty);
                });
            }
        });
        setMaterialNeeds(total);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">MRP — Material Requirements Planning</h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">UzAuto Excel Rejasi Asosida</p>
                </div>

                <div className="flex items-center gap-4">
                    <label className="relative group cursor-pointer inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        <Upload className="w-5 h-5" />
                        <span className="font-bold uppercase italic text-sm tracking-tight">Excel yuklash</span>
                        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
                    </label>

                    {fileName && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3"
                        >
                            <FileSpreadsheet className="text-emerald-400 w-5 h-5" />
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Oxirgi yuklangan fayl</p>
                                <p className="text-white text-xs font-bold italic">{fileName}</p>
                            </div>
                            <div className="h-6 w-px bg-slate-800 mx-1" />
                            <p className="text-[10px] font-bold text-slate-500">{uploadTime?.split(', ')[1]}</p>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                {/* Left Section: Plan Table */}
                <div className="lg:col-span-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                            <Info className="text-indigo-400 w-4 h-4" />
                            Reja Tafsilotlari
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-800/50 rounded-md">
                            {planData.length} qator
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Vaqt</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Liniya</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Partiya</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Detal Nomi</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Miqdor</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Holat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {planData.length > 0 ? planData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 text-[12px] font-mono text-indigo-400">{row['Vaqt (soat)'] || '08:00'}</td>
                                        <td className="px-4 py-3 text-[12px] font-bold text-slate-300">LINE-{row['Liniya'] || 'A'}</td>
                                        <td className="px-4 py-3 text-[11px] font-bold text-slate-500">{row['Position kodi'] || '--'}</td>
                                        <td className="px-4 py-3 text-[12px] font-bold text-white italic">{row['Detal nomi'] || 'Kiritilmagan'}</td>
                                        <td className="px-4 py-3 text-[12px] font-black text-emerald-400">{row['Miqdor (dona)'] || 0}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Tayyor</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <FileSpreadsheet className="w-12 h-12" />
                                                <p className="text-sm font-bold uppercase italic">Reja yuklanmagan</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Section: Material Readiness */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                            <Package className="text-indigo-400 w-4 h-4" />
                            Zaxira Tayyorgarligi
                        </h3>
                        <div className="space-y-4">
                            {['Liniya-A', 'Liniya-B', 'Liniya-C'].map((line) => {
                                const shortages = Object.entries(materialNeeds).some(([mat, need]) => need > (MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0));
                                return (
                                    <div key={line} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl relative overflow-hidden group">
                                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${shortages ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${shortages ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                                <span className="text-sm font-black text-white uppercase italic">{line}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${shortages ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                {shortages ? 'YETISHMOVCHILIK' : 'TAYYOR'}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(materialNeeds).map(([mat, need]) => {
                                                const stock = MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0;
                                                const ok = stock >= need;
                                                return (
                                                    <div key={mat} className="flex items-center justify-between text-[11px]">
                                                        <span className="text-slate-400 font-bold">{mat}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-500 font-mono">{need.toFixed(1)} / {stock} kg</span>
                                                            {!ok && (
                                                                <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded uppercase">-{(need - stock).toFixed(1)} kg</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {Object.keys(materialNeeds).length === 0 && (
                                                <p className="text-[11px] text-slate-600 italic">Ma'lumot yo'q</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-3 transition-all active:scale-95 group">
                        <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="font-black uppercase italic tracking-tighter">Barcha PR larni yaratish</span>
                    </button>
                </div>

                {/* Bottom Section: Purchase Requisitions */}
                <div className="lg:col-span-10 bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                        <h3 className="text-base font-black text-rose-400 uppercase italic tracking-wider flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Yetishmayotgan Materiallar (Purchase Requisition List)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/20">
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Material Nomi</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Zaxirada</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Reja Bo'yicha</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Defitsit</th>
                                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {Object.entries(materialNeeds)
                                    .filter(([mat, need]) => (MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0) < need)
                                    .map(([mat, need]) => {
                                        const stock = MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0;
                                        return (
                                            <tr key={mat} className="hover:bg-rose-500/5 transition-colors">
                                                <td className="px-4 py-4 text-xs font-bold text-white uppercase">{mat}</td>
                                                <td className="px-4 py-4 text-xs font-mono text-slate-400">{stock} kg</td>
                                                <td className="px-4 py-4 text-xs font-mono text-emerald-400">{need.toFixed(1)} kg</td>
                                                <td className="px-4 py-4">
                                                    <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded">{(need - stock).toFixed(1)} kg</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button className="text-[10px] font-black text-indigo-400 uppercase italic hover:text-white border border-indigo-400/30 hover:bg-indigo-600 hover:border-indigo-600 px-3 py-1 rounded-lg transition-all">
                                                        PR Yaratish
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {Object.entries(materialNeeds).filter(([mat, need]) => (MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0) < need).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                                <p className="text-sm font-bold uppercase italic text-emerald-400">Barcha materiallar yetarli</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
