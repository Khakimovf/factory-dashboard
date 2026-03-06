import { useState, useEffect, useMemo } from 'react';
import { useDailyProductionPlan, Shift, PlanRow, ProductOption } from '../../context/DailyProductionPlanContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProductionLine, useFactory } from '../../context/FactoryContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import {
  Plus, Trash2, ArrowLeft, PackagePlus, AlertTriangle, Search,
  Clock, Zap, Activity, Factory, ChevronRight, BarChart3, Fingerprint, Layers, Maximize
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Static BOM Data ─────────────────────────────────────────────────────────
const ProductBOMs: Record<ProductOption, { partId: string; name: string; qtyPerUnit: number; bin?: string; icon: string }> = {
  MIDNIGHT: [
    { partId: 'RM-002', name: 'Masterbatch Black', qtyPerUnit: 2.5, bin: 'Rack-03', icon: '🎨' },
    { partId: 'COMP-001', name: 'Metal Clips Type A', qtyPerUnit: 8, bin: 'A-101', icon: '🔩' },
    { partId: 'COMP-006', name: 'M4 Torx Screws', qtyPerUnit: 24, bin: 'B-202', icon: '⚙️' },
    { partId: 'RM-001', name: 'Polypropylene Granules', qtyPerUnit: 5.0, bin: 'Silo-01', icon: '🧪' },
    { partId: 'COMP-009', name: 'Black Foam Gasket', qtyPerUnit: 2, bin: 'C-401', icon: '📦' },
  ],
  URBAN: [
    { partId: 'COMP-002', name: 'Rubber Seals', qtyPerUnit: 4, bin: 'A-102', icon: '⭕' },
    { partId: 'COMP-005', name: '10mm Washers', qtyPerUnit: 16, bin: 'B-201', icon: '🔧' },
    { partId: 'COMP-008', name: 'Plastic Bezels', qtyPerUnit: 2, bin: 'C-302', icon: '📐' },
    { partId: 'RM-001', name: 'Polypropylene Granules', qtyPerUnit: 4.5, bin: 'Silo-01', icon: '🧪' },
    { partId: 'COMP-010', name: 'Urban Label Plate', qtyPerUnit: 1, bin: 'D-101', icon: '🏷️' },
  ],
};

const ALL_PARTS = [
  { partNo: 'MIDNIGHT-BASE', name: 'MIDNIGHT Base Assembly', icon: '🌑' },
  { partNo: 'MIDNIGHT-A', name: 'MIDNIGHT Panel A', icon: '🟫' },
  { partNo: 'MIDNIGHT-B', name: 'MIDNIGHT Panel B', icon: '⬛' },
  { partNo: 'URBAN-BASE', name: 'URBAN Base Assembly', icon: '🏙️' },
  { partNo: 'URBAN-A', name: 'URBAN Trim A', icon: '🔷' },
  { partNo: 'URBAN-B', name: 'URBAN Trim B', icon: '🔶' },
  { partNo: 'CUSTOM-001', name: 'Custom Build Unit 001', icon: '🛠️' },
  { partNo: 'CUSTOM-002', name: 'Custom Build Unit 002', icon: '⚡' },
];

const mockWarehouseStock: Record<string, number> = {
  'RM-001': 15000, 'RM-002': 800, 'COMP-001': 50000,
  'COMP-006': 125000, 'COMP-002': 200, 'COMP-005': 15000,
  'COMP-008': 2000, 'COMP-009': 4800, 'COMP-010': 1200,
};

// ─── Component: Marked Shift Timeline ─────────────────────────────────────────
function ShiftTimelineWithMarkers({ requiredMin, shift }: { requiredMin: number; shift: Shift }) {
  const SHIFT_CAPACITY_MIN = 710;
  const startHours = shift === '1-smena' ? '08:00' : '20:00';
  const mid1 = shift === '1-smena' ? '12:00' : '00:00';
  const mid2 = shift === '1-smena' ? '16:00' : '04:00';
  const endHours = shift === '1-smena' ? '19:50' : '07:50';

  const pct = Math.min((requiredMin / SHIFT_CAPACITY_MIN) * 100, 100);
  const excess = requiredMin > SHIFT_CAPACITY_MIN;

  return (
    <div className="mt-6 bg-[#0f172a] border border-slate-800 rounded-xl p-5 w-full shadow-inner relative">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Shift Execution Timeline</p>
          <p className="text-sm font-black text-slate-200 font-mono tracking-tight">{startHours} <span className="text-slate-600 font-sans mx-1">→</span> {endHours}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Load</p>
          <p className={`text-sm font-black font-mono tracking-tight ${excess ? 'text-orange-400' : 'text-indigo-400'}`}>
            {requiredMin} <span className="text-slate-600 font-medium">/ {SHIFT_CAPACITY_MIN} MIN</span>
          </p>
        </div>
      </div>

      <div className="relative h-6 w-full bg-slate-900 rounded-lg overflow-hidden mt-3 border border-slate-800 shadow-inner">
        <div
          className={`absolute top-0 left-0 h-full rounded-lg transition-all duration-1000 ease-out ${excess ? 'bg-orange-500/80 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-indigo-600/80 shadow-[0_0_15px_rgba(79,70,229,0.5)]'}`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }} />
        <div className="absolute inset-0 flex justify-between items-center px-1 text-[9px] font-mono font-bold text-white/70 mix-blend-difference drop-shadow-md pointer-events-none">
          <span className="w-10 text-left pl-1">{startHours}</span>
          <span className="w-10 text-center">{mid1}</span>
          <span className="w-10 text-center">{mid2}</span>
          <span className="w-10 text-right pr-1">{endHours}</span>
        </div>
      </div>

      {excess && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase tracking-wide bg-orange-500/10 p-2 rounded border border-orange-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Capacity limit breached by <span className="font-mono text-sm mx-1">{requiredMin - SHIFT_CAPACITY_MIN}</span> mins. Bottleneck projected.</span>
        </div>
      )}
    </div>
  );
}

