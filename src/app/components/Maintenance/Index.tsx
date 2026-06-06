import React, { useState, useEffect } from 'react';
import {
    Wrench, Clock, Activity, ShieldAlert, Cpu, Zap,
    CheckCircle2, TrendingDown, TrendingUp, Factory,
    Layers, BarChart3, Calendar, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { TooltipProvider } from '../ui/tooltip';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { DataGridUtility } from '../common/DataGridUtility';

// Mock Data
const topographyData = [
    { name: 'Assembly A', issues: 12, critical: 3 },
    { name: 'Assembly D', issues: 8, critical: 1 },
    { name: 'Warehouse', issues: 5, critical: 0 },
    { name: 'Console Line', issues: 18, critical: 5 },
    { name: 'Stamping Press', issues: 14, critical: 4 },
];

const uptimeTrendData = [
    { month: 'Yan', uptime: 97.2 },
    { month: 'Fev', uptime: 96.8 },
    { month: 'Mar', uptime: 98.1 },
    { month: 'Apr', uptime: 97.5 },
    { month: 'May', uptime: 98.9 },
    { month: 'Iyun', uptime: 98.4 },
];

const recurringIssues = [
    { equip: 'Hydraulic Press 04', lastRepair: '2026-03-05', count: 4, action: 'Almashtirish lozim', status: 'critical' },
    { equip: 'Conveyor Drive B', lastRepair: '2026-03-01', count: 3, action: 'Kapital ta\'mir', status: 'warning' },
    { equip: 'Sensor Array X', lastRepair: '2026-02-28', count: 5, action: 'Dasturni yangilash', status: 'critical' },
];

export default function MaintenanceIndex() {
    const { t } = useLanguage();
    const { productionLines } = useFactory();

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col min-h-screen bg-[#020617] text-slate-100 font-sans pb-20">

                {/* GLOBAL HEADER */}
                <div className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#020617]/80 backdrop-blur-3xl border-b border-slate-800/50 shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
                                <Wrench className="w-8 h-8 text-cyan-400" /> Maintenance <span className="text-cyan-500 underline decoration-cyan-500/30 underline-offset-8">COCKPIT</span>
                            </h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Real-Time Factory Response Hub</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 font-black text-[9px] uppercase tracking-widest">Live Operations</Badge>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1800px] mx-auto w-full px-8 pt-8 space-y-12">

                    {/* SECTION 1: Status Counters & Alerts */}
                    <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* MTTR Card */}
                            <Card className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-lg">
                                        <Clock className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 font-mono text-[10px]">-12%</Badge>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Mean Time To Repair</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black font-mono text-white tracking-tighter">42</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Minutes</span>
                                </div>
                            </Card>

                            {/* Open/Active Card */}
                            <Card className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-lg">
                                        <ShieldAlert className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <Badge variant="outline" className="bg-amber-500/5 text-amber-400 border-amber-500/20 font-mono text-[10px]">Active</Badge>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Open Work Orders</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black font-mono text-white tracking-tighter">02</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incident</span>
                                </div>
                            </Card>

                            {/* Uptime Card */}
                            <Card className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg">
                                        <Activity className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 font-mono text-[10px]">Optimal</Badge>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Global Factory Uptime</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black font-mono text-emerald-400 tracking-tighter">98.4%</span>
                                </div>
                            </Card>
                        </div>

                        {/* System Signals */}
                        <Card className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl backdrop-blur-md flex flex-col">
                            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <Cpu className="w-4 h-4 text-cyan-400" /> System Signals
                            </h3>
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="border-l-2 border-emerald-500 pl-4 py-1">
                                    <p className="text-[10px] font-black text-white">Power Grid</p>
                                    <p className="text-xs text-slate-500 mt-1">Voltage Stabilized at Sector 4</p>
                                </div>
                                <div className="border-l-2 border-amber-500 pl-4 py-1">
                                    <p className="text-[10px] font-black text-white">Warehouse</p>
                                    <p className="text-xs text-slate-500 mt-1">Low stocks: Hydraulic Seal X-200</p>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* SECTION 2: BI Analytics & Trends */}
                    <section className="pt-12 border-t border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-emerald-500" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Industrial Reliability Trends</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-8 rounded-3xl h-[450px]">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Factory Uptime Timeline (Last 6 Months)</h4>
                                <div className="w-full h-full pb-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={uptimeTrendData}>
                                            <defs>
                                                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis domain={[95, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px' }} />
                                            <Area type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorUptime)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className="bg-slate-900/40 border border-slate-800 p-8 rounded-3xl h-[450px]">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Nosozliklar Topografiyasi</h4>
                                <div className="w-full h-full pb-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topographyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px' }} />
                                            <Bar dataKey="issues" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* SECTION 3: Historical Data Grid & Advanced Management */}
                    <section className="pt-12 border-t border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-amber-500" />
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Maintenance History & Diagnostics</h2>
                            </div>
                        </div>

                        <DataGridUtility
                            title="Fault Reports & Recurring Incidents"
                            data={recurringIssues.map((issue, idx) => ({
                                id: `FLT-00${idx + 1}`,
                                equipment: issue.equip,
                                frequency: `${issue.count}x / Month`,
                                lastRepair: issue.lastRepair,
                                recommendation: issue.action,
                                status: issue.status.toUpperCase()
                            }))}
                            columns={[
                                { key: 'id', label: 'Fault ID' },
                                { key: 'equipment', label: 'Equipment Name' },
                                { key: 'frequency', label: 'Frequency' },
                                { key: 'lastRepair', label: 'Last Fixed' },
                                { key: 'recommendation', label: 'System Action' },
                                {
                                    key: 'status',
                                    label: 'Severity',
                                    render: (val) => (
                                        <Badge className={`text-[9px] font-black uppercase tracking-widest ${val === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                            {val}
                                        </Badge>
                                    )
                                }
                            ]}
                            onImport={() => console.log('Import triggered')}
                            onExport={(fmt) => console.log(`Export ${fmt} triggered`)}
                        />
                    </section>

                </div>
            </div>
        </TooltipProvider>
    );
}
