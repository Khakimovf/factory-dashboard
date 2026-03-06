import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import {
  Wrench, AlertCircle, Clock, CheckCircle, Factory, X,
  Activity, ShieldAlert, Cpu, Zap, UserCircle, CheckCircle2,
  TrendingDown, TrendingUp, AlertTriangle, MapPin, ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

// Define the shape of a Smart Work Order
type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
type NodeStatus = 'NORMAL' | 'ISSUE_REPORTED' | 'TECHNICIAN_ASSIGNED';

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
}

export function MaintenanceDashboard() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();

  // Real-time Dashboard Counters
  const [mttr, setMttr] = useState(42);
  const [uptime, setUptime] = useState(98.4);

  // Mock Active Work Orders
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([
    {
      id: 'WO-1042',
      lineId: '1',
      source: 'Assembly Line A - Sector 4',
      issue: 'Hydraulic Pressure Drop in Press Module',
      severity: 'CRITICAL',
      status: 'ISSUE_REPORTED',
      reportedAt: new Date(Date.now() - 15 * 60000), // 15 mins ago
      history: [
        'Valve Replacement (2 months ago)',
        'Fluid Top-up (3 months ago)',
        'Sensor Calibration (6 months ago)',
        'Routine Inspection (8 months ago)',
        'Filter Change (1 year ago)'
      ],
      toolsRequired: ['Hydraulic Seal X-200', 'Pressure Gauge Kit', 'Wrench Set M10-M24']
    },
    {
      id: 'WO-1043',
      lineId: '3',
      source: 'Assembly Line D - Sector 2',
      issue: 'Conveyor Belt Motor Overheating',
      severity: 'WARNING',
      status: 'TECHNICIAN_ASSIGNED',
      reportedAt: new Date(Date.now() - 45 * 60000), // 45 mins ago
      history: [
        'Bearing Lubrication (1 month ago)',
        'Motor Alignment (4 months ago)',
        'Electrical Diagnostic (5 months ago)',
        'Belt Tension Adjustment (7 months ago)',
        'Routine Cleanup (9 months ago)'
      ],
      toolsRequired: ['Thermal Camera', 'Lubricant V-90', 'Multimeter'],
      assignedTo: 'Eng. Rustamov'
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // System-Wide Alerts (Mock)
  const systemAlerts = [
    { source: 'Warehouse', msg: 'Low stock on Hydraulic Seal X-200', type: 'warning', time: '10 mins ago' },
    { source: 'Quality Control', msg: 'Tolerance drift detected on Line B', type: 'info', time: '1 hour ago' },
    { source: 'Power Grid', msg: 'Voltage fluctuation in Sector 4', type: 'critical', time: '2 mins ago' }
  ];

  // Helper: Format elapsed downtime
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDowntime = (startTime: Date) => {
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const assignTech = (orderId: string, technician: string) => {
    setWorkOrders(prev => prev.map(wo => {
      if (wo.id === orderId) {
        return { ...wo, status: 'TECHNICIAN_ASSIGNED', assignedTo: technician };
      }
      return wo;
    }));
    toast.success('Assignment Synchronized', {
      description: `Engineer ${technician} is en route. Expected arrival: 5 mins`,
      icon: <UserCircle className="w-5 h-5 text-cyan-400" />
    });
    setSelectedOrder(prev => prev && prev.id === orderId ? { ...prev, status: 'TECHNICIAN_ASSIGNED', assignedTo: technician } : prev);
  };

  const confirmFix = (orderId: string) => {
    setWorkOrders(prev => prev.filter(wo => wo.id !== orderId));
    toast.success('Maintenance Completed', {
      description: `Line status automatically reverted to NORMAL. System updated.`,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    });
    setSelectedOrder(null);
  };

  return (
    <div className="min-h-screen p-8 bg-slate-950 font-sans text-slate-300 animate-in fade-in duration-500 pb-20">

      {/* 1. Global Status Dashboard */}
      <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-1 tracking-tight">
        <Wrench className="w-8 h-8 text-cyan-400" /> Maintenance Cockpit
      </h2>
      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Industrial IoT Response Hub</p>

      <div className="mb-10 flex flex-col xl:flex-row gap-6">

        {/* Real-time Counters */}
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
                <p className="text-5xl font-black font-mono tracking-tighter">{workOrders.length}</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Requiring immediate attention</p>
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

      {/* 2. Smart Work Order Cards */}
      <h3 className="text-xl font-black text-white mb-6 tracking-tight flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-amber-500" /> Active Maintenance Incidents</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {workOrders.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border-2 border-slate-800 border-dashed rounded-3xl bg-slate-900/50">
            <CheckCircle2 className="w-16 h-16 text-slate-700 mb-4" />
            <p className="text-xl font-black text-slate-400">All Systems Operational</p>
            <p className="text-sm font-medium mt-2">No active work orders at this time.</p>
          </div>
        ) : (
          workOrders.map(wo => {
            const isCritical = wo.severity === 'CRITICAL';

            return (
              <div
                key={wo.id}
                onClick={() => setSelectedOrder(wo)}
                className={`group cursor-pointer border rounded-3xl p-6 transition-all hover:-translate-y-1 relative overflow-hidden shadow-lg
                  ${isCritical ? 'bg-red-950/20 border-red-900/50 hover:border-red-500/50 hover:shadow-red-900/20' : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/50 hover:shadow-amber-900/20'}`}
              >
                {/* Glowing LED Indicator */}
                <div className={`absolute top-0 left-0 w-full h-1 ${isCritical ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'}`} />
                {isCritical && <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />}

                <div className="flex justify-between items-start mb-5">
                  <Badge variant="outline" className={`font-mono text-[10px] px-2.5 py-1 font-black shadow-inner ${isCritical ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                    {wo.id}
                  </Badge>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-base font-black text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">{formatDowntime(wo.reportedAt)}</span>
                  </div>
                </div>

                <h4 className="text-xl font-black text-white leading-tight mb-3 pr-8">{wo.issue}</h4>
                <p className="text-xs font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest"><Factory className="w-4 h-4 text-cyan-500" /> {wo.source}</p>

                <div className="mt-8 flex items-center justify-between border-t border-slate-800/60 pt-5">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${wo.status === 'TECHNICIAN_ASSIGNED' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' : 'bg-slate-950 text-slate-500 border border-slate-800 shadow-inner'}`}>
                    {wo.status === 'TECHNICIAN_ASSIGNED' ? `ASSIGNED: ${wo.assignedTo}` : 'AWAITING ASSIGNMENT'}
                  </span>
                  <span className="text-xs text-cyan-400 font-black flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-950/50 px-3 py-1.5 rounded-lg">DIAGNOSE <ArrowRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Diagnostic Modal ("Fix-it" View) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] shadow-cyan-900/20">

            {/* Modal Left: Details & Actions */}
            <div className="flex-1 p-8 md:p-10 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <Badge variant="outline" className={`font-mono text-[10px] font-black px-2 pb-0.5 mb-4 ${selectedOrder.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>{selectedOrder.id} • {selectedOrder.severity}</Badge>
                  <h2 className="text-3xl font-black text-white leading-tight mb-3 tracking-tight">{selectedOrder.issue}</h2>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-500" /> {selectedOrder.source}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-colors bg-slate-950 border border-slate-800"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Downtime Clock</p>
                  <p className="text-4xl font-mono font-black text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{formatDowntime(selectedOrder.reportedAt)}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Reported At</p>
                  <p className="text-3xl font-mono font-black text-white mt-1">{selectedOrder.reportedAt.toLocaleTimeString('uz-UZ')}</p>
                </div>
              </div>

              {selectedOrder.status === 'ISSUE_REPORTED' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 mb-8 shadow-xl">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-5 flex items-center gap-2"><UserCircle className="w-5 h-5 text-cyan-400" /> Assign Technician</h4>
                  <div className="flex gap-4">
                    <Select onValueChange={(val) => assignTech(selectedOrder.id, val)}>
                      <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white font-black h-14 rounded-xl shadow-inner text-base">
                        <SelectValue placeholder="Select Engineer to Dispatch..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white font-bold">
                        <SelectItem value="Eng. Rustamov">Eng. Rustamov (Electrical)</SelectItem>
                        <SelectItem value="Eng. Aliyev">Eng. Aliyev (Mechanical)</SelectItem>
                        <SelectItem value="Tech. Nurov">Tech. Nurov (General PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'TECHNICIAN_ASSIGNED' && (
                <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-2xl p-8 mb-8 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <UserCircle className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Active Assignment</h4>
                      <p className="text-2xl font-black text-white">{selectedOrder.assignedTo}</p>
                    </div>
                  </div>
                  <Button onClick={() => confirmFix(selectedOrder.id)} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-emerald-500/40 transition-all text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-3" /> Confirm Fix & Restore Line
                  </Button>
                </div>
              )}
            </div>

            {/* Modal Right: Diagnostics */}
            <div className="w-full md:w-[380px] bg-slate-950 p-8 md:p-10 border-l border-slate-800 flex flex-col gap-10 overflow-y-auto shadow-inner">

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Wrench className="w-4 h-4 text-amber-500" /> Required Tools & Parts</h4>
                <ul className="space-y-4">
                  {selectedOrder.toolsRequired.map((tool, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-300 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> {tool}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-500" /> Machine History</h4>
                <div className="relative border-l-2 border-slate-800 pl-5 space-y-6 ml-2">
                  {selectedOrder.history.map((hist, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-slate-700 rounded-full border-2 border-slate-950" />
                      <p className="text-sm text-slate-300 font-bold leading-tight">{hist.split('(')[0]}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">{hist.split('(')[1]?.replace(')', '')}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
