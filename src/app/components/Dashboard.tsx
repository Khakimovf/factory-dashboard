import { useMemo, useState } from 'react';
import { useFactory } from '../context/FactoryContext';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type DateRange = 'today' | 'week' | 'month';

export function Dashboard() {
  const { materials, productionLines, hrDocuments } = useFactory();
  const { t } = useLanguage();
  const [range, setRange] = useState<DateRange>('week');

  const lowStockCount = materials.filter(m => m.quantity <= m.minStock).length;
  const activeLines = productionLines.filter(l => l.status === 'active').length;
  const pendingDocs = hrDocuments.filter(d => d.status === 'pending').length;
  const totalOutput = productionLines.reduce((sum, line) => sum + line.output, 0);

  const mostEfficientLine = productionLines.reduce((prev, current) =>
    prev.efficiency > current.efficiency ? prev : current,
  );
  const leastEfficientLine = productionLines.reduce((prev, current) =>
    prev.efficiency < current.efficiency ? prev : current,
  );
  const avgEfficiency =
    productionLines.length > 0
      ? productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length
      : 0;

  const theoreticalPerLine = 1000;
  const plannedToday = productionLines.length * theoreticalPerLine;
  const productionPercent = plannedToday > 0 ? (totalOutput / plannedToday) * 100 : 0;
  const productionDeltaPercent = productionPercent - 100;

  const efficiencyDeltaPercent = avgEfficiency - 90;

  const stoppedLines = productionLines.length - activeLines;

  const lostUnitsToday = useMemo(
    () => Math.max(plannedToday - totalOutput, 0),
    [plannedToday, totalOutput],
  );

  const warehouseTotalStock = useMemo(
    () => materials.reduce((sum, m) => sum + m.quantity, 0),
    [materials],
  );
  const warehouseMinStock = useMemo(
    () => materials.reduce((sum, m) => sum + m.minStock, 0),
    [materials],
  );
  const warehouseLowStock = lowStockCount;
  const warehouseMovement = useMemo(
    () =>
      materials.map(m => ({
        name: m.name,
        qoldiq: m.quantity,
        kirim: Math.round(m.quantity * 0.3),
        chiqim: Math.round(m.quantity * 0.2),
      })),
    [materials],
  );

  const productionChartData = productionLines.map(line => ({
    name: line.name.replace('Assembly Line ', 'Line '),
    reja: line.output,
    fakt: Math.round(line.output * (line.efficiency / 100)),
    samaradorlik: line.efficiency,
  }));

  const qcKpiTodayDefects = 24;
  const qcKpiRejected = 3;
  const qcDefectsByLine = [
    { name: 'Line A', nuqsonlar: 8 },
    { name: 'Line B', nuqsonlar: 6 },
    { name: 'Line D', nuqsonlar: 10 },
  ];
  const qcDefectsByType = [
    { name: 'Ko‘rinish', value: 10 },
    { name: 'Funktsional', value: 8 },
    { name: 'Struktura', value: 6 },
  ];

  const ordersKpiNew = 4;
  const ordersKpiInProgress = 3;
  const ordersKpiCompleted = 5;
  const ordersStatusPie = [
    { name: 'Yangi', value: ordersKpiNew },
    { name: 'Jarayonda', value: ordersKpiInProgress },
    { name: 'Yakunlangan', value: ordersKpiCompleted },
  ];
  const ordersVolume = [
    { orderNumber: 'ORD-001', quantity: 500 },
    { orderNumber: 'ORD-002', quantity: 1000 },
    { orderNumber: 'ORD-003', quantity: 250 },
    { orderNumber: 'ORD-004', quantity: 750 },
  ];

  const finishedKpiTotal = 4;
  const finishedKpiFree = 3;
  const finishedByType = [
    { name: 'Vagon detallari', miqdor: 450 },
    { name: 'Avto komponentlar', miqdor: 850 },
    { name: 'Metall konstruksiya', miqdor: 75 },
    { name: 'Elektron komponentlar', miqdor: 1200 },
  ];

  const maintenanceKpiTotalStops = 7;
  const maintenanceKpiIssue = 2;
  const maintenanceKpiInRepair = 1;
  const maintenanceDowntimeTrend = [
    { name: 'Du', minutes: 40 },
    { name: 'Se', minutes: 55 },
    { name: 'Cho', minutes: 35 },
    { name: 'Pa', minutes: 65 },
    { name: 'Ju', minutes: 45 },
  ];
  const maintenanceReasons = [
    { name: 'Mexanik', value: 60 },
    { name: 'Elektr', value: 25 },
    { name: 'Reja to‘xtash', value: 15 },
  ];

  const deviationPercent = productionDeltaPercent;
  const riskLevel: 'Past' | 'O‘rtacha' | 'Yuqori' =
    Math.abs(deviationPercent) >= 10 || avgEfficiency < 80
      ? 'Yuqori'
      : Math.abs(deviationPercent) >= 5 || avgEfficiency < 85
      ? 'O‘rtacha'
      : 'Past';

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground">
            {t('dashboard.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('dashboard.welcome')}</p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
          <button
            onClick={() => setRange('today')}
            className={`px-3 py-1 rounded-md transition-colors ${
              range === 'today'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('dashboard.today')}
          </button>
          <button
            onClick={() => setRange('week')}
            className={`px-3 py-1 rounded-md transition-colors ${
              range === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('dashboard.week')}
          </button>
          <button
            onClick={() => setRange('month')}
            className={`px-3 py-1 rounded-md transition-colors ${
              range === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('dashboard.month')}
          </button>
        </div>
      </div>

      <TopSummary
        worstLine={leastEfficientLine.name.replace('Assembly Line ', 'Line ')}
        bestLine={mostEfficientLine.name.replace('Assembly Line ', 'Line ')}
        avgEfficiency={avgEfficiency}
        deviationPercent={deviationPercent}
        lostUnits={lostUnitsToday}
        riskLevel={riskLevel}
      />

      <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
          {t('dashboard.mainIndicators')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title={t('dashboard.metricCards.production.title')}
            value={Number.isFinite(productionPercent) ? productionPercent : 0}
            unit="%"
            color="blue"
            delta={productionDeltaPercent}
            explanation={
              productionDeltaPercent < 0
                ? t('dashboard.metricCards.production.explanationNegative').replace('{percent}', Math.abs(productionDeltaPercent).toFixed(1))
                : t('dashboard.metricCards.production.explanationPositive').replace('{percent}', productionDeltaPercent.toFixed(1))
            }
          />
          <MetricCard
            title={t('dashboard.metricCards.efficiency.title')}
            value={Number.isFinite(avgEfficiency) ? Number(avgEfficiency.toFixed(1)) : 0}
            unit="%"
            color="green"
            delta={efficiencyDeltaPercent}
            explanation={
              efficiencyDeltaPercent < 0
                ? t('dashboard.metricCards.efficiency.explanationNegative').replace('{percent}', Math.abs(efficiencyDeltaPercent).toFixed(1))
                : t('dashboard.metricCards.efficiency.explanationPositive').replace('{percent}', efficiencyDeltaPercent.toFixed(1))
            }
          />
          <MetricCard
            title={t('dashboard.metricCards.stoppedLines.title')}
            value={stoppedLines}
            unit={t('dashboard.metricCards.stoppedLines.unit')}
            color="orange"
            delta={0}
            explanation={
              stoppedLines === 0
                ? t('dashboard.metricCards.stoppedLines.explanationAllActive')
                : t('dashboard.metricCards.stoppedLines.explanationStopped').replace('{count}', stoppedLines.toString())
            }
          />
          <MetricCard
            title={t('dashboard.metricCards.lostProduction.title')}
            value={lostUnitsToday}
            unit={t('dashboard.metricCards.lostProduction.unit')}
            color="purple"
            delta={0}
            explanation={
              lostUnitsToday > 0
                ? t('dashboard.metricCards.lostProduction.explanationWithLoss').replace('{units}', lostUnitsToday.toLocaleString())
                : t('dashboard.metricCards.lostProduction.explanationNoLoss')
            }
          />
        </div>
      </div>

      <LineStatus productionLines={productionLines} />

      <div className="mt-10 space-y-10">
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.warehouseAnalysis.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title={t('dashboard.warehouseAnalysis.totalStock')}
              value={warehouseTotalStock}
              unit={t('dashboard.warehouseAnalysis.unit')}
              color="blue"
            />
            <MetricCard
              title={t('dashboard.warehouseAnalysis.minStock')}
              value={warehouseMinStock}
              unit={t('dashboard.warehouseAnalysis.unit')}
              color="green"
            />
            <MetricCard
              title={t('dashboard.warehouseAnalysis.lowStock')}
              value={warehouseLowStock}
              unit={t('dashboard.warehouseAnalysis.lowStockUnit')}
              color="orange"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.warehouseAnalysis.movement')}
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={warehouseMovement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip />
                <Bar dataKey="qoldiq" fill="#3b82f6" name={t('dashboard.warehouseAnalysis.chartBalance')} />
                <Bar dataKey="kirim" fill="#22c55e" name={t('dashboard.warehouseAnalysis.chartIncoming')} />
                <Bar dataKey="chiqim" fill="#f97316" name={t('dashboard.warehouseAnalysis.chartOutgoing')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.productionAnalysis.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title={t('dashboard.productionAnalysis.planTitle')}
              value={plannedToday}
              unit={t('dashboard.productionAnalysis.unit')}
              color="blue"
            />
            <MetricCard
              title={t('dashboard.productionAnalysis.factTitle')}
              value={totalOutput}
              unit={t('dashboard.productionAnalysis.unit')}
              color="green"
            />
            <MetricCard
              title={t('dashboard.productionAnalysis.avgEfficiency')}
              value={Number(avgEfficiency.toFixed(1))}
              unit="%"
              color="orange"
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.productionAnalysis.planVsFact')}
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={productionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="reja" fill="#3b82f6" name={t('dashboard.productionAnalysis.chartPlan')} />
                  <Bar dataKey="fakt" fill="#22c55e" name={t('dashboard.productionAnalysis.chartFact')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.productionAnalysis.efficiencyTrend')}
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={productionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="samaradorlik" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.qcAnalysis.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title={t('dashboard.qcAnalysis.defectsToday')}
              value={qcKpiTodayDefects}
              unit={t('dashboard.qcAnalysis.unit')}
              color="blue"
            />
            <MetricCard
              title={t('dashboard.qcAnalysis.rejectedBatches')}
              value={qcKpiRejected}
              unit={t('dashboard.qcAnalysis.batchUnit')}
              color="purple"
            />
            <MetricCard
              title={t('dashboard.qcAnalysis.worstLine')}
              value={qcDefectsByLine.reduce((max, cur) => (cur.nuqsonlar > max.nuqsonlar ? cur : max), qcDefectsByLine[0]).nuqsonlar}
              unit={t('dashboard.qcAnalysis.defectUnit')}
              color="orange"
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.qcAnalysis.defectsByLine')}
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={qcDefectsByLine}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="nuqsonlar" fill="#ef4444" name={t('dashboard.qcAnalysis.chartDefects')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.qcAnalysis.defectTypes')}
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={qcDefectsByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                  >
                    {qcDefectsByType.map((entry, index) => (
                      <Cell
                        key={`cell-qc-${index}`}
                        fill={['#22c55e', '#f97316', '#ef4444'][index % 3]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.ordersAnalysis.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard title={t('dashboard.ordersAnalysis.newOrders')} value={ordersKpiNew} unit={t('dashboard.ordersAnalysis.unit')} color="blue" />
            <MetricCard title={t('dashboard.ordersAnalysis.inProgress')} value={ordersKpiInProgress} unit={t('dashboard.ordersAnalysis.unit')} color="orange" />
            <MetricCard title={t('dashboard.ordersAnalysis.completed')} value={ordersKpiCompleted} unit={t('dashboard.ordersAnalysis.unit')} color="green" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.ordersAnalysis.status')}
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={ordersStatusPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    labelLine={false}
                  >
                    {ordersStatusPie.map((entry, index) => (
                      <Cell
                        key={`cell-orders-${index}`}
                        fill={['#3b82f6', '#f97316', '#22c55e'][index % 3]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.ordersAnalysis.recentVolume')}
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ordersVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="orderNumber" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#3b82f6" name={t('dashboard.ordersAnalysis.chartQuantity')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.finishedGoodsAnalysis.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard title={t('dashboard.finishedGoodsAnalysis.totalTypes')} value={finishedKpiTotal} unit={t('dashboard.finishedGoodsAnalysis.unit')} color="blue" />
            <MetricCard title={t('dashboard.finishedGoodsAnalysis.freeStock')} value={finishedKpiFree} unit={t('dashboard.finishedGoodsAnalysis.unit')} color="green" />
            <MetricCard title={t('dashboard.finishedGoodsAnalysis.lowStockRisk')} value={1} unit={t('dashboard.finishedGoodsAnalysis.unit')} color="orange" />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.finishedGoodsAnalysis.byType')}
            </h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={finishedByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip />
                <Bar dataKey="miqdor" fill="#22c55e" name={t('dashboard.finishedGoodsAnalysis.chartQuantity')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            {t('dashboard.maintenanceAnalysis.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard title={t('dashboard.maintenanceAnalysis.totalStops')} value={maintenanceKpiTotalStops} unit={t('dashboard.maintenanceAnalysis.timesUnit')} color="blue" />
            <MetricCard title={t('dashboard.maintenanceAnalysis.problemLines')} value={maintenanceKpiIssue} unit={t('dashboard.maintenanceAnalysis.lineUnit')} color="red" />
            <MetricCard title={t('dashboard.maintenanceAnalysis.inRepair')} value={maintenanceKpiInRepair} unit={t('dashboard.maintenanceAnalysis.lineUnit')} color="orange" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.maintenanceAnalysis.downtimeByDay')}
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={maintenanceDowntimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="minutes" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border-border rounded-xl shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-card-foreground mb-4">
                {t('dashboard.maintenanceAnalysis.byReason')}
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={maintenanceReasons}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" name={t('dashboard.maintenanceAnalysis.chartStops')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  color: 'blue' | 'orange' | 'green' | 'purple';
  delta?: number;
  explanation?: string;
}

function MetricCard({ title, value, unit, color, delta, explanation }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-6">
      <h3 className="text-slate-300 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-semibold text-slate-50">
        {unit === '%' ? `${value.toFixed(1)}%` : unit === 'so‘m' ? value.toLocaleString('uz-UZ') : value}
      </p>
      {typeof delta === 'number' && (
        <p
          className={`text-sm font-medium mt-1 ${
            delta > 0
              ? 'text-green-400'
              : delta < 0
              ? 'text-red-400'
              : 'text-slate-400'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta.toFixed(1)}%
        </p>
      )}
      <p className={`text-xs uppercase tracking-wide mt-1 ${colorClasses[color]}`}>{unit}</p>
      {explanation && (
        <p className="text-xs text-slate-400 mt-1 leading-snug">{explanation}</p>
      )}
    </div>
  );
}
interface TopSummaryProps {
  worstLine: string;
  bestLine: string;
  avgEfficiency: number;
  deviationPercent: number;
  lostUnits: number;
  riskLevel: 'Past' | 'O‘rtacha' | 'Yuqori';
}

function TopSummary({
  worstLine,
  bestLine,
  avgEfficiency,
  deviationPercent,
  lostUnits,
  riskLevel,
}: TopSummaryProps) {
  const { t } = useLanguage();
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-50 mb-3">{t('dashboard.topSummary.title')}</h3>
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-5 space-y-1 text-sm text-slate-100">
        <p>🔴 {t('dashboard.topSummary.problemPrefix')} {worstLine} {t('dashboard.topSummary.problemSuffix')}</p>
        <p>🟡 {t('dashboard.topSummary.riskPrefix')} {avgEfficiency.toFixed(1)}% {t('dashboard.topSummary.riskMiddle').replace('{riskLevel}', riskLevel)}</p>
        <p>🟢 {t('dashboard.topSummary.goodPrefix')} {bestLine} {t('dashboard.topSummary.goodSuffix')}</p>
        <p>
          📊 {t('dashboard.topSummary.deviationPrefix')} {deviationPercent.toFixed(1)}%, {t('dashboard.topSummary.deviationMiddle')} {lostUnits.toLocaleString()} {t('dashboard.topSummary.deviationSuffix')}
        </p>
      </div>
    </div>
  );
}

interface LineStatusProps {
  productionLines: typeof useFactory extends () => infer T ? T extends { productionLines: infer U } ? U : any : any;
}

function LineStatus({ productionLines }: LineStatusProps) {
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-50 mb-3">{t('dashboard.lineStatus.title')}</h3>
      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-5 space-y-2 text-sm text-slate-100">
        {productionLines.map(line => {
          const simpleName = line.name.replace('Assembly Line ', 'Line ').replace('Quality Control Station', 'QC');
          const statusText =
            line.status === 'active'
              ? `🟢 ${t('dashboard.lineStatus.active')}`
              : line.status === 'maintenance'
              ? `🔴 ${t('dashboard.lineStatus.maintenance')}`
              : `🟡 ${t('dashboard.lineStatus.idle')}`;
          return (
            <p key={line.id}>
              {simpleName} — {statusText}
            </p>
          );
        })}
      </div>
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
    <div className={`bg-slate-900 rounded-xl shadow-sm border ${colorClasses[color]} p-6`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h4 className="text-sm font-medium text-slate-200">{title}</h4>
      </div>
      <p className="text-xl font-semibold text-slate-50 mb-1">{value}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}
