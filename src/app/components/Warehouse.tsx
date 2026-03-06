import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Package, AlertTriangle, CheckCircle, Search, ArrowRight, Layers, Box, AlertCircle, Info, Check, Image as ImageIcon, TrendingDown, MapPin, Zap, Clock, Undo2, Filter, X, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ShieldAlert, Plus, Trash2, PackageCheck, Printer, ScanLine, Barcode, Keyboard, Settings2, User, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { KitIssuanceModal } from './KitIssuanceModal';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from 'recharts';
import { useWarehouse, MockRequest, PickListItem } from '../context/WarehouseContext';
import { useFactory } from '../context/FactoryContext';

// --- MOCK DATA ---
type MaterialCategory = 'Raw Materials' | 'Components' | 'Finished Goods' | 'All';

interface BOMItem {
  materialId: string;
  materialName: string;
  qty: number;
}

interface MockMaterial {
  id: string;
  name: string;
  category: MaterialCategory;
  binLocation: string; // NEW
  current_stock: number;
  reserved_stock: number;
  inspection_stock: number; // NEW FOR RETURNS
  min_stock: number;
  usage_per_shift: number;
  bom?: BOMItem[];
  supplier?: string;
  lastMovement?: string;
  available?: number;
  shiftsRemaining?: number;
  predictiveHealth?: 'Ready' | 'Warning' | 'Critical';
  alertMessage?: string;
}



// Generate an extended 20-item Mock Kit for PLAN-A1 to demonstrate dense layout
const generateDenseKit = (): PickListItem[] => {
  const kit: PickListItem[] = [];
  const parts = [
    { n: 'Metal Clips Type A', id: 'COMP-001', loc: 'A-101' },
    { n: 'Rubber Seals', id: 'COMP-002', loc: 'A-102' },
    { n: 'Polypropylene Granules', id: 'RM-001', loc: 'Silo-01' },
    { n: 'Masterbatch Black', id: 'RM-002', loc: 'Rack-03' },
    { n: '10mm Washers', id: 'COMP-005', loc: 'B-201' },
    { n: 'M4 Torx Screws', id: 'COMP-006', loc: 'B-202' },
    { n: 'Adhesive Tape Roll', id: 'COMP-007', loc: 'C-301' },
    { n: 'Plastic Bezels', id: 'COMP-008', loc: 'C-302' },
    { n: 'Sound Absorber Foam', id: 'COMP-009', loc: 'D-401' },
    { n: 'Wiring Harness Hook', id: 'COMP-010', loc: 'D-402' },
    { n: 'ABS Resin', id: 'RM-003', loc: 'Silo-02' },
    { n: 'Colorant Blue', id: 'RM-004', loc: 'Rack-04' },
    { n: 'Side Panel Inserts', id: 'COMP-011', loc: 'E-501' },
    { n: 'Speaker Grill Cover', id: 'COMP-012', loc: 'E-502' },
    { n: 'Armrest Padding', id: 'COMP-013', loc: 'F-601' },
    { n: 'Leatherette Wrap', id: 'COMP-014', loc: 'F-602' },
    { n: 'Door Handle Inner', id: 'COMP-015', loc: 'G-701' },
    { n: 'Window Switch Bracket', id: 'COMP-016', loc: 'G-702' },
    { n: 'Lock Pin Bezels', id: 'COMP-017', loc: 'H-801' },
    { n: 'Vibration Dampener', id: 'COMP-018', loc: 'H-802' },
  ];

  parts.forEach((p, i) => {
    kit.push({
      id: `kit-${i}`,
      name: p.n,
      partNumber: p.id,
      requiredQty: Math.floor(Math.random() * 500) + 50,
      binLocation: p.loc,
      currentStock: 0, // Injected dynamically later
    });
  });

  return kit;
};

const denseMockKitA1 = generateDenseKit();

// Materials base mapping
const initialMaterials: MockMaterial[] = [
  { id: 'RM-001', name: 'Polypropylene Granules', category: 'Raw Materials', binLocation: 'Silo-01', current_stock: 15000, inspection_stock: 0, reserved_stock: 3500, min_stock: 5000, usage_per_shift: 1200, supplier: 'UzAuto Polymers', lastMovement: '2023-10-25T10:00:00Z' },
  { id: 'RM-002', name: 'Masterbatch Black', category: 'Raw Materials', binLocation: 'Rack-03', current_stock: 800, inspection_stock: 0, reserved_stock: 750, min_stock: 200, usage_per_shift: 50, supplier: 'Global Plastics', lastMovement: '2023-10-20T08:30:00Z' },
  { id: 'COMP-001', name: 'Metal Clips Type A', category: 'Components', binLocation: 'A-101', current_stock: 50000, inspection_stock: 0, reserved_stock: 12000, min_stock: 10000, usage_per_shift: 4000, supplier: 'MetalCorp Uz', lastMovement: '2023-10-26T14:15:00Z' },
  { id: 'COMP-002', name: 'Rubber Seals', category: 'Components', binLocation: 'A-102', current_stock: 200, inspection_stock: 0, reserved_stock: 200, min_stock: 5000, usage_per_shift: 1000, supplier: 'SealTech', lastMovement: '2023-09-15T09:00:00Z' },
  { id: 'COMP-003', name: 'UzAuto Logo Badges', category: 'Components', binLocation: 'A-103', current_stock: 8500, inspection_stock: 0, reserved_stock: 2000, min_stock: 1000, usage_per_shift: 500, supplier: 'UzAuto Motors', lastMovement: '2023-10-10T11:45:00Z' },
  { id: 'COMP-005', name: '10mm Washers', category: 'Components', binLocation: 'B-201', current_stock: 15000, inspection_stock: 0, reserved_stock: 2000, min_stock: 1000, usage_per_shift: 1300, supplier: 'Fasteners Inc', lastMovement: '2023-10-26T16:20:00Z' },
  { id: 'COMP-006', name: 'M4 Torx Screws', category: 'Components', binLocation: 'B-202', current_stock: 125000, inspection_stock: 0, reserved_stock: 4000, min_stock: 5000, usage_per_shift: 10000, supplier: 'Fasteners Inc', lastMovement: '2023-10-27T08:10:00Z' },
  { id: 'COMP-007', name: 'Adhesive Tape Roll', category: 'Components', binLocation: 'C-301', current_stock: 800, inspection_stock: 0, reserved_stock: 100, min_stock: 500, usage_per_shift: 150, supplier: '3M Industrial', lastMovement: '2023-10-01T10:30:00Z' },
  { id: 'COMP-008', name: 'Plastic Bezels', category: 'Components', binLocation: 'C-302', current_stock: 2000, inspection_stock: 0, reserved_stock: 500, min_stock: 500, usage_per_shift: 450, supplier: 'UzAuto Polymers', lastMovement: '2023-10-15T13:40:00Z' },
  { id: 'COMP-009', name: 'Sound Absorber Foam', category: 'Components', binLocation: 'D-401', current_stock: 150, inspection_stock: 0, reserved_stock: 50, min_stock: 100, usage_per_shift: 25, supplier: 'AcousticTech', lastMovement: '2023-08-30T09:25:00Z' },
  {
    id: 'FG-001',
    name: 'Door Trim Front Left',
    category: 'Finished Goods',
    binLocation: 'Z-001',
    current_stock: 450,
    reserved_stock: 0,
    inspection_stock: 0,
    min_stock: 100,
    usage_per_shift: 0,
    supplier: 'Internal Production',
    lastMovement: '2023-10-27T15:00:00Z',
    bom: [
      { materialId: 'RM-001', materialName: 'Polypropylene Granules', qty: 1.2 },
      { materialId: 'COMP-001', materialName: 'Metal Clips Type A', qty: 6 },
    ]
  },
];

