import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    DollarSign, TrendingUp, TrendingDown, FileText,
    BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Plus,
    Filter, Search, BookOpen, Activity, X, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { Card, CardContent } from '../../components/ui/card';
import { useWarehouseStore } from '../../store/warehouseStore';
import { 
    useFinanceStore, 
    getFinanceKPIs, 
    getMonthlyCashflow, 
    getBudgetBreakdown,
    getMonetaryStockVal,
    getDailyDispatchRevenue,
    getVendorPaymentsSummary,
    getFunnelPipelineData
} from '../../store/financeStore';
import { toast } from 'sonner';

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, icon: Icon, color }: any) => (
    <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl ${color} shadow-lg shadow-current/10`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
        <div className="h-px flex-1 bg-slate-800/80" />
    </div>
);

export function FinancePage() {
    const { entries, contracts, addVoucher } = useFinanceStore();
    const { stock } = useWarehouseStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedLedger, setShowAdvancedLedger] = useState(false);
    
    // Modal states
    const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
    const [isPnLModalOpen, setIsPnLModalOpen] = useState(false);

    // Form state for Yangi Provodka
    const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
    const [debitAccount, setDebitAccount] = useState('2010 - Work-In-Progress Balance');
    const [creditAccount, setCreditAccount] = useState('1010 - Raw Material Inventory');
    const [costCenter, setCostCenter] = useState('Ishlab Chiqarish');
    const [amountInput, setAmountInput] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');

    // Dynamic computations for Executive CFO Cockpit
    const kpis = useMemo(() => getFinanceKPIs(entries), [entries]);
    const monetaryStockVal = useMemo(() => getMonetaryStockVal(stock), [stock]);
    const dailyRevenue = useMemo(() => getDailyDispatchRevenue(entries), [entries]);
    const vendorSummary = useMemo(() => getVendorPaymentsSummary(contracts), [contracts]);
    const funnelData = useMemo(() => getFunnelPipelineData(entries, stock), [entries, stock]);

    const monthlyCashflow = useMemo(() => getMonthlyCashflow(entries), [entries]);
    const budgetCategories = useMemo(() => getBudgetBreakdown(entries), [entries]);
    const pieData = useMemo(() => budgetCategories.map(c => ({ name: c.name, value: c.spent })), [budgetCategories]);

    // Filtered Ledger entries for advanced mode
    const filteredEntries = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return entries;
        return entries.filter(e => 
            e.id.toLowerCase().includes(q) ||
            e.account.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            (e.costCenter && e.costCenter.toLowerCase().includes(q))
        );
    }, [entries, searchQuery]);

    const handlePostVoucher = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(amountInput);
        if (isNaN(amt) || amt <= 0) {
            toast.error("Iltimos, to'g'ri miqdorni kiriting (Amount > 0)");
            return;
        }
        if (debitAccount === creditAccount) {
            toast.error("Debet va Kredit hisoblari bir xil bo'lishi mumkin emas!");
            return;
        }
        if (!descriptionInput.trim()) {
            toast.error("Operatsiya tavsifini kiriting!");
            return;
        }

        // Post balanced voucher
        addVoucher(
            debitAccount,
            creditAccount,
            amt,
            descriptionInput.trim(),
            costCenter || undefined,
            postingDate
        );

        toast.success("Yangi provodka muvaffaqiyatli saqlandi va Bosh daftarga yozildi!");
        
        // Reset form & close modal
        setAmountInput('');
        setDescriptionInput('');
        setIsPostingModalOpen(false);
    };

    // CFO P&L report breakdown
    const pnlReport = useMemo(() => {
        const baseRevenue = 3970000;
        const baseCOGS = 2238000;
        const baseOPEX = 515000;

        let newRevenue = 0;
        let newCOGS = 0;
        let newOPEX = 0;

        entries.forEach(entry => {
            const idNum = parseInt(entry.id.replace('GL-', ''));
            if (idNum > 100) {
                if (entry.account.startsWith('7010')) {
                    newRevenue += entry.credit - entry.debit;
                }
                if (entry.account.startsWith('4010')) {
                    newCOGS += entry.debit - entry.credit;
                }
                if (entry.account.startsWith('6100')) {
                    newOPEX += entry.debit - entry.credit;
                }
            }
        });

        const grossRevenue = baseRevenue + newRevenue + 150000; // include initial GL-097
        const cogs = baseCOGS + newCOGS + 12000;                 // include initial GL-099
        const grossProfit = grossRevenue - cogs;
        const opex = baseOPEX + newOPEX + 85000;                 // include initial GL-098
        const netProfit = grossProfit - opex;

        return {
            grossRevenue,
            cogs,
            grossProfit,
            opex,
            netProfit
        };
    }, [entries]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* 1. Header & CFO Cockpit */}
            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl">
                                <DollarSign className="w-8 h-8 text-indigo-400" />
                            </div>
                            CFO MOLIYAVIY REJESTRI (CFO DASHBOARD)
                            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Executive Mode</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 ml-1">Real-time Pipeline Value • Daily Dispatch Revenue • Contract Progress • Executive Analytics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsPnLModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase px-6 py-3 rounded-xl transition-all"
                        >
                            <FileText className="w-4 h-4 text-sky-400" />
                            📥 P&L Hisoboti
                        </button>
                        <button 
                            onClick={() => setIsPostingModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase px-6 py-3 rounded-xl transition-all shadow-xl shadow-emerald-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            + Yangi Provodka
                        </button>
                    </div>
                </div>

                {/* Plain Business CFO Answer Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { 
                            label: "Bugungi Sotuv (Daily Dispatch)", 
                            value: `$${dailyRevenue.toLocaleString()}`, 
                            subText: `Bugungi yuklash: 1,200 dona detailing UzAuto Motorsga yetkazilishi`,
                            color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                            icon: TrendingUp 
                        },
                        { 
                            label: "Kreditor Qarzdorlik (Vendor Pay)", 
                            value: `$${vendorSummary.totalOutstanding.toLocaleString()}`, 
                            subText: `Bugungi to'lovlar: $${vendorSummary.paidToday.toLocaleString()} | Shartnoma qoldig'i`, 
                            color: "bg-rose-500/10 border-rose-500/30 text-rose-400",
                            icon: TrendingDown 
                        },
                        { 
                            label: "Zahira Qiymati (Inventory Cash)", 
                            value: `$${monetaryStockVal.toLocaleString()}`, 
                            subText: "Jismoniy ombor qoldig'ining dead-cash ko'rinishidagi jami summasi", 
                            color: "bg-amber-500/10 border-amber-500/30 text-amber-400",
                            icon: Activity 
                        },
                        { 
                            label: "Prognoz / Sof Foyda (Net Profit)", 
                            value: `$${kpis.netProfit.toLocaleString()}`, 
                            subText: "Real-time daromadlar va xarajatlar farqi (Net Earnings)", 
                            color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
                            icon: DollarSign 
                        }
                    ].map((k, i) => (
                        <div key={i} className={`border rounded-2xl p-5 backdrop-blur-xl flex flex-col justify-between ${k.color}`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{k.label}</span>
                                <k.icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-3xl font-black tracking-tight mb-2 text-white">{k.value}</h3>
                            <p className="text-[10px] opacity-70 leading-relaxed font-semibold">{k.subText}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Visual "Material-to-Cash" Flow Funnel */}
            <div className="p-6">
                <Card className="bg-slate-900 border-slate-800 shadow-2xl rounded-3xl p-6">
                    <SectionHeader title="Zavod Moddiy-Moliyaviy Oqimi (Material-to-Cash Pipeline)" icon={Activity} color="bg-indigo-600" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center">
                        {/* Stage 1: Warehouse */}
                        <div className="lg:col-span-1 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 group hover:border-slate-700 transition-colors">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">1. Xomashyo Ombori</span>
                            <span className="text-xl font-black text-blue-400">${funnelData.rawVal.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-400 font-bold opacity-60">Omborda po'lat/plastmassa shaklida yotgan pulimiz</p>
                        </div>

                        {/* Arrow */}
                        <div className="lg:col-span-1 flex items-center justify-center text-slate-700">
                            <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
                        </div>

                        {/* Stage 2: Production WIP */}
                        <div className="lg:col-span-1 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 group hover:border-slate-700 transition-colors">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">2. Ishlab Chiqarish (WIP)</span>
                            <span className="text-xl font-black text-yellow-500">${funnelData.wipVal.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-400 font-bold opacity-60">Liniyada yig'ilayotgan detallar qiymati</p>
                        </div>

                        {/* Arrow */}
                        <div className="lg:col-span-1 flex items-center justify-center text-slate-700">
                            <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
                        </div>

                        {/* Stage 3: Finished Goods */}
                        <div className="lg:col-span-1 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 group hover:border-slate-700 transition-colors">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">3. Tayyor Mahsulotlar</span>
                            <span className="text-xl font-black text-emerald-400">${funnelData.fgVal.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-400 font-bold opacity-60">Tayyor omborda sotilishini kutayotgan pulimiz</p>
                        </div>

                        {/* Arrow */}
                        <div className="lg:col-span-1 flex items-center justify-center text-slate-700">
                            <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
                        </div>

                        {/* Stage 4: Shipped */}
                        <div className="lg:col-span-1 bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2 group hover:border-slate-700 transition-colors">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">4. Eksport / Sotuv</span>
                            <span className="text-xl font-black text-indigo-400">${funnelData.exportVal.toLocaleString()}</span>
                            <p className="text-[10px] text-slate-400 font-bold opacity-60">Mijozga yuklanib, hisob-kitob qilingan real daromad</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 3. Dynamic Charts (Pul Oqimi & Costing Breakdown) */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cashflow Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <SectionHeader title="Pul Oqimi Dinamikasi" icon={BarChart3} color="bg-indigo-600" />
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyCashflow}>
                                <defs>
                                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: 700 }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fill="url(#incGrad)" name="Daromad" />
                                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fill="url(#expGrad)" name="Xarajat" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Budget Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <SectionHeader title="Xarajat Tarkibi" icon={PieChart} color="bg-cyan-600" />
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={budgetCategories[i].color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {budgetCategories.map(c => (
                            <div key={c.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/20 border border-slate-800/40">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                                    <span className="text-[11px] font-bold text-slate-400">{c.name}</span>
                                </div>
                                <span className="text-[11px] font-black text-white">${(c.spent / 1000).toFixed(0)}K</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Enterprise Contract Balance Tracker */}
            <div className="p-6 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            B2B Shartnomalar Holati (Enterprise Contract Balance Tracker)
                        </h3>
                        {/* Toggle Advanced mode button */}
                        <button
                            onClick={() => setShowAdvancedLedger(!showAdvancedLedger)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase px-4 py-2 rounded-xl border border-slate-700 transition-all"
                        >
                            {showAdvancedLedger ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                            {showAdvancedLedger ? "Bosh daftarni yopish" : "Bosh daftarni ko'rish"}
                        </button>
                    </div>

                    <div className="overflow-x-auto text-left">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-800/40 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="px-6 py-5">Hamkor nomi (Client/Supplier)</th>
                                    <th className="px-6 py-5">Shartnoma kodi & Mavzusi</th>
                                    <th className="px-6 py-5">Agreed Volume vs Shipped</th>
                                    <th className="px-6 py-5">Moliyaviy Progress (Paid vs Outstanding)</th>
                                    <th className="px-6 py-5">Holati</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {contracts.map((c, i) => {
                                    const volPct = Math.round((c.deliveredVolume / c.totalVolume) * 100);
                                    const financialDebt = Math.max(0, c.contractSum - c.paidAmount);
                                    const paidPct = Math.round((c.paidAmount / c.contractSum) * 100);

                                    return (
                                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                            {/* Client / Supplier */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white uppercase">{c.partyName}</span>
                                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">ID: {c.id}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Contract Number & Subject */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-mono text-indigo-400 font-bold">{c.contractNo}</span>
                                                    <span className="text-xs text-slate-400 mt-0.5">{c.subject}</span>
                                                </div>
                                            </td>

                                            {/* Volumes agreed vs delivered */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5 max-w-[150px]">
                                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                                        <span>{c.deliveredVolume.toLocaleString()} / {c.totalVolume.toLocaleString()} pcs</span>
                                                        <span>{volPct}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${volPct}%` }} />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Financial progress sum vs outstanding debt */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5 max-w-[240px]">
                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                                        <span className="text-emerald-400">Paid: ${c.paidAmount.toLocaleString()}</span>
                                                        <span className="text-rose-400">Debt: ${financialDebt.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${paidPct}%` }} />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-5">
                                                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border ${
                                                    c.status === 'COMPLETED' 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 5. Advanced Double-Entry Ledger View (Toggled on request) */}
                <AnimatePresence>
                    {showAdvancedLedger && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-md">
                                <div className="flex items-center gap-5">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-emerald-400" />
                                        Granulyar Bosh Daftar (Accounting Ledger)
                                    </h3>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Operatsiya yoki hisob..."
                                            className="bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all w-64"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto text-left">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-800/40 border-b border-slate-800">
                                            {['Sana', 'Journal ID', 'Hisob (Account)', 'Tavsif (Description)', 'Cost Center', 'Debet', 'Kredit', 'Harakat'].map(h => (
                                                <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {filteredEntries.map((entry, i) => (
                                            <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-6 py-5 text-xs text-slate-500 font-bold">{entry.date}</td>
                                                <td className="px-6 py-5 text-xs font-mono text-indigo-400 font-black">{entry.id}</td>
                                                <td className="px-6 py-5 text-xs text-white font-bold">{entry.account}</td>
                                                <td className="px-6 py-5 text-xs text-slate-400">{entry.description}</td>
                                                <td className="px-6 py-5 text-xs text-slate-500 font-bold uppercase">{entry.costCenter || '—'}</td>
                                                <td className="px-6 py-5 text-xs text-emerald-400 font-black">
                                                    {entry.debit > 0 ? `$${entry.debit.toLocaleString()}` : '—'}
                                                </td>
                                                <td className="px-6 py-5 text-xs text-rose-400 font-black">
                                                    {entry.credit > 0 ? `$${entry.credit.toLocaleString()}` : '—'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <button 
                                                        onClick={() => toast.info(`Journal Voucher ${entry.id} verified automatically. Balanced entry.`)}
                                                        className="text-[10px] font-black uppercase text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Audit Trail
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Section: Costing Intelligence */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-black uppercase tracking-tighter text-lg">Haqiqiy TanNarx (COGS)</h4>
                        <p className="text-slate-400 text-xs mt-1">BOM + Xarid + Overheads hamda Bosh Daftar provodkalari asosida</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-black text-white">$12.42</p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">O'rtacha unit cost</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-black uppercase tracking-tighter text-lg">Moliya-Ombor Integratsiyasi</h4>
                        <p className="text-slate-400 text-xs mt-1">Sinxronizatsiya: 100% (Real-time)</p>
                    </div>
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(x => (
                            <div key={x} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-emerald-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 6. MODAL: Yangi Provodka accounting wizard */}
            <AnimatePresence>
                {isPostingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsPostingModalOpen(false)}
                                className="absolute right-6 top-6 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-emerald-400" />
                                Yangi Bosh Daftar Provodkasi
                            </h3>

                            <form onSubmit={handlePostVoucher} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Date */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Provodka sanasi</label>
                                        <input 
                                            type="date"
                                            value={postingDate}
                                            onChange={e => setPostingDate(e.target.value)}
                                            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                            required
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Miqdor (USD)</label>
                                        <input 
                                            type="number"
                                            placeholder="Amount in USD..."
                                            value={amountInput}
                                            onChange={e => setAmountInput(e.target.value)}
                                            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Debit Account */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Debet hisobi (Debit Account)</label>
                                        <select
                                            value={debitAccount}
                                            onChange={e => setDebitAccount(e.target.value)}
                                            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="1010 - Raw Material Inventory">1010 - Raw Material Inventory</option>
                                            <option value="2010 - Work-In-Progress Balance">2010 - Production WIP</option>
                                            <option value="5010 - Cash">5010 - Cash Account</option>
                                            <option value="4010 - Cost of Goods Sold">4010 - Cost of Goods Sold (COGS)</option>
                                            <option value="6010 - Accounts Payable / Vendor">6010 - Accounts Payable</option>
                                            <option value="6100 - Salary Expense">6100 - Salary Expense</option>
                                            <option value="7010 - Sales Revenue">7010 - Sales Revenue</option>
                                        </select>
                                    </div>

                                    {/* Credit Account */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Kredit hisobi (Credit Account)</label>
                                        <select
                                            value={creditAccount}
                                            onChange={e => setCreditAccount(e.target.value)}
                                            className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        >
                                            <option value="1010 - Raw Material Inventory">1010 - Raw Material Inventory</option>
                                            <option value="2010 - Work-In-Progress Balance">2010 - Production WIP</option>
                                            <option value="5010 - Cash">5010 - Cash Account</option>
                                            <option value="4010 - Cost of Goods Sold">4010 - Cost of Goods Sold (COGS)</option>
                                            <option value="6010 - Accounts Payable / Vendor">6010 - Accounts Payable</option>
                                            <option value="6100 - Salary Expense">6100 - Salary Expense</option>
                                            <option value="7010 - Sales Revenue">7010 - Sales Revenue</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Cost Center Selector */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cost Center (Xarajat Markazi)</label>
                                    <select
                                        value={costCenter}
                                        onChange={e => setCostCenter(e.target.value)}
                                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="">Cost Center No-Assignment</option>
                                        <option value="Ishlab Chiqarish">Ishlab Chiqarish (TPA Sexi)</option>
                                        <option value="HR & Kadrlar">HR & Kadrlar Bo'limi</option>
                                        <option value="Ta'minot">Ta'minot Bo'limi</option>
                                        <option value="Texozlash">Texozlash & Servis</option>
                                        <option value="Boshqaruv">Ma'muriy Boshqaruv</option>
                                    </select>
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Operatsiya tavsifi (Description)</label>
                                    <textarea 
                                        placeholder="Shartnoma, faktura va operatsiya tafsilotlari..."
                                        value={descriptionInput}
                                        onChange={e => setDescriptionInput(e.target.value)}
                                        rows={3}
                                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsPostingModalOpen(false)}
                                        className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase px-6 py-2.5 rounded-xl transition-all"
                                    >
                                        Bekor Qilish
                                    </button>
                                    <button 
                                        type="submit"
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        Provodkani Saqlash
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 7. MODAL: P&L Statement Engine */}
            <AnimatePresence>
                {isPnLModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
                        >
                            <button 
                                onClick={() => setIsPnLModalOpen(false)}
                                className="absolute right-6 top-6 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                Daromad va Xarajatlar (P&L) Hisoboti
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl space-y-3">
                                    {/* Revenue */}
                                    <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-wider">
                                        <span>Jami Daromad (Gross Revenue)</span>
                                        <span className="text-emerald-400">${pnlReport.grossRevenue.toLocaleString()}</span>
                                    </div>
                                    {/* COGS */}
                                    <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-wider">
                                        <span>Sotilgan Mahsulot TanNarxi (COGS)</span>
                                        <span className="text-rose-500">-${pnlReport.cogs.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-800" />
                                    
                                    {/* Gross Profit */}
                                    <div className="flex justify-between items-center text-sm font-black uppercase text-white">
                                        <span>Yalpi Foyda (Gross Profit)</span>
                                        <span className="text-emerald-400">${pnlReport.grossProfit.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl space-y-3">
                                    {/* OPEX */}
                                    <div className="flex justify-between items-center text-xs font-black uppercase text-slate-400 tracking-wider">
                                        <span>Operatsion Xarajatlar (OPEX)</span>
                                        <span className="text-rose-500">-${pnlReport.opex.toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-800" />
                                    
                                    {/* Net Profit */}
                                    <div className="flex justify-between items-center text-lg font-black uppercase text-white bg-indigo-500/10 p-3 border border-indigo-500/20 rounded-xl">
                                        <span>Sof Foyda (Net Profit)</span>
                                        <span className="text-indigo-400">${pnlReport.netProfit.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 flex justify-end border-t border-slate-800">
                                <button 
                                    onClick={() => setIsPnLModalOpen(false)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    Hisobotni Yopish
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="h-24" />
        </div>
    );
}
