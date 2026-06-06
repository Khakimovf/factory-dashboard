import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
    Barcode, Scan, CheckCircle2, ChevronRight, PackageCheck,
    Truck, ClipboardList, X, History, MapPin, User, FileText,
    ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { useWarehouseStore } from '../../store/warehouseStore';

// ─── Mock ASN Data ───────────────────────────────────────────────────────────

const MOCK_ASNS = [
    { id: 'ASN-2026-441', supplier: 'ChemPoly Solutions', eta: '2026-05-31 14:00', items: 3, status: 'IN_TRANSIT' },
    { id: 'ASN-2026-442', supplier: 'Industrial Parts Ltd', eta: '2026-05-31 16:30', items: 5, status: 'AT_PORT' },
    { id: 'ASN-2026-443', supplier: 'SafetyFirst UZ', eta: '2026-06-01 09:00', items: 2, status: 'SCHEDULED' },
];

export const GoodsReceiptProcessor: React.FC = () => {
    const { addStock, addDocument } = useWarehouseStore();
    const [scanValue, setScanValue] = useState('');
    const [activeGR, setActiveGR] = useState<any>(null);

    // Modals state
    const [showManualModal, setShowManualModal] = useState(false);
    const [showASNModal, setShowASNModal] = useState(false);
    const [showTruckModal, setShowTruckModal] = useState<any>(null);

    const simulateScan = () => {
        if (!scanValue) return;
        toast.success('Material Scanned: ' + scanValue);
        setActiveGR({
            id: "GR-" + Math.floor(Math.random() * 100000),
            supplier: "Global Materials Ltd",
            items: [
                { sku: "RM-PP-001", name: "Polypropylene Resin", qty: 2500, unit: "kg", status: "Pending" },
                { sku: "RM-MB-BLACK", name: "Masterbatch Black", qty: 200, unit: "kg", status: "Pending" }
            ],
            gate: "Logistics Gate 2",
            truckPlate: "UZ 01 A 001 AA"
        });
        setScanValue('');
    };

    const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const po = formData.get('po') as string;
        const matId = formData.get('matId') as string;
        const qty = Number(formData.get('qty'));
        const unit = formData.get('unit') as string;
        const bin = formData.get('bin') as string;

        // Mock update store
        addStock({ materialId: matId, totalStock: qty, unrestricted: qty, binLocation: bin, unit });
        addDocument({
            documentId: `MAT-${Math.floor(Math.random() * 1000000)}`,
            postDate: new Date().toISOString(),
            type: 'GOODS_RECEIPT',
            mvmt: 101,
            reference: po,
            plant: 'P001',
            sloc: 'WH01',
            lineItems: [{ materialId: matId, description: 'Manual Receipt', qty, unit }]
        });

        toast.success(`GR Posted: ${po}`, { description: `${qty} ${unit} of ${matId} registered.` });
        setShowManualModal(false);
    };

    const loadASN = (asn: any) => {
        setActiveGR({
            id: asn.id,
            supplier: asn.supplier,
            items: [
                { sku: "RM-PL-001", name: "Plastic Component A", qty: 500, unit: "pcs", status: "Pending" },
                { sku: "RM-PL-002", name: "Plastic Component B", qty: 300, unit: "pcs", status: "Pending" }
            ],
            gate: "Main Logistics Gate",
            truckPlate: "UZ 10 A 777 AA"
        });
        setShowASNModal(false);
        toast.info(`ASN ${asn.id} loaded for processing`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                {/* Scan Card */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Barcode className="w-20 h-20" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white font-black uppercase tracking-tight">High Speed Intake</CardTitle>
                        <CardDescription>Scan ASN, Invoice or Material Code</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-pulse" />
                                <Input
                                    placeholder="Waiting for scanner..."
                                    className="pl-9 bg-slate-950 border-emerald-500/30 focus-visible:ring-emerald-500 text-white font-mono"
                                    value={scanValue}
                                    onChange={e => setScanValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && simulateScan()}
                                />
                            </div>
                            <Button onClick={simulateScan} className="bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-xs">
                                Process
                            </Button>
                        </div>
                        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <History className="w-3 h-3" /> Recent Activity
                            </h4>
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex items-center justify-between text-[11px] group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="font-mono font-bold text-slate-300">GR-224859</span>
                                        </div>
                                        <span className="text-slate-500 font-mono">Bin: A-10-02</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Truck Queue */}
                <Card className="bg-slate-900 border-slate-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-400" />
                            Incoming Logistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { id: 'TRK-001-AB', supplier: 'SJS Logistics', eta: '14:30 — TODAY', plate: '01 A 001 AA', driver: 'Karimov A.' },
                            { id: 'TRK-002-AB', supplier: 'TransExpress', eta: '16:00 — TODAY', plate: '10 B 222 BB', driver: 'Ivanov S.' }
                        ].map(trk => (
                            <div
                                key={trk.id}
                                onClick={() => setShowTruckModal(trk)}
                                className="flex flex-col p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition-all cursor-pointer group active:scale-[0.98]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase font-mono tracking-wider">{trk.id}</span>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border-blue-500/20 py-0.5 px-2">At Gate</Badge>
                                </div>
                                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                    <span>{trk.supplier}</span>
                                    <span className="text-slate-400">{trk.eta}</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Main Processor Panel */}
            <div className="lg:col-span-2">
                {activeGR ? (
                    <Card className="bg-slate-900 border-slate-800 border-t-4 border-t-emerald-500 shadow-2xl h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                        <CardHeader className="flex flex-row items-center justify-between py-6">
                            <div>
                                <CardTitle className="flex items-center gap-3 text-white font-black uppercase tracking-tight">
                                    <ClipboardList className="w-6 h-6 text-emerald-500" />
                                    Goods Receipt: {activeGR.id}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-4 mt-2 font-bold uppercase text-[10px] tracking-widest">
                                    <span className="flex items-center gap-1.5 text-slate-300"><User className="w-3.5 h-3.5 text-slate-500" /> {activeGR.supplier}</span>
                                    <span className="flex items-center gap-1.5 text-slate-300"><Truck className="w-3.5 h-3.5 text-slate-500" /> {activeGR.truckPlate}</span>
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="border-slate-800 font-bold uppercase text-[10px]" onClick={() => setActiveGR(null)}>Discard</Button>
                        </CardHeader>
                        <CardContent className="flex-1 px-8">
                            <div className="rounded-2xl border border-slate-800 overflow-hidden mb-6 bg-slate-950/50">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4 text-left">SKU / Material</th>
                                            <th className="px-6 py-4 text-right">Target</th>
                                            <th className="px-6 py-4 text-right">Actual</th>
                                            <th className="px-6 py-4 text-center">Batch</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {activeGR.items.map((item: any, idx: number) => (
                                            <tr key={idx} className="group hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-xs font-bold text-blue-400 mb-1">{item.sku}</span>
                                                        <span className="text-slate-100 font-bold text-sm tracking-tight">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-400">
                                                    {item.qty} <span className="text-[10px] opacity-50">{item.unit}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Input
                                                        className="h-10 bg-slate-950 border-slate-800 text-right font-black w-28 ml-auto focus:border-emerald-500/50 ring-0"
                                                        defaultValue={item.qty}
                                                        type="number"
                                                    />
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase">
                                                        MAT-L1-{Math.floor(Math.random() * 100)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                        <div className="p-8 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                            <div className="flex gap-8">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Storage Strategy</span>
                                    <span className="font-black text-xs text-white flex items-center gap-2">
                                        <MapPin className="w-3 h-3 text-emerald-500" />
                                        AUTO-LANE / FIFO
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Inspection State</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input type="checkbox" id="qc_check" className="w-4 h-4 bg-slate-900 border-slate-700 rounded accent-emerald-500" />
                                        <label htmlFor="qc_check" className="text-xs font-black text-amber-500 cursor-pointer">QUALITY INSPECTION REQ.</label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-rose-900/50 bg-rose-900/10 text-rose-500 hover:bg-rose-900/20 font-black uppercase h-12 px-6" onClick={() => { toast.error('Shipment Rejected & Returned'); setActiveGR(null); }}>
                                    Reject & Return
                                </Button>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-10 gap-3 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-900/20" onClick={() => {
                                    toast.success('Goods Receipt Posted', { description: `Document ${activeGR.id} synchronized with SAP S/4HANA` });
                                    setActiveGR(null);
                                }}>
                                    <PackageCheck className="w-5 h-5" />
                                    Post Goods Receipt
                                </Button>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="h-full border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 group transition-all hover:bg-slate-900/50">
                        <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-500 shadow-2xl relative">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
                            <Scan className="w-10 h-10 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Awaiting Logistics Entry</h3>
                        <p className="text-slate-500 max-w-sm mb-10 font-bold leading-relaxed">
                            Scan a <span className="text-emerald-500">Carrier ID</span>, Delivery Note or Material Label to initialize the digital intake sequence.
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" className="border-slate-800 bg-slate-900 hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] h-12 px-6" onClick={() => setShowManualModal(true)}>
                                <History className="w-4 h-4 mr-2" /> Enter manually
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest text-[10px] h-12 px-8" onClick={() => setShowASNModal(true)}>
                                <ClipboardList className="w-4 h-4 mr-2" /> Fetch ASNs
                            </Button>
                        </div>
                    </div>
                )}

                {/* GR History Section */}
                <div className="mt-8">
                    <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                                    <History className="w-4 h-4 text-emerald-500" /> GR History
                                </CardTitle>
                                <CardDescription>Past 30 days goods receipt records</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Input type="date" className="h-8 bg-slate-950 border-slate-800 text-[10px] w-32" />
                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase">Filter</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-[11px]">
                                <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Supplier</th>
                                        <th className="px-6 py-3 text-left">PO #</th>
                                        <th className="px-6 py-3 text-right">Items</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {[
                                        { date: '2026-06-04', supplier: 'ChemPoly', po: 'PO-9912', items: 3, status: 'Completed' },
                                        { date: '2026-06-03', supplier: 'Industrial Ltd', po: 'PO-9910', items: 5, status: 'Completed' },
                                        { date: '2026-06-02', supplier: 'Global Mat.', po: 'PO-9908', items: 12, status: 'QC Hold' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="px-6 py-3 font-mono">{row.date}</td>
                                            <td className="px-6 py-3 font-bold text-slate-300">{row.supplier}</td>
                                            <td className="px-6 py-3 font-mono text-blue-400">{row.po}</td>
                                            <td className="px-6 py-3 text-right font-black">{row.items}</td>
                                            <td className="px-6 py-3 text-center">
                                                <Badge className={`text-[9px] font-black uppercase ${row.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {row.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Modals ─────────────────────────────────────────────────────────── */}

            {/* Manual Entry Modal */}
            <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Manual Goods Receipt Entry">
                <form onSubmit={handleManualSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">PO Number</Label>
                            <Input name="po" placeholder="PO-100293" required className="bg-slate-950 border-slate-800 font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Material ID</Label>
                            <Input name="matId" placeholder="DT-FL-001" required className="bg-slate-950 border-slate-800 font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Quantity</Label>
                            <Input name="qty" type="number" placeholder="0.00" required className="bg-slate-950 border-slate-800 font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Unit of Measure</Label>
                            <select name="unit" className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md text-sm px-3 font-mono text-white outline-none focus:border-blue-500/50">
                                <option>pcs</option><option>kg</option><option>m</option><option>kit</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Target Bin Location</Label>
                            <Input name="bin" placeholder="A-01-01" required className="bg-slate-950 border-slate-800 font-mono" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[11px] h-12">
                            Post Goods Receipt
                        </Button>
                        <Button type="button" variant="ghost" className="text-slate-500 font-black uppercase tracking-widest text-[11px]" onClick={() => setShowManualModal(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ASN Modal */}
            <Modal isOpen={showASNModal} onClose={() => setShowASNModal(false)} title="Active Advanced Shipping Notices (ASN)">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {MOCK_ASNS.map(asn => (
                        <div key={asn.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-blue-500/40 transition-colors">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-black text-blue-400 text-sm tracking-tight">{asn.id}</span>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-700 text-slate-400">{asn.status}</Badge>
                                </div>
                                <div className="text-[11px] font-bold text-slate-100 flex items-center gap-2">
                                    {asn.supplier} • <span className="text-slate-500">{asn.items} line items</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">ETA: {asn.eta}</div>
                            </div>
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] h-9"
                                onClick={() => loadASN(asn)}
                            >
                                Load to GR
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <button className="text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 transition-colors tracking-widest">
                        Refresh ASN List →
                    </button>
                </div>
            </Modal>

            {/* Truck Detail Modal */}
            <Modal
                isOpen={!!showTruckModal}
                onClose={() => setShowTruckModal(null)}
                title={showTruckModal ? `Truck Detail: ${showTruckModal.id}` : ''}
            >
                {showTruckModal && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Truck className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-white font-mono">{showTruckModal.plate}</p>
                                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">At Terminal Gate</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-100 uppercase">{showTruckModal.driver}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase">Driver Assigned</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Shipment Manifest
                            </h4>
                            <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                                {[
                                    { sku: 'PL-AB-004', name: 'ABS Plastic Granule', qty: '5000', unit: 'kg' },
                                    { sku: 'SC-M8-005', name: 'M8 Bolt Set', qty: '10000', unit: 'pcs' }
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0 border-slate-800 text-sm">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold text-blue-400">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                        <span className="font-black text-slate-100 italic">{item.qty} {item.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[11px] h-12 shadow-lg shadow-emerald-900/20"
                                onClick={() => { toast.success(`Admission granted for ${showTruckModal.id}`); setShowTruckModal(null); }}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Accept Delivery
                            </Button>
                            <Button
                                variant="outline"
                                className="border-rose-900/50 bg-rose-900/10 text-rose-500 hover:bg-rose-900/20 font-black uppercase tracking-widest text-[11px] h-12"
                                onClick={() => { toast.error(`Delivery Refused: ${showTruckModal.id}`); setShowTruckModal(null); }}
                            >
                                <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
