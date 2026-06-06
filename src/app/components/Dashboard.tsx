import { useMemo, useState, useEffect } from 'react';
import { useFactory } from '../context/FactoryContext';
import { useSales } from '../context/SalesContext';
import { useWarehouse } from '../context/WarehouseContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ComposedChart,
} from 'recharts';
import {
  Zap,
  Activity,
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Truck,
  Utensils,
  Wrench,
  Clock,
  Gauge,
  ShieldAlert,
  BarChart3,
  Factory,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const { productionLines } = useFactory();
  const { salesStats, salesOrders } = useSales();
  const { finishedGoods } = useWarehouse() as any;
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'EMPLOYEE') {
      navigate('/worker-cabinet', { replace: true });
    }
  }, [user, navigate]);

  const [uptime, setUptime] = useState(99.85);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => {
        const delta = (Math.random() - 0.5) * 0.01;
        return parseFloat(Math.min(100, Math.max(99.8, prev + delta)).toFixed(2));
      });
      setPulse(p => !p);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const avgEfficiency = useMemo(() =>
    productionLines.length > 0
      ? productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length
      : 0
    , [productionLines]);

  const inventoryHealth = [
    { name: t('dashboard.metal'), val: 88, color: '#06b6d4', status: t('dashboard.statusNominal') },
    { name: t('dashboard.polymer'), val: 42, color: '#f59e0b', status: t('dashboard.lowReserve') },
    { name: t('dashboard.circuit'), val: 95, color: '#10b981', status: t('dashboard.statusStabilized') },
  ];

  const paretoData = [
    { name: t('qc.category.cosmetic'), count: 42, percentage: 35 },
    { name: t('qc.category.paint'), count: 28, percentage: 58 },
    { name: t('qc.category.structural'), count: 15, percentage: 71 },
    { name: t('qc.category.functional'), count: 10, percentage: 80 },
    { name: t('qc.category.other'), count: 24, percentage: 100 },
  ];

  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 p-4 flex flex-col gap-4 overflow-hidden relative font-sans selection:bg-cyan-500/30">

      {/* GLOBAL TELEMETRY HEADER */}
      <div className="flex items-center justify-between shrink-0 h-14">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-lg">
            <Factory className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">{t('dashboard.nerveCenterTitle')}</h1>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-1.5 font-mono">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              HQ-PRIME // STATUS: {t('dashboard.statusNominal')}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <TelemetryMini icon={<Activity className="w-3.5 h-3.5" />} label="OEE" value={`${avgEfficiency.toFixed(1)}%`} color="cyan" />
          <TelemetryMini icon={<ShieldAlert className="w-3.5 h-3.5" />} label="FTQ" value="98.2%" color="rose" />
          <TelemetryMini icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="UPTIME" value={`${uptime}%`} color="emerald" />
          <TelemetryMini icon={<Zap className="w-3.5 h-3.5" />} label="LOAD" value="4.2ms" color="indigo" />
        </div>
      </div>

      {/* BALANCED 3x2 GRID SYSTEM */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 min-h-0">

        {/* 1. PRODUCTION COCKPIT */}
        <Card containerClass="overflow-hidden">
          <CardHeader icon={<Gauge className="w-4 h-4" />} title={t('dashboard.productionHub')} sub={t('dashboard.liveTelemetry')} color="cyan" />
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className="relative w-full aspect-square max-w-[180px] flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="24" />
                <circle
                  cx="50%" cy="50%" r="42%"
                  fill="transparent"
                  stroke="url(#oeeGradient)"
                  strokeWidth="24"
                  strokeDasharray="263%"
                  strokeDashoffset={`${263 - (avgEfficiency / 100) * 263}%`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-white italic tracking-tighter shadow-cyan-500/10">
                  {avgEfficiency.toFixed(0)}<span className="text-lg text-cyan-500 ml-0.5">%</span>
                </span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{t('dashboard.efficiency')}</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 mt-2 px-4">
              <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 text-center">
                <p className="text-[7px] text-slate-500 uppercase font-mono">{t('dashboard.trend')}</p>
                <p className="text-xs font-black text-emerald-400 italic">+12.4%</p>
              </div>
              <div className="bg-slate-950/40 p-2 rounded-xl border border-white/5 text-center">
                <p className="text-[7px] text-slate-500 uppercase font-mono">{t('dashboard.status')}</p>
                <p className="text-xs font-black text-cyan-400 italic">{t('dashboard.statusActive')}</p>
              </div>
            </div>
          </div>
          <defs>
            <linearGradient id="oeeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
        </Card>

        {/* 2. QUALITY PARETO */}
        <Card>
          <CardHeader icon={<BarChart3 className="w-4 h-4" />} title={t('dashboard.qualityLabs')} sub={t('dashboard.defectsReport')} color="rose" />
          <div className="flex-1 min-h-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 5, right: 5, bottom: -10, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontWeight: 800 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 7 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 7 }} />
                <Bar yAxisId="left" dataKey="count" fill="rgba(244, 63, 94, 0.3)" radius={[3, 3, 0, 0]} barSize={25}>
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 2 ? 'rgba(244, 63, 94, 0.6)' : 'rgba(244, 63, 94, 0.2)'} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="percentage" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 p-2 bg-slate-950/40 rounded-xl border border-white/5 flex items-center justify-between mx-2">
            <span className="text-[8px] font-bold text-slate-400 italic">{t('dashboard.rootCause')}: {t('qc.rootCause.operator')}</span>
            <span className="text-[7px] font-black text-rose-500 uppercase font-mono italic">{t('dashboard.statusCritical')}</span>
          </div>
        </Card>

        {/* 3. INVENTORY HEALTH */}
        <Card>
          <CardHeader icon={<Package className="w-4 h-4" />} title={t('dashboard.inventoryDepot')} sub={t('dashboard.stockHealthTitle')} color="emerald" />
          <div className="flex-1 flex flex-col justify-around px-4 pb-2">
            {inventoryHealth.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                  <span className="text-[9px] font-black text-white font-mono">{item.val}%</span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full border border-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color, opacity: 0.8 }}
                  />
                </div>
                <div className="flex justify-between text-[6px] font-bold uppercase tracking-tighter">
                  <span className={item.val < 50 ? 'text-amber-500' : 'text-slate-600'}>{item.status}</span>
                  <span className="text-slate-700">{t('dashboard.buffer')}: {t('dashboard.statusActive')}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 4. CANTEEN OPS */}
        <Card>
          <CardHeader icon={<Utensils className="w-4 h-4" />} title={t('dashboard.canteenOps')} sub={t('dashboard.mealDistribution')} color="cyan" />
          <div className="flex-1 grid grid-cols-2 gap-4 p-4 text-center">
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic">{t('dashboard.meal1Status')}</p>
              <p className="text-3xl font-black text-white italic tracking-tighter leading-tight font-mono">482</p>
              <div className="w-full h-1 bg-slate-950 rounded-full mt-1 overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-500/60 w-[65%]" />
              </div>
              <p className="text-[6px] font-bold text-cyan-600 uppercase mt-1">Wave 2 {t('dashboard.statusActive')}</p>
            </div>
            <div className="flex flex-col justify-center gap-1 border-l border-white/5 pl-4">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest italic">{t('dashboard.meal2Status')}</p>
              <p className="text-3xl font-black text-white italic tracking-tighter leading-tight font-mono">355</p>
              <div className="w-full h-1 bg-slate-950 rounded-full mt-1 overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-400/60 w-[45%]" />
              </div>
              <p className="text-[6px] font-bold text-slate-600 uppercase mt-1">{t('dashboard.preparing')}...</p>
            </div>
          </div>
        </Card>

        {/* 5. MAINTENANCE HUB */}
        <Card>
          <CardHeader icon={<Wrench className="w-4 h-4" />} title={t('dashboard.maintenanceAsset')} sub={t('dashboard.assetHealth')} color="emerald" />
          <div className="flex-1 flex flex-col justify-center px-4 gap-4">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-slate-500 uppercase mb-1">{t('dashboard.inProcess')}</span>
                <span className="text-2xl font-black text-white italic font-mono leading-none">08</span>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-slate-500 uppercase mb-1">{t('dashboard.avgMttr')}</span>
                <span className="text-2xl font-black text-emerald-400 italic font-mono leading-none">24<span className="text-xs ml-0.5 uppercase">m</span></span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500/80 uppercase italic">{t('dashboard.factoryUptime')}: {t('dashboard.statusStabilized')}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                <span className="text-[8px] font-black text-indigo-400/80 uppercase italic">{t('dashboard.mtbf')}: 456.2 hours</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. FG WAREHOUSE & SALES */}
        <Card>
          <CardHeader icon={<Truck className="w-4 h-4" />} title={'FG WAREHOUSE'} sub={'SAP SD METRICS'} color="violet" />
          <div className="flex-1 flex flex-col justify-center px-4 gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
                <span className="text-xl font-black text-white italic font-mono">{salesStats.dailyShippedQty.toLocaleString()}</span>
              </div>
              <div>
                <p className="text-lg font-black text-white italic leading-tight uppercase tracking-tighter">Shipped Today</p>
                <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest leading-none">Pieces (PCS)</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-white/5 text-center flex flex-col">
                <span className="text-[7px] font-black text-slate-500 uppercase">Open SOs</span>
                <span className="font-mono text-xs font-black text-white">{salesStats.pendingOrderCount}</span>
              </div>
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-white/5 text-center flex flex-col">
                <span className="text-[7px] font-black text-slate-500 uppercase">Total FG</span>
                <span className="font-mono text-xs font-black text-white">{finishedGoods.reduce((s: number, f: any) => s + f.totalQuantity, 0).toLocaleString()}</span>
              </div>
              <div className="bg-slate-950/40 p-1.5 rounded-lg border border-white/5 text-center flex flex-col">
                <span className="text-[7px] font-black text-slate-500 uppercase">Avail FG</span>
                <span className="font-mono text-xs font-black text-emerald-400">{finishedGoods.reduce((s: number, f: any) => s + f.availableQuantity, 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 opacity-40">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono italic">SYNC: SAP-SD-MOD</span>
              <Clock className="w-3 h-3 text-slate-700" />
            </div>
          </div>
        </Card>

      </div>

      {/* FOOTER SYNC BAR */}
      <div className="h-6 shrink-0 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-full px-4 text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] italic font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4]" />
            <span>HUB ID: 0x99A2</span>
          </div>
          <span>{t('dashboard.systemVersion')}: Prime v4.5</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{t('dashboard.latency')}: 12ms</span>
          <div className="flex items-center gap-2 text-white">
            <LayoutGrid className="w-2.5 h-2.5 opacity-50" />
            <DigitalClock />
          </div>
        </div>
      </div>

    </div>
  );
}

