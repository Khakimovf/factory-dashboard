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
    Truck, Search, MapPin, Plus, CheckCircle2, X,
    Printer, ShieldCheck, AlertTriangle, ArrowRight,
    ClipboardList, Package, FileText, LayoutDashboard
} from 'lucide-react';
import { useWarehouseStore } from '../../../store/warehouseStore';
import { useFinanceStore } from '../../../store/financeStore';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
type GRStep = 'idle' | 'intake';

interface LocalMaterial {
    sku: string;
    name: string;
    unit: string;
    bins: { address: string; stock: number }[];
    price: number;
}

const MOCK_WAREHOUSE_DB: LocalMaterial[] = [
    { sku: "26211286", name: "Door Trim Inner Panel Left", unit: "шт", bins: [{ address: "Z-001", stock: 450 }, { address: "A-02", stock: 1200 }], price: 45000 },
    { sku: "26211284", name: "Door Trim Inner Panel Right", unit: "шт", bins: [{ address: "Z-002", stock: 380 }, { address: "A-03", stock: 950 }], price: 45000 },
    { sku: "26211277", name: "Front Bumper Support Bracket", unit: "шт", bins: [{ address: "B-04", stock: 150 }, { address: "B-05", stock: 600 }], price: 28000 },
    { sku: "26211281", name: "Rear Pillar Trim Assembly", unit: "шт", bins: [{ address: "C-01", stock: 85 }, { address: "BUFFER-01", stock: 400 }], price: 32000 },
    { sku: "13536589", name: "M6 Hexagonal Flange Bolt", unit: "шт", bins: [{ address: "D-08", stock: 15000 }, { address: "D-09", stock: 35000 }], price: 1200 },
    { sku: "13555291", name: "Plastic Clip Fastener Type-B", unit: "шт", bins: [{ address: "E-12", stock: 8500 }, { address: "BUFFER-02", stock: 12000 }], price: 850 }
];

interface IntakeLine {
    id: string;
    materialId: string;
    description: string;
    uom: string;
    selectedBin: string;
    receivedQty: string;
}

const BUFFER_ZONE = 'BUFFER-ZONE';

