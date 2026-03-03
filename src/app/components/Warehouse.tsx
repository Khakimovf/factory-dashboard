import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Package, AlertTriangle, CheckCircle, Search, ArrowRight, Layers, Box, AlertCircle, Info, Check, Image as ImageIcon, TrendingDown, MapPin, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { KitIssuanceModal, PickListItem } from './KitIssuanceModal';

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
  min_stock: number;
  usage_per_shift: number;
  bom?: BOMItem[];
}

interface MockRequest {
  id: string;
  planId: string;
  status: 'Pending' | 'Issuing' | 'ON LINE' | 'Completed';
  time: string;
  items: PickListItem[];
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
  { id: 'RM-001', name: 'Polypropylene Granules', category: 'Raw Materials', binLocation: 'Silo-01', current_stock: 15000, reserved_stock: 3500, min_stock: 5000, usage_per_shift: 1200 },
  { id: 'RM-002', name: 'Masterbatch Black', category: 'Raw Materials', binLocation: 'Rack-03', current_stock: 800, reserved_stock: 750, min_stock: 200, usage_per_shift: 50 },
  { id: 'COMP-001', name: 'Metal Clips Type A', category: 'Components', binLocation: 'A-101', current_stock: 50000, reserved_stock: 12000, min_stock: 10000, usage_per_shift: 4000 },
  { id: 'COMP-002', name: 'Rubber Seals', category: 'Components', binLocation: 'A-102', current_stock: 200, reserved_stock: 200, min_stock: 5000, usage_per_shift: 1000 },
  { id: 'COMP-003', name: 'UzAuto Logo Badges', category: 'Components', binLocation: 'A-103', current_stock: 8500, reserved_stock: 2000, min_stock: 1000, usage_per_shift: 500 },
  { id: 'COMP-005', name: '10mm Washers', category: 'Components', binLocation: 'B-201', current_stock: 15000, reserved_stock: 2000, min_stock: 1000, usage_per_shift: 1300 },
  { id: 'COMP-006', name: 'M4 Torx Screws', category: 'Components', binLocation: 'B-202', current_stock: 125000, reserved_stock: 4000, min_stock: 5000, usage_per_shift: 10000 },
  { id: 'COMP-007', name: 'Adhesive Tape Roll', category: 'Components', binLocation: 'C-301', current_stock: 800, reserved_stock: 100, min_stock: 500, usage_per_shift: 150 },
  { id: 'COMP-008', name: 'Plastic Bezels', category: 'Components', binLocation: 'C-302', current_stock: 2000, reserved_stock: 500, min_stock: 500, usage_per_shift: 450 },
  { id: 'COMP-009', name: 'Sound Absorber Foam', category: 'Components', binLocation: 'D-401', current_stock: 150, reserved_stock: 50, min_stock: 100, usage_per_shift: 25 },
  {
    id: 'FG-001',
    name: 'Door Trim Front Left',
    category: 'Finished Goods',
    binLocation: 'Z-001',
    current_stock: 450,
    reserved_stock: 0,
    min_stock: 100,
    usage_per_shift: 0,
    bom: [
      { materialId: 'RM-001', materialName: 'Polypropylene Granules', qty: 1.2 },
      { materialId: 'COMP-001', materialName: 'Metal Clips Type A', qty: 6 },
    ]
  },
];

const initialRequests: MockRequest[] = [
  { id: 'REQ-0192', planId: 'PLAN-A1 (Door Trims)', status: 'Pending', time: '10:45 AM', items: denseMockKitA1 },
  { id: 'REQ-0193', planId: 'PLAN-B2 (Dashboards)', status: 'Pending', time: '11:20 AM', items: denseMockKitA1.slice(0, 5) },
  { id: 'REQ-0188', planId: 'PLAN-A1 (Door Trims)', status: 'ON LINE', time: '08:00 AM', items: denseMockKitA1.slice(5, 12) },
];

