import { useMemo, useState, useEffect, useCallback } from 'react';
import { useFactory } from '../context/FactoryContext';
import { useSales } from '../context/SalesContext';
import { useWarehouse } from '../context/WarehouseContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  PieChart,
  Pie,
} from 'recharts';
import {
  Zap, Activity, Package, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  Truck, Utensils, Wrench, Clock, Gauge, ShieldAlert, BarChart3, Factory,
  LayoutGrid, Bell, RefreshCw, ArrowRight, Layers, Box, AlertCircle,
  X, ChevronRight, CircleDot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDetailsStore } from '../store/detailsStore';

// ─── Mock trend data ──────────────────────────────────────────────────────────
const oeeWeekData = [
  { day: 'Du', val: 84 }, { day: 'Se', val: 89 }, { day: 'Ch', val: 82 },
  { day: 'Pa', val: 91 }, { day: 'Ju', val: 87 }, { day: 'Sh', val: 93 }, { day: 'Ya', val: 90 },
];

const productionTrend = [
  { time: '06:00', actual: 120, target: 130 }, { time: '08:00', actual: 145, target: 130 },
  { time: '10:00', actual: 138, target: 130 }, { time: '12:00', actual: 102, target: 130 },
  { time: '14:00', actual: 151, target: 130 }, { time: '16:00', actual: 163, target: 130 },
  { time: '18:00', actual: 155, target: 130 },
];

const defectData = [
  { name: 'Kosmetik', count: 42, fill: '#f43f5e' },
  { name: 'Bo\'yoq',   count: 28, fill: '#fb923c' },
  { name: 'Tuzilma',  count: 15, fill: '#facc15' },
  { name: 'Funks.',   count: 10, fill: '#4ade80' },
  { name: 'Boshqa',   count: 24, fill: '#818cf8' },
];

// ─── KPI thresholds ───────────────────────────────────────────────────────────
const KPI_TARGETS = { oee: 85, ftq: 97, uptime: 99, otd: 95 };

// ─── Alert type ───────────────────────────────────────────────────────────────
interface Alert { id: string; level: 'critical' | 'warning' | 'info'; title: string; detail: string; time: string; }

const INITIAL_ALERTS: Alert[] = [
  { id: 'a1', level: 'critical', title: 'Zaxira past: CLIP-ABS-BLK-01', detail: 'Omborxonada 42 dona qoldi — Kritik daraja!', time: '2 daqiqa oldin' },
  { id: 'a2', level: 'warning',  title: 'Liniya B: OEE 72%',            detail: 'Maqsad: 85%. Texnik xizmat tavsiya etiladi.', time: '15 daqiqa oldin' },
  { id: 'a3', level: 'info',     title: 'MRP rejalash tugadi',           detail: "Bugun 1,240 ta detal tarqatildi.",            time: '1 soat oldin' },
];

