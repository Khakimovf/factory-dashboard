import { useState, useMemo, useEffect } from 'react';
import {
    Truck,
    ArrowRightCircle,
    ArrowLeftCircle,
    Search,
    Clock,
    User,
    Package,
    MapPin,
    ShieldCheck,
    LayoutGrid,
    History,
    QrCode,
    LogOut,
    Download,
    Filter,
    CheckCircle2,
    XCircle,
    Building2,
    FileText,
    Calendar,
    ArrowRight,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { initialSuppliers } from '../suppliers/SuppliersPage';
import { useWarehouseStore, MaterialDocument } from '../../store/warehouseStore';
import * as XLSX from 'xlsx';

interface GateEntry {
    id: string;
    time: string;
    date: string;
    type: 'IN' | 'OUT';
    plateNumber: string;
    driver: string;
    subject: string; // Supplier or Client
    cargo: string;
    quantity: number | string;
    unit: string;
    destination?: string;
    status: 'Hududda' | 'Chiqib ketdi';
    operator: string;
    post: string;
    waybillRef?: string;
}

interface Operator {
    id: string;
    name: string;
    photo: string;
}

const POSTS = ['POST-1', 'POST-2', 'POST-3', 'POST-4'];
const MOCK_OPERATORS: Operator[] = [
    { id: 'VGM-101', name: 'Azamat Qosimov', photo: 'https://i.pravatar.cc/150?u=azamat' },
    { id: 'VGM-102', name: 'Rustam Ergashev', photo: 'https://i.pravatar.cc/150?u=rustam' }
];

// 📋 MOCK DOCUMENT DATABASE FOR DEMO PRESENTATION
const MOCK_GATE_WAYBILL_DB: Record<string, any> = {
    // OUTBOUND DISPATCH (CHIQISH UCHUN - GOODS ISSUE)
    "10002": {
        waybillId: "GI-10002",
        client: "UzAuto Motors JSC",
        contract: "Contract №120-A",
        courier: "Karimov Jasur Rustamovich",
        doverennost: "DOV-2026-0451",
        validUntil: "01.07.2026",
        truckPlate: "01 A 001 AA",
        items: [
            { sku: "26211281", name: "Rear Pillar Trim Assembly", qty: 100, unit: "шт" },
            { sku: "26211286", name: "Door Trim Inner Panel Left", qty: 400, unit: "шт" }
        ],
        totalAmount: "21 200 000 UZS"
    },

    // INBOUND SUPPLIER ARRIVAL (KIRISH UCHUN - GOODS RECEIPT REFERENCE)
    "144414": {
        waybillId: "GR-144414",
        supplier: "Hardware Supply Co.",
        driver: "Ergashev Rustam",
        truckPlate: "10 B 777 BB",
        description: "M6 Hexagonal Flange Bolts & Clips",
        totalQty: "50 000 pcs"
    }
};

export function LogisticsGatePage() {
    const { t } = useLanguage();
    const { documents } = useWarehouseStore();

    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [authorizedOperator, setAuthorizedOperator] = useState<Operator | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [historySearchQuery, setHistorySearchQuery] = useState('');

    // Persistent storage for demo purposes
    const [entries, setEntries] = useState<GateEntry[]>(() => {
        const saved = localStorage.getItem('vgm_entries');
        return saved ? JSON.parse(saved) : [
            {
                id: '1',
                time: '18:30:15',
                date: '2026-03-07',
                type: 'IN',
                plateNumber: '01 A 777 AA',
                driver: 'Azamat Qosimov',
                subject: 'Metallurgiya TMC',
                cargo: 'Vagon detallari',
                quantity: 500,
                unit: 'kg',
                status: 'Hududda',
                operator: 'Azamat Qosimov',
                post: 'POST-1'
            },
            {
                id: '2',
                time: '19:10:05',
                date: '2026-03-07',
                type: 'OUT',
                plateNumber: '01 555 BBB',
                driver: 'Rustam Ergashev',
                subject: 'Tayyor mahsulot',
                cargo: 'Ventilyatorlar',
                quantity: 120,
                unit: 'dona',
                destination: 'Samarqand Ombor',
                status: 'Chiqib ketdi',
                operator: 'Rustam Ergashev',
                post: 'POST-2'
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('vgm_entries', JSON.stringify(entries));
    }, [entries]);

    // KIRISH (INBOUND) Form states
    const [inPlate, setInPlate] = useState('');
    const [inDriver, setInDriver] = useState('');
    const [inSupplier, setInSupplier] = useState('');
    const [inInvoiceRef, setInInvoiceRef] = useState('');
    const [inCargo, setInCargo] = useState('');
    const [inQuantity, setInQuantity] = useState('');
    const [inUnit, setInUnit] = useState('dona');

    // CHIQISH (OUTBOUND) Form states
    const [waybillSearch, setWaybillSearch] = useState('');
    const [verifiedWaybill, setVerifiedWaybill] = useState<any | null>(null);
    const [outPlate, setOutPlate] = useState('');

    // ⚡️ FAST-FILL FOR KIRISH (INBOUND)
    useEffect(() => {
        if (inInvoiceRef.length < 4) return;

        const q = inInvoiceRef.trim().toLowerCase();

        // 1. Check Store (REAL DATA - prioritize GR)
        const foundGR = documents.find(doc =>
            doc.type === 'GOODS_RECEIPT' &&
            (doc.documentId.toLowerCase().includes(q) || (doc.reference && doc.reference.toLowerCase() === q))
        );

        if (foundGR) {
            setInSupplier(foundGR.supplier || '');
            setInCargo(`${foundGR.lineItems.length} Materials Intake`);
            setInQuantity(foundGR.lineItems.reduce((acc, l) => acc + l.qty, 0).toString());
            setInUnit(foundGR.lineItems[0]?.unit || 'dona');
            toast.info(`Synced with Warehouse GR: ${foundGR.documentId}`);
            return;
        }

        // 2. Fallback to Mock DB for Demo
        if (MOCK_GATE_WAYBILL_DB[inInvoiceRef]) {
            const mock = MOCK_GATE_WAYBILL_DB[inInvoiceRef];
            if (mock.waybillId.startsWith('GR-')) {
                setInPlate(mock.truckPlate);
                setInDriver(mock.driver);
                setInSupplier(mock.supplier);
                setInCargo(mock.description);
                setInQuantity(mock.totalQty.split(' ')[0]);
                setInUnit('dona');
                toast.info("Fast-fill: Inbound document data matched.");
            }
        }
    }, [inInvoiceRef, documents]);

    // Logic: Look up waybill from store or mock DB
    const handleSearchWaybill = () => {
        if (waybillSearch.length < 3) return;

        const q = waybillSearch.trim().toLowerCase();

        // 1. Search in REAL Warehouse Store Documents
        const found = documents.find(doc =>
            (doc.documentId.toLowerCase().includes(q) || (doc.reference && doc.reference.toLowerCase() === q))
        );

        if (found) {
            setVerifiedWaybill(found);
            // If it has plate info or courier info, populate it
            if ((found as any).plate) setOutPlate((found as any).plate);
            toast.success(`Waybill Found: ${found.documentId}`);
            return;
        }

        // 2. Check Mock DB (Priority for Demo if not in store)
        if (MOCK_GATE_WAYBILL_DB[waybillSearch]) {
            const mock = MOCK_GATE_WAYBILL_DB[waybillSearch];
            if (mock.waybillId.startsWith('GI-')) {
                setVerifiedWaybill({
                    documentId: mock.waybillId,
                    postDate: new Date().toISOString(),
                    type: 'GOODS_ISSUE',
                    mvmt: 261,
                    reference: mock.contract,
                    plant: 'P001',
                    sloc: 'WH01',
                    lineItems: mock.items.map((i: any) => ({ materialId: i.sku, description: i.name, qty: i.qty, unit: i.unit })),
                    clientName: mock.client,
                    courier: mock.courier,
                    doverennost: mock.doverennost,
                    validUntil: mock.validUntil,
                    plate: mock.truckPlate,
                    isMock: true
                });
                setOutPlate(mock.truckPlate);
                toast.success(`Waybill Found (Demo): ${mock.waybillId}`);
                return;
            }
        }

        setVerifiedWaybill(null);
        toast.error("Waybill not found in warehouse registry");
    };

    const handleSelectPost = (post: string) => {
        setSelectedPost(post);
        setIsAuthModalOpen(true);
    };

    const handleAuthenticate = () => {
        setIsAuthenticating(true);
        setTimeout(() => {
            const randomOp = MOCK_OPERATORS[Math.floor(Math.random() * MOCK_OPERATORS.length)];
            setAuthorizedOperator(randomOp);
            setIsAuthenticating(false);
            setIsAuthModalOpen(false);
            toast.success(t('vgm.authorized') + ': ' + randomOp.name);
        }, 1500);
    };

    const handleLogout = () => {
        setAuthorizedOperator(null);
        setSelectedPost(null);
    };

    const handleInSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inPlate || !inDriver || !inSupplier || !inCargo || !inQuantity) {
            toast.error(t('qc.validation.required'));
            return;
        }

        const now = new Date();
        const newEntry: GateEntry = {
            id: Date.now().toString(),
            time: now.toLocaleTimeString(),
            date: now.toISOString().split('T')[0],
            type: 'IN',
            plateNumber: inPlate.toUpperCase(),
            driver: inDriver,
            subject: inSupplier,
            cargo: inCargo,
            quantity: inQuantity,
            unit: inUnit,
            status: 'Hududda',
            operator: authorizedOperator?.name || 'Unknown',
            post: selectedPost || 'N/A',
            waybillRef: inInvoiceRef
        };

        setEntries([newEntry, ...entries]);
        // Reset
        setInPlate(''); setInDriver(''); setInSupplier(''); setInInvoiceRef(''); setInCargo(''); setInQuantity('');
        toast.success(t('vgm.entry') + ' logged successfully.');
    };

    const handleOutVerification = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedWaybill || !outPlate) {
            toast.error("Please search/verify waybill and enter truck plate");
            return;
        }

        const now = new Date();
        const newEntry: GateEntry = {
            id: Date.now().toString(),
            time: now.toLocaleTimeString(),
            date: now.toISOString().split('T')[0],
            type: 'OUT',
            plateNumber: outPlate.toUpperCase(),
            driver: verifiedWaybill.courier || "Courier / Agent",
            subject: verifiedWaybill.clientName || verifiedWaybill.reference,
            cargo: `${verifiedWaybill.lineItems.length} Materials Dispatch`,
            quantity: verifiedWaybill.lineItems.reduce((acc: number, l: any) => acc + l.qty, 0),
            unit: verifiedWaybill.lineItems[0]?.unit || 'pcs',
            destination: verifiedWaybill.clientName || verifiedWaybill.reference,
            status: 'Chiqib ketdi',
            operator: authorizedOperator?.name || 'Unknown',
            post: selectedPost || 'N/A',
            waybillRef: verifiedWaybill.documentId
        };

        setEntries([newEntry, ...entries]);

        // Reset
        setWaybillSearch(''); setVerifiedWaybill(null); setOutPlate('');
        toast.success("Security Verification Passed. Exit Logged.");
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(entries);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "VGM Log");
        XLSX.writeFile(workbook, `VGM_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success(t('vgm.export') + ' successful');
    };

    const filteredToday = entries.filter(e => {
        const isToday = e.date === new Date().toISOString().split('T')[0];
        const matchesSearch = e.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (e.waybillRef && e.waybillRef.toLowerCase().includes(searchQuery.toLowerCase()));
        return isToday && matchesSearch;
    });

    const filteredHistory = entries.filter(e =>
        e.plateNumber.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        e.driver.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        e.operator.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (e.waybillRef && e.waybillRef.toLowerCase().includes(historySearchQuery.toLowerCase()))
    );

    if (!selectedPost) {
        return (
            <div className="min-h-full bg-slate-950 flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full text-center space-y-8"
                >
                    <div className="relative">
                        <div className="w-24 h-24 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative z-10">
                            <ShieldCheck className="w-14 h-14 text-indigo-500" />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">VGM TERMINAL</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2 italic">{t('vgm.title')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {POSTS.map((post, idx) => (
                            <motion.button
                                key={post}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleSelectPost(post)}
                                className="h-32 bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 transition-all rounded-3xl flex flex-col items-center justify-center gap-3 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                                <LayoutGrid className="w-8 h-8 text-slate-600 group-hover:text-indigo-500 transition-colors" />
                                <span className="text-xl font-black text-white tracking-tighter">{post}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-950 min-h-full space-y-8">
            {/* Auth Modal */}
            <Dialog open={isAuthModalOpen} onOpenChange={(open) => !isAuthenticating && !authorizedOperator && setSelectedPost(null)}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm rounded-[32px]">
                    <DialogHeader className="flex flex-col items-center pb-4">
                        <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
                            <QrCode className="w-8 h-8 text-indigo-500" />
                        </div>
                        <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">{t('vgm.scanId')}</DialogTitle>
                        <DialogDescription className="text-slate-400 text-center font-bold text-xs uppercase tracking-tight mt-2">
                            {t('vgm.scanInstruction')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-8 flex flex-col items-center justify-center space-y-6">
                        <div className="w-48 h-48 border-2 border-dashed border-slate-700 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                            {isAuthenticating ? (
                                <motion.div
                                    className="absolute inset-0 bg-indigo-500/20"
                                    initial={{ y: -200 }}
                                    animate={{ y: 200 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                />
                            ) : (
                                <div className="text-slate-600 group-hover:text-indigo-500 transition-colors flex flex-col items-center gap-2">
                                    <QrCode className="w-12 h-12" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('vgm.identifying')}</span>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleAuthenticate}
                            disabled={isAuthenticating}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest h-12 px-8 rounded-full"
                        >
                            {isAuthenticating ? t('vgm.identifying') : 'SIMULATE SCAN'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header */}
            {authorizedOperator && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative">
                            <Truck className="text-white w-7 h-7" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">VGM TERMINAL: {selectedPost}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[9px] font-black uppercase italic">SECURE MODE ACTIVE</Badge>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">• {t('vgm.title')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-slate-900/50 p-2 pr-4 rounded-2xl border border-slate-800">
                            <img src={authorizedOperator.photo} alt={authorizedOperator.name} className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-500/50" />
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('vgm.operator')}</p>
                                <p className="text-sm font-black text-white uppercase italic">{authorizedOperator.name}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="w-10 h-10 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {authorizedOperator && (
                <div className="space-y-8">
                    <Tabs defaultValue="dashboard" className="w-full">
                        <TabsList className="bg-slate-900 border border-slate-800 p-1 h-14 w-full justify-start max-w-md rounded-2xl mb-8">
                            <TabsTrigger value="dashboard" className="flex-1 rounded-xl font-black uppercase text-xs tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white h-full transition-all italic">
                                DASHBOARD
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex-1 rounded-xl font-black uppercase text-xs tracking-widest data-[state=active]:bg-indigo-600 data-[state=active]:text-white h-full transition-all italic gap-2">
                                {t('vgm.history')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="space-y-8 mt-0 outline-none">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* KIRISH (INBOUND) FORM */}
                                <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden group">
                                    <div className="h-2 bg-emerald-500" />
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-white flex items-center gap-3 font-black uppercase text-xl italic tracking-tighter">
                                                <ArrowRightCircle className="w-7 h-7 text-emerald-500" /> {t('vgm.entry')} (KIRISH)
                                            </CardTitle>
                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 italic font-black uppercase tracking-tight">Supplier Intake</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleInSubmit} className="space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mashina Raqami (Plate)</Label>
                                                    <Input
                                                        placeholder="01 A 777 AA"
                                                        value={inPlate}
                                                        onChange={e => setInPlate(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 h-16 text-white font-black text-lg pl-4 uppercase"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Haydovchi F.I.Sh</Label>
                                                    <Input
                                                        placeholder="Haydovchi ismi..."
                                                        value={inDriver}
                                                        onChange={e => setInDriver(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 h-16 text-white font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Yetkazib Beruvchi (Supplier)</Label>
                                                    <Select value={inSupplier} onValueChange={setInSupplier}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 h-16 text-white font-bold">
                                                            <SelectValue placeholder="Supplier..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                            {initialSuppliers.map(s => (
                                                                <SelectItem key={s.id} value={s.name} className="font-bold py-3 uppercase">{s.name}</SelectItem>
                                                            ))}
                                                            <SelectItem value="Hardware Supply Co." className="font-bold py-3 uppercase text-blue-400">Hardware Supply Co.</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Supplier Waybill (Nakladnaya №)</Label>
                                                    <Input
                                                        placeholder="№ 45678"
                                                        value={inInvoiceRef}
                                                        onChange={e => setInInvoiceRef(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 h-16 text-white font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Yuk Tavsifi (Cargo)</Label>
                                                <Input
                                                    placeholder="e.g. Metall konstruksiyalar"
                                                    value={inCargo}
                                                    onChange={e => setInCargo(e.target.value)}
                                                    className="bg-slate-950 border-slate-800 h-16 text-white font-bold"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Miqdori (Quantity)</Label>
                                                    <Input
                                                        type="number"
                                                        value={inQuantity}
                                                        onChange={e => setInQuantity(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 h-16 text-white font-black text-lg"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Birligi (Unit)</Label>
                                                    <Select value={inUnit} onValueChange={setInUnit}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 h-16 text-white font-bold">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                            <SelectItem value="dona" className="font-bold py-2">Dona (pcs)</SelectItem>
                                                            <SelectItem value="kg" className="font-bold py-2">Kilogramm (kg)</SelectItem>
                                                            <SelectItem value="tonna" className="font-bold py-2">Tonna (t)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 text-lg italic transition-all active:scale-95">
                                                <CheckCircle2 className="mr-3 w-6 h-6" /> ENTRY NI QAYD ETISH
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* CHIQISH (OUTBOUND) VERIFICATION FORM */}
                                <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden group">
                                    <div className="h-2 bg-rose-500" />
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-white flex items-center gap-3 font-black uppercase text-xl italic tracking-tighter">
                                                <ArrowLeftCircle className="w-7 h-7 text-rose-500" /> {t('vgm.exit')} (CHIQISH)
                                            </CardTitle>
                                            <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 italic font-black uppercase tracking-tight">Security Verification</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* WAYBILL SEARCH */}
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Waybill / Nakladnaya № (Search)</Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                                        <Input
                                                            placeholder="e.g. 10002"
                                                            value={waybillSearch}
                                                            onChange={e => setWaybillSearch(e.target.value)}
                                                            className="bg-slate-950 border-slate-800 h-16 pl-12 text-white font-black text-xl tracking-widest placeholder:text-slate-800"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={handleSearchWaybill}
                                                        className="h-16 px-6 bg-indigo-600 hover:bg-indigo-500 font-black uppercase"
                                                    >
                                                        SEARCH
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* VERIFIED INFO CARD */}
                                            <AnimatePresence mode="wait">
                                                {verifiedWaybill ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                    >
                                                        <Card className="bg-slate-950 border-indigo-500/30 overflow-hidden relative">
                                                            <div className="absolute top-0 right-0 p-3">
                                                                <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse" />
                                                            </div>
                                                            <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 py-3">
                                                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                                                    <FileText className="w-3 h-3" /> VERIFIED DISPATCH MANIFEST
                                                                </h4>
                                                            </CardHeader>
                                                            <CardContent className="p-4 space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Waybill ID</p>
                                                                        <p className="text-sm font-black text-white italic">{verifiedWaybill.documentId}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Status</p>
                                                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-tighter italic">READY FOR RELEASE</Badge>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Recipient / Client</p>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                                                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                                                            {verifiedWaybill.clientName || verifiedWaybill.reference}
                                                                        </div>
                                                                    </div>
                                                                    {verifiedWaybill.courier && (
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Authorized Courier</p>
                                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                                                                <User className="w-3.5 h-3.5 text-blue-500" />
                                                                                {verifiedWaybill.courier}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {verifiedWaybill.doverennost && (
                                                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3">
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Power of Attorney (Doverennost)</p>
                                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase">
                                                                                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                                                                                {verifiedWaybill.doverennost}
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Valid Until</p>
                                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                                                                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                                                                                {verifiedWaybill.validUntil}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-1 border-t border-slate-900 pt-3">
                                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tight">Manifest Summary</p>
                                                                    <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                                                                        {verifiedWaybill.lineItems.map((l: any, idx: number) => (
                                                                            <div key={idx} className="flex justify-between border-b border-slate-900 pb-1 last:border-0 italic">
                                                                                <span>{l.description}</span>
                                                                                <span className="text-white font-black">{l.qty} {l.unit}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>

                                                        {/* PROCEED TO LOG EXIT */}
                                                        <div className="mt-6 space-y-4">
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Confirm Truck Plate (Exit)</Label>
                                                                <Input
                                                                    placeholder="01 A 001 AA"
                                                                    value={outPlate}
                                                                    onChange={e => setOutPlate(e.target.value)}
                                                                    className="bg-slate-950 border-emerald-500/20 h-16 text-white font-black text-xl pl-4 uppercase"
                                                                />
                                                            </div>
                                                            <Button
                                                                onClick={handleOutVerification}
                                                                className="w-full h-20 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 text-lg italic transition-all active:scale-95"
                                                            >
                                                                APPROVE EXIT & LOG (CHIQISHNI QAYD ETISH)
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="h-[300px] border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-700"
                                                    >
                                                        <FileText className="w-12 h-12 opacity-20" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-center max-w-[200px]">
                                                            Enter waybill number above to verify dispatch manifest
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* LIVE GATE LOG (TODAY) */}
                            <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden mt-8">
                                <CardHeader className="border-b border-slate-800/50 pb-6 bg-slate-900/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                <History className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <CardTitle className="text-white font-black uppercase text-lg tracking-tighter italic">Live Gate Traffic — {new Date().toLocaleDateString()}</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-64">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    placeholder="Plate / Driver / Waybill..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    className="bg-slate-950 border-slate-800 pl-10 text-xs font-bold rounded-xl h-10"
                                                />
                                            </div>
                                            <Button variant="outline" onClick={exportToExcel} className="h-10 border-slate-800 text-slate-400 font-black text-[10px] uppercase gap-2 hover:bg-slate-950 rounded-xl px-4 italic">
                                                <Download className="w-3.5 h-3.5" /> EXPORT LOG
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                                    <th className="px-6 py-5">Timestamp</th>
                                                    <th className="px-6 py-5">Action</th>
                                                    <th className="px-6 py-5 text-center">Unit Plate</th>
                                                    <th className="px-6 py-5">Cargo / Waybill Ref</th>
                                                    <th className="px-6 py-5">Driver / Guard</th>
                                                    <th className="px-6 py-5 text-right">Gate Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredToday.map(entry => (
                                                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-all border-l-4 border-l-transparent hover:border-l-indigo-500">
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-slate-300 flex items-center gap-2">
                                                                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {entry.time}
                                                                </span>
                                                                <span className="text-[9px] text-slate-600 font-bold mt-1 uppercase italic tracking-tighter">{entry.date}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2">
                                                                {entry.type === 'IN' ? (
                                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest italic py-1 px-3">
                                                                        <ArrowRightCircle className="mr-1.5 w-3 h-3 inline" /> KIRISH / ENTRY
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[9px] uppercase tracking-widest italic py-1 px-3">
                                                                        <ArrowLeftCircle className="mr-1.5 w-3 h-3 inline" /> CHIQISH / EXIT
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="text-sm font-black text-white tracking-widest bg-slate-950 py-2 px-4 rounded-xl border border-slate-800 w-fit mx-auto shadow-inner text-center">
                                                                {entry.plateNumber}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-bold text-slate-200">
                                                                    <Package className="w-3.5 h-3.5 inline mr-2 text-indigo-500/50" />
                                                                    {entry.cargo}
                                                                </div>
                                                                {entry.waybillRef && (
                                                                    <div className="text-[10px] text-indigo-400 font-black italic uppercase flex items-center gap-1.5">
                                                                        <FileText className="w-3 h-3" /> REF: {entry.waybillRef}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-black text-slate-400 flex items-center gap-2">
                                                                    <User className="w-3.5 h-3.5" /> {entry.driver}
                                                                </div>
                                                                <div className="text-[9px] text-slate-600 font-bold uppercase italic tracking-tight">
                                                                    Guard: {entry.operator}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            {entry.status === 'Hududda' ? (
                                                                <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[9px] uppercase italic animate-pulse">
                                                                    IN AREA (Hududda)
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-slate-800 text-slate-500 border-none font-black text-[9px] uppercase italic">
                                                                    EXITED (Chiqib ketti)
                                                                </Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredToday.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="py-20 text-center">
                                                            <p className="text-slate-600 font-black uppercase text-xs italic tracking-widest">No entries recorded today</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* HISTORY TAB */}
                        <TabsContent value="history" className="mt-0 outline-none">
                            <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden min-h-[600px]">
                                <CardHeader className="border-b border-slate-800/50 pb-6 bg-slate-900/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                <Filter className="w-5 h-5 text-indigo-500" />
                                            </div>
                                            <CardTitle className="text-white font-black uppercase text-lg tracking-tighter italic">VGM Global History Journal</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-96">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <Input
                                                    placeholder="Search history by plate, driver, waybill... "
                                                    value={historySearchQuery}
                                                    onChange={e => setHistorySearchQuery(e.target.value)}
                                                    className="bg-slate-950 border-slate-800 pl-10 text-xs font-bold rounded-xl h-12 w-full italic"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                                    <th className="px-6 py-5">Date & Time</th>
                                                    <th className="px-6 py-5">Direction</th>
                                                    <th className="px-6 py-5">Post</th>
                                                    <th className="px-6 py-5 text-center">Plate</th>
                                                    <th className="px-6 py-5">Cargo / Waybill</th>
                                                    <th className="px-6 py-5">Logistics Guard</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {filteredHistory.map(entry => (
                                                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-white">{entry.date}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase italic">{entry.time}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${entry.type === 'IN' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                                                    {entry.type === 'IN' ? <ArrowRightCircle className="w-4 h-4" /> : <ArrowLeftCircle className="w-4 h-4" />}
                                                                </div>
                                                                <span className={`text-[10px] font-black italic uppercase tracking-widest ${entry.type === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {entry.type}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <Badge variant="secondary" className="bg-slate-950 text-slate-400 border-none font-black text-[10px] italic">{entry.post}</Badge>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="text-sm font-black text-white tracking-widest bg-slate-950 py-2 px-3 rounded-lg border border-slate-800 w-fit mx-auto text-center">
                                                                {entry.plateNumber}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col space-y-1">
                                                                <span className="text-xs font-bold text-slate-300 italic">{entry.cargo}</span>
                                                                {entry.waybillRef && (
                                                                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-tighter">REF: {entry.waybillRef}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2 text-xs font-black text-indigo-400 italic">
                                                                <User className="w-3.5 h-3.5" />
                                                                {entry.operator}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
