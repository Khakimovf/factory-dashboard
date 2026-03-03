import os
import re

warehouse_path = r"c:\Users\Khakimovf\factory-dashboard\factory-dashboard\src\app\components\Warehouse.tsx"
with open(warehouse_path, "r", encoding="utf-8") as f:
    warehouse_content = f.read()

kit_path = r"c:\Users\Khakimovf\factory-dashboard\factory-dashboard\src\app\components\KitIssuanceModal.tsx"
with open(kit_path, "r", encoding="utf-8") as f:
    kit_content = f.read()

# --- 1. Update KitIssuanceModal.tsx ---
# Need to import useMemo
kit_content = kit_content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect, useMemo } from 'react';"
)

# Replace the data grid rendering to sort by binLocation
old_tbody_start = """                        <tbody className="divide-y divide-border/50">
                            {items.map((item) => {"""
new_tbody_start = """                        <tbody className="divide-y divide-border/50">
                            {useMemo(() => [...items].sort((a, b) => a.binLocation.localeCompare(b.binLocation)), [items]).map((item) => {"""
kit_content = kit_content.replace(old_tbody_start, new_tbody_start)

# Add visual pick path indication to header
old_desc = """                        <DialogDescription className="mt-1 text-xs">
                            Verify required material manifest for Production Plan: <strong className="text-foreground tracking-widest bg-foreground/5 px-1.5 py-0.5 rounded border border-border/50 ml-1">{planId}</strong>
                        </DialogDescription>"""
new_desc = """                        <DialogDescription className="mt-1 text-xs flex items-center">
                            Verify required material manifest for Production Plan: <strong className="text-foreground tracking-widest bg-foreground/5 px-1.5 py-0.5 rounded border border-border/50 ml-1 mr-3">{planId}</strong>
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1 font-bold tracking-wider"><MapPin className="w-3 h-3" /> SORTED OPTIMAL PICK PATH</span>
                        </DialogDescription>"""
kit_content = kit_content.replace(old_desc, new_desc)

with open(kit_path, "w", encoding="utf-8") as f:
    f.write(kit_content)


# --- 2. Update Warehouse.tsx ---
# A. Add Clock import
warehouse_content = warehouse_content.replace(
    "import { Package, AlertTriangle, CheckCircle, Search, ArrowRight, Layers, Box, AlertCircle, Info, Check, Image as ImageIcon, TrendingDown, MapPin, Zap } from 'lucide-react';",
    "import { Package, AlertTriangle, CheckCircle, Search, ArrowRight, Layers, Box, AlertCircle, Info, Check, Image as ImageIcon, TrendingDown, MapPin, Zap, Clock, Undo2 } from 'lucide-react';"
)

# B. Add inspection_stock property to MockMaterial interface
warehouse_content = warehouse_content.replace(
    "  reserved_stock: number;\n  min_stock: number;",
    "  reserved_stock: number;\n  inspection_stock: number; // NEW FOR RETURNS\n  min_stock: number;"
)

# C. Update initialMaterials data to include inspection_stock: 0
import ast

def add_inspection_stock(match):
    return match.group(0).replace("reserved_stock: ", "inspection_stock: 0, reserved_stock: ")

# Regex to safely inject into all mock objects
warehouse_content = re.sub(r'\{ id: \'[A-Z0-9-]+\'[^}]+reserved_stock: \d+,', add_inspection_stock, warehouse_content)


# D. Add targetTime to MockRequest
warehouse_content = warehouse_content.replace(
    "  items: PickListItem[];\n}",
    "  items: PickListItem[];\n  targetTime: number;\n}"
)

# Update mock requests data
now_ms = "Date.now()"
old_reqs = """const initialRequests: MockRequest[] = [
  { id: 'REQ-0192', planId: 'PLAN-A1 (Door Trims)', status: 'Pending', time: '10:45 AM', items: denseMockKitA1 },
  { id: 'REQ-0193', planId: 'PLAN-B2 (Dashboards)', status: 'Pending', time: '11:20 AM', items: denseMockKitA1.slice(0, 5) },
  { id: 'REQ-0194', planId: 'PLAN-C3 (Seats)', status: 'Issuing', time: '09:30 AM', items: denseMockKitA1.slice(2, 6) },
  { id: 'REQ-0188', planId: 'PLAN-A1 (Door Trims)', status: 'ON LINE', time: '08:00 AM', items: denseMockKitA1.slice(5, 12) },
];"""
new_reqs = f"""const initialRequests: MockRequest[] = [
  {{ id: 'REQ-0192', planId: 'PLAN-A1 (Door Trims)', status: 'Pending', time: '10:45 AM', items: denseMockKitA1, targetTime: Date.now() + 15 * 60000 }},
  {{ id: 'REQ-0193', planId: 'PLAN-B2 (Dashboards)', status: 'Pending', time: '11:20 AM', items: denseMockKitA1.slice(0, 5), targetTime: Date.now() + 45 * 60000 }},
  {{ id: 'REQ-0194', planId: 'PLAN-C3 (Seats)', status: 'Issuing', time: '09:30 AM', items: denseMockKitA1.slice(2, 6), targetTime: Date.now() + 4 * 60000 }},
  {{ id: 'REQ-0188', planId: 'PLAN-A1 (Door Trims)', status: 'ON LINE', time: '08:00 AM', items: denseMockKitA1.slice(5, 12), targetTime: Date.now() - 120 * 60000 }},
];"""
warehouse_content = warehouse_content.replace(old_reqs, new_reqs)

