import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    ShoppingCart, Package, Truck, ClipboardList, Plus, Search,
    Filter, ArrowUpRight, Star, BarChart3, Download, QrCode, FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const PURCHASE_REQUESTS = [
    { id: 'PR-2026-084', item: 'Plastik Granula (ABS)', qty: 5000, unit: 'kg', dept: 'Ishlab Chiqarish', requestedBy: 'A. Karimov', date: '2026-04-25', status: 'approved', priority: 'high' },
    { id: 'PR-2026-083', item: 'Himoya Ko\'zoynak', qty: 200, unit: 'dona', dept: 'Xavfsizlik', requestedBy: 'B. Rahimov', date: '2026-04-24', status: 'pending', priority: 'medium' },
    { id: 'PR-2026-082', item: 'Siqilgan Havo Filtri', qty: 50, unit: 'dona', dept: 'Texozlash', requestedBy: 'S. Yusupov', date: '2026-04-23', status: 'pending', priority: 'high' },
];

const PURCHASE_ORDERS = [
    { id: 'PO-2026-031', supplier: 'ChemPoly Solutions', items: 3, value: 42500, date: '2026-04-25', delivery: '2026-05-05', status: 'sent' },
    { id: 'PO-2026-030', supplier: 'SafetyFirst UZ', items: 2, value: 8700, date: '2026-04-24', delivery: '2026-04-30', status: 'acknowledged' },
    { id: 'PO-2026-029', supplier: 'Industrial Parts Ltd', items: 5, value: 67200, date: '2026-04-22', delivery: '2026-05-10', status: 'delivered' },
];

const TOP_SUPPLIERS = [
    { id: 'SUP-001', name: 'ChemPoly Solutions', tin: '302441992', orders: 18, rating: 4.8, spend: 320000 },
    { id: 'SUP-002', name: 'Industrial Parts Ltd', tin: '201556883', orders: 14, rating: 4.6, spend: 280000 },
    { id: 'SUP-003', name: 'SafetyFirst UZ', tin: '307881223', orders: 9, rating: 4.9, spend: 95000 },
    { id: 'SUP-004', name: 'Office Depot UZ', tin: '204991774', orders: 23, rating: 4.3, spend: 48000 },
];

// ─── Components ──────────────────────────────────────────────────────────────
const SectionHeader = ({ title, icon: Icon, color }: any) => (
    <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-black text-white uppercase tracking-wider">{title}</h2>
        <div className="h-px flex-1 bg-slate-800/50" />
    </div>
);

