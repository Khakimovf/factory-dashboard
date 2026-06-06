import { useState, useEffect } from 'react';
import {
    Clock, Activity, Search, Filter,
    Download, ChevronDown, ChevronRight,
    User, Shield, ShieldAlert, CheckCircle2,
    Calendar, Database, Globe, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

interface AuditLog {
    id: string;
    timestamp: string;
    user_id: string;
    username: string;
    action: string;
    module: string;
    status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
    ip_address: string;
    details?: any;
    old_value?: any;
    new_value?: any;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('ALL');
    const [dateRange, setDateRange] = useState('24H');

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, searchTerm, moduleFilter, dateRange]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/v1/admin/audit');
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            toast.error("Audit ma'lumotlarini yuklab bo'lmadi");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...logs];

        // Search filter
        if (searchTerm) {
            result = result.filter(log =>
                log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Module filter
        if (moduleFilter !== 'ALL') {
            result = result.filter(log => log.module === moduleFilter);
        }

        // Date range filter
        const now = new Date();
        if (dateRange === '24H') {
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            result = result.filter(log => new Date(log.timestamp) >= yesterday);
        } else if (dateRange === '7D') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            result = result.filter(log => new Date(log.timestamp) >= lastWeek);
        }

        setFilteredLogs(result);
    };

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'WARNING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'CRITICAL': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const handleExport = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: 'Hisobot tayyorlanmoqda...',
            success: 'Audit hisoboti (PDF) muvaffaqiyatli yuklab olindi',
            error: 'Xatolik yuz berdi',
        });
    };

    return (
        <div className="min-h-full bg-slate-950 p-8 space-y-8 font-sans">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-violet-600/10 rounded-2xl flex items-center justify-center border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                        <Shield className="text-violet-500 w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-1">
                            Xavfsizlik <span className="text-violet-500">Jurnali</span>
                        </h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            Global Activity Monitoring & Audit Trail
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-xl group"
                >
                    <Download className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
                    Hisobotni yuklab olish
                </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/50 backdrop-blur-xl">
                <div className="relative col-span-1 lg:col-span-2">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Foydalanuvchi, amal yoki ID qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all font-medium"
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                        <select
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-xs font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all cursor-pointer"
                        >
                            <option value="ALL">Barcha Modullar</option>
                            <option value="ADMIN">Admin</option>
                            <option value="QC">QC</option>
                            <option value="VGM">VGM</option>
                            <option value="PRODUCTION">Production</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 pointer-events-none" />
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-xs font-black uppercase tracking-widest appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all cursor-pointer"
                        >
                            <option value="24H">Oxirgi 24 soat</option>
                            <option value="7D">Oxirgi 7 kun</option>
                            <option value="ALL">Barcha vaqt</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-slate-900/30 rounded-3xl border border-slate-800/60 overflow-hidden backdrop-blur-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="w-10 px-6 py-5"></th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Vaqt</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Foydalanuvchi</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Amal turi</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Modul</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">IP-Manzil</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                            {filteredLogs.map((log) => (
                                <><tr
                                    key={log.id}
                                    onClick={() => toggleRow(log.id)}
                                    className="hover:bg-slate-800/20 transition-all cursor-pointer group"
                                >
                                    <td className="px-6 py-5">
                                        {expandedRows.has(log.id) ?
                                            <ChevronDown className="w-4 h-4 text-violet-500" /> :
                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                                        }
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white tracking-tight">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            <span className="text-[10px] text-slate-500 font-bold">{new Date(log.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-white uppercase italic tracking-tight">{log.username}</div>
                                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ID: {log.user_id || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs font-bold text-slate-200 uppercase tracking-tight bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 inline-block">
                                            {log.action}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.1em]">
                                            {log.module}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                            <MapPin className="w-3 h-3 text-slate-600" />
                                            {log.ip_address || '0.0.0.0'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={`px-3 py-1 rounded-full text-[9px] font-black border tracking-widest ${getStatusStyle(log.status)}`}>
                                            {log.status === 'SUCCESS' && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                                            {log.status === 'WARNING' && <Shield className="w-2.5 h-2.5 mr-1" />}
                                            {log.status === 'CRITICAL' && <ShieldAlert className="w-2.5 h-2.5 mr-1" />}
                                            {log.status}
                                        </Badge>
                                    </td>
                                </tr>
                                    <AnimatePresence>
                                        {expandedRows.has(log.id) && (
                                            <tr>
                                                <td colSpan={7} className="px-10 py-0 bg-slate-900/50">
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="py-6 grid grid-cols-2 gap-8 border-l border-violet-500/30 ml-2 pl-8 my-4">
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Oldingi Qiymat (Old Data)</h4>
                                                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-rose-500/10 font-mono text-[11px] text-slate-400 overflow-x-auto">
                                                                    {log.old_value ? JSON.stringify(log.old_value, null, 2) : '// No changes recorded'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Yangi Qiymat (New Metadata)</h4>
                                                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-emerald-500/10 font-mono text-[11px] text-emerald-400/80 overflow-x-auto shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                                                                    {log.new_value ? JSON.stringify(log.new_value, null, 2) : (log.details ? JSON.stringify(log.details, null, 2) : '// No metadata available')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </>
                            ))}

                            {filteredLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-600">
                                            <Search className="w-12 h-12 opacity-20" />
                                            <p className="font-bold uppercase italic tracking-widest text-xs">Ma'lumot topilmadi</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
