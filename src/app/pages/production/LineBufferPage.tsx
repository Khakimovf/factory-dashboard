import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft, Download, FileSpreadsheet, Search, Package,
  CheckCircle, Clock, User, AlertTriangle, ShieldCheck,
  Truck, RotateCcw, Zap
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';
import { hrEmployees } from '../../data/hrEmployees';

export interface LineBufferItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  safetyThreshold: number; // units — supply status triggered below this
  consumptionPerUnit: number; // components consumed per finished unit
  qcStatus: 'PASSED';
  lastUpdated: string;
  responsible: string;
  lineId: string;
  supplyStatus: 'In Stock' | 'Requested' | 'Picking' | 'In Transit';
}

const MOCK_CYCLE_TIME_SECONDS = 32; // Actual cycle time (seconds per unit) — from Live Production

// Fixed mock data: stable quantities to prevent hydration differences
const generateMockBufferItems = (lineId: string): LineBufferItem[] => {
  const products = [
    { name: 'Door Trim ALL', sku: 'DT-ALL-001', qty: 41, threshold: 20, cpuUnit: 20 },
    { name: 'Dashboard Panel', sku: 'DP-PNL-002', qty: 28, threshold: 25, cpuUnit: 15 },
    { name: 'Side Panel', sku: 'SP-PNL-003', qty: 55, threshold: 30, cpuUnit: 10 },
    { name: 'Rear Bumper', sku: 'RB-BMP-004', qty: 12, threshold: 15, cpuUnit: 25 },
    { name: 'Front Grille', sku: 'FG-GRL-005', qty: 8, threshold: 12, cpuUnit: 8 },
  ];

  const inspectors = ['Karimov Alisher', 'Toshmatov Bahodir', 'Rahimov Shavkat'];

  return products.map((product, index) => ({
    id: `buffer-${lineId}-${index + 1}`,
    productName: product.name,
    sku: product.sku,
    quantity: product.qty,
    safetyThreshold: product.threshold,
    consumptionPerUnit: product.cpuUnit,
    qcStatus: 'PASSED' as const,
    lastUpdated: new Date(Date.now() - (index * 1200000)).toISOString(),
    responsible: inspectors[index % inspectors.length],
    lineId,
    supplyStatus: product.qty < product.threshold ? 'Requested' : 'In Stock',
  }));
};

type SupplyStatus = LineBufferItem['supplyStatus'];

