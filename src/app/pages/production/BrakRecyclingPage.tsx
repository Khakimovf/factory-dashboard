import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    RecycleIcon, AlertTriangle, Package, Weight, ArrowRight,
    Wrench, Scissors, ChevronDown, CheckCircle2, Clock,
    Loader2, Terminal, X, RefreshCw, TrendingDown, TrendingUp,
    BarChart2, Truck, FlaskConical, Zap, ShieldAlert,
    FileText, PlusCircle, History, Activity
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type DispositionType = 'drabilka' | 'rework' | 'harvest' | null;
type LineSource = 'LINE_1' | 'LINE_2' | 'LINE_3' | 'LINE_4' | 'CUSTOMER_RMA';
type DefectCategory = 'MOLDING_FAULT' | 'RAW_QUALITY' | 'OPERATOR_ERROR' | 'DESIGN_DEVIATION' | 'CONTAMINATION';
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface BrakAkt {
    id: string;
    ts: string;
    partCode: string;
    partName: string;
    source: LineSource;
    category: DefectCategory;
    qty: number;
    weightKg: number;
    disposition: DispositionType;
    status: 'PENDING' | 'PROCESSED' | 'REWORK' | 'HARVESTED';
}

interface LogEntry {
    id: string;
    ts: string;
    level: LogLevel;
    source: string;
    message: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PART_CATALOG = [
    { code: 'DT-FL-001', name: 'Door Trim Front Left' },
    { code: 'DT-FR-002', name: 'Door Trim Front Right' },
    { code: 'DT-RL-003', name: 'Door Trim Rear Left' },
    { code: 'DT-RR-004', name: 'Door Trim Rear Right' },
    { code: 'IP-CTR-005', name: 'Instrument Panel Center' },
    { code: 'PP-FL-006', name: 'Pillar Panel A-Pillar L' },
    { code: 'HS-MT-007', name: 'Headliner Side Mount' },
    { code: 'BMP-FR-008', name: 'Front Bumper Trim Strip' },
    { code: 'TL-LR-009', name: 'Tail Lamp Reflector' },
    { code: 'SKU-NEW-010', name: 'Acoustic Insulation Panel' },
];

const SOURCE_LABELS: Record<LineSource, string> = {
    LINE_1: 'Line 1 — Qovurg\'a stamplash',
    LINE_2: 'Line 2 — Plastik qoliplash',
    LINE_3: 'Line 3 — Yig\'ish va montaj',
    LINE_4: 'Line 4 — Sifat nazorati',
    CUSTOMER_RMA: '🔴 Mijozdan Qaytgan (UzAuto RMA)',
};

const CATEGORY_LABELS: Record<DefectCategory, string> = {
    MOLDING_FAULT: 'Qoliplash Nosozligi (Molding Fault)',
    RAW_QUALITY: "Xom Ashyo Sifati (Raw Quality Issue)",
    OPERATOR_ERROR: "Operator Xatosi (Operator Error)",
    DESIGN_DEVIATION: 'Dizayn Og\'ishi (Design Deviation)',
    CONTAMINATION: 'Ifloslanish (Contamination)',
};

const LOG_TEMPLATES: Array<{ level: LogLevel; source: string; messages: string[] }> = [
    { level: 'INFO',  source: 'recycling.hub',   messages: ['Brak akti #BK-0041 muvaffaqiyatli drabilkaga yuborildi — 42 kg', 'Regranulate batch REG-240 omborga kiritildi', 'RMA qaytarish partiyasi: 23 ta detalь karantinga joylashtirildi'] },
    { level: 'WARN',  source: 'qc.lab',           messages: ['Yuqori brak trendi aniqlandi: Outer Trim Line 2 — qolip bosimini tekshiring', 'Tashqi ko\'rinish defekti: 8 ta panel sink-mark', 'RMA kvota: oy limiti 80% to\'ldi — diqqat talab etiladi'] },
    { level: 'ERROR', source: '1c.inventory',     messages: ['Drabilka massasi kiritishda xatolik — SKU topilmadi: DT-FL-001-SHROT', 'Brak akti raqami takrorlandi: BK-0039 allaqachon mavjud'] },
    { level: 'INFO',  source: 'production.line2', messages: ['Line 2 partiyasi rad etildi. 40 kg plastik shrot Markaziy Drabilkaga yuborildi', 'Operator: Karimov A. — qo\'lda brak reyestri yopildi', 'Smena oxiri: Jami brak 1.8% (norma: <2%)'] },
    { level: 'WARN',  source: 'qc.lab',           messages: ['Tashqi Trim detallarida yuqori og\'ish trendi. Qolip bosimi parametrlarini zudlik bilan tekshiring', 'Line 3 — qayta ishlov bufer to\'lib ketdi (87%)', 'Harvest soat 15:30 da rejalashtirilgan — komponentlarni ajratish'] },
    { level: 'FATAL', source: 'crusher.unit',     messages: ['Drabilka motor harorat ogohlantirishi — 92°C! Texnik xizmat chaqirildi', 'Crusher jam aniqlandi — liniya to\'xtatildi, texnik guruh jo\'natildi'] },
    { level: 'INFO',  source: 'rework.buffer',    messages: ['Qayta ishlov buferi: 12 ta detal tayyor — QC tekshiruviga o\'tkazildi', 'Sub-assembly storage: 340 ta vintlar harvest orqali qaytarildi'] },
];

const SEED_ACTS: BrakAkt[] = [
    { id: 'BK-0039', ts: '08:14:22', partCode: 'DT-FL-001', partName: 'Door Trim Front Left',     source: 'LINE_2',        category: 'MOLDING_FAULT',   qty: 18, weightKg: 38.4, disposition: 'drabilka', status: 'PROCESSED' },
    { id: 'BK-0040', ts: '09:51:07', partCode: 'BMP-FR-008', partName: 'Front Bumper Trim Strip', source: 'CUSTOMER_RMA',  category: 'DESIGN_DEVIATION', qty: 45, weightKg: 112.5, disposition: 'rework',   status: 'REWORK'    },
    { id: 'BK-0041', ts: '10:22:45', partCode: 'IP-CTR-005', partName: 'Instrument Panel Center', source: 'LINE_3',        category: 'CONTAMINATION',   qty: 12, weightKg: 42.0, disposition: 'drabilka', status: 'PROCESSED' },
    { id: 'BK-0042', ts: '11:08:33', partCode: 'PP-FL-006',  partName: 'Pillar Panel A-Pillar L', source: 'LINE_1',        category: 'OPERATOR_ERROR',  qty: 6,  weightKg: 9.6,  disposition: 'harvest',  status: 'HARVESTED' },
];

function generateLog(): LogEntry {
    const tpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const now = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return {
        id: `${Date.now()}-${Math.random()}`,
        ts: `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
        level: tpl.level,
        source: tpl.source,
        message: tpl.messages[Math.floor(Math.random() * tpl.messages.length)],
    };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon, trend, alert }: {
    label: string; value: string; sub: string; color: string;
    icon: any; trend?: 'up' | 'down'; alert?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 backdrop-blur-xl shadow-2xl ${color}`}
        >
            {alert && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
            )}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-tight">{label}</p>
            </div>
            <div>
                <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
                <div className="flex items-center gap-2 mt-1">
                    {trend === 'up'   && <TrendingUp   className="w-3 h-3 text-rose-400" />}
                    {trend === 'down' && <TrendingDown  className="w-3 h-3 text-emerald-400" />}
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{sub}</p>
                </div>
            </div>
        </motion.div>
    );
}

