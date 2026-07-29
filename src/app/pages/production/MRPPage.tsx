import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload, FileSpreadsheet, Package, AlertTriangle, CheckCircle2,
  ShoppingCart, Info, GitBranch, Search, Loader2, BarChart2, Factory
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDetailsStore, BOMResult } from '../../store/detailsStore';

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

const PRODUCTION_LINES = ['Liniya-A', 'Liniya-B', 'Liniya-C'];

export function MRPPage() {
    const [planData, setPlanData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadTime, setUploadTime] = useState<string | null>(null);
    const [materialNeeds, setMaterialNeeds] = useState<Record<string, number>>({});

    // BOM section state
    const [fatherCode, setFatherCode] = useState('');
    const [productionVolume, setProductionVolume] = useState(100);
    const [activeLine, setActiveLine] = useState('Liniya-A');
    const { bomResult, loading: bomLoading, error: bomError, fetchBOM, clearBOM } = useDetailsStore();

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
            if (bom) bom.forEach(item => { total[item.material] = (total[item.material] || 0) + (item.qty * qty); });
        });
        setMaterialNeeds(total);
    };

    const handleBOMSearch = async () => {
        if (!fatherCode.trim()) return;
        await fetchBOM(fatherCode.trim().toUpperCase(), productionVolume);
    };

    const statusColor = (s: string) =>
        s === 'OK' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : s === 'LOW' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

    const statusDot = (s: string) =>
        s === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
        : s === 'LOW' ? 'bg-amber-500'
        : 'bg-rose-500 animate-pulse';

    return (
        <div className="p-6 space-y-8">

            {/* ── PAGE HEADER ── */}
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
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
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

            {/* ── EXCEL TABLE + MATERIAL READINESS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                <div className="lg:col-span-6 bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                            <Info className="text-indigo-400 w-4 h-4" /> Reja Tafsilotlari
                        </h3>
                        <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-slate-800/50 rounded-md">{planData.length} qator</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    {['Vaqt', 'Liniya', 'Partiya', 'Detal Nomi', 'Miqdor', 'Holat'].map(h => (
                                        <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{h}</th>
                                    ))}
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

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-wider mb-4 flex items-center gap-2">
                            <Package className="text-indigo-400 w-4 h-4" /> Zaxira Tayyorgarligi
                        </h3>
                        <div className="space-y-4">
                            {['Liniya-A', 'Liniya-B', 'Liniya-C'].map((line) => {
                                const shortages = Object.entries(materialNeeds).some(([mat, need]) => need > (MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0));
                                return (
                                    <div key={line} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl relative overflow-hidden">
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
                                                            {!ok && <span className="bg-rose-500 text-white text-[9px] font-black px-1 rounded uppercase">-{(need - stock).toFixed(1)} kg</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {Object.keys(materialNeeds).length === 0 && <p className="text-[11px] text-slate-600 italic">Ma'lumot yo'q</p>}
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

                <div className="lg:col-span-10 bg-slate-900/30 border border-slate-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                        <h3 className="text-base font-black text-rose-400 uppercase italic tracking-wider flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Yetishmayotgan Materiallar (Purchase Requisition List)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/20">
                                    {['Material Nomi', 'Zaxirada', "Reja Bo'yicha", 'Defitsit', 'Action'].map(h => (
                                        <th key={h} className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{h}</th>
                                    ))}
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
                                                <td className="px-4 py-4"><span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded">{(need - stock).toFixed(1)} kg</span></td>
                                                <td className="px-4 py-4">
                                                    <button className="text-[10px] font-black text-indigo-400 uppercase italic hover:text-white border border-indigo-400/30 hover:bg-indigo-600 hover:border-indigo-600 px-3 py-1 rounded-lg transition-all">PR Yaratish</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                {Object.entries(materialNeeds).filter(([mat, need]) => (MOCK_INVENTORY[mat as keyof typeof MOCK_INVENTORY] || 0) < need).length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                                            <p className="text-sm font-bold uppercase italic text-emerald-400">Barcha materiallar yetarli</p>
                                        </div>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════
                FATHER-CHILD DETAIL BOM SECTION
            ════════════════════════════════════════════ */}
            <div className="border-t border-slate-800/60 pt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <GitBranch className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                            Detallar Bo'yicha <span className="text-violet-400">Reja</span>
                        </h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Ota Detal Kodi Asosida BOM Hisoblash</p>
                    </div>
                </div>

                {/* Search Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Ota Detal Kodi</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                                value={fatherCode}
                                onChange={(e) => setFatherCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleBOMSearch()}
                                placeholder="DOOR-PANEL-FL"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-bold uppercase tracking-widest text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Ishlab Chiqarish Hajmi (dona)</label>
                        <input
                            type="number" min={1} value={productionVolume}
                            onChange={(e) => setProductionVolume(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                        />
                    </div>
                    <div className="flex items-end gap-3">
                        <button
                            onClick={handleBOMSearch}
                            disabled={bomLoading || !fatherCode.trim()}
                            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black uppercase italic tracking-tight transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                        >
                            {bomLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart2 className="w-5 h-5" />}
                            Hisoblash
                        </button>
                        {bomResult && (
                            <button onClick={clearBOM} className="px-4 py-3.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl font-bold transition-all text-sm">
                                Tozalash
                            </button>
                        )}
                    </div>
                </div>

                {bomError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 font-bold text-sm mb-6">
                        <AlertTriangle className="w-5 h-5 shrink-0" /> {bomError}
                    </motion.div>
                )}

                <AnimatePresence>
                    {bomResult && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            {/* Summary Bar */}
                            <div className="p-5 bg-gradient-to-r from-violet-600/10 to-indigo-600/5 border border-violet-500/20 rounded-2xl flex flex-wrap gap-6 items-center">
                                {[
                                    { label: 'Ota Detal', value: bomResult.father_code, sub: bomResult.father_name, color: 'text-white' },
                                    { label: 'Ishlab Chiqarish', value: bomResult.production_volume.toLocaleString(), sub: 'dona', color: 'text-emerald-400' },
                                    { label: 'Jami Komponent', value: bomResult.items.length, sub: 'ta bola detal', color: 'text-indigo-400' },
                                    { label: 'Yetishmovchilik', value: bomResult.items.filter(i => i.status !== 'OK').length, sub: 'ta pozitsiya', color: bomResult.items.some(i => i.status !== 'OK') ? 'text-rose-400' : 'text-emerald-400' },
                                ].map((s, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <div className="h-10 w-px bg-slate-800" />}
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</div>
                                            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                                            <div className="text-[10px] text-slate-500 font-bold">{s.sub}</div>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Line Selector */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Factory className="text-slate-600 w-4 h-4" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Liniya:</span>
                                {PRODUCTION_LINES.map((line) => (
                                    <button key={line} onClick={() => setActiveLine(line)}
                                        className={`px-4 py-1.5 rounded-lg font-black text-xs uppercase italic transition-all ${activeLine === line ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white'}`}>
                                        {line}
                                    </button>
                                ))}
                            </div>

                            {/* BOM Table */}
                            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                                <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
                                        <Package className="text-violet-400 w-4 h-4" /> {activeLine} — Kerakli Bola Detallar
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 px-2 py-1 bg-slate-800 rounded-lg uppercase">{bomResult.items.length} ta pozitsiya</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 bg-slate-950/20">
                                                {['Kod', 'Bola Detal Nomi', 'Birlik', 'Qty/Dona', 'Kerak (jami)', 'Zaxirada', 'Yetishmovchilik', 'Holat'].map(h => (
                                                    <th key={h} className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/30">
                                            {bomResult.items.map((item) => (
                                                <tr key={item.child_id} className={`transition-colors ${item.status !== 'OK' ? 'hover:bg-rose-500/5' : 'hover:bg-white/5'}`}>
                                                    <td className="px-4 py-4">
                                                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded text-[10px] font-black border border-indigo-500/20">{item.child_code}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-bold text-white italic">{item.child_name}</td>
                                                    <td className="px-4 py-4 text-xs text-slate-400 uppercase font-bold">{item.unit}</td>
                                                    <td className="px-4 py-4 text-xs font-mono text-slate-300">{item.quantity_per_unit}</td>
                                                    <td className="px-4 py-4 text-sm font-black text-violet-300 font-mono">{item.required_quantity.toLocaleString()}</td>
                                                    <td className="px-4 py-4 text-sm font-mono text-emerald-400">{item.in_stock.toLocaleString()}</td>
                                                    <td className="px-4 py-4">
                                                        {item.shortage > 0
                                                            ? <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded">-{item.shortage.toLocaleString()} {item.unit}</span>
                                                            : <span className="text-xs text-slate-600">—</span>
                                                        }
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black uppercase w-fit ${statusColor(item.status)}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${statusDot(item.status)}`} />
                                                            {item.status === 'OK' ? 'Tayyor' : item.status === 'LOW' ? 'Kam' : 'Yetishmaslik'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {bomResult.items.length === 0 && (
                                                <tr><td colSpan={8} className="px-4 py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                                        <Package className="w-12 h-12" />
                                                        <p className="text-sm font-bold uppercase italic">Bu ota detal uchun bola detallar topilmadi</p>
                                                    </div>
                                                </td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Shortage Cards */}
                            {bomResult.items.some(i => i.status !== 'OK') && (
                                <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle className="text-rose-400 w-5 h-5" />
                                        <h4 className="text-sm font-black text-rose-400 uppercase italic">Yetishmovchilik Xulosasi — {activeLine}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {bomResult.items.filter(i => i.status !== 'OK').map((item) => (
                                            <div key={item.child_id} className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase">{item.child_code}</div>
                                                    <div className="text-xs font-bold text-white">{item.child_name}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-rose-400">-{item.shortage.toLocaleString()}</div>
                                                    <div className="text-[9px] text-slate-500 uppercase">{item.unit}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-4 w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-black uppercase italic transition-all active:scale-95 text-sm">
                                        <ShoppingCart className="w-4 h-4" />
                                        Barcha Yetishmovchiliklar Uchun Buyurtma Berish
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!bomResult && !bomLoading && !bomError && (
                    <div className="flex flex-col items-center justify-center py-16 opacity-20">
                        <GitBranch className="w-16 h-16 mb-4" />
                        <p className="text-sm font-bold uppercase italic">Ota detal kodini kiriting va hisoblang</p>
                    </div>
                )}
            </div>
        </div>
    );
}
