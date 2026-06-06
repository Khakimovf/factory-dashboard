import React, { useState, useMemo, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Upload, Download,
    Plus, X, User, Clock, Info, Edit2,
    FileText, CloudUpload, CheckCircle, AlertCircle, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

// --- Types & Constants ---

type ShiftType = 'KUNDUZ' | 'TUNGI' | 'DAM';
type TeamId = 'A' | 'B' | 'D';

interface Department {
    id: string;
    name: string;
    count: number;
}

interface Worker {
    id: string;
    name: string;
    departmentId: string;
}

interface SpecialCallIn {
    id: string;
    workerId: string;
    date: string;
    reason: string;
    startTime: string;
    endTime: string;
    note?: string;
}

const DEPARTMENTS: Department[] = [
    { id: 'l1', name: "Yig'uv liniyasi 1", count: 16 },
    { id: 'l2', name: "Yig'uv liniyasi 2", count: 14 },
    { id: 'l3', name: "Yig'uv liniyasi 3", count: 12 },
    { id: 'l4', name: "Yig'uv liniyasi 4", count: 11 },
    { id: 'l5', name: "Yig'uv liniyasi 5", count: 10 },
    { id: 'qc', name: "Sifat nazorati", count: 4 },
    { id: 'wh', name: "Ombor", count: 8 },
    { id: 'mt', name: "Texnik xizmat", count: 6 },
    { id: 'cl', name: "Tozalovchilar", count: 11 },
    { id: 'dp', name: "Dispetcherlar", count: 3 },
];

const WORKER_NAMES = [
    "Karimov Jasur", "Toshmatova Nilufar", "Xasanov Bobur", "Nazarova Gulnora",
    "Mirzayev Sherzod", "Abdullayeva Mohira", "Ergashev Timur", "Yusupova Zulfiya",
    "Qodirov Mansur", "Holmatova Feruza", "Rashidov Bahodir", "Ismoilova Barno",
    "Sultonov Ulugbek", "Normatova Sabohat", "Botirov Firdavs", "Jurayeva Kumush",
    "Aliyev Sardor", "Raximova Dilnoza", "Tursunov Anvar", "Bekova Madina"
];

const UZ_DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

const TEAM_MASTERS = {
    A: { name: "Toshmatov Sarvar", id: "MST-A-101", phone: "+998 90 123 45 67", exp: "12 yil" },
    B: { name: "Nazarov Ulugbek", id: "MST-B-202", phone: "+998 90 987 65 43", exp: "15 yil" },
    D: { name: "Ergashev Timur", id: "MST-D-303", phone: "+998 91 555 44 33", exp: "10 yil" }
};

// --- Utilities ---

function getShiftType(team: TeamId, date: Date): ShiftType {
    const anchor = new Date(2026, 1, 1); // Feb 1 2026
    const diff = Math.floor((date.getTime() - anchor.getTime()) / 86400000);
    const offsets = { A: 4, B: 0, D: 8 };
    const cycles = {
        A: ['K', 'K', 'K', 'K', '_', '_', 'T', 'T', 'T', 'T', '_', '_'],
        B: ['T', 'T', '_', '_', 'K', 'K', 'K', 'K', '_', '_', 'T', 'T'],
        D: ['_', '_', 'T', 'T', 'T', 'T', '_', '_', 'K', 'K', 'K', 'K'],
    };
    const idx = ((diff + offsets[team]) % 12 + 12) % 12;
    const v = cycles[team][idx];
    return v === 'K' ? 'KUNDUZ' : v === 'T' ? 'TUNGI' : 'DAM';
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const generateWorkers = () => {
    const workers: Worker[] = [];
    DEPARTMENTS.forEach(dept => {
        for (let i = 0; i < dept.count; i++) {
            workers.push({
                id: `EMP-${dept.id}-${i + 1000}`,
                name: WORKER_NAMES[(i + workers.length) % WORKER_NAMES.length],
                departmentId: dept.id
            });
        }
    });
    return workers;
};

// --- Components ---

const TeamBadge = ({ team, onClick }: { team: TeamId, onClick?: () => void }) => {
    const colors = {
        A: 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500',
        B: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500',
        D: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500'
    };
    return (
        <button
            onClick={onClick}
            disabled={!onClick}
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic transition-all ${colors[team]}`}
        >
            {team}
        </button>
    );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-500">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
                    {children}
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

const MonthPicker = ({ isOpen, onClose, viewDate, setViewDate }: { isOpen: boolean, onClose: () => void, viewDate: Date, setViewDate: (d: Date) => void }) => {
    if (!isOpen) return null;
    const year = viewDate.getFullYear();
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

    return (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl w-[280px]">
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={() => setViewDate(new Date(year - 1, viewDate.getMonth()))} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"><ChevronLeft size={16} /></button>
                <span className="text-sm font-black text-white italic">{year}</span>
                <button onClick={() => setViewDate(new Date(year + 1, viewDate.getMonth()))} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {months.map((m, i) => (
                    <button
                        key={m}
                        onClick={() => { setViewDate(new Date(year, i)); onClose(); }}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${viewDate.getMonth() === i ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-500 hover:text-white'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CellEditPopover = ({ active, onClose, onSave, currentHours, currentNote }: { active: { team: TeamId, dateStr: string, x: number, y: number }, onClose: () => void, onSave: (h: number, n: string) => void, currentHours: number, currentNote: string }) => {
    const [hours, setHours] = useState(currentHours);
    const [note, setNote] = useState(currentNote);
    const date = new Date(active.dateStr);

    return (
        <div
            className="fixed z-[120] bg-slate-900 border border-slate-700 p-6 rounded-[28px] shadow-2xl w-[260px] animate-in fade-in zoom-in duration-200"
            style={{
                left: Math.min(active.x, window.innerWidth - 280),
                top: Math.min(active.y, window.innerHeight - 300)
            }}
        >
            <h4 className="text-xs font-black text-white italic uppercase tracking-widest mb-6 border-b border-white/5 pb-3">
                {active.team} Smena — {date.getDate()} {date.toLocaleDateString('uz-UZ', { month: 'long' })}
            </h4>

            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-3 italic">Soat</label>
                    <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                        {[0, 8, 11].map(h => (
                            <button
                                key={h}
                                onClick={() => setHours(h)}
                                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all ${hours === h ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {h === 0 ? 'Dam' : `${h}h`}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2 italic">Izoh</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value.slice(0, 120))}
                        placeholder="Izoh kiriting... (ixtiyoriy)"
                        className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs font-bold text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
                        rows={2}
                    />
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 text-[10px] font-black uppercase italic hover:bg-slate-700 transition-all">Bekor qilish</button>
                    <button onClick={() => onSave(hours, note)} className="flex-1 py-3 rounded-xl bg-indigo-600 text-[10px] font-black uppercase italic hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">✓ Saqlash</button>
                </div>
            </div>
        </div>
    );
};

const TeamDetailModal = ({ teamId, isOpen, onClose, workers }: { teamId: TeamId | null, isOpen: boolean, onClose: () => void, workers: Worker[] }) => {
    const [deptFilter, setDeptFilter] = useState('all');
    if (!teamId || !isOpen) return null;

    const master = TEAM_MASTERS[teamId];
    const filteredWorkers = workers.filter(w => deptFilter === 'all' || w.departmentId === deptFilter);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <TeamBadge team={teamId} />
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none"> {teamId} SMENA — Tafsiloti</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 italic">Jami: 95 ishchi</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-500 transition-colors"><X size={28} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                    {/* 1. Master Info */}
                    <section>
                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 italic">Smena Ustasi (Master)</h4>
                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl flex items-center gap-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-all" />
                            <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                                <User size={32} className="text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-black text-white uppercase italic">{master.name}</h3>
                                    <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-amber-500/20">SMENA USTASI</span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 italic">{master.id} • {master.exp} tajriba</p>
                                <p className="text-xs font-mono text-emerald-500 font-bold">{master.phone}</p>
                            </div>
                        </div>
                    </section>

                    {/* 2. Departments & Workers */}
                    <section className="space-y-6">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Bo'limlar va Ishchilar</h4>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setDeptFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${deptFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'}`}>Barchasi</button>
                                {DEPARTMENTS.map(d => (
                                    <button key={d.id} onClick={() => setDeptFilter(d.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all ${deptFilter === d.id ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300'}`}>{d.name}</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 text-[10px] uppercase font-black tracking-widest text-slate-600 border-b border-white/5">
                                        <th className="p-4">#</th>
                                        <th className="p-4">FIO</th>
                                        <th className="p-4">Bo'lim</th>
                                        <th className="p-4">EMP ID</th>
                                        <th className="p-4">Holat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredWorkers.map((w, idx) => (
                                        <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4 text-slate-600 font-bold">{idx + 1}</td>
                                            <td className="p-4 text-white font-black uppercase italic">{w.name}</td>
                                            <td className="p-4 text-slate-400 font-bold text-[10px] uppercase">{DEPARTMENTS.find(d => d.id === w.departmentId)?.name}</td>
                                            <td className="p-4 text-slate-500 font-mono text-[10px]">{w.id}</td>
                                            <td className="p-4 text-right">
                                                <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-tighter">Faol</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 3. Stats */}
                    <section className="bg-slate-950 border border-slate-800 p-6 rounded-3xl grid grid-cols-3 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Ish kunlari</p>
                            <p className="text-xl font-black text-white italic">18 kun</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Jami soat</p>
                            <p className="text-xl font-black text-white italic">198h</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Chaqiruvlar</p>
                            <p className="text-xl font-black text-amber-500 italic">2 ta</p>
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-white/5 bg-slate-950/50 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-12 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-xs transition-all">Yopish</button>
                </div>
            </motion.div>
        </div>
    );
};

export function ShiftSchedulePage() {
    const [viewDate, setViewDate] = useState(new Date(2026, 1, 1)); // Default Feb 2026
    const [activeTab, setActiveTab] = useState<'monthly' | 'upload'>('monthly');
    const [selectedCell, setSelectedCell] = useState<{ team: TeamId, dateStr: string } | null>(null);
    const [callIns, setCallIns] = useState<SpecialCallIn[]>([
        { id: '1', workerId: 'EMP-cl-1000', date: '2026-02-15', reason: 'Tozalov', startTime: '07:00', endTime: '19:00', note: 'General cleaning' },
        { id: '2', workerId: 'EMP-mt-1000', date: '2026-02-22', reason: 'Ta\'mirlash', startTime: '07:00', endTime: '19:00' }
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [workers] = useState<Worker[]>(generateWorkers);

    // Feature 1: Cell Overrides
    const [overrides, setOverrides] = useState<Record<string, { hours: number, note?: string }>>({});
    const [activeCellEdit, setActiveCellEdit] = useState<{ team: TeamId, dateStr: string, x: number, y: number } | null>(null);

    // Feature 2: Team Modal
    const [teamModalId, setTeamModalId] = useState<TeamId | null>(null);

    // Feature 3: Header Filters
    const [globalDeptId, setGlobalDeptId] = useState<string>('all');
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

    // Mass Upload States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'preview' | 'uploading' | 'success'>('idle');

    // Modal Step State
    const [modalStep, setModalStep] = useState(1);
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
    const [callInForm, setCallInForm] = useState({ reason: 'Tozalov', note: '', start: '07:00', end: '19:00' });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const selection = useMemo(() => {
        if (!selectedCell) {
            return { team: 'A' as TeamId, date: today, dateStr: todayStr, type: getShiftType('A', today) };
        }
        const d = new Date(selectedCell.dateStr);
        return { ...selectedCell, date: d, type: getShiftType(selectedCell.team, d) };
    }, [selectedCell, todayStr]);

    const currentCallIns = useMemo(() => {
        return callIns.filter(c => c.date === selection.dateStr);
    }, [callIns, selection.dateStr]);

    const handleAddCallIn = () => {
        const news = selectedWorkerIds.map(wid => ({
            id: Math.random().toString(36).substr(2, 9),
            workerId: wid,
            date: selection.dateStr,
            reason: callInForm.reason,
            startTime: callInForm.start,
            endTime: callInForm.end,
            note: callInForm.note
        }));
        setCallIns(prev => [...prev, ...news]);
        setIsModalOpen(false);
        setModalStep(1);
        setSelectedWorkerIds([]);
    };

    const removeCallIn = (id: string) => {
        setCallIns(prev => prev.filter(c => c.id !== id));
    };

    const handleSaveOverride = (team: TeamId, dateStr: string, hours: number, note: string) => {
        const key = `${team}_${dateStr}`;
        if (hours === 0 && !note) {
            const next = { ...overrides };
            delete next[key];
            setOverrides(next);
        } else {
            setOverrides(prev => ({ ...prev, [key]: { hours, note: note || undefined } }));
        }
        setActiveCellEdit(null);
    };

    const handleDownloadTemplate = () => {
        const data = [
            { Team: 'A', Sana: '15.02.2026', Soat: 11, Izoh: 'Namuna 1' },
            { Team: 'B', Sana: '15.02.2026', Soat: 11, Izoh: 'Namuna 2' },
            { Team: 'D', Sana: '15.02.2026', Soat: 0, Izoh: 'Namuna 3' }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Smena Jadvali");
        XLSX.writeFile(wb, "smena_shablon.xlsx");
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadStatus('preview');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setSelectedFile(file);
            setUploadStatus('preview');
        }
    };

    return (
        <div className="flex h-full bg-[#020617] text-slate-300 font-sans overflow-hidden">
            {/* Main Container */}
            <div className={`flex-1 flex flex-col p-6 space-y-6 transition-all duration-300 overflow-y-auto custom-scrollbar ${selectedCell ? 'mr-[350px]' : ''}`}>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-[28px] font-black text-white italic uppercase tracking-tighter leading-none">SMENA JADVALI</h1>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Yig'uv — 3 Smena Rotatsiya Monitori</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Bo'lim:</span>
                            <select
                                value={globalDeptId}
                                onChange={e => setGlobalDeptId(e.target.value)}
                                className="bg-transparent text-xs font-black text-white outline-none cursor-pointer uppercase italic"
                            >
                                <option value="all" className="bg-slate-900">Barchasi</option>
                                {DEPARTMENTS.map(d => (
                                    <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-slate-800">
                            <button
                                onClick={() => setActiveTab('monthly')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase italic transition-all ${activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Oylik Ko'rinish
                            </button>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase italic transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Mass Upload
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'monthly' ? (
                    <>
                        {/* Status Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                            {(['A', 'B', 'D'] as TeamId[]).map(teamId => {
                                const type = getShiftType(teamId, today);
                                const selectedDept = DEPARTMENTS.find(d => d.id === globalDeptId);
                                const countLabel = globalDeptId === 'all' ? '~430 ishchi' : `${selectedDept?.name}: ${selectedDept?.count} ishchi`;

                                return (
                                    <div key={teamId} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex items-center justify-between hover:bg-slate-900 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <TeamBadge team={teamId} onClick={() => setTeamModalId(teamId)} />
                                            <div>
                                                <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-2 ${type === 'KUNDUZ' ? 'text-emerald-400' : type === 'TUNGI' ? 'text-purple-400' : 'text-slate-500'
                                                    }`}>
                                                    {type === 'KUNDUZ' ? 'Kunduzgi' : type === 'TUNGI' ? 'Tungi' : 'Dam olish'}
                                                </p>
                                                <p className="text-white font-mono text-sm font-bold">
                                                    {type === 'KUNDUZ' ? '07:00 – 19:00' : type === 'TUNGI' ? '19:00 – 07:00' : 'Dam olish kuni'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Xodimlar saflari</span>
                                            <span className="bg-white/5 px-2 py-1 rounded text-[10px] font-black text-slate-400">{countLabel}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Navigator */}
                        <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800 p-3 rounded-2xl shrink-0 relative">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
                                <button
                                    onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                                    className="text-sm font-black text-white px-4 italic uppercase tracking-widest min-w-[200px] text-center hover:bg-white/5 rounded-xl py-2 transition-all flex items-center justify-center gap-2"
                                >
                                    {viewDate.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}
                                    <Edit2 size={12} className="text-slate-500" />
                                </button>
                                <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><ChevronRight size={20} /></button>
                            </div>

                            <MonthPicker
                                isOpen={isMonthPickerOpen}
                                onClose={() => setIsMonthPickerOpen(false)}
                                viewDate={viewDate}
                                setViewDate={setViewDate}
                            />

                            <button onClick={() => setViewDate(new Date())} className="px-5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase italic tracking-widest transition-all">Bugun</button>
                        </div>

                        {/* Main Calendar Grid */}
                        <div className="flex-1 overflow-x-auto custom-scrollbar bg-slate-900/10 border border-slate-800 rounded-[32px] overflow-hidden flex flex-col">
                            <table className="w-full border-collapse">
                                <thead className="bg-[#020617] sticky top-0 z-10">
                                    <tr>
                                        <th className="w-[60px] p-4 text-[10px] font-black text-slate-600 uppercase border-r border-slate-800/50">Team</th>
                                        {days.map(d => {
                                            const isSun = d.getDay() === 0;
                                            return (
                                                <th key={d.getTime()} className={`min-w-[32px] p-2 text-center border-r border-slate-800/50 ${isSun ? 'bg-[#dc2626]' : ''}`}>
                                                    <span className={`text-xs font-black italic ${isSun ? 'text-white' : 'text-slate-400'}`}>{d.getDate()}</span>
                                                </th>
                                            );
                                        })}
                                        <th className="w-[80px] p-4 text-[10px] font-black text-slate-300 uppercase">Jami</th>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <th className="border-r border-slate-800/50"></th>
                                        {days.map(d => {
                                            const isSun = d.getDay() === 0;
                                            return (
                                                <th key={d.getTime()} className={`p-1.5 text-center border-r border-slate-800/50 ${isSun ? 'bg-[#dc2626]' : ''}`}>
                                                    <span className={`text-[9px] font-bold ${isSun ? 'text-white' : 'text-slate-600'}`}>{UZ_DAYS[d.getDay()]}</span>
                                                </th>
                                            );
                                        })}
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {(['A', 'B', 'D'] as TeamId[]).map(teamId => {
                                        let totalHours = 0;
                                        return (
                                            <tr key={teamId} className="h-12 group">
                                                <td className="p-0 border-r border-slate-800/30 bg-[#020617]">
                                                    <button
                                                        onClick={() => setTeamModalId(teamId)}
                                                        className="w-full h-full text-center font-black text-white italic hover:text-indigo-400 transition-colors uppercase"
                                                    >
                                                        {teamId}
                                                    </button>
                                                </td>
                                                {days.map(d => {
                                                    const type = getShiftType(teamId, d);
                                                    const isSun = d.getDay() === 0;
                                                    const dStr = d.toISOString().split('T')[0];
                                                    const override = overrides[`${teamId}_${dStr}`];
                                                    const hasCallIn = callIns.some(c => c.date === dStr);
                                                    const isActive = selection.dateStr === dStr && selection.team === teamId;

                                                    let hours = override ? override.hours : (type === 'DAM' ? 0 : 11);
                                                    totalHours += hours;

                                                    let cellStyle = 'bg-transparent text-transparent border border-slate-800/30';
                                                    let text = '';

                                                    if (hours === 8) {
                                                        cellStyle = 'bg-amber-500 text-slate-950 font-black';
                                                        text = '8';
                                                    } else if (hours === 11) {
                                                        cellStyle = isSun ? 'bg-[#dc2626] text-white' : (type === 'TUNGI' && !override ? 'bg-[#374151] text-[#e5e7eb]' : 'bg-[#e5e7eb] text-black');
                                                        text = '11';
                                                    }

                                                    return (
                                                        <td
                                                            key={d.getTime()}
                                                            onClick={() => setSelectedCell({ team: teamId, dateStr: dStr })}
                                                            onContextMenu={(e) => {
                                                                e.preventDefault();
                                                                setActiveCellEdit({ team: teamId, dateStr: dStr, x: e.clientX, y: e.clientY });
                                                            }}
                                                            className={`p-0.5 border-r border-slate-800/10 cursor-pointer relative group/cell ${isActive ? 'ring-2 ring-indigo-500 z-10' : ''}`}
                                                        >
                                                            <div className={`w-full h-9 flex items-center justify-center font-black text-[13px] rounded-sm transition-transform active:scale-95 ${cellStyle}`}>
                                                                {text}
                                                            </div>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveCellEdit({ team: teamId, dateStr: dStr, x: e.clientX, y: e.clientY });
                                                                }}
                                                                className="absolute top-0 right-0 p-1 opacity-0 group-hover/cell:opacity-100 bg-black/50 text-white rounded-bl-lg transition-opacity"
                                                            >
                                                                <Edit2 size={8} />
                                                            </button>

                                                            {override?.note && (
                                                                <div className="absolute bottom-1 right-1 text-slate-400" title={override.note}>
                                                                    <Edit2 size={6} className="rotate-90" />
                                                                </div>
                                                            )}

                                                            {hasCallIn && type === 'DAM' && !override && (
                                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50" />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="text-center font-mono text-[11px] font-black text-emerald-400 bg-slate-900/50 transition-colors group-hover:bg-emerald-500/10">
                                                    {totalHours}h
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Legend */}
                            <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-900/30 border border-slate-800 rounded-2xl shrink-0 mt-4 mx-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-[#e5e7eb] rounded flex items-center justify-center text-[10px] font-black text-black">11</div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 italic">Kunduzgi smena</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-[#374151] border border-slate-600 rounded flex items-center justify-center text-[10px] font-black text-[#e5e7eb]">11</div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 italic">Tungi smena</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center text-[10px] font-black text-slate-950">8</div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 italic">Qo'shimcha ish kuni (8s)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border border-slate-700 rounded" />
                                    <span className="text-[10px] uppercase font-bold text-slate-500 italic">Dam olish</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-[#dc2626] rounded flex items-center justify-center text-[10px] font-black text-white">11</div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 italic">Yakshanba / Bayram</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col max-w-[750px] mx-auto w-full space-y-6">
                        <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] p-8 flex flex-col">
                            {uploadStatus === 'idle' ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[32px] transition-all h-[300px] min-h-[300px] ${isDragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-800 bg-slate-950/20'}`}
                                >
                                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                                        <CloudUpload size={48} className={isDragging ? 'text-cyan-400' : 'text-slate-600'} />
                                    </div>
                                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Excel faylini shu yerga tashlang</h3>
                                    <p className="text-slate-500 text-[11px] font-bold mt-2 uppercase tracking-[0.2em] italic">.xlsx formatida, max 10MB</p>

                                    <label className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase italic shadow-lg shadow-indigo-600/30 transition-all cursor-pointer">
                                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
                                        📁 Faylni tanlash
                                    </label>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* File Info Card */}
                                    <div className="flex items-center justify-between bg-slate-950/50 border border-slate-800 p-6 rounded-3xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                                <FileText size={24} className="text-emerald-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black italic uppercase tracking-tight leading-none">{selectedFile?.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{(selectedFile?.size || 0) / 1024 > 1024 ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(1)} MB` : `${((selectedFile?.size || 0) / 1024).toFixed(1)} KB`}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase italic rounded-lg border border-emerald-500/20">
                                                <CheckCircle size={10} /> Fayl tayyor
                                            </span>
                                            <button
                                                onClick={() => { setSelectedFile(null); setUploadStatus('idle'); }}
                                                className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-all rounded-xl border border-transparent hover:border-red-500/20"
                                                title="Bekor qilish"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Preview Table */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic ml-2">Ma'lumotlar Preview</h4>
                                        <div className="border border-slate-800 rounded-3xl overflow-hidden bg-slate-950/30">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead className="bg-[#020617] text-[9px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800/50">
                                                    <tr>
                                                        <th className="p-4">Team</th>
                                                        <th className="p-4">Sana</th>
                                                        <th className="p-4">Soat</th>
                                                        <th className="p-4">Izoh</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/30 text-white font-bold">
                                                    {[
                                                        { team: 'A', date: '15.02.2026', hours: 11, note: 'Oddiy smena' },
                                                        { team: 'B', date: '15.02.2026', hours: 11, note: '' },
                                                        { team: 'D', date: '15.02.2026', hours: 0, note: 'Dam olish' },
                                                        { team: 'A', date: '16.02.2026', hours: 11, note: '' },
                                                        { team: 'B', date: '16.02.2026', hours: 8, note: 'Qo\'shimcha' },
                                                    ].map((row, i) => (
                                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="p-4 font-black italic">{row.team}</td>
                                                            <td className="p-4 text-slate-400 font-mono italic">{row.date}</td>
                                                            <td className="p-4">
                                                                <span className={row.hours === 8 ? 'text-amber-500' : 'text-white'}>{row.hours}h</span>
                                                            </td>
                                                            <td className="p-4 text-slate-500 text-[11px] italic font-medium">{row.note || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Validation Summary */}
                                    <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-3">
                                        <div className="flex items-center gap-3 text-emerald-500">
                                            <CheckCircle size={16} />
                                            <span className="text-[10px] font-black uppercase italic tracking-wider">✅ 18 ta yozuv topildi</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-emerald-500">
                                            <CheckCircle size={16} />
                                            <span className="text-[10px] font-black uppercase italic tracking-wider">✅ Barcha smena kodlari to'g'ri (A/B/D)</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-emerald-500">
                                            <CheckCircle size={16} />
                                            <span className="text-[10px] font-black uppercase italic tracking-wider">✅ Sanalar formati to'g'ri</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-amber-500">
                                            <AlertCircle size={16} />
                                            <span className="text-[10px] font-black uppercase italic tracking-wider">⚠️ 2 ta yozuvda izoh yo'q (ogohlantirish)</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => { setSelectedFile(null); setUploadStatus('idle'); }}
                                            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-[10px] transition-all border border-slate-700"
                                        >
                                            ← Bekor qilish
                                        </button>
                                        <button
                                            onClick={() => setUploadStatus('success')}
                                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase italic text-[10px] shadow-lg shadow-emerald-600/20 transition-all"
                                        >
                                            ✓ Yuklash va Saqlash
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-[32px] flex items-center gap-6 group hover:bg-slate-900/50 transition-all">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Download size={28} className="text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-black italic uppercase tracking-tight">Excel Shabloni</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Smena jadvalini to'ldirish uchun tayyor shablon</p>
                                </div>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase italic transition-all shrink-0 border border-slate-700"
                                >
                                    ⬇ .xlsx Yuklash
                                </button>
                            </div>

                            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-[32px] flex flex-col justify-center">
                                <h4 className="text-xs font-black text-white italic uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Info size={14} className="text-indigo-400" /> Fayl Formati
                                </h4>
                                <ul className="grid grid-cols-1 gap-y-2">
                                    <li className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Team ustuni: faqat A, B yoki D
                                    </li>
                                    <li className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sana formati: KK.OO.YYYY (masalan: 15.02.2026)
                                    </li>
                                    <li className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Soat ustuni: 8 yoki 11
                                    </li>
                                    <li className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Izoh: ixtiyoriy maydon
                                    </li>
                                    <li className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Bitta kunda bir smena uchun faqat 1 ta yozuv
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Side Panel */}
            <div className={`fixed top-0 right-0 h-full w-[350px] bg-slate-950 border-l border-slate-800 z-50 transform transition-transform duration-500 flex flex-col p-8 space-y-8 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] ${selectedCell ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <button onClick={() => setSelectedCell(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="flex items-center gap-4 border-b border-white/5 pb-6 shrink-0">
                    <TeamBadge team={selection.team} />
                    <div className="min-w-0">
                        <h3 className="text-white font-black text-lg uppercase italic tracking-tighter truncate leading-none mb-2">
                            {selection.date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })}
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] ${selection.type === 'KUNDUZ' ? 'bg-emerald-500/10 text-emerald-500' :
                            selection.type === 'TUNGI' ? 'bg-purple-500/10 text-purple-500' :
                                'bg-slate-800 text-slate-500'
                            }`}>
                            {selection.type}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                    {/* Section 1: Tarkib */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Smena Tarkibi</h4>
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase">✓ To'liq tarkib</span>
                        </div>
                        <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden ${selection.type === 'DAM' ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                            <table className="w-full text-left text-[11px] border-collapse">
                                <tbody>
                                    {DEPARTMENTS.map(dept => (
                                        <tr key={dept.id} className={`border-b border-white/5 transition-colors ${globalDeptId === dept.id ? 'bg-indigo-600/20' : 'hover:bg-white/[0.02]'}`}>
                                            <td className={`px-4 py-2 font-bold ${globalDeptId === dept.id ? 'text-indigo-400' : 'text-slate-400'}`}>{dept.name}</td>
                                            <td className={`px-4 py-2 text-right font-black ${globalDeptId === dept.id ? 'text-white text-base' : 'text-white'}`}>{dept.count}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-950/50">
                                        <td className="px-4 py-3 font-black text-white italic uppercase">JAMI</td>
                                        <td className="px-4 py-3 text-right text-emerald-400 font-black italic">95</td>
                                    </tr>
                                </tbody>
                            </table>
                            {selection.type === 'DAM' && (
                                <div className="p-3 bg-red-500/10 text-center">
                                    <p className="text-[9px] font-black text-red-500 uppercase italic">Dam olish kuni — ishchilar yo'q</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section 2: Call-In */}
                    <section className="flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Maxsus Chaqiruv</h4>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="p-1 px-3 bg-amber-600/10 border border-amber-600/30 text-amber-500 hover:bg-amber-600 transition-all hover:text-white rounded-lg text-[9px] font-black uppercase italic tracking-tighter"
                            >
                                + Chaqiruv
                            </button>
                        </div>
                        <div className="space-y-3">
                            {currentCallIns.length > 0 ? currentCallIns.map(call => {
                                const worker = workers.find(w => w.id === call.workerId);
                                return (
                                    <div key={call.id} className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3 relative group">
                                        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5">
                                            <User size={14} className="text-slate-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-white italic uppercase truncate">{worker?.name}</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase">{call.reason} • {call.startTime}-{call.endTime}</p>
                                        </div>
                                        <button onClick={() => removeCallIn(call.id)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all rounded-lg">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )
                            }) : (
                                <div className="py-8 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center opacity-20">
                                    <Info size={20} className="mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest italic">Maxsus chaqiruv yo'q</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section 3: Time */}
                    <section className="bg-slate-950 border border-white/5 p-5 rounded-3xl shrink-0">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-4">Smena Vaqti</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-600 font-bold uppercase tracking-widest">Boshlanish:</span>
                                <span className="text-white font-mono font-black italic">{selection.type === 'KUNDUZ' ? '07:00' : selection.type === 'TUNGI' ? '19:00' : '—'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-600 font-bold uppercase tracking-widest">Tugash:</span>
                                <span className="text-white font-mono font-black italic">{selection.type === 'KUNDUZ' ? '19:00' : selection.type === 'TUNGI' ? '07:00' : '—'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-600 font-bold uppercase tracking-widest">Obet:</span>
                                <span className="text-white font-mono font-black italic">{selection.type === 'KUNDUZ' ? '12:00 – 13:00' : selection.type === 'TUNGI' ? '00:00 – 01:00' : '—'}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* --- Modals and Popovers --- */}

            <AnimatePresence>
                {activeCellEdit && (
                    <CellEditPopover
                        active={activeCellEdit}
                        onClose={() => setActiveCellEdit(null)}
                        onSave={(h, n) => handleSaveOverride(activeCellEdit.team, activeCellEdit.dateStr, h, n)}
                        currentHours={overrides[`${activeCellEdit.team}_${activeCellEdit.dateStr}`]?.hours || (getShiftType(activeCellEdit.team, new Date(activeCellEdit.dateStr)) === 'DAM' ? 0 : 11)}
                        currentNote={overrides[`${activeCellEdit.team}_${activeCellEdit.dateStr}`]?.note || ''}
                    />
                )}
            </AnimatePresence>

            <TeamDetailModal
                teamId={teamModalId}
                isOpen={!!teamModalId}
                onClose={() => setTeamModalId(null)}
                workers={workers}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setModalStep(1); }}
                title={`Maxsus Chaqiruv — Smena ${selection.team} — ${selection.dateStr}`}
            >
                <div className="space-y-8">
                    {/* Steps Nav */}
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-1.5 flex-1 rounded-full ${modalStep >= s ? 'bg-indigo-600' : 'bg-slate-800'}`} />
                        ))}
                    </div>

                    {modalStep === 1 && (
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic block mb-2">1. Bo'lim tanlash</label>
                            <div className="grid grid-cols-2 gap-4">
                                {DEPARTMENTS.map(dept => (
                                    <button
                                        key={dept.id}
                                        onClick={() => { setSelectedDeptId(dept.id); setModalStep(2); }}
                                        className={`p-5 rounded-[24px] border border-slate-800 text-left hover:bg-slate-800 hover:border-slate-700 transition-all flex flex-col group ${selectedDeptId === dept.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950'}`}
                                    >
                                        <span className={`text-xs font-black uppercase italic ${selectedDeptId === dept.id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`}>{dept.name}</span>
                                        <span className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-tighter">{dept.count} ishchi</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {modalStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic block">2. Ishchilarni tanlang</label>
                                <button onClick={() => {
                                    const dws = workers.filter(w => w.departmentId === selectedDeptId);
                                    setSelectedWorkerIds(selectedWorkerIds.length === dws.length ? [] : dws.map(w => w.id));
                                }} className="text-[10px] font-black text-indigo-400 uppercase italic">Barchasini tanlash</button>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 rounded-[24px] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                {workers.filter(w => w.departmentId === selectedDeptId).map(worker => (
                                    <label key={worker.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 cursor-pointer border-b border-slate-900 last:border-0">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                                            checked={selectedWorkerIds.includes(worker.id)}
                                            onChange={(e) => {
                                                setSelectedWorkerIds(prev => e.target.checked ? [...prev, worker.id] : prev.filter(id => id !== worker.id));
                                            }}
                                        />
                                        <div>
                                            <p className="text-sm font-black text-white italic uppercase tracking-tighter">{worker.name}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{worker.id}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setModalStep(1)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase italic text-xs">Orqaga</button>
                                <button
                                    disabled={selectedWorkerIds.length === 0}
                                    onClick={() => setModalStep(3)}
                                    className="flex-[2] py-4 bg-indigo-600 rounded-2xl font-black uppercase italic text-xs text-white"
                                >
                                    Keyingi bosqich ({selectedWorkerIds.length})
                                </button>
                            </div>
                        </div>
                    )}

                    {modalStep === 3 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic block">Sabab</label>
                                    <select
                                        value={callInForm.reason}
                                        onChange={e => setCallInForm({ ...callInForm, reason: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-white outline-none focus:border-indigo-500"
                                    >
                                        <option>Tozalov</option>
                                        <option>Ta'mirlash</option>
                                        <option>Bayram</option>
                                        <option>Ishlab chiqarish</option>
                                        <option>Boshqa</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic block">Izoh</label>
                                    <input
                                        type="text"
                                        placeholder="Izoh..."
                                        value={callInForm.note}
                                        onChange={e => setCallInForm({ ...callInForm, note: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-black text-white outline-none focus:border-indigo-500 italic"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic block">Boshlanish</label>
                                    <input type="time" value={callInForm.start} onChange={e => setCallInForm({ ...callInForm, start: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono font-black text-white" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic block">Tugash</label>
                                    <input type="time" value={callInForm.end} onChange={e => setCallInForm({ ...callInForm, end: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono font-black text-white" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setModalStep(2)} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black uppercase italic text-xs">Orqaga</button>
                                <button onClick={handleAddCallIn} className="flex-[2] py-4 bg-emerald-600 rounded-2xl font-black uppercase italic text-xs text-white">✓ Saqlash</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
      `}</style>
        </div>
    );
}
