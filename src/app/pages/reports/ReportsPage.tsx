import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { useSales } from '../../context/SalesContext';
import { initialSuppliers } from '../suppliers/SuppliersPage';
import { EnhancedSupplier, generateMockDeliveryHistory } from '../../services/supplierService';
import { initialInspections } from '../../context/QCContext';
import { hrEmployees } from '../../data/hrEmployees';
import { TrendingUp, TrendingDown, Activity, Settings, Coffee, Download, AlertCircle, CheckCircle2, Filter, Calendar, Users, Loader2, DollarSign, History, FileText } from 'lucide-react';
import { format, subDays, startOfMonth, startOfDay, differenceInDays, isBefore, parseISO, endOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';

type Range = 'daily' | 'weekly' | 'monthly';

interface MetricRow {
  name: string;
  plan: number;
  actual: number;
  deviation: number;
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const { productionLines = [] } = useFactory();
  const { finishedGoods = [] } = useWarehouse();
  const { salesOrders = [] } = useSales();

  const todayRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return salesOrders
      .filter(o => ['DELIVERED', 'SHIPPED', 'GOODS_ISSUED'].includes(o.status) && o.createdAt.startsWith(today))
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [salesOrders]);
  // Advanced Filter State
  const [globalDateRange, setGlobalDateRange] = useState<'Today' | 'Last 7 Days' | 'This Month' | 'Custom Range'>('Last 7 Days');
  const [customDate, setCustomDate] = useState({ start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') });
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['Assembly A', 'Assembly B', 'Warehouse', 'Canteen', 'Maintenance']);
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  // UI Loading & Fetch State
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  // Smart Date Logic
  const activeDateRange = useMemo(() => {
    const now = new Date();
    if (globalDateRange === 'Today') return { start: startOfDay(now), end: endOfDay(now) };
    if (globalDateRange === 'Last 7 Days') return { start: subDays(now, 7), end: endOfDay(now) };
    if (globalDateRange === 'This Month') return { start: startOfMonth(now), end: endOfDay(now) };
    // Custom Range
    return { start: parseISO(customDate.start), end: endOfDay(parseISO(customDate.end)) };
  }, [globalDateRange, customDate]);

  const daysDiff = Math.max(1, differenceInDays(activeDateRange.end, activeDateRange.start));
  const isHistorical = isBefore(activeDateRange.end, startOfDay(new Date()));

  // Trigger Deep Fetch Simulation
  useEffect(() => {
    setIsFetchingData(true);
    const t = setTimeout(() => setIsFetchingData(false), 500);
    return () => clearTimeout(t);
  }, [activeDateRange, selectedDepartments, isComparisonMode]);

  const toggleDept = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  // Executive Dashboard Mock Data
  const executiveMetrics = {
    oee: { goal: 90, actual: isComparisonMode ? 88 : 86, trend: isComparisonMode ? '+0.4%' : '+2.1%' },
    health: 'Amber', // 'Green' | 'Amber' | 'Red'
    mttr: '42 min',
    downtimeCost: `$${(2071 * daysDiff).toLocaleString()}`,
    canteenRatio: '8.4%', // Food waste vs attendance
  };



  // Data calculations - safe with defaults
  const totalLines = productionLines.length;
  const activeLines = productionLines.filter(l => l.status === 'active').length;
  const avgEfficiency =
    productionLines.length > 0
      ? Math.round(
        productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length,
      )
      : 0;

  const finishedTotalTypes = finishedGoods.length;
  const finishedTotalQty = finishedGoods.reduce((sum, p) => sum + p.totalQuantity, 0);
  const finishedFree = finishedGoods.filter(p => p.status === 'AVAILABLE_FOR_SALE').length;
  const finishedLow = finishedGoods.filter(p => p.availableQuantity <= 10).length;

  const maintenanceLineStatuses: Record<string, 'NORMAL' | 'ISSUE_REPORTED' | 'TECHNICIAN_ASSIGNED'> =
    { '1': 'ISSUE_REPORTED', '2': 'NORMAL', '3': 'TECHNICIAN_ASSIGNED' };

  const maintenanceSummaryLines = productionLines
    .filter(l => l.name.includes('Assembly Line'))
    .map(line => {
      const status = maintenanceLineStatuses[line.id] || 'NORMAL';
      const stops = status === 'NORMAL' ? 0 : status === 'ISSUE_REPORTED' ? 1 : 2;
      const minutes = stops * 30;
      const type =
        status === 'NORMAL'
          ? t('reports.maintenance.normal')
          : status === 'ISSUE_REPORTED'
            ? t('reports.maintenance.issueReported')
            : t('reports.maintenance.inRepair');
      return {
        lineName: line.name.replace('Assembly Line ', 'Line '),
        type,
        stops,
        minutes,
      };
    });

  const maintenanceTotalStops = maintenanceSummaryLines.reduce((sum, l) => sum + l.stops, 0);
  const maintenanceProblemLines = maintenanceSummaryLines.filter(l => l.stops > 0).length;
  const maintenanceInRepairLines = maintenanceSummaryLines.filter(l =>
    l.type.includes('Ta\'mirlash') || l.type.includes('ремонт') || l.type.includes('수리')
  ).length;

  const suppliers: EnhancedSupplier[] = initialSuppliers;

  const supplierReport = useMemo(() => {
    return suppliers.map(s => {
      const materialNames: Record<string, string> = {};
      const deliveries = generateMockDeliveryHistory(s.id, s.suppliedMaterials, materialNames);
      const delayed = deliveries.filter(d => d.delayDays > 0).length;
      const lastDate =
        deliveries.length > 0
          ? deliveries
            .map(d => d.date)
            .sort()
            .slice(-1)[0]
          : '-';
      return {
        name: s.name,
        deliveries: deliveries.length,
        delayed,
        lastDate,
      };
    });
  }, [suppliers]);

  const suppliersTotal = suppliers.length;
  const suppliersActive = suppliers.filter(s => s.status === 'active').length;
  const suppliersDelayed = supplierReport.reduce((sum, r) => sum + (r.delayed > 0 ? 1 : 0), 0);

  const activeInspections = initialInspections || [];
  const qcTotalDefects = activeInspections.reduce((sum, i: any) => sum + i.totalDefects, 0);
  const qcRejected = activeInspections.filter((i: any) => i.status === 'rejected').length;

  const qcByLine = activeInspections.reduce<Record<string, { defects: number; rejected: number }>>(
    (acc, i: any) => {
      const key = i.lineName;
      if (!acc[key]) acc[key] = { defects: 0, rejected: 0 };
      acc[key].defects += i.totalDefects;
      if (i.status === 'rejected') acc[key].rejected += 1;
      return acc;
    },
    {},
  );

  const qcWorstLine = Object.entries(qcByLine).reduce(
    (best, [line, data]: [string, any]) => (data.defects > best.defects ? { line, defects: data.defects } : best),
    { line: '-', defects: -1 },
  );

  const qcPerLineRows = Object.entries(qcByLine).map(([line, data]: [string, any]) => ({
    line,
    defects: data.defects,
    rejected: data.rejected,
    note: data.defects === qcWorstLine.defects && data.defects > 0 ? t('reports.qc.mainProblemLine') : '',
  }));

  const totalEmployees = hrEmployees.length;
  const activeEmployees = hrEmployees.filter(e => e.status === 'active').length;

  const employeesByDepartment = hrEmployees.reduce<Record<string, { total: number; open: number }>>(
    (acc, e) => {
      if (!acc[e.department]) acc[e.department] = { total: 0, open: 0 };
      if (e.status !== 'inactive') acc[e.department].total += 1;
      else acc[e.department].open += 1;
      return acc;
    },
    {},
  );

  const productionMetrics: MetricRow[] = useMemo(() => {
    if (!selectedDepartments.includes('Assembly A') && !selectedDepartments.includes('Assembly B')) return [];

    const activeShare = totalLines > 0 ? (activeLines / totalLines) * 100 : 0;
    const activePlan = 100;
    const effPlan = 90;

    return [
      {
        name: t('reports.production.activeLinesShare'),
        plan: activePlan,
        actual: Math.round(activeShare),
        deviation: Math.round(activeShare) - activePlan,
      },
      {
        name: t('reports.production.avgEfficiency'),
        plan: effPlan,
        actual: avgEfficiency,
        deviation: avgEfficiency - effPlan,
      },
    ];
  }, [activeLines, avgEfficiency, totalLines, t]);

  const hrMetrics: MetricRow[] = useMemo(() => {
    const planPending = 0;
    const actualPending = 0;
    const deviation = actualPending - planPending;

    return [
      {
        name: 'HR hujjatlar balansi',
        plan: planPending,
        actual: actualPending,
        deviation,
      },
    ];
  }, []);

  const periodLabel = `${format(activeDateRange.start, 'dd.MM.yyyy')} - ${format(activeDateRange.end, 'dd.MM.yyyy')}`;

  const handlePrint = () => {
    window.print();
  };

  const exportSectionToPdf = (sectionId: string, title: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const win = window.open('', '_blank');
    if (!win) return;

    const html = `<!doctype html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: #000; margin: 16px; background: #fff; }
      h2, h3 { margin: 0 0 8px 0; font-weight: 600; color: #000; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; color: #0f172a !important; }
      th { background: #f8fafc; font-weight: 600; }
      p { margin: 4px 0; color: #475569; }
      /* Clean up dark mode artifacts for print */
      svg { display: inline-block; vertical-align: middle; }
      .bg-slate-800, .bg-slate-900 { background-color: #fff !important; }
      .text-white, .text-slate-300, .text-slate-400 { color: #0f172a !important; }
      .border-slate-700 { border-color: #e2e8f0 !important; }
    </style>
  </head>
  <body>
    <h2>Official Operational Audit Report</h2>
    <p>Range: ${periodLabel} • Printed: ${new Date().toLocaleDateString('uz-UZ')}</p>
    <div style="margin-top: 20px;">
      ${section.innerHTML}
    </div>
  </body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();

    setTimeout(() => {
      setIsReportLoading(false);
      win.print();
    }, 800); // simulated complex generation delay
  };

  const exportTableToCsv = (sectionId: string, filename: string) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const table = section.querySelector('table');
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    for (let i = 0; i < rows.length; i++) {
      let row = [], cols = rows[i].querySelectorAll('td, th');
      for (let j = 0; j < cols.length; j++) {
        // Retrieve text content and clean up
        let data = cols[j].textContent?.replace(/(\\r\\n|\\n|\\r)/gm, '').trim() || '';
        // Escape double quotes
        data = data.replace(/"/g, '""');
        // Check if parsing needed for thousands separator (Optional)
        row.push('"' + data + '"');
      }
      csv.push(row.join(','));
    }

    const csvString = csv.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // ALWAYS render - never return null
  return (
    <div className="min-h-full p-6 bg-slate-900 text-slate-100">
      <div className="w-full mx-auto">
        {/* Header Area */}
        <div className="mb-8 flex items-start justify-between gap-6 print:flex-col relative">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {t('reports.title')}
              {isHistorical && (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/30">
                  <History className="w-3.5 h-3.5" /> Tarixiy Ma'lumot Rejimi
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Executive Command Center • {periodLabel}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {t('reports.date')}: {new Date().toLocaleDateString('uz-UZ')} • {t('reports.autoGenerated')}
            </p>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <button
              onClick={() => exportSectionToPdf('reports-full', 'Executive Report')}
              disabled={isReportLoading}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isReportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              )}
              {isReportLoading ? 'GENERATING REPORT...' : 'DOWNLOAD FULL BOARD REPORT (PDF)'}
            </button>
          </div>
        </div>

        {/* Global Filter Bar (SAC Style) */}
        {/* Simplified Global Filter Bar for Executives */}
        <div className="mb-8 p-6 bg-slate-800 border border-slate-700 rounded-xl shadow-lg flex flex-col xl:flex-row gap-6 items-start xl:items-center">

          {/* Date Selection */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">🗓️ Sana Oralig'ini Tanlash (Hisobot Davri)</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">

              <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
                {(['Bugun', 'Oxirgi 7 kun', 'Shu Oy'] as const).map((preset) => {
                  const enPreset = preset === 'Bugun' ? 'Today' : preset === 'Oxirgi 7 kun' ? 'Last 7 Days' : 'This Month';
                  const active = globalDateRange === enPreset;
                  return (
                    <button
                      key={preset}
                      onClick={() => setGlobalDateRange(enPreset)}
                      className={`px-5 py-2.5 text-sm font-bold rounded-md transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg p-2 w-full sm:w-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase px-1">Dan (Boshlanish)</span>
                  <input
                    type="date"
                    value={globalDateRange === 'Custom Range' ? customDate.start : format(activeDateRange.start, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      setGlobalDateRange('Custom Range');
                      setCustomDate(prev => ({ ...prev, start: e.target.value }));
                    }}
                    className="bg-transparent text-white font-medium outline-none px-2 py-1 w-full sm:w-auto [color-scheme:dark]"
                  />
                </div>
                <span className="text-slate-500 font-bold">-</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase px-1">Gacha (Tugash)</span>
                  <input
                    type="date"
                    value={globalDateRange === 'Custom Range' ? customDate.end : format(activeDateRange.end, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      setGlobalDateRange('Custom Range');
                      setCustomDate(prev => ({ ...prev, end: e.target.value }));
                    }}
                    className="bg-transparent text-white font-medium outline-none px-2 py-1 w-full sm:w-auto [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div className="w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-slate-700 pt-6 xl:pt-0 xl:pl-6">
            <label className="block text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">🏢 Filtrlash (Bo'limlar va Holat)</label>
            <div className="flex flex-col sm:flex-row gap-4 items-center">

              <div className="relative w-full sm:w-auto">
                <select
                  className="appearance-none bg-slate-900 border border-slate-700 text-white text-sm font-semibold rounded-lg px-4 py-3.5 pr-10 w-full outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                  onChange={(e) => {
                    if (e.target.value === 'ALL') {
                      setSelectedDepartments(['Assembly A', 'Assembly B', 'Warehouse', 'Canteen', 'Maintenance']);
                    } else {
                      setSelectedDepartments([e.target.value]);
                    }
                  }}
                >
                  <option value="ALL">Barcha Bo'limlar</option>
                  <option value="Assembly A">Yig'ish Liniyasi A</option>
                  <option value="Assembly B">Yig'ish Liniyasi B</option>
                  <option value="Warehouse">Omborxona</option>
                  <option value="Maintenance">Ta'mirlash</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Filter className="w-4 h-4" />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 w-full sm:w-auto hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={isComparisonMode}
                  onChange={(e) => setIsComparisonMode(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-500 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                />
                <span className="text-sm font-semibold text-slate-300">O'tgan davr bilan yondoshish</span>
              </label>

            </div>
          </div>
        </div>

        {/* Executive Summary Tiles */}
        <div id="reports-full" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8 mt-4 print:grid-cols-3 print:break-inside-avoid">
          {/* NEW TILE: Daily Sales Revenue */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[inset_0_2px_15px_rgba(16,185,129,0.05)]">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
              <DollarSign className="w-20 h-20 text-emerald-500" />
            </div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <span className="bg-emerald-500/20 text-emerald-500 rounded p-1"><DollarSign className="w-3.5 h-3.5" /></span>
              <h3 className="font-medium text-sm text-emerald-400/90 tracking-widest uppercase">Bugungi Sotuv</h3>
            </div>
            <div className="flex flex-col mt-1 z-10">
              <span className="text-3xl font-black text-white tracking-tight">{(todayRevenue / 1000000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M UZS</span>
              <p className="text-[10px] text-slate-400 leading-tight mt-1 max-w-[90%]">Direct contract dispatches today.</p>
            </div>
          </div>

          {/* Tile 1: OEE */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-16 h-16 text-indigo-400" />
            </div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <h3 className="font-medium text-sm">Overall Plant Efficiency (OEE)</h3>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold text-white">{executiveMetrics.oee.actual}%</span>
              <div className="flex flex-col pb-1">
                <span className="text-xs text-slate-500">Goal: {executiveMetrics.oee.goal}%</span>
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {executiveMetrics.oee.trend}
                </span>
              </div>
            </div>
          </div>

          {/* NEW TILE: Cost of Downtime */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[inset_0_2px_15px_rgba(239,68,68,0.05)]">
            <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
              <DollarSign className="w-20 h-20 text-rose-500" />
            </div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <span className="bg-rose-500/20 text-rose-500 rounded p-1"><DollarSign className="w-3.5 h-3.5" /></span>
              <h3 className="font-medium text-sm text-rose-400/90">Cost of Downtime</h3>
            </div>
            <div className="flex flex-col mt-1 z-10">
              <span className="text-3xl font-black text-white tracking-tight">{executiveMetrics.downtimeCost}</span>
              <p className="text-[10px] text-slate-400 leading-tight mt-1 max-w-[90%]">Direct labor & lost production value linked to <strong className="text-rose-400">42 min MTTR</strong>.</p>
            </div>
          </div>

          {/* Tile 2: Health */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="w-16 h-16 text-amber-400" />
            </div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: executiveMetrics.health === 'Green' ? '#10b981' : executiveMetrics.health === 'Amber' ? '#f59e0b' : '#ef4444' }} />
              <h3 className="font-medium text-sm">Production Health</h3>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold" style={{ color: executiveMetrics.health === 'Green' ? '#10b981' : executiveMetrics.health === 'Amber' ? '#f59e0b' : '#ef4444' }}>
                {executiveMetrics.health}
              </span>
              <span className="text-xs text-slate-500 pb-1">Minor deviations</span>
            </div>
          </div>

          {/* Tile 3: MTTR */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Settings className="w-16 h-16 text-slate-400" />
            </div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <h3 className="font-medium text-sm">Maintenance MTTR</h3>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold text-white">{executiveMetrics.mttr}</span>
              <span className="text-xs text-slate-500 pb-1">Avg real-time</span>
            </div>
          </div>

          {/* Tile 4: Canteen */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Coffee className="w-16 h-16 text-amber-600" />
            </div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Coffee className="w-4 h-4 text-amber-500" />
              <h3 className="font-medium text-sm">Canteen Efficiency</h3>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold text-white">{executiveMetrics.canteenRatio}</span>
              <span className="text-xs text-slate-500 pb-1">Waste vs Attend</span>
            </div>
          </div>
        </div>



        {/* Interactive Data Visualizations */}
        <div className={`space-y-8 print:space-y-6 ${isFetchingData ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity duration-300'}`}>
          {/* Production Section */}
          <section id="reports-production" className="print:break-inside-avoid bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-white">{t('reports.production.title')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportTableToCsv('reports-production', t('reports.production.title'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Excel / CSV
                </button>
                <button
                  onClick={() => exportSectionToPdf('reports-production', t('reports.production.pdfTitle'))}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                >
                  {t('reports.pdf')}
                </button>
              </div>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.production.indicator')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.production.plan')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.production.actual')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.production.deviation')}
                    </th>
                    <th className="px-4 py-4 text-center text-slate-300 font-medium">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {productionMetrics.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                      <td className="px-4 py-3 text-right text-slate-400">{row.plan}%</td>
                      <td className="px-4 py-3 text-right text-white font-semibold">{row.actual}%</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{
                        color: row.deviation >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {row.deviation >= 0 ? '+' : ''}{row.deviation}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          {row.deviation >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {t('reports.production.summary')
                .replace('{total}', totalLines.toString())
                .replace('{active}', activeLines.toString())
                .replace('{efficiency}', avgEfficiency.toString())}
            </div>
          </section>

          {/* Finished Goods Section */}
          <section id="reports-finished" className="print:break-inside-avoid bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-white">{t('reports.finishedGoods.title')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportTableToCsv('reports-finished', t('reports.finishedGoods.pdfTitle'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Excel / CSV
                </button>
                <button
                  onClick={() => exportSectionToPdf('reports-finished', t('reports.finishedGoods.pdfTitle'))}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                >
                  {t('reports.pdf')}
                </button>
              </div>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.finishedGoods.indicator')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.finishedGoods.value')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <tr className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{t('reports.finishedGoods.totalTypes')}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{finishedTotalTypes}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{t('reports.finishedGoods.totalQuantity')}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{finishedTotalQty}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{t('reports.finishedGoods.availableForSale')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">{finishedFree}</td>
                  </tr>
                  <tr className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{t('reports.finishedGoods.lowStock')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-500">{finishedLow}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Maintenance Section */}
          <section id="reports-maintenance" className="print:break-inside-avoid bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-white">{t('reports.maintenance.title')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportTableToCsv('reports-maintenance', t('reports.maintenance.title'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Excel / CSV
                </button>
                <button
                  onClick={() => exportSectionToPdf('reports-maintenance', t('reports.maintenance.title'))}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                >
                  {t('reports.pdf')}
                </button>
              </div>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.maintenance.line')}
                    </th>
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.maintenance.status')}
                    </th>
                    <th className="px-4 py-4 text-center text-slate-300 font-medium">
                      Impact on Production
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.maintenance.stops')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.maintenance.time')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {maintenanceSummaryLines.map((line, idx) => {
                    let impact = 'Low';
                    let impactColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                    if (line.minutes > 60) {
                      impact = 'High';
                      impactColor = 'text-red-400 bg-red-400/10 border-red-400/20';
                    } else if (line.minutes > 0) {
                      impact = 'Medium';
                      impactColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                    }
                    return (
                      <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{line.lineName}</td>
                        <td className="px-4 py-3 text-slate-300">
                          <span className="flex items-center gap-1.5">
                            {line.stops > 0 ? <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {line.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          <span className={`px-2 py-0.5 rounded-full border ${impactColor}`}>
                            {impact}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{line.stops}</td>
                        <td className="px-4 py-3 text-right text-white font-semibold">{line.minutes} min</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {t('reports.maintenance.summary')
                .replace('{total}', maintenanceTotalStops.toString())
                .replace('{problem}', maintenanceProblemLines.toString())
                .replace('{repair}', maintenanceInRepairLines.toString())}
            </div>
          </section>

          {/* Suppliers Section */}
          <section id="reports-suppliers" className="print:break-inside-avoid bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-white">{t('reports.suppliers.title')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportTableToCsv('reports-suppliers', t('reports.suppliers.title'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Excel / CSV
                </button>
                <button
                  onClick={() => exportSectionToPdf('reports-suppliers', t('reports.suppliers.title'))}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                >
                  {t('reports.pdf')}
                </button>
              </div>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.suppliers.supplier')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.suppliers.deliveries')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.suppliers.delayed')}
                    </th>
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.suppliers.lastDelivery')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {supplierReport.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{s.deliveries}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: s.delayed > 0 ? '#ef4444' : '#10b981' }}>{s.delayed}</td>
                      <td className="px-4 py-3 text-slate-400">{s.lastDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {t('reports.suppliers.summary')
                .replace('{total}', suppliersTotal.toString())
                .replace('{active}', suppliersActive.toString())
                .replace('{delayed}', suppliersDelayed.toString())}
            </div>
          </section>

          {/* QC Section */}
          <section id="reports-qc" className="print:break-inside-avoid bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-white">{t('reports.qc.title')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportTableToCsv('reports-qc', t('reports.qc.title'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Excel / CSV
                </button>
                <button
                  onClick={() => exportSectionToPdf('reports-qc', t('reports.qc.title'))}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                >
                  {t('reports.pdf')}
                </button>
              </div>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.qc.line')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.qc.defects')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.qc.rejected')}
                    </th>
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.qc.note')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {qcPerLineRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{row.line}</td>
                      <td className="px-4 py-3 text-right text-amber-500 font-semibold">{row.defects}</td>
                      <td className="px-4 py-3 text-right text-red-500 font-semibold">{row.rejected}</td>
                      <td className="px-4 py-3 text-slate-400">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              {t('reports.qc.summary')
                .replace('{total}', qcTotalDefects.toString())
                .replace('{rejected}', qcRejected.toString())}
            </div>
          </section>

          {/* HR Section */}
          <section id="reports-hr-stats" className="print:break-inside-avoid bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-white">{t('reports.hr.title')}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => exportTableToCsv('reports-hr-stats', t('reports.hr.title'))}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Excel / CSV
                </button>
                <button
                  onClick={() => exportSectionToPdf('reports-hr-stats', t('reports.hr.title'))}
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                >
                  {t('reports.pdf')}
                </button>
              </div>
            </div>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30">
              <div className="px-4 py-3 text-xs text-slate-400 bg-slate-800 border-b border-slate-700">
                {t('reports.hr.summary')
                  .replace('{total}', totalEmployees.toString())
                  .replace('{active}', activeEmployees.toString())}
              </div>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-4 text-left text-slate-300 font-medium">
                      {t('reports.hr.department')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.hr.employees')}
                    </th>
                    <th className="px-4 py-4 text-right text-slate-300 font-medium">
                      {t('reports.hr.openPositions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {Object.entries(employeesByDepartment).map(([dept, data]) => (
                    <tr key={dept} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{dept}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{data.total}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: data.open > 0 ? '#10b981' : '#slate-400' }}>{data.open}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>


    </div>
  );
}
