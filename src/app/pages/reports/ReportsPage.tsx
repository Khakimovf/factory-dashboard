import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { initialSuppliers } from '../suppliers/SuppliersPage';
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

export default function ReportsPage() {
  const { t } = useLanguage();
  const { productionLines = [] } = useFactory();
  const { finishedGoods = [] } = useWarehouse();
  const [range, setRange] = useState<Range>('daily');

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

  const inspections = initialInspections || [];
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

    return [
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
  }, [activeLines, avgEfficiency, totalLines]);

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

  const periodLabel =
    range === 'daily' ? 'Kunlik' : range === 'weekly' ? 'Haftalik' : 'Oylik';

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

  // ALWAYS render - never return null
  return (
    <div className="min-h-screen p-6 bg-background text-foreground">
      <div className="w-full">
        <div className="mb-8 flex items-start justify-between gap-6 print:flex-col">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Hisobotlar</h2>
            <p className="text-sm text-muted-foreground">
              {periodLabel} operatsion hisobot. Direktor va rahbariyat uchun qaror qabul qilishga mo‘ljallangan.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Sana: {new Date().toLocaleDateString('uz-UZ')} • Hisobot davri: {periodLabel} •
              Hisobot tizim tomonidan avtomatik generatsiya qilingan.
            </p>
          </div>
          <div className="flex items-center gap-4 print:hidden">
            <div className="inline-flex rounded-lg border border-border bg-card text-sm">
              <button
                className={`px-6 py-2.5 rounded-l-lg min-h-[46px] font-medium ${
                  range === 'daily'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                }`}
                onClick={() => setRange('daily')}
              >
                Kunlik
              </button>
              <button
                className={`px-6 py-2.5 min-h-[46px] font-medium ${
                  range === 'weekly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                }`}
                onClick={() => setRange('weekly')}
              >
                Haftalik
              </button>
              <button
                className={`px-6 py-2.5 rounded-r-lg min-h-[46px] font-medium ${
                  range === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground'
                }`}
                onClick={() => setRange('monthly')}
              >
                Oylik
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-sm font-medium print:hidden"
            >
              Chop etish
            </button>
          </div>
        </div>

        <div className="space-y-6 print:space-y-6">
          {/* Production Section */}
          <section id="reports-production" className="print:break-inside-avoid p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-foreground">Ishlab chiqarish</h3>
              <button
                onClick={() => exportSectionToPdf('reports-production', 'Ishlab chiqarish hisoboti')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                PDF
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Ko'rsatkich
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Reja
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Haqiqiy
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Og'ish
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productionMetrics.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-border px-4 py-2 text-foreground">{row.name}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{row.plan}%</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{row.actual}%</td>
                      <td className="border border-border px-4 py-2 text-right" style={{
                        color: row.deviation >= 0 ? 'var(--success)' : 'var(--destructive)'
                      }}>
                        {row.deviation >= 0 ? '+' : ''}{row.deviation}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Jami liniyalar: {totalLines} • Faol liniyalar: {activeLines} • O'rtacha samaradorlik: {avgEfficiency}%
            </div>
          </section>

          {/* Finished Goods Section */}
          <section id="reports-finished" className="print:break-inside-avoid p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-foreground">Tayyor mahsulotlar ombori</h3>
              <button
                onClick={() => exportSectionToPdf('reports-finished', 'Tayyor mahsulotlar hisoboti')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                PDF
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Ko'rsatkich
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Qiymat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Jami mahsulot turlari</td>
                    <td className="border border-border px-4 py-2 text-right text-foreground">{finishedTotalTypes}</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Jami miqdori</td>
                    <td className="border border-border px-4 py-2 text-right text-foreground">{finishedTotalQty}</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Sotish uchun mavjud</td>
                    <td className="border border-border px-4 py-2 text-right text-foreground">{finishedFree}</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2 text-foreground">Past zaxira (&lt; 10)</td>
                    <td className="border border-border px-4 py-2 text-right text-foreground">{finishedLow}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Maintenance Section */}
          <section id="reports-maintenance" className="print:break-inside-avoid p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-foreground">Ta'mirlash va texnik xizmat</h3>
              <button
                onClick={() => exportSectionToPdf('reports-maintenance', "Ta'mirlash va texnik xizmat")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                PDF
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Liniya
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Holat
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      To'xtashlar
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Vaqt (min)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceSummaryLines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="border border-border px-4 py-2 text-foreground">{line.lineName}</td>
                      <td className="border border-border px-4 py-2 text-foreground">{line.type}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{line.stops}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{line.minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Jami to'xtashlar: {maintenanceTotalStops} • Muammo bo'lgan liniyalar: {maintenanceProblemLines} • Ta'mirlashda: {maintenanceInRepairLines}
            </div>
          </section>

          {/* Suppliers Section */}
          <section id="reports-suppliers" className="print:break-inside-avoid p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-foreground">Ta'minotchilar bo'yicha xulosa</h3>
              <button
                onClick={() => exportSectionToPdf('reports-suppliers', "Ta'minotchilar bo'yicha xulosa")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                PDF
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Ta'minotchi
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Yetkazmalar
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Kechikishlar
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Oxirgi yetkazma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supplierReport.map((s, idx) => (
                    <tr key={idx}>
                      <td className="border border-border px-4 py-2 text-foreground">{s.name}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{s.deliveries}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{s.delayed}</td>
                      <td className="border border-border px-4 py-2 text-foreground">{s.lastDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Jami ta'minotchilar: {suppliersTotal} • Faol: {suppliersActive} • Kechikish bo'lgan: {suppliersDelayed}
            </div>
          </section>

          {/* QC Section */}
          <section id="reports-qc" className="print:break-inside-avoid p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-foreground">Sifat nazorati (QC) bo'yicha xulosa</h3>
              <button
                onClick={() => exportSectionToPdf('reports-qc', 'Sifat nazorati (QC) bo\'yicha xulosa')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                PDF
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Liniya
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Nuqsonlar
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Rad etilgan
                    </th>
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Eslatma
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {qcPerLineRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="border border-border px-4 py-2 text-foreground">{row.line}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{row.defects}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{row.rejected}</td>
                      <td className="border border-border px-4 py-2 text-foreground">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Jami nuqsonlar: {qcTotalDefects} • Rad etilgan: {qcRejected}
            </div>
          </section>

          {/* HR Section */}
          <section id="reports-hr-stats" className="print:break-inside-avoid p-6">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-xl font-semibold text-foreground">Kadrlar bo'limi - statistika</h3>
              <button
                onClick={() => exportSectionToPdf('reports-hr-stats', 'Kadrlar bo\'limi - statistika')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                PDF
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 text-xs text-muted-foreground">
                Jami xodimlar: {totalEmployees} • Ishlayotgan xodimlar: {activeEmployees}.
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-3 text-left text-foreground font-semibold">
                      Bo'lim
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Xodimlar soni
                    </th>
                    <th className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                      Bo'sh o'rinlar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(employeesByDepartment).map(([dept, data]) => (
                    <tr key={dept}>
                      <td className="border border-border px-4 py-2 text-foreground">{dept}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{data.total}</td>
                      <td className="border border-border px-4 py-2 text-right text-foreground">{data.open}</td>
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