export function Dashboard() {
  const { productionLines } = useFactory();
  const { salesStats } = useSales();
  const { finishedGoods } = useWarehouse() as any;
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fathers, children, fetchFathers, fetchChildren } = useDetailsStore();

  // Redirect employees
  useEffect(() => {
    if (user?.role === 'EMPLOYEE') navigate('/worker-cabinet', { replace: true });
  }, [user, navigate]);

  // Load detail data
  useEffect(() => {
    if (!fathers.length) fetchFathers();
    if (!children.length) fetchChildren();
  }, []);

  // Live KPI values
  const [uptime, setUptime]     = useState(99.85);
  const [ftq,    setFtq]        = useState(98.2);
  const [otd,    setOtd]        = useState(96.1);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [alerts, setAlerts]     = useState<Alert[]>(INITIAL_ALERTS);
  const [showAlerts, setShowAlerts] = useState(false);

  // Auto-refresh every 30s
  const refresh = useCallback(() => {
    setUptime(prev => parseFloat(Math.min(100, Math.max(99.5, prev + (Math.random() - 0.5) * 0.05)).toFixed(2)));
    setFtq(prev   => parseFloat(Math.min(100, Math.max(96.5, prev + (Math.random() - 0.5) * 0.1)).toFixed(1)));
    setOtd(prev   => parseFloat(Math.min(100, Math.max(93,   prev + (Math.random() - 0.5) * 0.3)).toFixed(1)));
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const avgEfficiency = useMemo(() =>
    productionLines.length > 0
      ? productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length
      : 87.4,
    [productionLines]
  );

  // Detail stats
  const totalFathers  = fathers.length;
  const totalChildren = children.length;
  const lowStockCount = children.filter(c => (c.stock_level ?? 250) < 50).length;
  const outOfStock    = children.filter(c => (c.stock_level ?? 250) === 0).length;

  const dismissAlert = (id: string) => setAlerts(a => a.filter(x => x.id !== id));

  // ─── Gauge color ─────────────────────────────────────────────────────────
  const kpiColor = (val: number, target: number) =>
    val >= target ? '#10b981' : val >= target * 0.9 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="h-full w-full bg-slate-950 text-slate-200 flex flex-col overflow-hidden relative select-none font-sans">

      {/* ── TOP HEADER BAR ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tighter uppercase italic leading-none">
              {t('dashboard.nerveCenterTitle')}
            </h1>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE · {lastRefresh.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              <button onClick={refresh} className="ml-1 text-slate-600 hover:text-slate-300 transition-colors">
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Telemetry mini KPIs */}
          <TelemetryMini label="OEE"    value={`${avgEfficiency.toFixed(1)}%`} color={kpiColor(avgEfficiency, KPI_TARGETS.oee)}    />
          <TelemetryMini label="FTQ"    value={`${ftq}%`}                      color={kpiColor(ftq, KPI_TARGETS.ftq)}               />
          <TelemetryMini label="UPTIME" value={`${uptime}%`}                   color={kpiColor(uptime, KPI_TARGETS.uptime)}         />
          <TelemetryMini label="OTD"    value={`${otd}%`}                      color={kpiColor(otd, KPI_TARGETS.otd)}               />

          {/* Alert bell */}
          <button
            onClick={() => setShowAlerts(s => !s)}
            className="relative p-2 rounded-xl bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[8px] font-black text-white flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── ALERT PANEL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-4 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <span className="text-xs font-black text-white uppercase tracking-wider">Ogohlantirishlar</span>
              <button onClick={() => setShowAlerts(false)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
              {alerts.length === 0
                ? <p className="px-4 py-6 text-center text-xs text-slate-500">Hech qanday ogohlantirish yo'q</p>
                : alerts.map(a => (
                  <div key={a.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors ${a.level === 'critical' ? 'border-l-2 border-rose-500' : a.level === 'warning' ? 'border-l-2 border-amber-500' : 'border-l-2 border-blue-500'}`}>
                    <div className="shrink-0 mt-0.5">
                      {a.level === 'critical' ? <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> :
                       a.level === 'warning'  ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> :
                       <CircleDot className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{a.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{a.detail}</p>
                      <p className="text-[9px] text-slate-600 mt-1">{a.time}</p>
                    </div>
                    <button onClick={() => dismissAlert(a.id)} className="shrink-0 text-slate-600 hover:text-slate-300">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 p-4 grid grid-cols-4 grid-rows-2 gap-4">

        {/* ── 1: OEE GAUGE + TREND ─ 2-rows tall ─── */}
        <Card className="row-span-2 flex flex-col" onClick={() => navigate('/production-lines')}>
          <CardHeader icon={<Gauge className="w-4 h-4" />} title="Ishlab Chiqarish" sub="OEE • Samaradorlik" color="cyan" />
          <div className="flex-1 flex flex-col items-center justify-between px-4 pb-4 min-h-0">
            {/* Circular gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center mt-2">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={kpiColor(avgEfficiency, KPI_TARGETS.oee)}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - avgEfficiency / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-white italic font-mono leading-none">{avgEfficiency.toFixed(0)}<span className="text-base text-cyan-400">%</span></span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">OEE</span>
                <span className="text-[7px] font-bold mt-0.5" style={{ color: kpiColor(avgEfficiency, KPI_TARGETS.oee) }}>
                  {avgEfficiency >= KPI_TARGETS.oee ? '✓ Maqsad' : `Maqsad: ${KPI_TARGETS.oee}%`}
                </span>
              </div>
            </div>

            {/* Mini sub-KPIs */}
            <div className="w-full grid grid-cols-2 gap-2 mt-3">
              {[
                { label: 'FTQ',    val: `${ftq}%`,    color: kpiColor(ftq, KPI_TARGETS.ftq) },
                { label: 'OTD',    val: `${otd}%`,    color: kpiColor(otd, KPI_TARGETS.otd) },
                { label: 'UPTIME', val: `${uptime}%`, color: kpiColor(uptime, KPI_TARGETS.uptime) },
                { label: 'MTTR',   val: '24m',        color: '#10b981' },
              ].map(k => (
                <div key={k.label} className="bg-slate-950/50 p-2 rounded-xl border border-white/5 text-center">
                  <p className="text-[7px] text-slate-500 uppercase font-mono font-bold">{k.label}</p>
                  <p className="text-sm font-black font-mono italic mt-0.5" style={{ color: k.color }}>{k.val}</p>
                </div>
              ))}
            </div>

            {/* Sparkline week trend */}
            <div className="w-full mt-3">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Haftalik OEE Trendi</p>
              <ResponsiveContainer width="100%" height={50}>
                <AreaChart data={oeeWeekData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="oeeArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={2} fill="url(#oeeArea)" dot={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis domain={[75, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 10 }}
                    labelStyle={{ color: '#64748b' }}
                    itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                    formatter={(v: any) => [`${v}%`, 'OEE']}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); navigate('/production-lines'); }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest hover:bg-cyan-600/20 transition-colors"
            >
              Liniyalarni Ko'rish <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* ── 2: PRODUCTION HOURLY TREND ── */}
        <Card className="col-span-2" onClick={() => navigate('/production-lines')}>
          <CardHeader icon={<Activity className="w-4 h-4" />} title="Soatlik Ishlab Chiqarish" sub="Haqiqiy vs Maqsad" color="indigo" />
          <div className="flex-1 min-h-0 px-2 pb-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={productionTrend} margin={{ top: 4, right: 8, bottom: -8, left: -20 }}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 8 }} domain={[80, 180]} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11 }}
                  labelStyle={{ color: '#64748b', fontWeight: 800 }}
                  itemStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="actual" stroke="#818cf8" strokeWidth={2} fill="url(#prodGrad)" dot={false} name="Haqiqiy" />
                <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="Maqsad" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── 3: ALERTS SUMMARY ── */}
        <Card onClick={() => setShowAlerts(s => !s)}>
          <CardHeader icon={<Bell className="w-4 h-4" />} title="Ogohlantirishlar" sub={`${alerts.length} ta faol`} color="rose" />
          <div className="flex-1 flex flex-col justify-center gap-2 px-4 pb-4">
            {/* Status counts */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Kritik', count: alerts.filter(a => a.level === 'critical').length, color: '#f43f5e', bg: 'bg-rose-950/40 border-rose-500/20' },
                { label: 'Ogohlantirish', count: alerts.filter(a => a.level === 'warning').length,  color: '#f59e0b', bg: 'bg-amber-950/40 border-amber-500/20' },
                { label: 'Ma\'lumot',     count: alerts.filter(a => a.level === 'info').length,     color: '#60a5fa', bg: 'bg-blue-950/40 border-blue-500/20' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border rounded-xl p-2 text-center`}>
                  <p className="text-lg font-black font-mono" style={{ color: s.color }}>{s.count}</p>
                  <p className="text-[7px] font-bold text-slate-500 uppercase mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Latest alert */}
            {alerts[0] && (
              <div className="mt-1 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20">
                <p className="text-[10px] font-bold text-rose-300 truncate">{alerts[0].title}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">{alerts[0].time}</p>
              </div>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setShowAlerts(true); }}
              className="mt-1 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase hover:bg-rose-600/20 transition-colors"
            >
              Barchasini Ko'rish <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* ── 4: DETAIL MANAGEMENT KPI ── */}
        <Card onClick={() => navigate('/admin/details')}>
          <CardHeader icon={<Box className="w-4 h-4" />} title="Detal Boshqaruvi" sub="Father & Child Detallar" color="violet" />
          <div className="flex-1 flex flex-col justify-center gap-3 px-4 pb-4">
            {/* Main stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white font-mono italic">{totalFathers}</p>
                <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Ota Detallar</p>
              </div>
              <div className="bg-violet-950/40 border border-violet-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white font-mono italic">{totalChildren}</p>
                <p className="text-[7px] font-black text-violet-400 uppercase tracking-widest mt-0.5">Bola Detallar</p>
              </div>
            </div>

            {/* Stock alerts */}
            <div className="space-y-1.5">
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${lowStockCount > 0 ? 'bg-amber-950/30 border-amber-500/20' : 'bg-slate-800/30 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-3 h-3 ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
                  <span className="text-[9px] font-bold text-slate-300">Kam zaxira</span>
                </div>
                <span className={`text-sm font-black font-mono ${lowStockCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{lowStockCount}</span>
              </div>
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${outOfStock > 0 ? 'bg-rose-950/30 border-rose-500/20' : 'bg-slate-800/30 border-white/5'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-3 h-3 ${outOfStock > 0 ? 'text-rose-400' : 'text-slate-600'}`} />
                  <span className="text-[9px] font-bold text-slate-300">Tugagan</span>
                </div>
                <span className={`text-sm font-black font-mono ${outOfStock > 0 ? 'text-rose-400' : 'text-slate-500'}`}>{outOfStock}</span>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); navigate('/admin/details'); }}
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[9px] font-black uppercase hover:bg-violet-600/20 transition-colors"
            >
              Detallarni Boshqarish <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>

        {/* ── 5: QUALITY DEFECTS CHART ── */}
        <Card onClick={() => navigate('/qc')}>
          <CardHeader icon={<BarChart3 className="w-4 h-4" />} title="Sifat Nazorati" sub="Nuqsonlar Tahlili" color="rose" />
          <div className="flex-1 min-h-0 flex gap-2 px-2 pb-2">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defectData} margin={{ top: 4, right: 4, bottom: -10, left: -24 }} layout="vertical">
                  <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 8 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontWeight: 700 }} width={52} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10 }}
                    itemStyle={{ fontWeight: 700 }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={10}>
                    {defectData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.75} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Donut mini */}
            <div className="w-20 flex flex-col items-center justify-center">
              <PieChart width={72} height={72}>
                <Pie data={defectData} cx={36} cy={36} innerRadius={22} outerRadius={34} paddingAngle={2} dataKey="count" startAngle={90} endAngle={-270}>
                  {defectData.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.8} />)}
                </Pie>
              </PieChart>
              <p className="text-[7px] text-slate-500 uppercase font-bold tracking-wider mt-1 text-center">Taqsimot</p>
            </div>
          </div>
        </Card>

        {/* ── 6: WAREHOUSE + INVENTORY ── */}
        <Card onClick={() => navigate('/warehouse')}>
          <CardHeader icon={<Package className="w-4 h-4" />} title="Omborxona" sub="Tayyor Mahsulot & Zaxira" color="emerald" />
          <div className="flex-1 flex flex-col justify-center px-4 pb-4 gap-3">
            {/* Big shipped number */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white italic font-mono leading-tight">
                  {salesStats.dailyShippedQty.toLocaleString()}
                </p>
                <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Bugun Yuborildi (dona)</p>
              </div>
            </div>

            {/* Mini metrics */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Ochiq SO', val: salesStats.pendingOrderCount, color: 'text-amber-400' },
                { label: 'Jami TM',  val: finishedGoods.reduce((s: number, f: any) => s + f.totalQuantity, 0).toLocaleString(), color: 'text-white' },
                { label: 'Mavjud',   val: finishedGoods.reduce((s: number, f: any) => s + f.availableQuantity, 0).toLocaleString(), color: 'text-emerald-400' },
              ].map(m => (
                <div key={m.label} className="bg-slate-950/50 p-2 rounded-xl border border-white/5 text-center">
                  <p className={`text-xs font-black font-mono ${m.color}`}>{m.val}</p>
                  <p className="text-[7px] text-slate-600 uppercase font-bold mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar for shipment rate */}
            <div>
              <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1">
                <span>Yetkazib berish darajasi</span>
                <span className="text-emerald-400">{otd}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${otd}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, #10b981, #06b6d4)` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ── 7: MAINTENANCE ── */}
        <Card onClick={() => navigate('/maintenance')}>
          <CardHeader icon={<Wrench className="w-4 h-4" />} title="Texnik Xizmat" sub="Asset Holati" color="amber" />
          <div className="flex-1 flex flex-col justify-center px-4 pb-4 gap-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Jarayonda', val: '08', color: '#f59e0b', desc: 'Ta\'mirlash' },
                { label: "Avg MTTR",  val: '24m', color: '#10b981', desc: 'Tiklash Vaqti' },
                { label: 'MTBF',      val: '456h', color: '#06b6d4', desc: 'Nosozliklar orasida' },
                { label: 'OEE Asset', val: '94%', color: '#818cf8', desc: 'Samaradorlik' },
              ].map(m => (
                <div key={m.label} className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  <p className="text-[7px] text-slate-500 uppercase font-bold">{m.label}</p>
                  <p className="text-lg font-black font-mono italic mt-0.5" style={{ color: m.color }}>{m.val}</p>
                  <p className="text-[7px] text-slate-600 mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase">Barcha Liniyalar Ishlamoqda</span>
            </div>
          </div>
        </Card>

        {/* ── 8: QUICK NAVIGATION ── */}
        <Card>
          <CardHeader icon={<LayoutGrid className="w-4 h-4" />} title="Tezkor Navigatsiya" sub="Modullar" color="cyan" />
          <div className="flex-1 grid grid-cols-2 gap-2 px-4 pb-4">
            {[
              { label: 'MRP',           path: '/mrp',           color: '#818cf8', bg: 'bg-indigo-950/40 border-indigo-500/15',  icon: <Layers className="w-4 h-4" /> },
              { label: 'Omborxona',     path: '/warehouse',     color: '#10b981', bg: 'bg-emerald-950/40 border-emerald-500/15', icon: <Package className="w-4 h-4" /> },
              { label: 'Liniyalar',     path: '/production-lines', color: '#06b6d4', bg: 'bg-cyan-950/40 border-cyan-500/15', icon: <Activity className="w-4 h-4" /> },
              { label: 'Sifat Nazorati', path: '/qc',           color: '#f43f5e', bg: 'bg-rose-950/40 border-rose-500/15',     icon: <ShieldAlert className="w-4 h-4" /> },
              { label: 'HR',            path: '/hr',            color: '#f59e0b', bg: 'bg-amber-950/40 border-amber-500/15',   icon: <Utensils className="w-4 h-4" /> },
              { label: 'Hisobotlar',    path: '/reports',       color: '#a78bfa', bg: 'bg-violet-950/40 border-violet-500/15', icon: <BarChart3 className="w-4 h-4" /> },
            ].map(n => (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                className={`${n.bg} border rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 hover:brightness-125 transition-all text-center`}
              >
                <span style={{ color: n.color }}>{n.icon}</span>
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-wide leading-tight">{n.label}</span>
              </button>
            ))}
          </div>
        </Card>

      </div>

      {/* ── FOOTER STATUS BAR ──────────────────────────────────────────────── */}
      <div className="shrink-0 h-7 flex items-center justify-between px-5 bg-slate-900/50 border-t border-white/5 text-[7px] font-black text-slate-500 uppercase tracking-[0.15em] font-mono italic">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_4px_#06b6d4]" />
            <span>HUB ID: 0x99A2</span>
          </div>
          <span>FABRKA ERP v2.0</span>
          <span>Detallar: {totalFathers}F / {totalChildren}C</span>
        </div>
        <div className="flex items-center gap-5">
          <span>Kechikish: 12ms</span>
          <span>Yangilandi: {lastRefresh.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
          <DigitalClock />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-2xl flex flex-col ring-1 ring-white/5 shadow-xl hover:bg-slate-900/60 hover:border-white/10 transition-all duration-300 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ icon, title, sub, color }: { icon: React.ReactNode; title: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400', rose: 'text-rose-400', emerald: 'text-emerald-400',
    amber: 'text-amber-400', violet: 'text-violet-400', indigo: 'text-indigo-400',
  };
  return (
    <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg bg-slate-950/80 border border-white/5 ${colorMap[color] || 'text-slate-400'}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-[9px] font-black text-white uppercase tracking-widest font-mono italic leading-none">{title}</h3>
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">{sub}</span>
        </div>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
    </div>
  );
}

function TelemetryMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-base font-black italic font-mono leading-tight" style={{ color }}>{value}</span>
    </div>
  );
}

function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[9px] font-black italic text-white">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  );
}
