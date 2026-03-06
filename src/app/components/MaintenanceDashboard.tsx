import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import {
  Wrench, AlertCircle, Clock, CheckCircle, Factory, X,
  Activity, ShieldAlert, Cpu, Zap, UserCircle, CheckCircle2,
  TrendingDown, TrendingUp, AlertTriangle, MapPin, ArrowRight,
  ClipboardList, Image as ImageIcon, Send, Upload, FileSignature,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Calendar, Layers, Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';

// --- Types ---
type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
type NodeStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFIED';
type MainTab = 'OPERATIONS' | 'ANALYTICS';
type TimeFilter = 'KUNLIK' | 'OYLIK' | 'YILLIK' | 'MAXSUS';

interface WorkOrder {
  id: string;
  lineId: string;
  source: string;
  issue: string;
  severity: Severity;
  status: NodeStatus;
  reportedAt: Date;
  history: string[];
  toolsRequired: string[];
  assignedTo?: string;
  evidencePhoto?: string;
  resolutionSteps?: string;
}

// --- Mock Data for Analytics ---
const topographyData = [
  { name: 'Assembly A', issues: 12, critical: 3 },
  { name: 'Assembly D', issues: 8, critical: 1 },
  { name: 'Warehouse', issues: 5, critical: 0 },
  { name: 'Console Line', issues: 18, critical: 5 },
  { name: 'Stamping Press', issues: 14, critical: 4 },
];

const issueClassificationData = [
  { name: 'Mexanik', value: 45, color: '#f59e0b' },
  { name: 'Elektr', value: 25, color: '#ef4444' },
  { name: 'Dasturiy xatolik', value: 15, color: '#0ea5e9' },
  { name: 'Operator xatosi', value: 10, color: '#10b981' },
  { name: 'Gidravlika', value: 5, color: '#8b5cf6' },
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
  { equip: 'Pneumatic Valve 12', lastRepair: '2026-02-20', count: 2, action: 'Doimiy tekshiruv', status: 'info' },
];

export function MaintenanceDashboard() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();

  // Real-time Dashboard Counters
  const [mttr, setMttr] = useState(42);
  const [uptime, setUptime] = useState(98.4);
  const [activeCount, setActiveCount] = useState(2);

  // Main Module Tab
  const [mainTab, setMainTab] = useState<MainTab>('OPERATIONS');

  // Analytics State
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('OYLIK');

  // Mock Active Work Orders
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 'WO-1042',
      lineId: '1',
      source: 'Assembly Line A - Sector 4',
      issue: 'Hydraulic Pressure Drop in Press Module',
      severity: 'CRITICAL',
      status: 'OPEN',
      reportedAt: new Date(Date.now() - 15 * 60000), // 15 mins ago
      history: [
        'Valve Replacement (2 months ago)',
        'Fluid Top-up (3 months ago)',
        'Sensor Calibration (6 months ago)',
        'Routine Inspection (8 months ago)'
      ],
      toolsRequired: ['Hydraulic Seal X-200', 'Pressure Gauge Kit', 'Wrench Set M10-M24']
    },
    {
      id: 'WO-1043',
      lineId: '3',
      source: 'Assembly Line D - Sector 2',
      issue: 'Conveyor Belt Motor Overheating',
      severity: 'WARNING',
      status: 'ASSIGNED',
      reportedAt: new Date(Date.now() - 45 * 60000), // 45 mins ago
      history: [
        'Bearing Lubrication (1 month ago)',
        'Motor Alignment (4 months ago)',
        'Electrical Diagnostic (5 months ago)',
        'Belt Tension Adjustment (7 months ago)'
      ],
      toolsRequired: ['Thermal Camera', 'Lubricant V-90', 'Multimeter'],
      assignedTo: 'Jamoliddin J'
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Modal Navigation State
  const [activeTab, setActiveTab] = useState<'details' | 'assignment' | 'verification'>('details');

  // Evidence Form State
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [resolutionSteps, setResolutionSteps] = useState('');
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);

  // System-Wide Alerts (Mock)
  const [systemAlerts, setSystemAlerts] = useState([
    { source: 'Warehouse', msg: 'Low stock on Hydraulic Seal X-200', type: 'warning', time: '10 mins ago' },
    { source: 'Quality Control', msg: 'Tolerance drift detected on Line B', type: 'info', time: '1 hour ago' },
    { source: 'Power Grid', msg: 'Voltage fluctuation in Sector 4', type: 'critical', time: '2 mins ago' }
  ]);

  // Helper: Format elapsed downtime
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setActiveCount(workOrders.filter(wo => wo.status !== 'VERIFIED').length);
  }, [workOrders]);

  const formatDowntime = (startTime: Date, isVerified = false) => {
    if (isVerified) return '00:00';
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'OPEN': return 'text-red-500 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'ASSIGNED': return 'text-amber-500 bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
      case 'IN_PROGRESS': return 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
      case 'VERIFIED': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    }
  };

  const assignTech = (orderId: string, technician: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === orderId) {
        return { ...wo, status: 'ASSIGNED', assignedTo: technician };
      }
      return wo;
    }));
    toast.success('Assignment Synchronized', {
      description: `Engineer ${technician} is en route to you.`,
      icon: <UserCircle className="w-5 h-5 text-amber-500" />
    });
    setSystemAlerts(prev => [{ source: 'Maintenance Dispatch', msg: `Engineer ${technician} en route to ${selectedOrder?.source}`, type: 'warning', time: 'Just now' }, ...prev]);
    setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: 'ASSIGNED', assignedTo: technician } : prev);
  };

  const startWorkProcess = (orderId: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === orderId) return { ...wo, status: 'IN_PROGRESS' };
      return wo;
    }));
    toast.info('Work Started', { description: `Engineer is now fixing the issue` });
    setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: 'IN_PROGRESS' } : prev);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setEvidencePhoto(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const submitTicket = () => {
    if (!evidencePhoto || !resolutionSteps.trim()) return;
    setShowFinalConfirmation(true);
  };

  const confirmFinalClosure = () => {
    if (!selectedOrder) return;

    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === selectedOrder.id) {
        return { ...wo, status: 'VERIFIED', evidencePhoto, resolutionSteps };
      }
      return wo;
    }));

    setMttr(prev => Math.max(12, prev - 2));
    toast.success('Work Order Verified & Closed', {
      description: `Evidence sent back to ${selectedOrder.source}. Line Status -> NORMAL.`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    });

    setSystemAlerts(prev => [{ source: 'Maintenance Control', msg: `Ticket ${selectedOrder.id} successfully resolved. Line restored.`, type: 'info', time: 'Just now' }, ...prev]);

    setShowFinalConfirmation(false);
    setSelectedOrder(null);
    setEvidencePhoto(null);
    setResolutionSteps('');
    setActiveTab('details');
  };

  const openWorkOrderModal = (wo: WorkOrder) => {
    setSelectedOrder(wo);
    setActiveTab(wo.status === 'VERIFIED' ? 'details' : wo.status === 'IN_PROGRESS' ? 'verification' : wo.status === 'ASSIGNED' ? 'assignment' : 'details');
  };

  const handleFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    toast.info(`Time range updated to ${filter}`, { icon: <Filter className="w-4 h-4" /> });
  };

  return (
    <div className="min-h-screen p-8 bg-slate-950 font-sans text-slate-300 animate-in fade-in duration-500 pb-20">

      {/* GLOBAL HEADER & MAIN TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-1 tracking-tight">
            <Wrench className="w-8 h-8 text-cyan-400" /> Maintenance Cockpit
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Industrial IoT Response Hub</p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-inner">
          <button
            onClick={() => setMainTab('OPERATIONS')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'OPERATIONS' ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'text-slate-500 hover:text-white'
              }`}
          >
            <Layers className="w-4 h-4" /> Operations Control
          </button>
          <button
            onClick={() => setMainTab('ANALYTICS')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mainTab === 'ANALYTICS' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'text-slate-500 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4" /> BI Analytics
          </button>
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────────
          OPERATIONS CONTROL MODULE 
      ──────────────────────────────────────────────────────────────────*/}
      {mainTab === 'OPERATIONS' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Real-time Dashboard Counters */}
          <div className="mb-10 flex flex-col xl:flex-row gap-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div className="border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center gap-2">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-[10px]"><TrendingDown className="w-3 h-3 mr-1" /> -12% vs last week</Badge>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4">MTTR</p>
                  <div className="flex items-end gap-2 text-white">
                    <p className="text-5xl font-black font-mono tracking-tighter">{mttr} <span className="text-base text-slate-500 font-sans font-bold uppercase">min</span></p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Mean Time To Repair</p>
                </div>
              </div>

              <div className="border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center gap-2">
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/20 animate-pulse" />
                    <Wrench className="w-5 h-5 text-amber-400 relative z-10" />
                  </div>
                  <Badge variant="outline" className="bg-slate-950 text-amber-400 border-amber-500/30 font-mono text-[10px]">REAL-TIME</Badge>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4">Active Work Orders</p>
                  <div className="flex items-end gap-2 text-white">
                    <p className="text-5xl font-black font-mono tracking-tighter">{activeCount}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Open / Assigned / In Progress</p>
                </div>
              </div>

              <div className="border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center gap-2">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/30">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono text-[10px]"><TrendingUp className="w-3 h-3 mr-1" /> OPTIMAL</Badge>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-4">Factory Uptime</p>
                  <div className="flex items-end gap-2 text-white">
                    <p className="text-5xl font-black font-mono tracking-tighter text-emerald-400">{uptime}%</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Rolling 30-day average</p>
                </div>
              </div>
            </div>

            {/* System-Wide Alert Grid */}
            <div className="w-full xl:w-[400px] border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-slate-800 pb-3"><Cpu className="w-5 h-5 text-cyan-400" /> System-Wide Signals</h3>
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                {systemAlerts.map((alt, i) => (
                  <div key={i} className="flex gap-3 items-start border-l-2 pl-4 py-1 border-slate-800 hover:border-slate-600 transition-colors">
                    <div className={`mt-0.5 ${alt.type === 'critical' ? 'text-red-500' : alt.type === 'warning' ? 'text-amber-500' : 'text-cyan-500'}`}>
                      {alt.type === 'critical' ? <Zap className="w-4 h-4" /> : alt.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-200">{alt.source} <span className="text-[9px] text-slate-500 font-mono font-normal ml-2">{alt.time}</span></p>
                      <p className="text-sm text-slate-400 mt-1 leading-tight font-medium">{alt.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Work Order Cards */}
          <h3 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-amber-500" /> Actionable Maintenance Incidents</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
            {workOrders.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border-2 border-slate-800 border-dashed rounded-3xl bg-slate-900/50">
                <CheckCircle2 className="w-16 h-16 text-slate-700 mb-4" />
                <p className="text-xl font-black text-slate-400">All Systems Operational</p>
                <p className="text-sm font-medium mt-2">No active work orders at this time.</p>
              </div>
            ) : (
              workOrders.map(wo => {
                const isCritical = wo.severity === 'CRITICAL' && wo.status !== 'VERIFIED';
                const isVerified = wo.status === 'VERIFIED';

                return (
                  <div
                    key={wo.id}
                    onClick={() => openWorkOrderModal(wo)}
                    className={`group cursor-pointer border rounded-3xl p-6 transition-all hover:-translate-y-1 relative overflow-hidden shadow-lg
                     ${isVerified ? 'bg-slate-950/80 border-emerald-900/50 hover:border-emerald-500/50' :
                        isCritical ? 'bg-red-950/20 border-red-900/50 hover:border-red-500/50 hover:shadow-red-900/20'
                          : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 hover:shadow-amber-900/20'}`}
                  >
                    <div className={`absolute top-0 left-0 w-full h-1 ${isVerified ? 'bg-emerald-500' : isCritical ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]' : wo.status === 'IN_PROGRESS' ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`} />

                    {isCritical && <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />}

                    <div className="flex justify-between items-start mb-5">
                      <Badge variant="outline" className={`font-mono text-[10px] px-2.5 py-1 font-black shadow-inner ${getStatusColor(wo.status)}`}>
                        {wo.id} • {wo.status.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className={`font-mono text-base font-black px-2 py-0.5 rounded-lg border border-slate-800 ${isVerified ? 'text-emerald-500 bg-emerald-950/50' : 'text-white bg-slate-950'}`}>{formatDowntime(wo.reportedAt, isVerified)}</span>
                      </div>
                    </div>

                    <h4 className="text-xl font-black text-white leading-tight mb-3 pr-8">{wo.issue}</h4>
                    <p className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Factory className="w-4 h-4 text-cyan-500" /> {wo.source}</p>

                    <div className="mt-8 flex items-center justify-between border-t border-slate-800/60 pt-5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-inner ${getStatusColor(wo.status)}`}>
                        {wo.status === 'OPEN' ? 'AWAITING DISPATCH' :
                          wo.status === 'ASSIGNED' ? `EN ROUTE: ${wo.assignedTo}` :
                            wo.status === 'IN_PROGRESS' ? `FIXING: ${wo.assignedTo}` : `RESOLVED`}
                      </span>
                      {!isVerified && <span className="text-xs text-cyan-400 font-black flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-950/50 px-3 py-1.5 rounded-lg">PROCESS <ArrowRight className="w-3.5 h-3.5" /></span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────────────
          BI ANALYTICS MODULE 
      ──────────────────────────────────────────────────────────────────*/}
      {mainTab === 'ANALYTICS' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Time-Series Top Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-tight"><Calendar className="w-5 h-5 text-emerald-500" /> Date Resolution</h3>

            <div className="flex flex-wrap gap-2">
              {(['KUNLIK', 'OYLIK', 'YILLIK', 'MAXSUS'] as TimeFilter[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleFilterChange(tf)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === tf ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-950 text-slate-500 hover:text-white border border-slate-800'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Top Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* 1. Incident Hotspots BarChart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-6"><Factory className="w-4 h-4 text-cyan-500" /> Nosozliklar Topografiyasi</h4>
              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topographyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      cursor={{ fill: '#0f172a' }}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', color: '#f8fafc' }}
                      itemStyle={{ fontWeight: 'black' }}
                    />
                    <Bar dataKey="issues" name="Total Issues" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="critical" name="Critical" stackId="b" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Common Issue Types PieChart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-6"><PieChartIcon className="w-4 h-4 text-amber-500" /> Muammolar tasnifi</h4>
              <div className="flex-1 w-full relative -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueClassificationData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {issueClassificationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', color: '#f8fafc' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-black text-white">100</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mt-1">Total<br />Incidents</span>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">

            {/* 3. Reliability Trends LineChart */}
            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
              <div className="flex justify-between items-start mb-6">
                <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><LineChartIcon className="w-4 h-4 text-emerald-500" /> Zavod Uptime Trendi</h4>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-xs">Target: {'>'}98.0%</Badge>
              </div>

              <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uptimeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#64748b" domain={[90, 100]} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', color: '#f8fafc' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: any) => [`${value}%`, 'Uptime']}
                    />
                    <Area type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorUptime)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Deep-Dive Table / Critical Action Board */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[400px]">
              <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-6 pb-4 border-b border-slate-800"><AlertCircle className="w-4 h-4" /> Takroriy Nosozliklar</h4>

              <div className="flex flex-col gap-4 overflow-y-auto pr-2 flex-1">
                {recurringIssues.map((issue, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 group hover:border-slate-600 transition-colors">
                    <div className="flex justify-between items-start">
                      <h5 className="text-sm font-black text-white">{issue.equip}</h5>
                      <Badge className={`font-mono text-[10px] uppercase font-black px-2 py-0.5 ${issue.status === 'critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : issue.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                        {issue.count}x Fails
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end border-t border-slate-800/80 pt-3">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Last PM</p>
                        <p className="text-xs font-mono font-bold text-slate-300">{issue.lastRepair}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Sys. Action</p>
                        <p className={`text-[10px] font-black uppercase tracking-wider ${issue.status === 'critical' ? 'text-rose-400' : 'text-slate-300'}`}>{issue.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px]">
                View Full Report
              </Button>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          MODALS & OVERLAYS 
      ──────────────────────────────────────────────────────────────────*/}

      {/* Modal implementations ( unchanged from operations section ) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[95vh] shadow-cyan-900/20">

            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className={`font-mono text-[10px] font-black px-2 py-0.5 ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.id} • {selectedOrder.status.replace('_', ' ')}</Badge>
                <h2 className="text-xl font-black text-white tracking-tight">{selectedOrder.issue}</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors bg-slate-950 border border-slate-800"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-2 px-6 pt-6 border-b border-slate-800 bg-slate-950 shrink-0">
              <button onClick={() => setActiveTab('details')} className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-[11px] font-black uppercase tracking-widest border border-b-0 transition-colors ${activeTab === 'details' ? 'bg-slate-900 border-slate-800 text-cyan-400 relative z-10 bottom-[-1px]' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <Activity className="w-4 h-4" /> Issue Details
              </button>
              <button disabled={selectedOrder.status === 'VERIFIED'} onClick={() => setActiveTab('assignment')} className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-[11px] font-black uppercase tracking-widest border border-b-0 transition-colors ${activeTab === 'assignment' ? 'bg-slate-900 border-slate-800 text-amber-400 relative z-10 bottom-[-1px]' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'} ${selectedOrder.status === 'VERIFIED' ? 'opacity-30 cursor-not-allowed' : ''}`}>
                <UserCircle className="w-4 h-4" /> Assignment
              </button>
              <button disabled={selectedOrder.status === 'OPEN'} onClick={() => setActiveTab('verification')} className={`flex items-center gap-2 px-6 py-3 rounded-t-xl text-[11px] font-black uppercase tracking-widest border border-b-0 transition-colors ${activeTab === 'verification' ? 'bg-slate-900 border-slate-800 text-emerald-400 relative z-10 bottom-[-1px]' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'} ${selectedOrder.status === 'OPEN' ? 'opacity-30 cursor-not-allowed' : ''}`}>
                <ClipboardList className="w-4 h-4" /> Evd. & Verification
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 relative min-h-[400px]">
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-500" /> Location & Clock</h4>
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner mb-6">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Downtime Fault Origin</p>
                      <p className="text-xl font-black text-white">{selectedOrder.source}</p>
                      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Time Passed</p>
                          <p className="text-3xl font-mono font-black text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{formatDowntime(selectedOrder.reportedAt, selectedOrder.status === 'VERIFIED')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Reported</p>
                          <p className="text-xl font-mono font-black text-white">{selectedOrder.reportedAt.toLocaleTimeString('uz-UZ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 border-l border-slate-800 pl-8">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500" /> Required Tools / Parts</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.toolsRequired.map((tool, i) => (
                          <Badge key={i} variant="outline" className="bg-slate-950 border-slate-700 text-slate-300 font-bold px-3 py-1.5"><CheckCircle className="w-3.5 h-3.5 mr-2 text-emerald-500" /> {tool}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> Component History</h4>
                      <div className="relative border-l-2 border-slate-800 pl-5 space-y-4 ml-2">
                        {selectedOrder.history.map((hist, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-slate-700 rounded-full border-2 border-slate-950" />
                            <p className="text-xs text-slate-300 font-bold leading-tight">{hist.split('(')[0]}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">{hist.split('(')[1]?.replace(')', '')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assignment' && (
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col justify-center h-full">
                  {selectedOrder.status === 'OPEN' ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 shadow-xl text-center">
                      <UserCircle className="w-16 h-16 text-cyan-500 mx-auto mb-6 opacity-80" />
                      <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Dispatch Engineer</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Select a qualified PM technician to route to the line</p>

                      <div className="max-w-xs mx-auto space-y-4">
                        <Select onValueChange={(val) => assignTech(selectedOrder.id, val)}>
                          <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white font-black h-14 rounded-xl shadow-inner text-base">
                            <SelectValue placeholder="Select Technician..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white font-bold">
                            <SelectItem value="Jamoliddin J">Jamoliddin J (Lead Tech)</SelectItem>
                            <SelectItem value="Rustamov A">Rustamov A (Mechanical)</SelectItem>
                            <SelectItem value="Nurov S">Nurov S (Electrical)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-950/20 border border-amber-500/30 rounded-3xl p-10 shadow-xl text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)]" />
                      <Activity className="w-16 h-16 text-amber-500 mx-auto mb-6 opacity-80 animate-pulse" />
                      <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Active Deployment</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Engineer <span className="text-amber-400">{selectedOrder.assignedTo}</span> is currently processing this order.</p>

                      {selectedOrder.status === 'ASSIGNED' && (
                        <Button onClick={() => startWorkProcess(selectedOrder.id)} className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl text-sm transition-all shadow-lg hover:-translate-y-1">
                          <Wrench className="w-5 h-5 mr-3" /> Acknowledge & Start Work
                        </Button>
                      )}

                      {selectedOrder.status === 'IN_PROGRESS' && (
                        <div className="inline-flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-6 py-4 rounded-xl font-black font-mono tracking-widest shadow-inner">
                          <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping" />
                          WORK CURRENTLY IN PROGRESS
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'verification' && (
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {selectedOrder.status === 'VERIFIED' ? (
                    <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-3xl p-10 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-3xl font-black text-white mb-2">Work Order Closed</h3>
                      <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs">Line operation restored to normal parameters.</p>
                      <div className="mt-8 mx-auto w-64 h-64 rounded-xl overflow-hidden border-4 border-emerald-900/50 relative">
                        <img src={selectedOrder.evidencePhoto} alt="Fixed" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 w-full bg-slate-950/80 backdrop-blur text-left p-3">
                          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest font-mono">Verified Fix Evidence</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-6 shadow-inner">
                        <h4 className="text-sm font-black text-white flex items-center gap-2 mb-6 tracking-widest"><FileSignature className="w-5 h-5 text-emerald-500" /> Verification Gateway</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">1. Photographic Evidence *</p>
                            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl h-48 flex items-center justify-center overflow-hidden bg-slate-900 transition-colors group">
                              {evidencePhoto ? (
                                <>
                                  <img src={evidencePhoto} alt="Evidence" className="w-full h-full object-cover opacity-80" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white font-black text-xs uppercase tracking-widest"><Upload className="w-4 h-4 inline mr-2" /> Change Photo</p>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center">
                                  <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Fixed Photo</p>
                                </div>
                              )}
                              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                          </div>

                          <div className="space-y-3 flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">2. Resolution Steps (Bajarilgan ish) *</p>
                            <Textarea
                              value={resolutionSteps}
                              onChange={(e) => setResolutionSteps(e.target.value)}
                              placeholder="Describe the exact actions taken to resolve the issue..."
                              className="flex-1 min-h-[192px] bg-slate-900 border-slate-700 text-slate-300 font-medium rounded-2xl shadow-inner focus-visible:ring-emerald-500 font-mono text-sm leading-relaxed p-4"
                            />
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                          <Button
                            disabled={!evidencePhoto || resolutionSteps.trim().length === 0}
                            onClick={submitTicket}
                            className={`h-14 px-8 font-black uppercase tracking-widest rounded-xl text-sm transition-all flex items-center gap-3 ${evidencePhoto && resolutionSteps.trim().length > 0
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                              }`}
                          >
                            EXECUTE ORDER & SEND TICKET <Send className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {showFinalConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-950 border border-emerald-900/50 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.15)] w-full max-w-lg overflow-hidden flex flex-col items-center p-10 text-center relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-cyan-500 to-emerald-600" />
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h2 className="text-3xl font-black text-white mb-2">Confirm Resolution</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8 leading-relaxed">This action will close the ticket, reset the downtime clock, and unlock {selectedOrder?.source}.</p>

            <div className="w-full h-48 rounded-xl overflow-hidden border-2 border-slate-800 mb-8">
              <img src={evidencePhoto!} alt="Verify" className="w-full h-full object-cover" />
            </div>

            <div className="flex gap-4 w-full">
              <Button onClick={() => setShowFinalConfirmation(false)} variant="outline" className="h-14 flex-1 bg-slate-900 border-slate-700 text-slate-400 hover:text-white font-black uppercase tracking-widest rounded-xl">Cancel</Button>
              <Button onClick={confirmFinalClosure} className="h-14 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] font-black uppercase tracking-widest rounded-xl">Verify & Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
