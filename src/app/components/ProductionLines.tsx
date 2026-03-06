import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { useDailyProductionPlan } from '../context/DailyProductionPlanContext';
import {
  Factory, Plus, Activity, AlertCircle, PlayCircle, PauseCircle,
  TrendingUp, Target, Wrench, PackageX, Clock, ShieldCheck, CheckCircle2
} from 'lucide-react';

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
  const accentText: Record<string, string> = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  };
  return (
    <div className="relative bg-gray-900 dark:bg-gray-900 border border-gray-700/60 rounded-xl p-5 overflow-hidden flex flex-col gap-3 shadow-lg">
      {/* Subtle glow */}
      <div className={`absolute inset-0 opacity-[0.04] ${iconBg} rounded-xl`} />
      <div className="flex items-center justify-between relative">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        <span className={`p-2 rounded-lg ${iconBg} bg-opacity-20`}>{icon}</span>
      </div>
      <div className="relative">
        <p className={`text-2xl font-bold tracking-tight ${accentText[accent]} ${pulse ? 'animate-pulse' : ''}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
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
    // Mock SAP readiness heuristic: subtract 5% per critical part risk
    const readiness = Math.max(0, 100 - (riskCount * 5));

    // 3. Downtime Impact (Hours lost)
    const downtimeMinutes = lines.reduce((s, l) => s + (l.downtimeRecord?.accumulatedMinutes || 0), 0);
    const downtimeHours = (downtimeMinutes / 60).toFixed(1);

    return { capacity, readiness, downtimeHours, riskCount };
  }, [productionLines, materials]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'idle': return <PauseCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'maintenance': return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'idle': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'maintenance': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const linesDown = productionLines.filter(l => l.status === 'maintenance_requested').length;
  const linesUnderRepair = productionLines.filter(l => l.status === 'maintenance').length;
  const maintenanceAlert = linesDown > 0 || linesUnderRepair > 0;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('production.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('production.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('production.addLine')}
        </button>
      </div>

      {/* ── SAP KPI Header ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 1. Factory Capacity */}
        <AnalyticCard
          icon={<Factory className="w-6 h-6 text-blue-400" />}
          iconBg="bg-blue-600"
          label="Factory Capacity"
          value={`${analytics.capacity}%`}
          sub="Overall lines utilized"
          accent={analytics.capacity >= 80 ? 'green' : analytics.capacity >= 50 ? 'yellow' : 'red'}
        />

        {/* 2. Material Readiness */}
        <AnalyticCard
          icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
          iconBg="bg-green-600"
          label="Material Readiness"
          value={`${analytics.readiness}%`}
          sub={analytics.riskCount === 0 ? 'All plans sufficiently covered' : `${analytics.riskCount} parts in critical shortage`}
          accent={analytics.readiness > 90 ? 'green' : analytics.readiness > 70 ? 'yellow' : 'red'}
          pulse={analytics.readiness < 90}
        />

        {/* 3. Downtime Impact */}
        <AnalyticCard
          icon={<Clock className="w-6 h-6 text-red-400" />}
          iconBg="bg-red-600"
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

          return (
            <div
              key={line.id}
              onClick={() => navigate(`/production-lines/${line.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${line.status === 'active' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    <Factory className={`w-6 h-6 ${line.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">{line.name}</h3>
                    <p className="text-sm font-mono text-gray-400 dark:text-gray-500">ID: {line.id}</p>
                  </div>
                </div>
                {getStatusIcon(line.status)}
              </div>

              <div className="flex-1 space-y-4">
                {/* Active Shift */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 pb-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Shift</span>
                  <span className={`text-sm font-bold ${activeShift !== 'No active plan' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {activeShift}
                  </span>
                </div>

                {/* Real-Time OEE */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Real-Time OEE</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{line.efficiency}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${line.efficiency >= 85 ? 'bg-green-500' : line.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${line.efficiency}%` }}
                    />
                  </div>
                </div>

                {/* Status & Health Bar */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${onTrack ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className={`text-sm font-semibold tracking-wide ${onTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {onTrack ? 'ON TRACK' : 'DELAYED'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(line.status)}`}>
                    {t(`production.${line.status}`)}
                  </span>
                </div>
              </div>
            </div>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ name, status: 'idle', efficiency: 0, requiredMaterials: [], output: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('production.addLineTitle')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('production.lineName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('production.placeholderExample')}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('production.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('production.addLine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
