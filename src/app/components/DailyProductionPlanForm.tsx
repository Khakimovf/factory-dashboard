import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyProductionPlan, Shift, PlanRow, ProductOption } from '../context/DailyProductionPlanContext';
import { useWarehouse } from '../context/WarehouseContext';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  Plus, Trash2, ArrowLeft, AlertTriangle, Search,
  Clock, ChevronRight, BarChart3, Layers, ShieldCheck,
  CheckCircle2, XCircle, Truck, Zap, Factory, PackagePlus
} from 'lucide-react';
import { toast } from 'sonner';

// ── Line Types ──────────────────────────────────────────────────────────────
const LINE_TYPES = [
  { id: 'door-trim', label: 'Door Trim Line', icon: '🚪', accent: 'cyan' },
  { id: 'console', label: 'Center Console Line', icon: '🎛️', accent: 'violet' },
  { id: 'plastic', label: 'Plastic Parts Line', icon: '🧩', accent: 'emerald' },
  { id: 'assembly-a', label: 'Assembly Line A', icon: '🏭', accent: 'indigo' },
  { id: 'assembly-b', label: 'Assembly Line B', icon: '🏭', accent: 'indigo' },
  { id: 'cnc', label: 'CNC Line 1', icon: '⚙️', accent: 'amber' },
  { id: 'welding', label: 'Welding Line 2', icon: '🔥', accent: 'rose' },
];

