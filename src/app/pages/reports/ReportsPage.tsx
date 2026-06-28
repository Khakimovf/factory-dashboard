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

  // Waybill Verification Engine Mock Database
  const mockWaybills = useMemo(() => [
    {
      id: 'INV-2026-0617-004',
      buyerName: 'Toshkent Qurilish Invest',
      driverName: 'Abduvaliyev Farhod',
      truckPlate: '01 A 777 AA',
      powerOfAttorney: 'D-582910',
      grossValue: 39200000,
      vatRate: 12,
      vatAmount: 4200000,
      items: [
        { name: 'Steel Sheets (Po\'lat listlar)', qty: 200, unit: 'dona', price: 85000 },
        { name: 'Aluminum Rods (Alyumin prutlar)', qty: 150, unit: 'dona', price: 120000 }
      ]
    },
    {
      id: 'INV-2026-0617-001',
      buyerName: 'Navoiy Azot AJ',
      driverName: 'Rustamov Jasur',
      truckPlate: '01 A 123 AA',
      powerOfAttorney: 'QA-882901',
      grossValue: 16240000,
      vatRate: 12,
      vatAmount: 1740000,
      items: [
        { name: 'Steel Sheets (Po\'lat listlar)', qty: 100, unit: 'dona', price: 85000 },
        { name: 'Aluminum Rods (Alyumin prutlar)', qty: 50, unit: 'dona', price: 120000 }
      ]
    },
    {
      id: 'INV-2026-0617-007',
      buyerName: 'Samarkand EuroStroy',
      driverName: 'Karimov Sherzod',
      truckPlate: '30 B 999 BB',
      powerOfAttorney: 'S-112233',
      grossValue: 4760000,
      vatRate: 12,
      vatAmount: 510000,
      items: [
        { name: 'Steel Sheets (Po\'lat listlar)', qty: 50, unit: 'dona', price: 85000 }
      ]
    }
  ], []);

  // State Controllers for Waybill Verification
  const [activeReportTab, setActiveReportTab] = useState<string>('ALL');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('INV-2026-0617-004');
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [paperInvoice, setPaperInvoice] = useState({
    driverName: '',
    truckPlate: '',
    powerOfAttorney: '',
    grossValue: 0
  });
  const [verificationResult, setVerificationResult] = useState<{ isMatch: boolean } | null>(null);

  // Initialize selected waybill on mount or reset search query
  useEffect(() => {
    const defaultWb = mockWaybills.find(w => w.id === invoiceSearchQuery);
    if (defaultWb) {
      setActiveInvoice(defaultWb);
      setPaperInvoice({
        driverName: defaultWb.driverName,
        truckPlate: defaultWb.truckPlate,
        powerOfAttorney: defaultWb.powerOfAttorney,
        grossValue: defaultWb.grossValue
      });
      setVerificationResult({ isMatch: true });
    }
  }, [mockWaybills]);

  const handleExecuteVerification = () => {
    const wb = mockWaybills.find(w => w.id.toUpperCase() === invoiceSearchQuery.trim().toUpperCase());
    if (wb) {
      setActiveInvoice(wb);
      const isMatch =
        paperInvoice.driverName.trim() === wb.driverName.trim() &&
        paperInvoice.truckPlate.trim() === wb.truckPlate.trim() &&
        paperInvoice.powerOfAttorney.trim() === wb.powerOfAttorney.trim() &&
        Number(paperInvoice.grossValue) === Number(wb.grossValue);
      setVerificationResult({ isMatch });
    } else {
      setActiveInvoice(null);
      setVerificationResult(null);
    }
  };

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
                  value={activeReportTab}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActiveReportTab(val);
                    if (val === 'ALL') {
                      setSelectedDepartments(['Assembly A', 'Assembly B', 'Warehouse', 'Canteen', 'Maintenance']);
                    } else if (val === 'Assembly') {
                      setSelectedDepartments(['Assembly A', 'Assembly B']);
                    } else if (val === 'Warehouse') {
                      setSelectedDepartments(['Warehouse']);
                    } else if (val === 'Maintenance') {
                      setSelectedDepartments(['Maintenance']);
                    } else {
                      setSelectedDepartments([val]);
                    }
                  }}
                  className="appearance-none bg-slate-900 border border-slate-700 text-white text-sm font-semibold rounded-lg px-4 py-3.5 pr-10 w-full outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="ALL">Barcha Bo'limlar</option>
                  <option value="Assembly">Ishlab chiqarish bo'limi</option>
                  <option value="Warehouse">Tayyor mahsulotlar ombori</option>
                  <option value="Maintenance">Ta'mirlash bo'limi</option>
                  <option value="Suppliers">Ta'minotchilar</option>
                  <option value="QC">Sifat nazorati (QC)</option>
                  <option value="HR">Kadrlar bo'limi</option>
                  <option value="WaybillVerification">🚚 Yuk xatlari auditi</option>
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
        {activeReportTab !== 'WaybillVerification' && (
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
        )}

        {/* Interactive Data Visualizations */}
        <div className={`space-y-8 print:space-y-6 ${isFetchingData ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity duration-300'}`}>
          {/* Waybill Verification Engine (1x1 Cross-Checking Vault) */}
          {activeReportTab === 'WaybillVerification' && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <FileText className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-xl font-bold text-white">🚚 Yuk xatlari auditi & Faktura solishtirish</h3>
                  <p className="text-xs text-slate-400 font-medium">Tizimdagi raqamli haqiqiy nusxa bilan qog'ozli hujjatni 1x1 solishtirish va verifikatsiya qilish tizimi.</p>
                </div>
              </div>

              {/* Top Control Strip */}
              <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-lg">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Tasdiqlash uchun nakladnaya raqamini kiriting (e.g., INV-2026-0617-004)..."
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-750 rounded-lg text-white font-semibold outline-none focus:border-indigo-500 shadow-inner"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    🔍
                  </div>
                </div>
                <button
                  onClick={handleExecuteVerification}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-indigo-900/20"
                >
                  🛡️ TIZIM BILAN SOLISHTIRISH
                </button>
              </div>

              {/* Integrity / Discrepancy Banners */}
              {verificationResult && (
                <div className={`p-4 rounded-lg border font-bold text-sm flex items-center gap-3 animate-pulse ${
                  verificationResult.isMatch
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {verificationResult.isMatch ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>🟢 INTEGRITY VERIFIED: Tizimdagi hujjat qog'ozli nusxa bilan 1x1 mos keldi (Imzolashga ruxsat berilgan).</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      <span>🔴 DISCREPANCY DETECTED: Ma'lumotlarda tafovut aniqlandi! Asl nusxa o'zgartirilgan bo'lishi mumkin.</span>
                    </>
                  )}
                </div>
              )}

              {/* Symmetrical Double Panel Preview */}
              {activeInvoice ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                  {/* Left Pane - Qog'ozdagi Hujjat Parametrlari */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6 w-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">📄 Qog'ozdagi Hujjat Parametrlari</h4>
                        <p className="text-xs text-slate-500">Qog'oz ko'rinishidagi yuk xatidan olingan ma'lumotlarni kiriting.</p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Haydovchi F.I.SH</label>
                          <input
                            type="text"
                            value={paperInvoice.driverName}
                            onChange={(e) => setPaperInvoice(prev => ({ ...prev, driverName: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Avtomobil Davlat Raqami</label>
                          <input
                            type="text"
                            value={paperInvoice.truckPlate}
                            onChange={(e) => setPaperInvoice(prev => ({ ...prev, truckPlate: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Doverennost Serial No (Ishonchnoma)</label>
                          <input
                            type="text"
                            value={paperInvoice.powerOfAttorney}
                            onChange={(e) => setPaperInvoice(prev => ({ ...prev, powerOfAttorney: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Umumiy Qiymat (UZS, 12% QQS bilan)</label>
                          <input
                            type="number"
                            value={paperInvoice.grossValue}
                            onChange={(e) => setPaperInvoice(prev => ({ ...prev, grossValue: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-medium outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-lg text-xs text-slate-400 leading-relaxed mt-6">
                      💡 <strong>Sinov Rejimi:</strong> Qog'ozdagi qiymatlarni o'zgartiring va <strong>🛡️ TIZIM BILAN SOLISHTIRISH</strong> tugmasini bosib verifikatsiyaning tafovut aniqlash mexanizmini tekshiring.
                    </div>
                  </div>

                  {/* Right Pane - Tizimdagi Haqiqiy Nusxa (1x1 Replica) */}
                  <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[500px] w-full">
                    {/* Invoice Replica Layout */}
                    <div className="space-y-4 text-xs text-slate-300">
                      <div className="flex justify-between items-start border-b border-slate-700/60 pb-3">
                        <div>
                          <p className="font-bold text-white text-base">SCHOT-FAKTURA (Hisob-faktura)</p>
                          <p className="text-slate-400 font-semibold mt-0.5">Raqam: {activeInvoice.id}</p>
                          <p className="text-[10px] text-slate-500">Sana: 17.06.2026</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ASL NUSXA (ORIGINAL)</Badge>
                          <p className="text-[10px] text-slate-500 mt-1">Status: TIZIMDA TASDIQLANGAN</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] border-b border-slate-700/60 pb-3">
                        <div>
                          <p className="text-slate-400 font-semibold uppercase">Yetkazib beruvchi (Seller)</p>
                          <p className="font-bold text-white mt-1">FACTORY DASHBOARD LLC</p>
                          <p className="text-slate-400">STIR: 301294821</p>
                          <p className="text-slate-400">Manzil: Toshkent sh., Chilonzor t.</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-semibold uppercase">Sotib oluvchi (Buyer)</p>
                          <p className="font-bold text-white mt-1">{activeInvoice.buyerName}</p>
                          <p className="text-slate-400">STIR: 204918239</p>
                          <p className="text-slate-400">Manzil: O'zbekiston Respublikasi</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Yuk tashish parametrlari (Shipping details)</p>
                        <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-2.5 border border-slate-800 rounded">
                          <div>
                            <span className="text-slate-500">Haydovchi:</span> <strong className="text-slate-200">{activeInvoice.driverName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Avto Raqami:</span> <strong className="text-slate-200">{activeInvoice.truckPlate}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Ishonchnoma:</span> <strong className="text-slate-200">{activeInvoice.powerOfAttorney}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">QQS stavkasi:</span> <strong className="text-slate-200">{activeInvoice.vatRate}%</strong>
                          </div>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="border border-slate-850 rounded overflow-hidden">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                              <th className="p-2">Material nomi</th>
                              <th className="p-2 text-right">Miqdori</th>
                              <th className="p-2 text-right">Narxi (QQS-siz)</th>
                              <th className="p-2 text-right">QQS (12%)</th>
                              <th className="p-2 text-right">Jami</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {activeInvoice.items.map((it: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-800/10">
                                <td className="p-2 font-medium text-white">{it.name}</td>
                                <td className="p-2 text-right text-slate-300">{it.qty} {it.unit}</td>
                                <td className="p-2 text-right text-slate-300">{it.price.toLocaleString()} UZS</td>
                                <td className="p-2 text-right text-slate-300">{(it.price * it.qty * 0.12).toLocaleString()} UZS</td>
                                <td className="p-2 text-right text-white font-medium">{(it.price * it.qty * 1.12).toLocaleString()} UZS</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Invoice Summary and QR Code */}
                    <div className="border-t border-slate-700/60 pt-3 mt-4 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Hisoblangan Jami Summa</p>
                        <p className="text-lg font-black text-indigo-400 mt-1">{activeInvoice.grossValue.toLocaleString()} UZS</p>
                        <p className="text-[9px] text-slate-500">Shundan QQS (12%): {activeInvoice.vatAmount.toLocaleString()} UZS</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded">
                        <div className="w-12 h-12 bg-white flex items-center justify-center p-0.5">
                          <div className="w-full h-full bg-slate-950" style={{
                            backgroundImage: 'radial-gradient(#fff 2px, transparent 0)',
                            backgroundSize: '4px 4px'
                          }} />
                        </div>
                        <div className="text-[9px] text-slate-500 leading-tight">
                          <p className="text-slate-400 font-bold">SOLIQ.UZ</p>
                          <p>Faktura ID: f-{activeInvoice.id.toLowerCase()}</p>
                          <p className="text-emerald-400 font-medium">Tekshirildi</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-900/20 border border-slate-800 border-dashed rounded-xl">
                  Nakladnaya raqami topilmadi. INV-2026-0617-004 yoki INV-2026-0617-001 deb qidirib ko'ring.
                </div>
              )}
            </div>
          )}

          {/* Production Section */}
          {(activeReportTab === 'ALL' || activeReportTab === 'Assembly') && (
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
          )}

          {/* Finished Goods Section */}
          {(activeReportTab === 'ALL' || activeReportTab === 'Warehouse') && (
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
          )}

          {/* Maintenance Section */}
          {(activeReportTab === 'ALL' || activeReportTab === 'Maintenance') && (
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
          )}

          {/* Suppliers Section */}
          {(activeReportTab === 'ALL' || activeReportTab === 'Suppliers') && (
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
          )}

          {/* QC Section */}
          {(activeReportTab === 'ALL' || activeReportTab === 'QC') && (
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
          )}

          {/* HR Section */}
          {(activeReportTab === 'ALL' || activeReportTab === 'HR') && (
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
          )}
        </div>
      </div>
    </div>
  );
}
