import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDailyProductionPlan, Shift, PlanRow, ProductOption } from '../../context/DailyProductionPlanContext';
import { useFactory } from '../../context/FactoryContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import {
    Plus, Trash2, ArrowLeft, AlertTriangle, Search,
    Clock, ChevronRight, BarChart3, Layers, ShieldCheck,
    CheckCircle2, XCircle, Truck, Zap, Factory, PackagePlus,
    Eye, BellRing, Info, Activity, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// ── Part Catalog ─────────────────────────────────────────────────────────────
const PART_CATALOG: { partNo: string; name: string; icon: string; line: string; sub?: string }[] = [
    { partNo: 'DT-COBALT-FRH', name: 'Cobalt Door Trim Front RH', icon: '🚪', line: 'door-trim', sub: 'Front RH/LH' },
    { partNo: 'DT-COBALT-FLH', name: 'Cobalt Door Trim Front LH', icon: '🚪', line: 'door-trim', sub: 'Front RH/LH' },
    { partNo: 'DT-COBALT-RRH', name: 'Cobalt Door Trim Rear RH', icon: '🚪', line: 'door-trim', sub: 'Rear RH/LH' },
    { partNo: 'DT-COBALT-RLH', name: 'Cobalt Door Trim Rear LH', icon: '🚪', line: 'door-trim', sub: 'Rear RH/LH' },
    { partNo: 'DT-ONYX-FRH', name: 'Onyx Door Trim Front RH', icon: '⬛', line: 'door-trim', sub: 'Front RH/LH' },
    { partNo: 'DT-ONYX-FLH', name: 'Onyx Door Trim Front LH', icon: '⬛', line: 'door-trim', sub: 'Front RH/LH' },
    { partNo: 'DT-ONYX-RRH', name: 'Onyx Door Trim Rear RH', icon: '⬛', line: 'door-trim', sub: 'Rear RH/LH' },
    { partNo: 'DT-ONYX-RLH', name: 'Onyx Door Trim Rear LH', icon: '⬛', line: 'door-trim', sub: 'Rear RH/LH' },
    { partNo: 'CON-STD-001', name: 'Console Base Standard', icon: '🎛️', line: 'console', sub: 'Base' },
    { partNo: 'CON-STD-002', name: 'Console Armrest Pad', icon: '🎛️', line: 'console', sub: 'Base' },
    { partNo: 'CON-PRE-001', name: 'Console Premium Cover', icon: '✨', line: 'console', sub: 'Premium' },
    { partNo: 'CON-USB-001', name: 'USB Hub Bezel Assembly', icon: '🔌', line: 'console', sub: 'Electro' },
    { partNo: 'PP-A-PILLAR-RH', name: 'A-Pillar Trim RH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
    { partNo: 'PP-A-PILLAR-LH', name: 'A-Pillar Trim LH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
    { partNo: 'PP-B-PILLAR-RH', name: 'B-Pillar Trim RH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
    { partNo: 'PP-B-PILLAR-LH', name: 'B-Pillar Trim LH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
    { partNo: 'PP-DASH-UPPER', name: 'Dashboard Upper Trim', icon: '🖤', line: 'plastic', sub: 'Dashboard' },
    { partNo: 'PP-DASH-LOWER', name: 'Dashboard Lower Trim', icon: '🤍', line: 'plastic', sub: 'Dashboard' },
    { partNo: 'MIDNIGHT-BASE', name: 'MIDNIGHT Base Assembly', icon: '🌑', line: 'assembly', sub: 'MIDNIGHT' },
    { partNo: 'MIDNIGHT-A', name: 'MIDNIGHT Panel A', icon: '🟫', line: 'assembly', sub: 'MIDNIGHT' },
    { partNo: 'URBAN-BASE', name: 'URBAN Base Assembly', icon: '🏙️', line: 'assembly', sub: 'URBAN' },
    { partNo: 'URBAN-A', name: 'URBAN Trim A', icon: '🔷', line: 'assembly', sub: 'URBAN' },
    { partNo: 'CUSTOM-001', name: 'Custom Build Unit 001', icon: '🛠️', line: 'general' },
    { partNo: 'CUSTOM-002', name: 'Custom Build Unit 002', icon: '⚡', line: 'general' },
];

// ── BOM Data ─────────────────────────────────────────────────────────────────
type BomItem = { partId: string; name: string; icon: string; qtyPerUnit: number; bin?: string; supplier?: string; leadDays?: number };
const LINE_BOMS: Record<string, BomItem[]> = {
    'door-trim': [
        { partId: 'RM-FABRIC-01', name: 'Automotive Fabric (Gray)', icon: '🧵', qtyPerUnit: 1.2, bin: 'T-001', supplier: 'FabriTex AG', leadDays: 4 },
        { partId: 'RM-FOAM-01', name: 'PU Foam Sheet 10mm', icon: '🟨', qtyPerUnit: 0.8, bin: 'T-002', supplier: 'FoamFlex GmbH', leadDays: 2 },
        { partId: 'HW-CLIP-DT', name: 'Door Clip Set (12pcs)', icon: '📎', qtyPerUnit: 12, bin: 'A-101', supplier: 'ClipFast Ltd', leadDays: 1 },
        { partId: 'HW-SCREW-M4', name: 'M4 Torx Screws', icon: '⚙️', qtyPerUnit: 16, bin: 'B-202', supplier: 'HardCo Supply', leadDays: 1 },
        { partId: 'PP-BASE-DT', name: 'PP Base Substrate', icon: '🔲', qtyPerUnit: 2, bin: 'C-401', supplier: 'PolyMat Chem.', leadDays: 5 },
    ],
    'console': [
        { partId: 'RM-LEATHER-01', name: 'PU Leather (Black)', icon: '🖤', qtyPerUnit: 0.6, bin: 'T-010', supplier: 'LuxLeather KG', leadDays: 3 },
        { partId: 'RM-ABS-01', name: 'ABS Plastic Granules', icon: '🧪', qtyPerUnit: 1.5, bin: 'S-001', supplier: 'PolyMat Chem.', leadDays: 5 },
        { partId: 'HW-USB-ASSY', name: 'USB Hub Assembly', icon: '🔌', qtyPerUnit: 1, bin: 'E-001', supplier: 'ElectroParts', leadDays: 7 },
    ],
    'plastic': [
        { partId: 'RM-PP-01', name: 'Polypropylene Granules', icon: '🧪', qtyPerUnit: 3.0, bin: 'S-001', supplier: 'PolyMat Chem.', leadDays: 5 },
        { partId: 'RM-MB-BLACK', name: 'Masterbatch Black', icon: '🎨', qtyPerUnit: 0.3, bin: 'S-002', supplier: 'ColorTech GmbH', leadDays: 3 },
        { partId: 'HW-CLIP-PP', name: 'Plastic Push-Pins (20pcs)', icon: '📍', qtyPerUnit: 20, bin: 'A-103', supplier: 'ClipFast Ltd', leadDays: 1 },
    ],
};
const DEFAULT_BOM: BomItem[] = [
    { partId: 'RM-001', name: 'Polypropylene Granules', icon: '🧪', qtyPerUnit: 4, bin: 'Silo-01', supplier: 'PolyMat Chem.', leadDays: 5 },
    { partId: 'HW-GEN-01', name: 'General Hardware Kit', icon: '🔧', qtyPerUnit: 10, bin: 'A-999', supplier: 'HardCo Supply', leadDays: 1 },
];

// ── QC Checklists ─────────────────────────────────────────────────────────────
const QC_CHECKLISTS: Record<string, { check: string; standard: string; method: string }[]> = {
    'door-trim': [
        { check: 'Surface flatness', standard: '≤ 0.5mm deviation', method: 'CMM Probe' },
        { check: 'Fabric adhesion pull', standard: '≥ 25N force', method: 'Pull Test Jig' },
        { check: 'Clip retention torque', standard: '3–5 Nm', method: 'Torque Wrench' },
        { check: 'Color match (visual)', standard: 'RAL 7016 ± 2ΔE', method: 'Spectrophotometer' },
        { check: 'Gap & flush to door', standard: '≤ 1.0mm', method: 'Feeler Gauge' },
        { check: 'Squeak & rattle test', standard: 'No noise @ 20Hz–200Hz', method: 'Vibration Rig' },
    ],
    'console': [
        { check: 'Leather stitch quality', standard: '8 stitches/cm', method: 'Visual + Gauge' },
        { check: 'USB retention force', standard: '5–15N insertion', method: 'Force Gauge' },
        { check: 'Surface hardness', standard: '70–80 Shore A', method: 'Durometer' },
        { check: 'Lid hinge torque', standard: '0.5–1.5 Nm', method: 'Torque Wrench' },
    ],
    'plastic': [
        { check: 'Surface gloss level', standard: '60–80 GU @ 60°', method: 'Gloss Meter' },
        { check: 'Sink marks / voids', standard: 'Zero visible', method: 'Visual Inspection' },
        { check: 'Warpage flatness', standard: '≤ 1.5mm over 500mm', method: 'Surface Plate' },
        { check: 'Wall thickness', standard: '2.8–3.2mm', method: 'Ultrasonic Probe' },
        { check: 'Color delta-E', standard: 'ΔE ≤ 1.5', method: 'Spectrophotometer' },
    ],
};
const DEFAULT_QC = [
    { check: 'Dimensional accuracy', standard: '± 0.5mm', method: 'CMM Probe' },
    { check: 'Visual surface quality', standard: 'No defects class A', method: 'Visual Inspection' },
    { check: 'Assembly torque', standard: '2–4 Nm', method: 'Torque Wrench' },
];

const mockStock: Record<string, number> = {
    'RM-FABRIC-01': 500, 'RM-FOAM-01': 300, 'HW-CLIP-DT': 8000, 'HW-SCREW-M4': 50000,
    'PP-BASE-DT': 200, 'RM-LEATHER-01': 100, 'RM-ABS-01': 800, 'HW-USB-ASSY': 30,
    'RM-PP-01': 5000, 'RM-MB-BLACK': 400, 'HW-CLIP-PP': 15000,
    'RM-001': 15000, 'HW-GEN-01': 5000,
};

// ── Helpers: line key from line name ─────────────────────────────────────────
function lineKey(name: string): string {
    if (/door/i.test(name)) return 'door-trim';
    if (/console/i.test(name)) return 'console';
    if (/plastic/i.test(name)) return 'plastic';
    return 'assembly';
}

// ── Part Search Grid ─────────────────────────────────────────────────────────
function PartSearchGrid({ value, onChange, lineKey }: { value: string; onChange: (v: string) => void; lineKey: string }) {
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(false);
    const lp = PART_CATALOG.filter(p => p.line === lineKey);
    const others = PART_CATALOG.filter(p => p.line !== lineKey);
    const all = [...lp, ...others];
    const filtered = q ? all.filter(p => p.partNo.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())) : all;
    const groups = filtered.reduce((acc, p) => {
        const k = p.sub || 'General';
        if (!acc[k]) acc[k] = [];
        acc[k].push(p);
        return acc;
    }, {} as Record<string, typeof filtered>);
    const sel = PART_CATALOG.find(p => p.partNo === value);

    return (
        <div className="relative font-mono">
            <div onClick={() => setOpen(true)} className="flex items-center gap-3 px-4 h-12 rounded-xl border border-slate-700 bg-slate-900 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800 transition-all shadow-inner">
                {sel ? (<><span className="text-base shrink-0">{sel.icon}</span><div className="flex-1 min-w-0"><p className="text-sm font-black text-slate-200 truncate">{sel.partNo}</p><p className="text-[10px] text-slate-500 truncate">{sel.name}</p></div></>) :
                    (<><Search className="w-4 h-4 text-slate-500" /><span className="text-sm text-slate-500">Search {PART_CATALOG.length}+ parts…</span></>)}
            </div>
            {open && (<>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute z-50 mt-2 w-full min-w-[400px] rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-black/60">
                    <div className="p-3 border-b border-slate-800 bg-slate-950">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700">
                            <Search className="w-4 h-4 text-cyan-500 shrink-0" />
                            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${PART_CATALOG.length}+ parts...`} className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600 font-medium" />
                            {q && <button onClick={() => setQ('')} className="text-slate-500 hover:text-white text-xs">✕</button>}
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto bg-slate-950 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700">
                        {Object.entries(groups).map(([group, parts]) => (
                            <div key={group}>
                                <p className="px-4 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-900/80 sticky top-0">{group}</p>
                                {parts.map(p => (
                                    <button key={p.partNo} type="button" onClick={() => { onChange(p.partNo); setOpen(false); setQ(''); }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-all ${value === p.partNo ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : ''}`}>
                                        <span className="text-xl leading-none shrink-0">{p.icon}</span>
                                        <div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-200 truncate">{p.partNo}</p><p className="text-[10px] text-slate-500 truncate">{p.name}</p></div>
                                        {p.line === lineKey && <span className="text-[8px] text-cyan-400 font-black bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded shrink-0">THIS LINE</span>}
                                    </button>
                                ))}
                            </div>
                        ))}
                        {!filtered.length && <p className="text-center text-xs text-slate-600 py-8">No parts found</p>}
                    </div>
                </div>
            </>)}
        </div>
    );
}

