import { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWarehouse } from '../../context/WarehouseContext';
import {
  Package, Search, MapPin, Download, Factory,
  Calendar, CheckCircle, XCircle, Filter, ChevronRight,
  Truck, ShieldAlert, AlertTriangle, FileText, CheckCircle2,
  ArrowRight, QrCode, LogIn, Boxes, ScanLine, Clock, Layers
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Checkbox } from '../../components/ui/checkbox';

type TabMode = 'receipt' | 'inventory' | 'shipping';

export function FinishedGoodsPage() {
  const { t } = useLanguage();
  // We'll mock some dispatch interactions locally since we are heavily customizing the UI above the context
  const { finishedGoods: initialGoods } = useWarehouse();

  // Local state for the complex modular dashboard
  const [activeTab, setActiveTab] = useState<TabMode>('inventory');
  const [finishedGoods, setFinishedGoods] = useState(initialGoods);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Dispatch/Shipping State
  const [shippingQueue, setShippingQueue] = useState<{ productId: string, batchId: string, qty: number, productName: string }[]>([]);
  const [qualityHolds, setQualityHolds] = useState<Set<string>>(new Set());
  const [shippedBatches, setShippedBatches] = useState<Set<string>>(new Set());

  // 2. Receipt State
  const [receiptScannerInput, setReceiptScannerInput] = useState('');

  // 3. Inventory Bulk State
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());

  // 4. Analytics
  const dailyTarget = 15000;

  // -- QR Code Global Listener --
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field (unless it's the specific scanner input which we handle directly)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();

      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          handleQRScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, finishedGoods, qualityHolds, shippedBatches, shippingQueue]);

  const handleQRScan = (code: string) => {
    // Mock QR Code parsing: assume format "BATCH_ID" or "SKU-QTY"
    const scannedBatch = code.trim().toUpperCase();

    if (activeTab === 'receipt') {
      receiveBatch(scannedBatch);
    } else if (activeTab === 'shipping') {
      // Find batch and add to queue
      scanToDispatch(scannedBatch);
    } else {
      toast.info(`Scanned: ${scannedBatch}`, { description: 'Switch to Receipt or Shipping tab for automated actions.' });
    }
  };

  const receiveBatch = (code: string) => {
    // For demo: create a dummy batch assigned to a random bin layout
    const bins = ['A-10', 'B-14', 'C-05', 'D-22'];
    const assignedBin = bins[Math.floor(Math.random() * bins.length)];
    toast.success('Goods Receipt Successful', {
      description: `Scanned ${code}. Storage Bin Assignment: ${assignedBin}`,
      icon: <CheckCircle2 className="text-emerald-400 w-5 h-5" />
    });
    setReceiptScannerInput('');
  };

  const scanToDispatch = (batchId: string) => {
    // Find item by batch
    for (const item of finishedGoods) {
      const b = item.batches.find(x => x.batch.toUpperCase() === batchId.toUpperCase());
      if (b) {
        addToQueue(item.id, b.batch, b.quantity, item.productName, item.batches, true);
        return;
      }
    }
    toast.error('Dispatch Failed', { description: `Batch ${batchId} not found in inventory.` });
  };


  // -- Computed Analytics --
  const summary = useMemo(() => {
    let availableQuantity = 0;
    let reservedQuantity = 0;

    finishedGoods.forEach(fg => {
      let shippedQty = 0;
      fg.batches.forEach(b => {
        if (shippedBatches.has(b.batch)) shippedQty += b.quantity;
      });
      availableQuantity += (fg.availableQuantity - shippedQty);
      reservedQuantity += fg.reservedQuantity;
    });

    return { availableQuantity, reservedQuantity };
  }, [finishedGoods, shippedBatches]);

  const readinessPercent = summary.availableQuantity + summary.reservedQuantity > 0
    ? Math.round((summary.availableQuantity / (summary.availableQuantity + summary.reservedQuantity)) * 100) : 0;

  let totalShippedToday = Array.from(shippedBatches).length * 850; // mocking avg size for visual
  const actualDispatchProgress = Math.min(Math.round((totalShippedToday / dailyTarget) * 100), 100);

  // Helper arrays
  const allBatches = useMemo(() => {
    return finishedGoods.flatMap(item =>
      item.batches.map(b => ({
        ...b,
        productId: item.id,
        productName: item.productName,
        sku: item.sku,
        isShipped: shippedBatches.has(b.batch),
        isHeld: qualityHolds.has(b.batch),
        isQueued: shippingQueue.some(q => q.batchId === b.batch),
        parentBatches: item.batches
      }))
    ).filter(b => !b.isShipped)
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
  }, [finishedGoods, shippedBatches, qualityHolds, shippingQueue]);

  // -- Actions --

  const toggleQualityHold = (batchId: string) => {
    setQualityHolds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
        toast.success(`Quality Hold removed for ${batchId}`);
      } else {
        newSet.add(batchId);
        toast.error(`Quality Hold applied on ${batchId}`, { icon: <ShieldAlert className="w-4 h-4" /> });
        setShippingQueue(q => q.filter(i => i.batchId !== batchId));
        setSelectedBatches(s => { const ns = new Set(s); ns.delete(batchId); return ns; });
      }
      return newSet;
    });
  };

  const checkFIFO = (productId: string, batchId: string, itemBatches: any[]): string | null => {
    const validBatches = itemBatches
      .filter(b => !qualityHolds.has(b.batch) && !shippedBatches.has(b.batch))
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

    if (validBatches.length > 0) {
      const oldestBatch = validBatches[0];
      if (oldestBatch.batch !== batchId) {
        // Double check if oldest is already queued
        const oldestQueued = shippingQueue.some(q => q.batchId === oldestBatch.batch);
        if (!oldestQueued) {
          return oldestBatch.batch;
        }
      }
    }
    return null;
  };

  const addToQueue = (productId: string, batchId: string, maxQty: number, productName: string, itemBatches: any[], silentFifoOverride = false) => {
    if (qualityHolds.has(batchId)) {
      toast.error('Quality Hold Active', { description: `${batchId} is on hold and cannot be shipped.` });
      return false;
    }

    const fifoConflict = checkFIFO(productId, batchId, itemBatches);
    if (fifoConflict && !silentFifoOverride) {
      toast.error('FIFO Warning', { description: `Violates FIFO: Older Batch [${fifoConflict}] is still available in stock. Process it first.`, icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> });
      return false;
    }

    setShippingQueue(prev => {
      if (prev.some(q => q.batchId === batchId)) return prev;
      return [...prev, { productId, batchId, qty: maxQty, productName }];
    });
    return true;
  };

  const removeFromQueue = (batchId: string) => {
    setShippingQueue(q => q.filter(i => i.batchId !== batchId));
  };

  const executeShipment = () => {
    if (shippingQueue.length === 0) return;
    toast.success('Shipment Executed', { description: 'PDF Manifest Generated & Stock marked "In Transit"' });
    const newShipped = new Set(shippedBatches);
    shippingQueue.forEach(q => {
      newShipped.add(q.batchId);
      setSelectedBatches(s => { const ns = new Set(s); ns.delete(q.batchId); return ns; });
    });
    setShippedBatches(newShipped);
    setShippingQueue([]);
  };

  // Bulk Actions
  const toggleSelectBatch = (batchId: string) => {
    setSelectedBatches(prev => {
      const n = new Set(prev);
      if (n.has(batchId)) n.delete(batchId);
      else n.add(batchId);
      return n;
    });
  };

  const selectAll = (checked: boolean) => {
    if (checked) {
      const add = new Set(selectedBatches);
      allBatches.slice(0, 50).forEach(b => add.add(b.batch)); // limit for performance
      setSelectedBatches(add);
    } else {
      setSelectedBatches(new Set());
    }
  };

  const handleBulkShip = () => {
    let queuesAdded = 0;
    Array.from(selectedBatches).forEach(batchId => {
      const batchData = allBatches.find(b => b.batch === batchId);
      if (batchData) {
        // Add passing true for silent FIFO override for bulk or let it error individually:
        const success = addToQueue(batchData.productId, batchData.batch, batchData.quantity, batchData.productName, batchData.parentBatches, false);
        if (success) queuesAdded++;
      }
    });
    if (queuesAdded > 0) {
      toast.success(`Bulk Dispatch`, { description: `Added ${queuesAdded} batches to shipping queue.` });
      setSelectedBatches(new Set());
    }
  };

  const handleBulkRelocate = () => {
    toast.info('Bulk Relocation', { description: `${selectedBatches.size} batches marked for Bin transfer. Task created for forklifts.` });
    setSelectedBatches(new Set());
  };


  // --- Render Tabs ---

  const renderReceiptTab = () => (
    <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl min-h-[500px] shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?q=80&w=1000')] bg-cover bg-center opacity-5 mix-blend-luminosity" />
      <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <ScanLine className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Incoming Goods Receipt</h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Scan barcode or type ID to register to warehouse</p>

        <div className="relative w-full">
          <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400 animate-pulse" />
          <Input
            value={receiptScannerInput}
            onChange={e => setReceiptScannerInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') receiveBatch(receiptScannerInput); }}
            placeholder="Awaiting Scanner Input..."
            autoFocus
            className="w-full text-xl h-20 pl-16 pr-6 bg-slate-950/80 border-2 border-slate-700 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 rounded-2xl text-center font-mono font-black text-white placeholder:text-slate-600 shadow-inner"
          />
        </div>
        <Button onClick={() => receiveBatch(receiptScannerInput)} disabled={!receiptScannerInput} className="mt-8 h-12 px-10 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-xl">
          Register Manually
        </Button>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="flex flex-col gap-6">
      {/* Filters & Bulk Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-lg">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative min-w-[250px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Filter by SKU, Batch, or Bin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-slate-950 border-slate-700 text-white font-mono rounded-lg"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40 h-10 bg-slate-950 border-slate-700 text-slate-300 font-mono rounded-lg"><SelectValue placeholder="QC Status" /></SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white"><SelectItem value="all">All Status</SelectItem><SelectItem value="passed">Approved</SelectItem></SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Controller */}
        {selectedBatches.size > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300 p-1.5 pl-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{selectedBatches.size} selected</span>
            <div className="w-px h-5 bg-cyan-500/30 mx-1" />
            <Button size="sm" onClick={handleBulkRelocate} variant="outline" className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-slate-900 border-cyan-500/30 text-slate-300 hover:text-white hover:bg-slate-800">
              <Layers className="w-3.5 h-3.5 mr-1.5" /> Bulk Relocate
            </Button>
            <Button size="sm" onClick={handleBulkShip} className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white border-transparent">
              <Truck className="w-3.5 h-3.5 mr-1.5" /> Bulk Ship
            </Button>
          </div>
        )}
      </div>

      {/* Full-width Searchable Grid */}
      <div className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-[50px_1fr_120px_140px_120px_120px_140px] gap-4 px-6 py-4 bg-slate-950/80 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <div className="flex items-center"><Checkbox onCheckedChange={selectAll} /></div>
          <span>Product & SKU</span>
          <span>Batch ID</span>
          <span>Bin Location</span>
          <span className="text-right">Quantity</span>
          <span>Prod. Date</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
          {allBatches.filter(b => b.productName.toLowerCase().includes(searchTerm.toLowerCase()) || b.batch.toLowerCase().includes(searchTerm.toLowerCase()) || b.warehouseLocation.toLowerCase().includes(searchTerm.toLowerCase())).map((batch) => (
            <div key={batch.batch} className={`grid grid-cols-[50px_1fr_120px_140px_120px_120px_140px] gap-4 items-center px-6 py-4 hover:bg-slate-800/50 transition-colors ${selectedBatches.has(batch.batch) ? 'bg-cyan-900/10' : ''} ${batch.isHeld ? 'bg-red-500/5 opacity-80' : ''}`}>
              <div className="flex items-center"><Checkbox checked={selectedBatches.has(batch.batch)} onCheckedChange={() => toggleSelectBatch(batch.batch)} /></div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{batch.productName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{batch.sku}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-black font-mono ${batch.isHeld ? 'text-red-400 line-through' : 'text-cyan-400'}`}>{batch.batch}</span>
                {batch.isHeld && <ShieldAlert className="w-3 h-3 text-red-500" />}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-700 font-mono text-[10px] px-1.5">{batch.warehouseLocation}</Badge>
              </div>

              <span className="text-sm font-black text-white text-right">{batch.quantity.toLocaleString()}</span>

              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-mono">{batch.receivedAt.split('T')[0]}</span>
                {batch.qcDate ? <span className="text-[9px] font-black text-emerald-500">QC PASSED</span> : <span className="text-[9px] font-black text-amber-500">QC PENDING</span>}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button size="icon" variant="ghost" onClick={() => toggleQualityHold(batch.batch)} className={`h-8 w-8 rounded-lg ${batch.isHeld ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'}`}>
                  <ShieldAlert className="w-4 h-4" />
                </Button>
                {batch.isQueued ? (
                  <Badge variant="outline" className="h-8 justify-center min-w-[80px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase">Queued</Badge>
                ) : (
                  <Button size="sm" disabled={batch.isHeld} onClick={() => addToQueue(batch.productId, batch.batch, batch.quantity, batch.productName, batch.parentBatches)} variant="outline" className="h-8 min-w-[80px] border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-cyan-500 text-[10px] font-black uppercase tracking-widest">
                    To Ship
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderShippingTab = () => (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      {/* Left: Orders & Scan input */}
      <div className="flex-1 w-full flex flex-col gap-6">
        <div className="border border-slate-800 bg-slate-900 rounded-2xl p-8 shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500" />
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight"><FileText className="w-7 h-7 text-cyan-400" /> Vagon Loading Plan - UZAUTO</h3>
            <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">Route Tracker: Andijan Assembly Plant Sector 4</p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Clock className="w-5 h-5" />
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest">Departure in</p>
              <p className="text-xl font-mono font-black text-white">04:22:15</p>
            </div>
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900 rounded-2xl p-6 shadow-xl relative">
          <Badge variant="outline" className="absolute top-6 right-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase">Auto-Scan Enabled</Badge>
          <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">Fast-Scan Dispatch</h4>
          <div className="relative">
            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Scan Barcode to add to Shipping Queue..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  scanToDispatch(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              className="pl-12 h-14 bg-slate-950 border-slate-700 text-lg font-mono text-white rounded-xl shadow-inner focus-visible:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Right: Sticky Ready for Shipping Dispatch Cockpit */}
      <aside className="w-full xl:w-[420px] shrink-0 sticky top-6">
        <div className="border border-slate-800 bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-[calc(100vh-140px)] max-h-[800px]">
          <div className="p-6 border-b border-slate-800 bg-slate-950/70">
            <h3 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
              <Truck className="w-6 h-6 text-cyan-400" /> Ready for Shipping
            </h3>
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Staging Area & Manifest</p>
              <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 text-[10px] font-mono">{shippingQueue.length} BATCHES</Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
            {shippingQueue.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                <Boxes className="w-16 h-16 opacity-50" />
                <p className="text-xs font-black uppercase tracking-widest text-center">Scan or select batches<br />from inventory to stage</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shippingQueue.map((q, i) => (
                  <div key={i} className="p-4 border border-cyan-500/30 bg-cyan-950/30 rounded-2xl group relative backdrop-blur-sm">
                    <button onClick={() => removeFromQueue(q.batchId)} className="absolute top-3 right-3 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-full p-1"><XCircle className="w-4 h-4" /></button>
                    <h4 className="text-sm font-bold text-slate-200 truncate pr-8 leading-tight mb-2">{q.productName}</h4>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="bg-slate-900 text-cyan-400 font-mono text-[10px] border-cyan-900">{q.batchId}</Badge>
                      <span className="text-white font-black font-mono text-base">{q.qty.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">PCS</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-950 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Payload Volume</p>
                <p className="text-3xl font-black text-white font-mono">{shippingQueue.reduce((a, c) => a + c.qty, 0).toLocaleString()}</p>
              </div>
              <Button variant="outline" disabled={shippingQueue.length === 0} className="text-cyan-400 border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900 hover:text-white transition-colors h-10 px-4 text-xs font-black uppercase tracking-widest rounded-xl">
                <Download className="w-4 h-4 mr-2" /> Manifest
              </Button>
            </div>
            <Button
              onClick={executeShipment}
              disabled={shippingQueue.length === 0}
              className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${shippingQueue.length > 0 ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/40' : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'}`}
            >
              EXECUTE SHIPMENT <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );

  // --- Main Layout ---
  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950 font-sans text-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Intelligent Global Analytics Header */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-1 tracking-tight">
            <Factory className="w-8 h-8 text-cyan-400" /> Distribution Center
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">SAP High-Volume Hub</p>
        </div>

        <div className="col-span-2 border border-slate-800 rounded-3xl p-6 bg-slate-900 shadow-lg flex gap-8 items-center">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Readiness for UzAuto</span>
              <span className="text-emerald-400 font-black font-mono text-base">{readinessPercent}%</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${readinessPercent}%` }} />
            </div>
            {/* 4. Intelligence & Risk Prediction */}
            <p className="text-[10px] font-bold text-amber-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Stock will be depleted in 48 hours based on demand.</p>
          </div>

          <div className="w-px h-16 bg-slate-800 hidden md:block" />

          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-cyan-400" /> Daily Dispatch Target</span>
              <span className="text-cyan-400 font-black font-mono text-base">{actualDispatchProgress}%</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full transition-all duration-1000" style={{ width: `${actualDispatchProgress}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <span>SHIPPED: <span className="text-white font-mono">{totalShippedToday.toLocaleString()}</span></span>
              <span>TARGET: <span className="text-slate-400 font-mono">{dailyTarget.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Modular Workspace Tabs UI */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-px">
        {[
          { id: 'receipt', icon: LogIn, label: 'Goods Receipt', sub: 'Qabul qilish' },
          { id: 'inventory', icon: Boxes, label: 'Inventory & Bin Map', sub: 'Zaxira va Xarita' },
          { id: 'shipping', icon: Truck, label: 'Shipping & Dispatch', sub: "Jo'natish", badge: shippingQueue.length > 0 ? shippingQueue.length : null }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabMode)} className={`relative flex items-center gap-3 px-6 py-4 rounded-t-2xl transition-all ${isActive ? 'bg-slate-900 border-t border-x border-slate-800 text-white shadow-[0_-10px_20px_rgba(0,0,0,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 shadow-sm">{tab.label}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">{tab.sub}</p>
              </div>
              {tab.badge && <Badge variant="secondary" className="absolute top-3 right-3 bg-cyan-500 text-slate-950 font-black text-[9px] px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full animate-bounce">{tab.badge}</Badge>}
              {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 translate-y-px" />}
            </button>
          );
        })}
      </div>

      {/* Render Active Workspace */}
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        {activeTab === 'receipt' && renderReceiptTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'shipping' && renderShippingTab()}
      </div>

    </div>
  );
}
