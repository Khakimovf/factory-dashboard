import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { useDailyProductionPlan } from '../context/DailyProductionPlanContext';
import {
  Factory, Plus, Activity, AlertCircle, PlayCircle, PauseCircle,
  Wrench, Clock, ShieldCheck,
  Monitor, Construction, ArrowRight, TrendingUp, Gauge, Target, Percent
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

// ---------------- Analytics header ----------------

interface AnalyticCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'blue' | 'red' | 'yellow';
  pulse?: boolean;
}

function AnalyticCard({ icon, iconBg, label, value, sub, accent = 'blue', pulse }: AnalyticCardProps) {
  const accentColors: Record<string, string> = {
    green: 'from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-500 border-blue-500/20',
    red: 'from-rose-500/10 to-rose-500/5 text-rose-500 border-rose-500/20',
    yellow: 'from-amber-500/10 to-amber-500/5 text-amber-500 border-amber-500/20',
  };

  const accentText: Record<string, string> = {
    green: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-rose-600 dark:text-rose-400',
    yellow: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <Card className={`overflow-hidden border bg-gradient-to-br ${accentColors[accent]} transition-all hover:shadow-md group`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{label}</p>
          <div className={`p-2 rounded-lg ${iconBg} bg-opacity-20 transition-transform group-hover:scale-110 duration-300`}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className={`text-2xl font-bold tracking-tight ${accentText[accent]} ${pulse ? 'animate-pulse' : ''}`}>
            {value}
          </h3>
          {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Main component ----
export function ProductionLines() {
  const { productionLines, addProductionLine, materials } = useFactory();
  const { t } = useLanguage();
  const { getTodayLinePlan } = useDailyProductionPlan();
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // ── SAP Analytics Calculations ──
  const analytics = useMemo(() => {
    const lines = productionLines;

    // 1. Factory Capacity: Active lines / Total lines
    const activeLines = lines.filter(l => l.status === 'active').length;
    const capacity = lines.length ? Math.round((activeLines / lines.length) * 100) : 0;

    // 2. Material Readiness
    const THIRTY_MIN_THRESHOLD_RATIO = 0.3;
    const riskCount = materials.filter(m =>
      m.minStock > 0 && m.quantity < m.minStock * THIRTY_MIN_THRESHOLD_RATIO
    ).length;
    const readiness = Math.max(0, 100 - (riskCount * 5));

    // 3. Downtime Impact (Hours lost)
    const downtimeMinutes = lines.reduce((s, l) => s + (l.downtimeRecord?.accumulatedMinutes || 0), 0);
    const downtimeHours = (downtimeMinutes / 60).toFixed(1);

    return { capacity, readiness, downtimeHours, riskCount };
  }, [productionLines, materials]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-5 h-5 text-emerald-500" />;
      case 'idle': return <PauseCircle className="w-5 h-5 text-amber-500" />;
      case 'maintenance': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 uppercase text-[10px] font-bold tracking-wider">Active</Badge>;
      case 'idle': return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 uppercase text-[10px] font-bold tracking-wider">Idle</Badge>;
      case 'maintenance': return <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 uppercase text-[10px] font-bold tracking-wider">Maintenance</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider">{status}</Badge>;
    }
  };

  const getLineIcon = (type: string, status: string) => {
    const isActive = status === 'active';
    const baseClass = `w-6 h-6 ${isActive ? 'text-emerald-500' : 'text-blue-500'}`;
    const bgClass = `w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-500/10 shadow-inner' : 'bg-blue-500/10 shadow-inner'}`;

    let icon = <Factory className={baseClass} />;
    if (type === 'sap_inpanel') icon = <Monitor className={baseClass} />;
    if (type === 'tpa_molding') icon = <Construction className={baseClass} />;
    if (type === 'assembly') icon = <Wrench className={baseClass} />;

    return <div className={bgClass}>{icon}</div>;
  };

  const getLineTypeLabel = (type: string) => {
    switch (type) {
      case 'sap_inpanel': return 'SAP Inpanel';
      case 'tpa_molding': return 'TPA Molding';
      case 'assembly': return 'Assembly';
      default: return 'Production';
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      {/* Page header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            {t('production.title')}
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">{t('production.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-11 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('production.addLine')}
          </Button>
        </div>
      </div>

      {/* ── SAP KPI Header ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <AnalyticCard
          icon={<Gauge className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-500"
          label="Factory Capacity"
          value={`${analytics.capacity}%`}
          sub="Overall lines utilized"
          accent={analytics.capacity >= 80 ? 'green' : analytics.capacity >= 50 ? 'yellow' : 'red'}
        />

        <AnalyticCard
          icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
          iconBg="bg-emerald-500"
          label="Material Readiness"
          value={`${analytics.readiness}%`}
          sub={analytics.riskCount === 0 ? 'All plans sufficiently covered' : `${analytics.riskCount} parts in critical shortage`}
          accent={analytics.readiness > 90 ? 'green' : analytics.readiness > 70 ? 'yellow' : 'red'}
          pulse={analytics.readiness < 90}
        />

        <AnalyticCard
          icon={<Clock className="w-6 h-6 text-rose-500" />}
          iconBg="bg-rose-500"
          label="Downtime Impact"
          value={`${analytics.downtimeHours} hr`}
          sub="Cumulative operational time lost"
          accent={parseFloat(analytics.downtimeHours) === 0 ? 'green' : 'red'}
          pulse={parseFloat(analytics.downtimeHours) > 0}
        />
      </div>

      {/* Lines grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productionLines.map(line => {
          const todayPlan = getTodayLinePlan(line.id);
          const activeShift = todayPlan?.shift || 'No active plan';
          const onTrack = line.efficiency >= 85;

          // Mock SAP Progress data
          const progressPercent = Math.min(100, Math.round((line.output / 1000) * 100)) || 0;
          const targetOutput = 1000;

          return (
            <Card
              key={line.id}
              onClick={() => navigate(`/production-lines/${line.id}`)}
              className="bg-white dark:bg-gray-900 border-border hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden flex flex-col"
            >
              <CardHeader className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {getLineIcon(line.type, line.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <CardTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {line.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-muted text-[9px] uppercase tracking-wider font-bold h-5">
                          {getLineTypeLabel(line.type)}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground font-bold">ID-{line.id}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusIcon(line.status)}
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 flex-1 space-y-6">
                {/* Active Plan Info */}
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50 bg-muted/30 px-3 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Target className="w-3 h-3" /> Target
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{targetOutput} Pcs</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 justify-end">
                      <Percent className="w-3 h-3" /> Efficiency
                    </span>
                    <span className={`text-sm font-bold ${onTrack ? 'text-emerald-500' : 'text-amber-500'}`}>{line.efficiency}%</span>
                  </div>
                </div>

                {/* Main Progress (Plan vs Fact) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Production Volume</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{line.output}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">/ {targetOutput}</span>
                    </div>
                  </div>
                  <div className="relative h-3 w-full bg-muted dark:bg-gray-800 rounded-full overflow-hidden border border-border/50">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full ${onTrack ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Specialized Module Views */}
                {line.type === 'sap_inpanel' && line.sapData && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <Monitor className="w-3 h-3" /> SAP Multi-Bin System
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        {line.sapData.completedBins} / {line.sapData.completedBins + (line.sapData.bins?.length || 0)} Bins
                      </span>
                    </div>
                    <Progress value={(line.sapData.completedBins / (line.sapData.completedBins + (line.sapData.bins?.length || 1))) * 100} className="h-1 bg-indigo-200/50 dark:bg-indigo-900/30" />
                  </div>
                )}

                {line.type === 'tpa_molding' && line.tpaData && (
                  <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/50 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <Construction className="w-3 h-3" /> Scrap Rate
                      </span>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{line.tpaData.scrapRate}%</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Active Molds</span>
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-300">{line.tpaData.machines.filter(m => m.status === 'running').length} / {line.tpaData.machines.length}</p>
                    </div>
                  </div>
                )}

                {/* Footer Section */}
                <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${onTrack ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                      <span className={`text-xs font-bold uppercase tracking-wide ${onTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {onTrack ? 'Healthy' : 'Action Required'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(line.status)}
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddModal && (
        <AddLineModal
          onClose={() => setShowAddModal(false)}
          onAdd={(line) => {
            addProductionLine(line);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddLineModalProps {
  onClose: () => void;
  onAdd: (line: any) => void;
}

function AddLineModal({ onClose, onAdd }: AddLineModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState<'assembly' | 'sap_inpanel' | 'tpa_molding'>('assembly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      type,
      status: 'idle',
      efficiency: 0,
      requiredMaterials: [],
      output: 0,
      ...(type === 'sap_inpanel' ? { sapData: { currentBinCount: 0, binTarget: 100, completedBins: 0, bins: [] } } : {}),
      ...(type === 'tpa_molding' ? { tpaData: { machines: [], scrapRate: 0 } } : {})
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full border-border shadow-2xl shadow-black/20 animate-in zoom-in-95">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('production.addLineTitle')}</CardTitle>
          <CardDescription>Configure a new production line unit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t('production.lineName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 h-11 border border-border bg-background rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder={t('production.placeholderExample')}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  System Architecture
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'assembly', label: 'Assembly', icon: <Wrench className="w-5 h-5" /> },
                    { id: 'sap_inpanel', label: 'SAP I/O', icon: <Monitor className="w-5 h-5" /> },
                    { id: 'tpa_molding', label: 'Molding', icon: <Construction className="w-5 h-5" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${type === t.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:border-muted-foreground/30'
                        }`}
                    >
                      {t.icon}
                      <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border-border hover:bg-muted font-bold uppercase text-[10px] tracking-widest transition-all"
              >
                {t('production.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {t('production.addLine')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
