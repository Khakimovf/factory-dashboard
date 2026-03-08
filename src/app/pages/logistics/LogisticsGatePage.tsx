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
    XCircle
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
    DialogDescription,
    DialogFooter
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { initialSuppliers } from '../suppliers/SuppliersPage';
import * as XLSX from 'xlsx';

interface GateEntry {
    id: string;
    time: string;
    date: string;
    type: 'IN' | 'OUT';
    plateNumber: string;
    driver: string;
    subject: string; // Supplier or Reason
    cargo: string;
    quantity: number;
    unit: string;
    destination?: string;
    status: 'Hududda' | 'Chiqib ketdi';
    operator: string;
    post: string;
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

export function LogisticsGatePage() {
    const { t } = useLanguage();
    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [authorizedOperator, setAuthorizedOperator] = useState<Operator | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('today');

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

    // Form states
    const [inPlate, setInPlate] = useState('');
    const [inDriver, setInDriver] = useState('');
    const [inSupplier, setInSupplier] = useState('');
    const [inCargo, setInCargo] = useState('');
    const [inQuantity, setInQuantity] = useState('');
    const [inUnit, setInUnit] = useState('dona');
    const [inWidth, setInWidth] = useState('');
    const [inLength, setInLength] = useState('');

    const [outPlate, setOutPlate] = useState('');
    const [outCargoType, setOutCargoType] = useState('');
    const [outQuantity, setOutQuantity] = useState('');
    const [outUnit, setOutUnit] = useState('dona');
    const [outDestination, setOutDestination] = useState('');

    const handleSelectPost = (post: string) => {
        setSelectedPost(post);
        setIsAuthModalOpen(true);
    };

    const handleAuthenticate = () => {
        setIsAuthenticating(true);
        // Simulate scan
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

        let finalQuantity = parseFloat(inQuantity);
        if (inUnit === 'm2' && inWidth && inLength) {
            finalQuantity = parseFloat(inWidth) * parseFloat(inLength);
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
            quantity: finalQuantity,
            unit: inUnit,
            status: 'Hududda',
            operator: authorizedOperator?.name || 'Unknown',
            post: selectedPost || 'N/A'
        };

        setEntries([newEntry, ...entries]);
        setInPlate('');
        setInDriver('');
        setInSupplier('');
        setInCargo('');
        setInQuantity('');
        setInWidth('');
        setInLength('');
        toast.success(t('vgm.entry') + ' ' + t('qc.createSuccess'));
    };

    const handleOutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!outPlate || !outCargoType || !outDestination || !outQuantity) {
            toast.error(t('qc.validation.required'));
            return;
        }

        const existingIndex = entries.findIndex(e => e.plateNumber === outPlate.toUpperCase() && e.status === 'Hududda');
        const now = new Date();

        const newEntry: GateEntry = {
            id: Date.now().toString(),
            time: now.toLocaleTimeString(),
            date: now.toISOString().split('T')[0],
            type: 'OUT',
            plateNumber: outPlate.toUpperCase(),
            driver: existingIndex !== -1 ? entries[existingIndex].driver : 'Aniqlanmagan',
            subject: outCargoType,
            cargo: existingIndex !== -1 ? entries[existingIndex].cargo : 'Tafsilotsiz',
            quantity: parseFloat(outQuantity),
            unit: outUnit,
            destination: outDestination,
            status: 'Chiqib ketdi',
            operator: authorizedOperator?.name || 'Unknown',
            post: selectedPost || 'N/A'
        };

        if (existingIndex !== -1) {
            const updatedEntries = [...entries];
            updatedEntries[existingIndex] = { ...updatedEntries[existingIndex], status: 'Chiqib ketdi' };
            setEntries([newEntry, ...updatedEntries]);
        } else {
            setEntries([newEntry, ...entries]);
        }

