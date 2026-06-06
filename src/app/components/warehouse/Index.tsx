import React, { useState, useMemo } from 'react';
import {
    Box, Search, Shield as ShieldIcon,
    Package, Truck, LayoutGrid, ClipboardList,
    UserCog, BarChart3, Info, Maximize2
} from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { TooltipProvider } from '../ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useWarehouseStore } from '../../store/warehouseStore';

// Tabs
import StockTab from './tabs/StockTab';
import GoodsReceiptWaybillTab from './tabs/GoodsReceiptWaybillTab';
import GoodsIssueWaybillTab from './tabs/GoodsIssueWaybillTab';
import BinMapTab from './tabs/BinMapTab';
import PPEWMTab from './tabs/PPEWMTab';
import ResourcesTab from './tabs/ResourcesTab';
import PickingTab from './tabs/PickingTab';
import DocsTab from './tabs/DocsTab';
import StatsTab from './tabs/StatsTab';

// Deprecated (preserving for now)
import ReceiptTab from './tabs/ReceiptTab';

// Components
import NotificationDropdown from './NotificationDropdown';

export default function WarehouseIndex() {
    const { stock, bins, tasks } = useWarehouseStore();
    const [activeTab, setActiveTab] = useState('stock');
    const [globalSearch, setGlobalSearch] = useState('');

    const stats = useMemo(() => {
        const totalStock = stock.reduce((acc, item) => acc + item.totalStock, 0);
        const usedBins = bins.filter(b => b.status !== 'AVAILABLE').length;
        const utilization = Math.round((usedBins / bins.length) * 100);
        const pendingPutaway = tasks.filter(t => t.type === 'PUTAWAY' && t.status === 'PENDING').length;
        const urgentPicking = tasks.filter(t => t.type === 'PICKING' && t.status === 'PENDING').length;

        return {
            totalStock,
            utilization,
            pendingPutaway,
            urgentPicking
        };
    }, [stock, bins, tasks]);

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col min-h-screen bg-[#020617] text-slate-100 font-sans pb-20">
                {/* Global Header */}
                <div className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-[#020617]/80 backdrop-blur-3xl border-b border-slate-800/50 shadow-2xl">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Box className="w-5 h-5 text-white" />
                                </div>
                                SAP S/4HANA <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8 italic">WAREHOUSE</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-black mt-1">Global Logistics Engine</p>
                        </div>

                        <div className="hidden lg:flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-2 group focus-within:border-blue-500/50 transition-all shadow-inner">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-500" />
                            <Input
                                placeholder="Search Material, Bin or Document..."
                                className="bg-transparent border-none h-6 text-sm w-96 focus-visible:ring-0 shadow-none p-0"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-[0.2em] leading-none mb-1">Node S4H</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-emerald-500 font-black font-mono">0.4ms</span>
                                <Badge className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[8px] font-black h-4 px-1.5 uppercase">Optimal</Badge>
                            </div>
                        </div>
                        <NotificationDropdown />
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 border border-white/10 flex items-center justify-center font-black text-sm shadow-xl shadow-blue-900/20">AD</div>
                    </div>
                </div>

                <div className="w-full px-8 pt-8 space-y-8 animate-in fade-in duration-700">
                    {/* KPI Dashboard Header */}
                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
                        <Card className="bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Stock Inventory</p>
                            <h2 className="text-2xl font-black text-white">{stats.totalStock.toLocaleString()} <span className="text-xs font-normal text-slate-500">pcs</span></h2>
                            <p className="text-[9px] text-blue-500 font-black mt-2 uppercase tracking-wide">SAP S/4HANA EWM</p>
                            <Package className="absolute -bottom-2 -right-2 w-16 h-16 text-blue-500 opacity-5 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Bin Utilization</p>
                            <h2 className="text-2xl font-black text-white">{stats.utilization}%</h2>
                            <div className="w-full h-1 bg-slate-950 mt-3 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${stats.utilization}%` }} />
                            </div>
                            <p className="text-[9px] text-slate-500 font-black mt-2 uppercase tracking-wide">Threshold: 90%</p>
                            <LayoutGrid className="absolute -bottom-2 -right-2 w-16 h-16 text-emerald-500 opacity-5 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/30 transition-all">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Pending Putaway</p>
                            <h2 className="text-2xl font-black text-white">{stats.pendingPutaway} <span className="text-xs font-normal text-slate-500">items</span></h2>
                            <p className="text-[9px] text-amber-500 font-black mt-2 uppercase tracking-wide">Ready for Binning</p>
                            <Truck className="absolute -bottom-2 -right-2 w-16 h-16 text-amber-500 opacity-5 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="bg-slate-900/40 border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/30 transition-all">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Urgent Picking</p>
                            <h2 className="text-2xl font-black text-white">{stats.urgentPicking}</h2>
                            <p className="text-[9px] text-rose-500 font-black mt-2 uppercase tracking-wide font-mono">High Priority Orders</p>
                            <Maximize2 className="absolute -bottom-2 -right-2 w-16 h-16 text-rose-500 opacity-5 group-hover:scale-110 transition-transform" />
                        </Card>

                        <Card className="bg-slate-950 border-2 border-blue-600/30 p-8 flex flex-col justify-center relative overflow-hidden group backdrop-blur-md rounded-3xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldIcon className="w-16 h-16 text-blue-500" />
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500">Security Node</h3>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <span className="text-[10px] text-slate-500 font-black uppercase">Latency</span>
                                    <span className="text-xs text-emerald-500 font-black font-mono">0.4ms</span>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Tab Navigation */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                        <div className="bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/50 inline-flex">
                            <TabsList className="bg-transparent gap-1">
                                {[
                                    { id: 'stock', label: 'Stock', icon: Package },
                                    { id: 'goods-receipt', label: 'Goods Receipt', icon: Truck },
                                    { id: 'goods-issue', label: 'Goods Issue', icon: ClipboardList },
                                    { id: 'binmap', label: 'Bin Map', icon: LayoutGrid },
                                    { id: 'picking', label: 'Picking', icon: ClipboardList },
                                    { id: 'ppe-ewm', label: 'PP-EWM', icon: ClipboardList },
                                    { id: 'resources', label: 'Resources', icon: UserCog },
                                    { id: 'docs', label: 'Docs', icon: Info },
                                    { id: 'stats', label: 'Stats', icon: BarChart3 },
                                ].map((t) => (
                                    <TabsTrigger
                                        key={t.id}
                                        value={t.id}
                                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all gap-2"
                                    >
                                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="min-h-[600px]">
                            <TabsContent value="stock" className="m-0 focus-visible:ring-0 outline-none">
                                <StockTab />
                            </TabsContent>
                            <TabsContent value="goods-receipt" className="m-0 focus-visible:ring-0 outline-none">
                                <GoodsReceiptWaybillTab />
                            </TabsContent>
                            <TabsContent value="goods-issue" className="m-0 focus-visible:ring-0 outline-none">
                                <GoodsIssueWaybillTab />
                            </TabsContent>
                            <TabsContent value="binmap" className="m-0 focus-visible:ring-0 outline-none">
                                <BinMapTab />
                            </TabsContent>
                            <TabsContent value="picking" className="m-0 focus-visible:ring-0 outline-none">
                                <PickingTab />
                            </TabsContent>
                            <TabsContent value="ppe-ewm" className="m-0 focus-visible:ring-0 outline-none">
                                <PPEWMTab />
                            </TabsContent>
                            <TabsContent value="resources" className="m-0 focus-visible:ring-0 outline-none">
                                <ResourcesTab />
                            </TabsContent>
                            <TabsContent value="docs" className="m-0 focus-visible:ring-0 outline-none">
                                <DocsTab />
                            </TabsContent>
                            <TabsContent value="stats" className="m-0 focus-visible:ring-0 outline-none">
                                <StatsTab />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </TooltipProvider>
    );
}
