import { useFactory } from '../../context/FactoryContext';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Cpu, Factory, Zap, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

// ── Static mock OEE / shift data per line ────────────────────────────────────
const LINE_STATS: Record<string, { oee: number; shift: string; status: 'Active' | 'Idle' | 'Warning' | 'Offline'; load: number; output: number; target: number }> = {
  default: { oee: 78, shift: '1-smena', status: 'Active', load: 72, output: 432, target: 600 },
};
const STATIC_STATS = [
  { oee: 91, shift: '1-smena', status: 'Active' as const, load: 88, output: 547, target: 600 },
  { oee: 47, shift: '1-smena', status: 'Idle' as const, load: 41, output: 210, target: 450 },
  { oee: 83, shift: '1-smena', status: 'Active' as const, load: 79, output: 498, target: 600 },
  { oee: 62, shift: '2-smena', status: 'Warning' as const, load: 65, output: 311, target: 500 },
  { oee: 95, shift: '1-smena', status: 'Active' as const, load: 92, output: 570, target: 600 },
  { oee: 30, shift: '2-smena', status: 'Offline' as const, load: 12, output: 89, target: 400 },
];

function lineIcon(name: string) {
  if (/door/i.test(name)) return '🚪';
  if (/console/i.test(name)) return '🎛️';
  if (/plastic/i.test(name)) return '🧩';
  if (/cnc/i.test(name)) return '⚙️';
  if (/weld/i.test(name)) return '🔥';
  return '🏭';
}