function SelectField({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full appearance-none bg-slate-950/60 border border-slate-800 text-slate-200 text-[11px] font-bold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                >
                    {options.map(o => (
                        <option key={o.value} value={o.value} className="bg-slate-950">{o.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BrakRecyclingPage() {
    // ── Form state
    const [partCode, setPartCode]       = useState(PART_CATALOG[0].code);
    const [source, setSource]           = useState<LineSource>('LINE_2');
    const [category, setCategory]       = useState<DefectCategory>('MOLDING_FAULT');
    const [qty, setQty]                 = useState('');
    const [weightKg, setWeightKg]       = useState('');
    const [disposition, setDisposition] = useState<DispositionType>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Ledger
    const [acts, setActs] = useState<BrakAkt[]>(SEED_ACTS);

    // ── Log stream
    const [logs, setLogs] = useState<LogEntry[]>(() => Array.from({ length: 12 }, generateLog));
    const [streaming, setStreaming] = useState(true);
    const logRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        if (!streaming) return;
        intervalRef.current = setInterval(() => {
            setLogs(prev => [...prev, generateLog()].slice(-80));
        }, 1400 + Math.random() * 1200);
        return () => clearInterval(intervalRef.current);
    }, [streaming]);

    useEffect(() => {
        if (streaming && logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [logs, streaming]);

    // ── Computed KPIs from acts
    const today = acts.filter(a => a.status !== 'REWORK');
    const internalBrakKg   = acts.filter(a => a.source !== 'CUSTOMER_RMA').reduce((s, a) => s + a.weightKg, 0);
    const internalBrakPcs  = acts.filter(a => a.source !== 'CUSTOMER_RMA').reduce((s, a) => s + a.qty, 0);
    const rmaPcs           = acts.filter(a => a.source === 'CUSTOMER_RMA').reduce((s, a) => s + a.qty, 0);
    const regranulateKg    = acts.filter(a => a.disposition === 'drabilka').reduce((s, a) => s + a.weightKg * 0.82, 0);
    const internalBrakRate = ((internalBrakPcs / (internalBrakPcs + 4800)) * 100).toFixed(2);

    const handleDispose = useCallback((type: DispositionType) => {
        if (!qty || !weightKg) {
            toast.error('Miqdor va massa kiritilmagan!');
            return;
        }
        setDisposition(type);
        setIsSubmitting(true);

        const selectedPart = PART_CATALOG.find(p => p.code === partCode)!;
        const newId = `BK-${String(acts.length + 43).padStart(4, '0')}`;
        const now = new Date();
        const p = (n: number) => String(n).padStart(2, '0');

        setTimeout(() => {
            const newAct: BrakAkt = {
                id: newId,
                ts: `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
                partCode,
                partName: selectedPart.name,
                source,
                category,
                qty: parseInt(qty),
                weightKg: parseFloat(weightKg),
                disposition: type,
                status: type === 'drabilka' ? 'PROCESSED' : type === 'rework' ? 'REWORK' : 'HARVESTED',
            };
            setActs(prev => [newAct, ...prev]);
            setQty('');
            setWeightKg('');
            setDisposition(null);
            setIsSubmitting(false);

            const messages: Record<NonNullable<DispositionType>, string> = {
                drabilka: `♻️ ${newId}: ${parseInt(qty)} ta (${parseFloat(weightKg)} kg) Drabilkaga yuborildi. Regranulate ~${(parseFloat(weightKg) * 0.82).toFixed(1)} kg qayd etildi.`,
                rework:   `🛠️ ${newId}: ${parseInt(qty)} ta detal qayta ishlov buferiga yo'naltirildi.`,
                harvest:  `🔧 ${newId}: ${parseInt(qty)} ta detaldan komponentlar ajratib sub-assembly omboriga kiritildi.`,
            };
            toast.success(messages[type!], { duration: 5000 });
        }, 1800);
    }, [qty, weightKg, partCode, source, category, acts.length]);

    const dispositionBtns: Array<{ type: DispositionType; label: string; icon: any; color: string; ring: string }> = [
        { type: 'drabilka', label: '♻️ DRABILKAGA YUBORISH',    icon: RecycleIcon,  color: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20',  ring: 'ring-emerald-500' },
        { type: 'rework',   label: '🛠️ QAYTA ISHLOVGA BERISH',  icon: Wrench,       color: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20',    ring: 'ring-amber-500'   },
        { type: 'harvest',  label: '🔧 KOMPONENTLARNI AJRATISH', icon: Scissors,     color: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/20', ring: 'ring-violet-500'  },
    ];

    const logColors: Record<LogLevel, string> = {
        INFO:  'text-slate-400',
        WARN:  'text-amber-400',
        ERROR: 'text-rose-400',
        FATAL: 'text-rose-500 font-black',
    };

    const statusStyles: Record<BrakAkt['status'], string> = {
        PENDING:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
        PROCESSED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        REWORK:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
        HARVESTED: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    };

    return (
        <div className="min-h-full bg-[#020617] text-slate-100 px-6 py-6 space-y-6">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5"
            >
                <div>
                    <p className="text-[10px] text-rose-400 uppercase tracking-[0.4em] font-black mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse inline-block" />
                        ISHLAB CHIQARISH · DEFECT CONTROL
                    </p>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <RecycleIcon className="w-7 h-7 text-white" />
                        </div>
                        Brak va Qayta Ishlash
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2 ml-1">
                        Defect & Recycling Management Hub · RMA · Drabilka · Harvest Control
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">RMA Karantin: Aktiv</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Drabilka: Online</span>
                    </div>
                </div>
            </motion.div>

            {/* ── KPI Summary Cards ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                    label="Ichki Braklar (Bugun)"
                    value={`${internalBrakRate}%`}
                    sub={`${internalBrakPcs} dona · ${internalBrakKg.toFixed(1)} kg bugun`}
                    color="bg-slate-900/50 border-slate-800"
                    icon={TrendingDown}
                    trend="down"
                />
                <KpiCard
                    label="Mijozdan Qaytgan — UzAuto RMA"
                    value={`${rmaPcs} Pcs`}
                    sub="Karantin hududida — qayta tekshiruv kerak"
                    color="bg-rose-500/5 border-rose-500/20"
                    icon={Truck}
                    trend="up"
                    alert
                />
                <KpiCard
                    label="Drabilka Unumi (Regranulate)"
                    value={`${regranulateKg.toFixed(0)} kg`}
                    sub="Qayta ishlangan xom ashyo — omborga kiritildi"
                    color="bg-emerald-500/5 border-emerald-500/20"
                    icon={RecycleIcon}
                    trend="down"
                />
                <KpiCard
                    label="Harvest Komponentlar"
                    value="340 dona"
                    sub="Vintlar va sub-assembly omboriga qaytarildi"
                    color="bg-violet-500/5 border-violet-500/20"
                    icon={Scissors}
                />
            </div>

            {/* ── Main Two-Column Layout ───────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* LEFT — Brak Akti Form */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-7 space-y-5 backdrop-blur-xl shadow-2xl"
                >
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-white uppercase tracking-tighter">Brak Akti — Yangi Yozuv</h2>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Double-Entry Defect Allocation Form</p>
                        </div>
                    </div>

                    <SelectField
                        label="Detal kodi (Part Code)"
                        value={partCode}
                        onChange={setPartCode}
                        options={PART_CATALOG.map(p => ({ value: p.code, label: `${p.code} — ${p.name}` }))}
                    />
                    <SelectField
                        label="Manba (Source Origin)"
                        value={source}
                        onChange={v => setSource(v as LineSource)}
                        options={Object.entries(SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                    />
                    <SelectField
                        label="Brak sababi (Defect Category)"
                        value={category}
                        onChange={v => setCategory(v as DefectCategory)}
                        options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Miqdor (Qty, dona)</p>
                            <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={e => setQty(e.target.value)}
                                placeholder="0"
                                className="bg-slate-950/60 border border-slate-800 text-slate-200 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500/50 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Massa (kg)</p>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={weightKg}
                                onChange={e => setWeightKg(e.target.value)}
                                placeholder="0.0"
                                className="bg-slate-950/60 border border-slate-800 text-slate-200 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-rose-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Disposition Trigger Buttons */}
                    <div className="space-y-3 pt-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                            Yo'naltirish (Disposition Action)
                        </p>
                        {dispositionBtns.map(btn => (
                            <button
                                key={btn.type}
                                disabled={isSubmitting}
                                onClick={() => handleDispose(btn.type)}
                                className={`w-full py-4 bg-gradient-to-r ${btn.color} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl flex items-center justify-center gap-3 group ${isSubmitting && disposition === btn.type ? `ring-2 ${btn.ring}` : ''}`}
                            >
                                {isSubmitting && disposition === btn.type ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Qayta ishlanmoqda...</>
                                ) : (
                                    <><btn.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />{btn.label}</>
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* RIGHT — Acts Ledger Table */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-[28px] overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col"
                >
                    <div className="flex items-center justify-between gap-4 px-7 py-5 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                                <History className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white uppercase tracking-tighter">Brak Akti Jurnali</h2>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Defect Acts Ledger</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{acts.length} ta yozuv</span>
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-[420px]">
                        <table className="w-full text-left text-[10px]">
                            <thead className="sticky top-0 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
                                <tr className="font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-5 py-3">Akt #</th>
                                    <th className="px-5 py-3">Detal</th>
                                    <th className="px-5 py-3">Kg</th>
                                    <th className="px-5 py-3">Holat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                <AnimatePresence>
                                    {acts.map(act => (
                                        <motion.tr
                                            key={act.id}
                                            initial={{ opacity: 0, backgroundColor: 'rgba(99,102,241,0.08)' }}
                                            animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
                                            transition={{ duration: 0.6 }}
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-5 py-3 font-mono font-black text-indigo-400">{act.id}</td>
                                            <td className="px-5 py-3">
                                                <p className="font-black text-slate-300">{act.partCode}</p>
                                                <p className="text-slate-600 text-[9px]">{act.partName.slice(0, 22)}</p>
                                            </td>
                                            <td className="px-5 py-3 font-black text-white">{act.weightKg.toFixed(1)}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${statusStyles[act.status]}`}>
                                                    {act.status === 'PROCESSED' && <RecycleIcon className="w-2.5 h-2.5" />}
                                                    {act.status === 'REWORK'    && <Wrench    className="w-2.5 h-2.5" />}
                                                    {act.status === 'HARVESTED' && <Scissors  className="w-2.5 h-2.5" />}
                                                    {act.status}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* ── Live Log Stream ──────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-slate-900/50 border border-slate-800 rounded-[28px] overflow-hidden backdrop-blur-xl shadow-2xl"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Production Recycling — Live Log Stream
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {streaming && (
                            <div className="flex items-center gap-1.5">
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                />
                                <span className="text-[8px] font-black text-emerald-500 uppercase">LIVE</span>
                            </div>
                        )}
                        <button
                            onClick={() => setStreaming(p => !p)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${streaming ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
                        >
                            {streaming ? 'PAUSE' : 'RESUME'}
                        </button>
                        <button
                            onClick={() => setLogs([])}
                            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-800 text-slate-600 hover:border-rose-500/30 hover:text-rose-400 transition-all flex items-center gap-1.5"
                        >
                            <X className="w-3 h-3" /> Clear
                        </button>
                    </div>
                </div>

                {/* macOS-style terminal chrome */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-900">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[9px] font-mono text-slate-600 ml-2 uppercase tracking-widest">brak-recycling.log — recycling.hub · qc.lab · crusher.unit</span>
                </div>

                <div
                    ref={logRef}
                    style={{ height: '280px', overflowY: 'auto', display: 'block' }}
                    className="p-4 space-y-0.5 font-mono text-[10px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                >
                    {logs.map(entry => (
                        <div
                            key={entry.id}
                            className={`flex items-start gap-3 py-0.5 px-1 -mx-1 rounded hover:bg-white/[0.02] group cursor-default ${entry.level === 'FATAL' || entry.level === 'ERROR' ? 'bg-rose-500/5' : ''}`}
                        >
                            <span className="text-slate-700 shrink-0 select-none">{entry.ts}</span>
                            <span className={`shrink-0 w-10 text-right uppercase ${entry.level === 'ERROR' || entry.level === 'FATAL' ? 'text-rose-400 font-black' : entry.level === 'WARN' ? 'text-amber-400 font-black' : 'text-slate-500'}`}>
                                {entry.level}
                            </span>
                            <span className="text-indigo-400/60 shrink-0 w-28 truncate">[{entry.source}]</span>
                            <span className={`flex-1 leading-relaxed ${logColors[entry.level]}`}>{entry.message}</span>
                        </div>
                    ))}
                    <div />
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-900/60 bg-slate-950/40">
                    <div className="flex items-center gap-4 text-[8px] font-mono text-slate-700 uppercase">
                        <span>{logs.filter(l => l.level === 'ERROR' || l.level === 'FATAL').length} ERRORS</span>
                        <span>{logs.filter(l => l.level === 'WARN').length} WARNS</span>
                        <span>{logs.length} TOTAL</span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-700">brak-recycling.log · vgm-hub-erp</span>
                </div>
            </motion.div>
        </div>
    );
}
