import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWarehouse } from '../../context/WarehouseContext';
import {
  Package, Search, MapPin, Download, FileSpreadsheet, Factory,
  Calendar, CheckCircle, XCircle, ChevronDown, ChevronUp, Filter,
  Truck, ShieldAlert, AlertTriangle, FileText, Map, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export function FinishedGoodsPage() {
  const { t } = useLanguage();
  const { finishedGoods } = useWarehouse();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedQCStatus, setSelectedQCStatus] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Dispatch Cockpit State
  const [shippingQueue, setShippingQueue] = useState<{ productId: string, batchId: string, qty: number, productName: string, maxQty: number }[]>([]);
  const [qualityHolds, setQualityHolds] = useState<Set<string>>(new Set());
  const [shippedBatches, setShippedBatches] = useState<Set<string>>(new Set());

  const dailyTarget = 15000;

  // Calculate summary statistics
  const summary = useMemo(() => {
    let totalProducts = 0;
    let totalQuantity = 0;
    let availableQuantity = 0;
    let reservedQuantity = 0;

    finishedGoods.forEach(fg => {
      // Adjust quantities based on mock shipped state
      let shippedQty = 0;
      fg.batches.forEach(b => {
        if (shippedBatches.has(b.batch)) shippedQty += b.quantity;
      });

      totalProducts++;
      totalQuantity += (fg.totalQuantity - shippedQty);
      availableQuantity += (fg.availableQuantity - shippedQty); // assuming shipped comes from available
      reservedQuantity += fg.reservedQuantity;
    });

    return { totalProducts, totalQuantity, availableQuantity, reservedQuantity };
  }, [finishedGoods, shippedBatches]);

  const readinessPercent = summary.availableQuantity + summary.reservedQuantity > 0
    ? Math.round((summary.availableQuantity / (summary.availableQuantity + summary.reservedQuantity)) * 100)
    : 0;

  const dispatchProgress = Math.min(Math.round(((15000 - summary.availableQuantity) / dailyTarget) * 100), 100); // Mock progress relative to missing inventory or just a static progress
  // A better dispatch progress: total shipped today. Let's calculate shipped qty
  let totalShippedToday = 0;
  finishedGoods.forEach(fg => {
    fg.batches.forEach(b => {
      if (shippedBatches.has(b.batch)) totalShippedToday += b.quantity;
    });
  });
  const actualDispatchProgress = Math.min(Math.round((totalShippedToday / dailyTarget) * 100), 100);

  // Extract filter options
  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    finishedGoods.forEach(fg => {
      fg.warehouseLocations.forEach(loc => locations.add(loc));
    });
    return Array.from(locations).sort();
  }, [finishedGoods]);

  // Filter products
  const filteredGoods = useMemo(() => {
    return finishedGoods.filter(item => {
      const matchesSearch =
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        selectedLocation === 'all' ||
        item.warehouseLocations.includes(selectedLocation);

      const matchesQCStatus =
        selectedQCStatus === 'all' ||
        (selectedQCStatus === 'passed' && item.batches.length > 0 &&
          item.batches.every(batch => batch.qcDate));

      // Hide if all batches are shipped
      const allShipped = item.batches.every(b => shippedBatches.has(b.batch));

      return matchesSearch && matchesLocation && matchesQCStatus && !allShipped;
    });
  }, [finishedGoods, searchTerm, selectedLocation, selectedQCStatus, shippedBatches]);

  const sortBatchesByDate = (batches: typeof finishedGoods[0]['batches']) => {
    return [...batches].sort((a, b) => {
      const dateA = new Date(a.receivedAt).getTime();
      const dateB = new Date(b.receivedAt).getTime();
      return dateA - dateB;
    });
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const handleExportManifest = () => {
    toast.success('Manifest Generated', { description: 'PDF & Excel manifests downloaded.', icon: <FileText className="w-4 h-4 text-cyan-400" /> });
  };

  const openBinMap = (locations: string[]) => {
    toast('Warehouse Bin Map', { description: `Highlighting locations: ${locations.join(', ')}`, icon: <Map className="w-4 h-4 text-cyan-400" /> });
  };

  const toggleQualityHold = (batchId: string) => {
    setQualityHolds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
        toast.success(`Quality Hold removed for ${batchId}`);
      } else {
        newSet.add(batchId);
        toast.error(`Quality Hold applied on ${batchId}`, { icon: <ShieldAlert className="w-4 h-4" /> });
        setShippingQueue(q => q.filter(i => i.batchId !== batchId)); // Remove from queue if held
      }
      return newSet;
    });
  };

  const addToQueue = (productId: string, batchId: string, maxQty: number, productName: string, itemBatches: any[]) => {
    if (qualityHolds.has(batchId)) {
      toast.error('Quality Hold Active', { description: 'Batch is on hold and cannot be shipped.' });
      return;
    }

    const validBatches = sortBatchesByDate(itemBatches).filter(b => !qualityHolds.has(b.batch) && !shippedBatches.has(b.batch));
    const oldestBatch = validBatches[0];

    if (oldestBatch && oldestBatch.batch !== batchId) {
      toast.error('Violates FIFO', { description: `Older batch ${oldestBatch.batch} must be shipped first.` });
      return;
    }

    if (!shippingQueue.find(q => q.batchId === batchId)) {
      setShippingQueue([...shippingQueue, { productId, batchId, qty: maxQty, productName, maxQty }]);
      toast.success('Added to Dispatch');
    }
  };

  const removeFromQueue = (batchId: string) => {
    setShippingQueue(q => q.filter(i => i.batchId !== batchId));
  };

  const executeShipment = () => {
    if (shippingQueue.length === 0) return;
    toast.success('Shipment Executed', { description: 'Manifest Generated & Stock marked "In Transit"' });
    const newShipped = new Set(shippedBatches);
    shippingQueue.forEach(q => newShipped.add(q.batchId));
    setShippedBatches(newShipped);
    setShippingQueue([]);
  };

  const queueTotal = shippingQueue.reduce((acc, curr) => acc + curr.qty, 0);

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950 font-mono text-slate-300 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* 1. Global Analytics Header */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl" />
          <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-2 tracking-tight">
            <Truck className="w-8 h-8 text-cyan-400" />
            Dispatch Center
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">ZPP_OUTBOUND_01</p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900 shadow-xl flex flex-col justify-center">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Readiness for UzAuto</span>
              <span className="text-emerald-400 font-black text-sm">{readinessPercent}%</span>
            </div>
            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${readinessPercent}%` }} />
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-bold">
              <span>AVAILABLE: <span className="text-emerald-400">{summary.availableQuantity}</span></span>
              <span>ALLOCATED/BAND: <span className="text-amber-400">{summary.reservedQuantity}</span></span>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900 shadow-xl flex flex-col justify-center">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Daily Dispatch Target</span>
              <span className="text-cyan-400 font-black text-sm">{actualDispatchProgress}%</span>
            </div>
            <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full transition-all duration-1000" style={{ width: `${actualDispatchProgress}%` }} />
            </div>
            <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-bold">
              <span>SHIPPED: <span className="text-white">{totalShippedToday.toLocaleString()}</span></span>
              <span>TARGET: <span className="text-slate-400">{dailyTarget.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">

        {/* Left Side: Advanced Grid Features */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Filters */}
          <div className="border border-slate-800 bg-slate-900 rounded-xl p-4 flex items-center gap-4 flex-wrap shadow-lg">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search SKU or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-slate-950 border-slate-700 text-white font-mono rounded-lg"
              />
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48 h-10 bg-slate-950 border-slate-700 text-slate-300 font-mono rounded-lg">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                <SelectItem value="all">Barcha joylar</SelectItem>
                {allLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedQCStatus} onValueChange={setSelectedQCStatus}>
              <SelectTrigger className="w-48 h-10 bg-slate-950 border-slate-700 text-slate-300 font-mono rounded-lg">
                <SelectValue placeholder="QC Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                <SelectItem value="all">Hammasi</SelectItem>
                <SelectItem value="passed">QC Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid View */}
          <div className="space-y-4">
            {filteredGoods.map(item => {
              const sortedBatches = sortBatchesByDate(item.batches).filter(b => !shippedBatches.has(b.batch));
              if (sortedBatches.length === 0) return null;
              const isExpanded = expandedProducts.has(item.id);

              // Recalculate Available for display
              const dispAvailable = item.availableQuantity - item.batches.filter(b => shippedBatches.has(b.batch)).reduce((s, b) => s + b.quantity, 0);

              return (
                <div key={item.id} className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden shadow-lg hover:border-slate-700 transition-colors">
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-white">{item.productName}</h3>
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-950 text-slate-400 border-slate-700">{item.sku}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Mavjud: <span className="text-emerald-400 font-black text-base">{dispAvailable}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Band: <span className="text-amber-400 font-black text-base">{item.reservedQuantity}</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button variant="outline" onClick={() => openBinMap(item.warehouseLocations)} className="h-9 px-4 text-xs font-bold uppercase tracking-widest bg-slate-950 border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500 shrink-0">
                        <MapPin className="w-3.5 h-3.5 mr-2" /> Bin Map
                      </Button>
                      <Button variant="ghost" onClick={() => toggleProductExpansion(item.id)} className="h-9 w-9 p-0 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 shrink-0 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* 2. Advanced Grid Features: Expandable Rows */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/50 p-4">
                      <div className="grid grid-cols-[100px_1fr_100px_120px_100px_160px] gap-4 mb-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/50">
                        <span>Batch ID</span>
                        <span>Location</span>
                        <span className="text-right">Qty</span>
                        <span>Prod. Date</span>
                        <span>QC Status</span>
                        <span className="text-right">Actions</span>
                      </div>
                      <div className="space-y-2">
                        {sortedBatches.map((batch, idx) => {
                          const isHeld = qualityHolds.has(batch.batch);
                          const isQueued = shippingQueue.some(q => q.batchId === batch.batch);

                          return (
                            <div key={idx} className={`grid grid-cols-[100px_1fr_100px_120px_100px_160px] gap-4 items-center px-4 py-3 rounded-lg border transition-all ${isHeld ? 'bg-red-500/5 border-red-500/20' : isQueued ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                              <span className={`text-xs font-bold ${isHeld ? 'text-red-400 line-through' : 'text-slate-300'}`}>{batch.batch}</span>
                              <span className="text-xs text-slate-400">{batch.warehouseLocation}</span>
                              <span className="text-xs font-black text-right text-white">{batch.quantity}</span>
                              <span className="text-xs text-slate-500">{batch.receivedAt.split('T')[0]}</span>
                              <div>
                                {batch.qcDate ? (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">APPROVED</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">PENDING</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => toggleQualityHold(batch.batch)} className={`h-7 w-7 p-0 rounded-md ${isHeld ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-400' : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'}`}>
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </Button>
                                {isQueued ? (
                                  <Button size="sm" variant="outline" onClick={() => removeFromQueue(batch.batch)} className="h-7 px-3 text-[10px] bg-slate-950 border-slate-700 text-slate-400 hover:text-white rounded-md">UNQUEUE</Button>
                                ) : (
                                  <Button size="sm" disabled={isHeld} onClick={() => addToQueue(item.id, batch.batch, batch.quantity, item.productName, item.batches)} className={`h-7 px-3 text-[10px] font-bold rounded-md uppercase tracking-wider ${isHeld ? 'bg-slate-800 text-slate-600' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
                                    + ADD
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Dispatch Cockpit Sidebar */}
        <aside className="w-full xl:w-96 shrink-0 flex flex-col gap-6 sticky top-6 self-start">
          <div className="border border-slate-800 bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[calc(100vh-4rem)] max-h-[800px]">
            <div className="p-5 border-b border-slate-800 bg-slate-950/50">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-400" /> Ready for Shipping
              </h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Staging Area & Manifest</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-2">
              {shippingQueue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <Package className="w-12 h-12 text-slate-800" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Batches Queued</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingQueue.map((q, i) => (
                    <div key={i} className="p-3 border border-cyan-500/30 bg-cyan-500/5 rounded-xl group relative">
                      <button onClick={() => removeFromQueue(q.batchId)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-4 h-4" /></button>
                      <h4 className="text-sm font-black text-slate-200 truncate pr-6">{q.productName}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant="outline" className="bg-slate-950 text-slate-400 font-mono text-[9px] border-slate-700">{q.batchId}</Badge>
                        <span className="text-cyan-400 font-black text-sm">{q.qty} <span className="text-xs text-slate-500">pcs</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-950 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-end mb-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">Total Volume<br /><span className="text-2xl font-black text-white font-mono mt-1 block">{queueTotal.toLocaleString()} <span className="text-sm text-slate-500">units</span></span></div>
                <Button variant="ghost" onClick={handleExportManifest} disabled={shippingQueue.length === 0} className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950 transition-colors h-9 px-3 text-[10px] font-black uppercase tracking-widest">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Manifest
                </Button>
              </div>
              <Button
                onClick={executeShipment}
                disabled={shippingQueue.length === 0}
                className={`w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all duration-300 ${shippingQueue.length > 0 ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]' : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'}`}
              >
                EXECUTE SHIPMENT <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