# E. Add Timer logic to RequestCard component + return state to full component
# Let's cleanly inject the new RequestCard
old_request_card_start = warehouse_content.find('  const RequestCard = ({ req }: { req: MockRequest }) => {')
old_request_card_end = warehouse_content.find('  return (', old_request_card_start)

# First add useEffect import if not there
if "import React, { useState, useMemo" not in warehouse_content:
    warehouse_content = warehouse_content.replace(
        "import React, { useState, useMemo } from 'react';",
        "import React, { useState, useMemo, useEffect } from 'react';"
    )

new_request_card = """  const RequestCard = ({ req }: { req: MockRequest }) => {
    const isIssuedToLine = req.status === 'ON LINE' || req.status === 'Completed';
    const isPicking = req.status === 'Issuing';

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState<number>(Math.max(0, req.targetTime - Date.now()));
    const isUrgent = timeLeft < 5 * 60000; // less than 5 minutes

    useEffect(() => {
      if (isIssuedToLine) return;
      
      const interval = setInterval(() => {
        const remaining = Math.max(0, req.targetTime - Date.now());
        setTimeLeft(remaining);
      }, 1000);
      
      return () => clearInterval(interval);
    }, [req.targetTime, isIssuedToLine]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate shortages
    const shortages = req.items.filter(item => {
      const m = materials.find(x => x.id === item.partNumber);
      return m ? (m.current_stock < item.requiredQty) : true;
    });
    const hasShortage = shortages.length > 0;

    return (
      <div className={`border rounded p-3 transition-colors relative overflow-hidden ${isIssuedToLine ? 'bg-green-500/5 border-green-500/20' : isPicking ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-background border-border shadow-sm hover:border-primary/40'}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isIssuedToLine ? 'bg-green-500' : isPicking ? 'bg-indigo-500' : 'bg-blue-500'}`} />

        <div className="flex justify-between items-start mb-1.5 pl-1.5">
          <span className={`text-[10px] font-bold tracking-widest ${isIssuedToLine ? 'text-green-600 dark:text-green-500' : isPicking ? 'text-indigo-500' : 'text-blue-500'}`}>{req.id}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{req.time}</span>
        </div>

        <p className="font-bold text-sm mb-2 pl-1.5 text-foreground">{req.planId}</p>

        <div className="flex items-center justify-between pl-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span>{req.items.length} SKUs</span>
          </div>
          
          {/* TIME TO LINE TRACKING */}
          {!isIssuedToLine && (
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${isUrgent ? 'bg-red-500/10 text-red-600 border-red-500/30 animate-pulse' : 'bg-muted/50 text-muted-foreground border-border/50'}`}>
               <Clock className="w-3 h-3" />
               {timeLeft === 0 ? "LATE" : formatTime(timeLeft)} min
            </div>
          )}
        </div>

        {hasShortage && !isIssuedToLine && (
          <div className="pl-1.5 mb-3">
            <Button variant="ghost" className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/10 border border-red-500/20" onClick={() => {
              setSearchTerm(shortages[0].partNumber);
              setActiveTab('inventory');
            }}>
              <AlertTriangle className="w-3 h-3 mr-1" /> Missing Parts
            </Button>
          </div>
        )}

        <div className="pt-2 border-t border-border/40 flex justify-between items-center pl-1.5 mt-auto">
          <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${isIssuedToLine ? 'text-green-500' : isPicking ? 'text-indigo-500' : 'text-blue-600 dark:text-blue-400'}`}>
            {(isIssuedToLine || isPicking) && <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isIssuedToLine ? 'bg-green-500' : 'bg-indigo-500'}`} />}
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
  };

"""
warehouse_content = warehouse_content[:old_request_card_start] + new_request_card + warehouse_content[old_request_card_end:]

# F. Add Smart Stock-Out rendering on the Inventory TR styling
tr_old = "className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedMaterials.has(m.id) ? 'bg-primary/5' : ''}`}"
tr_new = "className={`transition-colors cursor-pointer ${selectedMaterials.has(m.id) ? 'bg-primary/5 hover:bg-primary/10' : m.predictiveHealth === 'Critical' ? 'bg-red-500/10 hover:bg-red-500/20 ring-1 ring-inset ring-red-500/50 animate-[pulse_2s_ease-in-out_infinite]' : 'hover:bg-muted/30'}`}"
warehouse_content = warehouse_content.replace(tr_old, tr_new)