// ── Part Catalog (200+ style) ──────────────────────────────────────────────
const PART_CATALOG: { partNo: string; name: string; icon: string; line: string; sub?: string }[] = [
  // Door Trim
  { partNo: 'DT-COBALT-FRH', name: 'Cobalt Door Trim Front RH', icon: '🚪', line: 'door-trim', sub: 'Front RH/LH' },
  { partNo: 'DT-COBALT-FLH', name: 'Cobalt Door Trim Front LH', icon: '🚪', line: 'door-trim', sub: 'Front RH/LH' },
  { partNo: 'DT-COBALT-RRH', name: 'Cobalt Door Trim Rear RH', icon: '🚪', line: 'door-trim', sub: 'Rear RH/LH' },
  { partNo: 'DT-COBALT-RLH', name: 'Cobalt Door Trim Rear LH', icon: '🚪', line: 'door-trim', sub: 'Rear RH/LH' },
  { partNo: 'DT-ONYX-FRH', name: 'Onyx Door Trim Front RH', icon: '⬛', line: 'door-trim', sub: 'Front RH/LH' },
  { partNo: 'DT-ONYX-FLH', name: 'Onyx Door Trim Front LH', icon: '⬛', line: 'door-trim', sub: 'Front RH/LH' },
  { partNo: 'DT-ONYX-RRH', name: 'Onyx Door Trim Rear RH', icon: '⬛', line: 'door-trim', sub: 'Rear RH/LH' },
  { partNo: 'DT-ONYX-RLH', name: 'Onyx Door Trim Rear LH', icon: '⬛', line: 'door-trim', sub: 'Rear RH/LH' },
  { partNo: 'DT-ARCTIC-FRH', name: 'Arctic Door Trim Front RH', icon: '🔲', line: 'door-trim', sub: 'Front RH/LH' },
  { partNo: 'DT-ARCTIC-FLH', name: 'Arctic Door Trim Front LH', icon: '🔲', line: 'door-trim', sub: 'Front RH/LH' },
  // Console
  { partNo: 'CON-STD-001', name: 'Console Base Standard', icon: '🎛️', line: 'console', sub: 'Base' },
  { partNo: 'CON-STD-002', name: 'Console Armrest Pad', icon: '🎛️', line: 'console', sub: 'Base' },
  { partNo: 'CON-PRE-001', name: 'Console Premium Cover', icon: '✨', line: 'console', sub: 'Premium' },
  { partNo: 'CON-PRE-002', name: 'Console Stitched Insert', icon: '✨', line: 'console', sub: 'Premium' },
  { partNo: 'CON-USB-001', name: 'USB Hub Bezel Assembly', icon: '🔌', line: 'console', sub: 'Electro' },
  // Plastic Parts
  { partNo: 'PP-A-PILLAR-RH', name: 'A-Pillar Trim RH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
  { partNo: 'PP-A-PILLAR-LH', name: 'A-Pillar Trim LH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
  { partNo: 'PP-B-PILLAR-RH', name: 'B-Pillar Trim RH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
  { partNo: 'PP-B-PILLAR-LH', name: 'B-Pillar Trim LH', icon: '🧩', line: 'plastic', sub: 'Pillars' },
  { partNo: 'PP-DASH-UPPER', name: 'Dashboard Upper Trim', icon: '🖤', line: 'plastic', sub: 'Dashboard' },
  { partNo: 'PP-DASH-LOWER', name: 'Dashboard Lower Trim', icon: '🤍', line: 'plastic', sub: 'Dashboard' },
  // Assembly
  { partNo: 'MIDNIGHT-BASE', name: 'MIDNIGHT Base Assembly', icon: '🌑', line: 'assembly-a', sub: 'MIDNIGHT' },
  { partNo: 'MIDNIGHT-A', name: 'MIDNIGHT Panel A', icon: '🟫', line: 'assembly-a', sub: 'MIDNIGHT' },
  { partNo: 'MIDNIGHT-B', name: 'MIDNIGHT Panel B', icon: '⬛', line: 'assembly-a', sub: 'MIDNIGHT' },
  { partNo: 'URBAN-BASE', name: 'URBAN Base Assembly', icon: '🏙️', line: 'assembly-b', sub: 'URBAN' },
  { partNo: 'URBAN-A', name: 'URBAN Trim A', icon: '🔷', line: 'assembly-b', sub: 'URBAN' },
  { partNo: 'CUSTOM-001', name: 'Custom Build Unit 001', icon: '🛠️', line: 'cnc' },
  { partNo: 'CUSTOM-002', name: 'Custom Build Unit 002', icon: '⚡', line: 'cnc' },
];

// ── BOM Data ────────────────────────────────────────────────────────────────
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
    { partId: 'HW-STITCH-01', name: 'Stitching Thread (Black)', icon: '🧵', qtyPerUnit: 5, bin: 'T-011', supplier: 'ThreadPro', leadDays: 1 },
    { partId: 'RM-ABS-01', name: 'ABS Plastic Granules', icon: '🧪', qtyPerUnit: 1.5, bin: 'S-001', supplier: 'PolyMat Chem.', leadDays: 5 },
    { partId: 'HW-USB-ASSY', name: 'USB Hub Assembly', icon: '🔌', qtyPerUnit: 1, bin: 'E-001', supplier: 'ElectroParts Co', leadDays: 7 },
  ],
  'plastic': [
    { partId: 'RM-PP-01', name: 'Polypropylene Granules', icon: '🧪', qtyPerUnit: 3.0, bin: 'S-001', supplier: 'PolyMat Chem.', leadDays: 5 },
    { partId: 'RM-MB-BLACK', name: 'Masterbatch Black', icon: '🎨', qtyPerUnit: 0.3, bin: 'S-002', supplier: 'ColorTech GmbH', leadDays: 3 },
    { partId: 'HW-CLIP-PP', name: 'Plastic Push-Pins (20pcs)', icon: '📍', qtyPerUnit: 20, bin: 'A-103', supplier: 'ClipFast Ltd', leadDays: 1 },
    { partId: 'RM-TALC-01', name: 'Talc Filler 20%', icon: '🔬', qtyPerUnit: 0.8, bin: 'S-003', supplier: 'FillTec Corp.', leadDays: 4 },
  ],
  'assembly-a': [
    { partId: 'RM-002', name: 'Masterbatch Black', icon: '🎨', qtyPerUnit: 2.5, bin: 'Rack-03', supplier: 'ColorTech GmbH', leadDays: 3 },
    { partId: 'COMP-001', name: 'Metal Clips Type A', icon: '🔩', qtyPerUnit: 8, bin: 'A-101', supplier: 'FastenPro Ltd', leadDays: 1 },
    { partId: 'COMP-006', name: 'M4 Torx Screws', icon: '⚙️', qtyPerUnit: 24, bin: 'B-202', supplier: 'HardCo Supply', leadDays: 1 },
    { partId: 'RM-001', name: 'Polypropylene Granules', icon: '🧪', qtyPerUnit: 5.0, bin: 'Silo-01', supplier: 'PolyMat Chem.', leadDays: 5 },
  ],
};
const DEFAULT_BOM: BomItem[] = [
  { partId: 'RM-001', name: 'Polypropylene Granules', icon: '🧪', qtyPerUnit: 4, bin: 'Silo-01', supplier: 'PolyMat Chem.', leadDays: 5 },
  { partId: 'HW-GEN-01', name: 'General Hardware Kit', icon: '🔧', qtyPerUnit: 10, bin: 'A-999', supplier: 'HardCo Supply', leadDays: 1 },
];

// ── QC Checklists per Line ──────────────────────────────────────────────────
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
    { check: 'Fit-to-tunnel gap', standard: '≤ 0.8mm', method: 'Feeler Gauge' },
  ],
  'plastic': [
    { check: 'Surface gloss level', standard: '60–80 GU @ 60°', method: 'Gloss Meter' },
    { check: 'Sink marks / voids', standard: 'Zero visible', method: 'Visual Inspection' },
    { check: 'Weld line position', standard: 'Outside class-A zone', method: 'Drawing Reference' },
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
  'PP-BASE-DT': 200, 'RM-LEATHER-01': 100, 'HW-STITCH-01': 2000, 'RM-ABS-01': 800,
  'HW-USB-ASSY': 30, 'RM-PP-01': 5000, 'RM-MB-BLACK': 400, 'HW-CLIP-PP': 15000,
  'RM-TALC-01': 1200, 'RM-002': 800, 'COMP-001': 50000, 'COMP-006': 125000, 'RM-001': 15000,
  'HW-GEN-01': 5000,
};

