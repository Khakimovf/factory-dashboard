import { useState, useEffect, useCallback } from 'react';
import { Activity, ArrowLeft, Camera, AlertTriangle, ListTree, Clock, User, Users, AlertCircle, ShieldCheck, Printer, QrCode, CheckCircle, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { useDailyProductionPlan } from '../../context/DailyProductionPlanContext';
import { toast } from 'sonner';
import { getCurrentShiftInfo, getShiftLabel, hasShiftEnded, getTimeUntilShiftEnd, type ShiftType } from '../../utils/shiftUtils';
import { hrEmployees } from '../../data/hrEmployees';

// Line Master interface
interface LineMaster {
  employeeId: string;
  fullName: string;
  position: string;
}

// Shift assignment interface (for backend)
interface ShiftAssignment {
  lineId: string;
  shiftType: ShiftType;
  lineMaster: LineMaster | null;
  workersCount: number;
  maxWorkers: number;
  shiftStartTime: string;
  shiftEndTime: string;
  createdAt: string;
}

export function ProductionLivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { productionLines, materials, consumeMaterials, produceFinishedGood } = useFactory();
  const { requests, addMaterialRequest } = useWarehouse();
  const { getTodayLinePlan } = useDailyProductionPlan();

  const line = productionLines.find(l => l.id === id);

  // Shift management
  const shiftInfo = getCurrentShiftInfo();

  const [activeBrigadir, setActiveBrigadir] = useState<LineMaster | null>(null);
  const [activeInspector, setActiveInspector] = useState<LineMaster | null>(null);
  const [lastPrintedLabel, setLastPrintedLabel] = useState<{
    id: string;
    timestamp: string;
    option: string;
    brigadir: string;
    inspector: string;
  } | null>(null);
  const [workersCount, setWorkersCount] = useState(14);
  const maxWorkers = 16;

  // Andon modal state
  const [showAndonModal, setShowAndonModal] = useState(false);
  const [andonReason, setAndonReason] = useState<string>('');

  // Live Shift Event Log
  interface ShiftEvent {
    time: string;
    type: 'output' | 'stop' | 'resume' | 'info' | 'andon';
    message: string;
  }
  const [shiftEvents, setShiftEvents] = useState<ShiftEvent[]>([
    { time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }), type: 'info', message: 'Smena boshlandi. Live ishlab chiqarish rejimi faol.' }
  ]);

  const addEvent = useCallback((type: ShiftEvent['type'], message: string) => {
    const time = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    setShiftEvents(prev => [{ time, type, message }, ...prev].slice(0, 30)); // keep last 30
  }, []);

  const handleBrigadirLogout = () => setActiveBrigadir(null);
  const handleInspectorLogout = () => {
    setActiveInspector(null);
    if (productionStatus === 'active') {
      setProductionStatus('paused');
      toast.error('QC Supervision Required: Production Paused', { icon: '🛑' });
    }
  };

  // Get today's production plan for this line
  const todayPlan = line ? getTodayLinePlan(line.id) : null;
  const plannedQuantity = todayPlan?.totalReja || 0;

  // Production tracking (shift-based)
  const [producedQuantity, setProducedQuantity] = useState(356); // Mock: will be updated by camera events
  const [shiftStatus, setShiftStatus] = useState<'active' | 'completed' | 'not_completed'>('active');
  const [shiftEndWarning, setShiftEndWarning] = useState<string | null>(null);

  // Calculate remaining
  const remainingQuantity = Math.max(0, plannedQuantity - producedQuantity);
  const PROGRESS = plannedQuantity > 0 ? Math.max(0, Math.min(100, Math.round((producedQuantity / plannedQuantity) * 100))) : 0;

  type DoorTrimVariant = 'FRT LH' | 'FRT RH' | 'RR LH' | 'RR RH';
  const variants: DoorTrimVariant[] = ['FRT LH', 'FRT RH', 'RR LH', 'RR RH'];
  const [productionStatus, setProductionStatus] = useState<'active' | 'paused' | 'stopped'>('active');
  const [currentOption, setCurrentOption] = useState<DoorTrimVariant>('FRT LH');

  // Drift Analytics
  const taktTime = plannedQuantity > 0 ? Math.round(28800 / plannedQuantity) : 60; // 8 hours in seconds
  const [actualCycleTime, setActualCycleTime] = useState(taktTime);

  useEffect(() => {
    if (productionStatus !== 'active' || hasShiftEnded()) return;
    const interval = setInterval(() => {
      setActualCycleTime(prev => {
        const variation = (Math.random() - 0.45) * 0.4 * taktTime; // Random fluctuation
        return Math.max(1, Math.round(taktTime + variation));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [taktTime, productionStatus]);

  const cycleTimeDrift = taktTime > 0 ? ((actualCycleTime - taktTime) / taktTime) * 100 : 0;
  const isDrifting = cycleTimeDrift > 10; // Red indicator if > 10% slower

  // Check shift end and update status
  useEffect(() => {
    const checkShiftEnd = () => {
      if (hasShiftEnded()) {
        if (producedQuantity < plannedQuantity) {
          setShiftStatus('not_completed');
          const missing = plannedQuantity - producedQuantity;
          setShiftEndWarning(`Smena yakunlandi. Reja bajarilmadi. Yetishmayotgan: ${missing} dona.`);
        } else {
          setShiftStatus('completed');
          setShiftEndWarning(null);
        }
      } else {
        setShiftStatus('active');
        setShiftEndWarning(null);
      }
    };

    checkShiftEnd();
    const interval = setInterval(checkShiftEnd, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [producedQuantity, plannedQuantity]);

  // Automated Kanban Drop Effect
  useEffect(() => {
    if (!line || productionStatus !== 'active') return;

    line.requiredMaterials.forEach(rm => {
      const material = materials.find(m => m.id === rm.materialId);
      if (material && material.quantity < 10) {
        const hasPending = requests.some(r => r.planId === line.name && r.status === 'Pending' && r.items.some(i => i.partNumber === material.id));

        if (!hasPending) {
          const replenishmentQty = Math.max(50, material.minStock - material.quantity);
          addMaterialRequest(
            line.name,
            [{
              id: `KANBAN-${material.id}-${Date.now()}`,
              name: material.name,
              partNumber: material.id,
              requiredQty: replenishmentQty,
              currentStock: material.quantity,
              binLocation: 'Line Buffer'
            }],
            'High'
          );
          toast.info(`Automated Kanban request sent for ${material.name} (Qty: ${replenishmentQty})`, {
            icon: '🔄'
          });
        }
      }
    });
  }, [materials, line, productionStatus, requests, addMaterialRequest]);

  const handlePause = () => {
    const isPaused = productionStatus === 'paused';
    setProductionStatus(isPaused ? 'active' : 'paused');
    if (isPaused) {
      addEvent('resume', `Ishlab chiqarish davom ettirildi | Brigadir: ${activeBrigadir?.fullName ?? '—'}`);
      toast.success('Ishlab chiqarish davom ettirildi', { icon: '▶️' });
    } else {
      addEvent('stop', `Ishlab chiqarish to'xtatildi (Pause) | Brigadir: ${activeBrigadir?.fullName ?? '—'}`);
      toast.warning("Ishlab chiqarish to'xtatildi", { icon: '⏸️' });
    }
  };

  const handleStop = () => {
    setShowAndonModal(true);
  };

  const handleAndonConfirm = () => {
    if (!andonReason) {
      toast.error('Iltimos, to\'xtash sababini tanlang!', { icon: '⚠️' });
      return;
    }
    setProductionStatus('stopped');
    setShowAndonModal(false);
    addEvent('andon', `🚨 ANDON: Liniya to\'xtatildi — Sabab: ${andonReason} | Brigadir: ${activeBrigadir?.fullName ?? '—'}`);
    toast.error(`Andon faollashtirildi: ${andonReason}`, { icon: '🚨', duration: 6000 });
    setAndonReason('');
  };

  const getCameraStatusBadge = () => {
    if (line?.status === 'maintenance_requested') {
      return {
        label: 'MAINTENANCE',
        className:
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 animate-pulse',
      };
    }

    if (productionStatus === 'stopped') {
      return {
        label: t('productionDetail.cameraOffline') ?? 'OFFLINE',
        className:
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      };
    }

    if (productionStatus === 'paused') {
      return {
        label: t('productionDetail.cameraPaused') ?? 'PAUSED',
        className:
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      };
    }

    return {
      label: t('productionDetail.cameraActive'),
      className:
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    };
  };

  const cameraBadge = getCameraStatusBadge();

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">

      {/* ── ANDON MODAL ──────────────────────────────────────────────────── */}
      {showAndonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-red-500 w-full max-w-md mx-4 p-6 animate-pulse-once">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400">🚨 ANDON — Liniyani to'xtatish</h2>
              <button onClick={() => setShowAndonModal(false)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Liniyani to'xtatish sababini tanlang. Bu ma'lumot hisobot uchun saqlanadi.</p>
            <div className="space-y-2 mb-6">
              {[
                'Xom ashyo yetishmovchiligi',
                'Mashina nosozligi',
                'Operator yo\'qligi',
                'Sifat muammosi (Defekt)',
                'Texnik xizmat (Rejalanmagan)',
                'Shift almashinuvi'
              ].map(reason => (
                <button
                  key={reason}
                  onClick={() => setAndonReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${andonReason === reason
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAndonModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAndonConfirm}
                disabled={!andonReason}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⛔ Liniyani To'xtat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/production-lines/${id}`)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('productionDetail.backToLines')}</span>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{t('productionDetail.liveProduction')}</span>
              <span className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[10px] font-semibold tracking-wide text-green-600 dark:text-green-400">
                  LIVE
                </span>
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {line ? `${line.name} (${t('productionDetail.lineId')}: ${line.id})` : `${t('productionDetail.lineId')}: ${id}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePause}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${productionStatus === 'paused'
              ? 'bg-yellow-500 text-white border-yellow-500'
              : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
              }`}
          >
            ⏸ {t('productionDetail.pauseProduction') ?? 'Pause Production'}
          </button>
          <button
            onClick={handleStop}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            ⛔ {t('productionDetail.stopProduction') ?? 'Stop Production'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Daily summary and real-time count */}
        <div className="space-y-6 xl:col-span-2">
          {/* Daily Plan Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('productionDetail.dailyProduction')}
              </h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {t('productionDetail.dailyOutput')}
              </span>
            </div>

            {/* Shift End Warning */}
            {shiftEndWarning && (
              <div className="mb-4 p-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                      Smena yakunlandi
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {shiftEndWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.plan')}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{plannedQuantity}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('productionDetail.unitsPerDay') ?? 'unit/day'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.fact')}</p>
                <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">{producedQuantity}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('productionDetail.cameraLabel') ?? 'Camera count'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.remaining')}</p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{remainingQuantity}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('productionDetail.remainingLabel') ?? 'To target'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('productionDetail.progress')}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {PROGRESS}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${productionStatus === 'paused'
                    ? 'bg-gray-400 dark:bg-gray-500'
                    : 'bg-blue-600 dark:bg-blue-500'
                    }`}
                  style={{ width: `${PROGRESS}%` }}
                />
              </div>
              {productionStatus === 'paused' && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                    Production paused
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Drift Analytics */}
          <div className={`rounded-xl shadow-sm border p-6 transition-colors ${isDrifting ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDrifting ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}`}>
                <Activity className={`w-4 h-4 ${isDrifting ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                Production Drift Analytics
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isDrifting ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                {isDrifting ? 'CRITICAL DRIFT' : 'ON TRACK'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className={`text-xs ${isDrifting ? 'text-red-600/80 dark:text-red-300/80' : 'text-gray-500 dark:text-gray-400'}`}>Planned Takt Time</p>
                <div className="flex items-end gap-1 mt-1">
                  <p className={`text-2xl font-semibold ${isDrifting ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}`}>{taktTime}</p>
                  <span className={`text-xs pb-1 ${isDrifting ? 'text-red-700 dark:text-red-300' : 'text-gray-500'}`}>sec/unit</span>
                </div>
              </div>

              <div>
                <p className={`text-xs ${isDrifting ? 'text-red-600/80 dark:text-red-300/80' : 'text-gray-500 dark:text-gray-400'}`}>Actual Cycle Time</p>
                <div className="flex items-end gap-1 mt-1">
                  <p className={`text-2xl font-black ${isDrifting ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>{actualCycleTime}</p>
                  <span className={`text-xs pb-1 ${isDrifting ? 'text-red-700 dark:text-red-300' : 'text-gray-500'}`}>sec/unit</span>
                </div>
              </div>

              <div>
                <p className={`text-xs ${isDrifting ? 'text-red-600/80 dark:text-red-300/80' : 'text-gray-500 dark:text-gray-400'}`}>Speed Variance</p>
                <div className="flex items-end gap-1 mt-1">
                  <p className={`text-2xl font-semibold ${cycleTimeDrift > 0 ? (isDrifting ? 'text-red-600 dark:text-red-500' : 'text-yellow-600 dark:text-yellow-500') : 'text-green-600 dark:text-green-400'}`}>
                    {cycleTimeDrift > 0 ? '+' : ''}{cycleTimeDrift.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            {isDrifting && (
              <p className="mt-4 text-xs text-red-700 dark:text-red-400 font-medium">
                Warning: Production speed is more than 10% slower than planned Takt Time. Check bottleneck immediately.
              </p>
            )}
          </div>

          {/* Real-time Count */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                {t('productionDetail.realTimeCount')}
              </h2>
              <span className={cameraBadge.className}>
                {cameraBadge.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('productionDetail.lastDetected')}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  14:32:18
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('productionDetail.cameraStatus')}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {cameraBadge.label}
                </p>
              </div>
            </div>

            {/* Camera preview placeholder */}
            <div className="mb-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-black/80 flex flex-col items-center justify-center overflow-hidden aspect-video relative">
              {(!activeBrigadir || !activeInspector) && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-[2px] p-4 text-center">
                  <QrCode className="w-8 h-8 text-blue-400 mb-3 animate-pulse" />
                  <h3 className="text-white font-semibold text-sm mb-1">Authorization Required</h3>
                  <p className="text-gray-300 text-[10px] mb-4">Brigadir and QC Inspector authorization required to start</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const master = hrEmployees.find(emp => emp.position.includes('Smena') || emp.position.includes('Brigadier')) || hrEmployees[0];
                        setActiveBrigadir({ employeeId: master.employeeId, fullName: master.fullName, position: master.position });
                      }}
                      className={`px-3 py-1.5 rounded text-[10px] font-medium transition-colors border ${activeBrigadir ? 'bg-green-600/20 text-green-400 border-green-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'}`}
                    >
                      {activeBrigadir ? '✓ Brigadir Auth' : 'Scan Brigadir'}
                    </button>
                    <button
                      onClick={() => {
                        const inspector = hrEmployees.find(emp => emp.position.includes('Sifat') || emp.position.includes('Inspector')) || hrEmployees[1];
                        setActiveInspector({ employeeId: inspector.employeeId, fullName: inspector.fullName, position: inspector.position });
                      }}
                      className={`px-3 py-1.5 rounded text-[10px] font-medium transition-colors border ${activeInspector ? 'bg-green-600/20 text-green-400 border-green-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-600'}`}
                    >
                      {activeInspector ? '✓ QC Auth' : 'Scan QC'}
                    </button>
                  </div>
                </div>
              )}
              <div className="w-full max-w-[640px] h-full flex flex-col items-center justify-center border border-dashed border-gray-600/60">
                <span className="text-xs font-medium text-gray-300 mb-1">
                  Camera Feed (mock)
                </span>
                <span className="text-[10px] text-gray-500">
                  16:9 • 640x360 placeholder
                </span>
              </div>
            </div>

            {/* Camera metrics */}
            <div className="mb-2 flex items-center justify-between gap-4 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1 font-medium">
                <Printer className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Thermal Printer: Online</span>
              </div>
              <div className="flex gap-4">
                <span>FPS: 25</span>
                <span>Detection accuracy: 98.7%</span>
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('productionDetail.cameraPlaceholder')}
              </p>
            </div>
          </div>
        </div>

        {/* Right column - AI intelligence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
              AI Intelligence
            </h2>
          </div>
          <div className="space-y-4">
            {/* Option Detection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Digital Twin (Door Trim)
                </h3>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  LIVE CONVEYOR
                </span>
              </div>
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kameradan hozir o'tayotgan tayyor detal:</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-black shadow-sm border ${currentOption.includes('FRT')
                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300'
                  }`}>
                  {currentOption} {currentOption.includes('LH') ? '(Left System)' : '(Right System)'}
                </span>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Automotive Components Check</p>

                <div className={`p-3 rounded-lg border-2 transition-all ${currentOption.includes('FRT') ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-xs ${currentOption.includes('FRT') ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}>FRT (Front Door) Check</span>
                    {currentOption.includes('FRT') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentOption.includes('FRT') ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      Power Window Switch Module
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentOption.includes('FRT') ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      Premium Speaker Grill
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border-2 transition-all ${currentOption.includes('RR') ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-xs ${currentOption.includes('RR') ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-500'}`}>RR (Rear Door) Check</span>
                    {currentOption.includes('RR') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentOption.includes('RR') ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      Manual Window Crank Hole Cover
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentOption.includes('RR') ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      Child Lock Indicator Hole
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Label Preview */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Printer className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Last Printed Unit</h3>
              </div>

              {lastPrintedLabel ? (
                <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-600 rounded p-3 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <QrCode className="w-16 h-16" />
                  </div>
                  <div className="relative z-10 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700/50 pb-2 mb-2">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                          <Activity className="w-2.5 h-2.5" /> Zavod
                        </span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-wide">{lastPrintedLabel.id}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5">{lastPrintedLabel.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300"><b>Option:</b> {lastPrintedLabel.option}</p>
                    <p className="text-[10px] text-gray-500 mt-1"><b>Brigadir:</b> {lastPrintedLabel.brigadir}</p>
                    <p className="text-[10px] text-gray-500"><b>QC:</b> {lastPrintedLabel.inspector}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-white/50 dark:bg-black/20 rounded border border-gray-100 dark:border-gray-700/50">
                  <QrCode className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-[11px] text-gray-400">Waiting for next scan...</p>
                </div>
              )}
            </div>

            {/* Defect Detection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  {t('productionDetail.defectDetection')}
                </h3>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  AI READY (mock)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t('productionDetail.defectDetectionPlaceholder')}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Scratches</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">3</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Missing Part</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">1</span>
                </div>
              </div>
            </div>

            {/* Live Shift Event Log */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-blue-500" />
                  Smena hodisalari
                </h3>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  LIVE
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {shiftEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Hech qanday hodisa yo'q</p>
                ) : (
                  shiftEvents.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs border-b border-gray-100 dark:border-gray-700/50 pb-1.5 last:border-0">
                      <span className="text-gray-400 dark:text-gray-500 shrink-0 font-mono">{ev.time}</span>
                      <span className={`flex-1 ${ev.type === 'andon' ? 'text-red-600 dark:text-red-400 font-semibold' :
                        ev.type === 'output' ? 'text-green-700 dark:text-green-400' :
                          ev.type === 'stop' ? 'text-yellow-700 dark:text-yellow-400' :
                            ev.type === 'resume' ? 'text-blue-700 dark:text-blue-400' :
                              'text-gray-600 dark:text-gray-300'
                        }`}>{ev.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Shift & Line Responsibility Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Smena va liniya mas'uliyati
              </h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${shiftStatus === 'completed'
                ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : shiftStatus === 'not_completed'
                  ? 'bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                }`}>
                {shiftStatus === 'completed' ? 'Yakunlandi' : shiftStatus === 'not_completed' ? 'Bajarilmadi' : 'Faol'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Current Shift */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Joriy smena</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getShiftLabel(shiftInfo.type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Smena vaqti</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {shiftInfo.startTime} – {shiftInfo.endTime}
                  </p>
                </div>
              </div>

              {/* Line Master & QC Inspector */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Liniya ustasi
                      </p>
                      {activeBrigadir && (
                        <button onClick={handleBrigadirLogout} className="text-[10px] text-red-500 hover:text-red-700">Chiqish</button>
                      )}
                    </div>
                    {activeBrigadir ? (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {activeBrigadir.fullName}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          ID: {activeBrigadir.employeeId} · {activeBrigadir.position}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Skanner kutilmoqda...
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Sifat Nazoratchi (QC)
                      </p>
                      {activeInspector && (
                        <button onClick={handleInspectorLogout} className="text-[10px] text-red-500 hover:text-red-700">Chiqish</button>
                      )}
                    </div>
                    {activeInspector ? (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                            <span className="flex h-1.5 w-1.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span></span>
                            QC Verified
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {activeInspector.fullName}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                          ID: {activeInspector.employeeId} · {activeInspector.position}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Skanner kutilmoqda...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Workers Count */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Xodimlar soni
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {workersCount} / {maxWorkers}
                </p>
                <div className="mt-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
                    style={{ width: `${(workersCount / maxWorkers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Shift Times */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Smena boshlanishi</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {shiftInfo.startTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Smena tugashi</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {shiftInfo.endTime}
                  </p>
                </div>
              </div>

              {/* Time Until Shift End (if active) */}
              {shiftStatus === 'active' && !hasShiftEnded() && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Smena tugashiga qolgan vaqt
                  </p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {Math.floor(getTimeUntilShiftEnd() / 60)} soat {getTimeUntilShiftEnd() % 60} daqiqa
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