export function Warehouse() {
  const [materials, setMaterials] = useState<MockMaterial[]>(initialMaterials);
  const [requests, setRequests] = useState<MockRequest[]>(initialRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('All');
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());

  // Picklist Modal State
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<MockRequest | null>(null);

  // Form State
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);

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
    // Inject real-time current stocks into the request items so modal can calculate shortages
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
    setRequests(prev => prev.map(r =>
      r.id === activeRequest.id ? { ...r, status: 'ON LINE' } as MockRequest : r
    ));

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
    return materials.map(m => {
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
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'All' || m.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [materials, searchTerm, activeCategory]);

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

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background text-foreground">

      {/* HEADER */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" />
            Supply & Production Dashboard
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm lg:text-base max-w-2xl">
            SAP-style high density material view and predictive routing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden sm:flex">Export CSV</Button>
          <Button onClick={() => setIsAddMaterialOpen(true)}>+ Add Material</Button>
        </div>
      </div>

      {/* SAP-STYLE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-6">
        <HealthCard title="Sufficient Coverage" value={stats.ready} icon={<CheckCircle className="w-4 h-4" />} color="green" description="> 3 Shifts buffer" />
        <HealthCard title="Predictive Risk" value={stats.warning} icon={<TrendingDown className="w-4 h-4" />} color="yellow" description="< 3 Shifts remaining" />
        <HealthCard title="Line Blocked" value={stats.critical} icon={<AlertCircle className="w-4 h-4" />} color="red" description="0 Stock or < 1 Shift" />
        <HealthCard title="Volume Booked" value={stats.reservedTotal.toLocaleString()} icon={<Layers className="w-4 h-4" />} color="blue" description="Reserved (pcs) for Plans" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* DATA GRID (Span 3/4) */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="bg-card border-border border rounded-lg shadow-sm p-3 flex flex-col sm:flex-row gap-3 justify-between items-center bg-muted/10">
            <div className="flex gap-1 p-1 bg-muted/50 rounded border border-border/30 w-full sm:w-auto overflow-x-auto">
              {(['All', 'Raw Materials', 'Components', 'Finished Goods'] as MaterialCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${activeCategory === cat ? 'bg-background shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-background/20 border border-transparent'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedMaterials.size > 0 && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1.5 rounded border border-primary/20 animate-in fade-in zoom-in">
                  {selectedMaterials.size} records selected
                </span>
              )}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search Part Number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border-border rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-semibold tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left w-10 border-r border-border/30">
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        checked={selectedMaterials.size === DisplayMaterials.length && DisplayMaterials.length > 0}
                        onChange={() => toggleSelectAll(DisplayMaterials.map(m => m.id))}
                      />
                    </th>
                    <th className="px-3 py-2 text-left border-r border-border/30">Part Name</th>
                    <th className="px-3 py-2 text-left border-r border-border/30">Location</th>
                    <th className="px-3 py-2 text-right border-r border-border/30">Current</th>
                    <th className="px-3 py-2 text-right border-r border-border/30 text-orange-500/90 dark:text-orange-400">Reserved</th>
                    <th className="px-3 py-2 text-right border-r border-border/30 text-primary font-bold">Avail</th>
                    <th className="px-3 py-2 text-center border-r border-border/30">Stock Cover</th>
                    <th className="px-3 py-2 text-left">Predictive Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {DisplayMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                        No records match current filters.
                      </td>
                    </tr>
                  ) : (
                    DisplayMaterials.map(m => (
                      <tr
                        key={m.id}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedMaterials.has(m.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleSelectMaterial(m.id)}
                      >
                        <td className="px-3 py-2 border-r border-border/30 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                            checked={selectedMaterials.has(m.id)}
                            onChange={(e) => toggleSelectMaterial(m.id, e as any)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-border/30">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded bg-muted/60 border border-border/50 flex flex-shrink-0 items-center justify-center">
                              {m.category === 'Finished Goods' ? <Package className="w-3 h-3 text-primary opacity-80" /> : <ImageIcon className="w-3 h-3 text-muted-foreground opacity-50" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                {m.name}
                                {m.bom && (
                                  <div className="group relative flex items-center justify-center">
                                    <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                                    <div className="absolute left-full ml-1 top-1/2 -translate-y-1/2 w-56 bg-popover text-popover-foreground border border-border shadow-xl rounded p-2.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                      <p className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border pb-1 mb-1.5">BOM Formula (1 unit)</p>
                                      <ul className="space-y-1">
                                        {m.bom.map((b, i) => (
                                          <li key={i} className="flex justify-between items-center text-[11px]">
                                            <span className="truncate pr-2">{b.materialName}</span>
                                            <span className="font-semibold">{b.qty} <span className="opacity-70 font-normal">pcs</span></span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{m.id} | {m.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 border-r border-border/30">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 text-[10px] uppercase font-bold text-muted-foreground font-mono truncate max-w-[90px]">
                            <MapPin className="w-3 h-3" /> {m.binLocation}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right border-r border-border/30 font-medium">
                          {m.current_stock.toLocaleString()} <span className="text-[9px] opacity-70">pcs</span>
                        </td>
                        <td className="px-3 py-2 text-right border-r border-border/30 font-semibold text-orange-500/90 dark:text-orange-400">
                          {m.reserved_stock.toLocaleString()} <span className="text-[9px] opacity-70">pcs</span>
                        </td>
                        <td className="px-3 py-2 text-right border-r border-border/30 font-bold text-foreground bg-muted/10">
                          {m.available.toLocaleString()} <span className="text-[9px] font-normal opacity-70">pcs</span>
                        </td>
                        <td className="px-3 py-2 text-center border-r border-border/30 font-medium text-muted-foreground">
                          {m.category === 'Finished Goods' ? '-' : `${m.shiftsRemaining} Shifts`}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${m.predictiveHealth === 'Ready' ? 'text-green-500' :
                              m.predictiveHealth === 'Warning' ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                            {m.predictiveHealth === 'Ready' && <CheckCircle className="w-3 h-3" />}
                            {m.predictiveHealth === 'Warning' && <AlertTriangle className="w-3 h-3" />}
                            {m.predictiveHealth === 'Critical' && <AlertCircle className="w-3 h-3" />}
                            <span className="truncate max-w-[140px]" title={m.alertMessage}>{m.alertMessage}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LIVE ZAYAVKA (Side Panel) */}
        <div className="xl:col-span-1">
          <div className="bg-card border-border rounded-lg shadow-sm border flex flex-col overflow-hidden sticky top-6 h-[500px] lg:h-[calc(100vh-140px)]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Zayavka Queue
              </h3>
              <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted border border-border/50 px-2 py-0.5 rounded">{requests.filter(r => r.status === 'Pending').length} Pending</span>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-muted/5">
              {requests.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No queue assigned.</p>
              )}
              {requests.map(req => {
                const isIssuedToLine = req.status === 'ON LINE';

                return (
                  <div key={req.id} className={`border rounded p-3 transition-colors relative overflow-hidden ${isIssuedToLine ? 'bg-green-500/5 border-green-500/20' : 'bg-background border-border shadow-sm hover:border-primary/40'}`}>
                    {/* Left accent bar for status */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isIssuedToLine ? 'bg-green-500' : 'bg-blue-500'}`} />

                    <div className="flex justify-between items-start mb-1.5 pl-1.5">
                      <span className={`text-[10px] font-bold tracking-widest ${isIssuedToLine ? 'text-green-600 dark:text-green-500' : 'text-blue-500'}`}>{req.id}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{req.time}</span>
                    </div>

                    <p className={`font-bold text-sm mb-2 pl-1.5 ${isIssuedToLine ? 'text-foreground' : 'text-foreground'}`}>{req.planId}</p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1.5 mb-3 font-mono">
                      <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
                      <span>{req.items.length} COMPONENT SKUs</span>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex justify-between items-center pl-1.5 mt-auto">
                      <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${isIssuedToLine ? 'text-green-500' : 'text-blue-600 dark:text-blue-400'
                        }`}>
                        {isIssuedToLine && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                        {req.status}
                      </span>

                      <Button
                        size="sm"
                        variant={isIssuedToLine ? "outline" : "default"}
                        className={`h-7 px-3 text-xs font-semibold uppercase tracking-wide ${!isIssuedToLine && 'shadow-sm'}`}
                        onClick={() => handleOpenKit(req)}
                        disabled={isIssuedToLine}
                      >
                        {isIssuedToLine ? 'View Log' : (<>Review Kit <ArrowRight className="w-3 h-3 ml-1.5" /></>)}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

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

      {/* Add Material Dialog Mock */}
      <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Add Material Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="materialId" className="text-xs font-semibold">Part Number (SKU)</Label>
              <Input id="materialId" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Part Description</Label>
              <Input id="title" className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsAddMaterialOpen(false)}>Save</Button>
          </DialogFooter>
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
          {React.cloneElement(icon as React.ReactElement, { className: `w-3.5 h-3.5 ${colorMap[color].split(' ')[1]}` })}
        </div>
      </div>
      <div className="mt-auto pt-2">
        <span className="text-2xl font-black text-foreground tracking-tight">{value}</span>
        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}
