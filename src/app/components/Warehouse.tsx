import React, { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { WarehouseCockpit } from './warehouse/WarehouseCockpit';
import { StockOverview } from './warehouse/StockOverview';
import { GoodsReceiptProcessor } from './warehouse/GoodsReceiptProcessor';
import { BinManagementMap } from './warehouse/BinManagementMap';
import { ProductionLogisticsManager } from './warehouse/ProductionLogisticsManager';
import { WarehouseAnalytics } from './warehouse/WarehouseAnalytics';
import { MaterialDocumentList } from './warehouse/MaterialDocumentList';
import { WarehouseResourceMonitor } from './warehouse/WarehouseResourceMonitor';
import PickingOrdersTab from './warehouse/PickingOrdersTab';
import { WaybillManager } from './warehouse/WaybillManager';
import { useWarehouse } from '../context/WarehouseContext';
import { useWarehouseStore } from '../store/warehouseStore';
import { usePickingStore } from '../store/pickingStore';
import {
  Package,
  Truck,
  Move,
  LayoutGrid,
  BarChart3,
  Settings2,
  ShieldCheck,
  Box,
  Search,
  Bell,
  Shield as ShieldIcon,
  Map,
  ClipboardList,
  UserCog,
  RefreshCw,
  History as HistoryIcon
} from 'lucide-react';
import InventoryReconciliationTab from './warehouse/tabs/InventoryReconciliationTab';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { TooltipProvider } from './ui/tooltip';

export function Warehouse() {
  const { finishedGoods, requests } = useWarehouse();

  // Convert Context Data to StockOverview format
  const stockItems = useMemo(() => {
    if (!finishedGoods) return [];
    return finishedGoods.map(fg => ({
      id: fg.sku,
      name: fg.productName,
      category: 'Finished Goods',
      total: fg.totalQuantity,
      unrestricted: fg.availableQuantity,
      reserved: fg.reservedQuantity,
      blocked: fg.blockedQuantity,
      quality: 0,
      bin: fg.warehouseLocations?.[0] || 'Unassigned',
      unit: 'pcs'
    }));
  }, [finishedGoods]);

  // Strategic Stats for Cockpit
  const stats = useMemo(() => {
    if (!stockItems || !requests) return {
      totalItems: 0, availableStock: 0, reservedStock: 0, blockedStock: 0,
      utilization: 0, pendingReceipts: 0, urgentPicks: 0, pendingPicks: 0
    };

    const total = stockItems.reduce((acc, item) => acc + item.total, 0);
    const available = stockItems.reduce((acc, item) => acc + item.unrestricted, 0);
    const reserved = stockItems.reduce((acc, item) => acc + item.reserved, 0);
    const blocked = stockItems.reduce((acc, item) => acc + item.blocked, 0);
    const urgentPicks = requests.filter(r => r.priority === 'High').length;
    const pickingOrders = usePickingStore.getState().orders;
    const pendingPicks = pickingOrders.filter(o => o.status === 'PENDING').length;
    const { documents } = useWarehouseStore.getState();
    const today = new Date().toISOString().split('T')[0];
    const todayGR = documents.filter(d => d.type === 'GOODS_RECEIPT' && d.postDate.startsWith(today)).length;
    const openTransfers = documents.filter(d => d.type === 'TRANSFER').length;

    return {
      totalItems: total,
      availableStock: available,
      reservedStock: reserved,
      blockedStock: blocked,
      utilization: 74,
      pendingReceipts: 3,
      urgentPicks,
      pendingPicks,
      todayGR,
      dockToStock: '42m',
      openTransfers
    };
  }, [stockItems, requests]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col min-h-full bg-[#020617] text-slate-100 overflow-hidden relative font-sans">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[150px] pointer-events-none" />

        {/* SAP Top Navigation bar */}
        <div className="z-20 flex items-center justify-between px-6 py-3 bg-slate-900/40 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                  <Box className="w-4 h-4 text-white" />
                </div>
                SAP S/4HANA <span className="text-blue-500">Warehouse</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-60">Global Logistics Engine</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-1.5 shadow-inner group focus-within:border-blue-500/50 transition-all">
              <Search className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-blue-500" />
              <Input
                placeholder="Search..."
                className="bg-transparent border-none h-5 text-xs w-80 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617]" />
            </Button>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold uppercase">Admin</span>
                  <span className="text-[9px] text-emerald-500 font-black">Online</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-600 border border-slate-800 flex items-center justify-center font-bold text-xs shadow-lg">AD</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative z-10">
          <div className="w-full mx-auto space-y-4 pb-8">
            <section className="grid grid-cols-1 xl:grid-cols-6 gap-4">
              <div className="xl:col-span-5">
                <WarehouseCockpit stats={stats} />
              </div>
              <Card className="bg-slate-900/40 border border-slate-800/80 p-4 flex flex-col justify-center relative overflow-hidden group backdrop-blur-md">
                <div className="absolute top-0 right-0 p-2 opacity-[0.05]">
                  <ShieldIcon className="w-16 h-16 text-blue-500" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Node S4H</h3>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-slate-500 font-bold">Latency</span>
                    <span className="text-emerald-500 font-black">0.4ms</span>
                  </div>
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-slate-500 font-bold">Health</span>
                    <span className="text-emerald-500 font-black uppercase">Optimal</span>
                  </div>
                </div>
              </Card>
            </section>

            <Tabs defaultValue="stock" className="space-y-4">
              <div className="flex items-center justify-between sticky top-0 bg-[#020617]/90 backdrop-blur-xl z-30 py-2 border-b border-slate-800/50">
                <TabsList className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl h-auto">
                  <TabsTrigger value="stock" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <LayoutGrid className="w-3.5 h-3.5" /> Stock
                  </TabsTrigger>
                  <TabsTrigger value="gr" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <Truck className="w-3.5 h-3.5" /> Receipt
                  </TabsTrigger>
                  <TabsTrigger value="bin" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <Move className="w-3.5 h-3.5" /> Bin Map
                  </TabsTrigger>
                  <TabsTrigger value="gi" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <Package className="w-3.5 h-3.5" /> PP-EWM
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <UserCog className="w-3.5 h-3.5" /> Resources
                  </TabsTrigger>
                  <TabsTrigger value="picking" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <Package className="w-3.5 h-3.5" /> Picking
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <ClipboardList className="w-3.5 h-3.5" /> Docs
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-[10px] font-black uppercase px-4 py-2 gap-2">
                    <BarChart3 className="w-3.5 h-3.5" /> Stats
                  </TabsTrigger>
                  <TabsTrigger value="inventory-reconciliation" className="text-[10px] font-black uppercase px-4 py-2 gap-2 text-blue-400 border-l border-slate-800 ml-1 pl-4">
                    <HistoryIcon className="w-3.5 h-3.5" /> Stats / Inventory
                  </TabsTrigger>
                </TabsList>
                <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[10px] font-black tracking-widest text-blue-400">PLANT: P001</Badge>
              </div>

              <div className="mt-4">
                <TabsContent value="stock" className="outline-none"><StockOverview /></TabsContent>
                <TabsContent value="gr" className="outline-none"><GoodsReceiptProcessor /></TabsContent>
                <TabsContent value="bin" className="outline-none"><BinManagementMap /></TabsContent>
                <TabsContent value="gi" className="outline-none"><ProductionLogisticsManager /></TabsContent>
                <TabsContent value="resources" className="outline-none"><WarehouseResourceMonitor /></TabsContent>
                <TabsContent value="picking" className="outline-none"><PickingOrdersTab /></TabsContent>
                <TabsContent value="docs" className="outline-none"><MaterialDocumentList /></TabsContent>
                <TabsContent value="analytics" className="outline-none"><WarehouseAnalytics /></TabsContent>
                <TabsContent value="inventory-reconciliation" className="outline-none">
                  <InventoryReconciliationTab />
                </TabsContent>
              </div>
            </Tabs>

            <WaybillManager />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