// ── Tab 1: Schedule ───────────────────────────────────────────────────────────
function TabSchedule({ rows, addRow, removeRow, updateRow, totalReja, lk, taktTime = 2.0 }: {
    rows: PlanRow[]; addRow: () => void; removeRow: (id: string) => void;
    updateRow: (id: string, f: keyof PlanRow, v: string | number | undefined) => void;
    totalReja: number; lk: string; taktTime?: number;
}) {
    return (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl font-mono">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Production Schedule Matrix</h3>
                    <p className="text-xs text-slate-500 mt-1">Assign part numbers and target quantities per shift cycle.</p>
                </div>
                <Button type="button" onClick={addRow} className="bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 h-10 px-5 rounded-xl font-black tracking-widest text-[11px] uppercase flex items-center gap-2 transition-all">
                    <Plus className="w-4 h-4" /> ADD ROW
                </Button>
            </div>
            <div className="grid grid-cols-[36px_1fr_120px_100px_48px] gap-4 px-3 pb-3 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <span className="text-center">#</span><span>Part Definition</span><span className="text-center">REJA (Qty)</span><span className="text-center">Time (min)</span><span></span>
            </div>
            <div className="space-y-3">
                {rows.map((row, idx) => (
                    <div key={row.id} className="grid grid-cols-[36px_1fr_120px_100px_48px] gap-4 items-center p-2 rounded-xl hover:bg-slate-900/70 border border-transparent hover:border-slate-800 transition-all">
                        <span className="text-xs text-slate-500 font-mono font-black text-center bg-slate-900 w-8 h-8 rounded-lg flex items-center justify-center border border-slate-800">{String(idx + 1).padStart(2, '0')}</span>
                        <PartSearchGrid value={row.partNo} onChange={v => updateRow(row.id, 'partNo', v)} lineKey={lk} />
                        <Input type="number" min="1" required value={row.reja || ''} onChange={e => updateRow(row.id, 'reja', parseFloat(e.target.value) || 0)}
                            className="h-12 bg-slate-900 border-slate-700 text-cyan-300 text-center font-black font-mono text-base rounded-xl shadow-inner focus:ring-1 focus:ring-cyan-500" />
                        <div className="h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center shadow-inner">
                            <span className="text-sm font-black font-mono text-amber-400">{Math.round((row.reja || 0) * taktTime)}</span>
                        </div>
                        {rows.length > 1
                            ? <button type="button" onClick={() => removeRow(row.id)} className="h-12 rounded-xl flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"><Trash2 className="w-4 h-4" /></button>
                            : <div className="h-12" />}
                    </div>
                ))}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-800 flex justify-end items-center gap-5">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total REJA:</span>
                <span className="text-3xl font-black font-mono text-cyan-400">{totalReja.toLocaleString()}</span>
                <span className="text-slate-600 text-sm font-bold">UNITS</span>
            </div>
        </div>
    );
}

