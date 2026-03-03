import os
import re

filepath = r"c:\Users\Khakimovf\factory-dashboard\factory-dashboard\src\app\components\Warehouse.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Tabs import
content = content.replace(
    "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';",
    "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';"
)

# 2. Add 'Issuing' to mock data
old_requests = """const initialRequests: MockRequest[] = [
  { id: 'REQ-0192', planId: 'PLAN-A1 (Door Trims)', status: 'Pending', time: '10:45 AM', items: denseMockKitA1 },
  { id: 'REQ-0193', planId: 'PLAN-B2 (Dashboards)', status: 'Pending', time: '11:20 AM', items: denseMockKitA1.slice(0, 5) },
  { id: 'REQ-0188', planId: 'PLAN-A1 (Door Trims)', status: 'ON LINE', time: '08:00 AM', items: denseMockKitA1.slice(5, 12) },
];"""
new_requests = """const initialRequests: MockRequest[] = [
  { id: 'REQ-0192', planId: 'PLAN-A1 (Door Trims)', status: 'Pending', time: '10:45 AM', items: denseMockKitA1 },
  { id: 'REQ-0193', planId: 'PLAN-B2 (Dashboards)', status: 'Pending', time: '11:20 AM', items: denseMockKitA1.slice(0, 5) },
  { id: 'REQ-0194', planId: 'PLAN-C3 (Seats)', status: 'Issuing', time: '09:30 AM', items: denseMockKitA1.slice(2, 6) },
  { id: 'REQ-0188', planId: 'PLAN-A1 (Door Trims)', status: 'ON LINE', time: '08:00 AM', items: denseMockKitA1.slice(5, 12) },
];"""
content = content.replace(old_requests, new_requests)

# 3. Add activeTab state
old_state = """  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('All');
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());"""
new_state = """  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('All');
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('inventory');"""
content = content.replace(old_state, new_state)

# 4. Replace `return (...)` with our new tab layout
start_idx = content.find('  return (\n    <div className="min-h-screen')
end_idx = content.find('// Subcomponents', start_idx) - 5
assert start_idx != -1