        setOutPlate('');
        setOutCargoType('');
        setOutDestination('');
        setOutQuantity('');
        toast.warning(t('vgm.exit') + ' ' + t('qc.statusUpdated'));
    };

    const confirmExitShortcut = (plate: string) => {
        const existing = entries.find(e => e.plateNumber === plate && e.status === 'Hududda');
        if (existing) {
            setOutPlate(existing.plateNumber);
            setOutCargoType('Tayyor mahsulot');
            setOutDestination('Markaziy Ombor');
            setOutQuantity(existing.quantity.toString());
            setOutUnit(existing.unit);
            toast.info(t('vgm.confirmExit') + ': ' + plate);
        }
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
            e.driver.toLowerCase().includes(searchQuery.toLowerCase());
        return isToday && matchesSearch;
    });

    const filteredHistory = entries.filter(e =>
        e.plateNumber.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        e.driver.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        e.operator.toLowerCase().includes(historySearchQuery.toLowerCase())
    );

    if (!selectedPost) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
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
        <div className="p-8 bg-slate-950 min-h-screen space-y-8">
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
            <AnimatePresence>
                {authorizedOperator && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between"
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <AnimatePresence>
                {authorizedOperator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
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
                                    {/* KIRISH FORM */}
                                    <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden group">
                                        <div className="h-2 bg-emerald-500" />
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-white flex items-center gap-3 font-black uppercase text-xl italic tracking-tighter">
                                                    <ArrowRightCircle className="w-7 h-7 text-emerald-500" /> {t('vgm.entry')}
                                                </CardTitle>
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 italic font-black">SECURE ENTRY</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleInSubmit} className="space-y-5">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Avtomobil raqami</Label>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="01 A 001 AA"
                                                                value={inPlate}
                                                                onChange={e => setInPlate(e.target.value)}
                                                                className="bg-slate-950 border-slate-800 h-16 text-white font-black text-lg focus:ring-2 focus:ring-emerald-500/50 pl-4 uppercase"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Haydovchi ismi</Label>
                                                        <Input
                                                            placeholder="F.I.SH."
                                                            value={inDriver}
                                                            onChange={e => setInDriver(e.target.value)}
                                                            className="bg-slate-950 border-slate-800 h-16 text-white font-bold text-md focus:ring-2 focus:ring-emerald-500/50"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Yetkazib beruvchi / Firma</Label>
                                                    <Select value={inSupplier} onValueChange={setInSupplier}>
                                                        <SelectTrigger className="bg-slate-950 border-slate-800 h-16 text-white font-bold">
                                                            <SelectValue placeholder="Yetkazib beruvchini tanlang" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                            {initialSuppliers.map(s => (
                                                                <SelectItem key={s.id} value={s.name} className="font-bold py-3 uppercase">{s.name}</SelectItem>
                                                            ))}
                                                            <SelectItem value="Boshqa" className="font-bold py-3 uppercase text-indigo-400 font-black italic">Boshqa / Xususiy</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Yuk tavsifi</Label>
                                                    <Input
                                                        placeholder="Masalan: Vagon detallari"
                                                        value={inCargo}
                                                        onChange={e => setInCargo(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 h-16 text-white font-bold text-md"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('vgm.quantity')}</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={inQuantity}
                                                            onChange={e => setInQuantity(e.target.value)}
                                                            className="bg-slate-950 border-slate-800 h-16 text-white font-black text-lg focus:ring-2 focus:ring-emerald-500/50 pl-4"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('vgm.unit')}</Label>
                                                        <Select value={inUnit} onValueChange={setInUnit}>
                                                            <SelectTrigger className="bg-slate-950 border-slate-800 h-16 text-white font-bold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                                <SelectItem value="dona" className="font-bold py-3 uppercase text-xs">Dona (pcs)</SelectItem>
                                                                <SelectItem value="kg" className="font-bold py-3 uppercase text-xs">Kilogramm (kg)</SelectItem>
                                                                <SelectItem value="l" className="font-bold py-3 uppercase text-xs">Litr (l)</SelectItem>
                                                                <SelectItem value="m2" className="font-bold py-3 uppercase text-xs">Metr kvadrat (m²)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {inUnit === 'm2' && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="grid grid-cols-2 gap-4 overflow-hidden"
                                                        >
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Eni (m)</Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.0"
                                                                    value={inWidth}
                                                                    onChange={e => {
                                                                        setInWidth(e.target.value);
                                                                        if (inLength) setInQuantity((parseFloat(e.target.value) * parseFloat(inLength)).toString());
                                                                    }}
                                                                    className="bg-slate-950 border-indigo-500/20 h-14 text-white font-bold"
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Bo'yi (m)</Label>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="0.0"
                                                                    value={inLength}
                                                                    onChange={e => {
                                                                        setInLength(e.target.value);
                                                                        if (inWidth) setInQuantity((parseFloat(inWidth) * parseFloat(e.target.value)).toString());
                                                                    }}
                                                                    className="bg-slate-950 border-indigo-500/20 h-14 text-white font-bold"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <Button type="submit" className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] transform active:scale-95 transition-all shadow-xl shadow-emerald-500/20 text-lg italic">
                                                    {t('vgm.entry')}NI QAYD ETISH
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>

                                    {/* CHIQISH FORM */}
                                    <Card className="bg-slate-900 border-none shadow-2xl overflow-hidden group">
                                        <div className="h-2 bg-rose-500" />
                                        <CardHeader className="pb-4">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-white flex items-center gap-3 font-black uppercase text-xl italic tracking-tighter">
                                                    <ArrowLeftCircle className="w-7 h-7 text-rose-500" /> {t('vgm.exit')}
                                                </CardTitle>
                                                <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 italic font-black">SECURE EXIT</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={handleOutSubmit} className="space-y-5">
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center justify-between font-black">
                                                        Avtomobil raqami
                                                        {entries.filter(e => e.status === 'Hududda').length > 0 && (
                                                            <span className="text-emerald-500 italic animate-pulse">HUDUDDA: {entries.filter(e => e.status === 'Hududda').length}</span>
                                                        )}
                                                    </Label>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <Input
                                                            placeholder="01 A 001 AA"
                                                            value={outPlate}
                                                            onChange={e => setOutPlate(e.target.value)}
                                                            className="bg-slate-950 border-slate-800 h-16 text-white font-black text-lg pl-4 font-black uppercase"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Yuk holati</Label>
                                                        <Select value={outCargoType} onValueChange={setOutCargoType}>
                                                            <SelectTrigger className="bg-slate-950 border-slate-800 h-16 text-white font-bold uppercase">
                                                                <SelectValue placeholder="Tanlang" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-900 border-slate-800 text-white font-black uppercase">
                                                                <SelectItem value="Tayyor mahsulot" className="font-bold py-3">Tayyor mahsulot</SelectItem>
                                                                <SelectItem value="Atxot" className="font-bold py-3">Atxot / Chiqindi</SelectItem>
                                                                <SelectItem value="Metal" className="font-bold py-3">Metal / Boshqa</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Boradigan manzili</Label>
                                                        <Input
                                                            placeholder="Shahar / Ombor"
                                                            value={outDestination}
                                                            onChange={e => setOutDestination(e.target.value)}
                                                            className="bg-slate-950 border-slate-800 h-16 text-white font-bold"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('vgm.quantity')}</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={outQuantity}
                                                            onChange={e => setOutQuantity(e.target.value)}
                                                            className="bg-slate-950 border-slate-800 h-16 text-white font-black text-lg focus:ring-2 focus:ring-rose-500/50 pl-4"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('vgm.unit')}</Label>
                                                        <Select value={outUnit} onValueChange={setOutUnit}>
                                                            <SelectTrigger className="bg-slate-950 border-slate-800 h-16 text-white font-bold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                                <SelectItem value="dona" className="font-bold py-3 uppercase text-xs">Dona (pcs)</SelectItem>
                                                                <SelectItem value="kg" className="font-bold py-3 uppercase text-xs">Kilogramm (kg)</SelectItem>
                                                                <SelectItem value="l" className="font-bold py-3 uppercase text-xs">Litr (l)</SelectItem>
                                                                <SelectItem value="m2" className="font-bold py-3 uppercase text-xs">Metr kvadrat (m²)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="h-20 flex items-end">
                                                    <Button type="submit" className="w-full h-20 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-[0.2em] transform active:scale-95 transition-all shadow-xl shadow-rose-500/20 text-lg italic">
                                                        {t('vgm.exit')}NI QAYD ETISH
                                                    </Button>
                                                </div>
                                            </form>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* TODAY LOG */}
                                <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
                                    <CardHeader className="border-b border-slate-800/50 pb-6 bg-slate-900/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                    <History className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <CardTitle className="text-white font-black uppercase text-lg tracking-tighter italic">{t('vgm.todayLog')}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                    <Input
                                                        placeholder="Plate / Driver..."
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 pl-10 text-xs font-bold rounded-xl h-10"
                                                    />
                                                </div>
                                                <Button variant="outline" onClick={exportToExcel} className="h-10 border-slate-800 text-slate-400 font-black text-[10px] uppercase gap-2 hover:bg-slate-950 rounded-xl px-4">
                                                    <Download className="w-3.5 h-3.5" /> XLS
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                                        <th className="px-6 py-5">Vaqt</th>
                                                        <th className="px-6 py-5">Yo'nalish</th>
                                                        <th className="px-6 py-5">Mashina (PLATE)</th>
                                                        <th className="px-6 py-5">Haydovchi / Nazoratchi</th>
                                                        <th className="px-6 py-5">Yuk / Manzil</th>
                                                        <th className="px-6 py-5 text-right">Amallar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {filteredToday.map(entry => (
                                                        <motion.tr
                                                            layout
                                                            key={entry.id}
                                                            className="hover:bg-slate-800/30 transition-colors group"
                                                        >
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2 text-xs font-black text-slate-300">
                                                                        <Clock className="w-3.5 h-3.5 text-indigo-500/50" />
                                                                        {entry.time}
                                                                    </div>
                                                                    <span className="text-[9px] text-slate-600 font-bold tracking-tight mt-1">{entry.date}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    {entry.type === 'IN' ? (
                                                                        <div className="px-2.5 py-1 bg-emerald-500/10 rounded-full flex items-center gap-2 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                                                                            <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{t('vgm.entry')}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="px-2.5 py-1 bg-rose-500/10 rounded-full flex items-center gap-2 border border-rose-500/20 shadow-sm shadow-rose-500/10">
                                                                            <ArrowLeftCircle className="w-3.5 h-3.5 text-rose-500" />
                                                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest italic">{t('vgm.exit')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-sm font-black text-white tracking-widest bg-slate-950 py-1 px-3 rounded-lg border border-slate-800 w-fit">{entry.plateNumber}</div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2 text-xs font-black text-slate-300">
                                                                        <User className="w-3.5 h-3.5 text-slate-600" />
                                                                        {entry.driver}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-[9px] text-indigo-400 font-black uppercase italic">
                                                                        <ShieldCheck className="w-3 h-3" />
                                                                        BY: {entry.operator}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                                                        <Package className="w-3.5 h-3.5 text-indigo-500/50" />
                                                                        <span className="text-indigo-400 font-black">{entry.quantity} {entry.unit}</span> — {entry.subject}: {entry.cargo}
                                                                    </div>
                                                                    {entry.destination && (
                                                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight italic">
                                                                            <MapPin className="w-3 h-3 text-rose-500/50" />
                                                                            {entry.destination}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                <AnimatePresence>
                                                                    {entry.status === 'Hududda' ? (
                                                                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => confirmExitShortcut(entry.plateNumber)}
                                                                                className="border-emerald-500/50 text-emerald-500 font-black text-[9px] uppercase h-8 hover:bg-emerald-500 hover:text-white rounded-lg gap-2 group transition-all"
                                                                            >
                                                                                <CheckCircle2 className="w-3 h-3" /> {t('vgm.confirmExit')}
                                                                            </Button>
                                                                        </motion.div>
                                                                    ) : (
                                                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                                            <Badge className="bg-slate-800/80 text-slate-500 font-black italic uppercase tracking-tighter cursor-default border-slate-700">
                                                                                {t('vgm.exited')}
                                                                            </Badge>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                    {filteredToday.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="py-20 text-center">
                                                                <div className="flex flex-col items-center gap-4 text-slate-600">
                                                                    <History className="w-12 h-12 opacity-20" />
                                                                    <p className="font-black uppercase tracking-widest text-xs italic">Bugun uchun yozuvlar mavjud emas</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 outline-none">
                                <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden min-h-[600px]">
                                    <CardHeader className="border-b border-slate-800/50 pb-6 bg-slate-900/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                                    <Filter className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <CardTitle className="text-white font-black uppercase text-lg tracking-tighter italic">{t('vgm.history')}</CardTitle>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-96">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                    <Input
                                                        placeholder="Sana, raqam, haydovchi yoki nazoratchi bo'yicha qidiruv..."
                                                        value={historySearchQuery}
                                                        onChange={e => setHistorySearchQuery(e.target.value)}
                                                        className="bg-slate-950 border-slate-800 pl-10 text-xs font-bold rounded-xl h-12 w-full"
                                                    />
                                                </div>
                                                <Button
                                                    onClick={exportToExcel}
                                                    className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs px-6 rounded-xl gap-2 italic tracking-widest shadow-lg shadow-indigo-600/20"
                                                >
                                                    <Download className="w-4 h-4" /> {t('vgm.export')} (ALL)
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                                        <th className="px-6 py-5 whitespace-nowrap">Sana & Vaqt</th>
                                                        <th className="px-6 py-5">Post #</th>
                                                        <th className="px-6 py-5">Yo'nalish</th>
                                                        <th className="px-6 py-5">Mashina</th>
                                                        <th className="px-6 py-5">Yuk tavsifi</th>
                                                        <th className="px-6 py-5">Nazoratchi</th>
                                                        <th className="px-6 py-5 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {filteredHistory.map(entry => (
                                                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group">
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-black text-white">{entry.date}</span>
                                                                    <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase italic tracking-tighter">{entry.time}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <Badge variant="secondary" className="bg-slate-950 text-slate-400 border-none font-black text-[10px] italic">{entry.post}</Badge>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    {entry.type === 'IN' ? (
                                                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                                            <ArrowRightCircle className="w-4 h-4 text-emerald-500" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                                                            <ArrowLeftCircle className="w-4 h-4 text-rose-500" />
                                                                        </div>
                                                                    )}
                                                                    <span className={`text-[10px] font-black italic uppercase tracking-widest ${entry.type === 'IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {entry.type}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-white tracking-widest">{entry.plateNumber}</span>
                                                                    <span className="text-[10px] text-slate-500 font-bold uppercase italic mt-1">{entry.driver}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="text-xs font-bold text-slate-300 max-w-[200px] leading-tight">
                                                                    <span className="text-indigo-400 font-black">{entry.quantity} {entry.unit}</span> — {entry.subject}: {entry.cargo}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="flex items-center gap-2 text-xs font-black text-indigo-400 italic">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    {entry.operator}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-5 text-right">
                                                                {entry.status === 'Hududda' ? (
                                                                    <div className="flex items-center justify-end gap-1.5 text-emerald-500 font-black text-[9px] uppercase italic tracking-tighter">
                                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                                        {t('vgm.inArea')}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-end gap-1.5 text-slate-600 font-black text-[9px] uppercase italic tracking-tighter">
                                                                        <XCircle className="w-3.5 h-3.5" />
                                                                        {t('vgm.exited')}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {filteredHistory.length === 0 && (
                                                        <tr>
                                                            <td colSpan={7} className="py-20 text-center">
                                                                <p className="text-slate-500 font-black uppercase text-xs italic">Hech narsa topilmadi</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] italic">
                                                {filteredHistory.length} {t('vgm.recordsFound')}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
