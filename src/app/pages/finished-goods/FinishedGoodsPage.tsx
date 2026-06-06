import { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { useSales } from '../../context/SalesContext';
import { useFinanceStore } from '../../store/financeStore';
import { mockContracts } from '../../data/contracts';
import {
  Package, Search, MapPin, Download, Factory,
  Calendar, CheckCircle, XCircle, Filter, ChevronRight,
  Truck, ShieldAlert, AlertTriangle, FileText, CheckCircle2,
  ArrowRight, QrCode, LogIn, Boxes, ScanLine, Clock, Layers,
  ClipboardList, Check, ShoppingBag, Eye
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Checkbox } from '../../components/ui/checkbox';

type TabMode = 'receipt' | 'inventory' | 'so-picking' | 'shipping';

export function FinishedGoodsPage() {
  const { t } = useLanguage();
  const { finishedGoods: initialGoods, setFinishedGoods: setContextGoods } = useWarehouse();
  const { salesOrders, startPicking, confirmPick, executeGoodsIssue } = useSales();
  const { ocrContracts } = useFinanceStore();

  // Local state for the complex modular dashboard
  const [activeTab, setActiveTab] = useState<TabMode>('inventory');
  const [finishedGoods, setFinishedGoods] = useState(initialGoods);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 1. Dispatch/Shipping State
  const [shippingQueue, setShippingQueue] = useState<{ productId: string, batchId: string, qty: number, productName: string, binLocation?: string }[]>([]);
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
      // Ignore if typing in an input field
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
    const scannedBatch = code.trim().toUpperCase();

    if (activeTab === 'receipt') {
      receiveBatch(scannedBatch);
    } else if (activeTab === 'shipping') {
      scanToDispatch(scannedBatch);
    } else {
      toast.info(`Scanned: ${scannedBatch}`, { description: 'Switch to Receipt or Shipping tab for automated actions.' });
    }
  };

  // State Synchronizer
  const updateFinishedGoodsState = (updater: (prev: typeof finishedGoods) => typeof finishedGoods) => {
    setFinishedGoods(prev => {
      const next = updater(prev);
      setContextGoods(next);
      return next;
    });
  };

  // UzAuto Motors SKU Portfolio
  const validSkus = useMemo(() => {
    const ocrSkus = ocrContracts
      .filter(c => c.party === "UzAuto Motors JSC" && c.type === "SALES (SOTUV)")
      .flatMap(c => c.allocatedItems.map(item => item.sku));
    const mockSkus = mockContracts
      .filter(c => c.receiver.name === "UzAuto Motors JSC")
      .flatMap(c => c.materials.map(item => item.sku));
    return Array.from(new Set([...ocrSkus, ...mockSkus]));
  }, [ocrContracts]);

  const isSkuValid = useMemo(() => {
    if (!receiptScannerInput.trim()) return true;
    const cleanInput = receiptScannerInput.trim();
    return validSkus.some(
      s => cleanInput === s || cleanInput.startsWith(s + '-') || cleanInput.startsWith(s + '_')
    );
  }, [receiptScannerInput, validSkus]);

  const validateAndToast = (sku: string) => {
    if (!sku.trim()) return;
    const cleanSku = sku.trim();
    const isValid = validSkus.some(
      s => cleanSku === s || cleanSku.startsWith(s + '-') || cleanSku.startsWith(s + '_')
    );
    if (!isValid) {
      toast.error("Xatolik: Ushbu detal faol shartnomalarda mavjud emas! (SKU not linked to active contracts)", {
        style: {
          backgroundColor: '#7f1d1d',
          color: '#fca5a5',
          borderColor: '#b91c1c'
        }
      });
    }
  };

  const receiveBatch = (code: string) => {
    const cleanCode = code.trim();
    const isValid = validSkus.some(
      s => cleanCode === s || cleanCode.startsWith(s + '-') || cleanCode.startsWith(s + '_')
    );
    if (!isValid) {
      validateAndToast(cleanCode);
      return;
    }

    const newBatchId = `BATCH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const bins = ['A-10', 'B-14', 'C-05', 'D-22'];
    const assignedBin = bins[Math.floor(Math.random() * bins.length)];
    const qty = 500;

    updateFinishedGoodsState(prev => {
      const existing = prev.find(fg => fg.sku === cleanCode || cleanCode.startsWith(fg.sku));
      if (existing) {
        return prev.map(fg => (fg.sku === cleanCode || cleanCode.startsWith(fg.sku)) ? {
          ...fg,
          totalQuantity: fg.totalQuantity + qty,
          availableQuantity: fg.availableQuantity + qty,
          batches: [
            ...fg.batches,
            {
              batch: newBatchId,
              quantity: qty,
              qcDate: new Date().toISOString().split('T')[0],
              sourceLine: fg.sourceLines[0] || 'Assembly Line A',
              warehouseLocation: assignedBin,
              receivedAt: new Date().toISOString(),
              receivedBy: 'Operator',
              productionDate: new Date().toISOString().split('T')[0],
              shift: 'A' as const
            }
          ],
          warehouseLocations: fg.warehouseLocations.includes(assignedBin) ? fg.warehouseLocations : [...fg.warehouseLocations, assignedBin]
        } : fg);
      } else {
        const newRecord = {
          id: `FG-${Date.now()}-${cleanCode}`,
          sku: cleanCode,
          productName: cleanCode === '26211286' ? 'Door Trim FL' : cleanCode === '26211284' ? 'Door Trim FR' : 'B2B Auto Part',
          unitPrice: 45000,
          totalQuantity: qty,
          reservedQuantity: 0,
          availableQuantity: qty,
          blockedQuantity: 0,
          lowStockThreshold: 500,
          batches: [{
            batch: newBatchId,
            quantity: qty,
            qcDate: new Date().toISOString().split('T')[0],
            sourceLine: 'Assembly Line A',
            warehouseLocation: assignedBin,
            receivedAt: new Date().toISOString(),
            receivedBy: 'Operator',
            productionDate: new Date().toISOString().split('T')[0],
            shift: 'A' as const
          }],
          warehouseLocations: [assignedBin],
          sourceLines: ['Assembly Line A'],
          status: 'AVAILABLE_FOR_SALE' as const,
          lastUpdated: new Date().toISOString()
        };
        return [...prev, newRecord];
      }
    });

    toast.success('Goods Receipt Successful', {
      description: `Scanned ${cleanCode}. Storage Bin Assignment: ${assignedBin}`,
      icon: <CheckCircle2 className="text-emerald-400 w-5 h-5" />
    });
    setReceiptScannerInput('');
  };

  const scanToDispatch = (batchId: string) => {
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

  const shippedQtySum = Array.from(shippedBatches).length * 850;
  const stagedQtySum = shippingQueue.reduce((a, c) => a + c.qty, 0);
  const totalShippedToday = shippedQtySum + stagedQtySum;
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

    const batchInfo = itemBatches.find(b => b.batch === batchId);
    const binLocation = batchInfo ? batchInfo.warehouseLocation : 'Unknown';

    setShippingQueue(prev => {
      if (prev.some(q => q.batchId === batchId)) return prev;
      return [...prev, { productId, batchId, qty: maxQty, productName, binLocation }];
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
    
    const skuQtyMap: Record<string, number> = {};
    shippingQueue.forEach(q => {
      const item = finishedGoods.find(fg => fg.id === q.productId);
      if (item) {
        const batchInfo = item.batches.find(b => b.batch === q.batchId);
        if (batchInfo && batchInfo.quantity <= q.qty) {
          newShipped.add(q.batchId);
        }
        skuQtyMap[item.sku] = (skuQtyMap[item.sku] || 0) + q.qty;
      }
      setSelectedBatches(s => { const ns = new Set(s); ns.delete(q.batchId); return ns; });
    });

    updateFinishedGoodsState(prev => {
      return prev.map(fg => {
        const shippedQty = skuQtyMap[fg.sku];
        if (shippedQty) {
          const updatedBatches = fg.batches.map(b => {
            const queueItem = shippingQueue.find(q => q.batchId === b.batch);
            if (queueItem) {
              return { ...b, quantity: Math.max(0, b.quantity - queueItem.qty) };
            }
            return b;
          }).filter(b => b.quantity > 0);

          return {
            ...fg,
            totalQuantity: Math.max(0, fg.totalQuantity - shippedQty),
            availableQuantity: Math.max(0, fg.availableQuantity - shippedQty),
            batches: updatedBatches,
            lastUpdated: new Date().toISOString()
          };
        }
        return fg;
      });
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
      allBatches.slice(0, 50).forEach(b => add.add(b.batch));
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
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const sku = receiptScannerInput.trim();
                const isValid = validSkus.some(s => sku === s || sku.startsWith(s + '-') || sku.startsWith(s + '_'));
                if (isValid) {
                  receiveBatch(sku);
                } else {
                  validateAndToast(sku);
                }
              }
            }}
            onBlur={() => {
              const sku = receiptScannerInput.trim();
              if (sku) {
                const isValid = validSkus.some(s => sku === s || sku.startsWith(s + '-') || sku.startsWith(s + '_'));
                if (!isValid) {
                  validateAndToast(sku);
                }
              }
            }}
            placeholder="Awaiting Scanner Input..."
            autoFocus
            className={`w-full text-xl h-20 pl-16 pr-6 bg-slate-950/80 border-2 rounded-2xl text-center font-mono font-black placeholder:text-slate-600 shadow-inner ${
              !isSkuValid ? 'border-red-500 text-red-400 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-slate-700 text-white focus-visible:ring-cyan-500 focus-visible:border-cyan-500'
            }`}
          />
        </div>
        <Button 
          onClick={() => receiveBatch(receiptScannerInput)} 
          disabled={!receiptScannerInput.trim() || !isSkuValid} 
          className="mt-8 h-12 px-10 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-xl disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
        >
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
                  <Button size="sm" disabled={batch.isHeld} onClick={() => {
                    const input = window.prompt(`Enter Quantity to Stage (Max: ${batch.quantity})`, batch.quantity.toString());
                    if (input === null) return;
                    const parsedQty = parseInt(input, 10);
                    if (isNaN(parsedQty) || parsedQty <= 0 || parsedQty > batch.quantity) {
                      toast.error("Invalid Quantity", { description: `Please enter a value between 1 and ${batch.quantity}.` });
                      return;
                    }
                    addToQueue(batch.productId, batch.batch, parsedQty, batch.productName, batch.parentBatches);
                  }} variant="outline" className="h-8 min-w-[80px] border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-cyan-500 text-[10px] font-black uppercase tracking-widest">
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

  const renderSOPickingTab = () => {
    const activeOrders = salesOrders.filter(o => 
      ['CONFIRMED', 'PICKING_PENDING', 'PICKING', 'PACKING', 'GOODS_ISSUED', 'SHIPPED'].includes(o.status)
    );
    const selectedOrder = salesOrders.find(o => o.id === selectedOrderId);

    return (
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Sidebar: Pending Pick Orders */}
        <div className="w-full xl:w-[320px] shrink-0 border border-slate-800 bg-slate-900 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-400" /> Pending Pick Orders
            </h3>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {activeOrders.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-8">No active orders</p>
            ) : (
              activeOrders.map(order => {
                const isSelected = order.id === selectedOrderId;
                const totalItems = order.lines.reduce((s, l) => s + l.quantity, 0);
                
                const uniqueBins = Array.from(new Set(
                  order.pickList?.map(p => p.binLocation).filter(Boolean) || []
                ));

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-violet-950/20 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-xs font-black text-violet-400">{order.id}</span>
                      <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ${
                        order.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        order.status === 'PICKING_PENDING' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        order.status === 'PACKING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {order.status === 'PICKING_PENDING' ? 'Pick Pending' : order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-baseline w-full">
                      <span className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{order.customer}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-black shrink-0">{totalItems.toLocaleString()} PCS</span>
                    </div>

                    {/* Coordinates list in sidebar */}
                    <div className="flex flex-wrap gap-1.5 mt-1 border-t border-slate-800/80 pt-2 w-full">
                      {uniqueBins.length > 0 ? (
                        uniqueBins.map(bin => (
                          <span key={bin} className="text-[8px] font-mono font-black bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            Bin: {bin}
                          </span>
                        ))
                      ) : (
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Bin: Pending list gen</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 w-full border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-xl min-h-[450px]">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Detail Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-white tracking-tight">{selectedOrder.id}</span>
                    <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-700 font-mono font-bold text-xs uppercase px-2">{selectedOrder.status}</Badge>
                  </div>
                  <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-wider">{selectedOrder.customer}</p>
                </div>
                <div className="flex gap-2">
                  {(selectedOrder.status === 'CONFIRMED' || (selectedOrder.status === 'PICKING_PENDING' && (!selectedOrder.pickList || selectedOrder.pickList.length === 0))) && (
                    <Button 
                      onClick={() => {
                        startPicking(selectedOrder.id);
                        toast.success('FIFO picking list generated successfully!');
                      }}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl"
                    >
                      Generate FIFO Pick List
                    </Button>
                  )}
                  {selectedOrder.status === 'PICKING_PENDING' && selectedOrder.pickList && selectedOrder.pickList.length > 0 && (
                    <Button 
                      disabled={!selectedOrder.pickList.every(p => p.confirmed)}
                      onClick={() => {
                        confirmPick(selectedOrder.id, selectedOrder.pickList);
                        toast.success('Pick list confirmed. Order is now in PACKING stage!');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl shadow-lg"
                    >
                      Execute Pick Confirmation
                    </Button>
                  )}
                  {selectedOrder.status === 'PACKING' && (
                    <Button 
                      onClick={() => {
                        executeGoodsIssue(selectedOrder.id);
                        toast.success('Goods Issue executed successfully! IDoc Generated.');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl shadow-lg"
                    >
                      Execute Goods Issue (GI)
                    </Button>
                  )}
                </div>
              </div>

              {/* Order Lines or Pick List Table */}
              {selectedOrder.status === 'CONFIRMED' || (selectedOrder.status === 'PICKING_PENDING' && (!selectedOrder.pickList || selectedOrder.pickList.length === 0)) ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Items</h4>
                  <div className="border border-slate-800 bg-slate-950/50 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-5 py-3 bg-slate-950 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Product & SKU</span>
                      <span className="text-right">Qty (PCS)</span>
                      <span className="text-right">Price</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {selectedOrder.lines.map(l => (
                        <div key={l.sku} className="grid grid-cols-[1fr_100px_100px] gap-4 px-5 py-3.5 items-center">
                          <div>
                            <p className="text-sm font-bold text-slate-200">{l.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{l.sku}</p>
                          </div>
                          <span className="text-sm font-black text-white text-right">{l.quantity.toLocaleString()}</span>
                          <span className="text-sm font-bold text-slate-400 text-right">{(l.unitPrice / 1000).toFixed(0)}k UZS</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedOrder.status === 'PICKING_PENDING' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">FIFO Picking Map (EWM Coordinates)</h4>
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                      {selectedOrder.pickList.filter(p => p.confirmed).length} / {selectedOrder.pickList.length} Picked
                    </span>
                  </div>
                  <div className="border border-slate-800 bg-slate-950/50 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-[1fr_120px_100px_100px_120px] gap-4 px-5 py-3 bg-slate-950 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Product & SKU</span>
                      <span>Batch ID</span>
                      <span>Bin Location</span>
                      <span className="text-right">Qty (PCS)</span>
                      <span className="text-right">Action</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {selectedOrder.pickList.map((p, idx) => (
                        <div key={idx} className={`grid grid-cols-[1fr_120px_100px_100px_120px] gap-4 px-5 py-4 items-center transition-colors ${p.confirmed ? 'bg-emerald-950/10' : 'hover:bg-slate-800/30'}`}>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{p.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                          </div>
                          <span className="text-xs font-black font-mono text-cyan-400">{p.batchId}</span>
                          <div>
                            <Badge className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-[10px] px-2 py-0.5 border">
                              Bin: {p.binLocation}
                            </Badge>
                          </div>
                          <span className="text-sm font-black text-white text-right">{p.quantityRequired.toLocaleString()}</span>
                          <div className="text-right">
                            {p.confirmed ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase px-2 py-1">Confirmed</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const updated = selectedOrder.pickList.map((item, i) => 
                                    i === idx ? { ...item, confirmed: true, quantityPicked: item.quantityRequired } : item
                                  );
                                  selectedOrder.pickList = updated;
                                  setSelectedOrderId(prev => prev); // trigger state update by resetting to same ID
                                  toast.success(`Picked Batch ${p.batchId} from Bin ${p.binLocation}`);
                                }}
                                className="h-8 bg-slate-900 border border-slate-700 hover:border-violet-500 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest px-3 rounded-lg"
                              >
                                Confirm Pick
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Process Completed</h4>
                  <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <h5 className="text-white font-bold text-base">All Pick Tasks Verified & Dispatched</h5>
                    <p className="text-xs text-slate-400 max-w-md">The shipment plan for {selectedOrder.id} has been fully picked and verified. SAP IDoc payload is updated and logged.</p>
                    {selectedOrder.goodsIssuedAt && (
                      <Badge variant="outline" className="bg-emerald-950/20 border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                        GOODS ISSUE COMPLETED @ {new Date(selectedOrder.goodsIssuedAt).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-500 py-16">
              <ClipboardList className="w-16 h-16 opacity-30 animate-pulse text-slate-600" />
              <div>
                <h4 className="text-white font-bold text-base">EWM Order Dispatch Workspace</h4>
                <p className="text-xs max-w-sm mt-1">Select an active Sales Order from the pending orders sidebar to allocate storage slots, run ATP checks, and execute FIFO picking lists.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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
                    <h4 className="text-sm font-bold text-slate-200 pr-8 leading-tight mb-2 flex items-center justify-between">
                      <span className="truncate">{q.productName}</span>
                      <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-700 font-mono text-[9px] px-1.5 ml-2 shrink-0">Bin: {q.binLocation || 'Unknown'}</Badge>
                    </h4>
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
        <div className="col-span-1 border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center mb-2 z-10">
            <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Factory className="w-4 h-4 text-cyan-400" /> WAREHOUSE TELEMETRY
            </h2>
            <Badge variant="outline" className="text-[9px] font-mono text-cyan-400 border-cyan-500/30">LIVE</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 z-10 border-t border-slate-800/80 pt-3">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">TOTAL FG (PCS)</p>
              <p className="text-lg font-black text-white font-mono mt-0.5">{finishedGoods.reduce((s, f) => s + f.totalQuantity, 0).toLocaleString()}</p>
            </div>
            <div className="border-l border-slate-800 pl-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">AVAILABLE</p>
              <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{summary.availableQuantity.toLocaleString()}</p>
            </div>
            <div className="border-l border-slate-800 pl-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">SHIPPED TODAY</p>
              <p className="text-lg font-black text-cyan-400 font-mono mt-0.5">{totalShippedToday.toLocaleString()}</p>
            </div>
          </div>
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
          { id: 'so-picking', icon: ClipboardList, label: 'SO Picking', sub: 'Zayavka yig\'ish', badge: salesOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PICKING_PENDING').length || null },
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
              {tab.badge && <Badge variant="secondary" className="absolute top-3 right-3 bg-cyan-500 text-slate-950 font-black text-[9px] px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full">{tab.badge}</Badge>}
              {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 translate-y-px" />}
            </button>
          );
        })}
      </div>

      {/* Render Active Workspace */}
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        {activeTab === 'receipt' && renderReceiptTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'so-picking' && renderSOPickingTab()}
        {activeTab === 'shipping' && renderShippingTab()}
      </div>

    </div>
  );
}
