import { useState, useEffect, useMemo } from 'react';
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
import { toast } from 'sonner';

export function ProductionLineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { productionLines, materials, updateProductionLine, tpaWipBuffer, updateTpaWipBuffer } = useFactory();
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
  const [shotCount, setShotCount] = useState(12450);
  const [changeoverRemaining, setChangeoverRemaining] = useState(3400);

  const [selectedMachineId, setSelectedMachineId] = useState<string>('TPA-01');
  const [tpaSearchQuery, setTpaSearchQuery] = useState<string>('');
  
  const [tpaMachines, setTpaMachines] = useState(() => {
    const moldOptions = [
      { id: 'MOLD-B-PILLAR-LH', part: 'B-Pillar Lower Liner LH' },
      { id: 'MOLD-B-PILLAR-RH', part: 'B-Pillar Lower Liner RH' },
      { id: 'MOLD-SW-002', part: 'Switch Frame Bracket RH' },
      { id: 'MOLD-SW-001', part: 'Switch Frame Bracket LH' },
      { id: 'MOLD-CAP-04', part: 'Door Trim Inner Cap' },
      { id: 'MOLD-GLOVEBOX-01', part: 'Glovebox Outer Cover' }
    ];
    
    return Array.from({ length: 25 }, (_, idx) => {
      const idNum = idx + 1;
      const idStr = `TPA-${idNum.toString().padStart(2, '0')}`;
      
      let status: 'running' | 'changeover' | 'downtime' = 'running';
      if (idNum % 7 === 0) status = 'changeover';
      else if (idNum % 5 === 0) status = 'downtime';
      
      const moldSelect = moldOptions[idx % moldOptions.length];
      const target = 1500;
      const fact = status === 'changeover' ? 0 : Math.round(300 + (idx * 40) % 1100);
      
      return {
        id: idStr,
        name: idStr,
        status,
        moldId: moldSelect.id,
        partName: moldSelect.part,
        target,
        output: fact,
        cycleTime: (12.5 + (idx * 1.5) % 12).toFixed(1),
        barrelTemp: Math.round(210 + (idx * 3) % 35),
        oilTemp: Math.round(42 + (idx * 1) % 12),
        injectionPressure: Math.round(125 + (idx * 4) % 45),
        activeAndonReport: status === 'downtime' ? {
          id: `ANDON-${idStr}`,
          issue_type: idx % 2 === 0 ? 'BARREL OVERHEATING' : 'MOLD LOCK ERROR',
          priority: idx % 2 === 0 ? 'high' : 'critical',
          created_at: new Date(Date.now() - 1000 * 60 * (15 + idx)).toISOString(),
          description: idx % 2 === 0 
            ? 'Critical thermal run detected in heating zone 3.' 
            : 'Clamp toggle limit switch failed to engage.'
        } : null
      };
    });
  });

  const handleMachineStatusChange = (machineId: string, newStatus: 'running' | 'changeover' | 'downtime') => {
    setTpaMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        let activeAndonReport = m.activeAndonReport;
        if (newStatus !== 'downtime') {
          activeAndonReport = null;
        } else if (!activeAndonReport) {
          activeAndonReport = {
            id: `ANDON-${machineId}`,
            issue_type: 'MOLD LOCK ERROR',
            priority: 'high',
            created_at: new Date().toISOString(),
            description: 'Manual downtime reported by line supervisor.'
          };
        }
        return {
          ...m,
          status: newStatus,
          activeAndonReport
        };
      }
      return m;
    }));
  };

  const handleTpaMachineAndonTrigger = (machineId: string, fault: { id: string, label: string, priority: string, desc: string }) => {
    setTpaMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        return {
          ...m,
          status: 'downtime',
          activeAndonReport: {
            id: `ANDON-${machineId}-${Date.now()}`,
            issue_type: fault.id,
            priority: fault.priority,
            created_at: new Date().toISOString(),
            description: fault.desc
          }
        };
      }
      return m;
    }));
    toast.success(`${fault.id} alert dispatched for ${machineId}!`);
  };

  const handleTpaMachineAndonResolve = (machineId: string) => {
    setTpaMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        return {
          ...m,
          status: 'running',
          activeAndonReport: null
        };
      }
      return m;
    }));
    toast.success(`Andon resolved. ${machineId} is back to running!`);
  };

  const filteredMachines = useMemo(() => {
    if (!tpaSearchQuery.trim()) return tpaMachines;
    const query = tpaSearchQuery.toLowerCase();
    return tpaMachines.filter(m => 
      m.id.toLowerCase().includes(query) ||
      m.moldId.toLowerCase().includes(query) ||
      m.partName.toLowerCase().includes(query)
    );
  }, [tpaMachines, tpaSearchQuery]);

  const selectedMachine = useMemo(() => {
    return tpaMachines.find(m => m.id === selectedMachineId) || tpaMachines[0];
  }, [tpaMachines, selectedMachineId]);

  // ─── HTPA 10-Machine Heavy Fleet (5A specific) ────────────────────────────
  const [selectedHeavyMachineId, setSelectedHeavyMachineId] = useState<string>('HTPA-01');
  const [htpaSearchQuery, setHtpaSearchQuery] = useState<string>('');

  const [htpaMachines, setHtpaMachines] = useState(() => {
    const heavyMolds = [
      { id: 'MOLD-DT-FR-LH', part: 'Door Trim Front Left', compound: 'PP-Grade-A (Grey Polymer)', clampForce: 850 },
      { id: 'MOLD-DT-FR-RH', part: 'Door Trim Front Right', compound: 'PP-Grade-A (Grey Polymer)', clampForce: 850 },
      { id: 'MOLD-DT-RR-LH', part: 'Door Trim Rear Left', compound: 'PP-Grade-B (Black Polymer)', clampForce: 750 },
      { id: 'MOLD-DT-RR-RH', part: 'Door Trim Rear Right', compound: 'PP-Grade-B (Black Polymer)', clampForce: 750 },
      { id: 'MOLD-INPANEL-MAIN', part: 'Inpanel Core Sub-Assembly', compound: 'ABS-Grade-A (Beige Polymer)', clampForce: 1200 },
      { id: 'MOLD-INPANEL-SIDE', part: 'Inpanel Side Fascia', compound: 'ABS-Grade-A (Beige Polymer)', clampForce: 980 },
      { id: 'MOLD-PILLAR-A-LH', part: 'A-Pillar Cover Assembly LH', compound: 'PP-Grade-C (Dark Grey)', clampForce: 620 },
      { id: 'MOLD-PILLAR-A-RH', part: 'A-Pillar Cover Assembly RH', compound: 'PP-Grade-C (Dark Grey)', clampForce: 620 },
      { id: 'MOLD-TRUNK-PANEL', part: 'Trunk Interior Panel', compound: 'PP-Grade-A (Grey Polymer)', clampForce: 900 },
      { id: 'MOLD-ROOF-LINER', part: 'Roof Liner Front Segment', compound: 'PVC-Grade-A (Off-White)', clampForce: 700 },
    ];

    return Array.from({ length: 10 }, (_, idx) => {
      const idNum = idx + 1;
      const idStr = `HTPA-${idNum.toString().padStart(2, '0')}`;

      let status: 'running' | 'changeover' | 'downtime' = 'running';
      if (idNum === 4) status = 'changeover';
      else if (idNum === 7) status = 'downtime';

      const mold = heavyMolds[idx];
      const target = 1000;
      const fact = status === 'changeover' ? 0 : Math.round(180 + (idx * 75) % 720);

      return {
        id: idStr,
        name: idStr,
        status,
        moldId: mold.id,
        partName: mold.part,
        compound: mold.compound,
        clampForce: mold.clampForce,
        target,
        output: fact,
        cycleTime: (40.0 + idx * 1.8).toFixed(1),
        barrelTemp: Math.round(225 + idx * 3),
        oilTemp: Math.round(48 + idx * 1),
        injectionPressure: Math.round(160 + idx * 5),
        polymerConsumed: Math.round(fact * 0.85),
        activeAndonReport: status === 'downtime' ? {
          id: `ANDON-${idStr}`,
          issue_type: 'HYDRAULIC CLAMP FAULT',
          priority: 'critical',
          created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
          description: 'Heavy clamp cylinder pressure collapsed below 600T threshold. Toolroom crew dispatched.'
        } : null
      };
    });
  });

  const handleHeavyMachineStatusChange = (machineId: string, newStatus: 'running' | 'changeover' | 'downtime') => {
    setHtpaMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        let activeAndonReport = m.activeAndonReport;
        if (newStatus !== 'downtime') {
          activeAndonReport = null;
        } else if (!activeAndonReport) {
          activeAndonReport = {
            id: `ANDON-${machineId}`,
            issue_type: 'HYDRAULIC CLAMP FAULT',
            priority: 'critical',
            created_at: new Date().toISOString(),
            description: 'Manual heavy-press downtime reported by line supervisor.'
          };
        }
        return { ...m, status: newStatus, activeAndonReport };
      }
      return m;
    }));
  };

  const handleHtpaAndonTrigger = (machineId: string, fault: { id: string; label: string; priority: string; desc: string }) => {
    setHtpaMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        return {
          ...m,
          status: 'downtime',
          activeAndonReport: {
            id: `ANDON-${machineId}-${Date.now()}`,
            issue_type: fault.id,
            priority: fault.priority,
            created_at: new Date().toISOString(),
            description: fault.desc
          }
        };
      }
      return m;
    }));
    toast.success(`🚨 ${fault.id} alert dispatched for ${machineId}!`);
  };

  const handleHtpaAndonResolve = (machineId: string) => {
    setHtpaMachines(prev => prev.map(m => {
      if (m.id === machineId) {
        return { ...m, status: 'running', activeAndonReport: null };
      }
      return m;
    }));
    toast.success(`✅ Heavy press ${machineId} fault cleared. Back on-cycle.`);
  };

  const filteredHeavyMachines = useMemo(() => {
    if (!htpaSearchQuery.trim()) return htpaMachines;
    const query = htpaSearchQuery.toLowerCase();
    return htpaMachines.filter(m =>
      m.id.toLowerCase().includes(query) ||
      m.moldId.toLowerCase().includes(query) ||
      m.partName.toLowerCase().includes(query) ||
      m.compound.toLowerCase().includes(query)
    );
  }, [htpaMachines, htpaSearchQuery]);

  const selectedHeavyMachine = useMemo(() => {
    return htpaMachines.find(m => m.id === selectedHeavyMachineId) || htpaMachines[0];
  }, [htpaMachines, selectedHeavyMachineId]);
  // ─────────────────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (line && line.status === 'active' && line.type === 'tpa_molding') {
      const interval = setInterval(() => {
        setShotCount(prev => prev + 1);
        setChangeoverRemaining(prev => Math.max(0, prev - 1));
      }, line.id === '5A' ? 8000 : 4000);
      return () => clearInterval(interval);
    }
  }, [line]);

  const moldCode = line?.id === '5A' ? 'MOLD-DT-FR-LH' : 'MOLD-SW-FR-5B';
  const cycleTime = line?.id === '5A' ? '45.2 sec/unit' : '18.5 sec/unit';
  const materialCompound = line?.id === '5A' ? 'PP-Grade-A (Grey Polymer)' : 'ABS-Grade-B (Black Polymer)';
  const hopperCapacity = line?.id === '5A' ? 72 : 45;
  const hopperStatusText = line?.id === '5A' ? '72% Optimal' : '45% Attention';
  const hopperColor = line?.id === '5A' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-amber-400 border-amber-500/20 bg-amber-500/10';

  const targetBufferId = line?.id === '5A' ? 'DT-INT-002' : 'SW-BASE-99';
  const targetBufferItem = tpaWipBuffer?.find(item => item.id === targetBufferId);

  const handleTeleshkaFilled = () => {
    if (targetBufferItem && updateTpaWipBuffer) {
      updateTpaWipBuffer(targetBufferId, targetBufferItem.quantity + 200);
      toast.success("Teleshka to'ldirildi!", {
        description: `200 dona detal TPA markaziy buferiga (${targetBufferId}) qo'shildi.`
      });
    }
  };

  const handleTpaMaintenanceSubmit = async (fault: { id: string, label: string, priority: string, desc: string }) => {
    setIsSubmittingMaintenance(true);
    try {
      const report = await maintenanceApi.createFailureReport({
        line_id: id!,
        line_name: line?.name || '',
        description: `INJECTION MOLDING FAULT: ${fault.desc} Active Mold Code: ${moldCode}`,
        reported_by: 'Molding Operator',
        priority: fault.priority,
        issue_type: fault.id,
        machine_id: line?.id || ''
      } as any);
      setActiveRequest(report);
      updateProductionLine(id!, { status: 'maintenance' });
      toast.success(`${fault.id} alert dispatched to toolroom!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit fail report");
    } finally {
      setIsSubmittingMaintenance(false);
    }
  };

  const handleResolveAndon = async () => {
    if (activeRequest) {
      try {
        await maintenanceApi.updateFailureReport(activeRequest.id, { status: 'closed' });
        setActiveRequest(null);
        updateProductionLine(id!, { status: 'active' });
        toast.success('Andon nosozligi bartaraf etildi.');
      } catch (error) {
        console.error(error);
        setActiveRequest(null);
        updateProductionLine(id!, { status: 'active' });
      }
    }
  };

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

  const isTpa = line && line.type === 'tpa_molding';

  if (isTpa) {
    const isChangeoverActive = line.status === 'idle';
    const isMaintenanceActive = line.status === 'maintenance';
    const targetOutput = line.id === '5A' ? 2000 : 15000;
    const activeShift = todayPlan?.shift || 'No active plan';

    return (
      <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-mono relative overflow-hidden">
        {/* Blueprint Grid Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#a855f7_1px,transparent_1px),linear-gradient(to_bottom,#a855f7_1px,transparent_1px)] bg-[size:45px_45px]" />

        <div className="relative z-10 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6">
            <div className="space-y-4">
              <button
                onClick={() => navigate('/production-lines')}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-purple-400 transition-colors uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('productionDetail.backToLines')}
              </button>

              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]`}>
                  <Construction className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black tracking-tight text-white uppercase">{line.name}</h2>
                    <Badge className={`px-2.5 py-0.5 border text-[10px] font-black uppercase tracking-wider rounded-md ${
                      isMaintenanceActive 
                        ? 'bg-rose-950/60 border-rose-500/30 text-rose-400 animate-pulse'
                        : isChangeoverActive
                        ? 'bg-purple-950/60 border-purple-500/30 text-purple-400 animate-pulse'
                        : 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {isMaintenanceActive ? '⚠️ DOWNTIME ACTIVE' : isChangeoverActive ? '🔧 CHANGEOVER' : '🟢 HEALTHY'}
                    </Badge>
                  </div>
                  <p className="text-slate-500 font-mono text-xs tracking-wider mt-1.5 uppercase">
                    WORK_CENTER: TPA_MOLDING • ASSET_ID: {line.id} • COMPOUND: {materialCompound}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-2xl border border-slate-850">
              <Button
                onClick={() => handleStatusChange('active')}
                variant={line.status === 'active' ? 'default' : 'ghost'}
                className={`rounded-xl h-11 px-5 font-bold uppercase text-[10px] tracking-widest transition-all ${
                  line.status === 'active' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Start (Active)
              </Button>
              <Button
                onClick={() => handleStatusChange('idle')}
                variant={line.status === 'idle' ? 'default' : 'ghost'}
                className={`rounded-xl h-11 px-5 font-bold uppercase text-[10px] tracking-widest transition-all ${
                  line.status === 'idle' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4 mr-2" />
                Changeover (Idle)
              </Button>
              <Button
                onClick={() => handleStatusChange('maintenance')}
                variant={line.status === 'maintenance' ? 'destructive' : 'ghost'}
                className={`rounded-xl h-11 px-5 font-bold uppercase text-[10px] tracking-widest transition-all ${
                  line.status === 'maintenance' 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 animate-pulse' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Downtime (Fail)
              </Button>
            </div>
          </div>

          {/* OEE & Cycle Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Overall OEE', value: `${line.efficiency}%`, icon: <Gauge className="w-5 h-5" />, color: 'purple' },
              { label: 'Cycle Time', value: cycleTime, icon: <Clock className="w-5 h-5" />, color: 'cyan' },
              { label: 'Total Shots', value: shotCount.toLocaleString(), icon: <Activity className="w-5 h-5" />, color: 'emerald' },
              { label: 'Scrap Rate', value: `${line.tpaData?.scrapRate || 1.2}%`, icon: <CheckCircle2 className="w-5 h-5" />, color: 'rose' },
            ].map((kpi, i) => (
              <Card key={i} className="border border-slate-850 bg-slate-900/40 shadow-xl overflow-hidden relative group">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  kpi.color === 'purple' ? 'bg-purple-500' :
                  kpi.color === 'cyan' ? 'bg-cyan-500' :
                  kpi.color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">{kpi.label}</span>
                    <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${
                      kpi.color === 'purple' ? 'text-purple-400' :
                      kpi.color === 'cyan' ? 'text-cyan-400' :
                      kpi.color === 'emerald' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>{kpi.icon}</div>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-2xl font-black tracking-tight text-white">{kpi.value}</h4>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <TabsList className="bg-transparent p-0 gap-8">
                {['overview', 'materials', 'maintenance'].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 rounded-none h-10 px-0 font-black text-[11px] uppercase tracking-widest transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate(`/production-lines/${line.id}/tpa-cockpit`)}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-5 shadow-lg shadow-purple-500/20 font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <Activity className="w-4 h-4 mr-2" /> TPA Cockpit Console
                </Button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-6">
              {line.id === '5B' ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                  {/* 25-Machine Floor Matrix (Left Panel, 2/3) */}
                  <div className="xl:col-span-2 space-y-6">
                    {/* Search & Filter Ribbon */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
                      <div className="relative w-full sm:w-80">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                          🔍
                        </span>
                        <input
                          type="text"
                          value={tpaSearchQuery}
                          onChange={(e) => setTpaSearchQuery(e.target.value)}
                          placeholder="Search Machine, Mold ID, or Part Code..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-bold text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Summary:</span>
                        <Badge className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                          {tpaMachines.filter(m => m.status === 'running').length} RUNNING
                        </Badge>
                        <Badge className="bg-purple-950/40 border border-purple-500/20 text-purple-400 font-mono text-[10px]">
                          {tpaMachines.filter(m => m.status === 'changeover').length} Swapping
                        </Badge>
                        <Badge className="bg-rose-950/40 border border-rose-500/20 text-rose-400 font-mono text-[10px]">
                          {tpaMachines.filter(m => m.status === 'downtime').length} DOWN
                        </Badge>
                      </div>
                    </div>

                    {/* Machine Matrix Grid */}
                    {filteredMachines.length === 0 ? (
                      <div className="p-16 text-center bg-slate-900/20 border border-dashed border-slate-850 rounded-2xl">
                        <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No machines match query</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMachines.map((m) => {
                          const isSelected = m.id === selectedMachineId;
                          const progress = Math.min(100, Math.round((m.output / m.target) * 100));
                          
                          return (
                            <div
                              key={m.id}
                              onClick={() => setSelectedMachineId(m.id)}
                              className={`p-4 bg-slate-900/30 border rounded-xl cursor-pointer transition-all hover:bg-slate-900/50 hover:border-purple-500/40 ${
                                isSelected 
                                  ? 'border-purple-500 bg-slate-900/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                  : 'border-slate-850'
                              }`}
                            >
                              {/* Header Line */}
                              <div className="flex justify-between items-center mb-2.5">
                                <span className="font-black text-white text-xs font-mono">{m.name}</span>
                                <Badge className={`px-1.5 py-0.5 border text-[8px] font-black uppercase tracking-wider rounded ${
                                  m.status === 'running'
                                    ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                                    : m.status === 'changeover'
                                    ? 'bg-purple-950/40 border-purple-500/20 text-purple-400'
                                    : 'bg-rose-950/40 border-rose-500/20 text-rose-400'
                                }`}>
                                  {m.status === 'running' ? '🟢 RUNNING' : m.status === 'changeover' ? '🟡 CHANGEOVER' : '🔴 DOWNTIME'}
                                </Badge>
                              </div>

                              {/* Tooling & Recipe */}
                              <div className="space-y-1 text-[9px] font-bold text-slate-400 mb-3 uppercase tracking-wide">
                                <div>
                                  <span className="text-slate-500">Qolip ID:</span> <span className="text-white font-mono">{m.moldId}</span>
                                </div>
                                <div className="truncate">
                                  <span className="text-slate-500">Detal:</span> <span className="text-slate-300 font-sans">{m.partName}</span>
                                </div>
                              </div>

                              {/* Progress metrics */}
                              <div className="space-y-1.5 border-t border-slate-850/40 pt-2">
                                <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                  <span>Reja: {m.target.toLocaleString()}</span>
                                  <span className="text-purple-400">Quyildi: {m.output.toLocaleString()}</span>
                                </div>
                                <div className="relative h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850/50">
                                  <div
                                    className={`h-full rounded-full transition-all duration-350 ${
                                      m.status === 'downtime'
                                        ? 'bg-rose-500'
                                        : m.status === 'changeover'
                                        ? 'bg-purple-500'
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Machine Telemetry & Controls (Right Panel, 1/3) */}
                  <Card className="bg-slate-900/40 border-slate-850 sticky top-6">
                    <CardHeader className="border-b border-slate-850/50 pb-4">
                      <div>
                        <CardTitle className="text-sm font-black uppercase text-purple-400 tracking-wider flex items-center gap-2">
                          <span>⚙️ {selectedMachine.name} DIAGNOSTICS</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                          Real-time parameter stream & Andon controls
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-5">
                      {/* Telemetry Stream */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 text-xs">
                          <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Cycle Time</span>
                          <span className="text-cyan-400 font-black font-mono">{selectedMachine.cycleTime}s</span>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 text-xs">
                          <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Barrel Temp</span>
                          <span className="text-amber-500 font-black font-mono">{selectedMachine.barrelTemp}°C</span>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 text-xs">
                          <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Oil Temp</span>
                          <span className="text-slate-300 font-black font-mono">{selectedMachine.oilTemp}°C</span>
                        </div>
                        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850/60 text-xs">
                          <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Hydraulic Press</span>
                          <span className="text-emerald-400 font-black font-mono">{selectedMachine.injectionPressure} bar</span>
                        </div>
                      </div>

                      {/* Status Override */}
                      <div className="space-y-2 border-t border-slate-850/50 pt-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Operational State Override</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMachineStatusChange(selectedMachine.id, 'running')}
                            className={`flex-1 rounded-lg font-bold text-[9px] uppercase tracking-wider h-8 ${
                              selectedMachine.status === 'running'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-500/20'
                                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                            }`}
                          >
                            Running
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMachineStatusChange(selectedMachine.id, 'changeover')}
                            className={`flex-1 rounded-lg font-bold text-[9px] uppercase tracking-wider h-8 ${
                              selectedMachine.status === 'changeover'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow shadow-purple-500/20'
                                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                            }`}
                          >
                            Swap Mold
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMachineStatusChange(selectedMachine.id, 'downtime')}
                            className={`flex-1 rounded-lg font-bold text-[9px] uppercase tracking-wider h-8 ${
                              selectedMachine.status === 'downtime'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow shadow-rose-500/20 animate-pulse'
                                : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                            }`}
                          >
                            Downtime
                          </Button>
                        </div>
                      </div>

                      {/* Andon Maintenance Forms */}
                      <div className="border-t border-slate-850/50 pt-4 space-y-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Andon Diagnostics Dispatch</span>
                        {selectedMachine.activeAndonReport ? (
                          <div className="bg-rose-500/5 border-2 border-rose-500/20 rounded-2xl p-4 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse" />
                            <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                            <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider mb-1">
                              {selectedMachine.activeAndonReport.issue_type}
                            </h4>
                            <p className="text-[9px] text-slate-400 leading-tight mb-3">
                              {selectedMachine.activeAndonReport.description}
                            </p>
                            
                            <div className="bg-slate-950 py-2 rounded-lg border border-slate-850/80 mb-3 inline-block px-4">
                              <span className="text-[8px] text-slate-500 font-bold block uppercase tracking-wider">Elapsed time</span>
                              <span className="text-lg font-black font-mono text-rose-500 tabular-nums">
                                {formatElapsed(selectedMachine.activeAndonReport.created_at)}
                              </span>
                            </div>

                            <Button
                              onClick={() => handleTpaMachineAndonResolve(selectedMachine.id)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase h-8 rounded-lg transition-all"
                            >
                              Resolve Failure & Start TPA
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'BARREL OVERHEATING', label: 'BARREL FLUID HEAT', priority: 'high', desc: 'Critical thermal run in barrel heating band Zone 3.' },
                              { id: 'INJECTION PRESSURE DROP', label: 'PRESSURE DROP', priority: 'normal', desc: 'Hydraulic accumulator injection pressure below 110 bar.' },
                              { id: 'HYDRAULIC VALVE FAULT', label: 'HYDRAULIC VALVES', priority: 'normal', desc: 'Proportional stroke valve feedback loop mismatch.' },
                              { id: 'MOLD LOCK ERROR', label: 'MOLD CLAMP LOCK', priority: 'high', desc: 'Clamp toggle limit switch failed to engage.' }
                            ].map((fault) => (
                              <button
                                key={fault.id}
                                type="button"
                                onClick={() => handleTpaMachineAndonTrigger(selectedMachine.id, fault)}
                                className="p-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-rose-500/40 text-left rounded-lg transition-all active:scale-[0.98] flex flex-col justify-between min-h-[72px]"
                              >
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-wide truncate">{fault.label}</span>
                                <p className="text-[8px] text-slate-500 leading-normal mt-0.5 line-clamp-2">{fault.desc}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : isChangeoverActive ? (
                <div className="bg-slate-900/80 border-2 border-dashed border-purple-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                  <Wrench className="w-16 h-16 text-purple-400 animate-spin" />
                  <h3 className="text-2xl font-black text-purple-400 uppercase tracking-widest">
                    🔧 MOLD CHANGEOVER IN PROGRESS
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md uppercase font-bold leading-relaxed">
                    Tooling configuration swap active. Injection mold cylinders are disengaged and output is locked.
                  </p>
                  <Button 
                    onClick={() => handleStatusChange('active')}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase px-6 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95"
                  >
                    Complete Swap & Resume Production
                  </Button>
                </div>
              ) : line.id === '5A' ? (
                /* ══════════════════════════════════════════════════════════
                   KATTA TPA UCHASTKASI — 10-MACHINE HEAVY FLEET MATRIX
                   ID-5A: Door Trims & Inpanel High-Tonnage Injection Fleet
                   ══════════════════════════════════════════════════════════ */
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Fleet Header + Filter Ribbon */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                          ⚙️ HTPA Heavy Fleet Matrix
                          <span className="text-[9px] text-slate-500 font-bold normal-case tracking-normal">Katta TPA Uchastkasi — ID-5A</span>
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                          10 Active Heavy-Tonnage Injection Presses • Door Trims & Inpanel Components
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-72">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 text-xs">🔍</span>
                        <input
                          type="text"
                          id="htpa-fleet-search"
                          value={htpaSearchQuery}
                          onChange={(e) => setHtpaSearchQuery(e.target.value)}
                          placeholder="Search Heavy Asset, Mold Serial, or Core Part SKU..."
                          className="w-full pl-8 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-[10px] font-bold text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] px-2">
                          {htpaMachines.filter(m => m.status === 'running').length} ACTIVE
                        </Badge>
                        <Badge className="bg-amber-950/40 border border-amber-500/20 text-amber-400 font-mono text-[9px] px-2">
                          {htpaMachines.filter(m => m.status === 'changeover').length} SWAP
                        </Badge>
                        <Badge className="bg-rose-950/40 border border-rose-500/20 text-rose-400 font-mono text-[9px] px-2">
                          {htpaMachines.filter(m => m.status === 'downtime').length} DOWN
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Main 2-column layout: Grid + Deep-Dive Panel */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
                    {/* LEFT: 10-Machine Fleet Matrix Grid (5×2 layout) */}
                    <div className="xl:col-span-2 space-y-4">
                      {filteredHeavyMachines.length === 0 ? (
                        <div className="p-16 text-center bg-slate-900/20 border border-dashed border-slate-850 rounded-2xl">
                          <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No heavy machines match query</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {filteredHeavyMachines.map((m) => {
                            const isSelected = m.id === selectedHeavyMachineId;
                            const progress = Math.min(100, Math.round((m.output / m.target) * 100));
                            const statusLabel = m.status === 'running'
                              ? '🟢 ACTIVE PRODUCTION'
                              : m.status === 'changeover'
                              ? '🟡 CLAMP CHANGEOVER'
                              : '🔴 HYDRAULIC REPAIR';

                            const cardBorderClass = isSelected
                              ? 'border-orange-500 bg-slate-900/70 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                              : m.status === 'downtime'
                              ? 'border-rose-500/40 bg-slate-900/30'
                              : m.status === 'changeover'
                              ? 'border-amber-500/30 bg-slate-900/30'
                              : 'border-slate-850 bg-slate-900/30 hover:border-orange-500/40';

                            const progressColor = m.status === 'downtime'
                              ? 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
                              : m.status === 'changeover'
                              ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                              : progress >= 80
                              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                              : 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]';

                            return (
                              <div
                                key={m.id}
                                id={`htpa-card-${m.id.toLowerCase()}`}
                                onClick={() => setSelectedHeavyMachineId(m.id)}
                                className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-slate-900/50 ${cardBorderClass}`}
                              >
                                {/* Card Header: Machine ID + Status Tag */}
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-white text-sm font-mono tracking-wide">{m.id}</span>
                                      {isSelected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                                      )}
                                    </div>
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Heavy TPA Press</span>
                                  </div>
                                  <Badge className={`px-1.5 py-0.5 border text-[7.5px] font-black uppercase tracking-wide rounded ${
                                    m.status === 'running'
                                      ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                                      : m.status === 'changeover'
                                      ? 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                                      : 'bg-rose-950/40 border-rose-500/20 text-rose-400 animate-pulse'
                                  }`}>
                                    {statusLabel}
                                  </Badge>
                                </div>

                                {/* Tooling Rig ID */}
                                <div className="space-y-1 text-[8.5px] font-bold text-slate-400 mb-3 bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-850/40">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Qolip ID:</span>
                                    <span className="text-orange-400 font-mono font-black">{m.moldId}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Detal:</span>
                                    <span className="text-slate-200 font-sans text-right truncate max-w-[130px]">{m.partName}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Compound:</span>
                                    <span className="text-purple-300 truncate max-w-[130px]">{m.compound}</span>
                                  </div>
                                </div>

                                {/* Plan vs Fact Progress */}
                                <div className="space-y-1.5 border-t border-slate-850/40 pt-2.5">
                                  <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span>Reja: {m.target.toLocaleString()} Pcs</span>
                                    <span className="text-orange-400">Quyildi: {m.output.toLocaleString()} Pcs</span>
                                  </div>
                                  <div className="relative h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850/50">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[7.5px] font-bold text-slate-600 uppercase">
                                    <span>Sikl: {m.cycleTime}s/unit</span>
                                    <span className="text-slate-400">{progress}% Complete</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Machine Deep-Dive Analytics Panel */}
                    <Card className="relative overflow-hidden bg-slate-900/50 border-slate-850 xl:sticky xl:top-6 animate-in slide-in-from-right duration-300">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500" />

                      <CardHeader className="border-b border-slate-850/50 pb-4 pt-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-2">
                              ⚙️ {selectedHeavyMachine?.id} DEEP DIAGNOSTICS
                            </CardTitle>
                            <CardDescription className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                              Granular analytics • Click any card to drill down
                            </CardDescription>
                          </div>
                          <Badge className={`px-1.5 py-0.5 border text-[7.5px] font-black uppercase rounded ${
                            selectedHeavyMachine?.status === 'running'
                              ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                              : selectedHeavyMachine?.status === 'changeover'
                              ? 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                              : 'bg-rose-950/40 border-rose-500/20 text-rose-400 animate-pulse'
                          }`}>
                            {selectedHeavyMachine?.status?.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        {/* Tooling Info Block */}
                        <div className="bg-slate-950/60 rounded-xl border border-slate-850/50 p-3 space-y-2">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Active Tooling Rig</span>
                          <div className="text-xs font-black text-orange-400 font-mono">{selectedHeavyMachine?.moldId}</div>
                          <div className="text-[9px] text-slate-300 font-bold">{selectedHeavyMachine?.partName}</div>
                          <div className="text-[8.5px] text-purple-300">{selectedHeavyMachine?.compound}</div>
                        </div>

                        {/* Live Telemetry Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-rose-500/20 text-center">
                            <span className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Barrel Melt Temp</span>
                            <span className="text-base font-black text-rose-400 font-mono">{selectedHeavyMachine?.barrelTemp}°C</span>
                            <div className="mt-1 h-0.5 w-full bg-slate-900 rounded-full">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, ((selectedHeavyMachine?.barrelTemp || 0) - 200) / 60 * 100)}%` }} />
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-cyan-500/20 text-center">
                            <span className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Clamping Force</span>
                            <span className="text-base font-black text-cyan-400 font-mono">{selectedHeavyMachine?.clampForce}T</span>
                            <div className="mt-1 h-0.5 w-full bg-slate-900 rounded-full">
                              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, ((selectedHeavyMachine?.clampForce || 0) / 1500 * 100))}%` }} />
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-amber-500/20 text-center">
                            <span className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Injection Press.</span>
                            <span className="text-base font-black text-amber-400 font-mono">{selectedHeavyMachine?.injectionPressure} bar</span>
                            <div className="mt-1 h-0.5 w-full bg-slate-900 rounded-full">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, ((selectedHeavyMachine?.injectionPressure || 0) / 250 * 100))}%` }} />
                            </div>
                          </div>
                          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-emerald-500/20 text-center">
                            <span className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">Live Cycle Speed</span>
                            <span className="text-base font-black text-emerald-400 font-mono">{selectedHeavyMachine?.cycleTime}s</span>
                            <div className="mt-1 h-0.5 w-full bg-slate-900 rounded-full">
                              <div className="h-full bg-emerald-500 rounded-full w-[68%]" />
                            </div>
                          </div>
                        </div>

                        {/* Polymer Consumption */}
                        <div className="bg-slate-950/50 rounded-xl border border-purple-500/20 p-3 space-y-1.5">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Raw Polymer Consumed (Shift)</span>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-purple-400 font-mono">{selectedHeavyMachine?.polymerConsumed?.toLocaleString() || 0} kg</span>
                            <Badge className="bg-purple-950/40 border border-purple-500/20 text-purple-300 text-[8px]">PP-Grade-A</Badge>
                          </div>
                        </div>

                        {/* Plan vs Fact */}
                        <div className="space-y-2 bg-slate-950/40 rounded-xl border border-slate-850/40 p-3">
                          <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-wider">
                            <span>Reja (Target)</span>
                            <span>Quyildi (Fact)</span>
                          </div>
                          <div className="flex justify-between items-end">
                            <span className="text-lg font-black text-white font-mono">{selectedHeavyMachine?.target?.toLocaleString()}</span>
                            <span className="text-lg font-black text-orange-400 font-mono">{selectedHeavyMachine?.output?.toLocaleString()}</span>
                          </div>
                          <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                            <div
                              className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(100, Math.round(((selectedHeavyMachine?.output || 0) / (selectedHeavyMachine?.target || 1)) * 100))}%` }}
                            />
                          </div>
                          <div className="text-right text-[8px] font-black text-orange-400">
                            {Math.min(100, Math.round(((selectedHeavyMachine?.output || 0) / (selectedHeavyMachine?.target || 1)) * 100))}% Yield
                          </div>
                        </div>

                        {/* Andon Controls */}
                        <div className="border-t border-slate-850/50 pt-3 space-y-3">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">State Override + Andon Dispatch</span>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleHeavyMachineStatusChange(selectedHeavyMachine?.id || '', 'running')}
                              className={`flex-1 rounded-lg font-bold text-[8px] uppercase tracking-wider h-7 ${
                                selectedHeavyMachine?.status === 'running'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                              }`}
                            >
                              Active
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleHeavyMachineStatusChange(selectedHeavyMachine?.id || '', 'changeover')}
                              className={`flex-1 rounded-lg font-bold text-[8px] uppercase tracking-wider h-7 ${
                                selectedHeavyMachine?.status === 'changeover'
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                              }`}
                            >
                              Swap Mold
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleHeavyMachineStatusChange(selectedHeavyMachine?.id || '', 'downtime')}
                              className={`flex-1 rounded-lg font-bold text-[8px] uppercase tracking-wider h-7 ${
                                selectedHeavyMachine?.status === 'downtime'
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                                  : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-white'
                              }`}
                            >
                              Downtime
                            </Button>
                          </div>

                          {selectedHeavyMachine?.activeAndonReport ? (
                            <div className="bg-rose-500/5 border-2 border-rose-500/20 rounded-xl p-3 text-center relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse" />
                              <AlertTriangle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
                              <p className="text-[9px] font-black text-rose-400 uppercase">{selectedHeavyMachine.activeAndonReport.issue_type}</p>
                              <p className="text-[8px] text-slate-500 mt-1 leading-tight">{selectedHeavyMachine.activeAndonReport.description}</p>
                              <div className="mt-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-850 inline-block">
                                <span className="text-[7px] text-slate-500 font-bold block uppercase">ELAPSED</span>
                                <span className="text-sm font-black font-mono text-rose-500 tabular-nums">{formatElapsed(selectedHeavyMachine.activeAndonReport.created_at)}</span>
                              </div>
                              <Button
                                onClick={() => handleHtpaAndonResolve(selectedHeavyMachine.id)}
                                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[8px] uppercase h-7 rounded-lg"
                              >
                                ✅ Resolve & Resume Press
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { id: 'HYDRAULIC CLAMP FAULT', label: 'HOSE CLAMP FAULT', priority: 'critical', desc: 'Heavy clamp cylinder pressure collapsed below 600T.' },
                                { id: 'BARREL OVERHEATING', label: 'BARREL OVERHEAT', priority: 'high', desc: 'Critical thermal run in barrel heating band Zone 3.' },
                                { id: 'MOLD LOCK ERROR', label: 'MOLD LOCK ERR', priority: 'high', desc: 'Clamp toggle limit switch failed to engage.' },
                                { id: 'EJECTOR PIN FAULT', label: 'EJECTOR FAULT', priority: 'normal', desc: 'Ejector pin travel sensor mismatch on forward stroke.' },
                              ].map((fault) => (
                                <button
                                  key={fault.id}
                                  type="button"
                                  onClick={() => handleHtpaAndonTrigger(selectedHeavyMachine?.id || '', fault)}
                                  className="p-2 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-rose-500/40 text-left rounded-lg transition-all active:scale-95 flex flex-col min-h-[55px]"
                                >
                                  <span className="text-[8px] font-black text-rose-400 uppercase leading-tight">{fault.label}</span>
                                  <p className="text-[7px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{fault.desc}</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active Mold Injection Ledger */}
                  <Card className="lg:col-span-2 bg-slate-900/40 border-slate-850">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-850/50 pb-4">
                      <div>
                        <CardTitle className="text-sm font-black uppercase text-purple-400 tracking-wider flex items-center gap-2">
                          <span>🔌 ACTIVE MOLD INJECTION LEDGER</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                          Tooling setup registry and real-time cycle diagnostics
                        </CardDescription>
                      </div>
                      <Badge className="bg-purple-950/40 border border-purple-500/20 text-purple-400 text-[10px] font-mono">{activeShift}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/50 p-5 rounded-2xl border border-slate-850/50">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Mold Code</span>
                          <p className="text-xl font-black text-white">{moldCode}</p>
                        </div>
                        <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-850/80 py-4 md:py-0 md:px-6">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Shot Counter</span>
                          <p className="text-xl font-black text-purple-400">{shotCount.toLocaleString()} <span className="text-[10px] text-slate-500 font-medium">strokes</span></p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cycle Time</span>
                          <p className="text-xl font-black text-cyan-400">{cycleTime}</p>
                        </div>
                      </div>

                      {/* Changeover Countdown Visualizer */}
                      <div className="space-y-3 p-5 bg-slate-950/40 rounded-2xl border border-slate-850/40">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Changeover Matrix Swap Countdown</span>
                          <span className="text-sm font-black text-purple-400">{changeoverRemaining.toLocaleString()} shots remaining</span>
                        </div>
                        <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (changeoverRemaining / 5000) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Tool swapped</span>
                          <span>Planned swap: 5,000 max shots limit</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Standard TPA Card Metrics */}
                  <Card className="bg-slate-900/40 border-slate-850">
                    <CardHeader className="border-b border-slate-850/50 pb-4">
                      <CardTitle className="text-sm font-black uppercase text-purple-400 tracking-wider">Shift Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase">Production Target</span>
                          <span className="font-black text-white">{targetOutput} Pcs</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase">Shift Completed</span>
                          <span className="font-black text-purple-300">{line.output} Pcs</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase">Current Efficiency</span>
                          <span className="font-black text-emerald-400">{line.efficiency}%</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-850/50 space-y-3">
                        <div className="flex justify-between items-end text-[10px] font-bold uppercase text-slate-500">
                          <span>Completion Progress</span>
                          <span className="text-purple-400 text-xs font-black">{Math.min(100, Math.round((line.output / targetOutput) * 100))}%</span>
                        </div>
                        <Progress value={Math.min(100, Math.round((line.output / targetOutput) * 100))} className="h-2.5 bg-slate-950 border border-slate-850" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: MATERIALS */}
            <TabsContent value="materials" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Raw Granule Hopper Tracker */}
                <Card className="bg-slate-900/40 border-slate-850">
                  <CardHeader className="border-b border-slate-850/50 pb-4">
                    <CardTitle className="text-sm font-black uppercase text-purple-400 tracking-wider">
                      Hopper Raw Material Feed Tracker
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      Automated raw plastic granule feeding system status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-950/30 p-5 rounded-2xl border border-slate-850/50">
                      {/* Fluid Capacity Meter Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-850" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className={`${line.id === '5A' ? 'text-emerald-500 drop-shadow-[0_0_8px_#10b981]' : 'text-amber-500 drop-shadow-[0_0_8px_#f59e0b]'} transition-all`} strokeWidth="3" strokeDasharray={`${hopperCapacity}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-base font-black text-white">{hopperCapacity}%</span>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">Hopper</span>
                        </div>
                      </div>

                      <div className="space-y-3 flex-1">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Raw Compound ID</span>
                          <span className="text-sm font-black text-white uppercase">{materialCompound}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Feed Status</span>
                          <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${hopperColor}`}>
                            {hopperStatusText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850/40 text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                      💡 SYSTEM INFO: Storage hoppers are automatically refilled by the central raw material logistics pipeline upon reaching critical thresholds (&lt; 20%).
                    </div>
                  </CardContent>
                </Card>

                {/* WIP Logistics Buffer & Teleshka */}
                <Card className="bg-slate-900/40 border-slate-850">
                  <CardHeader className="border-b border-slate-850/50 pb-4">
                    <CardTitle className="text-sm font-black uppercase text-purple-400 tracking-wider">
                      WIP Trolley Logistics Staging Buffer
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      Molding output transport buffer synchronized with Assembly lines
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-850/50 flex justify-between items-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Buffer Target ID SKU</span>
                        <span className="text-base font-black text-white uppercase">{targetBufferId}</span>
                        <span className="text-[10px] font-bold text-slate-400 block mt-1">
                          {line.id === '5A' ? 'Door Trim Base Plate' : 'Switch Frame Bracket'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Central Stock Balance</span>
                        <span className="text-2xl font-black text-purple-400 tabular-nums">
                          {targetBufferItem?.quantity || 0} <span className="text-xs text-slate-500 font-medium">units</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 block mt-1">
                          ({targetBufferItem?.teleshka || 0} transport carts)
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleTeleshkaFilled}
                      className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-purple-500/10 active:scale-95 flex items-center justify-center gap-2 border border-purple-500/20"
                    >
                      🛞 TELESHKA TO'LDI (BOX COMPLETED)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: MAINTENANCE (ANDON LINK) */}
            <TabsContent value="maintenance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-slate-900/40 border-slate-850">
                  <CardHeader className="border-b border-slate-850/50 pb-4">
                    <CardTitle className="text-sm font-black uppercase text-rose-500 tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-500" />
                      Andon Parameter Diagnostics Panel
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      Zero-typing maintenance dispatches for injection molding faults
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {activeRequest ? (
                      <div className="bg-rose-500/5 border-2 border-rose-500/20 rounded-[30px] p-8 text-center animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 animate-pulse" />
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="w-10 h-10 text-rose-500 mb-4" />
                          <h3 className="text-2xl font-black text-rose-500 uppercase tracking-widest mb-1">Downtime Alert Dispatched</h3>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-6">Toolroom engineering crew alerted</p>

                          <div className="bg-slate-950 px-8 py-4 rounded-2xl border border-slate-850 shadow-inner inline-block">
                            <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mb-1">Downtime Clock</span>
                            <span className="text-4xl font-black font-mono text-rose-500 tabular-nums">{formatElapsed(activeRequest.created_at)}</span>
                          </div>

                          <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-sm text-left">
                            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850/60 text-xs">
                              <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Diagnostics ID</span>
                              <span className="text-white font-bold">{activeRequest.issue_type}</span>
                            </div>
                            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850/60 text-xs">
                              <span className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Priority</span>
                              <span className="text-rose-400 font-bold uppercase">{activeRequest.priority}</span>
                            </div>
                          </div>
                          <Button 
                            onClick={handleResolveAndon}
                            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase px-5 py-2 rounded-xl transition-all"
                          >
                            Resolve Andon & Resume Production
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                            Click to activate Molding Failure Dispatch:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { id: 'BARREL OVERHEATING', label: '⚠️ BARREL OVERHEATING', priority: 'high', desc: 'Critical thermal run detected in heating zone 3.' },
                              { id: 'INJECTION PRESSURE DROP', label: '⚠️ INJECTION PRESSURE DROP', priority: 'normal', desc: 'Hydraulic accumulator pressure below nominal.' },
                              { id: 'HYDRAULIC VALVE FAULT', label: '🔧 HYDRAULIC VALVE FAULT', priority: 'normal', desc: 'Proportional valve feedback mismatch.' },
                              { id: 'MOLD LOCK ERROR', label: '❌ MOLD LOCK ERROR', priority: 'high', desc: 'Clamp toggle limit switch failed to engage.' }
                            ].map((fault) => (
                              <button
                                key={fault.id}
                                type="button"
                                disabled={isSubmittingMaintenance}
                                onClick={() => handleTpaMaintenanceSubmit(fault)}
                                className="p-4 bg-slate-950/60 hover:bg-slate-900 border-2 border-slate-850 hover:border-rose-500/40 text-left rounded-xl transition-all active:scale-[0.98] flex flex-col justify-between min-h-[100px]"
                              >
                                <span className="text-xs font-black text-rose-500 uppercase tracking-wide">{fault.label}</span>
                                <p className="text-[10px] text-slate-400 mt-1">{fault.desc}</p>
                                <span className="text-[8px] font-bold text-slate-500 uppercase mt-2">Priority: {fault.priority}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* History Shelf */}
                <Card className="bg-slate-900/40 border-slate-850">
                  <CardHeader className="border-b border-slate-850/50 pb-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-purple-400">
                      SLA Resolutions History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-850">
                      {[
                        { type: 'MOLD LOCK ERROR', time: '3 hours ago', desc: `Active Mold Code: ${moldCode} - Clamp lock switch adjusted.`, priority: 'high' },
                        { type: 'HYDRAULIC VALVE FAULT', time: 'Yesterday', desc: 'Proportional valve feedback re-calibrated.', priority: 'normal' },
                        { type: 'BARREL OVERHEATING', time: '3 days ago', desc: 'Heating band Zone 3 replaced.', priority: 'high' }
                      ].map((h, idx) => (
                        <div key={idx} className="p-4 hover:bg-slate-950/20 transition-colors text-[11px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-black uppercase ${h.priority === 'high' ? 'text-rose-400' : 'text-purple-400'}`}>
                              {h.type}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">{h.time}</span>
                          </div>
                          <p className="text-slate-300 font-semibold leading-tight">{h.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

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
