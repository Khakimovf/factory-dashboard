import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Wrench, AlertCircle, Clock, CheckCircle2, Factory,
    ShieldAlert, Zap, AlertTriangle, ArrowRight,
    Search, Filter, Download, FileText, Send, Camera, ClipboardList
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';

// Mock Data
const stats = [
    { label: 'MTTR', value: '42 min', change: '-12%', trend: 'down', color: 'text-cyan-400' },
    { label: 'Active Tasks', value: '03', change: 'ALIVE', trend: 'up', color: 'text-amber-400' },
    { label: 'Uptime', value: '98.4%', change: '+0.5%', trend: 'up', color: 'text-emerald-400' },
];

const historyData = [
    { id: 'WO-1042', line: 'Line A', issue: 'Hydraulic Leak', severity: 'CRITICAL', status: 'OPEN', time: '10:45' },
    { id: 'WO-1041', line: 'Line C', issue: 'Sensor Fault', severity: 'MEDIUM', status: 'IN_PROGRESS', time: '09:20' },
    { id: 'WO-1040', line: 'Line B', issue: 'Belt Tension', severity: 'LOW', status: 'RESOLVED', time: '08:15' },
];

export function MaintenancePage() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans pb-20">
            {/* 1. ANDON CALL PANEL (Top Section) */}
            <section className="p-8 border-b border-slate-800 bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 italic uppercase">
                                <Wrench className="w-10 h-10 text-cyan-500 animate-pulse" />
                                Maintenance Andon System
                            </h1>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live IoT Monitoring | {currentTime.toLocaleString('uz-UZ')}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl min-w-[140px] shadow-xl">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button className="group relative bg-rose-600/10 border border-rose-500/30 hover:border-rose-500 rounded-3xl p-10 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-rose-900/20 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldAlert className="w-20 h-20 text-rose-500" /></div>
                            <div className="relative z-10 text-left">
                                <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-500/40">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">CRITICAL</h3>
                                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Liniya To'xtadi (Emergency)</p>
                            </div>
                        </button>

                        <button className="group relative bg-amber-600/10 border border-amber-500/30 hover:border-amber-500 rounded-3xl p-10 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-amber-900/20 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><AlertTriangle className="w-20 h-20 text-amber-500" /></div>
                            <div className="relative z-10 text-left">
                                <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/40">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">MEDIUM</h3>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Sifat / Tezlik Pasayishi</p>
                            </div>
                        </button>

                        <button className="group relative bg-emerald-600/10 border border-emerald-500/30 hover:border-emerald-500 rounded-3xl p-10 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-emerald-900/20 overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><CheckCircle2 className="w-20 h-20 text-emerald-500" /></div>
                            <div className="relative z-10 text-left">
                                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/40">
                                    <Wrench className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">LOW</h3>
                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Rejali / Profilaktika</p>
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. ANALYTICS (Middle Section) */}
            <section className="p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-[300px]">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BarChart className="w-4 h-4 text-cyan-500" /> Kunlik Chaqiruvlar Dinamikasi
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[{ time: '08:00', calls: 2 }, { time: '10:00', calls: 5 }, { time: '12:00', calls: 3 }]}>
                                <Area type="monotone" dataKey="calls" stroke="#06b6d4" fill="#06b6d420" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 h-[300px]">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-500" /> Response Time Trend (Real-time)
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ day: 'Mon', mttr: 45 }, { day: 'Tue', mttr: 40 }, { day: 'Wed', mttr: 42 }]}>
                                <Bar dataKey="mttr" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. INCIDENT HISTORY GRID (Bottom Section) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 backdrop-blur-md">
                        <div className="flex items-center gap-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-cyan-400" />
                                Chaqiruvlar Tarixi (Incidents)
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                <input
                                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-700 w-64 focus:outline-none focus:border-cyan-500/50"
                                    placeholder="Qidirish (Line, ID)..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-5 py-2.5 rounded-xl transition-all border border-slate-700">
                                <Download className="w-3.5 h-3.5" />
                                Excel
                            </button>
                            <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-xl transition-all shadow-xl shadow-rose-900/20">
                                <FileText className="w-3.5 h-3.5" />
                                PDF
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Liniya</th>
                                    <th className="px-6 py-4">Muammo</th>
                                    <th className="px-6 py-4">Daraja</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Vaqt</th>
                                    <th className="px-6 py-4">Harakat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {historyData.map((row, i) => (
                                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-black text-cyan-500">{row.id}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-white">{row.line}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{row.issue}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${row.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                row.severity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                                }`}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${row.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                                                    }`} />
                                                <span className="text-[10px] font-black uppercase text-slate-300">{row.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.time}</td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

const BarChartIcon = ({ className }: { className?: string }) => <BarChart className={className} />;
const ClipboardIcon = ({ className }: { className?: string }) => <ClipboardList className={className} />;