// ─── Main: Goods Receipt Tab ──────────────────────────────────────────────────
export default function GoodsReceiptWaybillTab() {
    const { bins, adjustStock, addDocument, updateBin } = useWarehouseStore();
    const { ocrContracts } = useFinanceStore();

    const [grStep, setGrStep] = useState<GRStep>('idle');
    const [waybillInput, setWaybillInput] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [activeWaybill, setActiveWaybill] = useState('');

    const purchaseContracts = useMemo(() =>
        ocrContracts.filter(c => c.type === 'PURCHASE (XARID)'),
        [ocrContracts]
    );

    const activeContract = useMemo(() =>
        purchaseContracts.find(c => c.party === selectedSupplier) || null,
        [purchaseContracts, selectedSupplier]
    );

    const supplierOptions = useMemo(() => {
        const contractSuppliers = purchaseContracts.map(c => c.party);
        const defaults = ["Metallurgiya TMC", "Hardware Supply Co.", "Techno-Global JSC", "AutoParts-Express"];
        return Array.from(new Set([...contractSuppliers, ...defaults]));
    }, [purchaseContracts]);

    // Ledger State
    const [intakeLines, setIntakeLines] = useState<IntakeLine[]>([]);
    const [skuSearch, setSkuSearch] = useState('');

    // Available physical bins (AVAILABLE) + BUFFER fallback
    const physicalBins = useMemo(() =>
        bins.filter(b => b.status === 'AVAILABLE').map(b => b.binId),
        [bins]);

    const binOptions = useMemo(() => [...physicalBins, BUFFER_ZONE], [physicalBins]);

    // ── Search Mock DB for SKU ────────────────────────────────────────────────
    const skuResults = useMemo(() => {
        const q = skuSearch.trim().toLowerCase();
        if (q.length < 2) return [];
        return MOCK_WAREHOUSE_DB.filter(s =>
            s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        );
    }, [skuSearch]);

    // ── Session Controls ─────────────────────────────────────────────────────
    const handleOpenSession = () => {
        if (!waybillInput.trim()) { toast.error('Enter external Waybill №'); return; }
        if (!selectedSupplier) { toast.error('Please select a Supplier'); return; }
        setActiveWaybill(waybillInput.trim());
        setGrStep('intake');
        toast.success(`Session Init — Waybill: ${waybillInput.trim()}`);
    };

    const handleReset = () => {
        setGrStep('idle');
        setWaybillInput('');
        setSelectedSupplier('');
        setActiveWaybill('');
        setIntakeLines([]);
        setSkuSearch('');
    };

    // ── Line Items Logic ─────────────────────────────────────────────────────
    const handleAddMaterial = (m: LocalMaterial) => {
        const isDuplicate = intakeLines.some(l => l.materialId === m.sku);
        if (isDuplicate) { toast.warning(`${m.sku} is already in the intake ledger`); return; }

        const newLine: IntakeLine = {
            id: crypto.randomUUID(),
            materialId: m.sku,
            description: m.name,
            uom: m.unit,
            selectedBin: physicalBins[0] || BUFFER_ZONE,
            receivedQty: '',
        };
        setIntakeLines(prev => [newLine, ...prev]);
        setSkuSearch('');
        toast.success(`✓ Added ${m.sku} to intake ledger`);
    };

    const removeLine = (id: string) => setIntakeLines(prev => prev.filter(l => l.id !== id));

    const updateLine = (id: string, updates: Partial<IntakeLine>) => {
        setIntakeLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    // ── Final Commitment: PRIXOD ─────────────────────────────────────────────
    const handlePrixodCommit = () => {
        if (intakeLines.length === 0) { toast.error('Intake ledger is empty'); return; }

        // Validation
        const invalid = intakeLines.find(l => !l.receivedQty || parseFloat(l.receivedQty) <= 0 || !l.selectedBin);
        if (invalid) { toast.error('Please complete all lines (Qty & Bin selection)'); return; }

        // --- Guardrail: B2B Contract Max Limit Check ---
        if (activeContract) {
            for (const line of intakeLines) {
                const contractItem = activeContract.allocatedItems.find(i => i.sku === line.materialId);
                if (contractItem) {
                    const qty = parseFloat(line.receivedQty) || 0;
                    const currentQty = contractItem.currentQty || 0;
                    if (currentQty + qty > contractItem.maxLimit) {
                        toast.error("Shartnoma limiti to'lgan! (Contract Limit Exceeded)");
                        return;
                    }
                }
            }
        }

        // Process Ledger
        intakeLines.forEach(line => {
            const qty = parseFloat(line.receivedQty);

            // 1. Permanently increment stock registry
            adjustStock(line.materialId, qty, `PRIXOD Waybill:${activeWaybill}`);

            // 2. Update specific Bin (if not buffer)
            if (line.selectedBin !== BUFFER_ZONE) {
                updateBin(line.selectedBin, {
                    status: 'OCCUPIED',
                    materialId: line.materialId,
                    quantity: qty
                });
            }

            // 3. Increment contract delivered volume in useFinanceStore
            if (activeContract) {
                useFinanceStore.getState().incrementOcrContractQty(activeContract.id, line.materialId, qty);
            }
        });

        // 3. Create History Document
        addDocument({
            documentId: `GR-${activeWaybill}-${Date.now()}`,
            postDate: new Date().toISOString(),
            type: 'GOODS_RECEIPT',
            mvmt: 101,
            reference: activeWaybill,
            plant: 'P001',
            sloc: 'WH01',
            supplier: selectedSupplier,
            lineItems: intakeLines.map(l => {
                const qty = parseFloat(l.receivedQty);
                const contractItem = activeContract?.allocatedItems?.find(i => i.sku === l.materialId);
                const standardPrice = MOCK_WAREHOUSE_DB.find(m => m.sku === l.materialId)?.price || 25;
                const basePrice = contractItem ? contractItem.contractPrice : standardPrice;
                const vatRate = activeContract ? activeContract.vatRate : 0.12;
                const effectivePrice = contractItem ? basePrice * (1 + vatRate) : basePrice;

                return {
                    materialId: l.materialId,
                    description: l.description,
                    qty: qty,
                    unit: l.uom,
                    amount: effectivePrice
                };
            })
        });

        toast.success(`✓ PRIXOD SUCCESS: Stock updated for Waybill ${activeWaybill}`);
        handleReset(); // Clean terminate session
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full pb-20 space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-600/20 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Goods Receipt (Kirim)</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">SAP S/4HANA — Putaway Workflow · Supplier Intake</p>
                    </div>
                </div>
                {grStep === 'intake' && (
                    <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-700 text-slate-400 h-8 text-[10px] uppercase font-black">
                        <X className="w-3 h-3 mr-1" /> Terminate Session
                    </Button>
                )}
            </div>

            {/* Stage 1: IDLE / Waybill Entry */}
            {grStep === 'idle' && (
                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardContent className="p-12">
                        <div className="max-w-xl mx-auto space-y-8 text-center">
                            <div className="w-20 h-20 bg-emerald-600/10 rounded-3xl border border-emerald-600/20 flex items-center justify-center mx-auto shadow-inner">
                                <ClipboardList className="w-10 h-10 text-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Inbound Material Putaway</h3>
                                <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-bold uppercase tracking-widest opacity-60">
                                    Initialize receipt by entering the vendor's incoming waybill / reference code
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-1/3 relative text-left">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 mb-1 block pl-2 tracking-widest">Select Supplier</Label>
                                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                            <SelectTrigger className="bg-slate-950 border-slate-700 h-14 text-white font-bold uppercase text-[11px] tracking-widest">
                                                <SelectValue placeholder="VENDOR/SUPPLIER..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                {supplierOptions.map(sup => (
                                                    <SelectItem key={sup} value={sup} className="font-bold py-3 uppercase">
                                                        {sup}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 relative text-left">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 mb-1 block pl-2 tracking-widest">External Waybill №</Label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <Input
                                                value={waybillInput}
                                                onChange={e => setWaybillInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleOpenSession()}
                                                placeholder="Enter Waybill (Nakladnaya raqami)..."
                                                className="bg-slate-950 border-slate-700 h-14 pl-10 font-bold text-white tracking-widest text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-5">
                                        <Button onClick={handleOpenSession} className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 font-black uppercase text-xs tracking-widest gap-2 shadow-xl shadow-emerald-500/10">
                                            Open Session <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {activeContract && (
                                    <div className="bg-emerald-600/5 border border-emerald-600/20 rounded-xl p-4 text-left space-y-2 max-w-xl mx-auto animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest mb-2">Auto-Fetched Purchase Contract Data</p>
                                        <div className="grid grid-cols-3 gap-4 text-xs">
                                            <div>
                                                <p className="text-slate-500 font-bold mb-0.5">Contract № / PO</p>
                                                <p className="text-white font-black font-mono">{activeContract.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-bold mb-0.5">Valid Until</p>
                                                <p className="text-white font-black">{activeContract.validUntil}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 font-bold mb-0.5">VAT (QQS) Rate</p>
                                                <p className="text-emerald-400 font-black">{(activeContract.vatRate * 100).toFixed(0)}%</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-emerald-600/10 text-xs">
                                            <p className="text-slate-500 font-bold mb-0.5">{activeContract.allocatedItems.length} Material(s) on Contract</p>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {activeContract.allocatedItems.map(item => (
                                                    <Badge key={item.sku} className="bg-slate-800 text-slate-300 border-slate-700 font-mono text-[9px]">
                                                        {item.sku}: {item.contractPrice.toLocaleString()} UZS (Max: {item.maxLimit})
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stage 2: INTAKE / Ledger */}
            {grStep === 'intake' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Active Info Bar */}
                    <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 backdrop-blur-md">
                        <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                            Waybill: {activeWaybill}
                        </Badge>
                        <Badge className="bg-slate-800 text-slate-400 border-slate-700 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                            Items: {intakeLines.length}
                        </Badge>
                        <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            <LayoutDashboard className="w-3.5 h-3.5" /> Direct Stock Commitment Mode
                        </div>
                    </div>

                    {/* SKU Add Block */}
                    <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-emerald-500 shadow-2xl relative overflow-visible">
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Add Material — Search SKU or Description</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        value={skuSearch}
                                        onChange={e => setSkuSearch(e.target.value)}
                                        placeholder="Type material code or name..."
                                        className="bg-slate-950 border-slate-700 h-12 pl-10 text-sm font-bold placeholder:font-normal"
                                    />
                                    {skuSearch.length > 0 && (
                                        <button onClick={() => setSkuSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Autocomplete Results */}
                                {skuSearch.length >= 2 && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-64 overflow-y-auto">
                                        {skuResults.map(m => (
                                            <button key={m.sku} onClick={() => handleAddMaterial(m)}
                                                className="w-full px-5 py-4 hover:bg-slate-800 transition-colors text-left flex items-center gap-4 border-b border-slate-800 last:border-0 group">
                                                <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shrink-0">
                                                    <Package className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-black text-white tracking-widest">{m.sku}</p>
                                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{m.name}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-slate-800 text-slate-400 border-slate-700 font-black text-[10px]">{m.unit}</Badge>
                                                    <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                            </button>
                                        ))}
                                        {skuResults.length === 0 && (
                                            <div className="px-5 py-6 text-center text-slate-500 flex flex-col items-center gap-2">
                                                <AlertTriangle className="w-6 h-6 opacity-30" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">No matching materials found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Receipt Table */}
                    <Card className="bg-slate-900/60 border-slate-800 overflow-hidden min-h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 bg-slate-900/40 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest w-12">#</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">SKU Code</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center w-24">UoM</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Allocate Bin (Adres Tanlash)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-right w-32">Received Qty</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center w-20">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {intakeLines.map((line, idx) => (
                                    <TableRow key={line.id} className="border-slate-800 group hover:bg-slate-800/10 transition-colors">
                                        <TableCell className="text-slate-600 font-mono text-[10px]">{idx + 1}</TableCell>
                                        <TableCell className="font-black text-xs text-blue-400 tracking-widest">{line.materialId}</TableCell>
                                        <TableCell className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{line.description}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-slate-800 border-slate-700 text-slate-400 font-black text-[10px]">{line.uom}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={line.selectedBin} onValueChange={v => updateLine(line.id, { selectedBin: v })}>
                                                <SelectTrigger className="bg-slate-950 border-slate-700 h-9 text-[10px] font-black tracking-widest uppercase w-48 focus:ring-1 focus:ring-emerald-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                                    {binOptions.map(binId => (
                                                        <SelectItem key={binId} value={binId} className={`text-[10px] font-black uppercase ${binId === BUFFER_ZONE ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            {binId === BUFFER_ZONE ? '⚠️ BUFFER ZONE' : binId}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={line.receivedQty}
                                                onChange={e => updateLine(line.id, { receivedQty: e.target.value })}
                                                placeholder="0.00"
                                                className="bg-slate-950 border-slate-700 h-9 w-24 text-right font-black text-xs text-emerald-400 ml-auto placeholder:text-slate-700 focus-visible:ring-emerald-500"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <button onClick={() => removeLine(line.id)} className="text-slate-700 hover:text-rose-500 transition-colors p-1.5 opacity-0 group-hover:opacity-100">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {intakeLines.length === 0 && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="h-44 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-20">
                                                <Package className="w-10 h-10" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Ledger grid empty — add materials to begin</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Global Commitment Button */}
                    <div className="pt-4">
                        <Button
                            onClick={handlePrixodCommit}
                            disabled={intakeLines.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-16 rounded-xl font-black text-xl uppercase tracking-widest gap-4 shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-30"
                        >
                            <ShieldCheck className="w-7 h-7" />
                            PRIXOD (COMMIT TO STOCK)
                        </Button>
                    </div>

                    {/* Stats/Legend */}
                    <div className="flex items-center justify-between px-2 text-[9px] font-black uppercase text-slate-600 tracking-widest">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Physical Allocation</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Overflow Fallback</span>
                        </div>
                        <p>Total {intakeLines.reduce((s, l) => s + (parseFloat(l.receivedQty) || 0), 0).toLocaleString()} {intakeLines[0]?.uom || 'Units'} to be receipted</p>
                    </div>
                </div>
            )}
        </div>
    );
}