new_return = """
  const RequestCard = ({ req }: { req: MockRequest }) => {
    const isIssuedToLine = req.status === 'ON LINE' || req.status === 'Completed';
    const isPicking = req.status === 'Issuing';

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

        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1.5 mb-3 font-mono">
          <Layers className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span>{req.items.length} COMPONENT SKUs</span>
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

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background text-foreground flex flex-col">

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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddMaterialOpen(true)}>+ Add Material</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full">
        <TabsList className="mb-6 w-full max-w-md grid grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="operations">Active Ops</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="flex-1 space-y-4">
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
                    <th className="px-2 py-1.5 text-left w-10 border-r border-border/30">
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                        checked={selectedMaterials.size === DisplayMaterials.length && DisplayMaterials.length > 0}
                        onChange={() => toggleSelectAll(DisplayMaterials.map(m => m.id))}
                      />
                    </th>
                    <th className="px-2 py-1.5 text-left border-r border-border/30">Part Name</th>
                    <th className="px-2 py-1.5 text-left border-r border-border/30">Location</th>
                    <th className="px-2 py-1.5 text-right border-r border-border/30">Current</th>
                    <th className="px-2 py-1.5 text-right border-r border-border/30 text-orange-500/90 dark:text-orange-400">Reserved</th>
                    <th className="px-2 py-1.5 text-right border-r border-border/30 text-primary font-bold">Avail</th>
                    <th className="px-2 py-1.5 text-center border-r border-border/30">Stock Cover</th>
                    <th className="px-2 py-1.5 text-left">Predictive Alert</th>
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
                        <td className="px-2 py-1.5 border-r border-border/30 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                            checked={selectedMaterials.has(m.id)}
                            onChange={(e) => toggleSelectMaterial(m.id, e as any)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-2 py-1.5 border-r border-border/30">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-muted/60 border border-border/50 flex flex-shrink-0 items-center justify-center">
                              {m.category === 'Finished Goods' ? <Package className="w-3 h-3 text-primary opacity-80" /> : <ImageIcon className="w-3 h-3 text-muted-foreground opacity-50" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground flex items-center gap-1.5 truncate text-[11px]">
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
                              <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{m.id} | {m.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 border-r border-border/30">
                          <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-muted/50 border border-border/50 text-[9px] uppercase font-bold text-muted-foreground font-mono truncate max-w-[90px]">
                            <MapPin className="w-3 h-3" /> {m.binLocation}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right border-r border-border/30 font-medium">
                          {m.current_stock.toLocaleString()} <span className="text-[9px] opacity-70">pcs</span>
                        </td>
                        <td className="px-2 py-1.5 text-right border-r border-border/30 font-semibold text-orange-500/90 dark:text-orange-400">
                          {m.reserved_stock.toLocaleString()} <span className="text-[9px] opacity-70">pcs</span>
                        </td>
                        <td className="px-2 py-1.5 text-right border-r border-border/30 font-bold text-foreground bg-muted/10">
                          {m.available.toLocaleString()} <span className="text-[9px] font-normal opacity-70">pcs</span>
                        </td>
                        <td className="px-2 py-1.5 text-center border-r border-border/30 font-medium text-muted-foreground">
                          {m.category === 'Finished Goods' ? '-' : `${m.shiftsRemaining} Shifts`}
                        </td>
                        <td className="px-2 py-1.5 group/alert hover:bg-muted/10">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${m.predictiveHealth === 'Ready' ? 'text-green-500' :
                                m.predictiveHealth === 'Warning' ? 'text-yellow-500' : 'text-red-500'
                              }`}>
                              {m.predictiveHealth === 'Ready' && <CheckCircle className="w-3 h-3 shrink-0" />}
                              {m.predictiveHealth === 'Warning' && <AlertTriangle className="w-3 h-3 shrink-0" />}
                              {m.predictiveHealth === 'Critical' && <AlertCircle className="w-3 h-3 shrink-0" />}
                              <span className="truncate md:max-w-[140px] max-w-[80px]" title={m.alertMessage}>{m.alertMessage}</span>
                            </span>
                            {m.predictiveHealth === 'Critical' && (
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground hover:text-primary shrink-0 opacity-100" title="View in Planning Tab" onClick={(e) => { e.stopPropagation(); setActiveTab('planning'); }}>
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="flex-1 min-h-[500px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full max-h-[80vh]">
            <div className="bg-muted/10 border border-border rounded-lg flex flex-col overflow-hidden max-h-full">
               <div className="p-3 border-b border-border bg-muted/30 font-bold text-sm flex items-center justify-between">
                 <span>To Do</span>
                 <span className="text-[10px] bg-muted px-2 py-0.5 rounded border border-border/50">{requests.filter(r => r.status === 'Pending').length}</span>
               </div>
               <div className="p-3 overflow-y-auto flex-1 space-y-3">
                 {requests.filter(r => r.status === 'Pending').map(req => <RequestCard key={req.id} req={req} />)}
               </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex flex-col overflow-hidden max-h-full">
               <div className="p-3 border-b border-indigo-500/20 bg-indigo-500/10 font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                 <span>In Progress (Picking)</span>
                 <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded">{requests.filter(r => r.status === 'Issuing').length}</span>
               </div>
               <div className="p-3 overflow-y-auto flex-1 space-y-3">
                 {requests.filter(r => r.status === 'Issuing').map(req => <RequestCard key={req.id} req={req} />)}
               </div>
            </div>

            <div className="bg-green-500/5 border border-green-500/20 rounded-lg flex flex-col overflow-hidden max-h-full">
               <div className="p-3 border-b border-green-500/20 bg-green-500/10 font-bold text-sm text-green-600 dark:text-green-500 flex items-center justify-between">
                 <span>Issued</span>
                 <span className="text-[10px] bg-green-500/20 px-2 py-0.5 rounded">{requests.filter(r => r.status === 'ON LINE' || r.status === 'Completed').length}</span>
               </div>
               <div className="p-3 overflow-y-auto flex-1 space-y-3">
                 {requests.filter(r => r.status === 'ON LINE' || r.status === 'Completed').map(req => <RequestCard key={req.id} req={req} />)}
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm bg-muted/5">
             <div>
               <h3 className="text-lg font-bold text-foreground">Insights & Planning</h3>
               <p className="text-sm text-muted-foreground">High-level material overview and analytics.</p>
             </div>
             <Button variant="outline">Export CSV Data</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            <HealthCard title="Sufficient Coverage" value={stats.ready} icon={<CheckCircle className="w-4 h-4" />} color="green" description="> 3 Shifts buffer" />
            <HealthCard title="Predictive Risk" value={stats.warning} icon={<TrendingDown className="w-4 h-4" />} color="yellow" description="< 3 Shifts remaining" />
            <HealthCard title="Line Blocked" value={stats.critical} icon={<AlertCircle className="w-4 h-4" />} color="red" description="0 Stock or < 1 Shift" />
            <HealthCard title="Volume Booked" value={stats.reservedTotal.toLocaleString()} icon={<Layers className="w-4 h-4" />} color="blue" description="Reserved (pcs) for Plans" />
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
"""

content = content[:start_idx] + new_return + content[end_idx:]

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("done")
