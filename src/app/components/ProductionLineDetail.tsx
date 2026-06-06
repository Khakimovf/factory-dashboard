import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { useDailyProductionPlan } from '../context/DailyProductionPlanContext';
import { useWarehouse } from '../context/WarehouseContext';
import { maintenanceApi } from '../services/maintenanceApi';
import {
  ArrowLeft, Package, PlayCircle, PauseCircle, Settings, Plus,
  Activity, Layers, BarChart3, Monitor, Construction, Loader2,
  Clock, CheckCircle2, AlertTriangle, TrendingUp, Gauge, Target, Users, Factory,
  Wrench, Zap, Cpu, ShieldCheck, ShieldAlert, Send
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { LinePlanModal } from './hr/LinePlanModal';

export function ProductionLineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { productionLines, materials, updateProductionLine } = useFactory();
  const { t } = useLanguage();
  const { getTodayLinePlan } = useDailyProductionPlan();
  const { requests } = useWarehouse();

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  const [isSubmittingMaintenance, setIsSubmittingMaintenance] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [timerNow, setTimerNow] = useState(new Date());
  const [showProductionPlan, setShowProductionPlan] = useState(false);

  const line = productionLines.find(l => l.id === id);
  const todayPlan = line ? getTodayLinePlan(line.id) : null;

  // Mocked production progress data (SAP standard)
  const PRODUCTION_PLAN = 1000;
  const PRODUCTION_FACT = line?.output || 356;
  const PRODUCTION_REMAINING = Math.max(0, PRODUCTION_PLAN - PRODUCTION_FACT);
  const progressPercent = Math.min(100, Math.round((PRODUCTION_FACT / PRODUCTION_PLAN) * 100));

  if (!line) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('productionDetail.lineNotFound')}</h2>
          <Button onClick={() => navigate('/production-lines')} variant="outline">
            {t('productionDetail.backToLines')}
          </Button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: 'active' | 'idle' | 'maintenance' | 'maintenance_requested') => {
    updateProductionLine(id!, { status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'idle': return 'bg-amber-500';
      case 'maintenance': return 'bg-rose-500';
      case 'maintenance_requested': return 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse';
      default: return 'bg-slate-400';
    }
  };

  // Timer Effect
  useEffect(() => {
    const timer = setInterval(() => setTimerNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active maintenance request
  useEffect(() => {
    const fetchActiveRequest = async () => {
      try {
        const reports = await maintenanceApi.getFailureReports('open', id);
        if (reports.length > 0) {
          setActiveRequest(reports[0]);
        } else {
          // Check in_progress too
          const inProgress = await maintenanceApi.getFailureReports('in_progress', id);
          if (inProgress.length > 0) {
            setActiveRequest(inProgress[0]);
          } else {
            setActiveRequest(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch maintenance reports', error);
      }
    };
    fetchActiveRequest();
    const interval = setInterval(fetchActiveRequest, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleMaintenanceSubmit = async () => {
    if (!selectedIssueType) return;
    setIsSubmittingMaintenance(true);
    try {
      const report = await maintenanceApi.createFailureReport({
        line_id: id!,
        line_name: line.name,
        description: `ANDON: ${selectedIssueType} repair requested`,
        reported_by: 'Line Master',
        priority: selectedPriority.toLowerCase(),
        issue_type: selectedIssueType,
        machine_id: line.id
      } as any);
      setActiveRequest(report);
      updateProductionLine(id!, { status: 'maintenance_requested' });
      setSelectedIssueType(null);
    } catch (error) {
      console.error('Failed to submit request', error);
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  const formatElapsed = (createdAt: string) => {
    const start = new Date(createdAt);
    const diff = Math.floor((timerNow.getTime() - start.getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const ISSUE_TYPES = [
    { id: 'Mechanical', icon: <Wrench className="w-6 h-6" />, label: 'Mechanical', color: 'amber' },
    { id: 'Electrical', icon: <Zap className="w-6 h-6" />, label: 'Electrical', color: 'rose' },
    { id: 'Software', icon: <Cpu className="w-6 h-6" />, label: 'Software/PLC', color: 'blue' },
    { id: 'Quality', icon: <ShieldCheck className="w-6 h-6" />, label: 'Quality', color: 'emerald' },
  ];

  const PRIORITIES = [
    { id: 'low', label: 'Low (Routine)', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 'normal', label: 'Medium (Degraded)', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { id: 'high', label: 'Critical (Line Stopped)', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  ];

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-950 min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <button
            onClick={() => navigate('/production-lines')}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('productionDetail.backToLines')}
          </button>

          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${getStatusColor(line.status)} bg-opacity-10 shadow-inner`}>
              {line.type === 'sap_inpanel' ? <Monitor className="w-8 h-8 text-blue-500" /> :
                line.type === 'tpa_molding' ? <Construction className="w-8 h-8 text-purple-500" /> :
                  <Factory className="w-8 h-8 text-emerald-500" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white uppercase">{line.name}</h2>
                <Badge className={`${getStatusColor(line.status)} text-white border-0 px-3 py-1 text-[10px] uppercase font-black`}>
                  {line.status}
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono text-sm tracking-tighter mt-1 opacity-70">
                SAP_NODE_ID: {line.id} • WORK_CENTER: {line.type.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-border">
          <Button
            onClick={() => handleStatusChange('active')}
            variant={line.status === 'active' ? 'default' : 'ghost'}
            className={`rounded-xl h-12 px-6 font-bold uppercase text-[10px] tracking-widest transition-all ${line.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' : ''}`}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Start
          </Button>
          <Button
            onClick={() => handleStatusChange('idle')}
            variant={line.status === 'idle' ? 'default' : 'ghost'}
            className={`rounded-xl h-12 px-6 font-bold uppercase text-[10px] tracking-widest transition-all ${line.status === 'idle' ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20' : ''}`}
          >
            <PauseCircle className="w-4 h-4 mr-2" />
            Idle
          </Button>
          <Button
            onClick={() => handleStatusChange('maintenance_requested')}
            variant={line.status === 'maintenance_requested' ? 'destructive' : 'ghost'}
            className={`rounded-xl h-12 px-6 font-bold uppercase text-[10px] tracking-widest transition-all ${line.status === 'maintenance_requested' ? 'animate-pulse' : ''}`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Failure
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Overall OEE', value: `${line.efficiency}%`, icon: <Gauge className="w-5 h-5" />, color: 'blue' },
          { label: 'Quality Rate', value: '98.4%', icon: <CheckCircle2 className="w-5 h-5" />, color: 'emerald' },
          { label: 'Availability', value: '92.1%', icon: <Clock className="w-5 h-5" />, color: 'amber' },
          { label: 'Performance', value: '94.8%', icon: <TrendingUp className="w-5 h-5" />, color: 'purple' },
        ].map((kpi, i) => (
          <Card key={i} className="border-none bg-white dark:bg-gray-900 shadow-sm overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${kpi.color}-500`} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{kpi.label}</span>
                <div className={`p-2 rounded-lg bg-${kpi.color}-500/10 text-${kpi.color}-500`}>{kpi.icon}</div>
              </div>
              <div className="mt-2">
                <h4 className="text-2xl font-black tracking-tight">{kpi.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <TabsList className="bg-transparent p-0 gap-8">
            {['overview', 'operations', 'materials', 'maintenance'].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none h-10 px-0 font-black text-[11px] uppercase tracking-widest transition-all"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(`/production-lines/${line.id}/live`)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-lg shadow-blue-500/20 font-bold text-[10px] uppercase tracking-widest"
            >
              <Activity className="w-4 h-4 mr-2" /> Live Dashboard
            </Button>
            <Button variant="outline" className="rounded-xl h-10 px-5 font-bold text-[10px] uppercase tracking-widest border-border hover:bg-muted" onClick={() => navigate(`/production-lines/${line.id}/sap-cockpit`)}>
              <Monitor className="w-4 h-4 mr-2" /> SAP Cockpit
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white dark:bg-gray-900 border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold uppercase tracking-tight">Production Execution</CardTitle>
                  <CardDescription>Real-time volume tracking vs daily plan</CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-xs capitalize">{todayPlan?.shift || 'No active shift'}</Badge>
              </CardHeader>
              <CardContent className="space-y-8 pt-4">
                <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('productionDetail.plan')}</p>
                    <p className="text-3xl font-black tracking-tight">{PRODUCTION_PLAN} <span className="text-xs font-medium text-muted-foreground">Pcs</span></p>
                  </div>
                  <div className="space-y-1 border-x border-border px-8">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('productionDetail.fact')}</p>
                    <p className="text-3xl font-black tracking-tight text-blue-600">{PRODUCTION_FACT} <span className="text-xs font-medium text-muted-foreground">Pcs</span></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('productionDetail.remaining')}</p>
                    <p className="text-3xl font-black tracking-tight text-emerald-600">{PRODUCTION_REMAINING} <span className="text-xs font-medium text-muted-foreground">Pcs</span></p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase text-muted-foreground">Daily Quota Completion</span>
                    <span className="text-xl font-black text-blue-600">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-4 bg-muted border border-border" />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Shift A Start</span>
                    <span>Current Progress</span>
                    <span>Target Gate</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase tracking-tight">Operational Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Team Size</p>
                      <p className="text-sm font-bold">12 Operators</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-bold">Active</Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Current OEE</span>
                    <span className="font-black text-emerald-500">{line.efficiency}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Downtime</span>
                    <span className="font-black text-rose-500">{line.downtimeRecord?.accumulatedMinutes || 0} min</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-muted-foreground uppercase text-[10px]">Reject Count</span>
                    <span className="font-black text-amber-500">4 Pcs</span>
                  </div>
                </div>

                <Button
                  className="w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest border border-border hover:bg-muted"
                  variant="ghost"
                  onClick={() => setShowProductionPlan(true)}
                >
                  {t('productionDetail.todayPlan')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-border">
            <CardHeader>
              <CardTitle className="text-xl font-bold uppercase">Shift Timeline & Analytics</CardTitle>
              <CardDescription>Visualizing performance trends for the current sequence.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center border-t border-border bg-muted/20">
              <div className="text-center space-y-2">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Real-time charts loading...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card className="bg-white dark:bg-gray-900 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl font-bold uppercase">Bill of Materials (BOM)</CardTitle>
                <CardDescription>Component readiness and inbound logistics tracking.</CardDescription>
              </div>
              <Button onClick={() => setShowMaterialModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest h-10 px-4">
                <Plus className="w-4 h-4 mr-2" /> Add Component
              </Button>
            </CardHeader>
            <CardContent>
              {line.requiredMaterials.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-bold text-muted-foreground uppercase tracking-widest">{t('productionDetail.noMaterials')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {line.requiredMaterials.map(req => {
                    const material = materials.find(m => m.id === req.materialId);
                    if (!material) return null;

                    const activeRequests = requests.filter(r =>
                      (r.status === 'Pending' || r.status === 'Issuing') &&
                      r.items.some(rp => rp.partNumber === req.materialId)
                    );
                    const transitAmount = activeRequests.reduce((acc, currentReq) => {
                      const item = currentReq.items.find(i => i.partNumber === req.materialId);
                      return acc + (item ? item.requiredQty : 0);
                    }, 0);

                    const perfectlyAvailable = material.quantity >= req.quantity;

                    return (
                      <div key={req.materialId} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${perfectlyAvailable ? 'bg-white dark:bg-gray-900 border-border' : 'bg-rose-500/5 border-rose-500/20 shadow-inner'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${perfectlyAvailable ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              <Package className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">{material.name}</h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">{material.category}</p>
                            </div>
                          </div>
                          {transitAmount > 0 && <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">In Transit: {transitAmount}</Badge>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">On Hand</p>
                            <p className="text-lg font-black">{material.quantity} {material.unit}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                            <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Required</p>
                            <p className="text-lg font-black">{req.quantity} {material.unit}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase ${perfectlyAvailable ? 'text-emerald-500' : 'text-rose-500 italic'}`}>
                            {perfectlyAvailable ? 'READY FOR PRODUCTION' : 'STOCKOUT RISK detected'}
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 rounded-lg">View Bin</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-white dark:bg-gray-900 border-border overflow-hidden relative">
              <CardHeader className="border-b border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                      <ShieldAlert className="w-6 h-6 text-rose-500" /> Andon System Panel
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Lean Manufacturing Maintenance Dispatch</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase">Node: {line.id}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {activeRequest ? (
                  <div className="bg-rose-500/5 border-2 border-rose-500/20 rounded-[40px] p-10 text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500 animate-pulse" />
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20" />
                        <AlertTriangle className="w-12 h-12 text-rose-500 z-10" />
                      </div>
                      <h3 className="text-4xl font-black text-rose-600 italic uppercase tracking-tighter mb-2">Help Requested</h3>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Maintenance team notified • Dispatch pending</p>

                      <div className="bg-white dark:bg-slate-950 px-10 py-6 rounded-3xl border border-border shadow-2xl inline-block">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">SLA Response Counter</p>
                        <p className="text-6xl font-black font-mono text-rose-500 tabular-nums leading-none tracking-tighter">
                          {formatElapsed(activeRequest.created_at)}
                        </p>
                      </div>

                      <div className="mt-10 grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                        <div className="p-4 bg-muted rounded-2xl border border-border text-left">
                          <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Issue Category</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{activeRequest.issue_type || 'General'}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-2xl border border-border text-left">
                          <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Priority</p>
                          <p className="text-sm font-bold text-rose-600 uppercase tracking-tight">{activeRequest.priority}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-1">1. Select Issue Type (Zero-Typing)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {ISSUE_TYPES.map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelectedIssueType(type.id)}
                            className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all duration-300 group
                              ${selectedIssueType === type.id
                                ? `bg-${type.color}-500/10 border-${type.color}-500 shadow-lg scale-[1.02]`
                                : 'bg-white dark:bg-gray-900 border-border hover:border-slate-400'
                              }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${selectedIssueType === type.id ? `bg-${type.color}-500 text-white` : 'bg-muted text-muted-foreground'}`}>
                              {type.icon}
                            </div>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${selectedIssueType === type.id ? `text-${type.color}-600` : 'text-muted-foreground'}`}>
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] pl-1">2. Severity Level</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {PRIORITIES.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPriority(p.id)}
                            className={`h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all
                              ${selectedPriority === p.id
                                ? `${p.color} border-current shadow-xl scale-[1.02]`
                                : 'bg-white dark:bg-gray-900 border-border text-muted-foreground hover:bg-muted'
                              }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleMaintenanceSubmit}
                      disabled={!selectedIssueType || isSubmittingMaintenance}
                      className={`w-full h-20 rounded-[32px] font-black uppercase tracking-[0.3em] text-lg shadow-2xl transition-all active:scale-[0.98]
                        ${selectedIssueType
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30'
                          : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        }`}
                    >
                      {isSubmittingMaintenance ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          SIGNALING...
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          SEND MAINTENANCE HELP <Send className="w-6 h-6 animate-bounce" />
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-white dark:bg-gray-900 border-border overflow-hidden">
                <CardHeader className="bg-muted pb-4 border-b border-border space-y-0">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Maintenance History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {[
                      { type: 'Mechanical', time: '2 hours ago', desc: 'Belt tension adjusted', priority: 'medium' },
                      { type: 'Electrical', time: 'Yesterday', desc: 'Controller sensor replaced', priority: 'high' },
                      { type: 'Quality', time: '3 days ago', desc: 'Tolerance calibration', priority: 'low' },
                    ].map((h, i) => (
                      <div key={i} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[10px] font-black uppercase tracking-tighter ${h.priority === 'high' ? 'text-rose-600' : 'text-blue-600'}`}>
                            {h.type} Issue
                          </p>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">{h.time}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-tight">{h.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-none relative overflow-hidden p-6 text-white text-center">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wrench className="w-20 h-20" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Technical Lead</h4>
                <p className="text-lg font-black tracking-tight">Jamoliddin J.</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">Active in Sector A</p>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Material Modal */}
      {showMaterialModal && (
        <AddMaterialModal
          lineId={id!}
          onClose={() => setShowMaterialModal(false)}
          onAdd={(materialId, quantity) => {
            const newMaterials = [...line.requiredMaterials, { materialId, quantity }];
            updateProductionLine(id!, { requiredMaterials: newMaterials });
            setShowMaterialModal(false);
          }}
          existingMaterials={line.requiredMaterials.map(m => m.materialId)}
        />
      )}

      {/* Production Plan Modal */}
      {line && (
        <LinePlanModal
          open={showProductionPlan}
          onClose={() => setShowProductionPlan(false)}
          lineId={line.id}
          lineName={line.name}
        />
      )}
    </div>
  );
}

interface AddMaterialModalProps {
  lineId: string;
  onClose: () => void;
  onAdd: (materialId: string, quantity: number) => void;
  existingMaterials: string[];
}

function AddMaterialModal({ onClose, onAdd, existingMaterials }: AddMaterialModalProps) {
  const { materials } = useFactory();
  const { t } = useLanguage();
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);

  const availableMaterials = materials.filter(m => !existingMaterials.includes(m.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaterial) onAdd(selectedMaterial, quantity);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full border-border shadow-2xl animate-in zoom-in-95">
        <CardHeader>
          <CardTitle className="text-xl font-bold uppercase tracking-tight">{t('productionDetail.addMaterialTitle')}</CardTitle>
          <CardDescription>Select material from warehouse inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('productionDetail.material')}</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                required
              >
                <option value="">{t('productionDetail.selectMaterial')}</option>
                {availableMaterials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.quantity} {material.unit} {t('productionDetail.availableLabel')})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('productionDetail.quantityRequired')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full h-12 bg-muted border border-border rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                min="1"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">Cancel</Button>
              <Button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-500/20">{t('productionDetail.addMaterial')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