# Add "Inspection" to table headers
th_old = '<th className="px-2 py-1.5 text-right border-r border-border/30 text-orange-500/90 dark:text-orange-400">Reserved</th>'
th_new = '<th className="px-2 py-1.5 text-right border-r border-border/30 text-orange-500/90 dark:text-orange-400">Reserved</th>\n                    <th className="px-2 py-1.5 text-right border-r border-border/30 text-indigo-500/90 dark:text-indigo-400">Inspect</th>'
warehouse_content = warehouse_content.replace(th_old, th_new)

# Add Inspection td
td_old = '<td className="px-2 py-1.5 text-right border-r border-border/30 font-semibold text-orange-500/90 dark:text-orange-400">\n                          {m.reserved_stock.toLocaleString()} <span className="text-[9px] opacity-70">pcs</span>\n                        </td>'
td_new = '<td className="px-2 py-1.5 text-right border-r border-border/30 font-semibold text-orange-500/90 dark:text-orange-400">\n                          {m.reserved_stock.toLocaleString()} <span className="text-[9px] opacity-70">pcs</span>\n                        </td>\n                        <td className="px-2 py-1.5 text-right border-r border-border/30 font-semibold text-indigo-500/90 dark:text-indigo-400">\n                          {m.inspection_stock ? m.inspection_stock.toLocaleString() : 0} <span className="text-[9px] opacity-70">pcs</span>\n                        </td>'
warehouse_content = warehouse_content.replace(td_old, td_new)

# Increase colSpan for empty row from 8 to 9
warehouse_content = warehouse_content.replace('colSpan={8}', 'colSpan={9}')

# G. Return Handling Header Button & Modal
val_header_btns = """        <div className="flex gap-2">
          <Button onClick={() => setIsAddMaterialOpen(true)}>+ Add Material</Button>
        </div>"""
new_header_btns = """        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" className="bg-indigo-500/5 border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/10 hover:text-indigo-700" onClick={() => setIsReturnModalOpen(true)}>
            <Undo2 className="w-4 h-4 mr-2" /> Return from Production
          </Button>
          <Button onClick={() => setIsAddMaterialOpen(true)}>+ Add Material</Button>
        </div>"""
warehouse_content = warehouse_content.replace(val_header_btns, new_header_btns)

# Add Return Modal State
state_old = "const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);"
state_new = "const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);\n  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);\n  const [returnForm, setReturnForm] = useState({ partId: '', qty: 1 });"
warehouse_content = warehouse_content.replace(state_old, state_new)

# Add handleReturn Action Function
action_hook = """  /**
   * KIT ISSUANCE WORKFLOW EXECUTION
   */"""
new_action = """  const handleReturnAction = () => {
    if(!returnForm.partId || returnForm.qty <= 0) return;
    
    const exists = materials.find(m => m.id === returnForm.partId);
    if(!exists) {
      toast.error('Part ID not found.');
      return;
    }
    
    setMaterials(prev => prev.map(m => 
      m.id === returnForm.partId ? { ...m, inspection_stock: (m.inspection_stock || 0) + Number(returnForm.qty) } : m
    ));
    
    toast.success(`${returnForm.qty} units of ${returnForm.partId} flagged for Quality Inspection.`, {
       icon: <ShieldAlert className="w-4 h-4 text-indigo-500" />
    });
    
    setReturnForm({ partId: '', qty: 1 });
    setIsReturnModalOpen(false);
  };
  
  /**
   * KIT ISSUANCE WORKFLOW EXECUTION
   */"""
warehouse_content = warehouse_content.replace(action_hook, new_action)
if "ShieldAlert" not in warehouse_content:
   warehouse_content = warehouse_content.replace(", Zap, Clock, Undo2", ", Zap, Clock, Undo2, ShieldAlert")

# Add the final Modal Markup at the end
modal_old = "      {/* Add Material Dialog Mock */}"
modal_new = """      {/* Return Handling Dialog */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2"><Undo2 className="w-5 h-5 text-indigo-500" /> Return from Production</DialogTitle>
            <DialogDescription className="text-xs">
              Returned parts are held in '<span className="text-indigo-500 font-bold tracking-wider">Inspect</span>' state until signed off by QC.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="partId" className="text-xs font-semibold">Part Number (SKU)</Label>
              <Select value={returnForm.partId} onValueChange={(v) => setReturnForm(prev => ({...prev, partId: v}))}>
                 <SelectTrigger className="h-8 text-xs">
                   <SelectValue placeholder="Select Part" />
                 </SelectTrigger>
                 <SelectContent>
                   {materials.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.id} - {m.name}</SelectItem>)}
                 </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty" className="text-xs font-semibold">Return Quantity</Label>
              <Input id="qty" type="number" min="1" value={returnForm.qty} onChange={(e) => setReturnForm(prev => ({...prev, qty: parseInt(e.target.value) || 0}))} className="h-8 text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReturnAction} className="bg-indigo-600 hover:bg-indigo-700 text-white">Process Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Material Dialog Mock */}"""
warehouse_content = warehouse_content.replace(modal_old, modal_new)

with open(warehouse_path, "w", encoding="utf-8") as f:
    f.write(warehouse_content)

print("done")
