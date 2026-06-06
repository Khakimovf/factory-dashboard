import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../ui/select';
import {
    BarChart3, RefreshCw, Download, ShieldCheck, AlertTriangle,
    Layers, Package, Truck, ArrowUpRight, Search, FileText,
    History, CheckCircle2, X
} from 'lucide-react';
import { useWarehouseStore, StockItem, MaterialDocument } from '../../../store/warehouseStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

type AuditPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

interface ReconciliationRow {
    sku: string;
    name: string;
    unit: string;
    totalInbound: number;
    rawStock: number;
    wip: number;
    finishedGoods: number;
    exported: number;
    discrepancy: number;
}

export default function InventoryReconciliationTab() {
    const { stock, documents, auditSnapshots, freezeAuditSnapshot, commitAuditAdjustments } = useWarehouseStore();

    const [period, setPeriod] = useState<AuditPeriod>('MONTHLY');
    const [isAuditMode, setIsAuditMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [physicalInputs, setPhysicalInputs] = useState<Record<string, string>>({});

    // ─── Mass-Balance Engine ──────────────────────────────────────────────────
    const reconciliationData = useMemo(() => {
        // Group materials to identify base SKUs (ignoring -WIP suffixes for rollup)
        const baseSkus = Array.from(new Set(stock.map(s => s.materialId.replace('-WIP', ''))));

        return baseSkus.map(sku => {
            const items = stock.filter(s => s.materialId.startsWith(sku));
            const mainItem = items.find(i => i.materialId === sku) || items[0];

            // 1. Total Inbound (Sum of all GRs for this SKU)
            const totalInbound = documents
                .filter(doc => doc.type === 'GOODS_RECEIPT')
                .reduce((acc, doc) => {
                    const line = doc.lineItems.find(l => l.materialId === sku);
                    return acc + (line?.qty || 0);
                }, 0);

            // 2. Exported (Sum of all GIs for this SKU)
            const exported = documents
                .filter(doc => doc.type === 'GOODS_ISSUE')
                .reduce((acc, doc) => {
                    const line = doc.lineItems.find(l => l.materialId === sku);
                    return acc + (line?.qty || 0);
                }, 0);

            // 3. Current Stock Buckets
            const raw = items.filter(i => i.category === 'RAW_MATERIAL').reduce((acc, i) => acc + i.unrestricted, 0);
            const wip = items.filter(i => i.category === 'WIP').reduce((acc, i) => acc + i.unrestricted, 0);
            const fg = items.filter(i => i.category === 'FINISHED_GOODS').reduce((acc, i) => acc + i.unrestricted, 0);

            // 4. Equation: Inbound = Raw + WIP + FG + Exported + Discrepancy
            const calculatedTotal = raw + wip + fg + exported;
            const discrepancy = totalInbound - calculatedTotal;

            return {
                sku,
                name: mainItem.description.replace(' (WIP)', ''),
                unit: mainItem.unit,
                totalInbound,
                rawStock: raw,
                wip,
                finishedGoods: fg,
                exported,
                discrepancy
            };
        }).filter(row =>
            row.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stock, documents, searchQuery]);

    const summaryStats = useMemo(() => {
        const totalInbound = reconciliationData.reduce((acc, row) => acc + row.totalInbound, 0);
        const totalDiscrepancy = reconciliationData.reduce((acc, row) => acc + Math.abs(row.discrepancy), 0);
        const reliability = totalInbound > 0 ? (1 - (totalDiscrepancy / totalInbound)) * 100 : 100;
        const variance = totalInbound > 0 ? (totalDiscrepancy / totalInbound) * 100 : 0;

        return {
            reliability: reliability.toFixed(1),
            variance: variance.toFixed(1),
            isCompliant: parseFloat(variance.toFixed(1)) < 2.0
        };
    }, [reconciliationData]);

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleStartAudit = () => {
        freezeAuditSnapshot(period);
        setIsAuditMode(true);
        toast.success(`${period} Audit Session Initialized. Snapshot frozen.`);
    };

    const handleCommitAudit = () => {
        // Convert SKU-based inputs to materialId-based adjustments
        const adjustments: Record<string, number> = {};
        Object.entries(physicalInputs).forEach(([sku, value]) => {
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
                // For this mock, we'll assign the count to the main item (non-WIP)
                adjustments[sku] = numValue;
            }
        });

        commitAuditAdjustments(adjustments);
        setIsAuditMode(false);
        setPhysicalInputs({});
        toast.info("Audit reconciliation recorded and saved to history.");
    };

    const handleExportToExcel = () => {
        try {
            const dataToExport = reconciliationData.map(row => ({
                'SKU': row.sku,
                'Description': row.name,
                'Unit': row.unit,
                'Total Inbound': row.totalInbound,
                'Raw Stock': row.rawStock,
                'WIP Line': row.wip,
                'Finished Goods': row.finishedGoods,
                'Exported': row.exported,
                'Discrepancy': row.discrepancy,
                'Status': row.discrepancy === 0 ? 'MATCH' : 'MISMATCH'
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventory Audit");

            const fileName = `Warehouse_Audit_${period}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success(`Exported ${reconciliationData.length} items to Excel.`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export Excel file.");
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Header Controls */}
            <Card className="bg-slate-900/40 border border-slate-800 backdrop-blur-md">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-500" />
                                Inventory Reconciliation
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Live Mass-Balance Tracking & Audit Controller</p>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-lg">
                            {(['MONTHLY', 'QUARTERLY', 'ANNUAL'] as AuditPeriod[]).map(p => (
                                <Button
                                    key={p}
                                    variant={period === p ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setPeriod(p)}
                                    className={`text-[9px] font-black h-7 px-3 tracking-tighter ${period === p ? 'bg-blue-600 text-white hover:bg-blue-500' : 'text-slate-500'}`}
                                    disabled={isAuditMode}
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <Input
                                placeholder="Search SKU / Description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-950 border-slate-800 h-9 w-64 pl-9 text-xs font-bold text-white uppercase"
                            />
                        </div>
                        {isAuditMode ? (
                            <div className="flex items-center gap-2">
                                <Button onClick={() => setIsAuditMode(false)} variant="ghost" className="h-9 px-4 text-[10px] font-black uppercase text-slate-400">Cancel</Button>
                                <Button onClick={handleCommitAudit} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase shadow-lg shadow-emerald-500/20 gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Commit Audit
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleStartAudit} className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase shadow-lg shadow-blue-500/20 gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> Start Physical Audit
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-slate-950 border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all"
                            onClick={handleExportToExcel}
                            title="Export to Excel"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Ledger */}
            <Card className="bg-slate-900/40 border border-slate-800 overflow-hidden backdrop-blur-md">
                <Table>
                    <TableHeader className="bg-slate-950/50">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black uppercase text-slate-500 py-4 pl-6">Material Traceability</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-500 text-center">Total Inbound</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center bg-slate-900/30">Raw Stock</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-yellow-500/70 text-center">WIP Line</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-emerald-500/70 text-center">Finished Goods</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-blue-400 text-center">Exported</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-slate-500 text-right pr-6">
                                {isAuditMode ? 'Physical Count' : 'Digital Discrepancy (Δ)'}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reconciliationData.map((row) => (
                            <TableRow key={row.sku} className="border-slate-800/50 hover:bg-slate-800/10 transition-colors group">
                                <TableCell className="pl-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-100 uppercase tracking-tight">{row.sku}</span>
                                        <span className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">{row.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="bg-slate-950/50 border-slate-800 text-slate-400 font-black text-[10px] px-2.5">
                                        {row.totalInbound.toLocaleString()} {row.unit}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center font-bold text-xs text-slate-300 bg-slate-900/10">
                                    {row.rawStock.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center font-bold text-xs text-yellow-500/90">
                                    {row.wip.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center font-bold text-xs text-emerald-500">
                                    {row.finishedGoods.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-blue-400 font-black text-xs">
                                        {row.exported.toLocaleString()}
                                        <ArrowUpRight className="w-3 h-3 opacity-50" />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    {isAuditMode ? (
                                        <Input
                                            type="number"
                                            value={physicalInputs[row.sku] || ''}
                                            onChange={(e) => setPhysicalInputs(prev => ({ ...prev, [row.sku]: e.target.value }))}
                                            placeholder="Count..."
                                            className="h-8 w-24 bg-slate-950 border-slate-700 text-right text-xs font-black text-emerald-400 focus:border-emerald-500"
                                        />
                                    ) : (
                                        <div className={`text-xs font-black ${row.discrepancy === 0 ? 'text-slate-600' : (row.discrepancy > 0 ? 'text-rose-500' : 'text-emerald-500')}`}>
                                            {row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                                            <span className="ml-1 opacity-40">{row.unit}</span>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}

                        {reconciliationData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                        <RefreshCw className="w-12 h-12 animate-spin-slow" />
                                        <p className="text-xs font-black uppercase tracking-[0.2em]">Aggregating Traceability Data...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Strategic Reconciliation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900/40 border border-slate-800 p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-500">Inventory Status</h4>
                        <Layers className="w-4 h-4 text-blue-500 opacity-50" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-black text-slate-100">{summaryStats.reliability}%</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">System Reliability</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400">Total Assets</p>
                            <p className="text-[10px] font-black text-slate-500">P001: OK</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/40 border border-slate-800 p-4 border-l-4 border-l-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-500">Audit Health</h4>
                        <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-50" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-black text-slate-100">{period === 'ANNUAL' ? '0' : '12'} Days</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Since Last {period} Audit</p>
                        </div>
                        <div className="text-right">
                            <Badge className={`${summaryStats.isCompliant ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} border-none text-[9px] font-black`}>
                                {summaryStats.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                            </Badge>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/40 border border-slate-800 p-4 border-l-4 border-l-rose-500">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase text-slate-500">Lost Material (Brak)</h4>
                        <AlertTriangle className="w-4 h-4 text-rose-500 opacity-50" />
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className={`text-2xl font-black ${summaryStats.isCompliant ? 'text-slate-100' : 'text-rose-500'}`}>{summaryStats.variance}%</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Variance Threshold</p>
                        </div>
                        <div className="text-right text-xs font-bold text-rose-500/60 uppercase">
                            {summaryStats.isCompliant ? 'Stable' : 'Attention Required'}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