export function Warehouse() {
  const { requests, updateRequestStatus, assignRequest } = useWarehouse();
  const { productionLines } = useFactory();

  const totalDowntime = productionLines.reduce((acc, line) => acc + (line.downtimeRecord?.accumulatedMinutes || 0), 0);
  const [materials, setMaterials] = useState<MockMaterial[]>(initialMaterials);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('All');

  // Advanced filters
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');

  // Sort and display configs
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [expandedBOMs, setExpandedBOMs] = useState<Set<string>>(new Set());

  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('intake'); // DEFAULT TO HIGH SPEED INTAKE

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('All');
    setFilterLocation('All');
    setFilterStatus('All');
    setFilterSupplier('All');
    setFilterDateRange('All');
    setSortConfig(null);
  };

  const toggleBOM = (id: string) => {
    const next = new Set(expandedBOMs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedBOMs(next);
  };

  // Picklist Modal State
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<MockRequest | null>(null);

  // Form State
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Material Intake Station State
  const [intakeSku, setIntakeSku] = useState('');
  const [intakeQty, setIntakeQty] = useState('');
  const [intakeBatch, setIntakeBatch] = useState('');
  const [intakeBin, setIntakeBin] = useState('');
  const [intakeDesc, setIntakeDesc] = useState('');
  const [isQuickScanMode, setIsQuickScanMode] = useState(false);
  const [quickScanData, setQuickScanData] = useState('');

  // AI Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scannedPartItem, setScannedPartItem] = useState<{ id: string; name: string; bin: string; qty: string } | null>(null);

  // Smart Autocomplete State
  const [isSkuFocused, setIsSkuFocused] = useState(false);
  const filteredSkus = useMemo(() => {
    if (!intakeSku) return materials.slice(0, 5);
    const q = intakeSku.toLowerCase();
    return materials.filter(m => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)).slice(0, 5);
  }, [intakeSku, materials]);

  // Intake History & Validation State
  interface ArrivalRecord {
    id: string;
    sku: string;
    qty: number;
    batch?: string;
    bin: string;
    time: string;
  }
  const [recentArrivals, setRecentArrivals] = useState<ArrivalRecord[]>([]);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  useEffect(() => {
    if (intakeSku && !isQuickScanMode) {
      const existing = materials.find(m => m.id.toUpperCase() === intakeSku.toUpperCase());
      if (existing) {
        setIntakeBin(existing.binLocation);
        setIntakeDesc(existing.name);
      } else {
        setIntakeDesc('');
        if (!intakeBin) setIntakeBin('Receiving-01');
      }
    }
  }, [intakeSku, isQuickScanMode, materials, intakeBin]);

  const triggerSuccessFlash = (msg?: string) => {
    setShowSuccessFlash(true);
    setTimeout(() => setShowSuccessFlash(false), 400); // Quick 400ms flash
    if (msg) toast.success(msg, {
      duration: 2000,
      className: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
    });
  };

  const handleIntakeSave = () => {
    if (!intakeSku || !intakeQty) {
      toast.error('Please fill in required fields (SKU, Qty)');
      return;
    }

    const qtyNum = Number(intakeQty);
    const skuUpper = intakeSku.toUpperCase();
    const finalBin = intakeBin || 'Receiving-01';

    // Dynamic Batch Generation
    let finalBatch = intakeBatch;
    if (!finalBatch) {
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
      const idx = String(recentArrivals.length + 1).padStart(3, '0');
      finalBatch = `BN-${yyyymmdd}-${idx}`;
    }

    setMaterials(prev => {
      const existing = prev.find(m => m.id.toUpperCase() === skuUpper);
      if (existing) {
        return prev.map(m => m.id.toUpperCase() === skuUpper ? {
          ...m,
          current_stock: m.current_stock + qtyNum
        } : m);
      } else {
        const newMat: MockMaterial = {
          id: skuUpper,
          name: intakeDesc || `New Part ${skuUpper}`,
          category: 'Raw Materials',
          binLocation: finalBin,
          current_stock: qtyNum,
          inspection_stock: 0,
          reserved_stock: 0,
          min_stock: 100,
          usage_per_shift: 0,
          lastMovement: new Date().toISOString()
        };
        return [newMat, ...prev];
      }
    });

    // Add to history
    const recordId = `ARR-${Date.now()}`;
    setRecentArrivals(prev => [{
      id: recordId,
      sku: skuUpper,
      qty: qtyNum,
      batch: finalBatch,
      bin: finalBin,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 50));

    triggerSuccessFlash(`${qtyNum}x ${skuUpper} saved to ${finalBin}`);

    setIntakeSku('');
    setIntakeQty('');
    setIntakeBatch('');
    setIntakeDesc('');
    setScannedPartItem(null);
  };

  const handleVoidArrival = (recordId: string) => {
    const record = recentArrivals.find(r => r.id === recordId);
    if (!record) return;

    // Revert logic
    setMaterials(prev => {
      return prev.map(m => {
        if (m.id.toUpperCase() === record.sku) {
          return {
            ...m,
            current_stock: Math.max(0, m.current_stock - record.qty)
          };
        }
        return m;
      });
    });

    setRecentArrivals(prev => prev.filter(r => r.id !== recordId));
    toast.success(`Canceled ${record.qty}x ${record.sku}`);
  };

  const handlePrintLabel = () => {
    if (!intakeSku) {
      toast.error('Please enter a SKU to print a label.');
      return;
    }
    toast.success(`Label for ${intakeSku.toUpperCase()} sent to printer.`, {
      icon: <Printer className="w-4 h-4 text-primary" />
    });
  };

  const processQuickScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!quickScanData) return;

      const scan = quickScanData.trim();
      let sku = scan;
      let qty = 1;

      if (scan.includes('-')) {
        const parts = scan.split('-');
        sku = parts[0];
        const maybeQty = parseInt(parts[1], 10);
        if (!isNaN(maybeQty)) {
          qty = maybeQty;
        }
      }

      const skuUpper = sku.toUpperCase();
      const existing = materials.find(m => m.id.toUpperCase() === skuUpper);

      if (existing) {
        // Switch to the scanned item keypad mode
        setScannedPartItem({
          id: existing.id,
          name: existing.name,
          bin: existing.binLocation,
          qty: qty.toString()
        });
        setQuickScanData('');
        return;
      }

      setMaterials(prev => {
        const currentM = prev.find(m => m.id.toUpperCase() === skuUpper);
        if (currentM) {
          return prev.map(m => m.id.toUpperCase() === skuUpper ? {
            ...m,
            current_stock: m.current_stock + qty
          } : m);
        } else {
          const newMat: MockMaterial = {
            id: skuUpper,
            name: `Scanned Part ${skuUpper}`,
            category: 'Raw Materials',
            binLocation: 'Receiving-01',
            current_stock: qty,
            inspection_stock: 0,
            reserved_stock: 0,
            min_stock: 100,
            usage_per_shift: 0,
            lastMovement: new Date().toISOString()
          };
          return [newMat, ...prev];
        }
      });

      const recordId = `ARR-${Date.now()}`;
      setRecentArrivals(prev => [{
        id: recordId,
        sku: skuUpper,
        qty: qty,
        bin: 'Receiving-01',
        time: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 50));

      triggerSuccessFlash(`${qty}x ${skuUpper} quickly scanned`);
      setQuickScanData('');
    }
  };

  const executeScannedItemSave = () => {
    if (!scannedPartItem) return;

    const qtyNum = Number(scannedPartItem.qty) || 1;

    setMaterials(prev => {
      return prev.map(m => m.id.toUpperCase() === scannedPartItem.id.toUpperCase() ? {
        ...m,
        current_stock: m.current_stock + qtyNum
      } : m);
    });

    const today = new Date();
    const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const idx = String(recentArrivals.length + 1).padStart(3, '0');
    const genBatch = `BN-${yyyymmdd}-${idx}-SCN`;

    const recordId = `ARR-${Date.now()}`;
    setRecentArrivals(prev => [{
      id: recordId,
      sku: scannedPartItem.id.toUpperCase(),
      qty: qtyNum,
      batch: genBatch,
      bin: scannedPartItem.bin,
      time: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 50));

    triggerSuccessFlash(`${qtyNum}x ${scannedPartItem.id} scanned directly to ${scannedPartItem.bin}`);
    setScannedPartItem(null);
  };

  const handleKeypadPress = (val: string) => {
    if (!scannedPartItem) return;
    if (val === 'C') {
      setScannedPartItem(prev => prev ? { ...prev, qty: '' } : prev);
      return;
    }
    if (val === 'ENTER') {
      if (Number(scannedPartItem.qty) > 0) {
        executeScannedItemSave();
      } else {
        toast.error('Invalid Quantity', { className: 'bg-amber-100 text-amber-900 border-amber-300' });
      }
      return;
    }

    setScannedPartItem(prev => {
      if (!prev) return prev;
      // Replace existing 1 if it's the default assumption
      const currentQty = prev.qty === '1' && val !== '0' ? val : prev.qty + val;
      // Cap at 9999 for safety
      return { ...prev, qty: currentQty.length > 4 ? prev.qty : currentQty };
    });
  };

  // NEW LOGISTICS-QUALITY GATE RETURN MODAL STATE
  type ReturnReason = 'good' | 'defective' | 'scrap';
  interface ReturnItem {
    id: string; // unique row id
    partId: string;
    qty: number;
    reason: ReturnReason;
  }
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnNote, setReturnNote] = useState('');

  // Auto-Fill returning logic based on issued items
  const handleOpenReturnModal = () => {
    // Contextual Auto-fill: find items recently "ON LINE" 
    const onlineRequest = requests.find(r => r.status === 'ON LINE' || r.status === 'Completed');

    if (onlineRequest && onlineRequest.items.length > 0) {
      // Auto-populate 2 random items from an active production request to simulate "recently issued"
      const sampleItems = onlineRequest.items.slice(0, 2).map((item, idx) => ({
        id: `ret-auto-${idx}`,
        partId: item.partNumber,
        qty: Math.max(1, Math.floor(item.requiredQty * 0.1)), // 10% return
        reason: 'defective' as ReturnReason
      }));
      setReturnItems(sampleItems);
    } else {
      // Empty fallback
      setReturnItems([{ id: 'ret-manual-1', partId: materials[0]?.id || '', qty: 1, reason: 'good' }]);
    }
    setReturnNote('');
    setIsReturnModalOpen(true);
  };

  const addEmptyReturnRow = () => {
    setReturnItems(prev => [...prev, { id: `ret-manual-${Date.now()}`, partId: materials[0]?.id || '', qty: 1, reason: 'good' }]);
  };

  const updateReturnRow = (id: string, field: keyof ReturnItem, value: any) => {
    setReturnItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeReturnRow = (id: string) => {
    setReturnItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReturnAction = () => {
    const newMaterials = [...materials];

    returnItems.forEach(item => {
      const targetIndex = newMaterials.findIndex(m => m.id === item.partId);
      if (targetIndex !== -1) {
        const m = newMaterials[targetIndex];
        let newCurrent = m.current_stock;
        let newInspect = m.inspection_stock || 0;

        if (item.reason === 'good') {
          newCurrent += item.qty;
        } else if (item.reason === 'defective') {
          newCurrent += item.qty;
          newInspect += item.qty;
        } else if (item.reason === 'scrap') {
          // Write-off, don't add
        }

        const newAvailable = newCurrent - m.reserved_stock - newInspect;
        const shiftsRemaining = m.usage_per_shift > 0 ? Math.floor(newAvailable / m.usage_per_shift) : 999;

        newMaterials[targetIndex] = {
          ...m,
          current_stock: newCurrent,
          inspection_stock: newInspect,
          available: newAvailable,
          shiftsRemaining
        };
      }
    });

    setMaterials(newMaterials);
    toast.success(`Processed ${returnItems.length} return lines successfully!`);
    setIsReturnModalOpen(false);
  };

  // Multi-select computed
  const toggleSelectMaterial = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedMaterials);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMaterials(next);
  };

  const toggleSelectAll = (filteredIds: string[]) => {
    if (selectedMaterials.size === filteredIds.length) {
      setSelectedMaterials(new Set());
    } else {
      setSelectedMaterials(new Set(filteredIds));
    }
  };

  const handleOpenKit = (req: MockRequest) => {
    const hydratedReq: MockRequest = {
      ...req,
      items: req.items.map(item => {
        const found = materials.find(m => m.id === item.partNumber);
        return {
          ...item,
          currentStock: found ? found.current_stock : 0
        };
      })
    };

    setActiveRequest(hydratedReq);
    setIsKitModalOpen(true);
  };

  /**
   * LINE INTEGRATION HOOK
   */
  const onIssueComplete = (planId: string) => {
    console.log(`[EXTERNAL_HOOK] -> Issuance completed for ${planId}. Signaling Production Module to start...`);
    // Simulates external process start
  };

  /**
   * KIT ISSUANCE WORKFLOW EXECUTION
   */
  const executeKitIssuance = (planId: string) => {
    if (!activeRequest) return;

    // 1. Process Frontend Table Deduction
    setMaterials(prev => prev.map(m => {
      const kitItem = activeRequest.items.find(k => k.partNumber === m.id);
      if (kitItem) {
        // Strict logic: Deduct Required Qty from Current Stock
        // Decrement Reserved Qty by the Required Qty (down to 0 min)
        return {
          ...m,
          current_stock: Math.max(0, m.current_stock - kitItem.requiredQty),
          reserved_stock: Math.max(0, m.reserved_stock - kitItem.requiredQty)
        };
      }
      return m;
    }));

    // 2. Update Zayavka Request Status to 'ON LINE'
    updateRequestStatus(activeRequest.id, 'ON LINE');

    // 3. Fire External Hook
    onIssueComplete(planId);

    // 4. Close Modal & Toast
    toast.success(`Plan ${planId.split(' ')[0]} materials successfully transferred to Line A`, {
      icon: <Zap className="w-4 h-4 text-green-500" />
    });
    setIsKitModalOpen(false);
    setActiveRequest(null);
  };

  const DisplayMaterials = useMemo(() => {
    const today = new Date('2023-10-27T12:00:00Z'); // Baseline for mock dates
    const filtered = materials.map(m => {
      const available = m.current_stock - m.reserved_stock;
      const shiftsRemaining = m.usage_per_shift > 0 ? Math.floor(available / m.usage_per_shift) : 999;

      let predictiveHealth: 'Ready' | 'Warning' | 'Critical' = 'Ready';
      let alertMessage = 'Sufficient Cover';

      if (available <= 0) {
        predictiveHealth = 'Critical';
        alertMessage = 'Production Blocked: 0 Available';
      } else if (shiftsRemaining < 1) {
        predictiveHealth = 'Critical';
        alertMessage = 'Insufficient stock for upcoming Shift';
      } else if (shiftsRemaining <= 3) {
        predictiveHealth = 'Warning';
        alertMessage = `Risk: Only ${shiftsRemaining} shifts remaining`;
      } else {
        alertMessage = `${shiftsRemaining} Shifts Covered`;
      }

      return {
        ...m,
        available,
        shiftsRemaining,
        predictiveHealth,
        alertMessage
      };
    }).filter(m => {
      // 1. Text Search (ID, Name, Bin)
      const term = searchTerm.toLowerCase();
      const matchSearch = term === '' ||
        m.name.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term) ||
        m.binLocation.toLowerCase().includes(term);

      // 2. Category
      const matchCat = activeCategory === 'All' || m.category === activeCategory;

      // 3. Location
      const locPrefix = m.binLocation.split('-')[0];
      const matchLoc = filterLocation === 'All' || m.binLocation.startsWith(filterLocation) || locPrefix === filterLocation;

      // 4. Status
      const matchStatus = filterStatus === 'All' || m.predictiveHealth === filterStatus || (filterStatus === 'Out' && m.available <= 0);

      // 5. Supplier
      const matchSupplier = filterSupplier === 'All' || m.supplier === filterSupplier;

      // 6. Date Range
      let matchDate = true;
      if (filterDateRange !== 'All' && m.lastMovement) {
        const moveDate = new Date(m.lastMovement);
        const diffDays = Math.floor((today.getTime() - moveDate.getTime()) / (1000 * 3600 * 24));
        if (filterDateRange === 'Today') matchDate = diffDays === 0;
        if (filterDateRange === 'Last 7 Days') matchDate = diffDays <= 7;
        if (filterDateRange === 'Last 30 Days') matchDate = diffDays <= 30;
        if (filterDateRange === 'Older') matchDate = diffDays > 30;
      }

      return matchSearch && matchCat && matchLoc && matchStatus && matchSupplier && matchDate;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof typeof a];
        let valB: any = b[sortConfig.key as keyof typeof b];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [materials, searchTerm, activeCategory, filterLocation, filterStatus, filterSupplier, filterDateRange, sortConfig]);

  const stats = useMemo(() => {
    let ready = 0, warning = 0, critical = 0, reservedTotal = 0;
    materials.forEach(m => {
      const available = m.current_stock - m.reserved_stock;
      const shifts = m.usage_per_shift > 0 ? Math.floor(available / m.usage_per_shift) : 999;

      if (available <= 0 || shifts < 1) critical++;
      else if (shifts <= 3) warning++;
      else ready++;
      reservedTotal += m.reserved_stock;
    });
    return { ready, warning, critical, reservedTotal };
  }, [materials]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-primary" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-primary" />;
    }
    return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-20 group-hover:opacity-100 transition-opacity" />;
  };

  const TaskCard = ({ req }: { req: MockRequest }) => {
    const isIssuedToLine = req.status === 'ON LINE' || req.status === 'Completed';
    const isPicking = req.status === 'Issuing';

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState<number>(Math.max(0, req.targetTime - Date.now()));

    useEffect(() => {
      if (isIssuedToLine) return;
      const interval = setInterval(() => {
        setTimeLeft(Math.max(0, req.targetTime - Date.now()));
      }, 1000);
      return () => clearInterval(interval);
    }, [req.targetTime, isIssuedToLine]);

    const formatTime = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isUrgent = timeLeft < 5 * 60000 && !isIssuedToLine;

    const totalItems = req.items.reduce((acc, item) => acc + item.requiredQty, 0);

    const handleAssign = () => {
      assignRequest(req.id, 'Demo Worker');
    };

    const handleStatusMove = () => {
      if (req.status === 'Pending') updateRequestStatus(req.id, 'Issuing');
      else if (req.status === 'Issuing') handleOpenKit(req);
    };

    const priorityColors: Record<string, string> = {
      High: 'bg-red-500 text-white',
      Normal: 'bg-blue-500 text-white',
      Low: 'bg-slate-400 text-white'
    };

    const priorityColor = req.priority ? priorityColors[req.priority] : priorityColors.Normal;

    return (
      <div className={`relative bg-background border ${isUrgent ? 'border-red-500/50 shadow-red-500/10' : 'border-border'} rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group`}>
        {/* Priority Left Border */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${priorityColor}`} />

        <div className="p-3 pl-4 flex flex-col h-full gap-3">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold shrink-0">#{req.id}</span>
                <Badge variant="secondary" className="text-[9px] uppercase tracking-wider py-0 shadow-sm shrink-0">
                  {req.type || 'Picking'}
                </Badge>
                {req.priority && (
                  <Badge variant="outline" className={`text-[9px] uppercase tracking-wider py-0 px-1 border-0 ${priorityColor} shrink-0`}>
                    {req.priority}
                  </Badge>
                )}
              </div>
              <h4 className="font-bold text-sm truncate" title={req.planId}>{req.planId}</h4>
            </div>

            {/* Timestamp & Countdown */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              {req.createdAt && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {req.priority === 'High' && !isIssuedToLine && (
                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${isUrgent ? 'animate-pulse bg-red-500/10 text-red-500 border-red-500/30' : 'bg-orange-500/10 text-orange-500 border-orange-500/30'}`}>
                  {formatTime(timeLeft)}
                </div>
              )}
            </div>
          </div>

          {/* Source & Destination Row */}
          <div className="bg-muted/30 rounded p-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground border border-border/50">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{req.source || 'Bins'}</span>
            </div>
            <ArrowRight className="w-3 h-3 mx-2 opacity-50 shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate">{req.destination || 'Line'}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono" title={`${req.items.length} SKUs`}>
                <Layers className="w-3.5 h-3.5" />
                <span>{req.items.length}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono" title={`${totalItems} Total Pcs`}>
                <Box className="w-3.5 h-3.5" />
                <span>{totalItems}</span>
              </div>
            </div>

            {/* Assignment & Action */}
            <div className="flex items-center gap-2">
              {req.assignee ? (
                <div className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-1 text-[10px] font-bold">
                  <User className="w-3 h-3" />
                  <span className="max-w-[70px] truncate">{req.assignee}</span>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleAssign} className="h-6 px-2 text-[10px] border border-dashed border-border text-muted-foreground hover:text-foreground">
                  <UserPlus className="w-3 h-3 mr-1" /> Assign Me
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          {!isIssuedToLine && (
            <div className="pt-2 mt-1 border-t border-border/40">
              <Button
                onClick={handleStatusMove}
                className={`w-full h-7 text-[10px] font-bold tracking-wider uppercase ${req.status === 'Pending' ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md' : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'}`}
              >
                {req.status === 'Pending' ? 'Start Picking' : 'Complete & Issue'} <ArrowRight className="w-3 h-3 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background text-foreground flex flex-col">

      {/* SUCCESS FLASH OVERLAY */}
      <div
        className={`fixed inset-0 pointer-events-none z-50 transition-colors duration-200 ${showSuccessFlash ? 'bg-green-500/30 dark:bg-green-400/30 backdrop-blur-[1px]' : 'bg-transparent'}`}
        aria-hidden="true"
      />

      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" />
            Supply & Production Dashboard
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm lg:text-base max-w-2xl">
            Material execution, predictive routing, and live requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" className="bg-indigo-500/5 border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/10 hover:text-indigo-700" onClick={handleOpenReturnModal}>
            <Undo2 className="w-4 h-4 mr-2" /> Return from Production
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full min-h-0">
        <TabsList className="mb-6 w-full max-w-2xl grid grid-cols-4">
          <TabsTrigger value="intake" className="font-bold tracking-wide">
            <ScanLine className="w-4 h-4 mr-2" /> Intake (Kirim)
          </TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="operations">Active Ops</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="intake" className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* HIGH SPEED INTAKE TAB */}
          <div className="flex-1 bg-card border border-border shadow-sm rounded-lg overflow-hidden flex flex-col lg:flex-row">

            {/* INTAKE FORM / SCANNER AREA */}
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-border min-h-[400px]">

              {/* Intake Header */}
              <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between shadow-sm z-10">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-primary" />
                    Material Intake Station
                  </h3>
                  <p className="text-xs text-muted-foreground">High-speed terminal for material check-in and inventory routing.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-background p-1 rounded-md border border-border mt-2 sm:mt-0 shadow-sm">
                  <button
                    onClick={() => setIsQuickScanMode(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-sm transition-all focus:outline-none ${!isQuickScanMode ? 'bg-muted shadow-inner text-foreground border border-border/50' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                  >
                    <Keyboard className="w-3.5 h-3.5" /> Manual Entry
                  </button>
                  <button
                    onClick={() => setIsQuickScanMode(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-sm transition-all focus:outline-none ${isQuickScanMode ? 'bg-primary text-primary-foreground shadow-md border border-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                  >
                    <Barcode className="w-3.5 h-3.5" /> Quick Scan
                  </button>
                </div>
              </div>

              <div className="flex-1 relative flex flex-col md:flex-row bg-background">
                {!isQuickScanMode ? (
                  <>
                    {/* Left Form Area */}
                    <div className="p-4 md:p-6 flex-1 space-y-4 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="space-y-1.5 col-span-2 relative">
                          <Label htmlFor="sku" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Part Number (SKU) <span className="text-red-500">*</span></Label>
                          <Input
                            id="sku"
                            value={intakeSku}
                            onChange={(e) => setIntakeSku(e.target.value)}
                            onFocus={() => setIsSkuFocused(true)}
                            onBlur={() => setTimeout(() => setIsSkuFocused(false), 200)}
                            placeholder="Type to search or enter new SKU..."
                            className="h-11 text-base font-mono font-bold bg-muted/10 uppercase shadow-inner"
                            autoFocus
                            autoComplete="off"
                          />
                          {isSkuFocused && filteredSkus.length > 0 && (
                            <div className="absolute z-50 w-full top-full mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden divide-y divide-border">
                              {filteredSkus.map(m => (
                                <div
                                  key={m.id}
                                  className="p-3 hover:bg-muted cursor-pointer transition-colors flex justify-between items-center"
                                  onClick={() => {
                                    setIntakeSku(m.id);
                                    setIntakeBin(m.binLocation);
                                    setIntakeDesc(m.name);
                                    document.getElementById('qty')?.focus();
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-muted rounded border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                      <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                                    </div>
                                    <div>
                                      <div className="font-mono font-bold text-primary text-sm">{m.id}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5">{m.name}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="font-mono text-[10px] bg-primary/5 border-primary/20 text-primary">
                                      <MapPin className="w-3 h-3 mr-1" />{m.binLocation}
                                    </Badge>
                                    <span className="text-[9px] text-muted-foreground opacity-60">
                                      {Math.floor(Math.random() * 50 + 40)}% full
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <Label htmlFor="qty" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantity <span className="text-red-500">*</span></Label>
                          <Input
                            id="qty"
                            type="number"
                            value={intakeQty}
                            onChange={(e) => setIntakeQty(e.target.value)}
                            placeholder="0"
                            className="h-11 text-base font-bold bg-muted/10 shadow-inner focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            min="1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleIntakeSave();
                                if (intakeSku && intakeQty) {
                                  handlePrintLabel();
                                }
                              }
                            }}
                          />
                          <div className="text-[9px] text-muted-foreground uppercase font-bold text-right tracking-wider opacity-70">Press Enter ↵ to Save & Print</div>
                        </div>

                        <div className="space-y-1.5 col-span-2 sm:col-span-1">
                          <Label htmlFor="batch" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Batch / Lot Number</Label>
                          <Input id="batch" value={intakeBatch} onChange={(e) => setIntakeBatch(e.target.value)} placeholder="Optional" className="h-11 text-sm bg-muted/10 font-mono shadow-inner" />
                        </div>

                        <div className="space-y-1.5 col-span-2">
                          <Label htmlFor="bin" className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Assigned Bin Location
                          </Label>
                          <Input id="bin" value={intakeBin} onChange={(e) => setIntakeBin(e.target.value)} placeholder="e.g. A-101" className="h-11 text-base bg-primary/5 border-primary/30 font-mono text-primary font-bold focus-visible:ring-primary/50 shadow-inner" />
                          {intakeDesc ? (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <Info className="w-3 h-3 text-blue-500 shrink-0" /> Automatically assigned: <strong>{intakeBin} ({Math.floor(Math.random() * 50 + 30)}% full)</strong>
                            </p>
                          ) : intakeBin && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 text-amber-600 dark:text-amber-500">
                              <AlertTriangle className="w-3 h-3 shrink-0" /> Suggested New Location (Empty)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border mt-3">
                        <Button onClick={handleIntakeSave} size="lg" className="w-full h-12 text-sm bg-primary hover:bg-primary/90 shadow-md font-bold tracking-widest uppercase">
                          <CheckCircle className="w-4 h-4 mr-2" /> Save Record
                        </Button>
                      </div>
                    </div>

                    {/* Right Barcode/Print Area */}
                    <div className="w-full md:w-[280px] lg:w-[320px] bg-muted/10 border-t md:border-t-0 md:border-l border-border/50 p-4 md:p-6 flex flex-col justify-start space-y-4">
                      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5" /> Digital Label Generator
                      </div>

                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 w-full flex flex-col items-center justify-center space-y-4 shadow-sm min-h-[160px]">
                        {intakeSku ? (
                          <>
                            <Barcode className="w-full h-20 text-black opacity-85" strokeWidth={1.5} />
                            <span className="font-mono font-bold text-black text-sm tracking-[0.25em]">{intakeSku.toUpperCase()}</span>
                          </>
                        ) : (
                          <div className="flex items-center justify-center flex-col opacity-30 text-black py-4">
                            <Barcode className="w-12 h-12 mb-2" />
                            <span className="text-xs font-bold uppercase tracking-widest">Awaiting SKU</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 h-12 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-bold tracking-wide shadow-sm"
                          onClick={handlePrintLabel}
                        >
                          <Printer className="w-4 h-4 mr-2 shrink-0" />
                          Print Label
                        </Button>
                        <Button variant="outline" size="icon" className="h-12 w-12 border-border text-muted-foreground hover:text-foreground shrink-0 shadow-sm" title="Label Settings">
                          <Settings2 className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="mt-8 text-[11px] text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/50 border-dashed">
                        Ensure thermal printer is online before sending queue. Default format: 100x50mm Code128.
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full min-h-[400px] relative bg-slate-950 overflow-hidden">

                    {/* CAMERA FEED SIMULATION */}
                    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40">
                      {isCameraActive ? (
                        <div className="w-full h-full relative">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-50 contrast-125 sepia-0"></div>
                          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"></div>
                          {/* Crosshair Scanner target */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-48 border-2 border-[#39FF14]/50 rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#39FF14]"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#39FF14]"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#39FF14]"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#39FF14]"></div>
                            <div className="w-full h-0.5 bg-[#39FF14]/70 absolute top-1/2 -translate-y-1/2 animate-scan-line shadow-[0_0_8px_rgba(57,255,20,0.8)]"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-600">
                          <ScanLine className="w-16 h-16 mb-4 opacity-20" />
                          <span className="font-mono text-xs tracking-widest uppercase">Camera Inactive</span>
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-2xl z-10 relative flex flex-col items-center p-6">

                      {/* Top Bar for Camera Controls */}
                      <div className="w-full flex justify-between items-center mb-12">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-[#39FF14] shadow-[0_0_8px_#39FF14]' : 'bg-red-500'}`}></div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#39FF14] font-bold">
                            {isCameraActive ? 'AI HUNTING ACTIVE' : 'SYSTEM STANDBY'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFlashOn(!isFlashOn)}
                          className={`h-8 px-3 border-slate-700 bg-slate-900/80 backdrop-blur-md ${isFlashOn ? 'text-yellow-400 border-yellow-500/50' : 'text-slate-400 hover:text-white'}`}
                        >
                          <Zap className={`w-3.5 h-3.5 mr-1.5 ${isFlashOn ? 'fill-yellow-400' : ''}`} />
                          Torch
                        </Button>
                      </div>

                      {!scannedPartItem ? (
                        <>
                          {/* Demo Input matching physical scanning behavior */}
                          <div className="relative group w-full max-w-lg mt-8">
                            <Input
                              autoFocus
                              placeholder="SCAN OR TYPE SKU..."
                              className="h-20 text-center text-2xl font-mono font-black tracking-[0.2em] bg-slate-900/80 backdrop-blur-md border-2 border-slate-700 focus-visible:ring-0 focus-visible:border-[#39FF14] text-white shadow-2xl rounded-xl uppercase transition-all placeholder:opacity-40 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
                              value={quickScanData}
                              onChange={(e) => {
                                setQuickScanData(e.target.value);
                                if (!isCameraActive && e.target.value) setIsCameraActive(true);
                              }}
                              onKeyDown={processQuickScan}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-slate-500">
                              <Keyboard className="w-5 h-5 mr-1 opacity-50" />
                            </div>
                          </div>
                          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider mt-6">
                            Point device camera at any barcode/qr
                          </p>
                        </>
                      ) : (
                        /* QUANTITY KEYPAD MODAL / VIEW */
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                          {/* Part Details Header */}
                          <div className="p-4 border-b border-slate-800 flex items-start gap-4">
                            <div className="w-16 h-16 rounded bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                              <ImageIcon className="w-6 h-6 text-slate-500 mb-1" />
                              <span className="text-[8px] text-slate-500 font-mono uppercase">Photo</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Badge variant="outline" className="bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30 text-[9px] mb-1.5 px-1.5 py-0 font-mono">
                                MATCH FOUND
                              </Badge>
                              <h3 className="font-mono text-white font-bold text-lg truncate tracking-wider">{scannedPartItem.id}</h3>
                              <p className="text-xs text-slate-400 truncate">{scannedPartItem.name}</p>
                            </div>
                          </div>

                          {/* Heatmap Location */}
                          <div className="bg-slate-950/50 p-3 px-4 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              <span className="text-xs font-mono text-slate-300">Stow at: <span className="text-blue-400 font-bold">{scannedPartItem.bin}</span></span>
                            </div>
                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{Math.floor(Math.random() * 50 + 40)}% Full</span>
                          </div>

                          {/* Quantity Input Display */}
                          <div className="p-4 flex flex-col items-center bg-slate-950 border-b border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Enter Quantity</span>
                            <div className="text-4xl font-mono font-black text-white h-12 flex items-center justify-center">
                              {scannedPartItem.qty || '0'}
                            </div>
                          </div>

                          {/* Numeric Keypad */}
                          <div className="grid grid-cols-3 gap-[1px] bg-slate-800">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'ENTER'].map((btn) => (
                              <button
                                key={btn}
                                onClick={() => handleKeypadPress(btn.toString())}
                                className={`
                                  h-14 font-mono text-lg font-bold flex items-center justify-center transition-colors
                                  ${btn === 'ENTER' ? 'bg-[#39FF14]/20 text-[#39FF14] hover:bg-[#39FF14]/30' :
                                    btn === 'C' ? 'bg-slate-900/80 text-rose-400 hover:bg-slate-800' :
                                      'bg-slate-900 text-slate-200 hover:bg-slate-800'}
                                `}
                              >
                                {btn}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RECENT ARRIVALS QUEUE (SIDEBAR/BOTTOM) */}
            <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-muted/5 max-h-full">
              <div className="p-4 border-b border-border bg-background flex items-center justify-between z-10 shadow-sm">
                <span className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  Recent Arrivals (Oxirgi qabul qilinganlar)
                </span>
                <Badge variant="outline" className="font-mono text-xs">{recentArrivals.length}</Badge>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {recentArrivals.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60 p-8 text-center">
                    <PackageCheck className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No materials processed in this session yet.</p>
                  </div>
                ) : (
                  recentArrivals.map((record, index) => (
                    <div key={record.id} className="bg-background border border-border shadow-sm rounded-lg p-3 flex items-center justify-between hover:border-primary/30 transition-colors animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-3 overflow-hidden pr-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm truncate">{record.sku}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shadow-sm shrink-0">x{record.qty}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-primary font-bold font-mono py-0.5 px-1 bg-primary/10 rounded border border-primary/20 shadow-sm flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {record.bin}</span>
                            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5"><Package className="w-3 h-3 opacity-70" /> {record.batch}</span>
                            <span className="text-[10px] text-muted-foreground font-mono"><Clock className="w-3 h-3 opacity-70 inline" /> {record.time}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVoidArrival(record.id)}
                        className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-500/10 shrink-0"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 space-y-4 min-h-0 flex flex-col">
          {/* ADVANCED FILTER BAR */}
          <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col p-2 space-y-2 mb-2 bg-muted/5 shrink-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded border border-border/30 overflow-x-auto w-full md:w-auto">
                {(['All', 'Raw Materials', 'Components', 'Finished Goods'] as MaterialCategory[]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-3 py-1 text-[11px] font-semibold rounded transition-all ${activeCategory === cat ? 'bg-background shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-background/20 border border-transparent'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search SKU, Name, or Bin Location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-[11px] bg-background w-full pr-8"
                  />
                  {searchTerm && (
                    <X className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setSearchTerm('')} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center bg-background p-2 rounded border border-border/50">
              <div className="flex items-center gap-1.5 mr-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Filters:</span>
              </div>

              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="h-7 text-[10px] w-[130px] bg-muted/20">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 opacity-70" /><SelectValue placeholder="Location" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-[10px]">All Locations</SelectItem>
                  <SelectItem value="A" className="text-[10px]">A-Zone</SelectItem>
                  <SelectItem value="B" className="text-[10px]">B-Zone</SelectItem>
                  <SelectItem value="C" className="text-[10px]">C-Zone</SelectItem>
                  <SelectItem value="Silo" className="text-[10px]">Silo Storage</SelectItem>
                  <SelectItem value="Rack" className="text-[10px]">Rack Storage</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-7 text-[10px] w-[130px] bg-muted/20">
                  <div className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3 opacity-70" /><SelectValue placeholder="Status" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-[10px]">All Statuses</SelectItem>
                  <SelectItem value="Ready" className="text-[10px] text-green-500 font-semibold">Ready</SelectItem>
                  <SelectItem value="Warning" className="text-[10px] text-yellow-500 font-semibold">Low Stock</SelectItem>
                  <SelectItem value="Critical" className="text-[10px] text-red-500 font-semibold">Critical / Blocked</SelectItem>
                  <SelectItem value="Out" className="text-[10px] text-red-600 font-bold">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger className="h-7 text-[10px] w-[140px] bg-muted/20">
                  <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 opacity-70" /><SelectValue placeholder="Supplier" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-[10px]">All Suppliers</SelectItem>
                  <SelectItem value="UzAuto Motors" className="text-[10px]">UzAuto Motors</SelectItem>
                  <SelectItem value="Fasteners Inc" className="text-[10px]">Fasteners Inc</SelectItem>
                  <SelectItem value="UzAuto Polymers" className="text-[10px]">UzAuto Polymers</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger className="h-7 text-[10px] w-[140px] bg-muted/20">
                  <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 opacity-70" /><SelectValue placeholder="Last Mvmt" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-[10px]">Any Time</SelectItem>
                  <SelectItem value="Today" className="text-[10px]">Today</SelectItem>
                  <SelectItem value="Last 7 Days" className="text-[10px]">Last 7 Days</SelectItem>
                  <SelectItem value="Last 30 Days" className="text-[10px]">Last 30 Days</SelectItem>
                  <SelectItem value="Older" className="text-[10px]">Older than 30 Days</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-muted/50 p-1 px-2 rounded transition-colors group">
                  <input type="checkbox" checked={showCheckboxes} onChange={() => setShowCheckboxes(!showCheckboxes)} className="rounded border-input text-primary focus:ring-primary h-3 w-3" />
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Bulk Select</span>
                </label>
                <Button variant="ghost" className="h-7 text-[10px] text-muted-foreground hover:text-red-500 px-2" onClick={clearFilters}>Clear All</Button>
              </div>
            </div>
          </div>

          <div className="bg-card border-border rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold tracking-wide">
                  <tr>
                    {showCheckboxes && (
                      <th className="px-1.5 py-1 text-left w-8 border-r border-border/30">
                        <input
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-primary h-3 w-3"
                          checked={selectedMaterials.size === DisplayMaterials.length && DisplayMaterials.length > 0}
                          onChange={() => toggleSelectAll(DisplayMaterials.map(m => m.id))}
                        />
                      </th>
                    )}
                    <th className="px-2 py-1 text-left border-r border-border/30 cursor-pointer group hover:bg-muted/50 transition-colors" onClick={() => handleSort('name')}>
                      Part Name <SortIcon columnKey="name" />
                    </th>
                    <th className="px-2 py-1 text-left border-r border-border/30 cursor-pointer group hover:bg-muted/50 transition-colors" onClick={() => handleSort('binLocation')}>
                      Location <SortIcon columnKey="binLocation" />
                    </th>
                    <th className="px-2 py-1 text-right border-r border-border/30 cursor-pointer group hover:bg-muted/50 transition-colors" onClick={() => handleSort('current_stock')}>
                      Current <SortIcon columnKey="current_stock" />
                    </th>
                    <th className="px-2 py-1 text-right border-r border-border/30 text-orange-500/90 dark:text-orange-400 cursor-pointer group hover:bg-muted/50 transition-colors" onClick={() => handleSort('reserved_stock')}>
                      Reserved <SortIcon columnKey="reserved_stock" />
                    </th>
                    <th className="px-2 py-1 text-right border-r border-border/30 text-indigo-500/90 dark:text-indigo-400 cursor-pointer group hover:bg-muted/50 transition-colors" onClick={() => handleSort('inspection_stock')}>
                      Inspect <SortIcon columnKey="inspection_stock" />
                    </th>
                    <th className="px-2 py-1 text-right border-r border-border/30 text-primary font-bold cursor-pointer group hover:bg-primary/10 transition-colors" onClick={() => handleSort('available')}>
                      Avail <SortIcon columnKey="available" />
                    </th>
                    <th className="px-2 py-1 text-center border-r border-border/30 cursor-pointer group hover:bg-muted/50 transition-colors" onClick={() => handleSort('shiftsRemaining')}>
                      Stock Cover <SortIcon columnKey="shiftsRemaining" />
                    </th>
                    <th className="px-2 py-1 text-left">Predictive Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {DisplayMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-muted-foreground">
                        No records match current filters.
                      </td>
                    </tr>
                  ) : (
                    DisplayMaterials.map(m => (
                      <React.Fragment key={m.id}>
                        <tr
                          className={`transition-colors cursor-default ${selectedMaterials.has(m.id) ? 'bg-primary/5 hover:bg-primary/10' : m.predictiveHealth === 'Critical' ? 'bg-red-500/10 hover:bg-red-500/20 ring-1 ring-inset ring-red-500/50' : 'hover:bg-muted/30'} ${expandedBOMs.has(m.id) ? 'bg-muted/20 border-l-2 border-primary' : ''}`}
                          onClick={() => { if (showCheckboxes) toggleSelectMaterial(m.id); }}
                        >
                          {showCheckboxes && (
                            <td className="px-1.5 py-1 border-r border-border/30 text-center">
                              <input
                                type="checkbox"
                                className="rounded border-input text-primary focus:ring-primary h-3 w-3"
                                checked={selectedMaterials.has(m.id)}
                                onChange={(e) => toggleSelectMaterial(m.id, e as any)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                          )}
                          <td className="px-2 py-1 border-r border-border/30">
                            <div className="flex items-center gap-1.5">
                              {m.bom ? (
                                <button className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground flex-shrink-0 transition-colors" onClick={(e) => { e.stopPropagation(); toggleBOM(m.id); }}>
                                  {expandedBOMs.has(m.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                              ) : (
                                <div className="w-4 h-4 rounded bg-muted/60 border border-border/50 flex flex-shrink-0 items-center justify-center ml-0.5">
                                  {m.category === 'Finished Goods' ? <Package className="w-2.5 h-2.5 text-primary opacity-80" /> : <ImageIcon className="w-2.5 h-2.5 text-muted-foreground opacity-50" />}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground flex items-center gap-1.5 truncate text-[11px] leading-tight">
                                  {m.name}
                                </p>
                                <p className="text-[9px] text-muted-foreground font-mono leading-none mt-0.5 max-w-[160px] truncate" title={`${m.id} | ${m.supplier || m.category}`}>{m.id} | <span className="opacity-80">{m.supplier || m.category}</span></p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1 border-r border-border/30">
                            <span className="inline-flex items-center gap-0.5 text-[9px] uppercase font-bold text-muted-foreground font-mono truncate max-w-[80px]">
                              <MapPin className="w-2.5 h-2.5" /> {m.binLocation}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-right border-r border-border/30 font-medium text-[11px]">
                            {m.current_stock.toLocaleString()} <span className="text-[9px] opacity-50">pcs</span>
                          </td>
                          <td className="px-2 py-1 text-right border-r border-border/30 text-[11px] font-semibold text-orange-500/90 dark:text-orange-400">
                            {m.reserved_stock.toLocaleString()} <span className="text-[9px] opacity-50">pcs</span>
                          </td>
                          <td className="px-2 py-1 text-right border-r border-border/30 text-[11px] font-semibold text-indigo-500/90 dark:text-indigo-400">
                            {m.inspection_stock ? m.inspection_stock.toLocaleString() : 0} <span className="text-[9px] opacity-50">pcs</span>
                          </td>
                          <td className="px-2 py-1 text-right border-r border-border/30 text-[11px] font-bold text-foreground bg-muted/10">
                            {m.available.toLocaleString()} <span className="text-[9px] font-normal opacity-50">pcs</span>
                          </td>
                          <td className="px-2 py-1 text-center border-r border-border/30 text-[10px] font-medium text-muted-foreground">
                            {m.category === 'Finished Goods' ? '-' : `${m.shiftsRemaining} Shifts`}
                          </td>
                          <td className="px-2 py-1 group/alert hover:bg-muted/10">
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${m.predictiveHealth === 'Ready' ? 'text-green-500' :
                                m.predictiveHealth === 'Warning' ? 'text-yellow-500' : 'text-red-500'
                                }`}>
                                {m.predictiveHealth === 'Ready' && <CheckCircle className="w-3 h-3 shrink-0" />}
                                {m.predictiveHealth === 'Warning' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                                {m.predictiveHealth === 'Critical' && <AlertCircle className="w-3 h-3 shrink-0" />}
                                <span className="truncate md:max-w-[130px] max-w-[70px]" title={m.alertMessage}>{m.alertMessage}</span>
                              </span>
                              {m.predictiveHealth === 'Critical' && (
                                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 text-muted-foreground hover:text-primary shrink-0 opacity-100" title="View in Planning Tab" onClick={(e) => { e.stopPropagation(); setActiveTab('planning'); }}>
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* EXPANDED BOM ROWS */}
                        {expandedBOMs.has(m.id) && m.bom && m.bom.map((bItem, idx) => {
                          const subM = initialMaterials.find(mx => mx.id === bItem.materialId);
                          if (!subM) return null;
                          const available = subM.current_stock - subM.reserved_stock;
                          return (
                            <tr key={`${m.id}-bom-${idx}`} className="bg-muted/5 border-l-2 border-l-primary/50 text-[10px] hover:bg-muted/10 transition-colors">
                              {showCheckboxes && <td className="border-r border-border/30"></td>}
                              <td className="px-2 py-1 border-r border-border/30 pl-6 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                <span className="text-muted-foreground font-mono">{bItem.materialId}</span>
                                <span className="truncate max-w-[120px]" title={bItem.materialName}>{bItem.materialName}</span>
                                <span className="ml-auto font-bold opacity-70 bg-background px-1 rounded border border-border/50">x{bItem.qty}</span>
                              </td>
                              <td className="px-2 py-1 border-r border-border/30 opacity-70"><MapPin className="w-2.5 h-2.5 inline mr-1 opacity-50" />{subM.binLocation}</td>
                              <td className="px-2 py-1 text-right border-r border-border/30 opacity-80">{subM.current_stock.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right border-r border-border/30 opacity-80 text-orange-500/80">{subM.reserved_stock.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right border-r border-border/30 opacity-80">{subM.inspection_stock || 0}</td>
                              <td className="px-2 py-1 text-right border-r border-border/30 font-bold opacity-90">{available.toLocaleString()}</td>
                              <td colSpan={2} className="px-2 py-1 text-left text-muted-foreground italic pl-3 border-l-0 shadow-[inset_2px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_2px_0_0_0_rgba(255,255,255,0.02)]">↳ Required Component for {m.id}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="flex-1 min-h-[500px] flex flex-col pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Task Execution Board</h3>
              <p className="text-sm text-muted-foreground">Monitor and manage warehouse operations in real-time.</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-muted text-xs font-mono"><Layers className="w-3.5 h-3.5 mr-1.5" /> {requests.length} Total Tasks</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 flex-1 h-full min-h-0">
            {/* To Do Column */}
            <div className="bg-muted/10 border border-border rounded-xl flex flex-col overflow-hidden h-full shadow-sm max-h-[75vh]">
              <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-col gap-1 shrink-0">
                <div className="flex items-center justify-between font-bold text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]"></div>
                    <span>To Do</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{requests.filter(r => r.status === 'Pending').length}</Badge>
                </div>
              </div>
              <div className="p-3 overflow-y-auto flex-1 bg-gradient-to-b from-muted/5 to-transparent flex flex-col gap-3">
                {requests.filter(r => r.status === 'Pending').length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-60 min-h-[150px]">
                    <PackageCheck className="w-10 h-10 mb-2 opacity-30" />
                    <span className="text-sm font-medium">No pending tasks</span>
                  </div>
                ) : (
                  requests.filter(r => r.status === 'Pending').map(req => <TaskCard key={req.id} req={req} />)
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex flex-col overflow-hidden h-full shadow-sm max-h-[75vh]">
              <div className="p-3 border-b border-indigo-500/10 bg-indigo-500/10 flex flex-col gap-1 shrink-0">
                <div className="flex items-center justify-between font-bold text-sm text-indigo-700 dark:text-indigo-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                    <span>In Progress (Picking)</span>
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/30 border-0">{requests.filter(r => r.status === 'Issuing').length}</Badge>
                </div>
              </div>
              <div className="p-3 overflow-y-auto flex-1 bg-gradient-to-b from-indigo-500/5 to-transparent flex flex-col gap-3">
                {requests.filter(r => r.status === 'Issuing').length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-indigo-500/50 min-h-[150px]">
                    <Box className="w-10 h-10 mb-2 opacity-30" />
                    <span className="text-sm font-medium">No active picking tasks</span>
                  </div>
                ) : (
                  requests.filter(r => r.status === 'Issuing').map(req => <TaskCard key={req.id} req={req} />)
                )}
              </div>
            </div>

            {/* Completed Column */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl flex flex-col overflow-hidden h-full shadow-sm max-h-[75vh]">
              <div className="p-3 border-b border-green-500/10 bg-green-500/10 flex flex-col gap-1 shrink-0">
                <div className="flex items-center justify-between font-bold text-sm text-green-700 dark:text-green-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span>Issued / Complete</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-500 hover:bg-green-500/30 border-0">{requests.filter(r => r.status === 'ON LINE' || r.status === 'Completed').length}</Badge>
                </div>
              </div>
              <div className="p-3 overflow-y-auto flex-1 bg-gradient-to-b from-green-500/5 to-transparent flex flex-col gap-3">
                {requests.filter(r => r.status === 'ON LINE' || r.status === 'Completed').length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-green-500/50 min-h-[150px]">
                    <CheckCircle className="w-10 h-10 mb-2 opacity-30" />
                    <span className="text-sm font-medium">No completed tasks yet</span>
                  </div>
                ) : (
                  requests.filter(r => r.status === 'ON LINE' || r.status === 'Completed').map(req => <TaskCard key={req.id} req={req} />)
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm bg-muted/5">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Settings2 className="w-5 h-5 text-indigo-500" /> Executive Planning Cockpit</h3>
              <p className="text-sm text-muted-foreground">Strategic material forecasting and proactive procurement decisions.</p>
            </div>
            <Button variant="outline" className="text-xs mr-2 font-mono"><Printer className="w-4 h-4 mr-2" /> Daily Ops Report</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <HealthCard title="Sufficient Coverage" value={stats.ready} icon={<CheckCircle className="w-4 h-4" />} color="green" description="Covers > 3 Shifts" />
            <HealthCard title="Immediate Risk" value={stats.warning} icon={<TrendingDown className="w-4 h-4" />} color="yellow" description="Depletes Next 24H (<3 Shifts)" />
            <HealthCard title="Line Blocked" value={stats.critical} icon={<AlertCircle className="w-4 h-4" />} color="red" description="0 Stock or Critically Blocked" />
            <HealthCard title="Volume Booked" value={stats.reservedTotal.toLocaleString()} icon={<Layers className="w-4 h-4" />} color="blue" description="Total PCS reserved in queues" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: 7 Day Projection Chart */}
            <div className="lg:col-span-2 space-y-4 bg-muted/5 border border-border p-4 rounded-xl">
              <div>
                <h4 className="font-bold text-sm tracking-widest text-muted-foreground uppercase mb-1">Demand vs Supply Projection</h4>
                <p className="text-[11px] text-muted-foreground">Simulated total available inventory vs ongoing cumulative factory line demand across the next 7 days.</p>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[...Array(7)].map((_, i) => {
                      const d = new Date(); d.setDate(d.getDate() + i);
                      return {
                        name: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
                        supply: Math.round(initialMaterials.reduce((sum, m) => sum + m.current_stock, 0) - (initialMaterials.reduce((s, m) => s + m.usage_per_shift, 0) * 3 * i)),
                        demand: Math.round(initialMaterials.reduce((sum, m) => sum + m.usage_per_shift, 0) * 3 * (i + 1)),
                        safety: Math.round(initialMaterials.reduce((sum, m) => sum + m.min_stock, 0))
                      }
                    })}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dx={-10} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', fontSize: '11px', color: '#fff' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                    <Area type="monotone" name="Proj. Supply (pcs)" dataKey="supply" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSupply)" />
                    <Area type="monotone" name="Line Demand (pcs)" dataKey="demand" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDemand)" />
                    <ReferenceLine y={Math.round(initialMaterials.reduce((s, m) => s + m.min_stock, 0))} stroke="#f59e0b" strokeDasharray="5 5" label={{ position: 'top', value: 'Global Safety Minimum', fill: '#f59e0b', fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Col: ABC/XYZ Split */}
            <div className="space-y-4 bg-muted/5 border border-border p-4 rounded-xl flex flex-col">
              <div>
                <h4 className="font-bold text-sm tracking-widest text-muted-foreground uppercase flex items-center gap-1.5"><Layers className="w-4 h-4" /> ABC Inventory Split</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Matrix categorizing parts based on usage velocity and reserve values.</p>
              </div>

              <div className="flex-1 space-y-3">
                {[
                  { title: 'Class A (High Priority)', desc: 'Top 20% value / Fast moving', count: Math.ceil(initialMaterials.length * 0.2), color: 'bg-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-600 dark:text-indigo-400' },
                  { title: 'Class B (Medium)', desc: 'Next 30% / Steady consumption', count: Math.ceil(initialMaterials.length * 0.3), color: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
                  { title: 'Class C (Low Priority)', desc: 'Remaining 50% / Slow moving', count: initialMaterials.length - Math.ceil(initialMaterials.length * 0.2) - Math.ceil(initialMaterials.length * 0.3), color: 'bg-muted-foreground', bg: 'bg-muted/30', border: 'border-border/60', text: 'text-muted-foreground' }
                ].map((item, i) => (
                  <div key={i} className={`p-3 rounded-lg border flex items-center justify-between ${item.bg} ${item.border}`}>
                    <div>
                      <div className={`font-bold text-sm ${item.text}`}>{item.title}</div>
                      <div className="text-[10px] text-muted-foreground/80 mt-0.5">{item.desc}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.color} text-white shadow-sm`}>
                      {item.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Line Loss Analysis Card */}
            <div className="space-y-4 bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex flex-col mt-6 lg:mt-0">
              <div>
                <h4 className="font-bold text-sm tracking-widest text-red-600 dark:text-red-400 uppercase flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> Monthly Line Loss Analysis</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Cumulative maintenance downtime across all active production lines.</p>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center p-4 bg-background rounded-lg border border-red-500/10 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>

                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Total Downtime (Min)</span>
                <span className="text-4xl font-mono font-black text-red-600 dark:text-red-500">{totalDowntime}</span>

                <div className="mt-4 w-full">
                  {productionLines.map(line => {
                    const lineDown = line.downtimeRecord?.accumulatedMinutes || 0;
                    if (lineDown === 0) return null;
                    const percent = Math.min(100, (lineDown / Math.max(1, totalDowntime)) * 100);
                    return (
                      <div key={line.id} className="mb-2 w-full">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="font-medium">{line.name}</span>
                          <span className="font-mono text-muted-foreground">{lineDown}m</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {/* Smart Re-Order List */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-red-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <h4 className="font-bold text-sm tracking-wide uppercase">Critical Re-Order Action List</h4>
                </div>
                <Badge variant="destructive" className="font-mono text-[10px] tracking-wider font-bold shadow-sm">{'< 3 SHIFTS OVER'}</Badge>
              </div>
              <div className="flex-1 overflow-x-auto text-[11px]">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                      <th className="px-4 py-2 text-left">Part Details</th>
                      <th className="px-4 py-2 text-center">Remaining</th>
                      <th className="px-4 py-2 text-right">Sug. Order Qty</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {DisplayMaterials.filter(m => m.shiftsRemaining < 3 && m.category !== 'Finished Goods').map(m => (
                      <tr key={m.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <div className="font-mono font-bold text-foreground text-xs">{m.id}</div>
                          <div className="text-muted-foreground truncate max-w-[150px]">{m.name}</div>
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-red-500">
                          {m.shiftsRemaining} Shifts
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge variant="outline" className="font-mono text-[11px] bg-background border-primary/20 text-primary">
                            +{(m.min_stock * 2.5).toLocaleString()} pcs
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] bg-primary/10 text-primary hover:bg-primary/20">Draft PO</Button>
                        </td>
                      </tr>
                    ))}
                    {DisplayMaterials.filter(m => m.shiftsRemaining < 3 && m.category !== 'Finished Goods').length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No urgent orders needed.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warehouse Workload Map */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col p-4">
              <div className="mb-4">
                <h4 className="font-bold text-sm tracking-widest text-muted-foreground uppercase flex items-center gap-1.5"><Clock className="w-4 h-4" /> Operations Workload Map (24H)</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Projected forklift and manual labor utilization across scheduled requests vs incoming deliveries.</p>
              </div>
              <div className="h-[220px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'].map(time => ({
                      time,
                      incoming: Math.floor(Math.random() * 40) + 10,
                      outgoing: Math.floor(Math.random() * 90) + 30
                    }))}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="outgoing" name="Issuance Tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="incoming" name="Receiving Tasks" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Production Pick List Modal Overlay */}
      {activeRequest && (
        <KitIssuanceModal
          isOpen={isKitModalOpen}
          onClose={() => {
            setIsKitModalOpen(false);
            setActiveRequest(null);
          }}
          planId={activeRequest.planId}
          items={activeRequest.items}
          onIssueToLine={executeKitIssuance}
        />
      )}

      {/* Advanced Logistics-Quality Gate: Return Handling Dialog */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[700px] border-border bg-card shadow-2xl overflow-hidden p-0 flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-border bg-muted/20">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2"><Undo2 className="w-5 h-5 text-indigo-500" /> Return from Production / QC Gate</DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Process unused or defective materials retrieved from active production lines. Parts must be categorized correctly to route to Available, Inspect, or Write-off.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-background space-y-4">
            {/* Dynamic Multi-Item Rows */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Return Manifest</span>
                <Button variant="ghost" size="sm" onClick={addEmptyReturnRow} className="h-7 text-xs flex items-center gap-1 hover:text-primary">
                  <Plus className="w-3.5 h-3.5" /> Add Part
                </Button>
              </div>

              <div className="border border-border/60 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold border-b border-border w-[240px]">Part / SKU</th>
                      <th className="px-3 py-2 text-left font-semibold border-b border-border w-[100px]">Qty</th>
                      <th className="px-3 py-2 text-left font-semibold border-b border-border w-[200px]">Quality Decision</th>
                      <th className="px-3 py-2 border-b border-border w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {returnItems.map(item => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 bg-transparent">
                          <Select value={item.partId} onValueChange={(v) => updateReturnRow(item.id, 'partId', v)}>
                            <SelectTrigger className="h-8 text-xs bg-transparent border-input shadow-sm w-full font-mono">
                              <SelectValue placeholder="Select SKU" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(m => <SelectItem key={m.id} value={m.id} className="text-xs font-mono">{m.id} - <span className="text-muted-foreground opacity-70 ml-1 font-sans truncate inline-block align-bottom max-w-[120px]">{m.name}</span></SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2.5">
                          <Input type="number" min="1" value={item.qty} onChange={(e) => updateReturnRow(item.id, 'qty', parseInt(e.target.value) || 1)} className="h-8 text-xs font-bold w-full bg-transparent input-no-spinners text-center" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex p-0.5 bg-muted rounded-md border border-border/50">
                            <button
                              type="button"
                              onClick={() => updateReturnRow(item.id, 'reason', 'good')}
                              className={`flex-1 flex justify-center py-1 rounded-sm transition-all ${item.reason === 'good' ? 'bg-background shadow text-green-600 font-bold border border-border/30' : 'text-muted-foreground hover:bg-background/50'}`}
                              title="Good Condition - Return to Available"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReturnRow(item.id, 'reason', 'defective')}
                              className={`flex-1 flex justify-center py-1 rounded-sm transition-all ${item.reason === 'defective' ? 'bg-background shadow text-yellow-600 font-bold border border-border/30' : 'text-muted-foreground hover:bg-background/50'}`}
                              title="Damaged/Defective - Move to Inspect"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateReturnRow(item.id, 'reason', 'scrap')}
                              className={`flex-1 flex justify-center py-1 rounded-sm transition-all ${item.reason === 'scrap' ? 'bg-background shadow text-red-600 font-bold border border-border/30' : 'text-muted-foreground hover:bg-background/50'}`}
                              title="Scrap - Write-off"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 rounded-full" onClick={() => removeReturnRow(item.id)} disabled={returnItems.length <= 1}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspector Note & Summary */}
            <div className="pt-4 border-t border-border mt-4">
              <Label htmlFor="note" className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Inspector Note / Operator Comment</Label>
              <textarea
                id="note"
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="e.g. Parts damaged during assembly process line A. Clips broken."
                className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center">
            <div className="text-xs text-muted-foreground font-medium">
              Returning <strong className="text-foreground">{returnItems.reduce((acc, it) => acc + it.qty, 0)}</strong> units across <strong className="text-foreground">{returnItems.length}</strong> SKUs
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
              <Button onClick={handleReturnAction} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold tracking-wide">
                <Undo2 className="w-4 h-4 flex-shrink-0 mr-2" /> Process Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Intake Station Modal */}
      <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
        <DialogContent className="sm:max-w-[750px] border-border bg-card shadow-2xl p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <DialogHeader className="p-0 m-0">
              <DialogTitle className="text-xl flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                Material Intake Station
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                High-speed terminal for material check-in, barcode generation, and inventory routing.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border border-border/50">
              <button
                onClick={() => setIsQuickScanMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-sm transition-all focus:outline-none ${!isQuickScanMode ? 'bg-background shadow text-foreground border border-border/50' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <Keyboard className="w-3.5 h-3.5" /> Manual Entry
              </button>
              <button
                onClick={() => setIsQuickScanMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-sm transition-all focus:outline-none ${isQuickScanMode ? 'bg-primary text-primary-foreground shadow border border-primary' : 'text-muted-foreground hover:bg-background/50'}`}
              >
                <Barcode className="w-3.5 h-3.5" /> Quick Scan
              </button>
            </div>
          </div>

          <div className="flex-1 bg-background relative">
            {!isQuickScanMode ? (
              <div className="flex flex-col md:flex-row h-full">
                {/* Left Form Area */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Part Number (SKU) *</Label>
                      <Input id="sku" value={intakeSku} onChange={(e) => setIntakeSku(e.target.value)} placeholder="e.g. COMP-001" className="h-10 text-sm font-mono font-bold bg-muted/10 uppercase" autoFocus />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="qty" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantity *</Label>
                      <Input id="qty" type="number" value={intakeQty} onChange={(e) => setIntakeQty(e.target.value)} placeholder="0" className="h-10 text-sm font-bold bg-muted/10" min="1" />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="batch" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Batch / Lot Number</Label>
                      <Input id="batch" value={intakeBatch} onChange={(e) => setIntakeBatch(e.target.value)} placeholder="Optional" className="h-10 text-sm bg-muted/10 font-mono" />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="bin" className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Assigned Bin Location
                      </Label>
                      <Input id="bin" value={intakeBin} onChange={(e) => setIntakeBin(e.target.value)} placeholder="e.g. A-101" className="h-10 text-sm bg-muted/10 font-mono text-primary font-bold border-primary/30 focus-visible:ring-primary/50" />
                    </div>
                    {intakeDesc && (
                      <div className="col-span-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-sm flex items-start gap-2 text-blue-700 dark:text-blue-400">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <strong>Known Part Found:</strong> {intakeDesc}. Defaulting to existing specifications and locations.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Barcode/Print Area */}
                <div className="w-full md:w-[280px] bg-muted/10 border-t md:border-t-0 md:border-l border-border/50 p-5 flex flex-col items-center justify-center space-y-4">
                  <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Digital Label</div>

                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 w-full flex flex-col items-center justify-center space-y-2 relative shadow-sm">
                    {intakeSku ? (
                      <>
                        <Barcode className="w-full h-16 text-black opacity-80" strokeWidth={1} />
                        <span className="font-mono font-bold text-black text-xs tracking-[0.2em]">{intakeSku.toUpperCase()}</span>
                      </>
                    ) : (
                      <div className="h-20 flex items-center justify-center flex-col opacity-30 text-black">
                        <Barcode className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-bold uppercase">Awaiting SKU</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-10 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-bold"
                    onClick={handlePrintLabel}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Label
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col p-8 items-center justify-center min-h-[300px]">
                <div className="w-full max-w-lg space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-2">
                      <ScanLine className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Waiting for Scanner</h3>
                    <p className="text-sm text-muted-foreground">Scan barcodes directly to intake inventory. Example: <code className="bg-muted px-1 rounded">RM-001</code> or <code className="bg-muted px-1 rounded">COMP-002-50</code> (for quantity).</p>
                  </div>

                  <Input
                    autoFocus
                    placeholder="Scan Barcode here..."
                    className="h-16 text-2xl text-center font-mono font-bold tracking-widest bg-muted/10 border-2 border-primary/50 focus-visible:ring-primary shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    value={quickScanData}
                    onChange={(e) => setQuickScanData(e.target.value)}
                    onKeyDown={processQuickScan}
                  />

                  {recentArrivals.length > 0 && (
                    <div className="mt-6">
                      <div className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Recent Scans</div>
                      <div className="space-y-2">
                        {recentArrivals.slice(0, 5).map((scan, i) => (
                          <div key={scan.id} className="flex items-center justify-between p-2.5 rounded border border-border/50 bg-muted/5 text-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="font-mono font-bold">{scan.sku}</span>
                              <Badge variant="outline" className="text-xs backdrop-blur-sm">x{scan.qty}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">{scan.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isQuickScanMode && (
            <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)} className="px-6 font-semibold">Cancel</Button>
              <Button onClick={handleIntakeSave} className="px-6 bg-primary hover:bg-primary/90 shadow-md font-bold tracking-wide">Save Record</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponents
function HealthCard({ title, value, icon, color, description }: { title: string, value: string | number, icon: React.ReactNode, color: 'green' | 'yellow' | 'red' | 'blue', description: string }) {
  const colorMap = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  return (
    <div className="bg-card border-border rounded-lg shadow-sm border p-4 flex flex-col hover:border-primary/40 transition-colors cursor-default group">
      <div className="flex justify-between items-start mb-1.5">
        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded bg-muted/50 border border-transparent group-hover:${colorMap[color].split(' ')[2]} transition-colors`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-3.5 h-3.5 ${colorMap[color].split(' ')[1]}` }) : icon}
        </div>
      </div>
      <div className="mt-auto pt-2">
        <span className="text-2xl font-black text-foreground tracking-tight">{value}</span>
        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}
