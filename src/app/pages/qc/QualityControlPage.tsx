import React, { useMemo, useState, useEffect } from 'react';
import { useFactory, ProductionLine } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle, AlertTriangle, XCircle, Factory, Plus,
  AlertOctagon, Activity, TrendingUp, TrendingDown,
  Download, BarChart3, PieChart, LineChart, FileText,
  Shield, Target, QrCode, Clock, User, UserPlus,
  Search, Info, PenTool, Lock, Unlock,
  RotateCcw, MousePointer2, Camera, Send, Zap
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import {
  BarChart,
  Bar,
  LineChart as QCLineChart,
  Line,
  PieChart as QCPieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ComposedChart
} from 'recharts';
import { toast } from 'sonner';
import { QRScanner } from '../../components/qc/QRScanner';
import { QCLineStatusPanel, QCInspectorAssignment } from '../../components/qc/QCLineStatusPanel';
import { hrEmployees } from '../../data/hrEmployees';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useQC,
  QCInspectionType,
  QCSeverity,
  QCDecision,
  QCDefectCategory,
  QCInspection
} from '../../context/QCContext';

const DEFECT_CODES = [
  { id: 'QC-101', name: 'Surface Scratch', category: 'Cosmetic' },
  { id: 'QC-102', name: 'Paint Blister', category: 'Cosmetic' },
  { id: 'QC-103', name: 'Color Mismatch', category: 'Cosmetic' },
  { id: 'QC-201', name: 'Housing Dent', category: 'Structural' },
  { id: 'QC-202', name: 'Crack / Fracture', category: 'Structural' },
  { id: 'QC-203', name: 'Deformation', category: 'Structural' },
  { id: 'QC-301', name: 'Wiring Fault', category: 'Functional' },
  { id: 'QC-302', name: 'PCB Short Circuit', category: 'Functional' },
  { id: 'QC-303', name: 'Missing Component', category: 'Functional' },
  { id: 'QC-401', name: 'Label Misprint', category: 'Other' },
];

