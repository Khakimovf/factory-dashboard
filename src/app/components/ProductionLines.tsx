import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { useDailyProductionPlan } from '../context/DailyProductionPlanContext';
import { useWarehouse } from '../context/WarehouseContext';
import { useAuth } from '../context/AuthContext';
import { FinishedGoodsRecord } from '../types/transferDocument';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { maintenanceApi } from '../services/maintenanceApi';
import {
  Factory, Plus, Activity, AlertCircle, PlayCircle, PauseCircle,
  Wrench, Clock, ShieldCheck,
  Monitor, Construction, ArrowRight, TrendingUp, Gauge, Target, Percent, Layers,
  ArrowLeft, Printer, QrCode, Search, Trash2, Sparkles, Check,
  Zap, Cpu, ShieldAlert, Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';

// ---------------- Analytics header ----------------

interface AnalyticCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'blue' | 'red' | 'yellow';
  pulse?: boolean;
}

function AnalyticCard({ icon, iconBg, label, value, sub, accent = 'blue', pulse }: AnalyticCardProps) {
  const accentColors: Record<string, string> = {
    green: 'from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-500 border-blue-500/20',
    red: 'from-rose-500/10 to-rose-500/5 text-rose-500 border-rose-500/20',
    yellow: 'from-amber-500/10 to-amber-500/5 text-amber-500 border-amber-500/20',
  };

  const accentText: Record<string, string> = {
    green: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-rose-600 dark:text-rose-400',
    yellow: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <Card className={`overflow-hidden border bg-gradient-to-br ${accentColors[accent]} transition-all hover:shadow-md group`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{label}</p>
          <div className={`p-2 rounded-lg ${iconBg} bg-opacity-20 transition-transform group-hover:scale-110 duration-300`}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className={`text-2xl font-bold tracking-tight ${accentText[accent]} ${pulse ? 'animate-pulse' : ''}`}>
            {value}
          </h3>
          {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Main component ----
const BASE_PARTS = [
  { id: 'SW-001', name: 'Switch Panel Base', category: 'Switches', defaultMultiplier: 50 },
  { id: 'SW-002', name: 'Switch Panel Premium', category: 'Switches', defaultMultiplier: 50 },
  { id: 'SW-BASE-99', name: 'Switch Bracket Plate', category: 'Switches', defaultMultiplier: 100 },
  { id: 'DT-001', name: 'Door Trim Clip Standard', category: 'Clips', defaultMultiplier: 100 },
  { id: 'DT-002', name: 'Door Trim Base Frame', category: 'Trims', defaultMultiplier: 20 },
  { id: 'DT-INT-002', name: 'Door Trim Base Plate', category: 'Trims', defaultMultiplier: 10 },
  { id: 'CONS-001', name: 'Console Clip Inner', category: 'Clips', defaultMultiplier: 250 },
  { id: 'CONS-002', name: 'Console Bracket Outer', category: 'Brackets', defaultMultiplier: 50 },
  { id: 'CONS-FR-04', name: 'Console Frame Plate', category: 'Covers', defaultMultiplier: 100 },
  { id: 'FAST-001', name: 'Standard Fastener Bolt', category: 'Fasteners', defaultMultiplier: 500 },
  { id: 'FAST-002', name: 'Wiring Snap Fastener', category: 'Fasteners', defaultMultiplier: 250 },
  { id: 'CLIP-010', name: 'Wiring Harness Hook', category: 'Clips', defaultMultiplier: 100 },
  { id: 'CLIP-020', name: 'Bumper Outer Retainer', category: 'Clips', defaultMultiplier: 150 },
];

const generateMicroPartsCatalog = () => {
  const list = [...BASE_PARTS];
  const categories = ['Switches', 'Clips', 'Trims', 'Brackets', 'Covers', 'Fasteners', 'Sensors', 'Harnesses', 'Plugs', 'Bolts'];
  const prefixes = ['SW', 'DT', 'CONS', 'FAST', 'CLIP', 'SEN', 'HARN', 'PLUG', 'BLT', 'BRK'];
  
  for (let i = 1; i <= 210; i++) {
    const categoryIdx = i % categories.length;
    const prefix = prefixes[i % prefixes.length];
    const numStr = String(i).padStart(3, '0');
    const id = `${prefix}-${numStr}`;
    if (!list.some(p => p.id === id)) {
      list.push({
        id,
        name: `${categories[categoryIdx]} Module ${numStr}`,
        category: categories[categoryIdx],
        defaultMultiplier: ((i * 10) % 450) + 50
      });
    }
  }
  return list;
};

const CONFIGURABLE_PARTS = generateMicroPartsCatalog();
const RECIPES = CONFIGURABLE_PARTS;

export function ProductionLines() {
  const { productionLines, addProductionLine, materials, tpaWipBuffer, updateMaterialQuantity, addMaterial, triggerEmergencyInject } = useFactory();
  const { setFinishedGoods } = useWarehouse();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getTodayLinePlan } = useDailyProductionPlan();
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // View toggle states
  const [showLegacy, setShowLegacy] = useState(false);
  const [isDrilledDown, setIsDrilledDown] = useState(false);

  // Assembly Line M (Melkiy Parts) output total
  const [lineMOutput, setLineMOutput] = useState(2450);

  // Micro-assembly hub workspace states
  const [selectedRecipe, setSelectedRecipe] = useState('SW-001');
  const [showPartSearchModal, setShowPartSearchModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [isTvMode, setIsTvMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [accumulationCount, setAccumulationCount] = useState(0);
  const [taraTargetLimit, setTaraTargetLimit] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [customPartInput, setCustomPartInput] = useState('');
  const [printedLabel, setPrintedLabel] = useState<any>(null);
  const [hubLogs, setHubLogs] = useState<string[]>([
    'SYSTEM: Connected to Assembly Line M workspace.',
    'LOGISTICS: Teleshka buffer ready.'
  ]);

  // Teleshka Cart Slot Registry (6 slots)
  const [teleshkaSlots, setTeleshkaSlots] = useState<(null | {
    id: string;
    partCode: string;
    quantity: number;
    timestamp: string;
    operatorId: string;
  })[]>([null, null, null, null, null, null]);

  // --- MULTI-VIEW WORKSPACE STATES ---
  const [activeHubView, setActiveHubView] = useState<'cockpit' | 'execution' | 'analytics' | 'logistics' | 'andon'>('cockpit');
  const [activeTrackingParts, setActiveTrackingParts] = useState<string[]>(['SW-001', 'DT-001', 'SW-BASE-99']);
  
  const [partTargets, setPartTargets] = useState<Record<string, number>>({
    'SW-001': 5000,
    'DT-001': 2000,
    'SW-BASE-99': 1000,
    'CONS-001': 3000
  });

  const [partOutputs, setPartOutputs] = useState<Record<string, number>>({
    'SW-001': 1200,
    'DT-001': 800,
    'SW-BASE-99': 450
  });

  const [defectLogs, setDefectLogs] = useState([
    { id: 1, partCode: 'SW-001', defectType: 'Scratch', timestamp: '14:23', inspector: 'QC-03', severity: 'minor' },
    { id: 2, partCode: 'DT-001', defectType: 'Pin Alignment', timestamp: '14:45', inspector: 'QC-01', severity: 'critical' },
    { id: 3, partCode: 'SW-BASE-99', defectType: 'Micro-crack', timestamp: '15:02', inspector: 'QC-03', severity: 'major' },
  ]);

  // Andon Diagnostic states
  const [andonIssueType, setAndonIssueType] = useState<string | null>(null);
  const [andonEquipment, setAndonEquipment] = useState<string>('TPA-Robot-06');
  const [andonDescription, setAndonDescription] = useState<string>('');
  
  const [resolvedTickets, setResolvedTickets] = useState([
    { id: 'ANDON-8821', issue_type: 'MECHANICAL ISSUE', equipmentCode: 'TPA-Robot-06', created_at: '11:15', arrived_at: '11:18', resolved_at: '11:32', duration: '17m', engineer: 'Jamoliddin J.' },
    { id: 'ANDON-4912', issue_type: 'SOFTWARE/PLC FAULT', equipmentCode: 'Chop Etish Printeri', created_at: '13:04', arrived_at: '13:09', resolved_at: '13:15', duration: '11m', engineer: 'Dilshod M.' },
  ]);

  // Andon System states
  const [activeMaintenanceTicket, setActiveMaintenanceTicket] = useState<any>(null);
  const [downtimeStartTime, setDowntimeStartTime] = useState<string | null>(null);
  const [timerNow, setTimerNow] = useState(new Date());

  // Downtime tracking clock effect
  useEffect(() => {
    let interval: any;
    if (activeMaintenanceTicket) {
      interval = setInterval(() => {
        setTimerNow(new Date());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeMaintenanceTicket]);

  const isTpaBufferLow = useMemo(() => {
    return tpaWipBuffer?.some(item => item.status === 'LOW_STOCK') || false;
  }, [tpaWipBuffer]);

  const filteredParts = useMemo(() => {
    return CONFIGURABLE_PARTS.filter(p =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredModalParts = useMemo(() => {
    return CONFIGURABLE_PARTS.filter(p =>
      p.id.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(modalSearchQuery.toLowerCase())
    );
  }, [modalSearchQuery]);

  // Handler to clear accumulation count
  const handleClearCounter = () => {
    setAccumulationCount(0);
    setHubLogs(prev => ['SYSTEM: Reset local counter.', ...prev].slice(0, 8));
    toast.info('Quyilgan sanagich tozalandi.');
  };

  // Handler to package current box, print QR and assign to Teleshka slot
  const handlePrintQR = () => {
    if (accumulationCount <= 0) {
      toast.error('Tara bo\'sh!', {
        description: 'Iltimos, avval detal yig\'ib qutilarni to\'ldiring.'
      });
      return;
    }

    const emptyIndex = teleshkaSlots.findIndex(s => s === null);
    if (emptyIndex === -1) {
      toast.error('Teleshkada joy qolmadi!', {
        description: 'Iltimos, avval teleshkani omborga jo\'nating.'
      });
      return;
    }

    const boxId = `BOX-${Math.floor(1000 + Math.random() * 9000)}`;
    const operatorId = user?.username || 'OP-4412';
    const newBox = {
      id: boxId,
      partCode: selectedRecipe,
      quantity: accumulationCount,
      timestamp: new Date().toLocaleTimeString(),
      operatorId
    };

    const newSlots = [...teleshkaSlots];
    newSlots[emptyIndex] = newBox;
    setTeleshkaSlots(newSlots);

    setPrintedLabel(newBox);
    setLineMOutput(prev => prev + accumulationCount);
    setPartOutputs(prev => ({
      ...prev,
      [selectedRecipe]: (prev[selectedRecipe] || 0) + accumulationCount
    }));
    
    setHubLogs(prev => [
      `BARCODE_ENGINE: Generated label for dynamic package batch containing exactly [${accumulationCount}] Pcs of selected Micro-Part SKU.`,
      `PRINT_QUEUE: Generated QR payload for ${selectedRecipe} (Qty: ${accumulationCount})`,
      `LABEL_STICKER: Printed Box #${boxId} successfully.`,
      ...prev
    ].slice(0, 8));

    setAccumulationCount(0);

    toast.success(`Tara to'ldirildi va QR kod chop etildi!`, {
      description: `Box #${boxId} Teleshkaning ${emptyIndex + 1}-uyasiga joylashtirildi.`
    });
  };

  // Handler to commit Teleshka loaded boxes to Finished Goods & Materials list
  const handleTeleshkaCommit = () => {
    const loadedBoxes = teleshkaSlots.filter((s): s is NonNullable<typeof s> => s !== null);
    if (loadedBoxes.length === 0) {
      toast.error('Teleshka bo\'sh!', {
        description: 'Omborga jo\'natish uchun avval qutilarni yig\'ing.'
      });
      return;
    }

    let totalQty = 0;

    // 1. Update global materials list for each box in teleshka
    loadedBoxes.forEach(box => {
      const qty = box.quantity;
      totalQty += qty;
      const matId = `FG-${box.partCode}`;
      const existing = materials.find(m => m.id === matId);

      if (existing) {
        updateMaterialQuantity(matId, existing.quantity + qty);
      } else {
        try {
          addMaterial({
            materialId: matId,
            name: `${box.partCode} Assembly Unit`,
            quantity: qty,
            unit: 'units',
            minStock: 100,
            category: 'Finished Goods'
          });
        } catch (e) {
          updateMaterialQuantity(matId, qty);
        }
      }
    });

    // 2. Update warehouse finished goods context
    setFinishedGoods(prev => {
      let next = [...prev];
      loadedBoxes.forEach(box => {
        const sku = box.partCode;
        const qty = box.quantity;
        const existing = next.find(fg => fg.sku === sku);
        const newBatch = {
          batch: `BATCH-${box.id.replace('BOX-', '')}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
          quantity: qty,
          qcDate: new Date().toISOString().split('T')[0],
          sourceLine: "Melkiy Parts Assembly (Line M)",
          warehouseLocation: "M-ZONE",
          receivedAt: new Date().toISOString(),
          receivedBy: box.operatorId,
          productionDate: new Date().toISOString().split('T')[0],
          shift: 'A' as const
        };

        if (existing) {
          next = next.map(fg => fg.sku === sku ? {
            ...fg,
            totalQuantity: fg.totalQuantity + qty,
            availableQuantity: fg.availableQuantity + qty,
            batches: [...fg.batches, newBatch],
            warehouseLocations: fg.warehouseLocations.includes("M-ZONE") ? fg.warehouseLocations : [...fg.warehouseLocations, "M-ZONE"],
            sourceLines: fg.sourceLines.includes("Melkiy Parts Assembly (Line M)") ? fg.sourceLines : [...fg.sourceLines, "Melkiy Parts Assembly (Line M)"],
            lastUpdated: new Date().toISOString()
          } : fg);
        } else {
          const newRecord: FinishedGoodsRecord = {
            id: `FG-${Date.now()}-${sku}`,
            sku,
            productName: `${sku} Unit`,
            totalQuantity: qty,
            reservedQuantity: 0,
            availableQuantity: qty,
            blockedQuantity: 0,
            batches: [newBatch],
            warehouseLocations: ["M-ZONE"],
            sourceLines: ["Melkiy Parts Assembly (Line M)"],
            status: 'AVAILABLE_FOR_SALE',
            lastUpdated: new Date().toISOString()
          };
          next.push(newRecord);
        }
      });
      return next;
    });

    setTeleshkaSlots([null, null, null, null, null, null]);
    setPrintedLabel(null);
    setHubLogs(prev => [`LOGISTICS: Committed Teleshka to EWM. Qty: ${totalQty} pcs`, ...prev].slice(0, 8));

    toast.success('Teleshkadagi mahsulotlar muvaffaqiyatli jo\'natildi!', {
      description: `Jami ${totalQty} dona detal global ombor hisobiga qo'shildi.`
    });
  };

  const handleAddCustomPart = () => {
    if (!customPartInput.trim()) return;
    const cleanId = customPartInput.trim().toUpperCase();
    setSelectedRecipe(cleanId);
    setCustomPartInput('');
    setHubLogs(prev => [`SYSTEM: Selected custom recipe ${cleanId}`, ...prev].slice(0, 8));
  };

  const formatDowntimeElapsed = (startTimeStr: string) => {
    if (!startTimeStr) return '00:00';
    const start = new Date(startTimeStr);
    const diff = Math.floor((timerNow.getTime() - start.getTime()) / 1000);
    if (diff < 0) return '00:00';
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResolveAndon = () => {
    if (activeMaintenanceTicket) {
      const start = new Date(downtimeStartTime || new Date());
      const end = new Date();
      const diffSec = Math.floor((end.getTime() - start.getTime()) / 1000);
      const min = Math.floor(diffSec / 60);
      const sec = diffSec % 60;
      
      const closedTicket = {
        id: activeMaintenanceTicket.id || `ANDON-${Math.floor(1000 + Math.random() * 9000)}`,
        issue_type: activeMaintenanceTicket.issue_type || andonIssueType || 'UNKNOWN ISSUE',
        equipmentCode: activeMaintenanceTicket.equipmentCode || andonEquipment || 'General',
        created_at: start.toLocaleTimeString().slice(0, 5),
        arrived_at: new Date(start.getTime() + 180005).toLocaleTimeString().slice(0, 5), // Mock arrival 3m later
        resolved_at: end.toLocaleTimeString().slice(0, 5),
        duration: `${min}m ${sec}s`,
        engineer: 'Jamoliddin J.'
      };
      
      setResolvedTickets(prev => [closedTicket, ...prev].slice(0, 5));
    }
    setActiveMaintenanceTicket(null);
    setDowntimeStartTime(null);
    setAndonIssueType(null);
    setAndonDescription('');
    setHubLogs(prev => ['SYSTEM: Andon issue resolved. Production resumed.', ...prev].slice(0, 8));
    toast.success('Nosozlik bartaraf etildi. Ishlab chiqarish tiklandi.');
  };

  // ── SAP Analytics Calculations ──
  const analytics = useMemo(() => {
    const lines = productionLines;

    // 1. Factory Capacity: Active lines / Total lines
    const activeLines = lines.filter(l => l.status === 'active').length;
    const capacity = lines.length ? Math.round((activeLines / lines.length) * 100) : 0;

    // 2. Material Readiness
    const THIRTY_MIN_THRESHOLD_RATIO = 0.3;
    const riskCount = materials.filter(m =>
      m.minStock > 0 && m.quantity < m.minStock * THIRTY_MIN_THRESHOLD_RATIO
    ).length;
    const readiness = Math.max(0, 100 - (riskCount * 5));

    // 3. Downtime Impact (Hours lost)
    const downtimeMinutes = lines.reduce((s, l) => s + (l.downtimeRecord?.accumulatedMinutes || 0), 0);
    const downtimeHours = (downtimeMinutes / 60).toFixed(1);

    return { capacity, readiness, downtimeHours, riskCount };
  }, [productionLines, materials]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <PlayCircle className="w-5 h-5 text-emerald-500" />;
      case 'idle': return <PauseCircle className="w-5 h-5 text-amber-500" />;
      case 'maintenance': return <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 uppercase text-[10px] font-bold tracking-wider">Active</Badge>;
      case 'idle': return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 uppercase text-[10px] font-bold tracking-wider">Idle</Badge>;
      case 'maintenance': return <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800 uppercase text-[10px] font-bold tracking-wider animate-pulse">Maintenance</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-wider">{status}</Badge>;
    }
  };

  const getLineIcon = (type: string, status: string) => {
    const isActive = status === 'active';
    const baseClass = `w-6 h-6 ${isActive ? 'text-emerald-500' : 'text-blue-500'}`;
    const bgClass = `w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-emerald-500/10 shadow-inner' : 'bg-blue-500/10 shadow-inner'}`;

    let icon = <Factory className={baseClass} />;
    if (type === 'sap_inpanel') icon = <Monitor className={baseClass} />;
    if (type === 'tpa_molding') icon = <Construction className={baseClass} />;
    if (type === 'assembly') icon = <Wrench className={baseClass} />;

    return <div className={bgClass}>{icon}</div>;
  };

  const getLineTypeLabel = (type: string) => {
    switch (type) {
      case 'sap_inpanel': return 'SAP Inpanel';
      case 'tpa_molding': return 'TPA Molding';
      case 'assembly': return 'Assembly';
      default: return 'Production';
    }
  };

  if (isDrilledDown && isTvMode) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-slate-100 font-mono py-8 z-[150] overflow-y-auto flex flex-col justify-between">
        {/* Blueprint Grid Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:35px_35px]" />

        {/* Content Wrapper to fix Left Squishing and Margin Padding Constraint */}
        <div className="flex-1 w-full max-w-[96%] mx-auto flex flex-col justify-between relative z-10 pl-8 pr-6">
          
          {/* Top Alert Banner */}
          <div className="flex items-center justify-between border-b border-cyan-500/50 pt-8 pb-4 mb-6 h-20">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-black tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(6,180,212,0.3)]">
                [ LINYA M: KUNLIK ISHLAB CHIQARISH REJASI — LIVE UNUM ]
              </h1>
              <div className="flex items-center gap-3">
                <Badge className="bg-cyan-950/60 border border-cyan-500/20 text-cyan-300 text-[10px] font-black px-2.5 py-0.5 whitespace-nowrap">
                  SHIFT: A
                </Badge>
                <Badge className={`border text-[10px] font-black px-2.5 py-0.5 whitespace-nowrap ${
                  activeMaintenanceTicket 
                    ? 'bg-rose-950/60 border-rose-500/30 text-rose-400 animate-pulse' 
                    : 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400'
                }`}>
                  {activeMaintenanceTicket ? '⚠️ DOWNTIME ACTIVE' : '⚡ SYSTEM ONLINE'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right flex items-center gap-3">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">ROLLING FACTORY CLOCK</span>
                <span className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,180,212,0.25)] tabular-nums whitespace-nowrap">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTvMode(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:bg-cyan-950/15 text-slate-300 hover:text-cyan-400 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md animate-in fade-in whitespace-nowrap"
              >
                ✕ Exit / Chiqish
              </button>
            </div>
          </div>

          {/* Symmetrical 12-item Grid matrix layout (cols-4 for 3x4 layout) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
            {CONFIGURABLE_PARTS.slice(0, 12).map(part => {
              const partId = part.id;
              const target = partTargets[partId] || 3000;
              const fact = partOutputs[partId] || 0;
              const remaining = Math.max(0, target - fact);
              const pct = Math.min(100, Math.round((fact / target) * 100));

              // Dynamic color alerts based on progress
              let progressColor = 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
              let statusText = 'CRITICAL LAG';
              let textColor = 'text-rose-400';
              
              if (pct >= 100) {
                progressColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
                statusText = 'QUOTA MET';
                textColor = 'text-emerald-400';
              } else if (pct >= 40) {
                progressColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
                statusText = 'IN PROGRESS';
                textColor = 'text-amber-400';
              }

              return (
                <div 
                  key={partId}
                  className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/20 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold font-mono text-white tracking-wider">{partId}</span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[170px] uppercase font-semibold mt-0.5">{part.name}</span>
                    </div>
                    <Badge className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-md ${textColor} border-current/25 bg-slate-950`}>
                      {statusText}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-3 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850/40 text-[10px] font-bold">
                    <div>
                      <span className="text-slate-500 text-[8px] mr-1 block">TGT:</span>
                      <span className="font-mono text-white text-sm font-black">{target.toLocaleString()}</span>
                    </div>
                    <div className="border-l border-slate-850/80 h-4" />
                    <div>
                      <span className="text-slate-500 text-[8px] mr-1 block">DONE:</span>
                      <span className={`font-mono text-sm font-black ${textColor}`}>{fact.toLocaleString()}</span>
                    </div>
                    <div className="border-l border-slate-850/80 h-4" />
                    <div>
                      <span className="text-slate-500 text-[8px] mr-1 block">LEFT:</span>
                      <span className="font-mono text-sm font-black text-cyan-400">{remaining.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {/* Sleek, Modern, Thin Progress Bar */}
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`} 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{pct}% Completed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Footer Status Ledger */}
          <div className="bg-slate-900/30 border border-slate-850/60 rounded-xl p-3.5 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>FACTORY OVERHEAD ANDON KIOSK SYSTEM v4.40</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE DATA UPDATES SYNCED WITH Packing Cockpit
            </span>
            <span>12 ACTIVE PRODUCTION TRACKS</span>
          </div>

        </div>
      </div>
    );
  }

  if (isDrilledDown) {
    const isTargetMet = accumulationCount >= taraTargetLimit;
    const selectedPartDetails = CONFIGURABLE_PARTS.find(p => p.id === selectedRecipe) || { name: `${selectedRecipe} Unit`, category: 'Custom' };

    return (
      <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-mono relative overflow-hidden">
        {/* Blueprint Grid Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#a855f7_1px,transparent_1px),linear-gradient(to_bottom,#a855f7_1px,transparent_1px)] bg-[size:45px_45px]" />

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-900 pb-4 relative z-10">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsDrilledDown(false)}
              className="p-2 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 rounded-lg transition-all text-slate-500 hover:text-purple-400 bg-slate-900/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white tracking-tight">
                  <span className="text-purple-500">[</span> ASSEMBLY LINE M — MICRO-ASSEMBLY HUB <span className="text-purple-500">]</span>
                </h2>
                <Badge className={`px-2 py-0.5 text-[8px] font-black border ${
                  activeMaintenanceTicket 
                    ? 'bg-rose-950/40 border-rose-500/30 text-rose-400 animate-pulse' 
                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                }`}>
                  {activeMaintenanceTicket ? 'LINE STATUS: CRITICAL DOWNTIME' : 'LINE STATUS: RUNNING'}
                </Badge>
              </div>
              <p className="text-[9px] text-purple-400 font-bold uppercase tracking-[0.2em] mt-1">
                Manufacturing Execution System (MES) Widescreen Terminal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsTvMode(true)}
              className="px-4 py-2 border border-cyan-500/30 bg-cyan-950/25 hover:bg-cyan-500/10 text-cyan-400 text-xs font-black rounded-lg shadow-[0_0_10px_rgba(6,180,212,0.15)] transition-all duration-200"
            >
              📺 TV MONITOR MODE (FULLSCREEN)
            </button>
            <Button
              variant="outline"
              onClick={() => setIsDrilledDown(false)}
              className="border-slate-800 hover:bg-slate-900 hover:text-white text-slate-300 font-bold uppercase text-[9px] tracking-widest h-10 rounded-xl px-4 transition-all"
            >
              ← QAYTISH
            </Button>
          </div>
        </div>

        {/* Widescreen MES Switcher Hub */}
        <div className="flex flex-wrap items-center gap-4 mb-6 relative z-10 border-b border-slate-900 pb-4">
          {[
            { id: 'cockpit', label: '📊 PACKING COCKPIT', desc: 'Counter & Print Engine' },
            { id: 'execution', label: '📋 PRODUCTION EXECUTION', desc: '200+ Parts Tracker' },
            { id: 'analytics', label: '📊 SHIFT TIMELINE & QUALITY ANALYTICS', desc: 'Pareto & QC Live Feed' },
            { id: 'logistics', label: '📦 LOGISTICS & MATERIALS', desc: 'Dual-Stock & Teleshka' },
            { id: 'andon', label: '🚨 ANDON DIAGNOSTIC TERMINAL', desc: 'Descriptive Dispatch' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveHubView(view.id as any)}
              className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden ${
                activeHubView === view.id
                  ? 'bg-purple-600/15 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="text-sm font-bold tracking-wider block uppercase mb-1">{view.label}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{view.desc}</div>
              <div className={`absolute bottom-0 left-0 h-1.5 bg-purple-500 transition-all duration-200 ${activeHubView === view.id ? 'w-full' : 'w-0'}`} />
            </button>
          ))}
        </div>

        {/* Windows Workspace Viewport */}
        <div className="relative z-10">
          
          {/* WINDOW 1: COCKPIT */}
          {activeHubView === 'cockpit' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              {/* Recipe BOM Panel */}
              <div className="lg:col-span-6 space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalSearchQuery('');
                    setShowPartSearchModal(true);
                  }}
                  className="flex items-center justify-between w-full p-4 bg-slate-900/80 border-2 border-dashed border-purple-500/40 hover:border-purple-500 rounded-xl transition-all"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanlangan Detal (Active Part Code)</span>
                    <span className="text-base font-black text-white mt-1">{selectedRecipe} — {selectedPartDetails.name}</span>
                  </div>
                  <span className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-md">🎯 DETALNI ALASHTIRISH</span>
                </button>

                <Card className="bg-slate-900/40 border-slate-850 shadow-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Gauge className="w-4 h-4" /> Granular Counting Matrix
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="relative p-6 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col items-center justify-center">
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isTargetMet ? 'bg-emerald-500 animate-ping shadow-[0_0_8px_#10b981]' : 'bg-slate-800'} border border-white/10`} />
                        <span className={`text-[7px] font-bold ${isTargetMet ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                          {isTargetMet ? "TARGET MET" : "FILLING TARA"}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Accumulation Count</span>
                      <div className="flex items-baseline gap-1 select-none">
                        <h3 className={`text-6xl font-black tracking-tighter ${isTargetMet ? 'text-emerald-400' : 'text-purple-400'}`}>
                          {accumulationCount}
                        </h3>
                        <span className="text-sm font-bold text-slate-500">/ {taraTargetLimit} Pcs</span>
                      </div>
                      <div className="w-full mt-4 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full ${isTargetMet ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-purple-500'} transition-all`} 
                          style={{ width: `${Math.min(100, (accumulationCount / taraTargetLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="w-full mt-5 space-y-2 border-t border-slate-900 pt-4">
                        <label className="text-[10px] font-black text-purple-400 uppercase tracking-wider block">
                          📝 TARADAGI FAQTIY MIQDORNI KIRITISH (MANUAL BATCH COUNT)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={accumulationCount || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setAccumulationCount(isNaN(val) ? 0 : val);
                          }}
                          placeholder="Manual amount (e.g. 85, 350, 1000)..."
                          className="w-full p-4 bg-slate-900/60 border-2 border-purple-500/50 rounded-xl text-lg font-bold text-white outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-center transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 5, 10].map(inc => (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => setAccumulationCount(prev => prev + inc)}
                            className="py-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/30 text-white rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5"
                          >
                            <span className="text-xl font-black">+{inc}</span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase">Items</span>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearCounter}
                        className="w-full py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                      >
                        Reset Counter
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* QR Label Panel */}
              <div className="lg:col-span-6 space-y-6">
                <Card className="bg-slate-900/40 border-slate-850 shadow-2xl h-full flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <QrCode className="w-4 h-4" /> 3. QR Consolidation Engine
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden min-h-[160px]">
                      {printedLabel ? (
                        <div className="space-y-3 animate-in zoom-in-95 duration-200">
                          <div className="border-b border-dashed border-slate-850 pb-1.5 flex justify-between items-center text-[7px] font-bold text-slate-500">
                            <span>VWM LOGISTICS QR MODULE</span>
                            <span className="text-emerald-400 font-black">STATUS: PRINTED</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[8px] font-bold">
                            <div>
                              <span className="text-slate-500 block text-[6.5px] uppercase">Part Code ID</span>
                              <span className="text-white uppercase font-black text-xs">{printedLabel.partCode}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[6.5px] uppercase">TARA Qty (Count)</span>
                              <span className="text-purple-400 font-black text-xs">{printedLabel.quantity} pcs</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[6.5px] uppercase">Precise Timestamp</span>
                              <span className="text-slate-300 font-mono">{printedLabel.timestamp}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[6.5px] uppercase">Operator ID</span>
                              <span className="text-slate-300">{printedLabel.operatorId}</span>
                            </div>
                          </div>
                          <div className="w-16 h-16 bg-white p-1.5 rounded mx-auto flex items-center justify-center shadow-inner relative group border border-slate-200">
                            <div className="grid grid-cols-8 gap-0.5 w-full h-full opacity-90">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div key={i} className={`w-full h-full ${((i * 7) + 3) % 5 === 0 || i % 3 === 0 ? 'bg-black' : 'bg-white'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-600 flex flex-col items-center justify-center gap-2">
                          <QrCode className="w-8 h-8 text-slate-800 animate-pulse" />
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Awaiting QR Generation</p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handlePrintQR}
                      className={`w-full py-4 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all border ${
                        isTargetMet ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700' : 'bg-purple-600 border-purple-500 hover:bg-purple-700'
                      }`}
                    >
                      <Printer className="w-4 h-4 mr-2" /> TARANI YAKUNLASH & QR CHOP ETISH
                    </Button>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-500 uppercase">System Broadcast Logs</span>
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 h-[70px] overflow-y-auto text-[7px] font-mono text-emerald-400 space-y-1 custom-scrollbar">
                        {hubLogs.map((log, index) => (
                          <div key={index} className="leading-tight flex items-start gap-1">
                            <span className="text-emerald-600 shrink-0">&gt;</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* WINDOW 2: PRODUCTION EXECUTION */}
          {activeHubView === 'execution' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Plan vs Fact table of 200+ parts */}
              <div className="flex items-center justify-between gap-4 bg-slate-900/40 p-3 border border-slate-850 rounded-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 200+ micro-parts database records..."
                    className="w-full pl-9 pr-4 h-8 border border-slate-800 bg-slate-950/80 rounded-xl focus:ring-1 focus:ring-purple-500 outline-none text-[10px] font-bold text-slate-200"
                  />
                </div>
                <Badge variant="outline" className="border-purple-500/20 text-purple-400 font-bold text-[8px]">
                  PLAN SYNC: ACTIVE
                </Badge>
              </div>

              <Card className="bg-slate-900/30 border-slate-855 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs">
                        <th className="py-4 px-4">Part Code</th>
                        <th className="py-4 px-4">Part Name</th>
                        <th className="py-4 px-4 text-right">Daily Target</th>
                        <th className="py-4 px-4 text-right">Produced</th>
                        <th className="py-4 px-4 text-right">Remaining</th>
                        <th className="py-4 px-4 text-center">Progress</th>
                        <th className="py-4 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 font-semibold text-sm">
                      {filteredParts.map(part => {
                        const target = partTargets[part.id] || 3000;
                        const fact = partOutputs[part.id] || 0;
                        const remaining = Math.max(0, target - fact);
                        const pct = Math.min(100, Math.round((fact / target) * 100));
                        const isCurrent = selectedRecipe === part.id;

                        return (
                          <tr key={part.id} className={`hover:bg-slate-900/20 transition-colors ${isCurrent ? 'bg-purple-950/10' : ''}`}>
                            <td className="py-[18px] px-4 text-purple-400 font-mono text-sm font-semibold">{part.id}</td>
                            <td className="py-[18px] px-4 text-slate-300 text-sm font-semibold">{part.name}</td>
                            <td className="py-[18px] px-4 text-right text-slate-400 text-sm font-semibold">{target}</td>
                            <td className="py-[18px] px-4 text-right text-purple-300 text-sm font-semibold">{fact}</td>
                            <td className="py-[18px] px-4 text-right text-emerald-400 text-sm font-semibold">{remaining}</td>
                            <td className="py-[18px] px-4 text-center text-sm font-semibold">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-12 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-mono text-slate-400">{pct}%</span>
                              </div>
                            </td>
                            <td className="py-[18px] px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRecipe(part.id);
                                  setTaraTargetLimit(part.defaultMultiplier);
                                  setActiveHubView('cockpit');
                                  toast.success(`Selected recipe ${part.id} loaded into Cockpit.`);
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-purple-500/10 active:scale-95"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* WINDOW 3: SHIFT TIMELINE & QUALITY ANALYTICS */}
          {activeHubView === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200 w-full">
              
              {/* 2x2 Grid Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Quadrant 1: Defect Pareto Chart */}
                <Card className="bg-slate-900/40 border-slate-850 shadow-2xl flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-855 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" /> Q1: Defect Pareto Chart
                      </CardTitle>
                      <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                        Failure mode distribution & cumulative impact
                      </CardDescription>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newDef = {
                          id: Date.now(),
                          partCode: activeTrackingParts[Math.floor(Math.random() * activeTrackingParts.length)],
                          defectType: ['Scratch', 'Micro-crack', 'Bent Pin'][Math.floor(Math.random() * 3)],
                          timestamp: new Date().toLocaleTimeString().slice(0, 5),
                          inspector: 'QC-03',
                          severity: ['minor', 'major', 'critical'][Math.floor(Math.random() * 3)]
                        };
                        setDefectLogs(prev => [newDef, ...prev].slice(0, 8));
                        toast.error(`Defect registered: ${newDef.defectType} on ${newDef.partCode}`);
                      }}
                      className="px-2 py-1 border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[9px] uppercase font-black tracking-widest rounded transition-all"
                    >
                      Simulate
                    </button>
                  </CardHeader>
                  <CardContent className="p-4 flex items-center justify-center min-h-[200px]">
                    <svg className="w-full h-48 overflow-visible" viewBox="0 0 300 120">
                      <line x1="20" y1="15" x2="280" y2="15" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="20" y1="50" x2="280" y2="50" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="20" y1="85" x2="280" y2="85" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="20" y1="100" x2="280" y2="100" stroke="#334155" />

                      {/* Bars */}
                      <g className="group cursor-pointer">
                        <rect x="35" y="25" width="20" height="75" fill="url(#pGrad)" rx="2" className="hover:fill-purple-400 transition-all" />
                        <text x="45" y="20" fill="#a855f7" fontSize="7" fontWeight="bold" textAnchor="middle">15 (60%)</text>
                      </g>

                      <g className="group cursor-pointer">
                        <rect x="95" y="45" width="20" height="55" fill="url(#pGradLight)" rx="2" className="hover:fill-purple-300 transition-all" />
                        <text x="105" y="40" fill="#c084fc" fontSize="7" fontWeight="bold" textAnchor="middle">10 (40%)</text>
                      </g>

                      <g className="group cursor-pointer">
                        <rect x="155" y="65" width="20" height="35" fill="url(#pGradPink)" rx="2" className="hover:fill-rose-400 transition-all" />
                        <text x="165" y="60" fill="#f43f5e" fontSize="7" fontWeight="bold" textAnchor="middle">5 (20%)</text>
                      </g>

                      <g className="group cursor-pointer">
                        <rect x="215" y="80" width="20" height="20" fill="#e9d5ff" rx="2" className="hover:fill-white transition-all" />
                        <text x="225" y="75" fill="#d8b4fe" fontSize="7" fontWeight="bold" textAnchor="middle">2 (8%)</text>
                      </g>

                      {/* Pareto Cumulative Line */}
                      <path d="M 45 70 L 105 45 L 165 25 L 225 15" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="45" cy="70" r="2" fill="#10b981" />
                      <circle cx="105" cy="45" r="2" fill="#10b981" />
                      <circle cx="165" cy="25" r="2" fill="#10b981" />
                      <circle cx="225" cy="15" r="2" fill="#10b981" />

                      <text x="45" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">Scratch</text>
                      <text x="105" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">Pin Align</text>
                      <text x="165" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">Crack</text>
                      <text x="225" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">Clip Bent</text>

                      <text x="15" y="18" fill="#475569" fontSize="6" textAnchor="end">100%</text>
                      <text x="15" y="53" fill="#475569" fontSize="6" textAnchor="end">50%</text>
                      <text x="15" y="88" fill="#475569" fontSize="6" textAnchor="end">25%</text>
                    </svg>

                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                        <linearGradient id="pGradLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <linearGradient id="pGradPink" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </CardContent>
                </Card>

                {/* Quadrant 2: Shift Yield & Hourly Output Trend */}
                <Card className="bg-slate-900/40 border-slate-855 shadow-2xl flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-855">
                    <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" /> Q2: Shift Yield & Hourly Output Trend
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      Actual Hourly Volume vs Theoretical Target Plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 flex items-center justify-center min-h-[200px]">
                    <svg className="w-full h-48 overflow-visible" viewBox="0 0 300 120">
                      <line x1="20" y1="15" x2="280" y2="15" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="20" y1="50" x2="280" y2="50" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="20" y1="85" x2="280" y2="85" stroke="#1e293b" strokeDasharray="3" />
                      <line x1="20" y1="100" x2="280" y2="100" stroke="#334155" />

                      {/* Dotted Plan Line */}
                      <path d="M 25 85 L 75 75 L 125 60 L 175 45 L 225 30 L 275 15" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2" />
                      <text x="235" y="24" fill="#64748b" fontSize="5.5" fontWeight="bold">PLAN TARGET</text>

                      {/* Solid Output Trend Line */}
                      <path d="M 25 90 L 75 70 L 125 65 L 175 40 L 225 35 L 275 20" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                      
                      {/* Dots on Actual Line */}
                      <circle cx="25" cy="90" r="2.5" fill="#a855f7" stroke="#0f172a" strokeWidth="0.8" />
                      <circle cx="75" cy="70" r="2.5" fill="#a855f7" stroke="#0f172a" strokeWidth="0.8" />
                      <circle cx="125" cy="65" r="2.5" fill="#a855f7" stroke="#0f172a" strokeWidth="0.8" />
                      <circle cx="175" cy="40" r="2.5" fill="#a855f7" stroke="#0f172a" strokeWidth="0.8" />
                      <circle cx="225" cy="35" r="2.5" fill="#a855f7" stroke="#0f172a" strokeWidth="0.8" />
                      <circle cx="275" cy="20" r="2.5" fill="#a855f7" stroke="#0f172a" strokeWidth="0.8" />

                      {/* Values */}
                      <text x="75" y="62" fill="#fff" fontSize="6.5" fontWeight="bold" textAnchor="middle">600</text>
                      <text x="175" y="32" fill="#fff" fontSize="6.5" fontWeight="bold" textAnchor="middle">1200</text>
                      <text x="275" y="12" fill="#fff" fontSize="6.5" fontWeight="bold" textAnchor="middle">2450</text>

                      {/* X-Axis Labels */}
                      <text x="25" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">08:00</text>
                      <text x="75" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">10:00</text>
                      <text x="125" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">12:00</text>
                      <text x="175" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">14:00</text>
                      <text x="225" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">16:00</text>
                      <text x="275" y="109" fill="#64748b" fontSize="6.5" textAnchor="middle">18:00</text>

                      {/* Y-Axis Labels */}
                      <text x="15" y="18" fill="#475569" fontSize="6" textAnchor="end">3000</text>
                      <text x="15" y="53" fill="#475569" fontSize="6" textAnchor="end">1500</text>
                      <text x="15" y="88" fill="#475569" fontSize="6" textAnchor="end">500</text>
                    </svg>
                  </CardContent>
                </Card>

                {/* Quadrant 3: Overall Equipment Effectiveness & Machine OEE */}
                <Card className="bg-slate-900/40 border-slate-855 shadow-2xl flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-855">
                    <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" /> Q3: Machine OEE cluster metrics
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      Key Lean Manufacturing Performance Indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 flex items-center justify-around gap-2 min-h-[200px]">
                    
                    {/* Gauge 1: Availability */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-cyan-500 drop-shadow-[0_0_4px_#06b6d4]" strokeWidth="2.5" strokeDasharray="88, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="absolute text-[10px] font-black font-mono text-cyan-400">88%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-wider">Availability<br/><span className="text-[7.5px] text-slate-600">(Ish Vaqti)</span></span>
                    </div>

                    {/* Gauge 2: Performance */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-purple-500 drop-shadow-[0_0_4px_#a855f7]" strokeWidth="2.5" strokeDasharray="92, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="absolute text-[10px] font-black font-mono text-purple-400">92%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-wider">Performance<br/><span className="text-[7.5px] text-slate-600">(Tezlik Unumi)</span></span>
                    </div>

                    {/* Gauge 3: Quality */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-emerald-500 drop-shadow-[0_0_4px_#10b981]" strokeWidth="2.5" strokeDasharray="98, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="absolute text-[10px] font-black font-mono text-emerald-400">98%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase text-center tracking-wider">Quality Rate<br/><span className="text-[7.5px] text-slate-600">(Toza Mahsulot)</span></span>
                    </div>

                  </CardContent>
                </Card>

                {/* Quadrant 4: Operator Efficiency & Station Throughput */}
                <Card className="bg-slate-900/40 border-slate-855 shadow-2xl flex flex-col">
                  <CardHeader className="pb-3 border-b border-slate-855">
                    <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Percent className="w-4 h-4 text-purple-500" /> Q4: Operator Efficiency & Stations
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      Real-time productivity rates across assembly sub-cells
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2.5 min-h-[200px] flex flex-col justify-center">
                    
                    {[
                      { slot: 'Slot M-1 (Switch Assembly)', rate: 94, color: 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]' },
                      { slot: 'Slot M-2 (Clip Fitting)', rate: 87, color: 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.4)]' },
                      { slot: 'Slot M-3 (Rocker Mounting)', rate: 91, color: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]' },
                      { slot: 'Slot M-4 (Cover Snap)', rate: 78, color: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' },
                      { slot: 'Slot M-5 (Fastener Torque)', rate: 95, color: 'bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.4)]' }
                    ].map((station, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{station.slot}</span>
                          <span className="font-mono text-white">{station.rate}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-850">
                          <div className={`h-full ${station.color} rounded-full transition-all`} style={{ width: `${station.rate}%` }} />
                        </div>
                      </div>
                    ))}

                  </CardContent>
                </Card>

              </div>

              {/* Slick & Floating bottom-shelf QC event log ticker interceptor */}
              <Card className="bg-slate-900/50 border-slate-850 shadow-2xl overflow-hidden w-full relative">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-rose-500" />
                <CardHeader className="py-2.5 px-4 border-b border-slate-850 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                      📡 COMPACT AUTOMATED QC LIVE EVENT INTERCEPTOR
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">
                    Status: Monitoring QC Stream
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-850/80 overflow-x-auto custom-scrollbar">
                    {defectLogs.slice(0, 4).map((log) => {
                      const isCritical = log.severity === 'critical';
                      const isMajor = log.severity === 'major';
                      const badgeColor = isCritical 
                        ? 'bg-rose-950/40 border-rose-500/20 text-rose-400 shadow-[0_0_6px_rgba(239,68,68,0.15)]'
                        : isMajor
                        ? 'bg-amber-950/40 border-amber-500/20 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.15)]'
                        : 'bg-blue-950/40 border-blue-500/20 text-blue-400';

                      return (
                        <div key={log.id} className="flex-1 min-w-[240px] p-3 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-200 tracking-tight flex items-center gap-1.5">
                              <span className="text-purple-400 font-mono font-black">{log.partCode}</span>
                              <span className="text-slate-500 text-[10px] font-normal">({log.defectType})</span>
                            </div>
                            <div className="text-[8px] text-slate-500 font-bold font-mono">
                              {log.timestamp} • Inspector: {log.inspector}
                            </div>
                          </div>
                          <Badge className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-md ${badgeColor}`}>
                            {log.severity}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* WINDOW 3: LOGISTICS & MATERIALS */}
          {activeHubView === 'logistics' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
              
              {/* Dual-Stock balances */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Inbound Raw Workstation Inventory</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { code: 'PLA-FRM-01', name: 'Plastic Base Frames', onhand: 1450, limit: 500, state: 'OPTIMAL' },
                      { code: 'COP-PIN-02', name: 'Contact Copper Pins', onhand: 8200, limit: 2000, state: 'OPTIMAL' },
                      { code: 'RCK-PLT-03', name: 'Switch Rocker Plates', onhand: 220, limit: 300, state: 'STOCK_LOW' },
                      { code: 'SNAP-FAST-09', name: 'Wiring Snap Fasteners', onhand: 450, limit: 250, state: 'OPTIMAL' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-all font-bold">
                        <div className="flex items-center gap-3">
                          <Layers className="w-5 h-5 text-purple-400" />
                          <div>
                            <span className="text-sm font-semibold text-slate-200 block">{item.name}</span>
                            <span className="text-slate-500 font-mono text-xs">{item.code}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`block font-black font-mono text-base ${item.state === 'STOCK_LOW' ? 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]'}`}>{item.onhand} units</span>
                          <Badge className={`text-[8px] h-4 mt-1 px-2 ${item.state === 'STOCK_LOW' ? 'bg-amber-950/30 text-amber-500' : 'bg-emerald-950/30 text-emerald-400'}`}>{item.state}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Tayyor Mahsulotlar Ombori Stock Sync</span>
                  <Card className="bg-slate-900/30 border-slate-850 overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm font-semibold">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                          <th className="p-3">Part SKU</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3 text-right">Central Available Stock</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 text-slate-300 text-sm">
                        {CONFIGURABLE_PARTS.slice(0, 4).map(part => {
                          const fact = partOutputs[part.id] || 0;
                          return (
                            <tr key={part.id}>
                              <td className="py-3 px-3 text-purple-400 font-mono">{part.id}</td>
                              <td className="py-3 px-3">{part.name}</td>
                              <td className="py-3 px-3 text-right font-mono">{1200 + fact * 5} units</td>
                              <td className="py-3 px-3 text-center"><Badge className="bg-emerald-950/20 text-emerald-400 text-[8px] px-2 py-0.5">SYNCED</Badge></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>
                </div>
              </div>

              {/* Teleshka Cart buffer */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Finished Goods Staging Buffer (Teleshka)</span>
                <Card className="bg-slate-900/40 border-slate-800 flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase">Staging cart buffer slots (Max 6)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {teleshkaSlots.map((slot, index) => (
                        <div 
                          key={index} 
                          className={`rounded-lg border p-2.5 flex flex-col justify-between min-h-[80px] relative ${
                            slot ? 'bg-purple-950/15 border-purple-500/40 text-purple-200' : 'bg-slate-950/40 border-slate-850 border-dashed text-slate-700'
                          }`}
                        >
                          <span className="absolute top-1.5 right-1.5 text-[7px] font-mono text-slate-600">S0{index + 1}</span>
                          {slot ? (
                            <>
                              <div className="text-[9px] font-bold pt-1 leading-tight">
                                <span className="text-white block truncate uppercase text-xs">{slot.partCode}</span>
                                <span className="text-slate-500 block">Qty: {slot.quantity}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const newSlots = [...teleshkaSlots];
                                  newSlots[index] = null;
                                  setTeleshkaSlots(newSlots);
                                  setHubLogs(prev => [`LOGISTICS: Removed Box ${slot.id} from Slot ${index + 1}`, ...prev].slice(0, 8));
                                  toast.info(`Slot ${index + 1} bo'shatildi.`);
                                }}
                                className="text-[8px] font-bold text-rose-500 hover:underline leading-none text-left"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-[9px] uppercase font-bold text-slate-850">Empty</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleTeleshkaCommit}
                      className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg border border-emerald-500/20 active:scale-[0.98]"
                    >
                      📦 TAYYOR MAHSULOT OMBORIGA JO'NATISH (COMMIT)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* WINDOW 4: ANDON DIAGNOSTIC TERMINAL */}
          {activeHubView === 'andon' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {activeMaintenanceTicket && (
                <div className="bg-rose-950/20 border-2 border-rose-500/20 rounded-2xl p-6 text-center animate-pulse relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                  <div className="flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">🔴 CRITICAL DOWNTIME ALERT ACTIVE</h3>
                    <p className="text-[8px] font-black text-slate-500 uppercase mt-0.5">SLA Countdown Active</p>
                    <div className="bg-slate-950 px-6 py-2 rounded-xl border border-slate-850 mt-3 inline-block">
                      <span className="text-[7px] text-slate-500 block uppercase font-bold mb-0.5">DOWNTIME COUNTER</span>
                      <span className="text-2xl font-black font-mono text-rose-500 tabular-nums">{formatDowntimeElapsed(downtimeStartTime || '')}</span>
                    </div>
                    <div className="mt-4 flex gap-4 text-[8px] font-bold text-slate-400 text-left bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                      <div><span className="text-slate-500 block text-[6px] uppercase">Node Target</span><span>{activeMaintenanceTicket.equipmentCode}</span></div>
                      <div className="border-l border-slate-800 pl-4"><span className="text-slate-500 block text-[6px] uppercase">Issue Type</span><span>{activeMaintenanceTicket.issue_type}</span></div>
                      <div className="border-l border-slate-800 pl-4"><span className="text-slate-500 block text-[6px] uppercase">Ticket ID</span><span>{activeMaintenanceTicket.id}</span></div>
                    </div>
                    <button
                      onClick={handleResolveAndon}
                      className="mt-5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 border border-emerald-500/20"
                    >
                      ✅ RESOLVE ANDON / RESUME PRODUCTION
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Diagnostics Form */}
                <div className="lg:col-span-7">
                  <Card className="bg-slate-900/30 border-slate-800">
                    <CardHeader className="pb-3 border-b border-slate-850">
                      <CardTitle className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-500" /> Andon Diagnostic Dispatch Form
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase block pl-1">1. Issue Category</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['MECHANICAL ISSUE', 'ELECTRICAL ISSUE', 'SOFTWARE/PLC FAULT', 'QUALITY CRASH'].map(label => (
                            <button
                              key={label}
                              type="button"
                              disabled={!!activeMaintenanceTicket}
                              onClick={() => setAndonIssueType(label)}
                              className={`py-4 px-3 rounded-xl border-2 text-sm font-bold tracking-wide text-center transition-all ${
                                andonIssueType === label 
                                  ? 'border-rose-500 bg-rose-600/20 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                                  : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-700'
                              } ${activeMaintenanceTicket ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              {label.replace(' ISSUE', '').replace(' FAULT', '').replace(' CRASH', '')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase block pl-1">2. Target Node</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['TPA-Robot-06', 'Konveyer Lenta M-1', 'Chop Etish Printeri', 'Yig\'ish Dastgohi M-5'].map(node => (
                            <button
                              key={node}
                              type="button"
                              disabled={!!activeMaintenanceTicket}
                              onClick={() => setAndonEquipment(node)}
                              className={`py-4 px-2 rounded-xl border-2 text-sm font-bold tracking-wide transition-all ${
                                andonEquipment === node ? 'bg-purple-600/25 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]' : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:border-slate-700'
                              } ${activeMaintenanceTicket ? 'opacity-40' : ''}`}
                            >
                              {node}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase block pl-1">3. Diagnostics Description</label>
                        <textarea
                          disabled={!!activeMaintenanceTicket}
                          value={andonDescription}
                          onChange={(e) => setAndonDescription(e.target.value)}
                          placeholder="Type details (e.g. Mold jam, temperature error)..."
                          className="w-full p-4 h-24 bg-slate-950 border-2 border-slate-850 rounded-xl text-sm font-medium text-slate-200 outline-none focus:border-rose-500 transition-colors"
                        />
                      </div>

                      <Button
                        disabled={!andonIssueType || !!activeMaintenanceTicket}
                        onClick={async () => {
                          if (!andonIssueType) return;
                          const label = andonIssueType;
                          
                          try {
                            const report = await maintenanceApi.createFailureReport({
                              line_id: '6',
                              line_name: 'Assembly Line M',
                              description: `ANDON: ${label} on ${andonEquipment} (${andonDescription})`,
                              reported_by: 'Line M Operator',
                              priority: 'high',
                              issue_type: label,
                              machine_id: andonEquipment
                            });
                            setActiveMaintenanceTicket({
                              ...report,
                              issue_type: label,
                              equipmentCode: andonEquipment
                            });
                            setDowntimeStartTime(report.created_at || new Date().toISOString());
                          } catch (err) {
                            const localTicket = {
                              id: `ANDON-${Math.floor(1000 + Math.random() * 9000)}`,
                              issue_type: label,
                              equipmentCode: andonEquipment,
                              created_at: new Date().toISOString(),
                              status: 'open',
                              priority: 'high'
                            };
                            setActiveMaintenanceTicket(localTicket);
                            setDowntimeStartTime(localTicket.created_at);
                          }

                          setHubLogs(prev => [
                            `ALERT [Andon]: Maintenance dispatch triggered for Slot ID-6. Response SLA countdown active.`,
                            `ANDON: Dispatching diagnostic ticket for ${andonEquipment}.`,
                            ...prev
                          ].slice(0, 8));

                          toast.error(`Andon Alert Triggered: ${label}`);
                        }}
                        className={`w-full py-5 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                          andonIssueType && !activeMaintenanceTicket ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98]' : 'bg-slate-950 border-slate-850 text-slate-600'
                        }`}
                      >
                        🚨 SEND MAINTENANCE HELP / ANDON ALERT
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right History Column */}
                <div className="lg:col-span-5">
                  <Card className="bg-slate-900/30 border-slate-800">
                    <CardHeader className="pb-2 border-b border-slate-850">
                      <CardTitle className="text-xs font-black text-purple-400 uppercase tracking-widest">SLA Resolutions History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-slate-850 max-h-[220px] overflow-y-auto custom-scrollbar">
                        {resolvedTickets.map((t, i) => (
                          <div key={i} className="p-2.5 flex flex-col gap-0.5 text-[8px] font-bold">
                            <div className="flex justify-between items-center">
                              <span className="text-rose-400 font-mono">{t.id}</span>
                              <Badge className="bg-emerald-950/20 text-emerald-400 text-[6px] h-3.5 uppercase">CLOSED</Badge>
                            </div>
                            <span className="text-slate-300 block">{t.issue_type} - {t.equipmentCode}</span>
                            <div className="flex justify-between text-[7px] text-slate-500 mt-0.5">
                              <span>Open: {t.created_at} • Close: {t.resolved_at}</span>
                              <span className="text-purple-400 uppercase">SLA: {t.duration}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Selector Overlay */}
        {showPartSearchModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl p-6 max-w-2xl w-full flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-in zoom-in-95 duration-200 max-h-[90vh]">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
                <h3 className="text-lg font-black text-white tracking-widest uppercase">
                  <span className="text-purple-500">[</span> DETAL QIDIRISH VA TANLASH PORTALI <span className="text-purple-500">]</span>
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowPartSearchModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-xs uppercase"
                >
                  ✕ YOPISH
                </button>
              </div>

              {/* High-Contrast Part ID Search Input Field */}
              <div className="mb-4">
                <input
                  autoFocus
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (filteredModalParts.length > 0) {
                        const topPart = filteredModalParts[0];
                        setSelectedRecipe(topPart.id);
                        setTaraTargetLimit(topPart.defaultMultiplier);
                        setShowPartSearchModal(false);
                        setHubLogs(prev => [`SYSTEM: Selected ${topPart.id} from portal.`, ...prev].slice(0, 8));
                        toast.success(`Selected recipe ${topPart.id} loaded into Cockpit.`);
                      }
                    }
                  }}
                  placeholder="Detal ID kodini kiriting (e.g., SW-001, DT-002)..."
                  className="w-full bg-slate-950 border-2 border-purple-500/50 focus:border-purple-400 rounded-xl p-4 text-white text-base font-bold placeholder:text-slate-700 outline-none transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                />
              </div>

              {/* Filtering list */}
              <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px] custom-scrollbar border border-slate-850 rounded-xl bg-slate-950/40">
                {filteredModalParts.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-950 sticky top-0 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-800">
                        <th className="p-3">Part ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Multiplier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {filteredModalParts.map((part) => {
                        const isCurrent = selectedRecipe === part.id;
                        return (
                          <tr
                            key={part.id}
                            onClick={() => {
                              setSelectedRecipe(part.id);
                              setTaraTargetLimit(part.defaultMultiplier);
                              setShowPartSearchModal(false);
                              setHubLogs(prev => [`SYSTEM: Selected ${part.id} from portal.`, ...prev].slice(0, 8));
                              toast.success(`Selected recipe ${part.id} loaded into Cockpit.`);
                            }}
                            className={`hover:bg-purple-950/20 border-l-2 transition-all cursor-pointer ${
                              isCurrent 
                                ? 'bg-purple-950/15 border-purple-500 text-purple-300' 
                                : 'border-transparent text-slate-300 hover:border-purple-500/50'
                            }`}
                          >
                            <td className="p-3 font-mono text-purple-400 font-bold">{part.id}</td>
                            <td className="p-3">{part.name}</td>
                            <td className="p-3 text-slate-500">{part.category}</td>
                            <td className="p-3 text-right text-slate-400 font-mono">x{part.defaultMultiplier}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-slate-600 text-xs">
                    <Search className="w-8 h-8 mb-2 opacity-50" />
                    <span>MOS DETALLAR TOPILMADI</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Jami: {filteredModalParts.length} / {CONFIGURABLE_PARTS.length} detal</span>
                <button 
                  type="button"
                  onClick={() => setShowPartSearchModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-950 min-h-full">
      {/* Page header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            {t('production.title')}
          </h2>
          <p className="text-muted-foreground mt-1 font-medium">{t('production.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowLegacy(!showLegacy)}
            className="border-slate-300 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl px-4 h-11 transition-all"
          >
            {showLegacy ? 'Hide Legacy Workshops' : 'Show Legacy Workshops'}
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-11 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t('production.addLine')}
          </Button>
        </div>
      </div>

      {/* Lines grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productionLines
          .filter(line => showLegacy || line.type === 'assembly' || line.id === '5A' || line.id === '5B')
          .map(line => {
            const todayPlan = getTodayLinePlan(line.id);
            const activeShift = todayPlan?.shift || 'No active plan';
            const onTrack = line.efficiency >= 85;

            // Mock SAP Progress data
            const targetOutput = line.id === '5A' ? 2000 : line.id === '5B' ? 15000 : 1000;
            const progressPercent = Math.min(100, Math.round((line.output / targetOutput) * 100)) || 0;

            return (
              <Card
                key={line.id}
                onClick={() => navigate(`/production-lines/${line.id}`)}
                className="bg-white dark:bg-gray-900 border-border hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden flex flex-col"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {getLineIcon(line.type, line.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <CardTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {line.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-muted text-[9px] uppercase tracking-wider font-bold h-5">
                            {line.id === '5A' ? 'LARGE COMPONENT MOLDING' : line.id === '5B' ? 'MINOR & MID-SCALE PARTS' : getLineTypeLabel(line.type)}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground font-bold">ID-{line.id}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(line.status)}
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 flex-1 space-y-6">
                  {/* Active Plan Info */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50 bg-muted/30 px-3 rounded-xl">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Target className="w-3 h-3" /> Target
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{targetOutput} Pcs</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 justify-end">
                        <Percent className="w-3 h-3" /> Efficiency
                      </span>
                      <span className={`text-sm font-bold ${onTrack ? 'text-emerald-500' : 'text-amber-500'}`}>{line.efficiency}%</span>
                    </div>
                  </div>

                  {/* Main Progress (Plan vs Fact) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Production Volume</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{line.output}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">/ {targetOutput}</span>
                      </div>
                    </div>
                    <div className="relative h-3 w-full bg-muted dark:bg-gray-800 rounded-full overflow-hidden border border-border/50">
                      <div
                        className={`h-full transition-all duration-1000 rounded-full ${onTrack ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Specialized Module Views */}
                  {line.type === 'sap_inpanel' && line.sapData && (
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Monitor className="w-3 h-3" /> SAP Multi-Bin System
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                          {line.sapData.completedBins} / {line.sapData.completedBins + (line.sapData.bins?.length || 0)} Bins
                        </span>
                      </div>
                      <Progress value={(line.sapData.completedBins / (line.sapData.completedBins + (line.sapData.bins?.length || 1))) * 100} className="h-1 bg-indigo-200/50 dark:bg-indigo-900/30" />
                    </div>
                  )}

                  {line.type === 'tpa_molding' && line.tpaData && (
                    <div className="space-y-4 w-full">
                      <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/50 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs font-bold text-purple-700 dark:text-purple-300">
                          <span className="flex items-center gap-1">
                            <Construction className="w-3.5 h-3.5 text-purple-500" />
                            {line.id === '5A' ? '10 Active Heavy TPA Machines' : line.id === '5B' ? '25+ Active Minor TPA Machines' : 'Active Molding Machines'}
                          </span>
                          <span>Scrap: {line.tpaData.scrapRate}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {(line.id === '5A' 
                            ? ['Door Trim Components', 'Inpanel Assemblies']
                            : line.id === '5B'
                            ? ['B-Pillar Liners', 'Switch Frames', 'Minor Brackets']
                            : ['Molded Parts']
                          ).map((tag, idx) => (
                            <Badge 
                              key={idx} 
                              variant="outline" 
                              className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Section */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${onTrack ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                        <span className={`text-xs font-bold uppercase tracking-wide ${onTrack ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {onTrack ? 'Healthy' : 'Action Required'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(line.status)}
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        {/* Assembly Line M (Melkiy Parts) Card */}
        <Card
          onClick={() => setIsDrilledDown(true)}
          className="bg-white dark:bg-gray-900 border-border hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden flex flex-col relative"
        >
          {isTpaBufferLow && (
            <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse border border-rose-500 flex items-center gap-1">
              <span>⚠️</span> TPA BUFFER LOW
            </div>
          )}

          <CardHeader className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {getLineIcon('assembly', activeMaintenanceTicket ? 'maintenance' : 'active')}
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <CardTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                      Assembly Line M
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-muted text-[9px] uppercase tracking-wider font-bold h-5">
                      MICRO-ASSEMBLY
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground font-bold">ID-6</span>
                  </div>
                </div>
              </div>
              {getStatusIcon(activeMaintenanceTicket ? 'maintenance' : 'active')}
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-0 flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50 bg-muted/30 px-3 rounded-xl">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Target className="w-3 h-3" /> Target
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">5000 Pcs</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 justify-end">
                  <Percent className="w-3 h-3" /> Efficiency
                </span>
                <span className="text-sm font-bold text-emerald-500">91%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Production Volume</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{lineMOutput}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">/ 5000</span>
                </div>
              </div>
              <div className="relative h-3 w-full bg-muted dark:bg-gray-800 rounded-full overflow-hidden border border-border/50">
                <div
                  className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  style={{ width: `${Math.min(100, Math.round((lineMOutput / 5000) * 100))}%` }}
                />
              </div>
            </div>

            {/* Footer Section */}
            <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${activeMaintenanceTicket ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${activeMaintenanceTicket ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {activeMaintenanceTicket ? 'Downtime' : 'Healthy'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(activeMaintenanceTicket ? 'maintenance' : 'active')}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDrilledDown(true);
                  }}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:bg-purple-600 group-hover:text-white transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showAddModal && (
        <AddLineModal
          onClose={() => setShowAddModal(false)}
          onAdd={(line) => {
            addProductionLine(line);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface AddLineModalProps {
  onClose: () => void;
  onAdd: (line: any) => void;
}

function AddLineModal({ onClose, onAdd }: AddLineModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState<'assembly' | 'sap_inpanel' | 'tpa_molding'>('assembly');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      type,
      status: 'idle',
      efficiency: 0,
      requiredMaterials: [],
      output: 0,
      ...(type === 'sap_inpanel' ? { sapData: { currentBinCount: 0, binTarget: 100, completedBins: 0, bins: [] } } : {}),
      ...(type === 'tpa_molding' ? { tpaData: { machines: [], scrapRate: 0 } } : {})
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full border-border shadow-2xl shadow-black/20 animate-in zoom-in-95">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('production.addLineTitle')}</CardTitle>
          <CardDescription>Configure a new production line unit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t('production.lineName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 h-11 border border-border bg-background rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder={t('production.placeholderExample')}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  System Architecture
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'assembly', label: 'Assembly', icon: <Wrench className="w-5 h-5" /> },
                    { id: 'sap_inpanel', label: 'SAP I/O', icon: <Monitor className="w-5 h-5" /> },
                    { id: 'tpa_molding', label: 'Molding', icon: <Construction className="w-5 h-5" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id as any)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${type === t.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:border-muted-foreground/30'
                        }`}
                    >
                      {t.icon}
                      <span className="text-[9px] font-black uppercase tracking-tighter">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border-border hover:bg-muted font-bold uppercase text-[10px] tracking-widest transition-all"
              >
                {t('production.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                {t('production.addLine')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
