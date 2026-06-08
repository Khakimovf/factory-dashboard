import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    UploadCloud, Database, ShieldCheck, Server, Cloud,
    CheckCircle2, Clock, AlertCircle, Loader2, Terminal,
    HardDrive, RefreshCw, Zap, FileSpreadsheet, Lock,
    Activity, ArrowRight, X, Download, Archive, Cpu,
    Radio, Bell, Send, ToggleLeft, ToggleRight, Wifi,
    AlertTriangle, ShieldAlert, Package, DollarSign, Truck,
    ChevronDown, ChevronUp, MemoryStick, Network, GitBranch, Layers,
    Boxes, Factory, Users,
    LayoutDashboard, Wrench, Shield, BarChart2, ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { useMaintenance, BroadcastSeverity } from '../../context/MaintenanceContext';
import { useMaintenanceStore, ModuleToggleTree, SubRouteToggle } from '../../store/maintenanceStore';


// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedStagingRow {
    partCode: string;
    partName: string;
    quantity: number;
    isNew: boolean;
    status: 'NEW' | 'UPDATE' | 'SKIP';
}

interface BackupJob {
    id: string;
    label: string;
    schedule: string;
    lastRun: string;
    nextRun: string;
    status: 'ACTIVE' | 'PENDING' | 'FAILED';
    type: 'incremental' | 'full' | 'cloud';
    size?: string;
}

// ─── Mock existing SKUs in system ─────────────────────────────────────────────
const KNOWN_SKUS = new Set([
    '26211286', '26211284', '13536589', '13555291',
    'DT-FL-001', 'DT-FR-002', 'HS-MT-003', 'PL-AB-004'
]);

