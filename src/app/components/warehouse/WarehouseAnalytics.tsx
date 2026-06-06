import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Target, Activity, Clock, Download, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const data = [
    { name: 'Mon', in: 4000, out: 2400 },
    { name: 'Tue', in: 3000, out: 1398 },
    { name: 'Wed', in: 2000, out: 9800 },
    { name: 'Thu', in: 2780, out: 3908 },
    { name: 'Fri', in: 1890, out: 4800 },
    { name: 'Sat', in: 2390, out: 3800 },
    { name: 'Sun', in: 3490, out: 4300 },
];

const pieData = [
    { name: 'Unrestricted', value: 75, color: '#10b981' },
    { name: 'Reserved', value: 15, color: '#f59e0b' },
    { name: 'Blocked', value: 5, color: '#f43f5e' },
    { name: 'Quality', value: 5, color: '#3b82f6' },
];

export const WarehouseAnalytics: React.FC = () => {
    const [timeRange, setTimeRange] = React.useState('7D');
    const [zoneFilter, setZoneFilter] = React.useState('ALL');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-blue-500" />
                        Warehouse Performance Cockpit
                    </h3>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mt-1">Cross-module statistical intelligence</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                        {['24H', '7D', '30D', '90D'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTimeRange(t)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${timeRange === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <select
                        value={zoneFilter}
                        onChange={(e) => setZoneFilter(e.target.value)}
                        className="h-10 bg-slate-950 border border-slate-800 rounded-xl px-4 text-[10px] font-black uppercase text-white outline-none focus:border-blue-500/50"
                    >
                        <option value="ALL">All Zones</option>
                        <option value="A">Zone Alpha</option>
                        <option value="B">Zone Bravo</option>
                        <option value="C">Zone Charlie</option>
                    </select>
                    <Button
                        variant="outline"
                        className="h-10 border-slate-800 bg-slate-950/50 hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-400 gap-2"
                        onClick={() => toast.success("Analytical Report Generated", { description: "Download will start shortly in XLSX format." })}
                    >
                        <Download className="w-4 h-4" /> Export Report
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Activity className="w-24 h-24" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            Stock Movements (Inbound / Outbound)
                        </CardTitle>
                        <CardDescription>7-Day material flow analysis from SAP S/4HANA</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="in" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                                <Area type="monotone" dataKey="out" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-amber-500" />
                            Inventory Composition
                        </CardTitle>
                        <CardDescription>Stock breakdown by SAP categories</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="200">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-4 w-full mt-6">
                            {pieData.map(item => (
                                <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-950/50 rounded border border-slate-800">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.name}</span>
                                        <span className="text-sm font-bold">{item.value}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Turnover Ratio', val: '4.2x', trend: '+12%', icon: BarChart3, color: 'text-blue-500' },
                    { label: 'Picking Accuracy', val: '99.8%', trend: '+0.1%', icon: Target, color: 'text-emerald-500' },
                    { label: 'Dock-to-Stock', val: '45m', trend: '-15%', icon: Clock, color: 'text-amber-500' },
                    { label: 'System Health', val: 'Optimal', trend: 'STABLE', icon: Activity, color: 'text-purple-500' },
                ].map((kpi, idx) => (
                    <Card key={idx} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-800 ${kpi.color}`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase font-black">{kpi.label}</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-lg font-bold">{kpi.val}</span>
                                    <span className={`text-[10px] font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-500' : kpi.trend === 'STABLE' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                        {kpi.trend}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
