import { useState } from 'react';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Package, Factory, TrendingUp, FileText, AlertTriangle, Wrench, Award, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type DateRange = 'today' | 'week' | 'month';

const defectDataMock = [
  { name: 'Line A', defects: 12 },
  { name: 'Line B', defects: 5 },
  { name: 'Line D', defects: 3 },
];

const maintenanceDataMock = [
  { name: 'Jan', events: 4 },
  { name: 'Feb', events: 6 },
  { name: 'Mar', events: 3 },
  { name: 'Apr', events: 5 },
];

export function Dashboard() {
  const { materials, productionLines, hrDocuments } = useFactory();
  const { t } = useLanguage();
  const [range, setRange] = useState<DateRange>('week');

  const lowStockCount = materials.filter(m => m.quantity <= m.minStock).length;
  const activeLines = productionLines.filter(l => l.status === 'active').length;
  const pendingDocs = hrDocuments.filter(d => d.status === 'pending').length;
  const totalOutput = productionLines.reduce((sum, line) => sum + line.output, 0);

  const productionData = productionLines.map(line => ({
    name: line.name.replace('Assembly Line ', 'Line ').replace('Quality Control Station', 'QC'),
    output: line.output,
    efficiency: line.efficiency,
  }));

  const statusData = [
    { name: t('dashboard.active'), value: productionLines.filter(l => l.status === 'active').length, color: '#22c55e' },
    { name: t('dashboard.idle'), value: productionLines.filter(l => l.status === 'idle').length, color: '#eab308' },
    { name: t('dashboard.maintenance'), value: productionLines.filter(l => l.status === 'maintenance').length, color: '#ef4444' },
  ];

  // Production & Analytics data
  const productionSummary = productionLines.map(line => ({
    name: line.name.replace('Assembly Line ', 'Line '),
    daily: line.output,
    monthly: line.output * 22,
  }));

  const efficiencyComparison = productionLines.map(line => ({
    name: line.name.replace('Assembly Line ', 'Line '),
    efficiency: line.efficiency,
  }));

  const totalDaily = productionSummary.reduce((sum, item) => sum + item.daily, 0);
  const totalMonthly = productionSummary.reduce((sum, item) => sum + item.monthly, 0);
  const totalDefects = defectDataMock.reduce((s, d) => s + d.defects, 0);
  const totalMaintenance = maintenanceDataMock.reduce((s, m) => s + m.events, 0);

  // Insights & Alerts
  const mostEfficientLine = productionLines.reduce((prev, current) => 
    (prev.efficiency > current.efficiency) ? prev : current
  );
  const leastEfficientLine = productionLines.reduce((prev, current) => 
    (prev.efficiency < current.efficiency) ? prev : current
  );
  const mostDefectsLine = defectDataMock.reduce((prev, current) => 
    (prev.defects > current.defects) ? prev : current
  );

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('dashboard.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-xs">
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1 rounded-md transition-colors ${
              range === 'today'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('dashboard.today')}
          </button>
          <button
            onClick={() => setRange('week')}
            className={`px-3 py-1 rounded-md transition-colors ${
              range === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('dashboard.week')}
          </button>
          <button
            onClick={() => setRange('month')}
            className={`px-3 py-1 rounded-md transition-colors ${
              range === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('dashboard.month')}
          </button>
        </div>
      </div>

      {/* SECTION 1: Quick Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.quickOverview')}</h3>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            title={t('dashboard.totalOutput')}
            value={totalOutput}
            unit={t('dashboard.unitsPerDay')}
            color="blue"
          />
          <MetricCard
            icon={<Package className="w-6 h-6" />}
            title={t('dashboard.lowStock')}
            value={lowStockCount}
            unit={t('dashboard.materials')}
            color="orange"
          />
          <MetricCard
            icon={<Factory className="w-6 h-6" />}
            title={t('dashboard.activeLines')}
            value={activeLines}
            unit={`${t('dashboard.of')} ${productionLines.length}`}
            color="green"
          />
          <MetricCard
            icon={<FileText className="w-6 h-6" />}
            title={t('dashboard.pendingDocs')}
            value={pendingDocs}
            unit={t('dashboard.awaitingApproval')}
            color="purple"
          />
        </div>

        {/* Line Status Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.lineStatus')}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {statusData.map(item => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Production & Analytics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.productionAnalytics')}</h3>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Daily / Monthly Production */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.dailyMonthlyProduction')}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productionSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip />
                <Bar dataKey="daily" fill="#3b82f6" radius={[6, 6, 0, 0]} name={t('dashboard.daily')} />
                <Bar dataKey="monthly" fill="#10b981" radius={[6, 6, 0, 0]} name={t('dashboard.monthly')} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Efficiency Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.lineEfficiency')}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efficiencyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defects and Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.defectsReport')}</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={defectDataMock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip />
                <Bar dataKey="defects" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.maintenanceFrequency')}</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={maintenanceDataMock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip />
                <Line type="monotone" dataKey="events" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 3: Insights & Alerts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.insightsAlerts')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InsightCard
            icon={<Award className="w-5 h-5" />}
            title={t('dashboard.mostEfficientLine')}
            value={mostEfficientLine.name.replace('Assembly Line ', 'Line ')}
            subtitle={`${mostEfficientLine.efficiency}% ${t('dashboard.efficiency')}`}
            color="green"
          />
          <InsightCard
            icon={<AlertCircle className="w-5 h-5" />}
            title={t('dashboard.leastEfficientLine')}
            value={leastEfficientLine.name.replace('Assembly Line ', 'Line ')}
            subtitle={`${leastEfficientLine.efficiency}% ${t('dashboard.efficiency')}`}
            color="red"
          />
          <InsightCard
            icon={<AlertTriangle className="w-5 h-5" />}
            title={t('dashboard.mostDefectsLine')}
            value={mostDefectsLine.name}
            subtitle={`${mostDefectsLine.defects} ${t('dashboard.defects')}`}
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  unit: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
}

function MetricCard({ icon, title, value, unit, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{unit}</p>
    </div>
  );
}

interface ActivityItemProps {
  text: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'red' | 'orange';
}

function InsightCard({ icon, title, value, subtitle, color }: InsightCardProps) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${colorClasses[color]} p-6`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
      </div>
      <p className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
    </div>
  );
}
