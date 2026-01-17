import React, { useMemo, useState } from 'react';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { CheckCircle, AlertTriangle, XCircle, Factory, Plus, AlertOctagon, Activity, TrendingUp, TrendingDown, Download, BarChart3, PieChart, LineChart, FileText, Shield, Target, QrCode, Clock, User } from 'lucide-react';
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
} from 'recharts';
import { toast } from 'sonner';
import { QRScanner } from '../../components/qc/QRScanner';
import { QCLineStatusPanel, QCInspectorAssignment } from '../../components/qc/QCLineStatusPanel';

export type QCInspectionType = 'INCOMING' | 'IN_PROCESS' | 'FINAL';
export type QCSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type QCDecision = 'ACCEPT' | 'REWORK' | 'SCRAP' | 'HOLD';

export type QCDefectCategory =
  | 'Cosmetic'
  | 'Functional'
  | 'Structural'
  | 'Missing Part'
  | 'Paint'
  | 'Other';

export type QCRootCause =
  | 'Operator Error'
  | 'Material Issue'
  | 'Machine Issue'
  | 'Process Violation'
  | 'Unknown';

export type QCRootCauseType =
  | 'Human error'
  | 'Equipment failure'
  | 'Material quality'
  | 'Process violation'
  | 'Unknown';

export type QCActionStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

interface CorrectiveAction {
  department: 'Maintenance' | 'Production' | 'QC';
  assignee?: string;
  description: string;
  dueDate: string;
  status: QCActionStatus;
  photoName?: string;
}

interface DecisionAuditEntry {
  timestamp: string;
  previousDecision?: QCDecision;
  newDecision: QCDecision;
  changedBy: string;
  reason?: string;
}

export interface QCInspection {
  id: string;
  lineId: string;
  lineName: string;
  date: string;
  inspector: string;
  defectTypes: { type: string; count: number }[];
  totalDefects: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  inspectionType: QCInspectionType;
  severity: QCSeverity;
  category: QCDefectCategory;
  rootCause: QCRootCause;
  rootCauseNote?: string;
  decision?: QCDecision;
  correctiveAction?: CorrectiveAction;
  // Automation flags for future integration with other modules
  lineStatus: 'RUNNING' | 'HOLD';
  maintenanceCreated: boolean;
  reworkLinked: boolean;
  warehouseBlocked: boolean;
  decisionDate?: string;
  actionUpdatedAt?: string;
  // Enterprise features
  productionUnits?: number; // Total units inspected
  decisionAuditLog?: DecisionAuditEntry[];
  qcManagerApproval?: {
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    reason?: string;
  };
}

export const initialInspections: QCInspection[] = [
  {
    id: '1',
    lineId: '1',
    lineName: 'Assembly Line A',
    date: '2025-01-15',
    inspector: 'Karimov Alisher',
    defectTypes: [
      { type: 'Scratches', count: 3 },
      { type: 'Missing Part', count: 1 },
    ],
    totalDefects: 4,
    status: 'pending',
    notes: 'Minor defects detected',
    inspectionType: 'IN_PROCESS',
    severity: 'MAJOR',
    category: 'Missing Part',
    rootCause: 'Operator Error',
    decision: 'REWORK',
    correctiveAction: {
      department: 'Production',
      description: 'Rework defective units and add additional operator training.',
      dueDate: '2025-01-20',
      status: 'IN_PROGRESS',
    },
    lineStatus: 'RUNNING',
    maintenanceCreated: false,
    reworkLinked: true,
    warehouseBlocked: false,
    decisionDate: '2025-01-15',
  },
  {
    id: '2',
    lineId: '2',
    lineName: 'Assembly Line B',
    date: '2025-01-15',
    inspector: 'Toshmatov Bahodir',
    defectTypes: [
      { type: 'Paint Defect', count: 2 },
    ],
    totalDefects: 2,
    status: 'approved',
    inspectionType: 'FINAL',
    severity: 'MINOR',
    category: 'Paint',
    rootCause: 'Material Issue',
    decision: 'ACCEPT',
    correctiveAction: {
      department: 'QC',
      description: 'Monitor paint supplier quality for the next batch.',
      dueDate: '2025-01-25',
      status: 'OPEN',
    },
    lineStatus: 'RUNNING',
    maintenanceCreated: false,
    reworkLinked: false,
    warehouseBlocked: false,
    decisionDate: '2025-01-15',
  },
  {
    id: '3',
    lineId: '3',
    lineName: 'Assembly Line D',
    date: '2025-01-14',
    inspector: 'Karimov Alisher',
    defectTypes: [
      { type: 'Structural Issue', count: 5 },
    ],
    totalDefects: 5,
    status: 'rejected',
    notes: 'Critical defects - production stopped',
    inspectionType: 'FINAL',
    severity: 'CRITICAL',
    category: 'Structural',
    rootCause: 'Machine Issue',
    decision: 'SCRAP',
    correctiveAction: {
      department: 'Maintenance',
      description: 'Immediate machine inspection and alignment check.',
      dueDate: '2025-01-16',
      status: 'OPEN',
    },
    lineStatus: 'HOLD',
    maintenanceCreated: true,
    reworkLinked: false,
    warehouseBlocked: true,
    decisionDate: '2025-01-14',
  },
];