// ── Tab 2: Logistics ──────────────────────────────────────────────────────────
function TabLogistics({ bom, totalReja }: { bom: BomItem[]; totalReja: number }) {
    return (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-mono">
            <div className="grid grid-cols-[1fr_60px_70px_80px_100px_90px_140px] gap-3 px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 bg-slate-950/70">
                <span>Component</span><span className="text-right">Req</span><span className="text-right">A.Stock</span>
                <span className="text-right">Safety</span><span className="text-center">Delta Left</span><span className="text-center">Status</span><span className="text-center">Auto-Action</span>
            </div>
            {bom.map((item, i) => {
                const req = item.qtyPerUnit * totalReja;
                const stock = mockStock[item.partId] ?? 0;
                const short = req > stock;
                const safety = Math.round(item.qtyPerUnit * 500) || 50;
                const delta = stock - req;
                return (
                    <div key={item.partId} className={`grid grid-cols-[1fr_60px_70px_80px_100px_90px_140px] gap-3 items-center px-5 py-3 border-b border-slate-800/50 ${short ? 'bg-red-950/40 border-l-2 border-l-red-500' : delta <= safety ? 'bg-orange-950/20' : i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-lg bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50 leading-none shrink-0">{item.icon}</span>
                            <div className="min-w-0"><p className="text-sm font-black text-slate-100 truncate">{item.name}</p><p className="text-[10px] font-mono text-cyan-500/60">{item.partId}</p></div>
                        </div>
                        <div className={`text-right text-sm font-mono font-black ${short ? 'text-red-400' : 'text-slate-300'}`}>{req.toLocaleString()}</div>
                        <div className={`text-right text-sm font-mono ${stock <= safety ? 'text-orange-400 font-bold' : 'text-emerald-400'}`}>{stock.toLocaleString()}</div>
                        <div className="text-right text-xs font-mono text-slate-500 mt-0.5">{safety.toLocaleString()}</div>
                        <div className="flex justify-center">
                            <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${short ? 'bg-red-500/20 text-red-400' : delta <= safety ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                                {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-center">
                            {short
                                ? <span className="flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> SHORT</span>
                                : <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> READY</span>}
                        </div>
                        <div className="flex justify-center">
                            {(short || delta <= safety) ? (
                                <span className={`flex items-center justify-center gap-1.5 px-3 py-1.5 w-full rounded-lg text-[9px] font-black tracking-wider border ${short ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                                    <Zap className="w-3 h-3 shrink-0" /> To'ldirish
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-600 font-black">—</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Tab 3: Quality ────────────────────────────────────────────────────────────
function TabQuality({ lk, lineName, passed, setPassed, acked, setAcked, checks }: { lk: string; lineName: string; passed: Record<number, boolean>; setPassed: React.Dispatch<React.SetStateAction<Record<number, boolean>>>; acked: Record<number, boolean>; setAcked: React.Dispatch<React.SetStateAction<Record<number, boolean>>>; checks: { check: string; standard: string; method: string }[] }) {
    const allPassed = checks.every((_, i) => passed[i]);
    const [sopModal, setSopModal] = useState<{ idx: number, check: string, std: string, method: string } | null>(null);

    return (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-mono relative">
            {sopModal && (
                <div className="absolute inset-0 bg-slate-950/90 z-10 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-6 w-full max-w-md relative">
                        <button onClick={() => setSopModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
                        <div className="flex items-center gap-3 mb-4">
                            <Info className="w-6 h-6 text-cyan-400" />
                            <h3 className="text-lg font-black text-white">{sopModal.check} SOP</h3>
                        </div>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-4 flex items-center justify-center overflow-hidden h-32 relative group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80')] bg-cover bg-center opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity" />
                            <div className="relative z-10 bg-slate-900/80 px-4 py-2 rounded border border-slate-700 backdrop-blur text-center">
                                <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">{sopModal.method}</p>
                                <p className="text-sm font-bold text-white mt-1">{sopModal.std}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="text-xs text-slate-400 font-sans leading-relaxed">
                                <strong>Operator Instructions:</strong> Visually inspect the component along the defined contour. Use the calibrated gauge to verify tolerance does not exceed limits. Document any deviation on the QC terminal log.
                            </div>
                        </div>
                        <Button onClick={() => { setAcked(p => ({ ...p, [sopModal.idx]: true })); setSopModal(null); }} className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black tracking-widest text-xs h-10 rounded-xl transition-all">ACKNOWLEDGE & CLOSE</Button>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-800 bg-slate-950/70">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">QC Checklist — {lineName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">All items must pass before plan execution.</p>
                </div>
                <div className="ml-auto">
                    {allPassed
                        ? <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full">✅ ALL PASSED</span>
                        : <span className="text-[10px] font-black text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">{Object.values(passed).filter(Boolean).length}/{checks.length} DONE</span>}
                </div>
            </div>
            <div className="grid grid-cols-[28px_1fr_180px_150px_40px] gap-4 px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 bg-slate-950/50">
                <span></span><span>Check Item</span><span>Standard</span><span>Method</span><span className="text-center">SOP</span>
            </div>
            {checks.map((c, i) => (
                <div key={i} className={`grid grid-cols-[28px_1fr_180px_150px_40px] gap-4 items-center px-6 py-4 border-b border-slate-800/50 transition-colors ${passed[i] ? 'bg-emerald-950/20' : i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                    <button type="button" onClick={() => setPassed(p => ({ ...p, [i]: !p[i] }))}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${passed[i] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600 hover:border-emerald-500'}`}>
                        {passed[i] && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <p className={`text-sm font-bold ${passed[i] ? 'text-emerald-400 line-through decoration-emerald-700' : 'text-slate-200'}`}>{c.check}</p>
                    <span className="text-xs font-mono text-slate-400">{c.standard}</span>
                    <span className="text-xs text-slate-500 italic">{c.method}</span>
                    <button
                        type="button"
                        onClick={() => setSopModal({ idx: i, check: c.check, std: c.standard, method: c.method })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${acked[i] ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white hover:border-cyan-500'}`}
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type TabId = 'schedule' | 'logistics' | 'quality';

export function OperatorLinePlanPage() {
    const navigate = useNavigate();
    const { lineId } = useParams<{ lineId: string }>();
    const { productionLines } = useFactory();
    const { createLinePlan, getTodayLinePlan, updateLinePlan } = useDailyProductionPlan();
    const { addMaterialRequest } = useWarehouse();
    const { updateMaterialQuantity } = useFactory();

    const line = productionLines.find(l => l.id === lineId);
    const today = new Date().toISOString().split('T')[0];
    const formattedDate = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const existingPlan = lineId ? getTodayLinePlan(lineId) : undefined;
    const lk = lineKey(line?.name || '');

    const [shift, setShift] = useState<Shift>(existingPlan?.shift || '1-smena');
    const [rows, setRows] = useState<PlanRow[]>(
        existingPlan?.rows.length ? existingPlan.rows : [{ id: '1', partNo: '', reja: 100 }]
    );
    const [activeTab, setActiveTab] = useState<TabId>('schedule');
    const [qcPassedItems, setQcPassedItems] = useState<Record<number, boolean>>({});
    const [sopAckedItems, setSopAckedItems] = useState<Record<number, boolean>>({});

    const addRow = () => setRows(p => [...p, { id: Date.now().toString(), partNo: '', reja: 0 }]);
    const removeRow = (id: string) => { if (rows.length > 1) setRows(p => p.filter(r => r.id !== id)); };
    const updateRow = (id: string, field: keyof PlanRow, value: string | number | undefined) =>
        setRows(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));

    const totalReja = rows.reduce((s, r) => s + (r.reja || 0), 0);
    const bom = LINE_BOMS[lk] || DEFAULT_BOM;
    const checks = QC_CHECKLISTS[lk] || DEFAULT_QC;
    const allQcPassed = checks.every((_, i) => qcPassedItems[i]);
    const allSopsAcked = checks.every((_, i) => sopAckedItems[i]);

    const bomWithStatus = useMemo(() =>
        bom.map(item => {
            const req = item.qtyPerUnit * totalReja;
            const stock = mockStock[item.partId] ?? 0;
            return { ...item, req, stock, short: req > stock };
        }), [bom, totalReja]);

    const hasCriticalShortage = bomWithStatus.some(b => b.short);
    const readinessPct = bomWithStatus.length > 0 ? Math.round(bomWithStatus.filter(b => !b.short).length / bomWithStatus.length * 100) : 100;
    const SHIFT_CAP = 710;
    const TAKT_TIME = 2.0;
    const requiredMin = Math.round(totalReja * TAKT_TIME);
    const shiftPct = Math.min(Math.round((requiredMin / SHIFT_CAP) * 100), 100);
    const excess = requiredMin > SHIFT_CAP;
    const [startH, endH] = shift === '1-smena' ? ['08:00', '19:50'] : ['20:00', '07:50'];
    const backPath = '/production-lines/operator-plans';

    if (!line) {
        return (
            <div className="min-h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400">
                <Factory className="w-16 h-16 text-slate-700 mb-4" />
                <p className="text-xl font-bold">Line not found</p>
                <button onClick={() => navigate(backPath)} className="mt-6 text-cyan-400 hover:text-white font-bold flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (hasCriticalShortage) { toast.error('Material shortage detected!'); return; }
        const invalid = rows.filter(r => !r.partNo.trim() || r.reja <= 0);
        if (invalid.length) { toast.error("Fill all rows."); return; }

        if (!existingPlan) {
            addMaterialRequest(`MES-PLAN ${line.name} Q:${totalReja} | BATCH-${Math.floor(Math.random() * 90000) + 10000}`,
                bom.map(rm => ({ id: `ri-${rm.partId}-${Date.now()}`, name: rm.name, partNumber: rm.partId, requiredQty: rm.qtyPerUnit * totalReja, currentStock: mockStock[rm.partId] ?? 0, binLocation: rm.bin })),
                'High', 'Line Replenishment', line.name);
            toast('WMS Sync → ActiveOps', { description: `${line.name} batch dispatched.`, icon: '🔗' });
        }

        const payloadRows = rows.map(r => ({ id: r.id, partNo: r.partNo.trim(), reja: r.reja }));
        if (existingPlan) {
            updateLinePlan(today, line.id, { shift, productOption: 'MIDNIGHT', rows: payloadRows });
            toast.success('Plan yangilandi.', { description: 'Generating Warehouse Picking List...' });
        } else {
            createLinePlan({ date: today, lineId: line.id, lineName: line.name, shift, productOption: 'MIDNIGHT', productName: line.name, rows: payloadRows });
            toast('Digital Signature Logged', { description: 'Secured via Operator ID', icon: '📝' });
            toast.success(`${line.name} Target Posted!`, { description: 'Dashboard updated and material picking list dispatched to warehouse queue.' });
        }
        navigate(backPath);
    };

    const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: string; badgeDanger?: boolean }[] = [
        { id: 'schedule', label: 'Production Schedule', icon: Layers, badge: `${rows.length} rows` },
        { id: 'logistics', label: 'Logistics & BOM', icon: PackagePlus, badge: hasCriticalShortage ? 'SHORTAGE' : `${readinessPct}%`, badgeDanger: hasCriticalShortage },
        { id: 'quality', label: 'Quality Standards', icon: ShieldCheck },
    ];

    return (
        <div className="min-h-full bg-slate-950 text-slate-300 animate-in fade-in slide-in-from-bottom-3 duration-400">

            {/* Sticky Config + Tab Bar */}
            <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-lg">
                <div className="px-6 md:px-10 py-3 flex items-center gap-4 flex-wrap">
                    <button onClick={() => navigate(backPath)} className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <Badge variant="outline" className="text-[10px] px-2.5 py-1 font-mono font-bold bg-cyan-500/10 text-cyan-400 border-cyan-500/40">SAP MES: ZPP_OPLAN02</Badge>
                    <Badge variant="outline" className="text-[10px] px-2.5 py-1 font-mono font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/40">ONLINE</Badge>
                    <div className="h-5 w-px bg-slate-700" />
                    <span className="text-sm font-black text-white tracking-tight hidden lg:block">
                        Operator Cockpit — <span className="text-cyan-400">{line.name}</span>
                    </span>
                    <div className="flex items-center gap-3 ml-auto flex-wrap">
                        <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-400 shadow-inner shrink-0">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />{formattedDate}
                        </div>
                        <div className="w-44">
                            <Select value={shift} onValueChange={v => setShift(v as Shift)}>
                                <SelectTrigger className="h-9 bg-slate-950 border-slate-800 text-slate-200 rounded-xl font-bold text-xs shadow-inner"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl">
                                    <SelectItem value="1-smena">☀️ 1-smena (08:00–19:50)</SelectItem>
                                    <SelectItem value="2-smena">🌙 2-smena (20:00–07:50)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <div className="px-6 md:px-10 flex items-center gap-1 border-t border-slate-800/60">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isAct = activeTab === tab.id;
                        return (
                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${isAct ? 'text-cyan-400 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600'}`}>
                                <Icon className="w-3.5 h-3.5" />{tab.label}
                                {tab.badge && <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${tab.badgeDanger ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>{tab.badge}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Add Floating Analytics Overlay ── */}
            <div className="fixed top-24 right-8 z-40 hidden lg:flex flex-col gap-3 pointer-events-none">
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl flex items-center gap-3 w-64 pointer-events-auto">
                    <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20"><Activity className="w-4 h-4 text-cyan-400" /></div>
                    <div className="flex-1"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Efficiency Index</p><p className="text-lg font-black font-mono text-cyan-400">92.4 <span className="text-xs text-cyan-500/50">OEE</span></p></div>
                </div>
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl flex items-center gap-3 w-64 pointer-events-auto">
                    <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${hasCriticalShortage ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                        {hasCriticalShortage ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Material Risk</p><p className={`text-lg font-black font-mono ${hasCriticalShortage ? 'text-red-400' : 'text-emerald-400'}`}>{hasCriticalShortage ? 'HIGH' : 'LOW'}</p></div>
                </div>
            </div>

            {/* Content + Sidebar */}
            <form id="op-form" onSubmit={handleSubmit}>
                <div className="flex items-start">
                    <div className="flex-1 min-w-0 px-6 md:px-10 py-8 pb-40">
                        {activeTab === 'schedule' && <TabSchedule rows={rows} addRow={addRow} removeRow={removeRow} updateRow={updateRow} totalReja={totalReja} lk={lk} taktTime={TAKT_TIME} />}
                        {activeTab === 'logistics' && <TabLogistics bom={bom} totalReja={totalReja} />}
                        {activeTab === 'quality' && <TabQuality lk={lk} lineName={line.name} passed={qcPassedItems} setPassed={setQcPassedItems} acked={sopAckedItems} setAcked={setSopAckedItems} checks={checks} />}
                    </div>

                    {/* Sticky Right Sidebar */}
                    <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5 p-6 sticky top-[105px] self-start h-[calc(100vh-105px)] overflow-y-auto border-l border-slate-800 bg-slate-900/30 backdrop-blur-xl [&::-webkit-scrollbar]:hidden">
                        {/* Shift Gauge */}
                        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-cyan-400" /></div>
                                <div><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Shift Timeline</p><p className="text-xs font-black text-slate-300">{startH} → {endH}</p></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2"><span>{startH}</span><span>{endH}</span></div>
                            <div className="relative h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${excess ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`} style={{ width: `${shiftPct}%` }} />
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className={`text-sm font-black font-mono ${excess ? 'text-red-400' : 'text-cyan-400'}`}>{shiftPct}%</span>
                                <span className="text-[10px] text-slate-500 font-mono">{requiredMin}/{SHIFT_CAP} min</span>
                            </div>
                            {excess && <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]"><AlertTriangle className="w-3 h-3 shrink-0" />Capacity exceeded by {requiredMin - SHIFT_CAP} min</div>}
                        </div>

                        {/* Readiness */}
                        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">Material Readiness</p>
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`text-5xl font-black font-mono ${readinessPct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>{readinessPct}%</span>
                                <div className="text-xs text-slate-400"><p className="font-bold">{bomWithStatus.filter(b => !b.short).length}/{bomWithStatus.length}</p><p>ready</p></div>
                            </div>
                            <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                <div className={`h-full rounded-full transition-all duration-1000 ${readinessPct === 100 ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} style={{ width: `${readinessPct}%` }} />
                            </div>
                            <div className="mt-4 space-y-2">
                                {bomWithStatus.map(b => (
                                    <div key={b.partId} className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.short ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} />
                                        <span className={`text-[11px] truncate flex-1 font-mono ${b.short ? 'text-red-400' : 'text-slate-400'}`}>{b.name}</span>
                                        {b.short && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">SHORT</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Factory Load */}
                        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
                            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-cyan-400" /><p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Factory Load</p></div>
                            {[{ n: 'Door Trim', v: 82 }, { n: 'Console', v: 47 }, { n: 'Plastic', v: 91 }, { n: 'Assembly A', v: 73 }].map((l, i) => (
                                <div key={i} className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] text-slate-500 w-20 truncate">{l.n}</span>
                                    <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                        <div className={`h-full rounded-full ${l.v > 85 ? 'bg-orange-500' : l.v > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${l.v}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{l.v}%</span>
                                </div>
                            ))}
                        </div>

                    </aside>
                </div>
            </form>


            {/* ── Fixed Command Bar (ALL screen sizes) ── */}
            <div className="fixed bottom-0 left-0 w-full z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
                <div className="px-6 md:px-10 pt-4 pb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500 uppercase tracking-widest border border-slate-800 bg-slate-900 px-5 h-11 rounded-xl shadow-inner">
                        <span>Total Units: <span className="text-cyan-400 font-black text-sm">{totalReja.toLocaleString()}</span></span>
                        <span className="text-slate-700 font-black">/</span>
                        <span>Total Cycle Time: <span className={`font-black ${excess ? 'text-red-500' : 'text-cyan-400'} text-sm`}>{requiredMin} min</span></span>
                        <span className="text-slate-700 font-black">/</span>
                        <span>Readiness: <span className={`font-black text-sm ${readinessPct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>{readinessPct}%</span></span>
                        {hasCriticalShortage && (
                            <>
                                <span className="text-slate-700 font-black">/</span>
                                <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-black shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                    <AlertTriangle className="w-3.5 h-3.5" /> SHORTAGE
                                </span>
                            </>
                        )}
                        {excess && (
                            <>
                                <span className="text-slate-700 font-black">/</span>
                                <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-black shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                    <Clock className="w-3.5 h-3.5" /> OVER MAX TIME
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate(backPath)}
                            className="h-11 px-6 text-slate-400 hover:text-white hover:bg-slate-800 uppercase tracking-widest text-[11px] font-black rounded-xl border border-slate-800 hover:border-slate-600 transition-all">
                            CANCEL
                        </Button>
                        <Button type="submit" form="op-form" disabled={hasCriticalShortage || !allQcPassed || !allSopsAcked || excess}
                            className={`h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2.5 transition-all duration-300 font-mono ${hasCriticalShortage || !allQcPassed || !allSopsAcked || excess
                                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800 opacity-80'
                                : readinessPct < 100
                                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.45)] border border-orange-500 animate-pulse'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.55)] hover:shadow-[0_0_32px_rgba(6,182,212,0.75)] border border-cyan-500'
                                }`}>
                            {hasCriticalShortage ? 'BLOCKED - SHORT MATERIALS' : excess ? 'CAPACITY OVERLOAD' : !allSopsAcked ? 'BLOCKED - SOP PENDING' : !allQcPassed ? 'BLOCKED - QA FAILED' : 'EXECUTE / YUBORISH'} <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
