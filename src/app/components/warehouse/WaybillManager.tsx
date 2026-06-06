import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from '../ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select';
import { Switch } from '../ui/switch';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import {
    Printer,
    Plus,
    Trash2,
    CalendarIcon,
    FileText,
    ArrowLeftRight,
    ShieldCheck,
    UserCheck,
    Building2,
    BadgeCent
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../ui/utils';
import { useWarehouse } from '../../context/WarehouseContext';
import { useWarehouseStore } from '../../store/warehouseStore';
import { amountToWordsUZS } from '../../utils/numberToWords';
import { toast } from 'sonner';
import { mockContracts, Contract } from '../../data/contracts';

interface WaybillRow {
    id: string;
    sku: string;
    description: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    binLocation?: string;
    availableStock?: number;
}

export function WaybillManager() {
    const { finishedGoods } = useWarehouse();
    const { adjustStock, addDocument, stock } = useWarehouseStore();

    // 1. Document Mode & Header Meta
    const [mode, setMode] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
    const [waybillNo, setWaybillNo] = useState(`SO-${Math.floor(Math.random() * 900 + 100)}`);
    const [docDate, setDocDate] = useState<Date>(new Date());
    const [selectedContractId, setSelectedContractId] = useState<string>("");

    // 2. Corporate & Banking Details
    const [supplier, setSupplier] = useState({
        name: '',
        address: '',
        inn: '',
        mfo: '',
        account: '',
        bank: ''
    });

    const [receiver, setReceiver] = useState({
        name: '',
        address: '',
        inn: '',
        mfo: '',
        account: '',
        bank: ''
    });

    // Auto-populate logic based on contract
    useEffect(() => {
        if (selectedContractId) {
            const contract = mockContracts.find(c => c.id === selectedContractId);
            if (contract) {
                setSupplier(contract.supplier);
                setReceiver(contract.receiver);

                // Auto-populate rows for INBOUND if it's a new contract selection
                if (mode === 'INBOUND' && rows.length === 0) {
                    const newRows = contract.materials.map(m => ({
                        id: crypto.randomUUID(),
                        sku: m.sku,
                        description: m.description,
                        uom: m.uom,
                        quantity: m.expectedQty || 0,
                        unitPrice: m.unitPrice
                    }));
                    setRows(newRows);
                }
            }
        }
    }, [selectedContractId, mode]);

    // 3. Dynamic Materials Table
    const [rows, setRows] = useState<WaybillRow[]>([]);

    const selectedContract = useMemo(() =>
        mockContracts.find(c => c.id === selectedContractId),
        [selectedContractId]
    );

    // Filtered items based on contract if in OUTBOUND mode
    const availableItems = useMemo(() => {
        if (mode === 'OUTBOUND' && selectedContract) {
            return selectedContract.materials.map(m => {
                const stockItem = stock.find(s => s.materialId === m.sku);
                return {
                    ...m,
                    binLocation: stockItem?.binLocation || 'N/A',
                    availableStock: stockItem?.unrestricted || 0
                };
            });
        }
        return (finishedGoods || []).map(i => {
            const stockItem = stock.find(s => s.materialId === i.sku);
            return {
                sku: i.sku,
                description: i.productName,
                uom: 'шт', // default
                unitPrice: i.unitPrice,
                binLocation: stockItem?.binLocation || 'N/A',
                availableStock: stockItem?.unrestricted || 0
            };
        });
    }, [mode, selectedContract, finishedGoods, stock]);

    const addRow = () => {
        setRows([...rows, {
            id: crypto.randomUUID(),
            sku: '',
            description: '',
            uom: 'шт',
            quantity: 0,
            unitPrice: 0
        }]);
    };

    const removeRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, updates: Partial<WaybillRow>) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                const updated = { ...r, ...updates };
                // Auto-populate description if SKU changed
                if (updates.sku) {
                    const item = availableItems.find(i => i.sku === updates.sku);
                    if (item) {
                        updated.description = item.description;
                        updated.unitPrice = item.unitPrice || 0;
                        updated.binLocation = item.binLocation;
                        updated.availableStock = item.availableStock;
                    }
                }
                return updated;
            }
            return r;
        }));
    };

    const totalQuantity = useMemo(() => rows.reduce((acc, r) => acc + r.quantity, 0), [rows]);
    const totalPrice = useMemo(() => rows.reduce((acc, r) => acc + (r.quantity * r.unitPrice), 0), [rows]);

    // 4. Authorized Signatures & Doverennost
    const [doverennost, setDoverennost] = useState({
        no: '',
        date: new Date(),
        agent: '',
        expiration: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days default
    });

    // 5. Inventory Execution Logic
    const handleProcessWaybill = () => {
        if (rows.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        if (rows.some(r => !r.sku || r.quantity <= 0)) {
            toast.error('Complete all row data');
            return;
        }

        // Process inventory
        rows.forEach(row => {
            const adjustment = mode === 'INBOUND' ? row.quantity : -row.quantity;
            adjustStock(row.sku, adjustment, `Waybill ${waybillNo} (${mode})`);
        });

        // Register Document
        addDocument({
            documentId: `MAT-${waybillNo}`,
            postDate: new Date().toISOString(),
            type: mode === 'INBOUND' ? 'GOODS_RECEIPT' : 'GOODS_ISSUE',
            mvmt: mode === 'INBOUND' ? 101 : 261,
            reference: waybillNo,
            plant: 'P001',
            sloc: 'WH01',
            lineItems: rows.map(r => ({
                materialId: r.sku,
                description: r.description,
                qty: r.quantity,
                unit: r.uom,
                amount: r.quantity * r.unitPrice
            }))
        });

        toast.success(`Waybill ${waybillNo} processed successfully!`, {
            description: `Inventory updated for ${rows.length} items.`,
            icon: '✅'
        });

        // Reset rows but keep header meta for potential next entry
        setRows([]);
        setWaybillNo(`SO-${Math.floor(Math.random() * 900 + 100)}`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="waybill-container w-full mt-8 pb-20">
            <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          .waybill-print-area, .waybill-print-area * {
            visibility: visible;
          }
          .waybill-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 10mm;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .card, .table, .input, .button {
            border-color: #000 !important;
            box-shadow: none !important;
          }
          .text-slate-100, .text-blue-500, .text-emerald-500 {
            color: black !important;
          }
          .bg-slate-900, .bg-slate-950, .bg-blue-600 {
            background: transparent !important;
            border: 1px solid black !important;
          }
          input, select {
            border: none !important;
            background: transparent !important;
          }
        }
      `}</style>

            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-xl mb-6 no-print">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-3 rounded-xl shadow-lg transition-all duration-500",
                                mode === 'INBOUND' ? "bg-emerald-600/20 text-emerald-500 shadow-emerald-500/10" : "bg-blue-600/20 text-blue-500 shadow-blue-500/10"
                            )}>
                                <ArrowLeftRight className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Documents / Waybills</h2>
                                <p className="text-xs text-slate-400 font-medium">Digital Tovarnaya Nakladnaya Interface</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-xl border border-slate-800">
                                <Button
                                    variant={mode === 'INBOUND' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setMode('INBOUND')}
                                    className={cn("text-[10px] font-black uppercase h-8 px-4 rounded-lg", mode === 'INBOUND' && "bg-emerald-600 hover:bg-emerald-700")}
                                >
                                    Inbound (Prikhod)
                                </Button>
                                <Button
                                    variant={mode === 'OUTBOUND' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setMode('OUTBOUND')}
                                    className={cn("text-[10px] font-black uppercase h-8 px-4 rounded-lg", mode === 'OUTBOUND' && "bg-blue-600 hover:bg-blue-700")}
                                >
                                    Outbound (Raskhod)
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="h-10 gap-2 border-slate-700 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest"
                            >
                                <Printer className="w-4 h-4" /> Print Waybill (A4)
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waybill №</Label>
                            <Input
                                value={waybillNo}
                                onChange={(e) => {
                                    setWaybillNo(e.target.value);
                                    // Inbound Auto-populate trigger on Waybill match (mock logic)
                                    if (mode === 'INBOUND' && e.target.value === 'PO-8821' && rows.length === 0) {
                                        setSelectedContractId('CON-120A');
                                    }
                                }}
                                className="bg-slate-950/50 border-slate-800 h-10 font-mono"
                                placeholder="e.g. SO-117"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full h-10 border-slate-800 bg-slate-950/50 justify-start text-left font-normal px-3">
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        {docDate ? format(docDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                                    <Calendar mode="single" selected={docDate} onSelect={(d) => d && setDocDate(d)} initialFocus className="bg-slate-900 text-slate-100" />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Currency</Label>
                            <Input value="UZS (Fixed)" disabled className="bg-slate-950/30 border-slate-800 h-10 opacity-50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Basis Contract (Osnovaniye)</Label>
                            <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                                <SelectTrigger className="bg-slate-950/50 border-slate-800 h-10">
                                    <SelectValue placeholder="Select Contract..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    {mockContracts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.contractNumber} ({c.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="waybill-print-area bg-white text-black p-0 md:p-8 rounded-none md:rounded-2xl border-0 md:border md:border-slate-800 shadow-2xl overflow-hidden relative">
                <div className="hidden md:block absolute top-0 right-0 p-8 opacity-10 no-print">
                    <FileText className="w-40 h-40" />
                </div>

                {/* 1. Header (Print and Preview) */}
                <div className="flex flex-col items-center justify-center mb-10 text-center">
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
                        ТОВАРНО-ТРАНСПОРТНАЯ НАКЛАДНА № {waybillNo}
                    </h1>
                    <p className="text-sm font-bold opacity-60">от {format(docDate, "dd MMMM yyyy")} г.</p>
                </div>

                {/* 2. Corporate Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4 p-6 rounded-2xl bg-slate-100/50 md:bg-transparent border border-slate-200 md:border-slate-800/20 relative group">
                        {!selectedContractId && (
                            <div className="absolute top-4 right-4 text-[8px] font-black uppercase text-blue-500 animate-pulse no-print">Manual Entry Mode</div>
                        )}
                        <h3 className="text-xs font-black uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" /> Поставщик / Отпустил
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {selectedContractId ? (
                                <>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Наименование</span><p className="text-sm font-black">{supplier.name}</p></div>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Адрес</span><p className="text-xs">{supplier.address}</p></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">ИНН</span><p className="text-xs font-mono">{supplier.inn}</p></div>
                                        <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">МФО</span><p className="text-xs font-mono">{supplier.mfo}</p></div>
                                    </div>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Расчетный счет</span><p className="text-xs font-mono">{supplier.account}</p></div>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Банк</span><p className="text-xs">{supplier.bank}</p></div>
                                </>
                            ) : (
                                <div className="space-y-2 no-print">
                                    <Input placeholder="Supplier Name" value={supplier.name} onChange={e => setSupplier({ ...supplier, name: e.target.value })} className="h-8 text-xs bg-slate-950/20" />
                                    <Input placeholder="INN" value={supplier.inn} onChange={e => setSupplier({ ...supplier, inn: e.target.value })} className="h-8 text-xs bg-slate-950/20" />
                                    <p className="text-[10px] text-slate-500 italic">Select a contract to auto-fill details</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-2xl bg-slate-100/50 md:bg-transparent border border-slate-200 md:border-slate-800/20 relative group">
                        {!selectedContractId && (
                            <div className="absolute top-4 right-4 text-[8px] font-black uppercase text-emerald-500 animate-pulse no-print">Manual Entry Mode</div>
                        )}
                        <h3 className="text-xs font-black uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Получатель / Получил
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {selectedContractId ? (
                                <>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Наименование</span><p className="text-sm font-black">{receiver.name}</p></div>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Адрес</span><p className="text-xs">{receiver.address}</p></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">ИНН</span><p className="text-xs font-mono">{receiver.inn}</p></div>
                                        <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">МФО</span><p className="text-xs font-mono">{receiver.mfo}</p></div>
                                    </div>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Расчетный счет</span><p className="text-xs font-mono">{receiver.account}</p></div>
                                    <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400">Банк</span><p className="text-xs">{receiver.bank}</p></div>
                                </>
                            ) : (
                                <div className="space-y-2 no-print">
                                    <Input placeholder="Receiver Name" value={receiver.name} onChange={e => setReceiver({ ...receiver, name: e.target.value })} className="h-8 text-xs bg-slate-950/20" />
                                    <Input placeholder="INN" value={receiver.inn} onChange={e => setReceiver({ ...receiver, inn: e.target.value })} className="h-8 text-xs bg-slate-950/20" />
                                    <p className="text-[10px] text-slate-500 italic">Select a contract to auto-fill details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Items Table */}
                <div className="border border-slate-300 md:border-slate-800 rounded-xl overflow-hidden mb-8">
                    <Table>
                        <TableHeader className="bg-slate-100 md:bg-slate-900/50">
                            <TableRow className="border-slate-300 md:border-slate-800">
                                <TableHead className="w-[50px] text-[10px] font-black uppercase text-center border-r">№</TableHead>
                                <TableHead className="text-[10px] font-black uppercase border-r min-w-[150px]">Код товара (SKU)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase border-r min-w-[200px]">Наименование товаров</TableHead>
                                <TableHead className="text-[10px] font-black uppercase border-r w-[130px]">{mode === 'INBOUND' ? 'Целевая ячейка (Manzil)' : 'Локация / Остаток'}</TableHead>
                                <TableHead className="w-[100px] text-[10px] font-black uppercase text-center border-r">Ед. изм.</TableHead>
                                <TableHead className="w-[120px] text-[10px] font-black uppercase text-right border-r">Кол-во</TableHead>
                                <TableHead className="w-[150px] text-[10px] font-black uppercase text-right border-r">Цена</TableHead>
                                <TableHead className="w-[150px] text-[10px] font-black uppercase text-right">Стоимость</TableHead>
                                <TableHead className="w-[50px] text-center no-print"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row, index) => (
                                <TableRow key={row.id} className="border-slate-300 md:border-slate-800 hover:bg-slate-50 md:hover:bg-transparent">
                                    <TableCell className="text-center font-bold border-r">{index + 1}</TableCell>
                                    <TableCell className="border-r">
                                        <div className="no-print">
                                            <Select value={row.sku} onValueChange={(v) => updateRow(row.id, { sku: v })}>
                                                <SelectTrigger className="h-8 bg-transparent border-slate-700 text-xs text-black md:text-white">
                                                    <SelectValue placeholder="Select SKU" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                    {availableItems.map(i => (
                                                        <SelectItem key={i.sku} value={i.sku}>{i.sku}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <span className="hidden print:block text-xs font-mono">{row.sku}</span>
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <Input
                                            value={row.description}
                                            readOnly={mode === 'OUTBOUND'}
                                            onChange={(e) => updateRow(row.id, { description: e.target.value })}
                                            className="h-8 bg-transparent border-none text-xs text-black md:text-white px-0 focus-visible:ring-0"
                                        />
                                    </TableCell>
                                    <TableCell className="border-r">
                                        {mode === 'INBOUND' ? (
                                            <Input
                                                placeholder="e.g. A-03"
                                                value={row.binLocation || ''}
                                                onChange={(e) => updateRow(row.id, { binLocation: e.target.value })}
                                                className="h-8 bg-transparent border-slate-700 text-xs text-black md:text-white px-2 focus-visible:ring-1"
                                            />
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black uppercase text-slate-400">Bin:</span>
                                                    <span className="text-[10px] font-bold text-blue-400">{row.binLocation || '---'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black uppercase text-slate-400">Stock:</span>
                                                    <span className={cn("text-[10px] font-bold", (row.availableStock || 0) > 0 ? "text-emerald-400" : "text-rose-400")}>
                                                        {row.availableStock?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <div className="no-print">
                                            <Select value={row.uom} onValueChange={(v) => updateRow(row.id, { uom: v })}>
                                                <SelectTrigger className="h-8 bg-transparent border-slate-700 text-xs text-black md:text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                    <SelectItem value="шт">шт (pcs)</SelectItem>
                                                    <SelectItem value="м2">м2 (sqm)</SelectItem>
                                                    <SelectItem value="литр">литр (l)</SelectItem>
                                                    <SelectItem value="кг">кг (kg)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <span className="hidden print:block text-xs text-center">{row.uom}</span>
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <Input
                                            type="number"
                                            value={row.quantity}
                                            onChange={(e) => updateRow(row.id, { quantity: parseFloat(e.target.value) || 0 })}
                                            className="h-8 bg-transparent border-none text-right font-mono text-xs text-black md:text-white px-0 focus-visible:ring-0"
                                        />
                                    </TableCell>
                                    <TableCell className="border-r">
                                        <Input
                                            type="number"
                                            value={row.unitPrice}
                                            onChange={(e) => updateRow(row.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                            className="h-8 bg-transparent border-none text-right font-mono text-xs text-black md:text-white px-0 focus-visible:ring-0"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-black text-xs">
                                        {(row.quantity * row.unitPrice).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center no-print">
                                        <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="h-8 w-8 text-rose-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow className="no-print border-none">
                                <TableCell colSpan={8} className="p-4">
                                    <Button
                                        variant="outline"
                                        onClick={addRow}
                                        className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white h-10 text-[10px] font-black uppercase tracking-widest gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add New Material Row
                                    </Button>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                        <TableFooter className="bg-slate-50 md:bg-slate-900/40 border-t border-slate-300 md:border-slate-800">
                            <TableRow>
                                <TableCell colSpan={4} className="text-[10px] font-black uppercase tracking-widest">Всего (Total)</TableCell>
                                <TableCell className="text-right font-mono font-black text-xs">{totalQuantity}</TableCell>
                                <TableCell className="text-right"></TableCell>
                                <TableCell className="text-right font-mono font-black text-xs border-l border-slate-300 md:border-slate-800">
                                    {totalPrice.toLocaleString()} UZS
                                </TableCell>
                                <TableCell className="no-print"></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>

                {/* 4. Total in words */}
                <div className="mb-10 p-6 border border-slate-300 md:border-slate-800 border-dashed rounded-xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Стоимость составила прописью:</p>
                    <p className="text-sm font-black italic">
                        {totalPrice > 0 ? amountToWordsUZS(totalPrice) : "Ноль сум 00 тийин"}
                    </p>
                </div>

                {/* 5. Doverennost & Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex items-end gap-2 border-b border-black pb-1">
                                <span className="text-[10px] font-black uppercase w-28">Руководитель:</span>
                                <span className="text-xs flex-1">_________________________</span>
                            </div>
                            <div className="flex items-end gap-2 border-b border-black pb-1">
                                <span className="text-[10px] font-black uppercase w-28">Гл. бухгалтер:</span>
                                <span className="text-xs flex-1">_________________________</span>
                            </div>
                            <div className="flex items-end gap-2 border-b border-black pb-1 pt-4">
                                <span className="text-[10px] font-black uppercase w-28">Отпустил:</span>
                                <span className="text-xs flex-1 underline decoration-dotted underline-offset-4">John Doe</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 no-print">
                            <Button
                                onClick={handleProcessWaybill}
                                className={cn(
                                    "flex-1 h-12 text-xs font-black uppercase tracking-widest shadow-xl",
                                    mode === 'INBOUND' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                <ShieldCheck className="w-4 h-4 mr-2" /> Confirm & Post Document
                            </Button>
                        </div>
                    </div>

                    {rows.length > 0 && (
                        <div className="p-6 border border-black rounded-lg space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h3 className="text-xs font-black uppercase tracking-widest text-center border-b border-black pb-2 mb-4">Доверенность (Courier auth)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase opacity-60">№ Доверенности</Label>
                                    <Input
                                        value={doverennost.no}
                                        onChange={(e) => setDoverennost({ ...doverennost, no: e.target.value })}
                                        className="h-8 border-slate-200 md:border-slate-800 bg-transparent text-xs text-black md:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase opacity-60">Дата выдачи</Label>
                                    <div className="no-print">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full h-8 border-slate-800 bg-transparent justify-start text-xs font-normal px-2 text-black md:text-white">
                                                    {doverennost.date ? format(doverennost.date, "dd.MM.yyyy") : "..."}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                                                <Calendar mode="single" selected={doverennost.date} onSelect={(d) => d && setDoverennost({ ...doverennost, date: d })} className="bg-slate-900 text-slate-100" />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <span className="hidden print:block text-xs">{format(doverennost.date, "dd.MM.yyyy")}</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase opacity-60">Выдана на имя</Label>
                                <Input
                                    value={doverennost.agent}
                                    onChange={(e) => setDoverennost({ ...doverennost, agent: e.target.value })}
                                    className="h-8 border-slate-200 md:border-slate-800 bg-transparent text-xs text-black md:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex items-end gap-2 border-b border-black pb-1 pt-4">
                                    <span className="text-[10px] font-black uppercase w-20">Получил:</span>
                                    <span className="text-xs flex-1 italic text-slate-400 no-print">(Sign on collector arrival)</span>
                                    <span className="hidden print:block flex-1">_________________________</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer info (Print only) */}
                <div className="mt-12 text-[8px] opacity-40 uppercase text-center hidden print:block">
                    Electronic Document generated by SAP S/4HANA Factory Logistics Engine — {new Date().toLocaleString()}
                </div>
            </div>
        </div>
    );
}