export function QualityControlPage() {
  const { productionLines, updateProductionLine, materials } = useFactory();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { inspections, addInspection, updateInspection } = useQC();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [inspectorAssignments, setInspectorAssignments] = useState<Record<string, QCInspectorAssignment>>({});
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLineForAssign, setSelectedLineForAssign] = useState<string | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [inspectionToApprove, setInspectionToApprove] = useState<QCInspection | null>(null);

  // Live Inspection Form State
  const [qrLineId, setQrLineId] = useState<string>('');
  const [qrDefectCode, setQrDefectCode] = useState<string>('QC-101');
  const [qrNote, setQrNote] = useState('');
  const [qrPhoto, setQrPhoto] = useState<string | null>(null);
  const [markupPoints, setMarkupPoints] = useState<{ x: number; y: number }[]>([]);
  const [isInpanelMode, setIsInpanelMode] = useState(false);
  const [defectiveUnits, setDefectiveUnits] = useState<number[]>([]);

  const handleQuickReportPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrPhoto(URL.createObjectURL(file));
      toast.success('Rasm yuklandi');
    }
  };

  const handlePhotoMarkup = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!qrPhoto) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMarkupPoints(prev => [...prev, { x, y }]);
  };

  const toggleDefectiveUnit = (unit: number) => {
    setDefectiveUnits(prev =>
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const handleBrakAction = (decision: 'SCRAP' | 'REPAIR' | 'HOLD') => {
    if (!qrLineId) {
      toast.error('Liniya majburiy!');
      return;
    }
    if (!isInpanelMode && !qrPhoto) {
      toast.error('Dalil rasm yoki SAP Inpanel audit majburiy!');
      return;
    }

    const selectedCode = DEFECT_CODES.find(c => c.id === qrDefectCode);
    const cat = (selectedCode?.category as QCDefectCategory) || 'Cosmetic';
    let severity: QCSeverity = 'MINOR';
    if (decision === 'SCRAP' || decision === 'HOLD') severity = 'CRITICAL';
    if (decision === 'REPAIR') severity = 'MAJOR';

    const line = productionLines.find(l => l.id === qrLineId);
    if (!line) return;

    const newInspection: QCInspection = {
      id: Date.now().toString(),
      lineId: qrLineId,
      lineName: line.name,
      date: new Date().toISOString().split('T')[0],
      inspector: inspectorAssignments[qrLineId]?.inspectorName || 'Floor Operator',
      defectTypes: [{ type: selectedCode?.name || qrDefectCode, count: isInpanelMode ? defectiveUnits.length : 1 }],
      totalDefects: isInpanelMode ? defectiveUnits.length : 1,
      status: decision === 'HOLD' ? 'rejected' : 'pending',
      inspectionType: isInpanelMode ? 'BIN_AUDIT' : 'IN_PROCESS',
      severity,
      category: cat,
      lineStatus: decision === 'HOLD' ? 'HOLD' : 'RUNNING',
      notes: `[${decision}] ${qrDefectCode}: ${qrNote}`,
      defectCode: qrDefectCode,
      markupPoints,
      defectiveUnits: isInpanelMode ? defectiveUnits : undefined,
      samplingList: isInpanelMode ? defectiveUnits : undefined,
    };

    addInspection(newInspection);

    if (decision === 'HOLD') {
      updateProductionLine(line.id, { status: 'maintenance' });
      toast.error(`🚨 SITE-WIDE ALARM: LINE HOLD INITIATED — ${line.name}`, { duration: 8000 });
    } else if (decision === 'REPAIR') {
      toast.warning(`🔧 REWORK TICKET GENERATED — ${qrDefectCode}: ${selectedCode?.name}. Supervisor notified.`, { duration: 6000 });
    } else if (decision === 'SCRAP') {
      toast.info(`🗑️ WASTE MANAGEMENT LOG UPDATED — Unit flagged for physical disposal.`, { duration: 6000 });
    }

    // Reset
    setQrLineId('');
    setQrNote('');
    setQrPhoto(null);
    setMarkupPoints([]);
    setDefectiveUnits([]);
    setIsInpanelMode(false);
  };


  const handleMobileAddDefect = (lineId: string, category: any, severity: any, total: number, note: string) => {
    const line = productionLines.find(l => l.id === lineId);
    if (!line) return;

    const newInspec: QCInspection = {
      id: Date.now().toString(),
      lineId,
      lineName: line.name,
      date: new Date().toISOString().split('T')[0],
      inspector: inspectorAssignments[lineId]?.inspectorName || 'Mobile Operator',
      defectTypes: [{ type: category, count: total }],
      totalDefects: total,
      status: 'pending',
      inspectionType: 'IN_PROCESS',
      severity: severity,
      category: category,
      lineStatus: 'RUNNING',
      notes: note
    };
    addInspection(newInspec);
  };;

  const handleMobileBinAudit = (lineId: string, results: any[]) => {
    const line = productionLines.find(l => l.id === lineId);
    if (!line) return;
    const defects = results.filter(r => r.status === 'Defect').length;
    const severity = defects > 1 ? 'MAJOR' : 'MINOR';
    const status = defects > 1 ? 'rejected' : 'approved';

    const newInspec: QCInspection = {
      id: Date.now().toString(),
      lineId,
      lineName: line.name,
      date: new Date().toISOString().split('T')[0],
      inspector: inspectorAssignments[lineId]?.inspectorName || 'Mobile Operator',
      defectTypes: [{ type: 'AQL Bin Audit', count: defects }],
      totalDefects: defects,
      status: status,
      inspectionType: 'BIN_AUDIT',
      severity: severity,
      category: 'Functional',
      lineStatus: defects > 1 ? 'HOLD' : 'RUNNING',
      samplingList: results.map(r => r.unitId),
      defectiveUnits: results.filter(r => r.status === 'Defect').map(r => r.unitId)
    };
    addInspection(newInspec);
  };

  // Stats & Analytics
  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      case 'MAJOR': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };
  const paretoData = useMemo(() => {
    const counts: Record<string, number> = {};
    inspections.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + i.totalDefects;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const total = sorted.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;

    return sorted.map(item => {
      cumulative += item.value;
      return {
        ...item,
        percentage: total > 0 ? (cumulative / total) * 100 : 0
      };
    });
  }, [inspections]);

  // AQL Sampling Logic (AQL 2.5 for 100 units = 8 samples)
  const generateSampling = (binSize: number = 100, sampleSize: number = 8) => {
    const samples: number[] = [];
    while (samples.length < sampleSize) {
      const r = Math.floor(Math.random() * binSize) + 1;
      if (!samples.includes(r)) samples.push(r);
    }
    return samples.sort((a, b) => a - b);
  };

  const handleCreateInspection = (lineId: string, type: QCInspectionType = 'IN_PROCESS') => {
    const line = productionLines.find(l => l.id === lineId);
    if (!line) return;

    const newInspection: QCInspection = {
      id: Date.now().toString(),
      lineId,
      lineName: line.name,
      date: new Date().toISOString().split('T')[0],
      inspector: inspectorAssignments[lineId]?.inspectorName || 'Unassigned',
      defectTypes: [],
      totalDefects: 0,
      status: 'pending',
      inspectionType: type,
      severity: 'MINOR',
      category: 'Cosmetic',
      lineStatus: 'RUNNING',
      samplingList: type === 'BIN_AUDIT' ? generateSampling() : undefined
    };

    addInspection(newInspection);
    toast.success(`${type} started for ${line.name}`);
  };

  const liftHold = (inspectionId: string) => {
    const inspection = inspections.find(i => i.id === inspectionId);
    if (!inspection) return;

    setInspectionToApprove(inspection);
    setIsApprovalDialogOpen(true);
  };

  const confirmLiftHold = () => {
    if (!inspectionToApprove) return;

    updateInspection(inspectionToApprove.id, {
      lineStatus: 'RUNNING',
      managerApproved: true
    });
    updateProductionLine(inspectionToApprove.lineId, { status: 'active' });

    toast.success(`Production resumed on ${inspectionToApprove.lineName}. Authorization: MANAGER_SIG_882`);
    setIsApprovalDialogOpen(false);
    setInspectionToApprove(null);
  };

  const [activeTab, setActiveTab] = useState((location.state as any)?.activeTab || 'overview');

  useEffect(() => {
    if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-950 font-sans selection:bg-rose-500/30">
      {/* Header with Persistent Floating Scan */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Shield className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Quality Command Center</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live SAP QM Monitoring Gateway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Active Inspections</span>
              <span className="text-xl font-black text-amber-500 leading-none">{inspections.filter(i => i.status === 'pending').length}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">System Integrity</span>
              <span className="text-xl font-black text-cyan-500 leading-none">99.8%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Floating QR Trigger */}
      <button
        onClick={() => setIsQRScannerOpen(true)}
        className="fixed bottom-10 right-10 z-50 w-16 h-16 bg-rose-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <QrCode className="w-8 h-8 relative z-10" />
        <span className="absolute -top-12 right-0 bg-slate-900 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Floor Scan</span>
      </button>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <Activity className="w-4 h-4" />
            Line Monitor
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4" />
            Pareto Intelligence
          </TabsTrigger>
          <TabsTrigger value="inspections" className="flex items-center gap-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white">
            <FileText className="w-4 h-4" />
            Audit History
          </TabsTrigger>
          <TabsTrigger value="live-inspection" className="flex items-center gap-2 data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-900 bg-cyan-500/10 text-cyan-500 ml-auto border border-cyan-500/20">
            <Camera className="w-4 h-4" />
            Live Inspection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {productionLines.map(line => {
                const assignment = inspectorAssignments[line.id];
                const activeInspec = inspections.find(i => i.lineId === line.id && i.status === 'pending');
                const isLocked = activeInspec?.lineStatus === 'HOLD';

                return (
                  <Card key={line.id} className={`overflow-hidden transition-all duration-500 ${isLocked ? 'border-rose-500 ring-4 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'}`}>
                    <CardHeader className={`pb-3 ${isLocked ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Factory className={`w-5 h-5 ${isLocked ? 'text-white' : 'text-slate-400'}`} />
                          <h3 className="font-black text-sm uppercase italic tracking-tighter">{line.name}</h3>
                        </div>
                        <Badge className={`${isLocked ? 'bg-white text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          {isLocked ? 'LOCKED' : 'MONITORED'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Inspector Assignment */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden">
                            {assignment ? (
                              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.inspectorName)}&background=rose&color=fff`} alt="Avatar" />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Assigned Inspector</p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{assignment?.inspectorName || 'NO ASSIGNMENT'}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedLineForAssign(line.id); setIsAssignModalOpen(true); }}
                          className="h-8 w-8 p-0 hover:bg-rose-500/10 hover:text-rose-500"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="text-[10px] font-black uppercase border-slate-200 dark:border-slate-800 h-10"
                          onClick={() => handleCreateInspection(line.id)}
                          disabled={isLocked}
                        >
                          <PenTool className="w-3 h-3 mr-2" /> Inline Audit
                        </Button>
                        <Button
                          variant="outline"
                          className="text-[10px] font-black uppercase text-cyan-500 border-cyan-500/20 bg-cyan-500/5 h-10 hover:bg-cyan-500/10"
                          onClick={() => handleCreateInspection(line.id, 'BIN_AUDIT')}
                          disabled={isLocked}
                        >
                          <RotateCcw className="w-3 h-3 mr-2" /> Bin-Audit [100]
                        </Button>
                      </div>

                      {isLocked && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <AlertOctagon className="w-5 h-5 text-rose-500" />
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Awaiting QC Manager Signature</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => liftHold(activeInspec.id)}
                            className="bg-rose-500 text-white hover:bg-rose-600 h-7 text-[9px]"
                          >
                            <Lock className="w-3 h-3 mr-1" /> Authorize Release
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <CardHeader className="bg-slate-950 pb-2">
                  <CardTitle className="text-xs font-black text-amber-500 flex items-center gap-2 uppercase">
                    <AlertTriangle className="w-4 h-4" /> Defect Distribution by Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {DEFECT_CODES.map(code => {
                    const count = inspections.filter(i => i.defectCode === code.id).reduce((s, i) => s + i.totalDefects, 0);
                    const total = Math.max(1, inspections.reduce((s, i) => s + i.totalDefects, 0));
                    return (
                      <div key={code.id} className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-600 w-14 shrink-0">{code.id}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(count / total) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-white w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                  {inspections.filter(i => i.defectCode).length === 0 && (
                    <p className="text-[10px] text-slate-600 italic text-center py-4">No coded defects recorded yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-500" /> AQL 2.5 Standard (ISO-2859)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-[10px] text-slate-500 font-medium space-y-3">
                  <p>For SAP Inpanel mass production, we employ the <strong className="text-slate-900 dark:text-slate-300">ISO-2859-1 Sampling Standard</strong>.</p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 list-disc">
                    <li className="mb-1"><strong>Lot Size:</strong> 91-150 units (Bin Size: 100)</li>
                    <li className="mb-1"><strong>Sample Size:</strong> 8 Random samples</li>
                    <li className="mb-1 text-green-500"><strong>Accept (Ac):</strong> 0-1 Defects</li>
                    <li className="text-rose-500"><strong>Reject (Re):</strong> 2+ Defects</li>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {(() => {
            // Build Pareto data from live inspections
            const categoryCounts: Record<string, { count: number; lines: Record<string, number> }> = {};
            inspections.forEach(insp => {
              const cat = insp.defectCode || insp.category;
              if (!categoryCounts[cat]) categoryCounts[cat] = { count: 0, lines: {} };
              categoryCounts[cat].count += insp.totalDefects;
              const ln = insp.lineName;
              categoryCounts[cat].lines[ln] = (categoryCounts[cat].lines[ln] || 0) + insp.totalDefects;
            });

            const sorted = Object.entries(categoryCounts).sort((a, b) => b[1].count - a[1].count);
            const grandTotal = sorted.reduce((s, [, v]) => s + v.count, 0) || 1;
            let cumSum = 0;
            const paretoData = sorted.map(([name, val]) => {
              cumSum += val.count;
              const topLine = Object.entries(val.lines).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
              return { name, value: val.count, percentage: Math.round((cumSum / grandTotal) * 100), topLine, lines: val.lines };
            });

            // Static AI insights derived from data
            const topCat = sorted[0]?.[0] || 'N/A';
            const topCatPct = grandTotal > 0 ? Math.round(((sorted[0]?.[1].count || 0) / grandTotal) * 100) : 0;
            const critCount = inspections.filter(i => i.severity === 'CRITICAL').length;
            const holdCount = inspections.filter(i => i.lineStatus === 'HOLD').length;

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Pareto Chart */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="bg-slate-950 border-slate-800">
                    <CardHeader className="pb-2 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                          <BarChart3 className="w-5 h-5 text-rose-500" />
                          Defect Pareto Intelligence — 80/20 Rule
                        </CardTitle>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-rose-600 to-rose-400" />
                            <span className="text-[9px] font-black uppercase text-slate-500">Defect Count</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-1 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/60" />
                            <span className="text-[9px] font-black uppercase text-slate-500">Cumulative %</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {paretoData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-600 text-xs font-bold uppercase">No inspection data yet</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={380}>
                          <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                            <defs>
                              <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fb7185" />
                                <stop offset="100%" stopColor="#e11d48" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#1e293b" />
                            <XAxis
                              dataKey="name"
                              fontSize={9}
                              fontWeight={900}
                              axisLine={false}
                              tickLine={false}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                              tick={{ fill: '#94a3b8' }}
                            />
                            <YAxis yAxisId="left" orientation="left" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#475569' }} />
                            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#475569' }} tickFormatter={(v) => `${v}%`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                              formatter={(value: any, name: string) => [
                                name === 'value' ? `${value} defects` : `${value}%`,
                                name === 'value' ? 'Defect Count' : 'Cumulative %'
                              ]}
                            />
                            <Bar yAxisId="left" dataKey="value" fill="url(#roseGrad)" radius={[6, 6, 0, 0]} maxBarSize={56}>
                              {paretoData.map((entry, index) => (
                                <Cell key={index} fill="url(#roseGrad)" />
                              ))}
                            </Bar>
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="percentage"
                              stroke="#22d3ee"
                              strokeWidth={3}
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const is80 = payload.percentage >= 80;
                                return (
                                  <g key={cx}>
                                    {is80 && <circle cx={cx} cy={cy} r={10} fill="#22d3ee" fillOpacity={0.15} />}
                                    <circle cx={cx} cy={cy} r={5} fill={is80 ? '#22d3ee' : '#0e7490'} stroke={is80 ? '#22d3ee' : 'none'} strokeWidth={2} />
                                    {is80 && <circle cx={cx} cy={cy} r={5} fill="none" stroke="#22d3ee" strokeWidth={1.5} opacity={0.6} />}
                                  </g>
                                );
                              }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}

                      {/* 80% Threshold Annotation */}
                      <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/60" />
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                          Glowing cyan dots mark the 80% cumulative threshold — focus remediation efforts here
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Drill-down Cards per defect type */}
                  {paretoData.length > 0 && (
                    <Card className="bg-slate-900 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-4 h-4 text-amber-500" /> Line Contribution Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {paretoData.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter">{item.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-cyan-400 font-bold">{item.percentage}% cumulative</span>
                                <span className="text-[9px] text-rose-400 font-black">{item.value} defects</span>
                              </div>
                            </div>
                            <div className="text-[8px] text-amber-500 font-bold uppercase tracking-widest ml-1 mb-1">
                              Mainly from: {item.topLine}
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all"
                                style={{ width: `${Math.round((item.value / (paretoData[0]?.value || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* AI Root Cause Analysis Panel */}
                <div className="lg:col-span-4 space-y-4">
                  <Card className="bg-slate-950 border-slate-800 overflow-hidden">
                    <CardHeader className="bg-slate-900 border-b border-slate-800 pb-3">
                      <CardTitle className="text-xs font-black text-cyan-500 flex items-center gap-2 uppercase">
                        <Zap className="w-4 h-4" /> AI Root Cause Analysis
                      </CardTitle>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Auto-generated from inspection data</p>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* Key Finding 1 */}
                      <div className="p-3 bg-rose-500/8 border border-rose-500/15 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Primary Finding</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                          <span className="text-white font-black">{topCat}</span> defects account for{' '}
                          <span className="text-rose-400 font-black">{topCatPct}%</span> of total quality incidents.
                          Majority detected during SAP Inpanel bin-audits.
                        </p>
                      </div>

                      {/* Key Finding 2 */}
                      <div className="p-3 bg-amber-500/8 border border-amber-500/15 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertOctagon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Severity Alert</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                          <span className="text-amber-400 font-black">{critCount} CRITICAL</span> severity incidents logged.{' '}
                          <span className="text-white font-black">{holdCount} production line(s)</span> are currently on HOLD status pending manager review.
                        </p>
                      </div>

                      {/* Key Finding 3 */}
                      <div className="p-3 bg-cyan-500/8 border border-cyan-500/15 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">ISO 2859 Compliance</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                          Based on AQL 2.5 standard, focusing remediation on the top{' '}
                          <span className="text-cyan-400 font-black">{paretoData.filter(d => d.percentage <= 80).length} defect categories</span>{' '}
                          will resolve 80% of reported cases.
                        </p>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                        <div className="text-center">
                          <p className="text-2xl font-black text-white leading-none">{grandTotal}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Total Defects</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-amber-500 leading-none">{inspections.length}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Inspections</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-rose-500 leading-none">{critCount}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Critical Cases</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-cyan-500 leading-none">{sorted.length}</p>
                          <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Defect Types</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AQL Quick Reference */}
                  <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-cyan-500" /> AQL 2.5 Standard
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {[
                        { label: 'ACCEPT', range: '0–1 defects / 100 units', color: 'text-green-500' },
                        { label: 'REPAIR', range: '2–3 defects / 100 units', color: 'text-amber-500' },
                        { label: 'REJECT', range: '4+ defects / 100 units', color: 'text-rose-500' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase ${row.color}`}>{row.label}</span>
                          <span className="text-[9px] text-slate-500 font-bold">{row.range}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}
        </TabsContent>


        <TabsContent value="inspections">
          <div className="space-y-4">
            {inspections.map(i => (
              <Card key={i.id} className={`border-l-4 ${i.status === 'rejected' ? 'border-rose-500' : 'border-slate-300'} dark:bg-slate-900/40`}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${i.severity === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : i.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <div>
                        <p className="text-[11px] font-black tracking-tight text-white uppercase">{i.inspectionType}: {i.lineName}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                          <User className="w-3 h-3" /> {i.inspector}
                          <span className="opacity-20">•</span>
                          <Clock className="w-3 h-3" /> {i.date}
                        </div>
                      </div>
                    </div>

                    {i.samplingList && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                        <MousePointer2 className="w-3 h-3 text-cyan-500" />
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-tighter">
                          Samples: {i.samplingList.join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-4 items-center">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{i.totalDefects} Nuqson</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{i.category}</p>
                      </div>
                      <Select
                        defaultValue={i.status}
                        onValueChange={(val: any) => updateInspection(i.id, { status: val })}
                      >
                        <SelectTrigger className="w-32 h-8 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-900">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LIVE INSPECTION TAB CONTENT */}
        <TabsContent value="live-inspection">
          <div className="max-w-lg mx-auto space-y-4 pb-10">

            {/* Header */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Camera className="text-slate-950 w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Live Inspection Hub</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Tezkor Nuqson Qayd Etish — Operator Portal</p>
              </div>
            </div>

            {/* Line Selector */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <Factory className="w-3.5 h-3.5 text-cyan-500" /> Liniyani tanlang
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {productionLines.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setQrLineId(l.id)}
                      className={`h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${qrLineId === l.id ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-md shadow-cyan-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* DALIL HUB — Camera */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-500" /> Dalil Hub — Rasmga olish
                </Label>
                <div className={`relative h-44 rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${qrPhoto ? 'border-cyan-500/40 bg-slate-950' : 'border-slate-700 bg-slate-950 hover:border-cyan-500/40'}`}>
                  {qrPhoto ? (
                    <>
                      <img src={qrPhoto} alt="Evidence" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 opacity-0 hover:opacity-100 transition-opacity">
                        <label className="flex items-center gap-2 bg-slate-900/90 text-cyan-500 text-[10px] font-black px-4 py-2 rounded-full uppercase cursor-pointer backdrop-blur-sm">
                          <Camera className="w-4 h-4" /> Rasm almashtirish
                          <input type="file" accept="image/*" onChange={handleQuickReportPhoto} className="hidden" />
                        </label>
                      </div>
                      <div className="absolute top-2 right-2 bg-cyan-500 text-slate-950 text-[9px] font-black px-2 py-1 rounded-full uppercase">
                        ✓ Rasm tayyor
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 cursor-pointer w-full h-full">
                      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                        <Camera className="w-7 h-7 text-slate-500" />
                      </div>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Kamera / Galereya</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleQuickReportPhoto} className="hidden" />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Nuqson Turi + Izoh */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Nuqson Turi (Defect Code)</Label>
                  <Select value={qrDefectCode} onValueChange={setQrDefectCode}>
                    <SelectTrigger className="w-full bg-slate-950 border-slate-700 h-12 text-xs font-bold text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFECT_CODES.map(code => (
                        <SelectItem key={code.id} value={code.id} className="text-xs">
                          <span className="font-black text-amber-400 mr-2">{code.id}</span>{code.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-[9px] text-amber-500 font-bold px-2">
                    {qrDefectCode} — {DEFECT_CODES.find(c => c.id === qrDefectCode)?.name} ({DEFECT_CODES.find(c => c.id === qrDefectCode)?.category})
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Izoh (Comment)</Label>
                  <Input
                    placeholder="Nuqson joyi, tafsilot..."
                    value={qrNote}
                    onChange={e => setQrNote(e.target.value)}
                    className="bg-slate-950 border-slate-700 h-12 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* BRAK ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest text-center">Darhol Harakat tanlang</p>

              {/* SCRAP + REPAIR side by side */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleBrakAction('SCRAP')}
                  className="h-16 bg-slate-900 border-2 border-slate-800 hover:border-rose-600 hover:bg-rose-600/10 active:scale-95 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span className="text-[11px] font-black uppercase text-rose-600 tracking-widest">[SCRAP]</span>
                  <span className="text-[8px] text-slate-600">→ Chiqindi log</span>
                </button>
                <button
                  onClick={() => handleBrakAction('REPAIR')}
                  className="h-16 bg-slate-900 border-2 border-slate-800 hover:border-amber-500 hover:bg-amber-500/10 active:scale-95 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <RotateCcw className="w-5 h-5 text-amber-500" />
                  <span className="text-[11px] font-black uppercase text-amber-500 tracking-widest">[REPAIR]</span>
                  <span className="text-[8px] text-slate-600">→ Qayta ishlash</span>
                </button>
              </div>

              {/* HOLD — Full-width, bright red emergency button */}
              <button
                onClick={() => handleBrakAction('HOLD')}
                className="w-full h-20 bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-rose-600/30 border-2 border-rose-500"
              >
                <AlertOctagon className="w-8 h-8 text-white animate-pulse" />
                <div className="text-left">
                  <p className="text-base font-black uppercase text-white tracking-widest leading-none">[HOLD LINEYA]</p>
                  <p className="text-[10px] text-rose-200 font-bold mt-1">Liniyani to'xtatish — Site-Wide Alarm</p>
                </div>
              </button>

              <p className="text-[9px] text-slate-700 text-center font-medium">
                Barcha harakatlar Audit History'ga saqlanadi
              </p>
            </div>

          </div>
        </TabsContent>
      </Tabs>


      {/* MODALS */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tighter uppercase">Assign QC Guardian</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-bold uppercase tracking-widest">Select Sifat Nazorati Specialist for this Shift</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input className="bg-slate-900 border-slate-800 pl-10 text-xs" placeholder="Search by name or ID..." />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {hrEmployees.filter(e => e.department === 'Kadrlar bo\'limi' || e.department === 'Sifat Nazorati').map(emp => (
                <div
                  key={emp.employeeId}
                  onClick={() => {
                    if (selectedLineForAssign) {
                      setInspectorAssignments(prev => ({
                        ...prev,
                        [selectedLineForAssign]: {
                          inspectorId: emp.employeeId,
                          inspectorName: emp.fullName,
                          lineId: selectedLineForAssign,
                          lineName: productionLines.find(l => l.id === selectedLineForAssign)?.name || '',
                          scanTime: new Date().toISOString(),
                          method: 'MANUAL'
                        }
                      }));
                      setIsAssignModalOpen(false);
                      toast.success(`${emp.fullName} assigned to QC Gate`);
                    }
                  }}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded bg-slate-800 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
                    <User className="text-slate-500 group-hover:text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-white tracking-widest leading-none">{emp.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">ID: {emp.employeeId}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-rose-500 border-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600 uppercase flex items-center gap-2">
              <Shield className="w-6 h-6" /> Manager Override Required
            </DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-700 dark:text-slate-300">
              High-level authorization needed to lift **HOLD** status on {inspectionToApprove?.lineName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">Verification Lot</span>
                <span className="text-[10px] font-black text-rose-500">CRITICAL_FAULT_881</span>
              </div>
              <p className="text-xs font-medium text-slate-900 dark:text-white italic">"Critical machine alignment issue detected during final assembly. Manual override confirms repair completion."</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">Digital PIN Authorization</Label>
              <Input type="password" placeholder="••••" className="text-center text-2xl font-black tracking-[0.5em]" maxLength={4} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsApprovalDialogOpen(false)} className="text-xs font-black uppercase bg-slate-50 dark:bg-slate-950">Abort</Button>
            <Button onClick={confirmLiftHold} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest">
              Confirm & Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
