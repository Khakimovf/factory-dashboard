import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../ui/table';
import {
  BarChart3, RefreshCw, Download, ShieldCheck, AlertTriangle,
  Layers, ArrowUpRight, CheckCircle2, FileSpreadsheet, Lock, Unlock, FileText, X
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Core mock dataset representing the factory catalog items
const INVENTORY_BALANCES_DB = [
  { sku: "26211286", name: "Door Trim Inner Panel Left", unit: "шт", inbound: 2150, raw_wh: 450, wip_line: 800, finished_wh: 500, exported: 400, discrepancy: 0 },
  { sku: "26211284", name: "Door Trim Inner Panel Right", unit: "шт", inbound: 1680, raw_wh: 380, wip_line: 200, finished_wh: 750, exported: 350, discrepancy: 0 },
  { sku: "26211277", name: "Front Bumper Support Bracket", unit: "шт", inbound: 750, raw_wh: 150, wip_line: 0, finished_wh: 0, exported: 600, discrepancy: 0 },
  { sku: "26211281", name: "Rear Pillar Trim Assembly", unit: "шт", inbound: 500, raw_wh: 85, wip_line: 15, finished_wh: 0, exported: 400, discrepancy: 0 },
  { sku: "13536589", name: "M6 Hexagonal Flange Bolt", unit: "шт", inbound: 65000, raw_wh: 15000, wip_line: 15000, finished_wh: 0, exported: 35000, discrepancy: 0 },
  { sku: "13555291", name: "Plastic Clip Fastener Type-B", unit: "шт", inbound: 21000, raw_wh: 8500, wip_line: 500, finished_wh: 0, exported: 12000, discrepancy: 0 }
];

export function InventoryReconciliationDashboard() {
  const [auditInterval, setAuditInterval] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [selectedDivision, setSelectedDivision] = useState<'ALL' | 'WAREHOUSE' | 'TPA' | 'ASSEMBLY' | 'FINISHED' | 'SALES'>('ALL');
  const [breakdownCell, setBreakdownCell] = useState<{
    sku: string;
    name: string;
    category: 'raw' | 'wip' | 'finished' | 'exported';
    total: number;
    partA: number;
    partB: number;
    labelA: string;
    labelB: string;
  } | null>(null);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Physical manual inputs state
  // Key format: `${sku}_${category}`
  const [physicalInputs, setPhysicalInputs] = useState<Record<string, string>>({});

  // Virtual state logs representing system records
  const [virtualStock, setVirtualStock] = useState(INVENTORY_BALANCES_DB);

  // Filter items based on search query
  const filteredStock = useMemo(() => {
    return virtualStock.filter(item =>
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [virtualStock, searchQuery]);

  // Compute calculated discrepancy (Δ) for each row
  // Farq / Delta (Δ) = virtual total - physical total (during audit locks) or virtual mass-balance discrepancy
  const processedData = useMemo(() => {
    return filteredStock.map(row => {
      // System total virtual stock + exported
      const virtualSum = row.raw_wh + row.wip_line + row.finished_wh + row.exported;
      
      // Calculate virtual mass-balance discrepancy (should be 0 by default)
      const systemDiscrepancy = row.inbound - virtualSum;

      // Extract physical manual entries if entered
      const physRaw = physicalInputs[`${row.sku}_raw`] !== undefined ? parseInt(physicalInputs[`${row.sku}_raw`]) : row.raw_wh;
      const physWip = physicalInputs[`${row.sku}_wip`] !== undefined ? parseInt(physicalInputs[`${row.sku}_wip`]) : row.wip_line;
      const physFinished = physicalInputs[`${row.sku}_finished`] !== undefined ? parseInt(physicalInputs[`${row.sku}_finished`]) : row.finished_wh;
      const physExported = physicalInputs[`${row.sku}_exported`] !== undefined ? parseInt(physicalInputs[`${row.sku}_exported`]) : row.exported;

      const physicalSum = (isNaN(physRaw) ? 0 : physRaw) + 
                          (isNaN(physWip) ? 0 : physWip) + 
                          (isNaN(physFinished) ? 0 : physFinished) + 
                          (isNaN(physExported) ? 0 : physExported);

      // Delta (Δ) = Inbound - (Physical Sum) in Audit mode, or systemDiscrepancy in standard mode
      const delta = isAuditMode ? (row.inbound - physicalSum) : systemDiscrepancy;

      return {
        ...row,
        systemDiscrepancy,
        physicalSum,
        delta,
        physRaw: isNaN(physRaw) ? 0 : physRaw,
        physWip: isNaN(physWip) ? 0 : physWip,
        physFinished: isNaN(physFinished) ? 0 : physFinished,
        physExported: isNaN(physExported) ? 0 : physExported,
      };
    });
  }, [filteredStock, physicalInputs, isAuditMode]);

  // Aggregate statistics for KPIs
  const kpis = useMemo(() => {
    let totalInbound = 0;
    let totalRaw = 0;
    let totalRawA = 0;
    let totalRawB = 0;
    let totalWip = 0;
    let totalWipTpa = 0;
    let totalWipAssembly = 0;
    let totalFinished = 0;
    let totalFinishedFg = 0;
    let totalFinishedQc = 0;
    let totalExported = 0;
    let totalExportedSales = 0;
    let totalExportedLogistics = 0;
    let totalDelta = 0;

    processedData.forEach(row => {
      totalInbound += row.inbound;
      
      const raw = isAuditMode ? row.physRaw : row.raw_wh;
      totalRaw += raw;
      totalRawA += Math.round(raw * 0.6);
      totalRawB += raw - Math.round(raw * 0.6);

      const wip = isAuditMode ? row.physWip : row.wip_line;
      totalWip += wip;
      totalWipTpa += Math.round(wip * 0.4);
      totalWipAssembly += wip - Math.round(wip * 0.4);

      const fg = isAuditMode ? row.physFinished : row.finished_wh;
      totalFinished += fg;
      totalFinishedFg += Math.round(fg * 0.7);
      totalFinishedQc += fg - Math.round(fg * 0.7);

      const exp = isAuditMode ? row.physExported : row.exported;
      totalExported += exp;
      totalExportedSales += Math.round(exp * 0.5);
      totalExportedLogistics += exp - Math.round(exp * 0.5);

      totalDelta += Math.abs(row.delta);
    });

    const complianceRate = totalInbound > 0 ? Math.max(0, (1 - (totalDelta / totalInbound)) * 100) : 100;

    return {
      totalInbound,
      totalRaw,
      totalRawA,
      totalRawB,
      totalWip,
      totalWipTpa,
      totalWipAssembly,
      totalFinished,
      totalFinishedFg,
      totalFinishedQc,
      totalExported,
      totalExportedSales,
      totalExportedLogistics,
      totalDelta,
      complianceRate: complianceRate.toFixed(2)
    };
  }, [processedData, isAuditMode]);

  // Dynamic metrics based on selected division
  const activeMetrics = useMemo(() => {
    switch (selectedDivision) {
      case 'WAREHOUSE':
        return [
          { label: 'KIRIM (INBOUND)', value: kpis.totalInbound, sub: 'Jami', color: 'text-white' },
          { label: 'SECTOR ACTIVE STOCK', value: kpis.totalRaw, sub: 'Xomashyo Qoldiq', color: 'text-slate-300' },
          { label: 'OMBOR A (WH-A)', value: kpis.totalRawA, sub: '60% Ulush', color: 'text-blue-400' },
          { label: 'OMBOR B (WH-B)', value: kpis.totalRawB, sub: '40% Ulush', color: 'text-sky-400' },
          { label: 'SECTOR DISCREPANCY', value: Math.round(kpis.totalDelta * 0.4), sub: 'Taxminiy farq', color: 'text-rose-400' },
          { label: 'BALANS HOLATI', value: `${kpis.complianceRate}%`, sub: 'Ishonchlilik', color: 'text-emerald-400' },
        ];
      case 'TPA':
        return [
          { label: 'INBOUND ALLOCATION', value: Math.round(kpis.totalInbound * 0.4), sub: '40% Ulush', color: 'text-white' },
          { label: 'SECTOR ACTIVE WIP', value: kpis.totalWipTpa, sub: 'TPA Qoldiq', color: 'text-slate-300' },
          { label: 'TPA SEXI WIP (WIP A)', value: kpis.totalWipTpa, sub: 'TPA Qoldiq', color: 'text-yellow-500' },
          { label: 'ASSEMBLY WIP (WIP B)', value: kpis.totalWipAssembly, sub: 'Yig\'uv Qoldiq', color: 'text-yellow-600' },
          { label: 'SECTOR DISCREPANCY', value: Math.round(kpis.totalDelta * 0.3), sub: 'Taxminiy farq', color: 'text-rose-400' },
          { label: 'BALANS HOLATI', value: `${kpis.complianceRate}%`, sub: 'Ishonchlilik', color: 'text-emerald-400' },
        ];
      case 'ASSEMBLY':
        return [
          { label: 'INBOUND ALLOCATION', value: Math.round(kpis.totalInbound * 0.6), sub: '60% Ulush', color: 'text-white' },
          { label: 'SECTOR ACTIVE WIP', value: kpis.totalWipAssembly, sub: 'Yig\'uv Qoldiq', color: 'text-slate-300' },
          { label: 'ASSEMBLY TRACK (WIP B)', value: kpis.totalWipAssembly, sub: 'Yig\'uv Liniya', color: 'text-yellow-500' },
          { label: 'TPA SEXI WIP (WIP A)', value: kpis.totalWipTpa, sub: 'TPA Qoldiq', color: 'text-yellow-600' },
          { label: 'SECTOR DISCREPANCY', value: Math.round(kpis.totalDelta * 0.3), sub: 'Taxminiy farq', color: 'text-rose-400' },
          { label: 'BALANS HOLATI', value: `${kpis.complianceRate}%`, sub: 'Ishonchlilik', color: 'text-emerald-400' },
        ];
      case 'FINISHED':
        return [
          { label: 'KIRIM (INBOUND)', value: kpis.totalInbound, sub: 'Jami', color: 'text-white' },
          { label: 'SECTOR ACTIVE STOCK', value: kpis.totalFinished, sub: 'Tayyor Qoldiq', color: 'text-slate-300' },
          { label: 'TAYYOR MAHSULOTLAR (FG)', value: kpis.totalFinishedFg, sub: '70% Ulush', color: 'text-emerald-400' },
          { label: 'QC NAZORAT (QC)', value: kpis.totalFinishedQc, sub: '30% Ulush', color: 'text-emerald-500' },
          { label: 'SECTOR DISCREPANCY', value: Math.round(kpis.totalDelta * 0.2), sub: 'Taxminiy farq', color: 'text-rose-400' },
          { label: 'BALANS HOLATI', value: `${kpis.complianceRate}%`, sub: 'Ishonchlilik', color: 'text-emerald-400' },
        ];
      case 'SALES':
        return [
          { label: 'KIRIM (INBOUND)', value: kpis.totalInbound, sub: 'Jami', color: 'text-white' },
          { label: 'SECTOR ACTIVE EXPORT', value: kpis.totalExported, sub: 'Eksport Qoldiq', color: 'text-slate-300' },
          { label: 'SAVDO BO\'LIMI (SALES)', value: kpis.totalExportedSales, sub: '50% Ulush', color: 'text-sky-400' },
          { label: 'LOGISTIKA POST (EXPORT)', value: kpis.totalExportedLogistics, sub: '50% Ulush', color: 'text-sky-500' },
          { label: 'SECTOR DISCREPANCY', value: Math.round(kpis.totalDelta * 0.1), sub: 'Taxminiy farq', color: 'text-rose-400' },
          { label: 'BALANS HOLATI', value: `${kpis.complianceRate}%`, sub: 'Ishonchlilik', color: 'text-emerald-400' },
        ];
      case 'ALL':
      default:
        return [
          { label: 'KIRIM (INBOUND)', value: kpis.totalInbound, sub: 'шт', color: 'text-white' },
          { label: 'XOMASHYO (RAW)', value: kpis.totalRaw, sub: 'шт', color: 'text-slate-300' },
          { label: 'LINIYA (WIP)', value: kpis.totalWip, sub: 'шт', color: 'text-yellow-500' },
          { label: 'TAYYOR (FINISHED)', value: kpis.totalFinished, sub: 'шт', color: 'text-emerald-400' },
          { label: 'EKSPORT (EXPORTED)', value: kpis.totalExported, sub: 'шт', color: 'text-sky-400' },
          { label: 'BALANS HOLATI', value: `${kpis.complianceRate}%`, sub: 'Ishonchlilik', color: 'text-emerald-400' },
        ];
    }
  }, [selectedDivision, kpis]);

  // Initialize physical inputs with virtual values when starting audit
  const handleStartAudit = () => {
    const initialInputs: Record<string, string> = {};
    virtualStock.forEach(item => {
      initialInputs[`${item.sku}_raw`] = item.raw_wh.toString();
      initialInputs[`${item.sku}_wip`] = item.wip_line.toString();
      initialInputs[`${item.sku}_finished`] = item.finished_wh.toString();
      initialInputs[`${item.sku}_exported`] = item.exported.toString();
    });
    setPhysicalInputs(initialInputs);
    setIsAuditMode(true);
    setIsLocked(false);
    toast.success("Jismoniy inventarizatsiya auditi rejimiga o'tildi. Tizim ko'rsatkichlari jismoniy hisobga ko'chirildi.");
  };

  // Commit physical counts into virtual state logs
  const handleCommitAudit = () => {
    const updatedStock = virtualStock.map(item => {
      const physRaw = physicalInputs[`${item.sku}_raw`] !== undefined ? parseInt(physicalInputs[`${item.sku}_raw`]) : item.raw_wh;
      const physWip = physicalInputs[`${item.sku}_wip`] !== undefined ? parseInt(physicalInputs[`${item.sku}_wip`]) : item.wip_line;
      const physFinished = physicalInputs[`${item.sku}_finished`] !== undefined ? parseInt(physicalInputs[`${item.sku}_finished`]) : item.finished_wh;
      const physExported = physicalInputs[`${item.sku}_exported`] !== undefined ? parseInt(physicalInputs[`${item.sku}_exported`]) : item.exported;

      const raw = isNaN(physRaw) ? 0 : physRaw;
      const wip = isNaN(physWip) ? 0 : physWip;
      const finished = isNaN(physFinished) ? 0 : physFinished;
      const exported = isNaN(physExported) ? 0 : physExported;

      // Discrepancy (Δ) = Inbound - (Raw + WIP + Finished + Exported)
      const discrepancy = item.inbound - (raw + wip + finished + exported);

      return {
        ...item,
        raw_wh: raw,
        wip_line: wip,
        finished_wh: finished,
        exported,
        discrepancy
      };
    });

    setVirtualStock(updatedStock);
    setIsLocked(true);
    setIsAuditMode(false);
    toast.info("Audit ma'lumotlari muvaffaqiyatli saqlandi va tizim balansi bilan bog'landi.");
  };

  const handleUnlockAudit = () => {
    setIsLocked(false);
    setIsAuditMode(true);
    toast.warning("Audit tahrirlash uchun qulfdan chiqarildi.");
  };

  const handleCancelAudit = () => {
    setIsAuditMode(false);
    setPhysicalInputs({});
    toast.error("Audit bekor qilindi, o'zgarishlar saqlanmadi.");
  };

  // Export data to Excel
  const exportToExcel = () => {
    try {
      const exportRows = processedData.map((row, idx) => ({
        '№': idx + 1,
        'SKU / Detal Kodi': row.sku,
        'Nomi': row.name,
        'O\'lchov birligi': row.unit,
        'Kirim jami (Inbound)': row.inbound,
        'Xomashyo Ombori (Raw Stock)': isAuditMode ? row.physRaw : row.raw_wh,
        'Ishlab Chiqarish (WIP Line)': isAuditMode ? row.physWip : row.wip_line,
        'Tayyor Mahsulotlar (Finished Goods)': isAuditMode ? row.physFinished : row.finished_wh,
        'Eksport (Shipped)': isAuditMode ? row.physExported : row.exported,
        'Tizim Farqi / Delta (Δ)': row.delta,
        'Holati': row.delta === 0 ? 'NOMINAL' : `OG'ISH (${row.delta})`
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Reconciliation");
      
      // Auto-size columns slightly
      const maxLen = exportRows.reduce((w, r) => Math.max(w, r['Nomi'].length), 10);
      worksheet['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: maxLen }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

      const fileName = `Inventarizatsiya_Reconciliation_${auditInterval}_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Excel hisoboti muvaffaqiyatli yuklab olindi.");
    } catch (e) {
      console.error(e);
      toast.error("Excel eksportida xatolik yuz berdi.");
    }
  };

  // Export data to PDF / Print Layout
  const exportToPDF = () => {
    toast.success("PDF nashri tayyorlanmoqda...");
    window.print();
  };

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 flex flex-col gap-6 p-6 select-none overflow-y-auto">
      {/* Top Banner/Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-indigo-500 animate-pulse" />
            INVENTARIZATSIYA & MODDIY BALANS
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
            4 Zonalik Real-Vaqt Mass-Balance Analitik Tizimi (Raw | WIP | Finished | Export)
          </p>
        </div>

        {/* Audit Lock Status indicator */}
        <div className="flex items-center gap-3">
          {isLocked ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase">
              <Lock className="w-3.5 h-3.5" /> AUDIT ZAPIS LOCK (Yopiq)
            </Badge>
          ) : isAuditMode ? (
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase animate-pulse">
              <Unlock className="w-3.5 h-3.5" /> AUDIT JARAYONI FAOQ
            </Badge>
          ) : (
            <Badge className="bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> VIRTUAL MONITORING
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {activeMetrics.map((metric, idx) => (
          <Card key={idx} className="bg-slate-900/40 border border-slate-800 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            <CardContent className="p-4 flex flex-col justify-between h-24">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{metric.label}</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-2xl font-black ${metric.color}`}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">{metric.sub}</span>
              </div>
              <div className="absolute right-2 top-2 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800">
                {idx === 0 && <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />}
                {idx === 1 && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />}
                {idx === 2 && <BarChart3 className="w-3.5 h-3.5 text-yellow-500" />}
                {idx === 3 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {idx === 4 && <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />}
                {idx === 5 && <AlertTriangle className={`w-3.5 h-3.5 ${parseFloat(kpis.complianceRate) === 100 ? 'text-emerald-400' : 'text-rose-500'}`} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Actions & Filtering Bar */}
      <Card className="bg-slate-900/40 border border-slate-800 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Audit Interval Select Option */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AUDIT INTERVALI</span>
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as const).map(interval => (
                  <Button
                    key={interval}
                    variant={auditInterval === interval ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setAuditInterval(interval)}
                    className={`text-[10px] font-black h-8 px-3.5 tracking-tight rounded-lg transition-all ${
                      auditInterval === interval 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`}
                    disabled={isAuditMode}
                  >
                    {interval === 'MONTHLY' ? 'Monthly (1-Oy)' : interval === 'QUARTERLY' ? 'Quarterly (3-Oy)' : 'Annual (Yillik)'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Live Text Search input */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">MATERIAL QIDIRISH</span>
              <div className="relative">
                <Input
                  placeholder="SKU yoki nom bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 text-xs font-bold rounded-xl w-72 h-10 pl-3 uppercase focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            {isLocked ? (
              <Button
                onClick={handleUnlockAudit}
                className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-black uppercase rounded-xl flex items-center gap-2"
              >
                <Unlock className="w-4 h-4 text-amber-500" /> Tahrirlash
              </Button>
            ) : isAuditMode ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancelAudit}
                  variant="ghost"
                  className="h-10 px-4 text-xs font-black uppercase text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 rounded-xl"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleCommitAudit}
                  className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Balansni Qulflash
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleStartAudit}
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <ShieldCheck className="w-4 h-4" /> Jismoniy Auditni Boshlash
              </Button>
            )}

            {/* Quick Export excel/pdf layout */}
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="h-10 bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 rounded-xl px-3 flex items-center gap-2 text-xs font-black"
                title="Excelga eksport"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> EXCEL
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                className="h-10 bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 rounded-xl px-3 flex items-center gap-2 text-xs font-black"
                title="PDF chop etish"
              >
                <FileText className="w-4 h-4 text-sky-400" /> PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Division / Factory Sector Filter Bar */}
      <Card className="bg-slate-900/40 border border-slate-800 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DIVISION / FACTORY SECTOR:</span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: '[ ALL SECTORS ]' },
              { id: 'WAREHOUSE', label: '[ WAREHOUSE OMBORI ]' },
              { id: 'TPA', label: '[ TPA SEXI (INJECTION MOLDING) ]' },
              { id: 'ASSEMBLY', label: '[ ISHLAB CHIQARISH (ASSEMBLY LINE) ]' },
              { id: 'FINISHED', label: '[ TAYYOR MAHSULOTLAR ]' },
              { id: 'SALES', label: '[ QOZOQ/MARKETING (SALES SECTION) ]' },
            ].map(sector => (
              <Button
                key={sector.id}
                variant={selectedDivision === sector.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedDivision(sector.id as any)}
                className={`text-[10px] font-black h-9 px-4 tracking-tight rounded-xl transition-all ${
                  selectedDivision === sector.id 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-950 border border-slate-800/60'
                }`}
              >
                {sector.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SAP S/4HANA Grid Ledger Table */}
      <Card className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md flex-1 min-h-[400px]">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/70 border-b border-slate-800">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 pl-6 w-16">№</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 w-28">SKU / Part Code</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4">Material Description</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center py-4 w-24">O'lchov</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center py-4 w-28">Kirim Jami</TableHead>
                
                {/* Raw Stock / Breakdown */}
                {selectedDivision === 'WAREHOUSE' ? (
                  <>
                    <TableHead className="text-[10px] font-black uppercase text-slate-300 text-center py-4 w-28 bg-blue-950/20 border-l border-blue-900/30">Ombor A (60%)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-300 text-center py-4 w-28 bg-blue-950/20 border-r border-blue-900/30">Ombor B (40%)</TableHead>
                  </>
                ) : (
                  <TableHead className={`text-[10px] font-black uppercase text-slate-300 text-center py-4 w-40 bg-slate-900/10 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>Xomashyo Ombori (Raw Stock)</TableHead>
                )}

                {/* WIP Stock / Breakdown */}
                {selectedDivision === 'TPA' || selectedDivision === 'ASSEMBLY' ? (
                  <>
                    <TableHead className="text-[10px] font-black uppercase text-yellow-500/80 text-center py-4 w-28 bg-yellow-950/10 border-l border-yellow-900/20">TPA Sexi (40%)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-yellow-500/80 text-center py-4 w-28 bg-yellow-950/10 border-r border-yellow-900/20">Yig'uv Liniyasi (60%)</TableHead>
                  </>
                ) : (
                  <TableHead className={`text-[10px] font-black uppercase text-yellow-500/70 text-center py-4 w-40 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>Ishlab Chiqarish Liniyasi (WIP Line)</TableHead>
                )}

                {/* Finished Stock / Breakdown */}
                {selectedDivision === 'FINISHED' ? (
                  <>
                    <TableHead className="text-[10px] font-black uppercase text-emerald-400/80 text-center py-4 w-28 bg-emerald-950/10 border-l border-emerald-900/20">Tayyor Ombor (70%)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-emerald-400/80 text-center py-4 w-28 bg-emerald-950/10 border-r border-emerald-900/20">QC Nazorat (30%)</TableHead>
                  </>
                ) : (
                  <TableHead className={`text-[10px] font-black uppercase text-emerald-400/70 text-center py-4 w-40 bg-slate-900/10 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>Tayyor Mahsulotlar Ombori (Finished Goods)</TableHead>
                )}

                {/* Export Stock / Breakdown */}
                {selectedDivision === 'SALES' ? (
                  <>
                    <TableHead className="text-[10px] font-black uppercase text-sky-400 text-center py-4 w-28 bg-sky-950/10 border-l border-sky-900/20">Savdo Bo'limi (50%)</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-sky-400 text-center py-4 w-28 bg-sky-950/10 border-r border-sky-900/20">Logistika (50%)</TableHead>
                  </>
                ) : (
                  <TableHead className={`text-[10px] font-black uppercase text-sky-400 text-center py-4 w-40 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>Eksport Bo'limi (Shipped / Gate Checked)</TableHead>
                )}

                <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-6 py-4 w-36">Farq / Delta (Δ)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((row, index) => {
                const isMismatch = row.delta !== 0;

                return (
                  <TableRow
                    key={row.sku}
                    className="border-slate-800/60 hover:bg-slate-900/30 transition-colors group"
                  >
                    {/* Index */}
                    <TableCell className="pl-6 py-4 text-xs font-bold text-slate-500">
                      {index + 1}
                    </TableCell>

                    {/* SKU Code */}
                    <TableCell className="py-4 font-mono font-black text-xs text-slate-200 tracking-wider">
                      {row.sku}
                    </TableCell>

                    {/* Material Name */}
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white uppercase group-hover:text-indigo-400 transition-colors">
                          {row.name}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">
                          Virtual Log ID: {row.sku}-LOG
                        </span>
                      </div>
                    </TableCell>

                    {/* Measurement Unit */}
                    <TableCell className="text-center py-4 text-xs font-bold text-slate-500 uppercase">
                      {row.unit}
                    </TableCell>

                    {/* Total Inbound (Kirim) */}
                    <TableCell className="text-center py-4">
                      <Badge variant="outline" className="bg-slate-950 border-slate-800 text-slate-300 font-black text-[10px] px-2.5 py-1 rounded-lg">
                        {row.inbound.toLocaleString()}
                      </Badge>
                    </TableCell>

                    {/* Raw Stock */}
                    {selectedDivision === 'WAREHOUSE' ? (
                      <>
                        <TableCell className="text-center py-4 bg-blue-950/10 border-l border-blue-900/20">
                          <span className="text-xs font-bold text-slate-300 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'raw', total: row.raw_wh, partA: Math.round(row.raw_wh * 0.6), partB: row.raw_wh - Math.round(row.raw_wh * 0.6), labelA: 'Warehouse A (60%)', labelB: 'Warehouse B (40%)' })}>
                            {Math.round(row.raw_wh * 0.6).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-blue-950/10 border-r border-blue-900/20">
                          <span className="text-xs font-bold text-slate-400 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'raw', total: row.raw_wh, partA: Math.round(row.raw_wh * 0.6), partB: row.raw_wh - Math.round(row.raw_wh * 0.6), labelA: 'Warehouse A (60%)', labelB: 'Warehouse B (40%)' })}>
                            {(row.raw_wh - Math.round(row.raw_wh * 0.6)).toLocaleString()}
                          </span>
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className={`text-center py-4 bg-slate-900/10 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>
                        {isAuditMode ? (
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              value={physicalInputs[`${row.sku}_raw`] || ''}
                              onChange={(e) => setPhysicalInputs(prev => ({ ...prev, [`${row.sku}_raw`]: e.target.value }))}
                              className="h-8 w-24 bg-slate-950 border-slate-700 text-center text-xs font-black text-slate-200 focus:border-indigo-500 rounded-lg"
                            />
                            <span className="text-[8px] text-slate-600 font-bold uppercase">Virtual: {row.raw_wh}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-300 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'raw', total: row.raw_wh, partA: Math.round(row.raw_wh * 0.6), partB: row.raw_wh - Math.round(row.raw_wh * 0.6), labelA: 'Warehouse A (60%)', labelB: 'Warehouse B (40%)' })}>
                            {row.raw_wh.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                    )}

                    {/* WIP Stock */}
                    {selectedDivision === 'TPA' || selectedDivision === 'ASSEMBLY' ? (
                      <>
                        <TableCell className={`text-center py-4 bg-yellow-950/10 border-l border-yellow-900/20 ${selectedDivision === 'TPA' ? 'bg-indigo-500/10 font-black text-white' : ''}`}>
                          <span className="text-xs font-bold text-yellow-500 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'wip', total: row.wip_line, partA: Math.round(row.wip_line * 0.4), partB: row.wip_line - Math.round(row.wip_line * 0.4), labelA: 'TPA Sexi (WIP A - 40%)', labelB: 'Yig\'uv Liniyasi (WIP B - 60%)' })}>
                            {Math.round(row.wip_line * 0.4).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className={`text-center py-4 bg-yellow-950/10 border-r border-yellow-900/20 ${selectedDivision === 'ASSEMBLY' ? 'bg-indigo-500/10 font-black text-white' : ''}`}>
                          <span className="text-xs font-bold text-yellow-600 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'wip', total: row.wip_line, partA: Math.round(row.wip_line * 0.4), partB: row.wip_line - Math.round(row.wip_line * 0.4), labelA: 'TPA Sexi (WIP A - 40%)', labelB: 'Yig\'uv Liniyasi (WIP B - 60%)' })}>
                            {(row.wip_line - Math.round(row.wip_line * 0.4)).toLocaleString()}
                          </span>
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className={`text-center py-4 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>
                        {isAuditMode ? (
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              value={physicalInputs[`${row.sku}_wip`] || ''}
                              onChange={(e) => setPhysicalInputs(prev => ({ ...prev, [`${row.sku}_wip`]: e.target.value }))}
                              className="h-8 w-24 bg-slate-950 border-slate-700 text-center text-xs font-black text-yellow-500 focus:border-indigo-500 rounded-lg"
                            />
                            <span className="text-[8px] text-slate-600 font-bold uppercase">Virtual: {row.wip_line}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-yellow-500 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'wip', total: row.wip_line, partA: Math.round(row.wip_line * 0.4), partB: row.wip_line - Math.round(row.wip_line * 0.4), labelA: 'TPA Sexi (WIP A - 40%)', labelB: 'Yig\'uv Liniyasi (WIP B - 60%)' })}>
                            {row.wip_line.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                    )}

                    {/* Finished Stock */}
                    {selectedDivision === 'FINISHED' ? (
                      <>
                        <TableCell className="text-center py-4 bg-emerald-950/10 border-l border-emerald-900/20">
                          <span className="text-xs font-bold text-emerald-400 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'finished', total: row.finished_wh, partA: Math.round(row.finished_wh * 0.7), partB: row.finished_wh - Math.round(row.finished_wh * 0.7), labelA: 'Tayyor Mahsulot Ombori (70%)', labelB: 'QC Nazorat Hududi (30%)' })}>
                            {Math.round(row.finished_wh * 0.7).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-emerald-950/10 border-r border-emerald-900/20">
                          <span className="text-xs font-bold text-emerald-500 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'finished', total: row.finished_wh, partA: Math.round(row.finished_wh * 0.7), partB: row.finished_wh - Math.round(row.finished_wh * 0.7), labelA: 'Tayyor Mahsulot Ombori (70%)', labelB: 'QC Nazorat Hududi (30%)' })}>
                            {(row.finished_wh - Math.round(row.finished_wh * 0.7)).toLocaleString()}
                          </span>
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className={`text-center py-4 bg-slate-900/10 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>
                        {isAuditMode ? (
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              value={physicalInputs[`${row.sku}_finished`] || ''}
                              onChange={(e) => setPhysicalInputs(prev => ({ ...prev, [`${row.sku}_finished`]: e.target.value }))}
                              className="h-8 w-24 bg-slate-950 border-slate-700 text-center text-xs font-black text-emerald-400 focus:border-indigo-500 rounded-lg"
                            />
                            <span className="text-[8px] text-slate-600 font-bold uppercase">Virtual: {row.finished_wh}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'finished', total: row.finished_wh, partA: Math.round(row.finished_wh * 0.7), partB: row.finished_wh - Math.round(row.finished_wh * 0.7), labelA: 'Tayyor Mahsulot Ombori (70%)', labelB: 'QC Nazorat Hududi (30%)' })}>
                            {row.finished_wh.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                    )}

                    {/* Exported (Post-1 Shipped) */}
                    {selectedDivision === 'SALES' ? (
                      <>
                        <TableCell className="text-center py-4 bg-sky-950/10 border-l border-sky-900/20">
                          <span className="text-xs font-bold text-sky-400 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'exported', total: row.exported, partA: Math.round(row.exported * 0.5), partB: row.exported - Math.round(row.exported * 0.5), labelA: 'Savdo Bo\'limi (FCA - 50%)', labelB: 'Logistika Post-1 (Gate - 50%)' })}>
                            {Math.round(row.exported * 0.5).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4 bg-sky-950/10 border-r border-sky-900/20">
                          <span className="text-xs font-bold text-sky-500 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'exported', total: row.exported, partA: Math.round(row.exported * 0.5), partB: row.exported - Math.round(row.exported * 0.5), labelA: 'Savdo Bo\'limi (FCA - 50%)', labelB: 'Logistika Post-1 (Gate - 50%)' })}>
                            {(row.exported - Math.round(row.exported * 0.5)).toLocaleString()}
                          </span>
                        </TableCell>
                      </>
                    ) : (
                      <TableCell className={`text-center py-4 ${selectedDivision !== 'ALL' ? 'opacity-40' : ''}`}>
                        {isAuditMode ? (
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              value={physicalInputs[`${row.sku}_exported`] || ''}
                              onChange={(e) => setPhysicalInputs(prev => ({ ...prev, [`${row.sku}_exported`]: e.target.value }))}
                              className="h-8 w-24 bg-slate-950 border-slate-700 text-center text-xs font-black text-sky-400 focus:border-indigo-500 rounded-lg"
                            />
                            <span className="text-[8px] text-slate-600 font-bold uppercase">Virtual: {row.exported}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-sky-400 hover:text-indigo-400 cursor-pointer transition-colors" onClick={() => setBreakdownCell({ sku: row.sku, name: row.name, category: 'exported', total: row.exported, partA: Math.round(row.exported * 0.5), partB: row.exported - Math.round(row.exported * 0.5), labelA: 'Savdo Bo\'limi (FCA - 50%)', labelB: 'Logistika Post-1 (Gate - 50%)' })}>
                            {row.exported.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                    )}

                    {/* Discrepancy Delta */}
                    <TableCell className="text-right pr-6 py-4">
                      <Badge 
                        variant="outline"
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                          row.delta === 0 
                            ? 'bg-slate-950 border-slate-800 text-slate-500' 
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                        }`}
                      >
                        {row.delta > 0 ? `+${row.delta.toLocaleString()}` : row.delta.toLocaleString()} {row.unit}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}

              {processedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <AlertTriangle className="w-8 h-8 text-slate-600" />
                      <p className="text-xs text-slate-500 font-black uppercase tracking-wider">Materiallar topilmadi</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Bottom explanation alert block */}
      <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-indigo-400 leading-relaxed font-medium">
          <p className="font-bold text-white mb-1 uppercase tracking-wide">METROLOGIK MASS-BALANS QOIDASI</p>
          Ushbu modul zavod bo'yicha jami kirgan xomashyoni har bir SKU bo'yicha hisoblaydi va 4 ta asosiy lokatsiyadagi jami qoldiqqa solishtiradi. Har qanday farq (Δ) ruxsat etilgan limitdan oshsa (masalan &gt; 2.0%), darhol metrologik audit so'rovi shakllantiriladi va oqim to'xtatiladi.
        </div>
      </div>

      {/* Sub-Department Breakdown Popover (Option B) */}
      {breakdownCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Top Close Button */}
            <button
              onClick={() => setBreakdownCell(null)}
              className="absolute right-6 top-6 p-2 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
              <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  BO'LIMLAR BO'YICHA TAQSIMOT
                </h3>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {breakdownCell.category === 'raw' && 'XOMASHYO OMBORI'}
                  {breakdownCell.category === 'wip' && 'ISHLAB CHIQARISH (WIP)'}
                  {breakdownCell.category === 'finished' && 'TAYYOR MAHSULOTLAR'}
                  {breakdownCell.category === 'exported' && 'EKSPORT CHECKPOINT'}
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="flex flex-col gap-4">
              {/* SKU & Name */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU / PART CODE</span>
                  <span className="font-mono text-xs font-black text-indigo-400 tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    {breakdownCell.sku}
                  </span>
                </div>
                <div className="text-sm font-bold text-white uppercase mt-1">
                  {breakdownCell.name}
                </div>
              </div>

              {/* Total Stock Display */}
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">JAMI VIRTUAL ZAXIRA:</span>
                <span className="text-2xl font-black text-white">
                  {breakdownCell.total.toLocaleString()} <span className="text-sm text-slate-500">шт</span>
                </span>
              </div>

              {/* Breakdown Bars */}
              <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-2xl flex flex-col gap-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-2">
                  ALLOCATION BREAKDOWN (TAQSIMOT FOIZI)
                </span>
                
                {/* Part A */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">{breakdownCell.labelA}</span>
                    <span className="font-black text-white">
                      {breakdownCell.partA.toLocaleString()} шт ({breakdownCell.total > 0 ? Math.round((breakdownCell.partA / breakdownCell.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        breakdownCell.category === 'raw' ? 'bg-blue-500' :
                        breakdownCell.category === 'wip' ? 'bg-yellow-500' :
                        breakdownCell.category === 'finished' ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${breakdownCell.total > 0 ? (breakdownCell.partA / breakdownCell.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Part B */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-300">{breakdownCell.labelB}</span>
                    <span className="font-black text-white">
                      {breakdownCell.partB.toLocaleString()} шт ({breakdownCell.total > 0 ? Math.round((breakdownCell.partB / breakdownCell.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        breakdownCell.category === 'raw' ? 'bg-blue-400' :
                        breakdownCell.category === 'wip' ? 'bg-amber-600' :
                        breakdownCell.category === 'finished' ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}
                      style={{ width: `${breakdownCell.total > 0 ? (breakdownCell.partB / breakdownCell.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
              <Button
                onClick={() => setBreakdownCell(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
              >
                Yopish (Close)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