function statusConfig(status: string) {
  switch (status) {
    case 'Active': return { dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    case 'Warning': return { dot: 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse', text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    case 'Idle': return { dot: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-700/30', badge: 'bg-slate-800 text-slate-500 border-slate-700' };
    case 'Offline': return { dot: 'bg-red-600', text: 'text-red-500', border: 'border-red-900/30', badge: 'bg-red-500/10 text-red-500 border-red-500/30' };
    default: return { dot: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-700', badge: 'bg-slate-800 text-slate-500 border-slate-700' };
  }
}

function oeeColor(oee: number) {
  return oee >= 85 ? 'text-emerald-400' : oee >= 65 ? 'text-amber-400' : 'text-red-400';
}

function oeeBarColor(oee: number) {
  return oee >= 85 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : oee >= 65 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
}

export function OperatorDailyLinePlan() {
  const { productionLines } = useFactory();
  const navigate = useNavigate();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-full bg-slate-950 text-slate-300">
      {/* ── Header ── */}
      <div className="px-6 md:px-10 py-8 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-full uppercase tracking-widest">SAP MES: ZPP_OPLAN_MONITOR</span>
              <span className="text-[10px] font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse" />LIVE
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Line Operations Monitor</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Click a line to open the Planning Cockpit → Execute shift plan</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Current Time: <span className="text-slate-300 font-black">{timeStr}</span></span>
            <span className="text-slate-700">|</span>
            <span>Shift: <span className="text-cyan-400 font-black">1-smena</span></span>
            <span className="text-slate-700">|</span>
            <span>Lines online: <span className="text-emerald-400 font-black">{Math.min(productionLines.length, STATIC_STATS.filter(s => s.status === 'Active').length)}</span></span>
          </div>
        </div>

        {/* Factory-Level KPI Bar */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg OEE', value: '75%', icon: TrendingUp, color: 'text-cyan-400' },
            { label: 'Active Lines', value: `${STATIC_STATS.filter(s => s.status === 'Active').length}/${STATIC_STATS.length}`, icon: Activity, color: 'text-emerald-400' },
            { label: 'Total Output', value: '2,657', icon: Cpu, color: 'text-indigo-400' },
            { label: 'Warnings', value: `${STATIC_STATS.filter(s => s.status === 'Warning' || s.status === 'Offline').length}`, icon: AlertTriangle, color: 'text-amber-400' },
          ].map((kpi, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <kpi.icon className={`w-5 h-5 shrink-0 ${kpi.color}`} />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{kpi.label}</p>
                <p className={`text-xl font-black font-mono ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Line Cards Grid ── */}
      <div className="px-6 md:px-10 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {productionLines.map((line, idx) => {
            const stats = STATIC_STATS[idx % STATIC_STATS.length];
            const sc = statusConfig(stats.status);
            const icon = lineIcon(line.name);
            const outputPct = Math.round((stats.output / stats.target) * 100);

            return (
              <div
                key={line.id}
                className={`group relative bg-slate-900/60 border ${sc.border} hover:border-cyan-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.12)] hover:-translate-y-0.5`}
                onClick={() => navigate(`/operator-plans/${line.id}`)}
              >
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 ${stats.status === 'Active' ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : stats.status === 'Warning' ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent' : 'bg-slate-800'}`} />

                <div className="p-6">
                  {/* Line Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-100 tracking-tight text-base">{line.name}</h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">ID: {line.id}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border ${sc.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {stats.status}
                    </span>
                  </div>

                  {/* OEE Gauge */}
                  <div className="mb-5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Real-time OEE</span>
                      <span className={`text-2xl font-black font-mono ${oeeColor(stats.oee)}`}>{stats.oee}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${oeeBarColor(stats.oee)}`}
                        style={{ width: `${stats.oee}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-slate-950/60 rounded-xl border border-slate-800/60 px-3 py-2.5 text-center">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Shift</p>
                      <p className="text-xs font-black text-slate-300 font-mono">{stats.shift === '1-smena' ? '☀️ 1' : '🌙 2'}</p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl border border-slate-800/60 px-3 py-2.5 text-center">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Output</p>
                      <p className="text-xs font-black font-mono text-slate-300">{stats.output.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl border border-slate-800/60 px-3 py-2.5 text-center">
                      <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Load</p>
                      <p className={`text-xs font-black font-mono ${stats.load > 85 ? 'text-orange-400' : 'text-slate-300'}`}>{stats.load}%</p>
                    </div>
                  </div>

                  {/* Output Progress */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Shift Output Progress</span>
                      <span className="text-[10px] font-mono text-slate-500">{stats.output} / {stats.target}</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                      <div className={`h-full rounded-full transition-all duration-1000 ${outputPct >= 90 ? 'bg-emerald-500' : outputPct >= 60 ? 'bg-cyan-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(outputPct, 100)}%` }} />
                    </div>
                  </div>

                  {/* 3-Tab Mini Snapshot */}
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {/* Schedule */}
                    <div className="bg-slate-950/70 rounded-lg border border-slate-800/60 px-2.5 py-2">
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1">📋 Schedule</p>
                      <p className={`text-[11px] font-black font-mono ${outputPct >= 80 ? 'text-cyan-400' : 'text-amber-400'}`}>{Math.min(outputPct, 100)}%</p>
                      <div className="h-0.5 bg-slate-900 rounded-full mt-1 overflow-hidden"><div className={`h-full rounded-full ${outputPct >= 80 ? 'bg-cyan-500' : 'bg-amber-400'}`} style={{ width: `${Math.min(outputPct, 100)}%` }} /></div>
                    </div>
                    {/* Logistics */}
                    <div className="bg-slate-950/70 rounded-lg border border-slate-800/60 px-2.5 py-2">
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1">📦 Materials</p>
                      <p className={`text-[11px] font-black font-mono ${stats.load < 85 ? 'text-emerald-400' : 'text-orange-400'}`}>{stats.load < 85 ? '100%' : '74%'}</p>
                      <div className="h-0.5 bg-slate-900 rounded-full mt-1 overflow-hidden"><div className={`h-full rounded-full ${stats.load < 85 ? 'bg-emerald-500' : 'bg-orange-400'}`} style={{ width: stats.load < 85 ? '100%' : '74%' }} /></div>
                    </div>
                    {/* QC */}
                    <div className="bg-slate-950/70 rounded-lg border border-slate-800/60 px-2.5 py-2">
                      <p className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1">🛡 QC Gate</p>
                      <p className={`text-[11px] font-black font-mono ${stats.status === 'Active' ? 'text-emerald-400' : 'text-slate-500'}`}>{stats.status === 'Active' ? 'READY' : 'PENDING'}</p>
                      <div className="h-0.5 bg-slate-900 rounded-full mt-1 overflow-hidden"><div className={`h-full rounded-full ${stats.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-700'}`} style={{ width: stats.status === 'Active' ? '100%' : '0%' }} /></div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    className="w-full h-11 rounded-xl bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/30 hover:border-cyan-500 text-cyan-400 hover:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                  >
                    <Zap className="w-4 h-4" />
                    MANAGE PLAN
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
