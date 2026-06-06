import React, { useState } from 'react';
import {
    Search, Scan, Filter, ChevronRight, FileText, Download,
    Package, Settings, Microscope, Truck, AlertCircle, Info,
    CheckCircle2, AlertTriangle, User, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TraceRecord {
    id: string;
    partName: string;
    date: string;
    status: 'PASS' | 'FAIL' | 'HOLD';
    details: any;
}

const MOCK_RECORDS: TraceRecord[] = [
    {
        id: 'TR-2026-001',
        partName: 'Dashboard Cover (Lumma)',
        date: '2026-06-02 10:45',
        status: 'PASS',
        details: {
            raw: { material: 'ABS Granula 750', batch: 'LOT-99812', supplier: 'PetroChem Co.', certificate: 'ISO-QC-2026' },
            prod: { machine: 'IMM-05 (400T)', mold: 'MOLD-DB-01', cycle: 42.5, operator: 'Farrux X.' },
            qc: { inspector: 'Dilnoza O.', result: '98.5% Accuracy', defect: null },
            delivery: { asn: 'ASN-7721', status: 'In Transit', driver: 'Otabek M.' }
        }
    },
    {
        id: 'TR-2026-002',
        partName: 'Door Panel FL (Black)',
        date: '2026-06-02 11:20',
        status: 'FAIL',
        details: {
            raw: { material: 'PP Copolymer 102', batch: 'LOT-88210', supplier: 'Samsung Chem', certificate: 'ISO-QC-2025' },
            prod: { machine: 'IMM-12 (250T)', mold: 'MOLD-DP-44', cycle: 38.0, operator: 'Anvar T.' },
            qc: { inspector: 'Dilnoza O.', result: 'Surface Scratches', defect: 'D-004' },
            delivery: { asn: null, status: 'Quarantined', driver: null }
        }
    },
    {
        id: 'TR-2026-003',
        partName: 'Center Console Base',
        date: '2026-06-02 09:15',
        status: 'HOLD',
        details: {
            raw: { material: 'ABS Granula 750', batch: 'LOT-99812', supplier: 'PetroChem Co.', certificate: 'ISO-QC-2026' },
            prod: { machine: 'IMM-05 (400T)', mold: 'MOLD-CC-02', cycle: 45.2, operator: 'Bobur M.' },
            qc: { inspector: 'Pending Approval', result: 'Dimensional Var.', defect: 'D-012' },
            delivery: { asn: null, status: 'Blocked', driver: null }
        }
    },
    // Add more mock records to reach 10
    ...Array.from({ length: 7 }, (_, i) => ({
        id: `TR-2026-00${i + 4}`,
        partName: ['A-Pillar Trim', 'B-Pillar Trim', 'Glove Box', 'Air Vent Bezel'][i % 4],
        date: '2026-06-01 14:00',
        status: (i % 3 === 0 ? 'PASS' : 'PASS') as 'PASS' | 'FAIL' | 'HOLD', // Mostly PASS
        details: {
            raw: { material: 'ABS/PC Blend', batch: `LOT-77${i}0`, supplier: 'LG Chem', certificate: 'ISO-QC-2026' },
            prod: { machine: 'IMM-08', mold: 'MOLD-P-02', cycle: 30.5, operator: 'Jasur B.' },
            qc: { inspector: 'Dilnoza O.', result: 'Perfect', defect: null },
            delivery: { asn: `ASN-88${i}2`, status: 'Delivered', driver: 'Sardor A.' }
        }
    }))
];

export function TraceabilityPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<TraceRecord | null>(MOCK_RECORDS[0]);

    const filteredRecords = MOCK_RECORDS.filter(r =>
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.partName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 flex flex-col h-full overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Traceability — Detal Izchilligi</h1>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">End-to-End Part Passport</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-slate-900/30 p-4 border border-slate-800/50 rounded-2xl backdrop-blur-sm space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-indigo-400" />
                        <input
                            type="text"
                            placeholder="Serial ID, Batch ID yoki QR kod kiriting..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-xl font-bold focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 italic"
                        />
                        <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <Scan className="w-5 h-5 text-indigo-400" />
                        </button>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-black uppercase italic tracking-wider transition-all shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap">
                        Qidirish
                    </button>
                </div>

                <div className="flex gap-2">
                    {['Bugun', 'Bu hafta', 'Bu oy', 'Barcha'].map(chip => (
                        <button key={chip} className="px-5 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                            {chip}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Panel: Records List */}
                <div className="w-[350px] flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredRecords.map((record) => (
                        <motion.div
                            layout
                            key={record.id}
                            onClick={() => setSelectedRecord(record)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedRecord?.id === record.id
                                    ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/5'
                                    : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-indigo-400 font-mono">{record.id}</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${record.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-500' :
                                        record.status === 'FAIL' ? 'bg-rose-500/20 text-rose-500' :
                                            'bg-amber-500/20 text-amber-500'
                                    }`}>
                                    {record.status}
                                </span>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase italic truncate">{record.partName}</h4>
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{record.date.split(' ')[0]}</span>
                                <ChevronRight size={14} className={selectedRecord?.id === record.id ? 'text-indigo-400' : 'text-slate-700'} />
                            </div>
                        </motion.div>
                    ))}
                    {filteredRecords.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 opacity-20 text-center">
                            <History size={48} className="mb-4" />
                            <p className="text-xs font-black uppercase italic">Ma'lumot topilmadi</p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Detail Passport */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {selectedRecord ? (
                            <motion.div
                                key={selectedRecord.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-slate-900/30 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm"
                            >
                                {/* ID Card Header */}
                                <div className="p-8 bg-gradient-to-br from-slate-950 to-slate-900 relative border-b border-slate-800">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                        <Scan size={120} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                                                {selectedRecord.partName}
                                            </h2>
                                            <p className="text-indigo-400 font-mono font-black text-lg tracking-[0.2em]">#{selectedRecord.id}</p>
                                        </div>
                                        <div className={`px-6 py-3 rounded-2xl flex flex-col items-center border font-black ${selectedRecord.status === 'PASS' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' :
                                                selectedRecord.status === 'FAIL' ? 'border-rose-500/30 bg-rose-500/10 text-rose-500' :
                                                    'border-amber-500/30 bg-amber-500/10 text-amber-500'
                                            }`}>
                                            <span className="text-[10px] uppercase opacity-60 mb-1">Status</span>
                                            <span className="text-2xl italic tracking-tighter">{selectedRecord.status}</span>
                                        </div>
                                    </div>

                                    {selectedRecord.status === 'FAIL' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-4 group"
                                        >
                                            <AlertTriangle className="text-rose-500 w-8 h-8 animate-pulse" />
                                            <div>
                                                <h4 className="text-rose-500 text-xs font-black uppercase tracking-widest">Diqqat: Sifat ogohlantirishi</h4>
                                                <p className="text-rose-400/80 text-[11px] font-bold">Bu detal REJECT qilingan — 8D jarayoni boshlangan</p>
                                            </div>
                                            <button className="ml-auto bg-rose-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-rose-400 transition-all">
                                                8D Report
                                            </button>
                                        </motion.div>
                                    )}
                                    {selectedRecord.status === 'HOLD' && (
                                        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-4">
                                            <AlertCircle className="text-amber-500 w-8 h-8" />
                                            <div>
                                                <h4 className="text-amber-500 text-xs font-black uppercase tracking-widest">Tekshiruvda</h4>
                                                <p className="text-amber-400/80 text-[11px] font-bold">Bu detal tekshiruvda ushlab turilgan</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Section 1: Raw Materials */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Package className="text-indigo-400 w-5 h-5" />
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">📦 Xomashyo (Raw Material)</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-colors">
                                                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Granula / Polimer</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-black text-slate-200">{selectedRecord.details.raw.material}</span>
                                                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded">{selectedRecord.details.raw.batch}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-600 mt-2">Supplier: {selectedRecord.details.raw.supplier}</p>
                                            </div>
                                            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-colors">
                                                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Sertifikatsiya</p>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                    <span className="text-sm font-black text-slate-200 uppercase italic">Valid Certificate</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-600 mt-2">Doc ID: {selectedRecord.details.raw.certificate}</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section 2: Production Data */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Settings className="text-indigo-400 w-5 h-5" />
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">⚙️ Ishlab Chiqarish (Production)</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Uskuna', val: selectedRecord.details.prod.machine, sub: 'IMM Injection' },
                                                { label: 'Qolip ID', val: selectedRecord.details.prod.mold, sub: 'Active Mold' },
                                                { label: 'Sikl vaqti', val: `${selectedRecord.details.prod.cycle} s`, sub: 'Nominal' },
                                                { label: 'Operator', val: selectedRecord.details.prod.operator, sub: 'ID: 4421' }
                                            ].map((item, i) => (
                                                <div key={i} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase mb-1">{item.label}</p>
                                                    <p className="text-sm font-black text-white truncate">{item.val}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.1em] mt-1">{item.sub}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Section 3: QC Status */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Microscope className="text-indigo-400 w-5 h-5" />
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">🔬 Sifat Nazorati (QC)</h3>
                                        </div>
                                        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden">
                                            <div className="flex flex-col md:flex-row items-center p-6 gap-8">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                                        <User className="text-indigo-400 w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase">Inspektor</p>
                                                        <p className="text-sm font-black text-white uppercase">{selectedRecord.details.qc.inspector}</p>
                                                    </div>
                                                </div>
                                                <div className="h-10 w-px bg-slate-800 hidden md:block" />
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Tekshiruv natijasi</p>
                                                    <p className="text-sm font-black text-white italic">{selectedRecord.details.qc.result}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Defekt kodi</p>
                                                    <p className="text-sm font-black text-rose-400">{selectedRecord.details.qc.defect || 'YO\'Q'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section 4: Delivery */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Truck className="text-indigo-400 w-5 h-5" />
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-widest">🚚 Yetkazib Berish (Delivery)</h3>
                                        </div>
                                        <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-3xl relative overflow-hidden">
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                                            <div className="relative z-10 flex justify-between">
                                                {[
                                                    { icon: Package, label: 'Tayyor', date: '08:00', active: true },
                                                    { icon: Truck, label: 'Yo\'lda', date: '09:30', active: !!selectedRecord.details.delivery.asn },
                                                    { icon: CheckCircle2, label: 'VGM', date: '11:00', active: selectedRecord.details.delivery.status === 'Delivered' }
                                                ].map((step, i) => (
                                                    <div key={i} className="flex flex-col items-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 ${step.active ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-700'
                                                            }`}>
                                                            <step.icon size={18} />
                                                        </div>
                                                        <p className={`text-[10px] font-black uppercase ${step.active ? 'text-white' : 'text-slate-600'}`}>{step.label}</p>
                                                        <p className="text-[8px] font-bold text-slate-500 mt-1">{step.date}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-4">
                                        <button className="flex-1 bg-white/5 hover:bg-white/10 border border-slate-800 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center justify-center gap-3 transition-all">
                                            <FileText size={18} />
                                            PDF Passport Yuklash
                                        </button>
                                        <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-500/20">
                                            <Download size={18} />
                                            Batafsil Hisob (XML)
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex items-center justify-center opacity-20">
                                <div className="text-center">
                                    <Info size={64} className="mx-auto mb-4" />
                                    <p className="text-lg font-black uppercase italic tracking-widest text-slate-500">Detalni tanlang</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