const SUPPLY_STATUS_CONFIG: Record<SupplyStatus, { label: string; className: string; icon: React.ReactNode }> = {
  'In Stock': {
    label: 'In Stock',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  'Requested': {
    label: 'Requested',
    className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
    icon: <RotateCcw className="w-3 h-3" />,
  },
  'Picking': {
    label: 'Picking',
    className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    icon: <Package className="w-3 h-3" />,
  },
  'In Transit': {
    label: 'In Transit',
    className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
    icon: <Truck className="w-3 h-3" />,
  },
};

// Compute Time-to-Empty in minutes: (qty / consumptionPerUnit) * cycleTimeSec / 60
function computeTTE(quantity: number, consumptionPerUnit: number, cycleTimeSec: number): number {
  if (consumptionPerUnit <= 0 || cycleTimeSec <= 0) return Infinity;
  const unitsBeforeEmpty = quantity / consumptionPerUnit;
  return Math.round((unitsBeforeEmpty * cycleTimeSec) / 60);
}

function StockGauge({ quantity, threshold }: { quantity: number; threshold: number }) {
  const max = threshold * 3; // 3x threshold = full bar
  const pct = Math.min(100, Math.round((quantity / max) * 100));
  const color =
    pct > 66 ? 'bg-green-500' :
      pct > 33 ? 'bg-yellow-400' :
        'bg-red-500';

  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function LineBufferPage() {
  const { lineId } = useParams<{ lineId: string }>();
  const lineIdParam = lineId || '';
  const navigate = useNavigate();
  const { productionLines } = useFactory();
  const { addMaterialRequest, requests } = useWarehouse();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'quantity' | 'time' | 'name' | 'tte'>('tte');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [bufferItems, setBufferItems] = useState<LineBufferItem[]>(() =>
    lineIdParam ? generateMockBufferItems(lineIdParam) : []
  );
  const itemsPerPage = 10;

  const line = productionLines.find(l => l.id === lineIdParam);

  // Find active QC inspector from hrEmployees (linked to live shift data)
  const activeQCInspector = useMemo(() => {
    return hrEmployees.find(e =>
      e.position.toLowerCase().includes('sifat') ||
      e.position.toLowerCase().includes('inspekt') ||
      e.position.toLowerCase().includes('quality')
    ) || null;
  }, []);

  const activeBrigadir = useMemo(() => {
    return hrEmployees.find(e =>
      e.position.toLowerCase().includes('smena') ||
      e.position.toLowerCase().includes('brigadier') ||
      e.position.toLowerCase().includes('brigadir')
    ) || null;
  }, []);

  // Auto-trigger Emergency Restock for items where TTE < 15 min
  useEffect(() => {
    bufferItems.forEach(item => {
      const tte = computeTTE(item.quantity, item.consumptionPerUnit, MOCK_CYCLE_TIME_SECONDS);
      if (tte < 15 && tte !== Infinity) {
        const hasPending = requests.some(
          r => r.status === 'Pending' && r.items.some(i => i.partNumber === item.sku)
        );
        if (!hasPending && item.supplyStatus === 'In Stock') {
          addMaterialRequest(
            line?.name || lineIdParam,
            [{
              id: `EMER-${item.sku}-${Date.now()}`,
              name: item.productName,
              partNumber: item.sku,
              requiredQty: item.safetyThreshold * 2,
              currentStock: item.quantity,
              binLocation: 'Line Buffer',
            }],
            'High'
          );
          setBufferItems(prev =>
            prev.map(i => i.id === item.id ? { ...i, supplyStatus: 'Requested' } : i)
          );
          toast.error(`🚨 Emergency Restock: ${item.productName} — TTE ${tte} min!`, { duration: 8000 });
        }
      }
    });
  }, [bufferItems, requests, addMaterialRequest, line?.name, lineIdParam]);

  const itemsWithTTE = useMemo(() =>
    bufferItems.map(item => ({
      ...item,
      tte: computeTTE(item.quantity, item.consumptionPerUnit, MOCK_CYCLE_TIME_SECONDS),
    })),
    [bufferItems]
  );

  const filteredAndSortedItems = useMemo(() => {
    let filtered = itemsWithTTE.filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
      else if (sortBy === 'time') comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      else if (sortBy === 'tte') comparison = a.tte - b.tte;
      else comparison = a.productName.localeCompare(b.productName);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [itemsWithTTE, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const summary = useMemo(() => ({
    totalPositions: bufferItems.length,
    totalQuantity: bufferItems.reduce((sum, item) => sum + item.quantity, 0),
    criticalCount: itemsWithTTE.filter(i => i.tte < 15).length,
    lastUpdate: bufferItems.length > 0
      ? bufferItems.reduce((latest, item) =>
        new Date(item.lastUpdated) > new Date(latest) ? item.lastUpdated : latest,
        bufferItems[0].lastUpdated)
      : null,
  }), [bufferItems, itemsWithTTE]);

  const handleSort = (field: 'quantity' | 'time' | 'name' | 'tte') => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  if (!line) {
    return (
      <div className="min-h-full p-8 bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('productionDetail.lineNotFound') || 'Production line not found'}
          </h2>
          <button onClick={() => navigate('/production-lines')} className="mt-4 text-blue-400 hover:text-blue-300">
            {t('productionDetail.backToLines')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              {t('productionDetail.lineBuffer.title')}
            </h1>
            <p className="text-muted-foreground mt-1">{line.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast.info(t('productionDetail.lineBuffer.exportPDFPlaceholder'))}>
              <Download className="w-4 h-4 mr-2" />
              {t('productionDetail.lineBuffer.exportPDF')}
            </Button>
            <Button variant="outline" onClick={() => toast.info(t('productionDetail.lineBuffer.exportExcelPlaceholder'))}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {t('productionDetail.lineBuffer.exportExcel')}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/production-lines/${lineIdParam}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('productionDetail.lineBuffer.backToLine')}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Shift Personnel Banner */}
      <div className="mb-6 flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-gray-500 dark:text-gray-400">Brigadir:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {activeBrigadir?.fullName ?? '—'}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-gray-500 dark:text-gray-400">QC Inspektor:</span>
          {activeQCInspector ? (
            <>
              <span className="font-semibold text-gray-900 dark:text-white">{activeQCInspector.fullName}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                QC Verified
              </span>
            </>
          ) : (
            <span className="text-xs italic text-gray-400">—</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          Cycle: {MOCK_CYCLE_TIME_SECONDS}s/unit
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.totalPositions')}
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{summary.totalPositions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.totalQuantity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalQuantity}</p>
            <p className="text-sm text-gray-500 mt-1">{t('productionDetail.lineBuffer.units')}</p>
          </CardContent>
        </Card>
        <Card className={summary.criticalCount > 0 ? 'border-red-300 dark:border-red-700' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-red-500" /> Critical Items (&lt;15 min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${summary.criticalCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {summary.criticalCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Auto-restock triggered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.lastUpdate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.lastUpdate ? (
              <>
                <p className="text-lg font-semibold">{new Date(summary.lastUpdate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 mt-1">{new Date(summary.lastUpdate).toLocaleTimeString()}</p>
              </>
            ) : <p className="text-sm text-gray-500">-</p>}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('productionDetail.lineBuffer.search')}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('productionDetail.lineBuffer.sortBy')}:</span>
              {(['tte', 'quantity', 'time', 'name'] as const).map(field => (
                <Button
                  key={field}
                  variant={sortBy === field ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSort(field)}
                >
                  {field === 'tte' ? 'Time-to-Empty' : field === 'quantity' ? t('productionDetail.lineBuffer.sortQuantity') : field === 'time' ? t('productionDetail.lineBuffer.sortTime') : t('productionDetail.lineBuffer.sortName')}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('productionDetail.lineBuffer.tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[190px]">{t('productionDetail.lineBuffer.table.productName')}</TableHead>
                  <TableHead className="w-[140px]">{t('productionDetail.lineBuffer.table.sku')}</TableHead>
                  <TableHead className="w-[140px]">Miqdor (Stock)</TableHead>
                  <TableHead className="w-[160px]">Time-to-Empty</TableHead>
                  <TableHead className="w-[130px]">Supply Status</TableHead>
                  <TableHead className="w-[120px]">{t('productionDetail.lineBuffer.table.qcStatus')}</TableHead>
                  <TableHead className="w-[180px]">Mas'ul (QC / Liniya)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? t('productionDetail.lineBuffer.noResults') : t('productionDetail.lineBuffer.empty')}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const isCritical = item.tte < 15;
                    const isWarning = item.tte >= 15 && item.tte < 30;
                    const rowClass = isCritical
                      ? 'bg-red-50 dark:bg-red-950/30 animate-pulse border-l-4 border-l-red-500'
                      : isWarning
                        ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-400'
                        : '';
                    const statusCfg = SUPPLY_STATUS_CONFIG[item.supplyStatus];

                    return (
                      <TableRow key={item.id} className={`h-16 touch-manipulation ${rowClass}`}>
                        <TableCell className="font-medium text-gray-900 dark:text-white px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isCritical && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            {item.productName}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 px-4 py-3 font-mono text-xs">
                          {item.sku}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{item.quantity} pcs</span>
                            <StockGauge quantity={item.quantity} threshold={item.safetyThreshold} />
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                              Safety: {item.safetyThreshold}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`text-sm font-semibold ${isCritical ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                            {item.tte === Infinity ? '∞' : `≈ ${item.tte} min`}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.quantity} pcs × {item.consumptionPerUnit}/unit
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusCfg.className}`}>
                            {statusCfg.icon}{statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-1 px-2">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('productionDetail.lineBuffer.qcPassed')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 px-4 py-3">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span>{item.responsible}</span>
                            </div>
                            {activeQCInspector && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{activeQCInspector.fullName}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('productionDetail.lineBuffer.showing')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)} {t('productionDetail.lineBuffer.of')} {filteredAndSortedItems.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  {t('productionDetail.lineBuffer.previous')}
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('productionDetail.lineBuffer.page')} {currentPage} {t('productionDetail.lineBuffer.of')} {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  {t('productionDetail.lineBuffer.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