function Card({ children, containerClass = "" }: any) {
  return (
    <div className={`bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[1.5rem] flex flex-col ring-1 ring-white/5 shadow-xl hover:bg-slate-900/60 transition-all duration-300 relative ${containerClass}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, sub, color }: any) {
  const colors: any = {
    cyan: "text-cyan-400 group-hover:text-cyan-300 shadow-cyan-500/20",
    rose: "text-rose-400 group-hover:text-rose-300 shadow-rose-500/20",
    emerald: "text-emerald-400 group-hover:text-emerald-300 shadow-emerald-500/20",
    amber: "text-amber-500 group-hover:text-amber-400 shadow-amber-500/20",
    violet: "text-violet-400 group-hover:text-violet-300 shadow-violet-500/20",
  };

  return (
    <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-slate-950/80 border border-white/5 ${colors[color].split(' ')[0]}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono italic leading-none">{title}</h3>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{sub}</span>
        </div>
      </div>
      <div className="w-1 h-1 rounded-full bg-white/10" />
    </div>
  );
}

function TelemetryMini({ icon, label, value, color }: any) {
  const colors: any = {
    cyan: "text-cyan-400",
    rose: "text-rose-400",
    emerald: "text-emerald-400",
    indigo: "text-indigo-400",
  };
  return (
    <div className="flex flex-col items-end justify-center">
      <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
        <span className="opacity-50">{icon}</span>
        <span className="text-[7px] font-black uppercase tracking-widest italic">{label}</span>
      </div>
      <span className={`text-lg font-black italic tracking-tighter ${colors[color]} leading-none font-mono`}>{value}</span>
    </div>
  );
}

function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="font-mono text-[9px] font-black italic tracking-tighter">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  );
}