// ─── CSV / XLSX Parser (pure frontend, no libs needed) ────────────────────────
function parseCSVContent(text: string): ParsedStagingRow[] {
    const lines = text.trim().split('\n');
    const results: ParsedStagingRow[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2 || !cols[0]) continue;

        const partCode = cols[0];
        const partName = cols[1] || `Material ${partCode}`;
        const quantity = parseInt(cols[2] || '0', 10) || 0;
        const isNew = !KNOWN_SKUS.has(partCode);

        results.push({
            partCode,
            partName,
            quantity,
            isNew,
            status: isNew ? 'NEW' : 'UPDATE'
        });
    }
    return results;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, icon: Icon, color }: {
    title: string; subtitle?: string; icon: any; color: string
}) => (
    <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-lg shadow-current/10 shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
            {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
    </div>
);

const StatusBadge = ({ status, label }: { status: 'active' | 'secured' | 'pending' | 'failed'; label: string }) => {
    const styles = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        secured: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    const dots = {
        active: 'bg-emerald-500',
        secured: 'bg-indigo-500',
        pending: 'bg-amber-500 animate-pulse',
        failed: 'bg-rose-500',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
            {label}
        </span>
    );
};

// ─── iOS-style Toggle ─────────────────────────────────────────────────────────
function IOSToggle({ checked, onChange, colorOn = 'bg-emerald-500', colorOff = 'bg-slate-700' }: {
    checked: boolean;
    onChange: () => void;
    colorOn?: string;
    colorOff?: string;
}) {
    return (
        <button
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${checked ? colorOn : colorOff} shadow-inner`}
            role="switch"
            aria-checked={checked}
        >
            <motion.div
                animate={{ x: checked ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
            />
        </button>
    );
}

// ─── Section A: 1C Bulk Importer ─────────────────────────────────────────────

function BulkImporterSection() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fileName, setFileName] = useState('');
    const [stagingRows, setStagingRows] = useState<ParsedStagingRow[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [committed, setCommitted] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const appendLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const runPipeline = useCallback((name: string, content: string) => {
        setIsProcessing(true);
        setProgress(0);
        setLogs([]);
        setStagingRows([]);
        setCommitted(false);
        setFileName(name);

        const timestamp = () => new Date().toLocaleTimeString('ru-RU', { hour12: false });

        const steps = [
            { pct: 12, delay: 300, log: `[${timestamp()}] 📂 Fayl qabul qilindi: "${name}"` },
            { pct: 28, delay: 600, log: `[${timestamp()}] ⚡ Kodlash va format tekshiruvi (UTF-8 / Excel BOM strip)...` },
            { pct: 45, delay: 900, log: `[${timestamp()}] 🔍 Ustun sxemasini aniqlash: part_code, part_name, quantity` },
            { pct: 62, delay: 1200, log: `[${timestamp()}] 🧬 ERP Master Directory bilan SKU mosligini tekshirish...` },
            { pct: 80, delay: 1500, log: `[${timestamp()}] 📊 Duplikat va noto'g'ri ma'lumotlarni filterlash...` },
            { pct: 100, delay: 1800, log: `[${timestamp()}] ✅ Staging muhiti tayyor! Commit uchun tasdiq kutilmoqda.` },
        ];

        let i = 0;
        const tick = () => {
            if (i >= steps.length) {
                const parsed = parseCSVContent(content);
                setStagingRows(parsed);
                setIsProcessing(false);
                return;
            }
            const step = steps[i];
            setTimeout(() => {
                setProgress(step.pct);
                appendLog(step.log);
                i++;
                tick();
            }, i === 0 ? 0 : steps[i - 1].delay);
        };
        tick();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => runPipeline(file.name, ev.target?.result as string || '');
        reader.readAsText(file);
    }, [runPipeline]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => runPipeline(file.name, ev.target?.result as string || '');
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleSimulateDemo = () => {
        const demoCSV = `part_code,part_name,quantity
SKU-NEW-001,Kapot ichki plita (L),450
SKU-NEW-002,Kapot ichki plita (R),450
SKU-NEW-003,Bampyer tutqichi plastik,320
26211286,Door Trim Inner Panel Left,1250
26211284,Door Trim Inner Panel Right,980
SKU-NEW-004,Akustik izolyatsiya panel,890
13536589,M6 Hexagonal Flange Bolt,45000
SKU-NEW-005,Torpeda qopqog'i seti,210
SKU-NEW-006,Orqa chiroq ramka L,670
SKU-NEW-007,Orqa chiroq ramka R,670`;
        runPipeline('1C_Factory_Export_2026-06-06.csv', demoCSV);
    };

    const handleCommit = () => {
        if (!stagingRows.length) return;
        setIsCommitting(true);
        setTimeout(() => {
            setIsCommitting(false);
            setCommitted(true);
            toast.success(
                `✅ Bazaga yuklash muvaffaqiyatli! ${stagingRows.length} ta qator kiritildi (${stagingRows.filter(r => r.isNew).length} yangi SKU).`,
                { duration: 5000 }
            );
        }, 2200);
    };

    const newCount = stagingRows.filter(r => r.isNew).length;
    const updateCount = stagingRows.filter(r => !r.isNew).length;
    const dataHealth = stagingRows.length > 0 && stagingRows.every(r => r.quantity >= 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-8 space-y-6 backdrop-blur-xl shadow-2xl"
        >
            <SectionHeader
                title="Ma'lumotlar Migratsiyasi"
                subtitle="1C BULK DATA IMPORT — Factory Database Staging Engine"
                icon={FileSpreadsheet}
                color="bg-indigo-600"
            />

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                    isDragging
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-[0_0_40px_rgba(99,102,241,0.15)]'
                        : 'border-slate-700 hover:border-indigo-500/40 bg-slate-950/40'
                } ${isProcessing ? 'pointer-events-none' : ''}`}
            >
                <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                />

                {isProcessing ? (
                    <div className="p-10 space-y-5">
                        <div className="flex items-center justify-center gap-3 text-indigo-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="font-black uppercase text-sm tracking-widest">Parsing Pipeline Active...</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-center text-xs text-slate-500 font-bold uppercase">{progress}% complete</p>
                    </div>
                ) : (
                    <label
                        htmlFor="csv-upload-trigger"
                        className="cursor-pointer flex flex-col items-center justify-center p-10 gap-4 group"
                        onClick={() => fileRef.current?.click()}
                    >
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-indigo-500/40 group-hover:bg-slate-900/80 transition-all shadow-xl">
                            <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-white uppercase tracking-tight">
                                [ 📂 UPLOAD FACTORY DATABASE STAGING SHEET (1C EXPORT) ]
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                                .xlsx · .csv · Drag & Drop · Max 50MB
                            </p>
                        </div>
                    </label>
                )}
            </div>

            {/* Demo Button */}
            {!isProcessing && stagingRows.length === 0 && (
                <button
                    onClick={handleSimulateDemo}
                    className="w-full py-3 border border-slate-700 hover:border-indigo-500/50 rounded-xl text-[11px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-all tracking-widest flex items-center justify-center gap-2"
                >
                    <Zap className="w-3.5 h-3.5" />
                    Demo: 1C Eksport fayli bilan simulyatsiya qilish
                </button>
            )}

            {/* Terminal Logs */}
            <AnimatePresence>
                {logs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/70 rounded-xl p-4 border border-slate-900 font-mono text-[9px] space-y-1 max-h-36 overflow-y-auto"
                    >
                        <p className="text-indigo-400 font-black uppercase flex items-center gap-1.5 border-b border-white/5 pb-1.5 mb-2">
                            <Terminal className="w-3 h-3" /> Import Pipeline Log
                        </p>
                        {logs.map((log, i) => (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, x: -4 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-slate-400"
                            >
                                {log}
                            </motion.p>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Staging Summary Table */}
            <AnimatePresence>
                {stagingRows.length > 0 && !committed && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Health Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                {
                                    label: 'Total SKU Rows Processed',
                                    value: stagingRows.length,
                                    color: 'text-white',
                                    bg: 'bg-slate-800/60 border-slate-700'
                                },
                                {
                                    label: 'New Material Records Detected',
                                    value: newCount,
                                    color: 'text-emerald-400',
                                    bg: 'bg-emerald-500/5 border-emerald-500/20'
                                },
                                {
                                    label: 'Existing Records (Update)',
                                    value: updateCount,
                                    color: 'text-amber-400',
                                    bg: 'bg-amber-500/5 border-amber-500/20'
                                },
                            ].map((item) => (
                                <div key={item.label} className={`${item.bg} border rounded-2xl p-4 flex flex-col gap-2`}>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">{item.label}</span>
                                    <span className={`text-3xl font-black ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Data Health */}
                        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${dataHealth ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                            {dataHealth
                                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                            }
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${dataHealth ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    DATA HEALTH STATUS:{' '}
                                    {dataHealth ? '🟢 READY FOR MATRIX INSERT' : '🔴 VALIDATION ERRORS DETECTED'}
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase">
                                    Staging file: {fileName} · {stagingRows.length} rows · {newCount} new · {updateCount} updates
                                </p>
                            </div>
                        </div>

                        {/* Row Preview Table */}
                        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staging Preview (top rows)</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800/60 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                            <th className="px-5 py-3">Part Code</th>
                                            <th className="px-5 py-3">Part Name</th>
                                            <th className="px-5 py-3 text-right">Qty</th>
                                            <th className="px-5 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/30">
                                        {stagingRows.slice(0, 8).map((row, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-5 py-3 font-mono text-[10px] text-indigo-400 font-black">{row.partCode}</td>
                                                <td className="px-5 py-3 text-[11px] text-slate-300 font-bold">{row.partName}</td>
                                                <td className="px-5 py-3 text-right font-black text-white text-[11px]">{row.quantity.toLocaleString()}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                                        row.isNew
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {stagingRows.length > 8 && (
                                            <tr>
                                                <td colSpan={4} className="px-5 py-3 text-center text-[9px] text-slate-600 font-bold uppercase italic">
                                                    + {stagingRows.length - 8} ta qo'shimcha qator...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Commit Button */}
                        <button
                            onClick={handleCommit}
                            disabled={isCommitting || !dataHealth}
                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3 group"
                        >
                            {isCommitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Bazaga yozilmoqda...
                                </>
                            ) : (
                                <>
                                    <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    [ EXECUTE DB BULK INSERT (BAZAGA YUKLASH) ]
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success State */}
            <AnimatePresence>
                {committed && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-4"
                    >
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-sm font-black text-emerald-400 uppercase tracking-tight">Muvaffaqiyatli Yakunlandi!</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                                {stagingRows.length} qator · {newCount} yangi SKU · {updateCount} yangilandi · Warehouse registry sync'landi
                            </p>
                        </div>
                        <button
                            onClick={() => { setStagingRows([]); setCommitted(false); setLogs([]); setFileName(''); }}
                            className="ml-auto p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Section B: Backup & Disaster Recovery ────────────────────────────────────

const BACKUP_JOBS: BackupJob[] = [
    {
        id: 'bk-daily',
        label: 'Daily Incremental Backup',
        schedule: 'Every day at 02:00 AM',
        lastRun: 'Today, 02:00 AM',
        nextRun: 'Tomorrow, 02:00 AM',
        status: 'ACTIVE',
        type: 'incremental',
        size: '1.2 GB',
    },
    {
        id: 'bk-weekly',
        label: 'Weekly Full Encryption Snapshot',
        schedule: 'Every Sunday at 00:00',
        lastRun: 'Sun 01.06.2026, 00:00',
        nextRun: 'Sun 08.06.2026, 00:00',
        status: 'ACTIVE',
        type: 'full',
        size: '8.7 GB',
    },
    {
        id: 'bk-cloud',
        label: 'Offsite Cloud Replication',
        schedule: 'Continuous (delta sync)',
        lastRun: 'Live',
        nextRun: 'Continuous',
        status: 'ACTIVE',
        type: 'cloud',
        size: 'S3 / DigitalOcean Spaces',
    },
];

const MODULE_REGISTRY = [
    { label: 'Warehouse Inventory Logs', icon: HardDrive, color: 'text-blue-400' },
    { label: 'General Ledger (GL Entries)', icon: Database, color: 'text-emerald-400' },
    { label: 'B2B Contract Spec Tables', icon: Archive, color: 'text-indigo-400' },
    { label: 'HR & Payroll Registry', icon: Cpu, color: 'text-violet-400' },
    { label: 'Production Line Telemetry', icon: Activity, color: 'text-amber-400' },
];

function BackupSection() {
    const [isCapturing, setIsCapturing] = useState(false);
    const [captureProgress, setCaptureProgress] = useState(0);
    const [captureModule, setCaptureModule] = useState('');
    const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
    const [capturedModules, setCapturedModules] = useState<string[]>([]);

    const handleManualSnapshot = async () => {
        if (isCapturing) return;
        setIsCapturing(true);
        setCaptureProgress(0);
        setCapturedModules([]);

        const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

        for (let i = 0; i < MODULE_REGISTRY.length; i++) {
            const mod = MODULE_REGISTRY[i];
            setCaptureModule(mod.label);
            setCaptureProgress(Math.round(((i) / MODULE_REGISTRY.length) * 100));
            await delay(420);
            setCapturedModules(prev => [...prev, mod.label]);
        }

        setCaptureProgress(100);
        await delay(400);
        setIsCapturing(false);

        const now = new Date();
        const snapshotId = `SNAP-${now.toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
        setLastSnapshot(snapshotId);

        toast.success(
            `🔒 Manual Snapshot yaratildi: ${snapshotId}\n5 ta modul muvaffaqiyatli arxivlandi · Offsite replikatsiya boshlandi.`,
            { duration: 6000 }
        );
    };

    const getJobBadgeStatus = (job: BackupJob): 'active' | 'secured' | 'pending' | 'failed' => {
        if (job.type === 'cloud') return 'secured';
        if (job.status === 'ACTIVE') return 'active';
        if (job.status === 'PENDING') return 'pending';
        return 'failed';
    };

    const getJobBadgeLabel = (job: BackupJob) => {
        if (job.type === 'cloud') return '🔒 SECURED & SYNCED';
        return '🟢 ACTIVE';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-8 space-y-6 backdrop-blur-xl shadow-2xl"
        >
            <SectionHeader
                title="Tizim Xavfsizligi & Zaxira Nusxalash"
                subtitle="BACKUP ENGINE — Automated Disaster Recovery Infrastructure"
                icon={ShieldCheck}
                color="bg-emerald-600"
            />

            {/* Cron Schedule Cards */}
            <div className="grid grid-cols-1 gap-4">
                {BACKUP_JOBS.map((job) => (
                    <motion.div
                        key={job.id}
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-5 p-5 bg-slate-950/60 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group"
                    >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                            job.type === 'cloud'
                                ? 'bg-indigo-500/10 border-indigo-500/20'
                                : job.type === 'full'
                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                            {job.type === 'cloud'
                                ? <Cloud className="w-6 h-6 text-indigo-400" />
                                : job.type === 'full'
                                ? <Lock className="w-6 h-6 text-emerald-400" />
                                : <HardDrive className="w-6 h-6 text-blue-400" />
                            }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <p className="font-black text-white uppercase text-xs tracking-tight">{job.label}</p>
                                <StatusBadge status={getJobBadgeStatus(job)} label={getJobBadgeLabel(job)} />
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Last: {job.lastRun}
                                </span>
                                <span className="flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Next: {job.nextRun}
                                </span>
                                {job.size && (
                                    <span className="flex items-center gap-1">
                                        <Server className="w-3 h-3" /> {job.size}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status indicator */}
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse shrink-0" />
                    </motion.div>
                ))}
            </div>

            {/* Infrastructure metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Uptime', value: '99.98%', color: 'text-emerald-400', sub: '30-day avg' },
                    { label: 'Backups Today', value: '3', color: 'text-blue-400', sub: 'incremental' },
                    { label: 'Recovery Point', value: '< 2h', color: 'text-amber-400', sub: 'RPO target' },
                    { label: 'Encrypted', value: 'AES-256', color: 'text-indigo-400', sub: 'all snapshots' },
                ].map(m => (
                    <div key={m.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-center">
                        <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                        <p className="text-[9px] font-black text-white uppercase tracking-wider mt-1">{m.label}</p>
                        <p className="text-[8px] text-slate-600 font-bold uppercase">{m.sub}</p>
                    </div>
                ))}
            </div>

            {/* Module Capture Progress (shown during snapshot) */}
            <AnimatePresence>
                {isCapturing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase">
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                Snapshot capturing... {captureModule}
                            </span>
                            <span className="text-emerald-400">{captureProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                animate={{ width: `${captureProgress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {MODULE_REGISTRY.map((mod) => {
                                const done = capturedModules.includes(mod.label);
                                const active = captureModule === mod.label;
                                return (
                                    <div
                                        key={mod.label}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                                            done
                                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                                : active
                                                ? 'bg-slate-800 border border-slate-700 text-white'
                                                : 'bg-slate-950/40 border border-slate-800/50 text-slate-600'
                                        }`}
                                    >
                                        <mod.icon className={`w-4 h-4 ${done ? 'text-emerald-400' : active ? mod.color : 'text-slate-700'}`} />
                                        {mod.label}
                                        {done && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-emerald-500" />}
                                        {active && <Loader2 className="w-3.5 h-3.5 ml-auto animate-spin" />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Last snapshot badge */}
            {lastSnapshot && !isCapturing && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl"
                >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                            Snapshot muvaffaqiyatli yaratildi
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">{lastSnapshot}</p>
                    </div>
                    <Download className="w-4 h-4 text-slate-500 hover:text-emerald-400 cursor-pointer transition-colors" />
                </motion.div>
            )}

            {/* Manual Snapshot Button */}
            <button
                onClick={handleManualSnapshot}
                disabled={isCapturing}
                className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 group"
            >
                {isCapturing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Snapshot olinmoqda...
                    </>
                ) : (
                    <>
                        <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        [ CREATE MANUAL SNAPSHOT NOW (HOZIRDAN BACKUP OLISH) ]
                        <Zap className="w-5 h-5" />
                    </>
                )}
            </button>
        </motion.div>
    );
}

// ─── Section C: Global Broadcast Engine ──────────────────────────────────────

const BROADCAST_TARGETS = [
    { id: 'all', label: '[ ALL MODULES ]', icon: Wifi, color: 'indigo' },
    { id: 'warehouse', label: '[ LOGISTIKA VA OMBOR ]', icon: Package, color: 'blue' },
    { id: 'gate', label: '[ GATE CONTROL TERMINAL ]', icon: Truck, color: 'amber' },
    { id: 'finance', label: '[ MOLIYA (FI/CO) ]', icon: DollarSign, color: 'violet' },
];

function BroadcastSection() {
    const { sendBroadcast } = useMaintenance();
    const [selectedTargets, setSelectedTargets] = useState<string[]>(['all']);
    const [severity, setSeverity] = useState<BroadcastSeverity>('info');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [lastSent, setLastSent] = useState<string | null>(null);

    // Dropdown toggle state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTarget = (id: string) => {
        if (id === 'all') {
            setSelectedTargets(['all']);
            return;
        }
        setSelectedTargets(prev => {
            const withoutAll = prev.filter(t => t !== 'all');
            const exists = withoutAll.includes(id);
            const next = exists
                ? withoutAll.filter(t => t !== id)
                : [...withoutAll, id];
            
            const individualIds = BROADCAST_TARGETS.filter(t => t.id !== 'all').map(t => t.id);
            const allSelected = individualIds.every(indId => next.includes(indId));
            if (allSelected || next.length === 0) {
                return ['all'];
            }
            return next;
        });
    };

    const handleSend = () => {
        if (!message.trim()) {
            toast.error('Xabar matni kiritilmadi');
            return;
        }
        setIsSending(true);
        setTimeout(() => {
            const targetLabels = selectedTargets.includes('all')
                ? ['ALL MODULES']
                : selectedTargets.map(id => BROADCAST_TARGETS.find(t => t.id === id)?.label ?? id);

            sendBroadcast({
                message: message.trim(),
                severity,
                targets: targetLabels,
            });
            setLastSent(new Date().toLocaleTimeString('uz-UZ'));
            setIsSending(false);
            setMessage('');
            toast.success('📡 Broadcast muvaffaqiyatli yuborildi!', { duration: 3000 });
        }, 1400);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-8 space-y-6 backdrop-blur-xl shadow-2xl animate-fade-in"
        >
            <SectionHeader
                title="Global System Broadcast Engine"
                subtitle="Bo'limlarga Xabar Yuborish — Administrative Alert Dispatch"
                icon={Radio}
                color="bg-violet-600"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT — target + severity */}
                <div className="space-y-5">
                    {/* Target Audience Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">
                            Target Audience (Maqsadli Bo'limlar)
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(p => !p)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl text-left text-xs transition-all duration-200 cursor-pointer shadow-inner"
                        >
                            <span className="truncate text-slate-300 font-bold">
                                {selectedTargets.includes('all')
                                    ? '[ ALL MODULES ]'
                                    : BROADCAST_TARGETS.filter(t => selectedTargets.includes(t.id)).map(t => t.label).join(', ')
                                }
                            </span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 z-[100] mt-2 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-xl p-2 space-y-1"
                                >
                                    {BROADCAST_TARGETS.map(t => {
                                        const isSelected = selectedTargets.includes(t.id);
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => toggleTarget(t.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors text-left ${
                                                    isSelected
                                                        ? 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                                                        : 'text-slate-400 hover:bg-slate-800/60 border border-transparent'
                                                }`}
                                            >
                                                <t.icon className="w-3.5 h-3.5" />
                                                <span className="flex-1">{t.label}</span>
                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? 'bg-violet-500 border-violet-400'
                                                        : 'border-slate-700 bg-slate-950'
                                                }`}>
                                                    {isSelected && <CheckCircle2 className="w-2 text-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Severity Switcher */}
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">
                            Alert Severity (Xabar Darajasi)
                        </p>
                        <div className="flex gap-2">
                            {([
                                { id: 'info' as const, label: 'Info (Sariq)', icon: Bell, active: 'bg-amber-500/15 border-amber-500/40 text-amber-300' },
                                { id: 'critical' as const, label: 'Critical (Qizil)', icon: ShieldAlert, active: 'bg-rose-500/15 border-rose-500/40 text-rose-300' },
                            ]).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSeverity(s.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                                        severity === s.id
                                            ? s.active
                                            : 'border-slate-800 text-slate-600 hover:border-slate-700'
                                    }`}
                                >
                                    <s.icon size={13} />
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Last sent info */}
                    {lastSent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/5 border border-violet-500/20 rounded-xl"
                        >
                            <Wifi className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                            <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">
                                Last broadcast at {lastSent}
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* RIGHT — message + send */}
                <div className="space-y-4 flex flex-col">
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">
                            Xabar Matni (Message Body)
                        </p>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Tizim yangilanishi sababli 10 daqiqadan so'ng profilaktika boshlanadi..."
                            rows={6}
                            className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-200 placeholder-slate-600 font-medium resize-none focus:outline-none focus:border-violet-500/50 focus:bg-slate-900/60 transition-all"
                        />
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1.5 text-right">
                            {message.length} / 280
                        </p>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isSending || !message.trim()}
                        className="mt-auto w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-violet-500/20 flex items-center justify-center gap-3 group"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uzatilmoqda...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                🛰️ BROADCAST SYSTEM ALERT
                                <Radio className="w-5 h-5 animate-pulse" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Section D: Module Live Toggles ──────────────────────────────────────────

// ─── Section D: Module Live Toggles ──────────────────────────────────────────

const PARENT_ICONS: Record<string, any> = {
    dashboard:        LayoutDashboard,
    warehouse_logistics: Boxes,
    maintenance_tech: Wrench,
    production_plan:  Factory,
    hr_service:       Users,
    vgm_transport:    Shield,
    reports_intel:    BarChart2,
    finance_co:       DollarSign,
    procurement_mm:   ShoppingCart,
};

const PARENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    dashboard:        { bg: 'from-sky-500/10 to-blue-500/5',      border: 'border-sky-500/20',     text: 'text-sky-400' },
    warehouse_logistics: { bg: 'from-blue-500/10 to-indigo-500/5',  border: 'border-blue-500/20',    text: 'text-blue-400' },
    maintenance_tech: { bg: 'from-orange-500/10 to-red-500/5',    border: 'border-orange-500/20',  text: 'text-orange-400' },
    production_plan:  { bg: 'from-emerald-500/10 to-teal-500/5',  border: 'border-emerald-500/20', text: 'text-emerald-400' },
    hr_service:       { bg: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-500/20',  text: 'text-violet-400' },
    vgm_transport:    { bg: 'from-amber-500/10 to-yellow-500/5',  border: 'border-amber-500/20',   text: 'text-amber-400' },
    reports_intel:    { bg: 'from-cyan-500/10 to-teal-500/5',     border: 'border-cyan-500/20',    text: 'text-cyan-400' },
    finance_co:       { bg: 'from-amber-500/10 to-yellow-500/5',  border: 'border-amber-500/20',   text: 'text-amber-400' },
    procurement_mm:   { bg: 'from-rose-500/10 to-pink-500/5',     border: 'border-rose-500/20',    text: 'text-rose-400' },
};

function ModuleTogglesSection() {
    const rawModules = useMaintenanceStore((state) => state.modules);
    // Guard: if Zustand hydration returns undefined (e.g. stale/corrupt persisted state)
    const modules = rawModules ?? [];
    const toggleParent = useMaintenanceStore((state) => state.toggleParent);
    const toggleSubRoute = useMaintenanceStore((state) => state.toggleSubRoute);

    // Expand state for accordion sections
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        dashboard:           true,
        warehouse_logistics: false,
        maintenance_tech:    false,
        production_plan:     false,
        hr_service:          false,
        vgm_transport:       false,
        reports_intel:       false,
        finance_co:          false,
        procurement_mm:      false,
    });

    const toggleExpanded = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleParentToggle = (parentId: string, label: string) => {
        const mod = modules.find(m => m.id === parentId);
        if (!mod) return;
        const willEnable = !mod.enabled;
        toggleParent(parentId);
        if (willEnable) {
            toast.success(`✅ ${label.toUpperCase()} GLOBAL ACTIVE — barcha sub-routelar yoqildi`, { duration: 3500 });
        } else {
            toast.warning(`⚠️ ${label.toUpperCase()} GLOBAL MAINTENANCE LOCK — barcha sub-routelar muzlatildi`, { duration: 4500 });
        }
    };

    const handleSubToggle = (parentId: string, subRouteId: string, label: string) => {
        const mod = modules.find(m => m.id === parentId);
        if (!mod) return;
        if (!mod.enabled) {
            toast.error(`❌ Global lock faol. Avval ${mod.label} master switchini yoqing!`);
            return;
        }

        const sub = mod.subRoutes.find(r => r.id === subRouteId);
        if (!sub) return;
        const willEnable = !sub.enabled;
        toggleSubRoute(parentId, subRouteId);
        if (willEnable) {
            toast.success(`✅ ${label} faollashtirildi`, { duration: 3000 });
        } else {
            toast.warning(`⚠️ ${label} o'chirildi — ushbu yo'nalish bloklandi`, { duration: 3500 });
        }
    };

    // Calculate total locked sub-routes (guard subRoutes in case of stale persisted data)
    const lockedCount = modules.reduce((count, mod) => {
        const subs = mod.subRoutes ?? [];
        if (!mod.enabled) {
            return count + subs.length;
        }
        return count + subs.filter(r => !r.enabled).length;
    }, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-8 space-y-6 backdrop-blur-xl shadow-2xl"
        >
            <div className="flex items-start justify-between gap-4">
                <SectionHeader
                    title="Core System Status & Live Toggles"
                    subtitle="Nested Hierarchical Toggle Tree — Maintenance Mode Override"
                    icon={ToggleRight}
                    color="bg-rose-600"
                />
            </div>

            {/* Lock summary banner */}
            <AnimatePresence>
                {lockedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl"
                    >
                        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                            {lockedCount} ta sub-route maintenance rejimida — operatorlar kirishi bloklangan
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsible Accordion Toggles Tree */}
            <div className="space-y-4">
                {modules.map((mod) => {
                    const isExpanded = !!expanded[mod.id];
                    const isParentEnabled = mod.enabled;
                    const Icon = PARENT_ICONS[mod.id] || Boxes;
                    // Guard: PARENT_COLORS[mod.id] may be undefined if persisted store has an unknown id
                    const FALLBACK_COLOR = { bg: 'from-slate-500/10 to-slate-500/5', border: 'border-slate-500/20', text: 'text-slate-400' };
                    const LOCKED_COLOR   = { bg: 'from-rose-500/5 to-red-500/2', border: 'border-rose-500/20', text: 'text-rose-400' };
                    const colors = isParentEnabled
                        ? (PARENT_COLORS[mod.id] ?? FALLBACK_COLOR)
                        : LOCKED_COLOR;

                    // Guard: subRoutes may be missing in stale persisted data
                    const subRoutes = mod.subRoutes ?? [];
                    const parentLockedCount = !isParentEnabled ? subRoutes.length : subRoutes.filter(r => !r.enabled).length;

                    return (
                        <div
                            key={mod.id}
                            className={`rounded-2xl border bg-gradient-to-br transition-all duration-300 ${colors.bg} ${colors.border}`}
                        >
                            {/* Accordion Header Row */}
                            <div className="flex items-center justify-between gap-4 p-5">
                                {/* Clicking the details area expands the card */}
                                <div 
                                    onClick={() => toggleExpanded(mod.id)}
                                    className="flex-1 flex items-center gap-4 cursor-pointer select-none group"
                                >
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                        isParentEnabled ? 'bg-slate-900 border-slate-800' : 'bg-rose-950/20 border-rose-500/30'
                                    }`}>
                                        {!isParentEnabled ? (
                                            <Lock className="w-5 h-5 text-rose-400" />
                                        ) : (
                                            <Icon className={`w-5 h-5 ${colors.text} group-hover:scale-110 transition-transform`} />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <h3 className="font-black text-white uppercase text-sm tracking-tight">{mod.label}</h3>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                ({mod.globalKey})
                                            </span>
                                            {parentLockedCount > 0 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[8px] font-black text-rose-400 uppercase tracking-wider animate-pulse">
                                                    {parentLockedCount} Locked
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                                            {subRoutes.length} ta granular sub-route · Click to {isExpanded ? 'collapse' : 'expand'}
                                        </p>
                                    </div>

                                    {/* Chevron indicator */}
                                    <motion.div
                                        animate={{ rotate: isExpanded ? 180 : 0 }}
                                        className="text-slate-500 group-hover:text-white ml-2 shrink-0"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </motion.div>
                                </div>

                                {/* Global Toggle switch (stays clickable even if we click elsewhere to expand) */}
                                <div className="flex items-center gap-3 shrink-0 pl-4 border-l border-slate-800/40">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                        isParentEnabled ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                        {isParentEnabled ? 'GLOBAL ON' : 'GLOBAL OFF'}
                                    </span>
                                    <IOSToggle
                                        checked={isParentEnabled}
                                        onChange={() => handleParentToggle(mod.id, mod.label)}
                                        colorOn="bg-emerald-500"
                                        colorOff="bg-rose-600"
                                    />
                                </div>
                            </div>

                            {/* Accordion Nested Child Routes Tree */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="overflow-hidden border-t border-slate-800/50 bg-black/20"
                                    >
                                        <div className="relative pl-12 pr-6 py-5 space-y-3">
                                            {/* Tree connecting vertical line */}
                                            <div className="absolute left-[34px] top-0 bottom-8 w-px bg-slate-800" />

                                            {subRoutes.map((sub) => {
                                                const isChildEnabled = isParentEnabled && sub.enabled;
                                                
                                                return (
                                                    <div 
                                                        key={sub.id}
                                                        className={`relative flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                                                            isChildEnabled 
                                                                ? 'bg-slate-950/40 border-slate-900/60 hover:border-slate-800/60 hover:bg-slate-950/80' 
                                                                : 'bg-rose-950/5 border-rose-950/20 opacity-70'
                                                        }`}
                                                    >
                                                        {/* Dotted horizontal tree branch line */}
                                                        <div className="absolute -left-[18px] top-1/2 w-4 h-px bg-slate-800" />
                                                        
                                                        {/* Child Label & Route info */}
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                                                                isChildEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                                                            }`} />
                                                            <div>
                                                                <span className={`text-[11px] font-black uppercase tracking-tight ${
                                                                    isChildEnabled ? 'text-slate-300' : 'text-slate-500 line-through'
                                                                }`}>
                                                                    {sub.label}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[8px] text-slate-600 font-mono">
                                                                        Prefix: {sub.pathPrefixes.join(', ')}
                                                                    </span>
                                                                    {!isParentEnabled && (
                                                                        <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded-md">
                                                                            <Lock size={8} /> Parent Locked
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Child Switch Toggle */}
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                                isChildEnabled ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                                {isChildEnabled ? 'ON' : 'OFF'}
                                                            </span>
                                                            <IOSToggle
                                                                checked={isChildEnabled}
                                                                onChange={() => handleSubToggle(mod.id, sub.id, sub.label)}
                                                                colorOn="bg-emerald-500"
                                                                colorOff="bg-rose-600"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-slate-800/60">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ON — Sub-route faol, kirish ochiq</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-600" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">OFF — Maintenance lock, kirish bloklangan</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[7px] font-black uppercase text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                        <Lock size={8} /> Parent Locked
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Master switch o'chirilgan ( visual freeze )</span>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Section E: Live Log Stream ────────────────────────────────────────────────

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'FATAL' | 'TRACE';

interface LogEntry {
    id: string;
    level: LogLevel;
    source: string;
    message: string;
    ts: string;
}

const LOG_LEVEL_STYLES: Record<LogLevel, string> = {
    INFO: 'text-slate-400',
    DEBUG: 'text-blue-400/70',
    TRACE: 'text-slate-600',
    WARN: 'text-amber-400',
    ERROR: 'text-rose-400',
    FATAL: 'text-rose-500 font-black',
};

const LOG_TEMPLATES: Array<{ level: LogLevel; source: string; messages: string[] }> = [
    { level: 'INFO', source: 'db.conn', messages: ['Connection pool: 12/32 active', 'Heartbeat OK — latency 2ms', 'Query cache hit ratio: 94.2%'] },
    { level: 'DEBUG', source: 'api.gateway', messages: ['GET /api/v1/warehouse/materials 200 (34ms)', 'POST /api/v1/finance/ledger 201 (88ms)', 'WebSocket ping-pong OK'] },
    { level: 'TRACE', source: 'scheduler', messages: ['CronJob bk-daily tick — next in 21h 40m', 'CronJob bk-weekly tick — next in 6d 21h', 'Cache sweep: 2,341 keys evicted'] },
    { level: 'INFO', source: '1c.importer', messages: ['Staging buffer cleared — 0 rows pending', 'Last bulk insert: 0 errors, 10 rows committed', 'Index rebuild complete — warehouse.materials'] },
    { level: 'ERROR', source: '1c.importer', messages: ['Failed bulk 1C insert — validation mismatch on SKU-992', '1C integration fault — invalid API payload signature'] },
    { level: 'FATAL', source: '1c.importer', messages: ['1C Connection timeout — retry count exceeded (3/3)', 'Database transaction rolled back due to dead lock on 1C sync'] },
    { level: 'WARN', source: 'disk.io', messages: ['Write buffer 72% full — consider flush', 'Slow query detected: 412ms on gl_entries join', 'Replication lag: 180ms (threshold: 500ms)'] },
    { level: 'DEBUG', source: 'net.heartbeat', messages: ['AWS S3 sync OK — delta 1.2MB uploaded', 'Redis cluster: all 3 nodes reachable', 'Nginx upstream health: 4/4 backends alive'] },
    { level: 'ERROR', source: 'auth.middleware', messages: ['Failed login attempt — user: unknown (IP: 192.168.1.44)', 'Token refresh rejected — expired', 'Rate limit hit — 429 returned to 10.0.0.5'] },
    { level: 'INFO', source: 'backup.engine', messages: ['Incremental snapshot started — target: /mnt/backup/daily', 'AES-256 encryption applied to snapshot chunk 14/20', 'Offsite upload: 34% complete — ETA 4m'] },
    { level: 'ERROR', source: 'backup.engine', messages: ['Backup I/O write error: disk full or partition read-only', 'Failed to snapshot database metadata schema'] },
    { level: 'WARN', source: 'backup.engine', messages: ['Backup sync throttling — IOPS limit reached', 'Replication delay: Backup server under heavy load'] },
    { level: 'FATAL', source: 'mem.watchdog', messages: ['OOM threshold reached on worker-3 — restart triggered', 'Core dump captured: /var/crash/worker-3.dump', 'Service recovered after 3.2s restart cycle'] },
    { level: 'TRACE', source: 'mrp.engine', messages: ['BOM explode pass complete — 1,240 nodes traversed', 'Safety stock recalculated for 83 materials', 'Production plan sync — 0 conflicts detected'] },
];

function generateLog(): LogEntry {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const msgs = template.messages;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
        id: `${Date.now()}-${Math.random()}`,
        level: template.level,
        source: template.source,
        message: msgs[Math.floor(Math.random() * msgs.length)],
        ts: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${String(now.getMilliseconds()).padStart(3, '0')}`,
    };
}

function LiveLogSection() {
    const [logs, setLogs] = useState<LogEntry[]>(() =>
        Array.from({ length: 18 }, generateLog)
    );
    const [isStreaming, setIsStreaming] = useState(true);
    const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const scrollToBottomRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        if (!isStreaming) return;
        intervalRef.current = setInterval(() => {
            setLogs(prev => {
                const next = [...prev, generateLog()];
                return next.slice(-120); // keep last 120 lines
            });
        }, 600 + Math.random() * 900);
        return () => clearInterval(intervalRef.current);
    }, [isStreaming]);

    useEffect(() => {
        if (isStreaming && logsContainerRef.current && scrollToBottomRef.current) {
            // Natively position to the absolute bottom row using the logs container scroll height
            // instead of scrollIntoView, which causes global parent layout shifts
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [logs, isStreaming]);

    const filtered = logs.filter(l => {
        const levelMatch = filter === 'ALL' || l.level === filter;
        const searchMatch = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.source.includes(search);
        return levelMatch && searchMatch;
    });

    const errorCount = logs.filter(l => l.level === 'ERROR' || l.level === 'FATAL').length;
    const warnCount = logs.filter(l => l.level === 'WARN').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-slate-900/50 border border-slate-800 rounded-[28px] p-8 space-y-5 backdrop-blur-xl shadow-2xl"
        >
            <SectionHeader
                title="Live Backend Log Stream & Stack Trace"
                subtitle="Xatoliklar Terminali — Runtime Process Monitor"
                icon={Terminal}
                color="bg-slate-700"
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Stats pills */}
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-black text-rose-400 uppercase tracking-wider">
                        {errorCount} ERRORS
                    </span>
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-black text-amber-400 uppercase tracking-wider">
                        {warnCount} WARNS
                    </span>
                    <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        {logs.length} TOTAL
                    </span>
                </div>

                {/* Level filter */}
                <div className="flex gap-1.5 ml-auto flex-wrap">
                    {(['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG'] as const).map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setFilter(lvl)}
                            className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                                filter === lvl
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                            }`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>

                {/* Stream toggle */}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">STREAM</span>
                    <IOSToggle
                        checked={isStreaming}
                        onChange={() => setIsStreaming(p => !p)}
                        colorOn="bg-emerald-500"
                    />
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                <input
                    type="text"
                    placeholder="Filter by message or source..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-mono text-slate-300 placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-colors"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Log Console */}
            <div className="bg-black/80 rounded-2xl border border-slate-900/80 overflow-hidden">
                {/* Terminal header bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex-1 text-center">
                        <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                            vgm-hub-erp — runtime.log
                        </span>
                    </div>
                    {isStreaming && (
                        <div className="flex items-center gap-1.5">
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                            />
                            <span className="text-[8px] font-black text-emerald-500 uppercase">LIVE</span>
                        </div>
                    )}
                </div>

                {/* Log lines */}
                <div
                    ref={logsContainerRef}
                    className="overflow-y-auto p-4 space-y-0.5 font-mono text-[10px] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                    style={{
                        height: '420px', /* Lock standard physical console card height boundaries */
                        overflowY: 'auto', /* Ensure only the inside rows scroll natively */
                        display: 'block'
                    }}
                >
                    {filtered.map((entry) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className={`flex items-start gap-3 py-0.5 hover:bg-white/[0.02] rounded px-1 -mx-1 group cursor-default ${
                                entry.level === 'FATAL' || entry.level === 'ERROR' ? 'bg-rose-500/5' : ''
                            }`}
                        >
                            <span className="text-slate-700 shrink-0 select-none">{entry.ts}</span>
                            <span className={`shrink-0 w-10 text-right ${
                                entry.level === 'ERROR' || entry.level === 'FATAL' ? 'text-rose-400 font-black' :
                                entry.level === 'WARN' ? 'text-amber-400 font-black' :
                                entry.level === 'DEBUG' ? 'text-blue-400/60' :
                                'text-slate-500'
                            } uppercase`}>
                                {entry.level}
                            </span>
                            <span className="text-indigo-400/60 shrink-0 w-24 truncate">[{entry.source}]</span>
                            <span className={`flex-1 ${LOG_LEVEL_STYLES[entry.level]} leading-relaxed`}>
                                {entry.message}
                            </span>
                        </motion.div>
                    ))}
                    <div ref={scrollToBottomRef} />
                </div>

                {/* Footer stats bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-slate-900/60 bg-slate-950/40">
                    <div className="flex items-center gap-4 text-[8px] font-mono text-slate-700 uppercase">
                        <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> RAM: 3.2 / 8 GB</span>
                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU: 18%</span>
                        <span className="flex items-center gap-1"><Network className="w-3 h-3" /> Net: 12 MB/s</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> DB Conn: 12/32</span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-700">
                        Showing {filtered.length} / {logs.length} entries
                    </span>
                </div>
            </div>

            {/* Clear logs button */}
            <button
                onClick={() => setLogs([])}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-slate-600 hover:text-rose-400 uppercase tracking-widest border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all"
            >
                <X className="w-3.5 h-3.5" />
                Clear Log Buffer
            </button>
        </motion.div>
    );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export function SystemSettingsRoot() {
    return (
        <div 
            className="h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] bg-[#020617] text-slate-100 px-6 py-6 flex flex-col overflow-hidden"
            style={{ 
                maxHeight: 'calc(100vh - 80px)', /* Account for top navigation header bar spacing */
                overflow: 'hidden' /* Prevent the outer desktop frame from jumping */
            }}
        >
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 shrink-0"
            >
                <div>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-[0.4em] font-black mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse inline-block" />
                        TERMINAL CONTROL · SYSTEM ROOT
                    </p>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Server className="w-7 h-7 text-white" />
                        </div>
                        Tizim Sozlamalari
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-2 ml-1">
                        System Configuration · Data Migration · Disaster Recovery · Broadcast Engine
                    </p>
                </div>

                {/* Live status pill */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">All Systems Nominal</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Encrypted</span>
                    </div>
                </div>
            </motion.div>

            {/* Scrollable Work Area to absorb internal content shifts */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1 pb-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {/* Section A — 1C Bulk Importer */}
                <BulkImporterSection />

                {/* Section B — Backup Engine */}
                <BackupSection />

                {/* Command Center Layout - Flex Column Design Setup */}
                <div className="flex flex-col gap-6 w-full">
                    {/* Broadcast Section */}
                    <div className="w-full flex flex-col" style={{ flex: '1 1 35%' }}>
                        <BroadcastSection />
                    </div>
                    {/* Module Toggles Section */}
                    <div className="w-full flex flex-col" style={{ flex: '1 1 25%' }}>
                        <ModuleTogglesSection />
                    </div>
                    {/* Live Log Section */}
                    <div className="w-full flex flex-col" style={{ flex: '1 1 40%' }}>
                        <LiveLogSection />
                    </div>
                </div>
            </div>
        </div>
    );
}