// ── Part Search Grid ─────────────────────────────────────────────────────────
function PartSearchGrid({ value, onChange, lineId }: { value: string; onChange: (v: string) => void; lineId: string }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const lp = PART_CATALOG.filter(p => p.line === lineId);
  const others = PART_CATALOG.filter(p => p.line !== lineId);
  const allSorted = [...lp, ...others];
  const filtered = q.length > 0
    ? allSorted.filter(p => p.partNo.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase()))
    : allSorted;
  const sel = PART_CATALOG.find(p => p.partNo === value);

  // Group by sub
  const groups = filtered.reduce((acc, p) => {
    const key = p.sub || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="relative">
      <div onClick={() => setOpen(true)} className="flex items-center gap-3 px-4 py-2 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-inner group">
        {sel ? (
          <><span className="text-base shrink-0">{sel.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-slate-200 truncate">{sel.partNo}</p>
              <p className="text-[10px] text-slate-500 truncate">{sel.name}</p>
            </div></>
        ) : (
          <><Search className="w-4 h-4 text-slate-400 dark:text-slate-500" /><span className="text-sm text-slate-500">Search {PART_CATALOG.length}+ parts…</span></>
        )}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-full min-w-[420px] rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-black/60 transition-colors">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-500 shrink-0" />
                <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                  placeholder={`Search ${PART_CATALOG.length}+ parts...`}
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium" />
                {q && <button onClick={() => setQ('')} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs">✕</button>}
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto bg-white dark:bg-slate-950 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
              {Object.entries(groups).map(([group, parts]) => (
                <div key={group}>
                  <p className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/40 sticky top-0 backdrop-blur-md">{group}</p>
                  {parts.map(p => (
                    <button key={p.partNo} type="button"
                      onClick={() => { onChange(p.partNo); setOpen(false); setQ(''); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${value === p.partNo ? 'bg-cyan-50 dark:bg-cyan-500/10 border-l-2 border-cyan-500' : ''}`}>
                      <span className="text-xl leading-none shrink-0">{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-200 truncate">{p.partNo}</p>
                        <p className="text-[10px] text-slate-500 truncate">{p.name}</p>
                      </div>
                      {p.line === lineId && <span className="text-[8px] text-cyan-600 dark:text-cyan-400 font-black bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 px-1.5 py-0.5 rounded shrink-0">THIS LINE</span>}
                    </button>
                  ))}
                </div>
              ))}
              {!filtered.length && <p className="text-center text-xs text-slate-500 py-8 font-medium">No parts found</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const MIN_PER_UNIT = 2; // 2 min per unit assembly

// ── Tab 1: Production Schedule ────────────────────────────────────────────────
function TabSchedule({ rows, addRow, removeRow, updateRow, totalReja, lineId }: {
  rows: PlanRow[]; addRow: () => void; removeRow: (id: string) => void;
  updateRow: (id: string, f: keyof PlanRow, v: string | number | undefined) => void;
  totalReja: number; lineId: string;
}) {
  const SHIFT_CAP = 710;
  const totalMin = totalReja * MIN_PER_UNIT;
  const capPct = Math.min(Math.round(totalMin / SHIFT_CAP * 100), 100);
  return (
    <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-6">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Production Schedule Matrix</h3>
          <p className="text-xs text-slate-500 mt-1">Assign part numbers and target quantities per shift cycle.</p>
        </div>
        <Button type="button" onClick={addRow}
          className="bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 h-10 px-5 rounded-xl font-black tracking-widest text-[11px] uppercase flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> ADD ROW
        </Button>
      </div>
      <div className="grid grid-cols-[36px_1fr_120px_100px_52px] gap-6 px-4 pb-4 mb-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
        <span className="text-center">#</span><span>Part Definition</span>
        <span className="text-center">REJA</span><span className="text-center">Time Load</span><span></span>
      </div>
      <div className="space-y-4">
        {rows.map((row, idx) => {
          const rowMin = (row.reja || 0) * MIN_PER_UNIT;
          const rowHr = (rowMin / 60).toFixed(1);
          const rowPct = Math.min(Math.round(rowMin / SHIFT_CAP * 100), 100);
          return (
            <div key={row.id} className="grid grid-cols-[36px_1fr_120px_100px_52px] gap-6 items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
              <span className="text-xs text-slate-500 font-mono font-black text-center bg-slate-100 dark:bg-slate-900 w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">{String(idx + 1).padStart(2, '0')}</span>
              <PartSearchGrid value={row.partNo} onChange={v => updateRow(row.id, 'partNo', v)} lineId={lineId} />
              <Input type="number" min="1" required value={row.reja || ''}
                onChange={e => updateRow(row.id, 'reja', parseFloat(e.target.value) || 0)}
                className="font-mono font-black text-center h-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:border-cyan-500/50 rounded-xl transition-all" />
              <div className="flex flex-col">
                <div className="flex justify-between items-end mb-1">
                  <span className={`text-[10px] font-mono font-black ${rowPct > 90 ? 'text-orange-500' : 'text-slate-700 dark:text-slate-400'}`}>{rowMin} <span className="text-[9px] text-slate-400 dark:text-slate-500">min</span></span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{rowHr}h</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800"><div className={`h-full rounded-full ${rowPct > 90 ? 'bg-orange-500' : 'bg-cyan-500'}`} style={{ width: `${rowPct}%` }} /></div>
              </div>
              <div className="flex justify-center">
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(row.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Load:</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-black font-mono ${capPct > 90 ? 'text-orange-400' : 'text-cyan-400'}`}>{capPct}%</span>
            <span className="text-[10px] text-slate-600 font-mono">{totalMin}min / {SHIFT_CAP}min</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Total REJA:</span>
          <span className="text-3xl font-black font-mono text-cyan-400">{totalReja.toLocaleString()}</span>
          <span className="text-slate-600 text-sm font-bold">UNITS</span>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Logistics & BOM ────────────────────────────────────────────────────
function TabLogistics({ bom, totalReja }: { bom: BomItem[]; totalReja: number }) {
  const shortItems = bom.filter(item => (item.qtyPerUnit * totalReja) > (mockStock[item.partId] ?? 0));
  const longLeadItems = bom.filter(item => (item.leadDays ?? 0) > 3);
  return (
    <div className="space-y-6">
      {shortItems.length > 0 && (
        <div className="flex items-start gap-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-500/30 rounded-2xl px-6 py-5 shadow-sm transition-colors">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-black text-orange-400 uppercase tracking-widest">{shortItems.length} item(s) below required stock</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Request replenishment before executing this plan.</p>
          </div>
          <button type="button"
            onClick={() => alert(`WMS request sent for: ${shortItems.map(i => i.name).join(', ')}`)}
            className="h-8 px-4 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-all shrink-0">
            <Truck className="w-3 h-3" /> REQUEST PARTS
          </button>
        </div>
      )}
      {longLeadItems.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 rounded-xl px-5 py-3">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            Long lead warning: {longLeadItems.map(i => `${i.name} (${i.leadDays}d)`).join(' · ')}
          </p>
        </div>
      )}
      <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
        <div className="grid grid-cols-[1fr_90px_90px_80px_110px_90px_130px] gap-4 px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <span>Component</span><span className="text-right">Req Qty</span><span className="text-right">A.Stock</span>
          <span className="text-center">Status</span><span>Bin</span><span className="text-center">Lead Time</span><span>Supplier</span>
        </div>
        {bom.map((item, i) => {
          const req = item.qtyPerUnit * totalReja;
          const stock = mockStock[item.partId] ?? 0;
          const short = req > stock;
          return (
            <div key={item.partId}
              className={`grid grid-cols-[1fr_90px_90px_80px_110px_90px_130px] gap-4 items-center px-8 py-5 border-b border-slate-100 dark:border-slate-800/50 transition-colors ${short ? 'bg-orange-50 dark:bg-orange-950/20' : i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900/20' : ''}`}>
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-2xl bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700/50 leading-none shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">{item.partId}</p>
                </div>
              </div>
              <div className={`text-right text-sm font-mono font-black ${short ? 'text-orange-400' : 'text-emerald-400'}`}>{req.toLocaleString()}</div>
              <div className="text-right text-sm font-mono text-slate-500">{stock.toLocaleString()}</div>
              <div className="flex justify-center">
                {short
                  ? <span className="flex items-center gap-1 text-[9px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> SHORT</span>
                  : <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> READY</span>}
              </div>
              <span className="text-xs font-mono text-slate-400">{item.bin || '—'}</span>
              <div className="flex justify-center">
                <span className={`text-xs font-mono font-black ${(item.leadDays ?? 0) > 3 ? 'text-amber-400' : 'text-slate-400'}`}>{item.leadDays ?? '—'} <span className="text-slate-600 text-[10px]">days</span></span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <Truck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-xs text-slate-500 truncate">{item.supplier || '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab 3: Quality Standards ────────────────────────────────────────────────────
function TabQuality({ lineId, lineName, onAllPassed }: { lineId: string; lineName: string; onAllPassed: (v: boolean) => void }) {
  const checks = QC_CHECKLISTS[lineId] || DEFAULT_QC;
  const [passed, setPassed] = useState<Record<number, boolean>>({});
  const [signature, setSignature] = useState('');
  const doneCnt = Object.values(passed).filter(Boolean).length;
  const allChecked = checks.every((_, i) => passed[i]);
  const allPassed = allChecked && signature.trim().length >= 3;
  useEffect(() => { onAllPassed(allPassed); }, [allPassed]);
  return (
    <div className="space-y-8">
      <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden transition-colors">
        <div className="flex items-center gap-5 px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">QC Checklist — {lineName}</h3>
            <p className="text-xs text-slate-500 mt-1">All items + operator signature required before plan execution.</p>
          </div>
          <div className="ml-auto">
            {allPassed
              ? <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full">✅ GATE CLEARED</span>
              : <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full">{doneCnt}/{checks.length} done</span>}
          </div>
        </div>
        <div className="grid grid-cols-[28px_1fr_200px_160px] gap-6 px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <span></span><span>Check Item</span><span>Standard</span><span>Method</span>
        </div>
        {checks.map((c, i) => (
          <div key={i} className={`grid grid-cols-[28px_1fr_200px_160px] gap-6 items-center px-8 py-5 border-b border-slate-100 dark:border-slate-800/50 transition-colors ${passed[i] ? 'bg-emerald-50 dark:bg-emerald-950/20' : i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-900/20' : ''}`}>
            <button type="button" onClick={() => setPassed(p => ({ ...p, [i]: !p[i] }))}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${passed[i] ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <p className={`text-sm font-bold transition-all ${passed[i] ? 'text-emerald-600 dark:text-emerald-400 line-through decoration-emerald-500/50' : 'text-slate-900 dark:text-slate-200'}`}>{c.check}</p>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{c.standard}</span>
            <span className="text-xs text-slate-500 italic">{c.method}</span>
          </div>
        ))}
      </div>
      {/* Certified Operator Signature */}
      <div className="bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Certified Operator Signature</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Required to unlock the Execute button</p>
          </div>
          {signature.trim().length >= 3 && <span className="ml-auto text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full shadow-sm">✓ SIGNED</span>}
        </div>
        <input
          type="text"
          value={signature}
          onChange={e => setSignature(e.target.value)}
          placeholder="Type full name to certify..."
          className="w-full h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl px-5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-500 outline-none transition-all font-bold shadow-inner"
        />
        {!allChecked && <p className="text-[10px] text-orange-400 mt-2">&#9888; Complete all {checks.length} QC checks above first.</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type TabId = 'schedule' | 'logistics' | 'quality';

export function DailyProductionPlanForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createPlan } = useDailyProductionPlan();
  const { addMaterialRequest } = useWarehouse();
  const { updateMaterialQuantity } = useFactory();

  const today = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const [shift, setShift] = useState<Shift>('1-smena');
  const [lineId, setLineId] = useState('door-trim');
  const [productGroup, setProductGroup] = useState<ProductOption | ''>('MIDNIGHT');
  const [rows, setRows] = useState<PlanRow[]>([{ id: '1', partNo: 'DT-COBALT-FRH', reja: 100 }]);
  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [qcAllPassed, setQcAllPassed] = useState(false);

  const lineInfo = LINE_TYPES.find(l => l.id === lineId) || LINE_TYPES[0];

  const addRow = () => setRows(p => [...p, { id: Date.now().toString(), partNo: '', reja: 0 }]);
  const removeRow = (id: string) => { if (rows.length > 1) setRows(p => p.filter(r => r.id !== id)); };
  const updateRow = (id: string, field: keyof PlanRow, value: string | number | undefined) =>
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));

  const totalReja = rows.reduce((s, r) => s + (r.reja || 0), 0);
  const bom = LINE_BOMS[lineId] || DEFAULT_BOM;

  const bomWithStatus = useMemo(() =>
    bom.map(item => ({ ...item, req: item.qtyPerUnit * totalReja, stock: mockStock[item.partId] ?? 0, short: (item.qtyPerUnit * totalReja) > (mockStock[item.partId] ?? 0) })),
    [bom, totalReja]
  );
  const hasCriticalShortage = bomWithStatus.some(b => b.short);
  const readinessPct = bomWithStatus.length > 0 ? Math.round(bomWithStatus.filter(b => !b.short).length / bomWithStatus.length * 100) : 100;
  const SHIFT_CAP = 710;
  const requiredMin = totalReja * 2;
  const shiftPct = Math.min(Math.round(requiredMin / SHIFT_CAP * 100), 100);
  const excess = requiredMin > SHIFT_CAP;
  const [startH, endH] = shift === '1-smena' ? ['08:00', '19:50'] : ['20:00', '07:50'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productGroup) { toast.error(t('productionPlan.productGroupRequired')); return; }
    const invalidRows = rows.filter(r => !r.partNo.trim() || r.reja <= 0);
    if (invalidRows.length > 0) { toast.error(t('productionPlan.invalidRows')); return; }
    if (hasCriticalShortage) { toast.error('Material shortage detected. Request replenishment first.'); return; }

    addMaterialRequest(
      `MES-PLAN ${lineInfo.label} Q:${totalReja} | BATCH-${Math.floor(Math.random() * 90000) + 10000}`,
      bom.map(rm => ({ id: `ri-${rm.partId}-${Date.now()}`, name: rm.name, partNumber: rm.partId, requiredQty: rm.qtyPerUnit * totalReja, currentStock: mockStock[rm.partId] ?? 0, binLocation: rm.bin })),
      'High', 'Line Replenishment', lineInfo.label
    );
    bom.forEach(rm => updateMaterialQuantity(rm.partId, -(rm.qtyPerUnit * totalReja)));
    toast('WMS Sync → ActiveOps', { description: `${lineInfo.label} batch dispatched.`, icon: '🔗' });

    createPlan({ date: today, shift, productGroup: lineInfo.label, rows: rows.map(r => ({ id: r.id, partNo: r.partNo.trim(), reja: r.reja, fact: r.fact })) });
    toast.success(`${lineInfo.label} plan executed.`);
    navigate('/hr');
  };

  const accentMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/40',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/40',
  };
  const accent = accentMap[lineInfo.accent] || accentMap.cyan;

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: string; badgeDanger?: boolean }[] = [
    { id: 'schedule', label: 'Production Schedule', icon: Layers, badge: `${rows.length} rows` },
    { id: 'logistics', label: 'Logistics & BOM', icon: PackagePlus, badge: hasCriticalShortage ? 'SHORTAGE' : `${readinessPct}%`, badgeDanger: hasCriticalShortage },
    { id: 'quality', label: 'Quality Standards', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-300 transition-colors duration-300 pb-32">
      {/* ── Background Patterns ── */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-10 mix-blend-multiply dark:mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-500/5 dark:from-cyan-900/20 to-transparent pointer-events-none mix-blend-overlay" />

      {/* ── Sticky Config + Tab Bar ── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg transition-colors">
        {/* Config Row */}
        <div className="px-6 md:px-10 py-3 flex items-center gap-4 flex-wrap">
          <button onClick={() => navigate('/hr')}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Badge variant="outline" className={`text-[10px] px-2.5 py-1 font-mono font-bold ${accent}`}>SAP MES: ZPP_PLAN02</Badge>
          <Badge variant="outline" className="text-[10px] px-2.5 py-1 font-mono font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/40">ONLINE</Badge>
          <div className="h-5 w-px bg-slate-300 dark:bg-slate-700" />
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight hidden lg:block">
            <span className="mr-2">{lineInfo.icon}</span>{lineInfo.label}
          </span>
          <div className="flex items-center gap-3 flex-1 flex-wrap justify-end">
            <div className="flex items-center gap-2 h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 shadow-inner shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />{formattedDate}
            </div>
            {/* Line Type */}
            <div className="w-52">
              <Select value={lineId} onValueChange={v => { setLineId(v); setRows([{ id: Date.now().toString(), partNo: '', reja: 100 }]); }}>
                <SelectTrigger className="h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl font-bold text-xs shadow-inner">
                  <Factory className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500 shrink-0" /><SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 shadow-2xl">
                  {LINE_TYPES.map(l => <SelectItem key={l.id} value={l.id} className="font-medium">{l.icon} {l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Shift */}
            <div className="w-44">
              <Select value={shift} onValueChange={v => setShift(v as Shift)}>
                <SelectTrigger className="h-9 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-xl font-bold text-xs shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 shadow-2xl">
                  <SelectItem value="1-smena">☀️ 1-smena (08:00–19:50)</SelectItem>
                  <SelectItem value="2-smena">🌙 2-smena (20:00–07:50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="px-6 md:px-10 flex items-center gap-1 border-t border-slate-200 dark:border-slate-800/60 transition-colors">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${isAct ? 'text-cyan-600 dark:text-cyan-400 border-cyan-500' : 'text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <Icon className="w-3.5 h-3.5" />{tab.label}
                {tab.badge && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${tab.badgeDanger ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content + Sidebar ── */}
      <form id="mes-form" onSubmit={handleSubmit}>
        <div className="flex items-start">

          {/* Main Content */}
          <div className="flex-1 min-w-0 px-6 md:px-10 py-8 pb-40">
            {activeTab === 'schedule' && <TabSchedule rows={rows} addRow={addRow} removeRow={removeRow} updateRow={updateRow} totalReja={totalReja} lineId={lineId} />}
            {activeTab === 'logistics' && <TabLogistics bom={bom} totalReja={totalReja} />}
            {activeTab === 'quality' && <TabQuality lineId={lineId} lineName={lineInfo.label} onAllPassed={setQcAllPassed} />}
          </div>

          {/* Sticky Right Sidebar */}
          <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-5 p-6 sticky top-[105px] self-start h-[calc(100vh-105px)] overflow-y-auto border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl [&::-webkit-scrollbar]:hidden transition-colors">

            {/* Shift Gauge */}
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Shift Timeline</p>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-300">{startH} → {endH}</p>
                </div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
                <span>{startH}</span><span>{endH}</span>
              </div>
              <div className="relative h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${excess ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
                  style={{ width: `${shiftPct}%` }} />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm font-black font-mono ${excess ? 'text-orange-400' : 'text-cyan-400'}`}>{shiftPct}%</span>
                <span className="text-[10px] text-slate-500 font-mono">{requiredMin}/{SHIFT_CAP} min</span>
              </div>
              {excess && (
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-orange-400 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                  <AlertTriangle className="w-3 h-3 shrink-0" />+{requiredMin - SHIFT_CAP} min over
                </div>
              )}
            </div>

            {/* Material Readiness */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">Material Readiness</p>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-5xl font-black font-mono ${readinessPct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>{readinessPct}%</span>
                <div className="text-xs text-slate-400 leading-tight">
                  <p className="font-bold">{bomWithStatus.filter(b => !b.short).length}/{bomWithStatus.length}</p>
                  <p>items ready</p>
                </div>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className={`h-full rounded-full transition-all duration-1000 ${readinessPct === 100 ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}
                  style={{ width: `${readinessPct}%` }} />
              </div>
              <div className="mt-4 space-y-2">
                {bomWithStatus.map(b => (
                  <div key={b.partId} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.short ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[11px] text-slate-400 truncate flex-1">{b.name}</span>
                    {b.short && <span className="text-[9px] font-black text-orange-400">SHORT</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Factory Load Snapshot */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Factory Load</p>
              </div>
              {[{ n: 'Door Trim', v: 82 }, { n: 'Console', v: 47 }, { n: 'Plastic Parts', v: 91 }, { n: 'Assembly A', v: 73 }].map((l, i) => (
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

      {/* ── Fixed Command Bar – scoped to main content (right of w-64 sidebar) ── */}
      <div className="fixed bottom-0 left-64 right-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] transition-colors duration-300">
        <div className="px-6 md:px-10 pt-5 pb-8 flex items-center justify-between gap-4 flex-wrap">
          {/* Live Summary */}
          <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            <span>Units: <span className="text-cyan-600 dark:text-cyan-400 font-black text-sm">{totalReja.toLocaleString()}</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Time: <span className={`font-black ${excess ? 'text-orange-500 dark:text-orange-400' : 'text-cyan-600 dark:text-cyan-400'}`}>{requiredMin} min</span></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Readiness: <span className={`font-black ${readinessPct === 100 ? 'text-emerald-500 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'}`}>{readinessPct}%</span></span>
            {hasCriticalShortage && (
              <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-black">
                <AlertTriangle className="w-3.5 h-3.5" /> MATERIAL SHORTAGE
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>QC: <span className={`font-black ${qcAllPassed ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500'}`}>{qcAllPassed ? 'CLEARED ✓' : 'PENDING'}</span></span>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" onClick={() => navigate('/hr')}
              className="h-12 px-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 uppercase tracking-widest text-xs font-black rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
              CANCEL
            </Button>
            <div title={!qcAllPassed ? 'Complete Quality Checks first' : hasCriticalShortage ? 'Resolve Material Shortage first' : ''}>
              <Button type="submit" form="mes-form" disabled={hasCriticalShortage || !qcAllPassed}
                className={`h-11 px-8 rounded-xl font-black uppercase tracking-widest text-sm flex items-center gap-2.5 transition-all duration-300 ${(hasCriticalShortage || !qcAllPassed)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-50'
                  : readinessPct < 100
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.45)] border border-orange-500 animate-pulse'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.55)] hover:shadow-[0_0_32px_rgba(6,182,212,0.75)] border border-cyan-500'
                  }`}>
                EXECUTE / YUBORISH <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
