import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Factory, Plus, Activity, AlertCircle, PlayCircle, PauseCircle,
  TrendingUp, Target, Wrench, PackageX
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
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // ── Analytics calculations ──────────────────────────────────────────────
  const analytics = useMemo(() => {
    const lines = productionLines;

    // 1. Overall OEE: average efficiency across all lines
    const avgOEE = lines.length
      ? Math.round(lines.reduce((s, l) => s + l.efficiency, 0) / lines.length)
      : 0;

    // 2. Daily target progress: sum of outputs vs a fixed daily target per line (500 units each)
    const TARGET_PER_LINE = 500;
    const totalTarget = lines.length * TARGET_PER_LINE;
    const totalProduced = lines.reduce((s, l) => s + (l.output || 0), 0);

    // 3. Maintenance alerts: lines in red/yellow states
    const linesDown = lines.filter(l => l.status === 'maintenance_requested').length;
    const linesUnderRepair = lines.filter(l => l.status === 'maintenance').length;

    // 4. Material risk: materials with quantity < threshold indicating < 30 min risk
    // Using minStock / 2 as a proxy for "30-min buffer" (rough heuristic)
    const THIRTY_MIN_THRESHOLD_RATIO = 0.3; // 30% of minStock
    const riskCount = materials.filter(m =>
      m.minStock > 0 && m.quantity < m.minStock * THIRTY_MIN_THRESHOLD_RATIO
    ).length;

    return { avgOEE, totalTarget, totalProduced, linesDown, linesUnderRepair, riskCount };
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

  const maintenanceAlert = analytics.linesDown > 0 || analytics.linesUnderRepair > 0;

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

      {/* ── Production Analytics Header ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* 1. Overall OEE */}
        <AnalyticCard
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500"
          label="Overall OEE (Average)"
          value={`${analytics.avgOEE}%`}
          sub={`Across ${productionLines.length} active lines`}
          accent={analytics.avgOEE >= 80 ? 'green' : analytics.avgOEE >= 60 ? 'yellow' : 'red'}
        />

        {/* 2. Daily Target Progress */}
        <div className="relative bg-gray-900 dark:bg-gray-900 border border-gray-700/60 rounded-xl p-5 overflow-hidden shadow-lg flex flex-col gap-3">
          <div className="absolute inset-0 opacity-[0.04] bg-green-500 rounded-xl" />
          <div className="flex items-center justify-between relative">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Daily Target Progress</span>
            <span className="p-2 rounded-lg bg-green-500 bg-opacity-20">
              <Target className="w-5 h-5 text-green-400" />
            </span>
          </div>
          <div className="relative">
            <p className="text-2xl font-bold tracking-tight text-green-400">
              {analytics.totalProduced.toLocaleString()} / {analytics.totalTarget.toLocaleString()}
            </p>
            <div className="mt-2 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((analytics.totalProduced / analytics.totalTarget) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.min(100, Math.round((analytics.totalProduced / analytics.totalTarget) * 100))}% of daily target
            </p>
          </div>
        </div>

        {/* 3. Maintenance Alerts */}
        <AnalyticCard
          icon={<Wrench className={`w-5 h-5 ${maintenanceAlert ? 'text-red-400' : 'text-gray-400'}`} />}
          iconBg={maintenanceAlert ? 'bg-red-500' : 'bg-gray-500'}
          label="Active Maintenance Alerts"
          value={maintenanceAlert ? `${analytics.linesDown} Line${analytics.linesDown !== 1 ? 's' : ''} Down` : 'All Clear'}
          sub={analytics.linesUnderRepair > 0 ? `${analytics.linesUnderRepair} under repair` : 'No repairs in progress'}
          accent={maintenanceAlert ? 'red' : 'green'}
          pulse={maintenanceAlert}
        />

        {/* 4. Material Availability Risk */}
        <AnalyticCard
          icon={<PackageX className={`w-5 h-5 ${analytics.riskCount > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />}
          iconBg={analytics.riskCount > 0 ? 'bg-yellow-500' : 'bg-gray-500'}
          label="Material Availability Risk"
          value={analytics.riskCount > 0 ? `${analytics.riskCount} Part${analytics.riskCount !== 1 ? 's' : ''} Critical` : 'No Risk'}
          sub="Stock < 30 min remaining"
          accent={analytics.riskCount > 0 ? 'yellow' : 'green'}
          pulse={analytics.riskCount > 0}
        />
      </div>

      {/* Lines grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productionLines.map(line => (
          <div
            key={line.id}
            onClick={() => navigate(`/production-lines/${line.id}`)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Factory className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{line.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.id')}: {line.id}</p>
                </div>
              </div>
              {getStatusIcon(line.status)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.status')}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(line.status)}`}>
                  {t(`production.${line.status}`)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.efficiency')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.efficiency}%</span>
              </div>

              <div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${line.efficiency >= 80 ? 'bg-green-500' : line.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${line.efficiency}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.output')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.output} {t('production.unitsPerDay')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.materialsRequired')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.requiredMaterials.length} {t('production.types')}</span>
              </div>
            </div>
          </div>
        ))}
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