// ─── Workload Heatmap Component ───────────────────────────────────────────────
function WorkloadHeatmap({ selectedLine }: { selectedLine: string }) {
  const lines = [
    { name: 'Assembly Line A', load: Math.floor(Math.random() * 40) + 50 },
    { name: 'Assembly Line B', load: Math.floor(Math.random() * 60) + 20 },
    { name: 'Assembly Line D', load: Math.floor(Math.random() * 80) + 10 },
    { name: 'CNC Line 1', load: Math.floor(Math.random() * 30) + 70 },
  ];

  const currentLine = lines.find(l => l.name === selectedLine) || { name: selectedLine, load: 85 };
  if (!lines.find(l => l.name === selectedLine)) lines.unshift(currentLine);

  return (
    <div className="mt-5 space-y-3">
      {lines.slice(0, 4).map((line, idx) => {
        const isSelected = line.name === selectedLine;
        const color = line.load > 85 ? 'bg-orange-500' : line.load > 60 ? 'bg-amber-400' : 'bg-emerald-500';
        return (
          <div key={idx} className={`flex items-center gap-3 ${isSelected ? 'opacity-100' : 'opacity-50 grayscale-[50%]'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider w-28 truncate ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
              {line.name}
            </span>
            <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${line.load}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right">{line.load}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Searchable Part Grid ─────────────────────────────────────────────────────
function PartSearchGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = ALL_PARTS.filter(p => p.partNo.toLowerCase().includes(query.toLowerCase()) || p.name.toLowerCase().includes(query.toLowerCase()));
  const selected = ALL_PARTS.find(p => p.partNo === value);

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-all h-12 group shadow-inner"
      >
        {selected ? (
          <>
            <span className="text-lg shrink-0 drop-shadow-md">{selected.icon}</span>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <span className="text-sm font-black text-slate-200 tracking-wide truncate pr-2">{selected.partNo}</span>
              <span className="text-xs text-slate-500 truncate hidden sm:inline-block font-medium">{selected.name}</span>
            </div>
          </>
        ) : (
          <>
            <Search className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-slate-400 transition-colors" />
            <span className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors font-medium">Part raqamini izlash…</span>
          </>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-2 w-[300px] sm:w-[450px] -left-1/2 sm:left-0 rounded-2xl border border-slate-600 bg-slate-900 shadow-2xl overflow-hidden pointer-events-auto ring-1 ring-black/50">
            <div className="p-3 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f172a] border border-slate-700 shadow-inner">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Katalogni qidirish..."
                  className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0f172a]">
              {filtered.map(p => (
                <button
                  key={p.partNo} type="button"
                  onClick={() => { onChange(p.partNo); setOpen(false); setQuery(''); }}
                  className={`flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all ${value === p.partNo ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]' : 'hover:bg-slate-800 hover:ring-1 hover:ring-slate-700'
                    }`}
                >
                  <span className="text-2xl leading-none pt-0.5 drop-shadow-sm">{p.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-200 truncate tracking-wide">{p.partNo}</p>
                    <p className="text-[10px] text-slate-500 truncate font-medium mt-1">{p.name}</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="col-span-1 sm:col-span-2 text-center text-xs text-slate-500 py-8 font-medium tracking-wide">Hech narsa topilmadi</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800/80">
      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 shadow-inner flex items-center justify-center">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h2 className="text-sm font-black text-slate-200 tracking-widest uppercase">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-500 font-medium mt-1 tracking-wide">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface OperatorLinePlanFormProps {
  line: ProductionLine;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function OperatorLinePlanForm({ line, open, onClose, onSave }: OperatorLinePlanFormProps) {
  const { t } = useLanguage();
  const { createLinePlan, getTodayLinePlan, updateLinePlan } = useDailyProductionPlan();
  const { addMaterialRequest } = useWarehouse();
  const { updateMaterialQuantity } = useFactory();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const existingPlan = getTodayLinePlan(line.id);

  const [shift, setShift] = useState<Shift>(existingPlan?.shift || '1-smena');
  const [productGroup, setProductGroup] = useState<ProductOption>(existingPlan?.productOption || 'MIDNIGHT');
  const [rows, setRows] = useState<PlanRow[]>(
    existingPlan?.rows.length ? existingPlan.rows : [{ id: Date.now().toString(), partNo: 'MIDNIGHT-BASE', reja: 100 }]
  );

  useEffect(() => {
    if (open) {
      const plan = getTodayLinePlan(line.id);
      if (plan) {
        setShift(plan.shift);
        setProductGroup(plan.productOption || 'MIDNIGHT');
        setRows(plan.rows);
      } else {
        setShift('1-smena');
        setProductGroup('MIDNIGHT');
        setRows([{ id: Date.now().toString(), partNo: 'MIDNIGHT-BASE', reja: 100 }]);
      }
    }
  }, [open, line.id, getTodayLinePlan]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (open && !isInitialLoad) {
      setRows([{ id: Date.now().toString(), partNo: `${productGroup}-BASE`, reja: 100 }]);
    }
    if (open) setIsInitialLoad(false);
  }, [productGroup, open, isInitialLoad]);

  const addRow = () => setRows(prev => [...prev, { id: Date.now().toString(), partNo: '', reja: 0 }]);
  const removeRow = (id: string) => { if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id)); };
  const updateRow = (id: string, field: keyof PlanRow, value: string | number | undefined) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const totalReja = rows.reduce((s, r) => s + (r.reja || 0), 0);

  // BOM Calculation
  const requiredMaterials = useMemo(() => {
    if (!productGroup || !(productGroup in ProductBOMs)) return [];
    return ProductBOMs[productGroup as ProductOption].map(item => {
      const requiredQty = item.qtyPerUnit * totalReja;
      const currentStock = mockWarehouseStock[item.partId] ?? 0;
      return { ...item, requiredQty, currentStock, shortage: requiredQty > currentStock };
    });
  }, [productGroup, totalReja]);

  const hasCriticalShortage = requiredMaterials.some(m => m.shortage);

  // Capacity Calculation
  const CYCLE_TIME_MIN = 2; // Assuming 2 mins per unit
  const SHIFT_CAPACITY_MIN = 710;
  const requiredMin = totalReja * CYCLE_TIME_MIN;

  const efficiencyPct = Math.min(Math.round((requiredMin / SHIFT_CAPACITY_MIN) * 100), 100);
  const readinessPct = requiredMaterials.length > 0
    ? Math.round((requiredMaterials.filter(m => !m.shortage).length / requiredMaterials.length) * 100)
    : 0;
  const riskType = hasCriticalShortage ? 'Critical' : requiredMin > SHIFT_CAPACITY_MIN ? 'High' : 'Low';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const invalidRows = rows.filter(r => !r.partNo.trim() || r.reja <= 0);
    if (invalidRows.length > 0) {
      toast.error(t('operatorPlan.invalidRows'));
      return;
    }

    if (hasCriticalShortage) {
      toast.error("Kritik tanqislik: Omborda yetarli material yo'q!", {
        className: 'bg-red-950 text-red-400 border-red-900',
      });
      return;
    }

    // Trigger Active Ops chain reaction
    if (requiredMaterials.length > 0 && !existingPlan) {
      addMaterialRequest(
        `Plan ${productGroup} (Q:${totalReja}) | BATCH-${Math.floor(Math.random() * 90000) + 10000}`,
        requiredMaterials.map(rm => ({
          id: `req-item-${rm.partId}-${Date.now()}`,
          name: rm.name,
          partNumber: rm.partId,
          requiredQty: rm.requiredQty,
          currentStock: rm.currentStock,
          binLocation: rm.bin,
        })),
        'High',
        'Line Replenishment',
        line.name,
      );
      requiredMaterials.forEach(rm => updateMaterialQuantity(rm.partId, -rm.requiredQty));
      toast('WMS Sync Initiated', {
        description: 'M-Req Push Success. Warehouse scanners notified automatically.',
        icon: '🔗',
      });
    }

    const payloadRows = rows.map(r => ({ id: r.id, partNo: r.partNo.trim(), reja: r.reja }));

    if (existingPlan) {
      updateLinePlan(today, line.id, { shift, productOption: productGroup, rows: payloadRows });
      toast.success(t('operatorPlan.planUpdated'));
    } else {
      createLinePlan({
        date: today, lineId: line.id, lineName: line.name, shift,
        productOption: productGroup, productName: line.name, rows: payloadRows,
      });
      toast.success(t('operatorPlan.planSent'));
    }

    onSave();
  };

  const handleManualRequest = (partId: string) => {
    toast.info(`Procurement Alert triggered for ${partId}.`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`!max-w-[95vw] w-full p-0 overflow-hidden bg-transparent border-0 shadow-none pointer-events-auto flex items-center justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isFullscreen ? '!max-w-none h-[100vh] w-[100vw]' : 'h-[95vh]'}`}>

        {/* ── Modal Container (The 95vw / 90vh Cockpit) ── */}
        <div className={`relative flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'h-[90vh] max-w-[95vw]'}`}>

          {/* Deep background gradients inside the modal */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

          {/* ── Cockpit Header ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 md:px-8 py-4 bg-slate-900/50 border-b border-slate-800/80 backdrop-blur-md z-10 w-full">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <DialogTitle className="hidden">Operator Plan</DialogTitle>
                <DialogDescription className="hidden">Create operator plan</DialogDescription>
                <div className="flex items-center gap-3 mb-1.5">
                  <Badge variant="outline" className="text-[10px] leading-none px-2.5 py-1 font-mono font-bold bg-indigo-500/10 text-indigo-400 border-indigo-500/40">APP-ID: ZPP_OPLAN02</Badge>
                  <Badge variant="outline" className="text-[10px] leading-none px-2.5 py-1 font-mono font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/40">STATUS: ONLINE</Badge>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  Production Planning Cockpit <span className="text-slate-500 font-medium">|</span> <span className="text-indigo-400 font-bold">{line.name}</span>
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>

          {/* ── Main Content Area (60/40 Split) ── */}
          <div className="flex-1 overflow-y-auto w-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <form id="operator-cockpit-form" onSubmit={handleSubmit} className="min-h-full p-6 md:p-8">
              <div className="grid grid-cols-1 xl:grid-cols-[6fr_4fr] gap-8 h-full">

                {/* ══════════════ LEFT COLUMN: EXECUTION CONTROL (60%) ══════════════ */}
                <div className="space-y-8 flex flex-col h-full">

                  {/* Workflow Inputs */}
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl">
                    <SectionHeader icon={Fingerprint} title="Execution Control" subtitle="Tactical timeline parameters" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Sana</Label>
                        <div className="h-12 px-4 flex items-center bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-slate-300 shadow-inner">
                          <Clock className="w-4 h-4 text-slate-500 mr-3" />
                          {formattedDate}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Smena *</Label>
                        <Select value={shift} onValueChange={v => setShift(v as Shift)}>
                          <SelectTrigger className="h-12 bg-slate-950 border-slate-800 text-slate-200 rounded-xl font-bold shadow-inner text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl">
                            <SelectItem value="1-smena">☀️ 1-smena</SelectItem>
                            <SelectItem value="2-smena">🌙 2-smena</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Variant *</Label>
                        <Select value={productGroup} onValueChange={v => {
                          setProductGroup(v as ProductOption);
                          setRows([{ id: Date.now().toString(), partNo: `${v}-BASE`, reja: 100 }]);
                        }}>
                          <SelectTrigger className="h-12 bg-slate-950 border-slate-800 text-slate-200 rounded-xl font-black tracking-wide shadow-inner text-sm">
                            <SelectValue placeholder="Variant tanlang" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl">
                            <SelectItem value="MIDNIGHT" className="flex items-center gap-3">
                              <span className="text-xl leading-none">🌑</span> <span>MIDNIGHT</span>
                            </SelectItem>
                            <SelectItem value="URBAN" className="flex items-center gap-3">
                              <span className="text-xl leading-none">🏙️</span> <span>URBAN</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <ShiftTimelineWithMarkers requiredMin={requiredMin} shift={shift} />
                  </div>

                  {/* Grid Order Table */}
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 md:p-8 flex-1 flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <SectionHeader icon={Layers} title="AVTO-YIG'UV GRAFIGI" subtitle="Define the build metrics and part assignments." />
                      <Button type="button" onClick={addRow} size="sm" className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 h-10 px-5 rounded-xl font-black tracking-widest text-[11px] uppercase flex items-center gap-2 transition-all shadow-sm">
                        <Plus className="w-4 h-4" /> ADD ROW
                      </Button>
                    </div>

                    <div className="flex-1 space-y-4">
                      {rows.map((row, idx) => (
                        <div key={row.id} className="grid grid-cols-[30px_1fr_120px_48px] gap-4 items-center p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors shadow-inner">
                          <span className="text-xs text-slate-500 font-mono font-black text-center">{String(idx + 1).padStart(2, '0')}</span>

                          <div>
                            {idx === 0 && <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block">Part Definition</Label>}
                            <PartSearchGrid value={row.partNo} onChange={v => updateRow(row.id, 'partNo', v)} />
                          </div>

                          <div>
                            {idx === 0 && <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 block text-center">Reja</Label>}
                            <Input
                              type="number" min="1" required
                              value={row.reja || ''}
                              onChange={e => updateRow(row.id, 'reja', parseFloat(e.target.value) || 0)}
                              className="h-12 bg-slate-900 border-slate-700 text-slate-100 text-center font-black font-mono text-base rounded-xl shadow-inner focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {rows.length > 1 ? (
                            <div className={idx === 0 ? 'mt-6' : ''}>
                              <button
                                type="button" onClick={() => removeRow(row.id)}
                                className="h-12 w-full rounded-xl flex items-center justify-center text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          ) : <div className="h-12" />}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ══════════════ RIGHT COLUMN: LIVE INTELLIGENCE (40%) ══════════════ */}
                <div className="space-y-8 flex flex-col h-full">

                  {/* Material Matrix */}
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-xl p-6 md:p-8 flex flex-col flex-1 relative overflow-hidden">
                    <SectionHeader icon={PackagePlus} title="Material Matrix" subtitle="EWM Live Stock Synchronization." />

                    {requiredMaterials.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl m-2 bg-slate-950/50">
                        <Search className="w-8 h-8 text-slate-700 mb-4" />
                        <p className="text-xs font-bold tracking-widest uppercase">Select Variant to Generate Matrix</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col space-y-2">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 px-4 pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-3">
                          <span>Component Identity</span>
                          <span className="text-right">Req Qty</span>
                          <span className="text-right">A.Stock</span>
                          <span className="text-center">Status</span>
                          <span className="text-center">Action</span>
                        </div>

                        {/* List Rows */}
                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {requiredMaterials.map(rm => (
                            <div key={rm.partId} className={`grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 items-center p-4 rounded-xl border transition-colors shadow-sm ${rm.shortage ? 'bg-orange-950/30 border-orange-900/50' : 'bg-slate-950 border-slate-800'}`}>

                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-2xl drop-shadow-md leading-none bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">{rm.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 truncate">{rm.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase mt-0.5">{rm.partId}</p>
                                </div>
                              </div>

                              <div className={`text-right text-sm font-mono font-black ${rm.shortage ? 'text-orange-400' : 'text-slate-300'}`}>
                                {rm.requiredQty.toLocaleString()}
                              </div>

                              <div className="text-right text-sm font-mono font-black text-slate-500">
                                {rm.currentStock.toLocaleString()}
                              </div>

                              <div className="flex justify-center items-center">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${rm.shortage ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${rm.shortage ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_5px_currentColor]'}`} />
                                  {rm.shortage ? 'SHORT' : 'READY'}
                                </div>
                              </div>

                              <div className="flex justify-center">
                                {rm.shortage ? (
                                  <button type="button" onClick={() => handleManualRequest(rm.partId)} className="h-8 px-4 w-full bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] border border-orange-500/50 active:scale-95">
                                    REQ WAREHOUSE
                                  </button>
                                ) : (
                                  <div className="h-8 w-full flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-900 rounded-lg border border-slate-800 line-through decoration-slate-600 opacity-50">
                                    LOCKED
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Topology Heatmap */}
                  <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 md:p-8 shrink-0 shadow-xl">
                    <SectionHeader icon={BarChart3} title="Factory Load Topology" subtitle="Cross-line execution concurrency and bottleneck prevention." />
                    <WorkloadHeatmap selectedLine={line.name} />
                  </div>

                </div>

              </div>
            </form>
          </div>

          {/* ── Fixed Footer Action Bar ── */}
          <div className="flex-shrink-0 w-full h-20 bg-slate-950 border-t border-slate-800 z-50 flex items-center relative overflow-hidden pointer-events-auto">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-20" />

            <div className="px-6 md:px-10 w-full flex items-center justify-between">

              {/* Diagnostic Metrics */}
              <div className="flex items-center gap-6 md:gap-10 text-[11px] font-mono uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                  <span className="font-bold">EFFICIENCY:</span> <span className="text-white font-black text-sm">{efficiencyPct}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${readinessPct === 100 ? 'bg-emerald-500 text-emerald-500' : 'bg-orange-500 text-orange-500 animate-pulse'}`} />
                  <span className="font-bold">READINESS:</span> <span className="text-white font-black text-sm">{readinessPct}%</span>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${riskType === 'Low' ? 'bg-emerald-500 text-emerald-500' : riskType === 'High' ? 'bg-amber-500 text-amber-500' : 'bg-orange-500 text-orange-500'}`} />
                  <span className="font-bold">RISK STATUS:</span> <span className="text-white font-black text-sm">{riskType}</span>
                </div>
                <div className="hidden lg:flex items-center gap-3 border-l border-slate-800 pl-10 ml-4">
                  <span className="font-bold">TOTAL CAPACITY TARGET:</span> <span className="text-indigo-400 font-black text-lg">{totalReja.toLocaleString()} <span className="text-xs text-slate-600 ml-1 font-sans font-bold">UNITS</span></span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" onClick={onClose} className="h-12 text-slate-400 hover:text-white hover:bg-slate-900 uppercase tracking-widest text-[11px] font-black px-6">
                  CANCEL OPERATION
                </Button>

                <Button
                  type="submit"
                  form="operator-cockpit-form"
                  disabled={hasCriticalShortage}
                  className={`h-12 px-10 rounded-xl outline-none font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all duration-300 ${hasCriticalShortage
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-50'
                      : readinessPct < 100
                        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.7)] border border-orange-500 animate-pulse'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] border border-indigo-500'
                    }`}
                >
                  EXECUTE / YUBORISH
                  <ChevronRight className={`w-5 h-5 ${hasCriticalShortage ? 'opacity-30' : 'opacity-100'}`} />
                </Button>
              </div>

            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
