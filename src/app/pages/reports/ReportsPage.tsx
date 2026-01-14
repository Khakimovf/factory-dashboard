import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Factory, TrendingUp, AlertTriangle, Wrench } from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';

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

export function ReportsPage() {
  const { productionLines } = useFactory();
  const { t } = useLanguage();
  const [range, setRange] = useState<DateRange>('week');

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

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Factory className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Hisobotlar va Analitika</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Direktor va menejerlar uchun ishlab chiqarish, nuqsonlar va texnik xizmat bo‘yicha yakuniy ko‘rinish.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-xs">
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1 rounded-md ${
              range === 'today'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Bugun
          </button>
          <button
            onClick={() => setRange('week')}
            className={`px-3 py-1 rounded-md ${
              range === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Hafta
          </button>
          <button
            onClick={() => setRange('month')}
            className={`px-3 py-1 rounded-md ${
              range === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Oy
          </button>
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Kunlik ishlab chiqarish"
          value={totalDaily}
          subtitle="Bugungi yakuniy chiqim"
        />
        <SummaryCard
          icon={<Factory className="w-6 h-6" />}
          title="Oylik ishlab chiqarish"
          value={totalMonthly}
          subtitle="Taxminiy oylik (22 ish kuni)"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Nuqsonlar"
          value={defectDataMock.reduce((s, d) => s + d.defects, 0)}
          subtitle="Bugungi aniqlangan nuqsonlar"
        />
        <SummaryCard
          icon={<Wrench className="w-6 h-6" />}
          title="Texnik xizmat"
          value={maintenanceDataMock.reduce((s, m) => s + m.events, 0)}
          subtitle="Oxirgi oyda qayd etilgan"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily / monthly production */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Kunlik / oylik ishlab chiqarish
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={productionSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip />
              <Bar dataKey="daily" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Kunlik" />
              <Bar dataKey="monthly" fill="#10b981" radius={[6, 6, 0, 0]} name="Oylik" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line efficiency */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Liniyalar samaradorligi
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={efficiencyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip />
              <Line type="monotone" dataKey="efficiency" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: defects and maintenance */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Nuqsonlar bo‘yicha hisobot
          </h2>
          <ResponsiveContainer width="100%" height={260}>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Texnik xizmat chastotasi
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={maintenanceDataMock}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-600" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
}

function SummaryCard({ icon, title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}

