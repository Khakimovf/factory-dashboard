import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Package, Factory, TrendingUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const { materials, productionLines, hrDocuments } = useFactory();
  const { t } = useLanguage();

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

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('dashboard.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Output Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.productionOutput')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #fff)', 
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="output" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="efficiency" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Status Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.lineStatus')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
          <div className="mt-4 space-y-2">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.quickOverview')}</h3>
        <div className="space-y-3">
          <ActivityItem
            text={t('dashboard.activityLineEfficiency').replace('{line}', 'Assembly Line A').replace('{percent}', '87')}
            time={`2 ${t('dashboard.hoursAgo')}`}
            type="success"
          />
          <ActivityItem
            text={t('dashboard.activityLowStock').replace('{count}', lowStockCount.toString())}
            time={`4 ${t('dashboard.hoursAgo')}`}
            type="warning"
          />
          <ActivityItem
            text={t('dashboard.activityStationIdle').replace('{station}', 'Quality Control Station')}
            time={`5 ${t('dashboard.hoursAgo')}`}
            type="info"
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

function ActivityItem({ text, time, type }: ActivityItemProps) {
  const typeColors = {
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className={`w-2 h-2 rounded-full mt-2 ${typeColors[type]}`} />
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white">{text}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}