export function QualityControlPage() {
  const { productionLines } = useFactory();
  const { t } = useLanguage();
  const [inspections, setInspections] = useState<QCInspection[]>(initialInspections);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [inspectorAssignments, setInspectorAssignments] = useState<Record<string, QCInspectorAssignment>>({});
  const [currentInspector] = useState({ id: 'inspector-1', name: 'Karimov Alisher' }); // In production, get from auth context
  const [formData, setFormData] = useState<Omit<QCInspection, 'id'>>({
    lineId: '',
    lineName: '',
    date: new Date().toISOString().split('T')[0],
    inspector: '',
    defectTypes: [],
    totalDefects: 0,
    status: 'pending',
    notes: '',
    inspectionType: 'IN_PROCESS',
    severity: 'MINOR',
    category: 'Functional',
    rootCause: 'Unknown',
    decision: undefined,
    correctiveAction: undefined,
    lineStatus: 'RUNNING',
    maintenanceCreated: false,
    reworkLinked: false,
    warehouseBlocked: false,
    decisionDate: undefined,
    actionUpdatedAt: undefined,
  });
  const [selectedInspection, setSelectedInspection] = useState<QCInspection | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const todayDefects = inspections
    .filter(i => i.date === new Date().toISOString().split('T')[0])
    .reduce((sum, i) => sum + i.totalDefects, 0);
  const rejectedCount = inspections.filter(i => i.status === 'rejected').length;
  const pendingCount = inspections.filter(i => i.status === 'pending').length;

  const filteredInspections = selectedStatus === 'all'
    ? inspections
    : inspections.filter(i => i.status === selectedStatus);

  const defectsByLine = useMemo(() => {
    const map: Record<string, number> = {};
    inspections.forEach(i => {
      map[i.lineName] = (map[i.lineName] || 0) + i.totalDefects;
    });
    return map;
  }, [inspections]);

  const defectsBySeverity = useMemo(() => {
    const map: Record<QCSeverity, number> = { MINOR: 0, MAJOR: 0, CRITICAL: 0 };
    inspections.forEach(i => {
      map[i.severity] = (map[i.severity] || 0) + i.totalDefects;
    });
    return map;
  }, [inspections]);

  const mostCommonDefectType = useMemo(() => {
    const map: Record<string, number> = {};
    inspections.forEach(i => {
      i.defectTypes.forEach(dt => {
        map[dt.type] = (map[dt.type] || 0) + dt.count;
      });
    });
    let best: string | null = null;
    let max = 0;
    Object.entries(map).forEach(([type, count]) => {
      if (count > max) {
        best = type;
        max = count;
      }
    });
    return best ? { type: best, count: max } : null;
  }, [inspections]);

  // Enterprise KPIs
  const totalUnitsInspected = useMemo(() => {
    return inspections.reduce((sum, i) => sum + (i.productionUnits || 100), 0);
  }, [inspections]);

  const totalDefects = useMemo(() => {
    return inspections.reduce((sum, i) => sum + i.totalDefects, 0);
  }, [inspections]);

  const defectRate = useMemo(() => {
    if (totalUnitsInspected === 0) return 0;
    return (totalDefects / totalUnitsInspected) * 100;
  }, [totalDefects, totalUnitsInspected]);

  const firstPassYield = useMemo(() => {
    if (totalUnitsInspected === 0) return 0;
    const accepted = inspections.filter(i => i.decision === 'ACCEPT').length;
    return (accepted / inspections.length) * 100;
  }, [inspections, totalUnitsInspected]);

  const reworkRate = useMemo(() => {
    if (totalUnitsInspected === 0) return 0;
    const reworkCount = inspections.filter(i => i.decision === 'REWORK').length;
    return (reworkCount / inspections.length) * 100;
  }, [inspections, totalUnitsInspected]);

  const scrapRate = useMemo(() => {
    if (totalUnitsInspected === 0) return 0;
    const scrapCount = inspections.filter(i => i.decision === 'SCRAP').length;
    return (scrapCount / inspections.length) * 100;
  }, [inspections, totalUnitsInspected]);

  const criticalDefectCount = useMemo(() => {
    return inspections.filter(i => i.severity === 'CRITICAL').length;
  }, [inspections]);

  const linesOnHold = useMemo(() => {
    return inspections.filter(i => i.lineStatus === 'HOLD' && i.severity === 'CRITICAL').length;
  }, [inspections]);

  // Executive Summary Status
  const qcStatus = useMemo(() => {
    if (criticalDefectCount > 0 || linesOnHold > 0) return 'CRITICAL';
    if (defectRate > 5 || reworkRate > 10) return 'RISK';
    return 'OK';
  }, [criticalDefectCount, linesOnHold, defectRate, reworkRate]);

  // Trend data (7/30/90 days)
  const getTrendData = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return inspections.filter(i => new Date(i.date) >= cutoffDate);
  };

  const trend7Days = getTrendData(7);
  const trend30Days = getTrendData(30);
  const trend90Days = getTrendData(90);

  // Defect trend chart data
  const defectTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayInspections = inspections.filter(i => i.date === dateStr);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        defects: dayInspections.reduce((sum, i) => sum + i.totalDefects, 0),
      };
    });
    return last7Days;
  }, [inspections]);

  // Defects by line chart data
  const defectsByLineChartData = useMemo(() => {
    return Object.entries(defectsByLine).map(([line, count]) => ({
      line: line.replace('Assembly Line ', 'Line '),
      defects: count,
    }));
  }, [defectsByLine]);

  // Severity distribution chart data
  const severityDistributionData = useMemo(() => {
    return [
      { name: t('qc.severity.MINOR'), value: defectsBySeverity.MINOR, color: '#fbbf24' },
      { name: t('qc.severity.MAJOR'), value: defectsBySeverity.MAJOR, color: '#f97316' },
      { name: t('qc.severity.CRITICAL'), value: defectsBySeverity.CRITICAL, color: '#ef4444' },
    ];
  }, [defectsBySeverity, t]);

  const applyAutomationRules = (inspection: QCInspection): QCInspection => {
    let updated: QCInspection = { ...inspection };

    // Critical severity → line HOLD + maintenance request
    if (updated.severity === 'CRITICAL') {
      updated.lineStatus = 'HOLD';
      updated.maintenanceCreated = true;
    } else if (!updated.maintenanceCreated) {
      updated.lineStatus = 'RUNNING';
    }

    // Decision-based rules
    if (updated.decision === 'REWORK') {
      updated.reworkLinked = true;
    }

    if (updated.decision === 'SCRAP') {
      updated.warehouseBlocked = true;
    }

    return updated;
  };

  const handleOpenDialog = () => {
    setFormData({
      lineId: '',
      lineName: '',
      date: new Date().toISOString().split('T')[0],
      inspector: '',
      defectTypes: [],
      totalDefects: 0,
      status: 'pending',
      notes: '',
      inspectionType: 'IN_PROCESS',
      severity: 'MINOR',
      category: 'Functional',
      rootCause: 'Unknown',
      decision: undefined,
      correctiveAction: undefined,
      lineStatus: 'RUNNING',
      maintenanceCreated: false,
      reworkLinked: false,
      warehouseBlocked: false,
      decisionDate: undefined,
      actionUpdatedAt: undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.lineId || !formData.inspector || !formData.inspectionType || !formData.severity) {
      toast.error(t('qc.validation.required'));
      return;
    }

    let newInspection: QCInspection = {
      ...formData,
      id: Date.now().toString(),
      lineName: productionLines.find(l => l.id === formData.lineId)?.name || formData.lineName,
    };
    newInspection = applyAutomationRules(newInspection);
    setInspections([newInspection, ...inspections]);
    toast.success(t('qc.createSuccess'));
    setIsDialogOpen(false);
  };

  const handleStatusChange = (id: string, status: 'pending' | 'approved' | 'rejected') => {
    const current = inspections.find(i => i.id === id);
    if (!current) return;

    // Require usage decision before closing
    if (current.decision == null && status !== 'pending') {
      toast.error(t('qc.decisionRequired'));
      setSelectedInspection(current);
      setIsDetailOpen(true);
      return;
    }

    setInspections(inspections.map(i => i.id === id ? { ...i, status } : i));
    toast.success(t('qc.statusUpdated'));
  };

  const handleDecisionChange = (inspection: QCInspection, newDecision: QCDecision, reason?: string) => {
    const previousDecision = inspection.decision;
    const auditEntry: DecisionAuditEntry = {
      timestamp: new Date().toISOString(),
      previousDecision,
      newDecision,
      changedBy: 'Current User', // In production, get from auth context
      reason,
    };

    const updatedInspection = applyAutomationRules({
      ...inspection,
      decision: newDecision,
      decisionDate: new Date().toISOString(),
      decisionAuditLog: [...(inspection.decisionAuditLog || []), auditEntry],
    });

    setInspections(prev =>
      prev.map(i => (i.id === updatedInspection.id ? updatedInspection : i)),
    );

    if (selectedInspection?.id === inspection.id) {
      setSelectedInspection(updatedInspection);
    }
  };

  const handlePDFExport = () => {
    // PDF export functionality
    toast.info(t('qc.report.downloadPlaceholder'));
  };

  const handleQRScan = (data: { lineId: string; lineName: string; type: string }) => {
    if (data.type !== 'QC_CHECKPOINT') {
      toast.error(t('qc.checkin.invalidQR'));
      return;
    }

    // Check if inspector is already assigned to another line
    const existingAssignment = Object.values(inspectorAssignments).find(
      a => a.inspectorId === currentInspector.id && a.lineId !== data.lineId
    );

    if (existingAssignment) {
      // Auto-unassign previous line
      const newAssignments = { ...inspectorAssignments };
      delete newAssignments[existingAssignment.lineId];
      setInspectorAssignments(newAssignments);
      toast.info(t('qc.checkin.reassigned').replace('{from}', existingAssignment.lineName).replace('{to}', data.lineName));
    }

    // Create new assignment
    const assignment: QCInspectorAssignment = {
      inspectorId: currentInspector.id,
      inspectorName: currentInspector.name,
      lineId: data.lineId,
      lineName: data.lineName,
      scanTime: new Date().toISOString(),
      device: navigator.userAgent,
      method: 'QR_SCAN',
    };

    setInspectorAssignments(prev => ({
      ...prev,
      [data.lineId]: assignment,
    }));

    // Log audit event
    console.log('QC Check-in:', {
      inspectorId: assignment.inspectorId,
      inspectorName: assignment.inspectorName,
      lineId: assignment.lineId,
      scanTime: assignment.scanTime,
      shift: getCurrentShift(),
      device: assignment.device,
      method: assignment.method,
    });

    toast.success(t('qc.checkin.success').replace('{line}', data.lineName));
    setIsQRScannerOpen(false);
  };

  const getCurrentShift = (): string => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'SHIFT_1';
    if (hour >= 14 && hour < 22) return 'SHIFT_2';
    return 'SHIFT_NIGHT';
  };

  const getAssignmentStatus = (lineId: string): 'PRESENT' | 'WARNING' | 'ABSENT' => {
    const assignment = inspectorAssignments[lineId];
    if (!assignment) return 'ABSENT';

    const scanTime = new Date(assignment.scanTime);
    const now = new Date();
    const hoursSinceScan = (now.getTime() - scanTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceScan > 2) return 'ABSENT';
    if (hoursSinceScan > 1.5) return 'WARNING';
    return 'PRESENT';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const getSeverityBadge = (severity: QCSeverity) => {
    const base =
      severity === 'CRITICAL'
        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        : severity === 'MAJOR'
        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return base;
  };

  const getDecisionBadge = (decision?: QCDecision) => {
    if (!decision) return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    const map: Record<QCDecision, string> = {
      ACCEPT: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      REWORK: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      SCRAP: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      HOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    };
    return map[decision];
  };

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-foreground flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary" />
            {t('qc.title')}
          </h2>
          <p className="text-muted-foreground mt-1">{t('qc.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsQRScannerOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            {t('qc.checkin.scanQR')}
          </Button>
          <Button variant="outline" onClick={handlePDFExport}>
            <Download className="w-4 h-4 mr-2" />
            {t('qc.report.download')}
          </Button>
          <Button onClick={handleOpenDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {t('qc.addInspection')}
          </Button>
        </div>
      </div>

      {/* QC Line Status Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            {t('qc.checkin.lineStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {productionLines.map(line => (
              <QCLineStatusPanel
                key={line.id}
                lineId={line.id}
                lineName={line.name}
                assignment={inspectorAssignments[line.id] || null}
              />
            ))}
          </div>
          {/* QC Status Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.checkin.table.line')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.checkin.table.inspector')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.checkin.table.lastScan')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.checkin.table.timeSince')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.checkin.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {productionLines.map(line => {
                  const assignment = inspectorAssignments[line.id];
                  const status = getAssignmentStatus(line.id);
                  const timeSince = assignment ? (() => {
                    const scanTime = new Date(assignment.scanTime);
                    const now = new Date();
                    const diffMs = now.getTime() - scanTime.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    if (hours > 0) return `${hours}h ${minutes}m`;
                    return `${minutes}m`;
                  })() : '-';

                  return (
                    <tr key={line.id} className={status === 'ABSENT' ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{line.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {assignment ? assignment.inspectorName : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {assignment ? new Date(assignment.scanTime).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{timeSince}</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          status === 'PRESENT' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          status === 'WARNING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }>
                          {status === 'PRESENT' ? t('qc.checkin.present') :
                           status === 'WARNING' ? t('qc.checkin.warning') :
                           t('qc.checkin.absent')}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary - Management Layer */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('qc.executive.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border-2 ${
              qcStatus === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
              qcStatus === 'RISK' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
              'border-green-500 bg-green-50 dark:bg-green-900/20'
            }`}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.executive.status')}</p>
              <p className={`text-2xl font-bold ${
                qcStatus === 'CRITICAL' ? 'text-red-700 dark:text-red-400' :
                qcStatus === 'RISK' ? 'text-yellow-700 dark:text-yellow-400' :
                'text-green-700 dark:text-green-400'
              }`}>
                {qcStatus === 'CRITICAL' ? t('qc.executive.statusCritical') :
                 qcStatus === 'RISK' ? t('qc.executive.statusRisk') :
                 t('qc.executive.statusOk')}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.executive.linesOnHold')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{linesOnHold}</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.executive.criticalDefectsToday')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalDefectCount}</p>
            </div>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.executive.recommendedAction')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {qcStatus === 'CRITICAL' ? t('qc.executive.actionCritical') :
                 qcStatus === 'RISK' ? t('qc.executive.actionRisk') :
                 t('qc.executive.actionOk')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('qc.kpi.defectRate')}</p>
                <p className={`text-2xl font-bold ${
                  defectRate > 5 ? 'text-red-600 dark:text-red-400' :
                  defectRate > 2 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {defectRate.toFixed(2)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('qc.kpi.firstPassYield')}</p>
                <p className={`text-2xl font-bold ${
                  firstPassYield < 90 ? 'text-red-600 dark:text-red-400' :
                  firstPassYield < 95 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {firstPassYield.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('qc.kpi.reworkRate')}</p>
                <p className={`text-2xl font-bold ${
                  reworkRate > 10 ? 'text-red-600 dark:text-red-400' :
                  reworkRate > 5 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {reworkRate.toFixed(1)}%
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('qc.kpi.scrapRate')}</p>
                <p className={`text-2xl font-bold ${
                  scrapRate > 5 ? 'text-red-600 dark:text-red-400' :
                  scrapRate > 2 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {scrapRate.toFixed(1)}%
                </p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('qc.kpi.criticalDefects')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{criticalDefectCount}</p>
              </div>
              <AlertOctagon className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytical QC Layer - Tabs */}
      <Tabs defaultValue="operational" className="mb-6">
        <TabsList>
          <TabsTrigger value="operational">{t('qc.tabs.operational')}</TabsTrigger>
          <TabsTrigger value="analytical">{t('qc.tabs.analytical')}</TabsTrigger>
          <TabsTrigger value="statistics">{t('qc.tabs.statistics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="mt-4 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('qc.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('qc.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('qc.pending')}</SelectItem>
                <SelectItem value="approved">{t('qc.approved')}</SelectItem>
                <SelectItem value="rejected">{t('qc.rejected')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operational QC - Inspections List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.date')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.line')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.inspectionType')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.inspector')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.defects')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.severity')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.decision')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('qc.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        {t('qc.noInspections')}
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map(inspection => (
                      <tr key={inspection.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{inspection.date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Factory className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{inspection.lineName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {t(`qc.inspectionType.${inspection.inspectionType}`)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{inspection.inspector}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{inspection.totalDefects}</span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {inspection.defectTypes.map((dt, idx) => (
                                <span key={idx}>{dt.type}: {dt.count}{idx < inspection.defectTypes.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getSeverityBadge(inspection.severity)}>
                            {t(`qc.severity.${inspection.severity}`)}
                          </Badge>
                          {inspection.severity === 'CRITICAL' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-500">
                              <AlertOctagon className="w-3 h-3" />
                              {t('qc.criticalWarning')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getDecisionBadge(inspection.decision)}>
                            {inspection.decision ? t(`qc.decision.${inspection.decision}`) : t('qc.decisionPending')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusBadge(inspection.status)}>
                            {t(`qc.${inspection.status}`)}
                          </Badge>
                          {inspection.lineStatus === 'HOLD' && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-500">
                              <Activity className="w-3 h-3" />
                              {t('qc.lineOnHold')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedInspection(inspection);
                                setIsDetailOpen(true);
                              }}
                            >
                              {t('qc.viewDetails')}
                            </Button>
                            {inspection.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(inspection.id, 'approved')}
                                  className="text-green-600 dark:text-green-400"
                                >
                                  {t('qc.approve')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(inspection.id, 'rejected')}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  {t('qc.reject')}
                                </Button>
                              </>
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

          {/* Basic Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                {t('qc.analytics.byLine')}
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {Object.keys(defectsByLine).length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400 text-xs">{t('qc.analytics.empty')}</li>
                )}
                {Object.entries(defectsByLine).map(([line, count]) => (
                  <li key={line} className="flex justify-between">
                    <span>{line}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                {t('qc.analytics.bySeverity')}
              </h3>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {(defectsBySeverity.MINOR + defectsBySeverity.MAJOR + defectsBySeverity.CRITICAL) === 0 && (
                  <li className="text-gray-500 dark:text-gray-400 text-xs">{t('qc.analytics.empty')}</li>
                )}
                {(['MINOR', 'MAJOR', 'CRITICAL'] as QCSeverity[]).map(sev => (
                  <li key={sev} className="flex justify-between items-center">
                    <span>{t(`qc.severity.${sev}`)}</span>
                    <span className="font-semibold">{defectsBySeverity[sev]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                {t('qc.analytics.mostCommonDefect')}
              </h3>
              {mostCommonDefectType ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {mostCommonDefectType.type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.analytics.totalDefects').replace('{count}', mostCommonDefectType.count.toString())}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('qc.analytics.empty')}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytical" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Defect Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  {t('qc.analytical.defectTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <QCLineChart data={defectTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="defects" stroke="#3b82f6" strokeWidth={2} />
                  </QCLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Defects by Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t('qc.analytical.defectsByLine')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={defectsByLineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="line" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="defects" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  {t('qc.analytical.severityDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <QCPieChart>
                    <Pie
                      data={severityDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </QCPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('qc.analytical.trendSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.analytical.last7Days')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {trend7Days.reduce((sum, i) => sum + i.totalDefects, 0)} {t('qc.defects')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.analytical.last30Days')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {trend30Days.reduce((sum, i) => sum + i.totalDefects, 0)} {t('qc.defects')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('qc.analytical.last90Days')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {trend90Days.reduce((sum, i) => sum + i.totalDefects, 0)} {t('qc.defects')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Most Problematic Line */}
            <Card>
              <CardHeader>
                <CardTitle>{t('qc.statistics.mostProblematicLine')}</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(defectsByLine).length > 0 ? (
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {Object.entries(defectsByLine).sort((a, b) => b[1] - a[1])[0][0]}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {Object.entries(defectsByLine).sort((a, b) => b[1] - a[1])[0][1]} {t('qc.defects')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('qc.analytics.empty')}</p>
                )}
              </CardContent>
            </Card>

            {/* Most Risky Defect Type */}
            <Card>
              <CardHeader>
                <CardTitle>{t('qc.statistics.mostRiskyDefect')}</CardTitle>
              </CardHeader>
              <CardContent>
                {mostCommonDefectType ? (
                  <div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {mostCommonDefectType.type}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {mostCommonDefectType.count} {t('qc.defects')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('qc.analytics.empty')}</p>
                )}
              </CardContent>
            </Card>

            {/* Rework vs Scrap */}
            <Card>
              <CardHeader>
                <CardTitle>{t('qc.statistics.reworkVsScrap')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('qc.decision.REWORK')}</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {inspections.filter(i => i.decision === 'REWORK').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('qc.decision.SCRAP')}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {inspections.filter(i => i.decision === 'SCRAP').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Inspection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('qc.addInspection')}</DialogTitle>
            <DialogDescription>{t('qc.dialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inspectionType">{t('qc.inspectionType')} *</Label>
              <Select
                value={formData.inspectionType}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, inspectionType: value as QCInspectionType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOMING">{t('qc.inspectionType.INCOMING')}</SelectItem>
                  <SelectItem value="IN_PROCESS">{t('qc.inspectionType.IN_PROCESS')}</SelectItem>
                  <SelectItem value="FINAL">{t('qc.inspectionType.FINAL')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lineId">{t('qc.line')} *</Label>
              <Select value={formData.lineId} onValueChange={(value) => {
                const line = productionLines.find(l => l.id === value);
                setFormData({ ...formData, lineId: value, lineName: line?.name || '' });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('qc.selectLine')} />
                </SelectTrigger>
                <SelectContent>
                  {productionLines.map(line => (
                    <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">{t('qc.date')} *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="inspector">{t('qc.inspector')} *</Label>
              <Input
                id="inspector"
                value={formData.inspector}
                onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                placeholder={t('qc.inspectorPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t('qc.severityField')} *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, severity: value as QCSeverity }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINOR">{t('qc.severity.MINOR')}</SelectItem>
                    <SelectItem value="MAJOR">{t('qc.severity.MAJOR')}</SelectItem>
                    <SelectItem value="CRITICAL">{t('qc.severity.CRITICAL')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('qc.category')}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, category: value as QCDefectCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cosmetic">{t('qc.category.cosmetic')}</SelectItem>
                    <SelectItem value="Functional">{t('qc.category.functional')}</SelectItem>
                    <SelectItem value="Structural">{t('qc.category.structural')}</SelectItem>
                    <SelectItem value="Missing Part">{t('qc.category.missingPart')}</SelectItem>
                    <SelectItem value="Paint">{t('qc.category.paint')}</SelectItem>
                    <SelectItem value="Other">{t('qc.category.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('qc.rootCause')}</Label>
                <Select
                  value={formData.rootCause}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, rootCause: value as QCRootCause }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operator Error">{t('qc.rootCause.operator')}</SelectItem>
                    <SelectItem value="Material Issue">{t('qc.rootCause.material')}</SelectItem>
                    <SelectItem value="Machine Issue">{t('qc.rootCause.machine')}</SelectItem>
                    <SelectItem value="Unknown">{t('qc.rootCause.unknown')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('qc.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('qc.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={open => {
        setIsDetailOpen(open);
        if (!open) {
          setSelectedInspection(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('qc.detail.title')}</DialogTitle>
            <DialogDescription>{t('qc.detail.subtitle')}</DialogDescription>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.date')}: <span className="font-medium text-gray-900 dark:text-white">{selectedInspection.date}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.line')}: <span className="font-medium text-gray-900 dark:text-white">{selectedInspection.lineName}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.inspectionType')}: <span className="font-medium text-gray-900 dark:text-white">{t(`qc.inspectionType.${selectedInspection.inspectionType}`)}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.inspector')}: <span className="font-medium text-gray-900 dark:text-white">{selectedInspection.inspector}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <span>{t('qc.severityField')}:</span>
                    <Badge className={getSeverityBadge(selectedInspection.severity)}>
                      {t(`qc.severity.${selectedInspection.severity}`)}
                    </Badge>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.category')}: <span className="font-medium text-gray-900 dark:text-white">{t(`qc.categoryLabel.${selectedInspection.category}`)}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.rootCause')}: <span className="font-medium text-gray-900 dark:text-white">{t(`qc.rootCauseLabel.${selectedInspection.rootCause}`)}</span>
                  </p>
                  {selectedInspection.rootCauseNote && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('qc.rootCauseNote')}: <span className="font-medium text-gray-900 dark:text-white">{selectedInspection.rootCauseNote}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('qc.lineStatus')}: <span className="font-medium text-gray-900 dark:text-white">{selectedInspection.lineStatus === 'HOLD' ? t('qc.lineStatusHold') : t('qc.lineStatusRunning')}</span>
                  </p>
                </div>
              </div>

              {/* Root Cause Note */}
              {selectedInspection.severity === 'CRITICAL' && (
                <div>
                  <Label>{t('qc.rootCauseNote')}</Label>
                  <Textarea
                    value={selectedInspection.rootCauseNote || ''}
                    onChange={(e) => {
                      const updated = { ...selectedInspection, rootCauseNote: e.target.value };
                      setSelectedInspection(updated);
                      setInspections(prev =>
                        prev.map(i => (i.id === updated.id ? updated : i)),
                      );
                    }}
                    placeholder={t('qc.rootCauseNotePlaceholder')}
                    rows={3}
                  />
                </div>
              )}

              {/* Decision Audit Log */}
              {selectedInspection.decisionAuditLog && selectedInspection.decisionAuditLog.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {t('qc.auditLog.title')}
                  </h3>
                  <div className="space-y-2">
                    {selectedInspection.decisionAuditLog.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.previousDecision ? (
                                <>{t(`qc.decision.${entry.previousDecision}`)} → {t(`qc.decision.${entry.newDecision}`)}</>
                              ) : (
                                <>{t('qc.auditLog.initialDecision')}: {t(`qc.decision.${entry.newDecision}`)}</>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {t('qc.auditLog.changedBy')}: {entry.changedBy} • {new Date(entry.timestamp).toLocaleString()}
                            </p>
                            {entry.reason && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {t('qc.auditLog.reason')}: {entry.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision & CAPA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('qc.decisionSection')}
                  </h3>
                  <div>
                    <Label>{t('qc.decision')}</Label>
                    <Select
                      value={selectedInspection.decision}
                      onValueChange={(value) => {
                        handleDecisionChange(selectedInspection, value as QCDecision);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('qc.decisionPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACCEPT">{t('qc.decision.ACCEPT')}</SelectItem>
                        <SelectItem value="REWORK">{t('qc.decision.REWORK')}</SelectItem>
                        <SelectItem value="SCRAP">{t('qc.decision.SCRAP')}</SelectItem>
                        <SelectItem value="HOLD">{t('qc.decision.HOLD')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('qc.decisionHint')}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('qc.capaSection')}
                  </h3>
                  <div className="space-y-2">
                    <Label>{t('qc.capa.department')}</Label>
                    <Select
                      value={selectedInspection.correctiveAction?.department ?? 'Production'}
                      onValueChange={(value) => {
                        const action: CorrectiveAction = {
                          department: value as CorrectiveAction['department'],
                          description: selectedInspection.correctiveAction?.description ?? '',
                          dueDate:
                            selectedInspection.correctiveAction?.dueDate ??
                            new Date().toISOString().split('T')[0],
                          status: selectedInspection.correctiveAction?.status ?? 'OPEN',
                          assignee: selectedInspection.correctiveAction?.assignee,
                          photoName: selectedInspection.correctiveAction?.photoName,
                        };
                        const updated: QCInspection = {
                          ...selectedInspection,
                          correctiveAction: action,
                          actionUpdatedAt: new Date().toISOString(),
                        };
                        setSelectedInspection(updated);
                        setInspections(prev =>
                          prev.map(i => (i.id === updated.id ? updated : i)),
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Production">{t('qc.capa.departmentProduction')}</SelectItem>
                        <SelectItem value="Maintenance">{t('qc.capa.departmentMaintenance')}</SelectItem>
                        <SelectItem value="QC">{t('qc.capa.departmentQC')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label>{t('qc.capa.assignee')}</Label>
                      <Input
                        value={selectedInspection.correctiveAction?.assignee ?? ''}
                        onChange={(e) => {
                          const action: CorrectiveAction = {
                            department: selectedInspection.correctiveAction?.department ?? 'Production',
                            description: selectedInspection.correctiveAction?.description ?? '',
                            dueDate:
                              selectedInspection.correctiveAction?.dueDate ??
                              new Date().toISOString().split('T')[0],
                            status: selectedInspection.correctiveAction?.status ?? 'OPEN',
                            assignee: e.target.value,
                            photoName: selectedInspection.correctiveAction?.photoName,
                          };
                          const updated: QCInspection = {
                            ...selectedInspection,
                            correctiveAction: action,
                            actionUpdatedAt: new Date().toISOString(),
                          };
                          setSelectedInspection(updated);
                          setInspections(prev =>
                            prev.map(i => (i.id === updated.id ? updated : i)),
                          );
                        }}
                      />
                    </div>
                    <div>
                      <Label>{t('qc.capa.dueDate')}</Label>
                      <Input
                        type="date"
                        value={
                          selectedInspection.correctiveAction?.dueDate ??
                          new Date().toISOString().split('T')[0]
                        }
                        onChange={(e) => {
                          const action: CorrectiveAction = {
                            department: selectedInspection.correctiveAction?.department ?? 'Production',
                            description: selectedInspection.correctiveAction?.description ?? '',
                            dueDate: e.target.value,
                            status: selectedInspection.correctiveAction?.status ?? 'OPEN',
                            assignee: selectedInspection.correctiveAction?.assignee,
                            photoName: selectedInspection.correctiveAction?.photoName,
                          };
                          const updated: QCInspection = {
                            ...selectedInspection,
                            correctiveAction: action,
                            actionUpdatedAt: new Date().toISOString(),
                          };
                          setSelectedInspection(updated);
                          setInspections(prev =>
                            prev.map(i => (i.id === updated.id ? updated : i)),
                          );
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t('qc.capa.description')}</Label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      value={selectedInspection.correctiveAction?.description ?? ''}
                      onChange={(e) => {
                        const action: CorrectiveAction = {
                          department: selectedInspection.correctiveAction?.department ?? 'Production',
                          description: e.target.value,
                          dueDate:
                            selectedInspection.correctiveAction?.dueDate ??
                            new Date().toISOString().split('T')[0],
                          status: selectedInspection.correctiveAction?.status ?? 'OPEN',
                          assignee: selectedInspection.correctiveAction?.assignee,
                          photoName: selectedInspection.correctiveAction?.photoName,
                        };
                        const updated: QCInspection = {
                          ...selectedInspection,
                          correctiveAction: action,
                          actionUpdatedAt: new Date().toISOString(),
                        };
                        setSelectedInspection(updated);
                        setInspections(prev =>
                          prev.map(i => (i.id === updated.id ? updated : i)),
                        );
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                    <div>
                      <Label>{t('qc.capa.status')}</Label>
                      <Select
                        value={selectedInspection.correctiveAction?.status ?? 'OPEN'}
                        onValueChange={(value) => {
                          const action: CorrectiveAction = {
                            department: selectedInspection.correctiveAction?.department ?? 'Production',
                            description: selectedInspection.correctiveAction?.description ?? '',
                            dueDate:
                              selectedInspection.correctiveAction?.dueDate ??
                              new Date().toISOString().split('T')[0],
                            status: value as QCActionStatus,
                            assignee: selectedInspection.correctiveAction?.assignee,
                            photoName: selectedInspection.correctiveAction?.photoName,
                          };
                          const updated: QCInspection = {
                            ...selectedInspection,
                            correctiveAction: action,
                            actionUpdatedAt: new Date().toISOString(),
                          };
                          setSelectedInspection(updated);
                          setInspections(prev =>
                            prev.map(i => (i.id === updated.id ? updated : i)),
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">{t('qc.capa.statusOpen')}</SelectItem>
                          <SelectItem value="IN_PROGRESS">{t('qc.capa.statusInProgress')}</SelectItem>
                          <SelectItem value="CLOSED">{t('qc.capa.statusClosed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('qc.capa.photo')}</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const action: CorrectiveAction = {
                            department: selectedInspection.correctiveAction?.department ?? 'Production',
                            description: selectedInspection.correctiveAction?.description ?? '',
                            dueDate:
                              selectedInspection.correctiveAction?.dueDate ??
                              new Date().toISOString().split('T')[0],
                            status: selectedInspection.correctiveAction?.status ?? 'OPEN',
                            assignee: selectedInspection.correctiveAction?.assignee,
                            photoName: file?.name ?? selectedInspection.correctiveAction?.photoName,
                          };
                          const updated: QCInspection = {
                            ...selectedInspection,
                            correctiveAction: action,
                            actionUpdatedAt: new Date().toISOString(),
                          };
                          setSelectedInspection(updated);
                          setInspections(prev =>
                            prev.map(i => (i.id === updated.id ? updated : i)),
                          );
                        }}
                      />
                      {selectedInspection.correctiveAction?.photoName && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t('qc.capa.photoSelected')}: {selectedInspection.correctiveAction.photoName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t('qc.timeline.title')}
                </h3>
                <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-3 text-sm">
                  <li className="ml-4">
                    <div className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-blue-500" />
                    <p className="text-gray-900 dark:text-white font-medium">
                      {t('qc.timeline.inspectionCreated')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedInspection.date}
                    </p>
                  </li>
                  {selectedInspection.decision && selectedInspection.decisionDate && (
                    <li className="ml-4">
                      <div className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-green-500" />
                      <p className="text-gray-900 dark:text-white font-medium">
                        {t('qc.timeline.decisionMade')
                          .replace('{decision}', t(`qc.decision.${selectedInspection.decision}`))}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedInspection.decisionDate).toLocaleString()}
                      </p>
                    </li>
                  )}
                  {selectedInspection.correctiveAction && selectedInspection.actionUpdatedAt && (
                    <li className="ml-4">
                      <div className="absolute -left-[7px] mt-1 w-3 h-3 rounded-full bg-yellow-500" />
                      <p className="text-gray-900 dark:text-white font-medium">
                        {t('qc.timeline.capaUpdated')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(selectedInspection.actionUpdatedAt).toLocaleString()}
                      </p>
                    </li>
                  )}
                </ol>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              {t('qc.closeDetail')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Scanner */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}