export function ProcurementPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* 1. Header & Cockpit Section */}
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-2xl">
                                <ShoppingCart className="w-8 h-8 text-cyan-400" />
                            </div>
                            Ta'minot Boshqaruvi
                            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">SRM / MM</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 ml-1">Supplier Relationship • Purchase Requisition • Purchase Order</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase px-6 py-3 rounded-xl transition-all">
                            <QrCode className="w-4 h-4" />
                            Scan PO (TSD)
                        </button>
                        <button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase px-6 py-3 rounded-xl transition-all shadow-xl shadow-cyan-600/20">
                            <Plus className="w-4 h-4" />
                            Yangi Xarid
                        </button>
                    </div>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: "Ochiq Talablar", value: "12", sub: "8 tasi shoshilinch", icon: ClipboardList, color: "from-amber-600/20 to-amber-900/20", border: "border-amber-500/30", text: "text-amber-400" },
                        { label: "Faol Buyurtmalar", value: "24", sub: "15 tasi yo'lda", icon: Truck, color: "from-cyan-600/20 to-cyan-900/20", border: "border-cyan-500/30", text: "text-cyan-400" },
                        { label: "Bu Oy Xarajat", value: "$4.2M", sub: "+12.5% o'tgan oyga", icon: BarChart3, color: "from-indigo-600/20 to-indigo-900/20", border: "border-indigo-500/30", text: "text-indigo-400" },
                        { label: "Yetkazib Beruvchi", value: "148", sub: "4 tasi yangi", icon: Star, color: "from-emerald-600/20 to-emerald-900/20", border: "border-emerald-500/30", text: "text-emerald-400" }
                    ].map((k, i) => (
                        <motion.div key={i} whileHover={{ y: -4 }} className={`bg-gradient-to-br ${k.color} border ${k.border} rounded-2xl p-5 backdrop-blur-md`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-3xl font-black text-white">{k.value}</p>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{k.label}</p>
                                </div>
                                <div className={`p-2 rounded-lg bg-slate-900/50 ${k.text}`}>
                                    <k.icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1.5">
                                <ArrowUpRight className={`w-3 h-3 ${k.text}`} />
                                <span className="text-[10px] font-bold text-slate-500">{k.sub}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* 2. Operational Section: PR & PO Management */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Purchase Requisitions */}
                <div className="space-y-4">
                    <SectionHeader title="Xarid Talablari (PR)" icon={ClipboardList} color="bg-amber-600" />
                    <div className="space-y-3">
                        {PURCHASE_REQUESTS.map((pr, i) => (
                            <motion.div key={pr.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                className="bg-slate-900/50 border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 flex items-center justify-between transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-colors">
                                        {pr.id.split('-')[2]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{pr.item}</p>
                                        <p className="text-xs text-slate-500">{pr.dept} · {pr.requestedBy}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">{pr.qty} {pr.unit}</p>
                                    <span className={`text-[10px] font-bold uppercase ${pr.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {pr.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                        <button className="w-full py-3 border border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all uppercase tracking-widest">
                            Barchasini Ko'rish
                        </button>
                    </div>
                </div>

                {/* Purchase Orders */}
                <div className="space-y-4">
                    <SectionHeader title="Xarid Buyurtmalari (PO)" icon={ShoppingCart} color="bg-cyan-600" />
                    <div className="space-y-3">
                        {PURCHASE_ORDERS.map((po, i) => (
                            <motion.div key={po.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                className="bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 rounded-xl p-4 flex items-center justify-between transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{po.id}</p>
                                        <p className="text-xs text-slate-500">{po.supplier}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">${po.value.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Yetkazish: {po.delivery}</p>
                                </div>
                            </motion.div>
                        ))}
                        <button className="w-full py-3 border border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all uppercase tracking-widest">
                            PO Arxivini Ochish
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Analytics & Supplier Intelligence */}
            <div className="p-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                    <SectionHeader title="Oylik Xarid Tahlili & Yetkazib Beruvchilar Bazasi" icon={BarChart3} color="bg-indigo-600" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart */}
                        <div className="lg:col-span-2 h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { month: 'Yan', val: 850000 }, { month: 'Fev', val: 1100000 },
                                    { month: 'Mar', val: 950000 }, { month: 'Apr', val: 1300000 },
                                    { month: 'May', val: 1200000 }, { month: 'Iyn', val: 1500000 },
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={v => `$${v / 1000000}M`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Supplier Cards */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Eng Ko'p Buyurtmalar</p>
                            {TOP_SUPPLIERS.slice(0, 3).map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                            {s.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{s.name}</p>
                                            <p className="text-[9px] text-slate-500">{s.orders} martta xarid</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span className="text-xs font-black">{s.rating}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Bottom Utility: Comprehensive Data Grid */}
            <div className="p-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Barcha Yetkazib Beruvchilar</h3>
                            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 gap-2">
                                <Search className="w-3.5 h-3.5 text-slate-500" />
                                <input type="text" placeholder="Qidirish (Nomi, STIR)..." className="bg-transparent border-none text-[11px] text-white focus:outline-none w-48" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><Filter className="w-4 h-4" /></button>
                            <div className="flex items-center gap-1">
                                <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-all border border-slate-700">
                                    <Download className="w-3.5 h-3.5" />
                                    Excel
                                </button>
                                <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-4 py-2 rounded-lg transition-all border border-slate-700">
                                    <FileText className="w-3.5 h-3.5" />
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/30 border-b border-slate-800">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Kompaniya Nomi</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">STIR (TIN)</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Jami Buyurtma</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Balans</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reyting</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Harakat</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {TOP_SUPPLIERS.map((s, i) => (
                                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-xs font-mono text-cyan-400 font-bold">{s.id}</td>
                                        <td className="px-6 py-4 text-xs font-black text-white">{s.name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{s.tin}</td>
                                        <td className="px-6 py-4 text-xs text-slate-300 font-bold">{s.orders}</td>
                                        <td className="px-6 py-4 text-xs text-emerald-400 font-black">${s.spend.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <Star key={star} className={`w-2.5 h-2.5 ${star <= Math.round(s.rating) ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{s.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">Batafsil</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center">
                        <p className="text-[10px] text-slate-500 font-bold">Jami 148 yetkazib beruvchidan 4 tasi ko'rsatilmoqda</p>
                        <div className="flex gap-1">
                            {[1, 2, 3, '...', 15].map((p, i) => (
                                <button key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${p === 1 ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Padding for Scroll */}
            <div className="h-24" />
        </div>
    );
}
