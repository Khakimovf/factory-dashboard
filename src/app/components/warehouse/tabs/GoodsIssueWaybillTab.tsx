import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../ui/table';
import {
    FileOutput, Search, Package, MapPin, CheckCircle2,
    ChevronDown, ChevronUp, Printer, X, ShieldCheck,
    AlertTriangle, ArrowRight, Building2, FileText,
    ClipboardList, ChevronsUpDown, Check, Info
} from 'lucide-react';
import { useWarehouseStore } from '../../../store/warehouseStore';
import { useFinanceStore } from '../../../store/financeStore';
import { mockContracts, type Contract } from '../../../data/contracts';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
type GIStep = 'gate' | 'picking' | 'preview' | 'done';

interface CartItem {
    id: string;
    materialId: string;
    description: string;
    binId: string;
    qty: number;
    uom: string;
    unitPrice: number;
}

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

interface CourierData {
    name: string;
    doverennostNo: string;
    validUntil: string;
    issueDate: string;
}

// ─── Unique companies derived from contracts ──────────────────────────────────
function GIPreviewStage({
    lines, contract, docNo, courier, setCourier, onPrint, onBack
}: {
    lines: CartItem[];
    contract: Contract;
    docNo: string;
    courier: CourierData;
    setCourier: (c: CourierData) => void;
    onPrint: () => void;
    onBack: () => void;
}) {
    const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const isValid = courier.name.trim() && courier.doverennostNo.trim();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #gi-print-area, #gi-print-area * { visibility: visible !important; }
                    #gi-print-area {
                        position: fixed !important; top: 0 !important; left: 0 !important;
                        width: 210mm !important; padding: 12mm !important;
                        background: white !important; color: black !important;
                        font-family: 'Times New Roman', serif !important;
                        line-height: 1.2 !important;
                    }
                    .print-border { border: 1px solid black !important; }
                    .print-bold { font-weight: bold !important; }
                }
            `}</style>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center border border-emerald-600/20">
                                <FileText className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Official Review — Waybill № {docNo}</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Logistics Authorization & Print Finalization</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white text-[10px] font-black uppercase h-9">
                                <ArrowRight className="w-3 h-3 mr-1 rotate-180" /> Back to Picking
                            </Button>
                            <Button disabled={!isValid} onClick={onPrint} className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase h-10 px-6 gap-2">
                                <Printer className="w-4 h-4" /> Finalize & Print
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        {/* Sidebar: Metadata Input */}
                        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-900/40 p-6 space-y-6">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-1.5">
                                    <ShieldCheck className="w-3 h-3" /> Logistics Authorization
                                </p>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-black uppercase text-slate-500">Ekspeditor F.I.Sh (Courier Full Name)</Label>
                                    <Input value={courier.name} onChange={e => setCourier({ ...courier, name: e.target.value })}
                                        placeholder="Full Name..." className="bg-slate-950 border-slate-700 text-xs h-10" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase text-slate-500">Doverennost №</Label>
                                        <Input value={courier.doverennostNo} onChange={e => setCourier({ ...courier, doverennostNo: e.target.value })}
                                            placeholder="№..." className="bg-slate-950 border-slate-700 text-xs h-10 font-mono" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] font-black uppercase text-slate-500">Valid Until</Label>
                                        <Input value={courier.validUntil} onChange={e => setCourier({ ...courier, validUntil: e.target.value })}
                                            placeholder="DD.MM.YYYY" className="bg-slate-950 border-slate-700 text-xs h-10 font-mono" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2">
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Shipment ID:</span><span className="text-white font-mono">{docNo}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Registry Items:</span><span className="text-white font-bold">{lines.length} Rows</span></div>
                                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                                    <span className="text-slate-500">Document Value:</span>
                                    <span className="text-emerald-400 font-black">{total.toLocaleString()} UZS</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Canvas: A4 Preview */}
                        <div className="lg:col-span-8 bg-slate-800/20 p-8 flex justify-center min-h-[1100px] overflow-auto">
                            <div id="gi-print-area" className="bg-white text-black p-10 w-[210mm] h-fit shadow-xl">
                                {/* Header Section */}
                                <div className="flex justify-between items-start mb-6 border-b border-black pb-4">
                                    <div>
                                        <h1 className="text-xl font-bold uppercase tracking-tight">ТОВАРНО-ТРАНСПОРТНАЯ НАКЛАДНАЯ</h1>
                                        <p className="text-sm font-black mt-1">№ {docNo} от {courier.issueDate}</p>
                                    </div>
                                    <div className="text-right text-[8px] uppercase font-bold text-gray-400">Копия №1 — Экземпляр Склада</div>
                                </div>

                                {/* Logistics Identity Grid */}
                                <div className="grid grid-cols-2 gap-6 mb-6 text-[10px]">
                                    <div className="border border-black p-2 space-y-1">
                                        <p className="font-bold underline mb-1">Грузоотправитель (Shipper):</p>
                                        <p className="font-black italic">{contract.supplier.name}</p>
                                        <p>{contract.supplier.address}</p>
                                        <p>ИНН: {contract.supplier.inn} | Р/С: {contract.supplier.account}</p>
                                    </div>
                                    <div className="border border-black p-2 space-y-1">
                                        <p className="font-bold underline mb-1">Грузополучатель (Receiver):</p>
                                        <p className="font-black italic">{contract.receiver.name}</p>
                                        <p>{contract.receiver.address}</p>
                                        <p>ИНН: {contract.receiver.inn} | Основание: Договор {contract.contractNumber}</p>
                                    </div>
                                </div>

                                {/* Power of Attorney Inline Grid */}
                                <div className="border border-black p-2 mb-6 text-[10px] bg-gray-50 italic">
                                    <p>По доверенности № <span className="font-bold border-b border-black px-4">{courier.doverennostNo || '________'}</span> от <span className="font-bold border-b border-black px-4">{courier.validUntil || '________'}</span> на имя <span className="font-bold border-b border-black px-6">{courier.name || '________________'}</span></p>
                                </div>

                                {/* Main Materials Ledger */}
                                <table className="w-full border-collapse border border-black text-[10px] mb-6">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-black px-1 py-1 w-8">№</th>
                                            <th className="border border-black px-1 py-1 w-24">Артикул</th>
                                            <th className="border border-black px-1 py-1">Наименование запчастей</th>
                                            <th className="border border-black px-1 py-1 w-12">Ед.изм</th>
                                            <th className="border border-black px-1 py-1 w-16">Адрес</th>
                                            <th className="border border-black px-1 py-1 w-16">Кол-во</th>
                                            <th className="border border-black px-1 py-1 w-24">Сумма (UZS)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((l, i) => (
                                            <tr key={l.id}>
                                                <td className="border border-black px-1 py-1 text-center">{i + 1}</td>
                                                <td className="border border-black px-1 py-1 font-mono">{l.materialId}</td>
                                                <td className="border border-black px-1 py-1 font-bold">{l.description}</td>
                                                <td className="border border-black px-1 py-1 text-center">{l.uom}</td>
                                                <td className="border border-black px-1 py-1 text-center font-mono">{l.binId}</td>
                                                <td className="border border-black px-1 py-1 text-right font-black">{l.qty}</td>
                                                <td className="border border-black px-1 py-1 text-right">{(l.qty * l.unitPrice).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr className="font-black">
                                            <td colSpan={6} className="border border-black px-2 py-1 text-right uppercase">Итого к выдаче:</td>
                                            <td className="border border-black px-2 py-1 text-right">{total.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Official Signature Matrix */}
                                <div className="grid grid-cols-2 gap-12 mt-12 text-[10px]">
                                    {/* Sender Side (Warehouse) */}
                                    <div className="space-y-4">
                                        <p className="font-bold underline text-[9px] uppercase">Грузоотправитель (Issuing Warehouse):</p>
                                        <div className="pt-2 border-b border-black flex justify-between">
                                            <span>Руководитель:</span><span className="text-[8px] text-gray-400 italic">(подпись / М.П.)</span>
                                        </div>
                                        <div className="pt-2 border-b border-black flex justify-between">
                                            <span>Главный бухгалтер:</span><span className="text-[8px] text-gray-400 italic">(подпись)</span>
                                        </div>
                                        <div className="pt-2 border-b border-black flex justify-between">
                                            <span>Отпустил (Материал бердвичи):</span><span className="text-[8px] text-gray-400 italic">(подпись)</span>
                                        </div>
                                    </div>

                                    {/* Receiver Side (Courier) */}
                                    <div className="space-y-4">
                                        <p className="font-bold underline text-[9px] uppercase">Грузополучатель (Receiving Agent):</p>
                                        <div className="flex justify-between border-b border-black pt-2">
                                            <span>По доверенности №:</span><span className="font-bold">{courier.doverennostNo || '________'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-black pt-2">
                                            <span>От (Дата):</span><span className="font-bold">{courier.validUntil || '________'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-black pt-2">
                                            <span>Экспедитор F.I.Sh:</span><span className="font-bold truncate max-w-[150px]">{courier.name || '________________'}</span>
                                        </div>
                                        <div className="pt-2 border-b border-black flex justify-between">
                                            <span>Подпись получателя:</span><span className="text-[8px] text-gray-400 italic">(подпись)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-20 flex justify-between items-end opacity-20 text-[8px] font-mono tracking-tighter">
                                    <p>System Hash: {crypto.randomUUID().slice(0, 8).toUpperCase()}</p>
                                    <p>SAP Mvmt 261 / Stock Deduction Confirmed</p>
                                    <p>Printed: {format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function GoodsIssueWaybillTab() {
    const { addDocument } = useWarehouseStore();
    const { ocrContracts } = useFinanceStore();

    const [step, setStep] = useState<GIStep>('gate');
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    // Mock Database Local State
    const [localStock, setLocalStock] = useState<LocalMaterial[]>(MOCK_WAREHOUSE_DB);

    // Picking Cart State
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Live Search State
    const [skuSearch, setSkuSearch] = useState('');
    const [selectedFoundMaterial, setSelectedFoundMaterial] = useState<LocalMaterial | null>(null);
    const [selectedBinId, setSelectedBinId] = useState<string>('');
    const [pickQty, setPickQty] = useState<string>('');

    const [courier, setCourier] = useState<CourierData>({
        name: '', doverennostNo: '', validUntil: '', issueDate: format(new Date(), 'dd.MM.yyyy')
    });
    const [nextDocNo, setNextDocNo] = useState('');

    const salesContracts = useMemo(() => 
        ocrContracts.filter(c => c.type === 'SALES (SOTUV)'),
        [ocrContracts]
    );

    const clientCompanies = useMemo(() =>
        salesContracts.map(c => ({
            name: c.party,
            address: "Asaka, Andijan region, Uzbekistan",
            inn: "200112233",
            mfo: "00821",
            account: "20210000300987654321",
            bank: "NBU Bank"
        })), [salesContracts]
    );

    const filteredClients = useMemo(() =>
        clientSearch.length === 0
            ? clientCompanies
            : clientCompanies.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
        [clientSearch, clientCompanies]
    );

    // Auto-fetch contract once client selected
    const handleSelectClient = (clientName: string) => {
        setSelectedClient(clientName);
        setClientSearch('');
        const ocrContract = salesContracts.find(c => c.party === clientName) || null;
        if (ocrContract) {
            const mappedContract: Contract = {
                id: ocrContract.id,
                contractNumber: ocrContract.id,
                date: ocrContract.validUntil,
                supplier: {
                    name: 'UZ-TONG HONG CO., LTD',
                    address: 'Andijan region, Asaka city, Uzbekistan',
                    inn: '201234567',
                    mfo: '00440',
                    account: '20208000600123456001',
                    bank: 'Asaka Bank'
                },
                receiver: {
                    name: ocrContract.party,
                    address: 'Asaka, Andijan region, Uzbekistan',
                    inn: '200112233',
                    mfo: '00821',
                    account: '20210000300987654321',
                    bank: 'NBU Bank'
                },
                materials: ocrContract.allocatedItems.map(item => {
                    const whItem = MOCK_WAREHOUSE_DB.find(w => w.sku === item.sku);
                    return {
                        sku: item.sku,
                        description: whItem ? whItem.name : `Contract SKU ${item.sku}`,
                        uom: whItem ? whItem.unit : 'шт',
                        unitPrice: item.contractPrice,
                        expectedQty: item.maxLimit
                    };
                })
            };
            setSelectedContract(mappedContract);
        } else {
            setSelectedContract(null);
        }
    };

    // Load Picking Stage
    const handleStartPicking = () => {
        if (!selectedClient || !selectedContract) { toast.error('Select a Client Company first'); return; }
        setStep('picking');
        toast.success(`Direct picking session started for: ${selectedClient}`);
    };

    // Live Material Search Results (Mock DB)
    const searchResults = useMemo(() => {
        if (skuSearch.length < 2) return [];
        return localStock.filter(s =>
            s.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
            s.name.toLowerCase().includes(skuSearch.toLowerCase())
        );
    }, [skuSearch, localStock]);

    // Bins for selected material (Mock DB)
    const availableBins = useMemo(() => {
        if (!selectedFoundMaterial) return [];
        return selectedFoundMaterial.bins.filter(b => b.stock > 0);
    }, [selectedFoundMaterial]);

    const handleSelectMaterial = (m: LocalMaterial) => {
        setSelectedFoundMaterial(m);
        setSkuSearch(m.sku);
        setSelectedBinId('');
        setPickQty('');
    };

    // Add to Cart Logic (Mock DB)
    const handleAddToCart = () => {
        if (!selectedFoundMaterial || !selectedBinId || !pickQty) {
            toast.error('Complete all search fields'); return;
        }
        const qty = parseFloat(pickQty);
        const bin = selectedFoundMaterial.bins.find(b => b.address === selectedBinId);

        if (!bin || qty <= 0 || qty > bin.stock) {
            toast.error(`Invalid quantity. Available in ${selectedBinId}: ${bin?.stock || 0}`); return;
        }

        // --- Guardrail: B2B Contract Max Limit Check ---
        const activeOcrContract = ocrContracts.find(c => c.id === selectedContract?.id);
        const contractItem = activeOcrContract?.allocatedItems?.find(i => i.sku === selectedFoundMaterial.sku);
        if (contractItem) {
            const currentQty = contractItem.currentQty || 0;
            const alreadyInCart = cartItems
                .filter(item => item.materialId === selectedFoundMaterial.sku)
                .reduce((sum, item) => sum + item.qty, 0);
            if (currentQty + alreadyInCart + qty > contractItem.maxLimit) {
                toast.error("Shartnoma limiti to'lgan! (Contract Limit Exceeded)");
                return;
            }
        }

        // --- Pricing: Fetch Contract Price & Apply QQS (VAT) ---
        let finalUnitPrice = selectedFoundMaterial.price;
        if (activeOcrContract && contractItem) {
            // Price * Qty * 1.12
            finalUnitPrice = contractItem.contractPrice * (1 + activeOcrContract.vatRate);
        }

        // 1. Deduct from local stock state
        setLocalStock(prev => prev.map(m => {
            if (m.sku === selectedFoundMaterial.sku) {
                return {
                    ...m,
                    bins: m.bins.map(b => b.address === selectedBinId ? { ...b, stock: b.stock - qty } : b)
                };
            }
            return m;
        }));

        // 2. Append to cart
        const newItem: CartItem = {
            id: crypto.randomUUID(),
            materialId: selectedFoundMaterial.sku,
            description: selectedFoundMaterial.name,
            binId: selectedBinId,
            qty,
            uom: selectedFoundMaterial.unit,
            unitPrice: finalUnitPrice,
        };
        setCartItems(prev => [newItem, ...prev]);

        // 3. Reset search
        setSkuSearch('');
        setSelectedFoundMaterial(null);
        setSelectedBinId('');
        setPickQty('');
        toast.success(`✓ Added ${qty} ${selectedFoundMaterial.unit} to dispatch cart`);
    };

    const handleRemoveFromCart = (id: string) => {
        const item = cartItems.find(i => i.id === id);
        if (!item) return;

        // Revert local stock
        setLocalStock(prev => prev.map(m => {
            if (m.sku === item.materialId) {
                return {
                    ...m,
                    bins: m.bins.map(b => b.address === item.binId ? { ...b, stock: b.stock + item.qty } : b)
                };
            }
            return m;
        }));
        setCartItems(prev => prev.filter(i => i.id !== id));
    };

    // Transition to Preview
    const handleTransitionPreview = () => {
        if (cartItems.length === 0) {
            toast.error('Dispatch cart is empty'); return;
        }

        // Sequential Numbering Logic: Base 10001 + total historical documents
        const lastSerial = useWarehouseStore.getState().documents.filter(d => d.type === 'GOODS_ISSUE').length;
        const nextNo = (10001 + lastSerial).toString();

        setNextDocNo(nextNo);
        setStep('preview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Final confirm → store + print
    const handleConfirmPrint = () => {
        const fullDocId = `GI-${nextDocNo}`;
        addDocument({
            documentId: `${fullDocId}-${Date.now()}`,
            postDate: new Date().toISOString(),
            type: 'GOODS_ISSUE', mvmt: 261,
            reference: nextDocNo, plant: 'P001', sloc: 'WH01',
            lineItems: cartItems.map(l => ({
                materialId: l.materialId, description: l.description, qty: l.qty, unit: l.uom, amount: l.qty * l.unitPrice
            })),
            clientName: selectedClient,
            courier: courier.name,
            doverennost: courier.doverennostNo,
            validUntil: courier.validUntil
        });

        // Increment B2B contract delivered volume
        if (selectedContract) {
            cartItems.forEach(item => {
                useFinanceStore.getState().incrementOcrContractQty(selectedContract.id, item.materialId, item.qty);
            });
        }

        window.print();
        toast.success(`Success: Document ${fullDocId} finalized and printed.`);
        handleReset();
    };

    const handleReset = () => {
        setStep('gate'); setClientSearch(''); setSelectedClient('');
        setSelectedContract(null); setCartItems([]);
        setSkuSearch(''); setSelectedFoundMaterial(null); setSelectedBinId(''); setPickQty('');
        setCourier({ name: '', doverennostNo: '', validUntil: '', issueDate: format(new Date(), 'dd.MM.yyyy') });
        setLocalStock(MOCK_WAREHOUSE_DB); // Reload master data on reset
    };


    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="w-full pb-20 space-y-5">
            {/* Stages */}
            {step === 'preview' && selectedContract && (
                <GIPreviewStage
                    lines={cartItems}
                    contract={selectedContract}
                    docNo={nextDocNo}
                    courier={courier}
                    setCourier={setCourier}
                    onPrint={handleConfirmPrint}
                    onBack={() => setStep('picking')}
                />
            )}

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/20 flex items-center justify-center">
                        <FileOutput className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Goods Issue (Raskhod)</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">SAP S/4HANA — MIGO Mvmt 261 · Client Staging Workflow</p>
                    </div>
                </div>
                {step !== 'gate' && (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase">
                            {(['gate', 'picking', 'preview'] as GIStep[]).map((s, i) => (
                                <React.Fragment key={s}>
                                    {i > 0 && <ArrowRight className="w-3 h-3 text-slate-600" />}
                                    <span className={step === s ? 'text-blue-400' : 'text-slate-600'}>
                                        {s === 'gate' ? 'Client' : s === 'picking' ? 'Picking' : 'Preview'}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={handleReset} className="border-slate-700 text-slate-400 h-8 text-[10px] uppercase font-black">
                            <X className="w-3 h-3 mr-1" /> Reset
                        </Button>
                    </div>
                )}
            </div>

            {/* ── GATE: Client + Order Entry ── */}
            {step === 'gate' && (
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardContent className="p-8">
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="text-center mb-2">
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Gate Control — Select Client & Load Order</h3>
                                <p className="text-[10px] text-slate-500 mt-1">Mandatory: Select client company before loading reservation</p>
                            </div>

                            {/* Client Company Dropdown */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Select Client Company <span className="text-rose-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        value={selectedClient ? selectedClient : clientSearch}
                                        onChange={e => { setClientSearch(e.target.value); setSelectedClient(''); setSelectedContract(null); }}
                                        placeholder="Search client company..."
                                        className="bg-slate-950 border-slate-700 h-11 pl-9 text-sm"
                                    />
                                    {selectedClient && (
                                        <button onClick={() => { setSelectedClient(''); setSelectedContract(null); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {/* Dropdown results */}
                                {!selectedClient && (clientSearch.length > 0 || true) && (
                                    <div className="border border-slate-700 rounded-xl overflow-hidden mt-1">
                                        {filteredClients.map(c => (
                                            <button key={c.name} onClick={() => handleSelectClient(c.name)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-800 last:border-0">
                                                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-200">{c.name}</p>
                                                    <p className="text-[10px] text-slate-500">{c.address}</p>
                                                </div>
                                                {selectedClient === c.name && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
                                            </button>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <div className="px-4 py-3 text-xs text-slate-500 text-center">No companies found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Auto-populated contract info */}
                            {selectedContract && (
                                <div className="bg-blue-600/5 border border-blue-600/20 rounded-xl p-4 space-y-2">
                                    <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-3">Auto-Fetched Contract Data</p>
                                    <div className="grid grid-cols-3 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-500 font-bold mb-0.5">Contract №</p>
                                            <p className="text-white font-black font-mono">{selectedContract.contractNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 font-bold mb-0.5">Contract Date</p>
                                            <p className="text-white font-black">{selectedContract.date}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 font-bold mb-0.5">Destination</p>
                                            <p className="text-white font-black text-[10px] leading-tight">{selectedContract.receiver.address}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-blue-600/10 grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-500 font-bold mb-0.5">Receiver INN</p>
                                            <p className="font-mono text-slate-300">{selectedContract.receiver.inn}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 font-bold mb-0.5">{selectedContract.materials.length} Material(s) on Contract</p>
                                            <p className="text-slate-300 text-[10px]">{selectedContract.materials.map(m => m.sku).join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Load Session Button */}
                            <div className="pt-4">
                                <Button onClick={handleStartPicking} disabled={!selectedContract}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-14 font-black uppercase tracking-widest gap-3 text-base disabled:opacity-40">
                                    <FileOutput className="w-6 h-6" /> Open Direct Dispatch Session
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── PICKING STAGE: Search & Cart ── */}
            {step === 'picking' && (
                <div className="space-y-6">
                    {/* Status bar */}
                    <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 font-black text-[10px]">
                                Client: {selectedClient}
                            </Badge>
                            <Badge className="bg-slate-800 text-slate-400 border-slate-700 font-black text-[10px]">{selectedContract?.contractNumber}</Badge>
                            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 font-black text-[10px]">
                                {cartItems.length} Items in Cart
                            </Badge>
                        </div>
                    </div>

                    {/* Search & Selection Grid */}
                    <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500 overflow-visible shadow-2xl">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                {/* Material Search */}
                                <div className="md:col-span-5 space-y-2 relative">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Search Material (SKU / Description)</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <Input
                                            value={skuSearch}
                                            onChange={e => { setSkuSearch(e.target.value); setSelectedFoundMaterial(null); }}
                                            placeholder="Type SKU e.g. DT-FL..."
                                            className="bg-slate-950 border-slate-700 h-11 pl-9 text-sm"
                                        />
                                        {skuSearch.length > 0 && (
                                            <button onClick={() => { setSkuSearch(''); setSelectedFoundMaterial(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    {/* Dropdown Results */}
                                    {skuSearch.length >= 2 && !selectedFoundMaterial && (
                                        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-60 overflow-y-auto">
                                            {searchResults.map(m => (
                                                <button key={m.sku} onClick={() => handleSelectMaterial(m)}
                                                    className="w-full px-4 py-3 hover:bg-slate-800 transition-colors text-left flex items-center gap-3 border-b border-slate-800 last:border-0">
                                                    <Package className="w-4 h-4 text-blue-500 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-white">{m.sku}</p>
                                                        <p className="text-[10px] text-slate-500">{m.name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {searchResults.length === 0 && <div className="px-4 py-3 text-xs text-slate-500">No materials found</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Dynamic Bin Selection */}
                                <div className="md:col-span-3 space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Select Source Bin (Availability)</Label>
                                    <select
                                        disabled={!selectedFoundMaterial}
                                        value={selectedBinId}
                                        onChange={e => setSelectedBinId(e.target.value)}
                                        className="w-full bg-slate-950 border-slate-700 h-11 rounded-lg px-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-30"
                                    >
                                        <option value="">Select Address...</option>
                                        {availableBins.map(b => (
                                            <option key={b.address} value={b.address}>
                                                {b.address} ({b.stock} {selectedFoundMaterial?.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Release Qty</Label>
                                    <Input
                                        type="number"
                                        disabled={!selectedBinId}
                                        value={pickQty}
                                        onChange={e => setPickQty(e.target.value)}
                                        placeholder="Qty..."
                                        className="bg-slate-950 border-slate-700 h-11 text-right font-mono"
                                    />
                                </div>

                                {/* Add Button */}
                                <div className="md:col-span-2">
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={!pickQty}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-500 font-black uppercase text-[11px] tracking-widest gap-2 shadow-lg shadow-blue-600/20"
                                    >
                                        <Package className="w-4 h-4" /> Post Picking
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Active Outbound Cart Ledger */}
                    <Card className="bg-slate-900/60 border-slate-800 overflow-hidden min-h-[300px]">
                        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Active Dispatch Cart Ledger</span>
                            {cartItems.length > 0 && (
                                <span className="text-[10px] font-bold text-blue-400">{cartItems.length} line item(s) accumulated</span>
                            )}
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest w-8">#</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Material / SKU</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center w-24">Bin</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-right w-24">Qty</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-right w-32">Amount (UZS)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center w-16">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cartItems.map((item, idx) => (
                                    <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/20 group">
                                        <TableCell className="text-slate-600 font-mono text-xs">{idx + 1}</TableCell>
                                        <TableCell className="font-mono text-xs text-blue-400 font-black">{item.materialId}</TableCell>
                                        <TableCell className="text-sm text-slate-300">{item.description}</TableCell>
                                        <TableCell className="text-center font-bold text-amber-500 text-xs">{item.binId}</TableCell>
                                        <TableCell className="text-right font-black text-white text-sm">
                                            {item.qty.toLocaleString()} <span className="text-slate-600 text-[10px]">{item.uom}</span>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400 text-xs font-mono">
                                            {(item.qty * item.unitPrice).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <button onClick={() => handleRemoveFromCart(item.id)} className="text-slate-600 hover:text-rose-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {cartItems.length === 0 && (
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableCell colSpan={7} className="h-40 text-center text-slate-600 italic">
                                            <div className="flex flex-col items-center gap-3">
                                                <Package className="w-8 h-8 opacity-20" />
                                                <p className="text-sm">Dispatch cart is empty. Start by searching an SKU above.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Global Execution Button */}
                    <div className="pt-6">
                        <Button
                            onClick={handleTransitionPreview}
                            disabled={cartItems.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-16 rounded-xl font-black text-xl uppercase tracking-widest gap-4 shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-30"
                        >
                            <ShieldCheck className="w-7 h-7" />
                            OTPUSTIL MATERIAL (COMPLETE RELEASE)
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
