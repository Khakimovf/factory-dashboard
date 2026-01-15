import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { Button } from '../../components/ui/button';
import { initialFinishedProducts } from '../finished-goods/FinishedGoodsPage';
import { initialSuppliers, } from '../suppliers/SuppliersPage';
import { EnhancedSupplier, generateMockDeliveryHistory } from '../../services/supplierService';
import { initialInspections } from '../qc/QualityControlPage';
import { hrEmployees } from '../../data/hrEmployees';

type Range = 'daily' | 'weekly' | 'monthly';

interface MetricRow {
  name: string;
  plan: number;
  actual: number;
  deviation: number;
}

export function ReportsPage() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const [range, setRange] = useState<Range>('daily');

  const totalLines = productionLines.length;
  const activeLines = productionLines.filter(l => l.status === 'active').length;
  const avgEfficiency =
    productionLines.length > 0
      ? Math.round(
          productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length,
        )
      : 0;

  const finishedTotalTypes = initialFinishedProducts.length;
  const finishedTotalQty = initialFinishedProducts.reduce((sum, p) => sum + p.quantity, 0);
  const finishedFree = initialFinishedProducts.filter(p => p.status === 'in_stock').length;
  const finishedLow = initialFinishedProducts.filter(p => p.quantity <= p.minStock).length;

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
          ? 'Normal'
          : status === 'ISSUE_REPORTED'
          ? 'Nosozlik qayd etilgan'
          : 'Taʼmirlash jarayonida';
      return {
        lineName: line.name.replace('Assembly Line ', 'Line '),
        type,
        stops,
        minutes,
      };
    });

  const maintenanceTotalStops = maintenanceSummaryLines.reduce((sum, l) => sum + l.stops, 0);
  const maintenanceProblemLines = maintenanceSummaryLines.filter(l => l.stops > 0).length;
  const maintenanceInRepairLines = maintenanceSummaryLines.filter(l => l.type.includes('Taʼmirlash')).length;

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

  const inspections = initialInspections;
  const qcTotalDefects = inspections.reduce((sum, i) => sum + i.totalDefects, 0);
  const qcRejected = inspections.filter(i => i.status === 'rejected').length;

  const qcByLine = inspections.reduce<Record<string, { defects: number; rejected: number }>>(
    (acc, i) => {
      const key = i.lineName;
      if (!acc[key]) acc[key] = { defects: 0, rejected: 0 };
      acc[key].defects += i.totalDefects;
      if (i.status === 'rejected') acc[key].rejected += 1;
      return acc;
    },
    {},
  );

  const qcWorstLine = Object.entries(qcByLine).reduce(
    (best, [line, data]) => (data.defects > best.defects ? { line, defects: data.defects } : best),
    { line: '-', defects: -1 },
  );

  const qcPerLineRows = Object.entries(qcByLine).map(([line, data]) => ({
    line,
    defects: data.defects,
    rejected: data.rejected,
    note: data.defects === qcWorstLine.defects ? 'Asosiy muammo liniyasi' : '',
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
    const activeShare = totalLines > 0 ? (activeLines / totalLines) * 100 : 0;
    const activePlan = 100;

    const effPlan = 90;

    const rows: MetricRow[] = [
      {
        name: 'Faol liniyalar ulushi (%)',
        plan: activePlan,
        actual: Math.round(activeShare),
        deviation: Math.round(activeShare) - activePlan,
      },
      {
        name: 'O‘rtacha samaradorlik (%)',
        plan: effPlan,
        actual: avgEfficiency,
        deviation: avgEfficiency - effPlan,
      },
    ];

    return rows;
  }, [activeLines, avgEfficiency, totalLines]);

  const hrMetrics: MetricRow[] = useMemo(() => {
    const planPending = 0;
    const actualPending = 0; // Workflow holatini hisobga olmaymiz
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

  const handlePrint = () => {
    window.print();
  };

  const periodLabel =
    range === 'daily' ? 'Kunlik' : range === 'weekly' ? 'Haftalik' : 'Oylik';

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
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 12px; color: #000; margin: 16px; }
      h2, h3 { margin: 0 0 8px 0; font-weight: 600; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
      th { background: #f3f4f6; }
      p { margin: 4px 0; }
    </style>
  </head>
  <body>
    <h2>${title}</h2>
    <p>Davr: ${periodLabel} • Sana: ${new Date().toLocaleDateString('uz-UZ')}</p>
    ${section.innerHTML}
  </body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50 print:bg-white print:text-black overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-8">
        <div className="mb-8 flex items-start justify-between gap-6 print:flex-col">
          <div>
            <h2 className="text-3xl font-semibold">Hisobotlar</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {periodLabel} operatsion hisobot. Direktor va rahbariyat uchun qaror qabul qilishga mo‘ljallangan.
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Sana: {new Date().toLocaleDateString('uz-UZ')} • Hisobot davri: {periodLabel} •
              Hisobot tizim tomonidan avtomatik generatsiya qilingan.
            </p>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
              <button
                className={`px-6 py-2.5 rounded-l-lg min-h-[46px] font-medium ${
                  range === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setRange('daily')}
              >
                Kunlik
              </button>
              <button
                className={`px-6 py-2.5 min-h-[46px] font-medium ${
                  range === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setRange('weekly')}
              >
                Haftalik
              </button>
              <button
                className={`px-6 py-2.5 rounded-r-lg min-h-[46px] font-medium ${
                  range === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setRange('monthly')}
              >
                Oylik
              </button>
            </div>
            <Button
              onClick={handlePrint}
              className="h-11 px-6 text-sm font-semibold"
            >
              PDF / Chop etish
            </Button>
          </div>
        </div>

        <section className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:border-black/10">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 print:border-black/10">
            <h3 className="text-base font-semibold">Kunlik umumiy xulosa</h3>
          </div>
          <div className="px-4 py-3 space-y-1 text-sm">
            <p>
              Ishlab chiqarish va HR bo‘yicha asosiy ko‘rsatkichlar baholandi. Quyidagi bo‘limlarda reja va fakt
              solishtirilib, og‘ishlar ko‘rsatildi.
            </p>
            <p>
              Asosiy eʼtibor ishlab chiqarish samaradorligi va tayyor mahsulot ombori holatiga qaratilishi lozim.
            </p>
            <p>
              Tavsiya etilgan harakat: bo‘lim rahbarlari bilan qisqa yig‘ilish o‘tkazib, og‘ishlar sabablarini
              muhokama qilish.
            </p>
          </div>
        </section>

        <div className="space-y-6 text-sm leading-relaxed print:text-xs">
          <section
            id="reports-production"
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">
                  1. Ishlab chiqarish holati
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Liniyalar faoliyati va samaradorlik reja bilan solishtirildi.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
                  Davr: {periodLabel}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="print:hidden text-xs px-4 py-2 h-11 font-medium"
                  onClick={() => exportSectionToPdf('reports-production', 'Ishlab chiqarish holati')}
                >
                  ⬇ Yuklab olish
                </Button>
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Ko‘rsatkich
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Reja
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Fakt
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Og‘ish (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {productionMetrics.map(row => (
                  <tr key={row.name}>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {row.name}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {row.plan.toFixed(1)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {row.actual.toFixed(1)}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {row.deviation.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
              Ishlab chiqarish bo‘yicha asosiy ko‘rsatkichlar reja bilan solishtirilib baholandi. Og‘ishi yuqori
              bo‘lgan ko‘rsatkichlar bo‘yicha choralar yig‘ilishda ko‘rib chiqilishi lozim.
            </div>
          </section>

          <section
          id="reports-hr"
          className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
        >
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">2. HR va hujjatlar holati</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Kadrlar bo‘limi hujjatlari va ishchi resurslari bo‘yicha yuqori darajadagi ko‘rsatkichlar.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="print:hidden text-xs px-4 py-2 h-11 font-medium"
              onClick={() => exportSectionToPdf('reports-hr', 'HR va hujjatlar holati')}
            >
              ⬇ Yuklab olish
            </Button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                  Ko‘rsatkich
                </th>
                <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                  Reja
                </th>
                <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                  Fakt
                </th>
                <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                  Og‘ish
                </th>
              </tr>
            </thead>
            <tbody>
              {hrMetrics.map(row => (
                <tr key={row.name}>
                  <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                    {row.name}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    {row.plan}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    {row.actual}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    {row.deviation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
            Bu bo‘lim faqat statistik ko‘rinish uchun. HR jarayonlari va ichki ish tartibi alohida modullarda yuritiladi.
          </div>
        </section>

          <section
            id="reports-finished-goods"
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">3. Tayyor mahsulotlar ombori</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Tayyor mahsulotlar qoldig‘i va kam zaxira xavfi bo‘yicha qisqa hisobot.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden text-xs px-3 py-1.5"
                onClick={() =>
                  exportSectionToPdf('reports-finished-goods', 'Tayyor mahsulotlar ombori')
                }
              >
                ⬇ Yuklab olish
              </Button>
            </div>
            <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
              Umumiy mahsulot turlari: {finishedTotalTypes} • Ombordagi jami miqdor: {finishedTotalQty} dona • Erkin
              qoldiq: {finishedFree} tur • Kam qoldiq xavfi: {finishedLow} tur.
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Mahsulot turi
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Jami miqdor
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Erkin qoldiq
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Kam qoldiq
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialFinishedProducts.map(p => (
                  <tr key={p.id}>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {p.productName}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {p.quantity}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {p.status === 'in_stock' ? p.quantity : 0}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {p.quantity <= p.minStock ? 1 : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            id="reports-maintenance"
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">4. Ta&apos;mirlash va texnik xizmat</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Liniyalar bo‘yicha qayd etilgan texnik xizmat va to‘xtashlar haqida qisqa ma’lumot.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden text-xs px-3 py-1.5"
                onClick={() =>
                  exportSectionToPdf('reports-maintenance', "Ta'mirlash va texnik xizmat")
                }
              >
                ⬇ Yuklab olish
              </Button>
            </div>
            <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
              Jami to‘xtashlar soni (hisobot uchun shartli hisob): {maintenanceTotalStops} • Muammo bo‘lgan liniyalar:{' '}
              {maintenanceProblemLines} • Ta’mirlashda bo‘lgan liniyalar: {maintenanceInRepairLines}.
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Liniya
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Muammo turi
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    To‘xtashlar soni
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Umumiy vaqt (daq)
                  </th>
                </tr>
              </thead>
              <tbody>
                {maintenanceSummaryLines.map(l => (
                  <tr key={l.lineName}>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {l.lineName}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {l.type}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {l.stops}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {l.minutes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            id="reports-suppliers"
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">5. Ta’minotchilar bo‘yicha xulosa</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Ta’minotchilar holati va kechikkan yetkazib berishlar haqida umumiy ma’lumot.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden text-xs px-3 py-1.5"
                onClick={() =>
                  exportSectionToPdf('reports-suppliers', "Ta'minotchilar bo‘yicha xulosa")
                }
              >
                ⬇ Yuklab olish
              </Button>
            </div>
            <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
              Jami ta’minotchilar: {suppliersTotal} • Faol ta’minotchilar: {suppliersActive} • Kechikkan yetkazib
              berishlar qayd etilgan ta’minotchilar: {suppliersDelayed}.
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Ta’minotchi
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Yetkazib berishlar
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Kechikishlar
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Oxirgi sana
                  </th>
                </tr>
              </thead>
              <tbody>
                {supplierReport.map(r => (
                  <tr key={r.name}>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {r.name}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {r.deliveries}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {r.delayed}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {r.lastDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            id="reports-qc"
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">6. Sifat nazorati (QC) bo‘yicha xulosa</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Nuqsonlar va rad etilgan partiyalar bo‘yicha statistik ma’lumot.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden text-xs px-3 py-1.5"
                onClick={() =>
                  exportSectionToPdf('reports-qc', 'Sifat nazorati (QC) bo‘yicha xulosa')
                }
              >
                ⬇ Yuklab olish
              </Button>
            </div>
            <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
              Jami aniqlangan nuqsonlar: {qcTotalDefects} • Rad etilgan partiyalar: {qcRejected} • Eng ko‘p nuqson
              chiqqan liniya: {qcWorstLine.line}.
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Liniya
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Nuqsonlar soni
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Rad partiyalar
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Izoh
                  </th>
                </tr>
              </thead>
              <tbody>
                {qcPerLineRows.map(r => (
                  <tr key={r.line}>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {r.line}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {r.defects}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {r.rejected}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {r.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section
            id="reports-hr-stats"
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 print:bg-white print:border-black/10 break-inside-avoid-page"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 print:border-black/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">7. Kadrlar bo‘limi – statistika</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Faqat xodimlar soni va bo‘sh ish o‘rinlari bo‘yicha rasmiy ko‘rsatkichlar.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="print:hidden text-xs px-3 py-1.5"
                onClick={() =>
                  exportSectionToPdf('reports-hr-stats', 'Kadrlar bo‘limi – statistika')
                }
              >
                ⬇ Yuklab olish
              </Button>
            </div>
            <div className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
              Jami xodimlar: {totalEmployees} • Ishlayotgan xodimlar: {activeEmployees}.
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/40 print:bg-gray-100">
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-left">
                    Bo‘lim
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Xodimlar soni
                  </th>
                  <th className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                    Bo‘sh o‘rinlar
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(employeesByDepartment).map(([dept, data]) => (
                  <tr key={dept}>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2">
                      {dept}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {data.total}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-700 print:border-black/10 px-3 py-2 text-right">
                      {data.open}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;

