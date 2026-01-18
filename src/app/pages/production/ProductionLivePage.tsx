import { useState, useEffect, useMemo } from 'react';
import { Activity, ArrowLeft, Camera, AlertTriangle, ListTree, Clock, User, Users, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';
import { useDailyProductionPlan } from '../../context/DailyProductionPlanContext';
import { getCurrentShiftInfo, getShiftLabel, hasShiftEnded, getTimeUntilShiftEnd, type ShiftType } from '../../utils/shiftUtils';
import { hrEmployees, type Employee } from '../../data/hrEmployees';

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
  const { productionLines } = useFactory();
  const { getTodayLinePlan } = useDailyProductionPlan();

  const line = productionLines.find(l => l.id === id);

  // Shift management
  const shiftInfo = getCurrentShiftInfo();
  const [lineMaster, setLineMaster] = useState<LineMaster | null>(() => {
    // Mock: Get first available shift master from employees
    const master = hrEmployees.find(
      emp => (emp.position.includes('Smena boshlig') || emp.position.includes('Brigadier')) && emp.status === 'active'
    );
    return master ? {
      employeeId: master.employeeId,
      fullName: master.fullName,
      position: master.position,
    } : null;
  });
  const [workersCount, setWorkersCount] = useState(14);
  const maxWorkers = 16;

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

  const [productionStatus, setProductionStatus] = useState<'active' | 'paused' | 'stopped'>('active');

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

  // Simulate production counting (mock camera events)
  // TODO: Replace with actual camera event handler
  // When camera detects a part:
  // 1. Call recordProductionEvent('part_detected', partNumber)
  // 2. Increment producedQuantity
  // 3. Decrement remainingQuantity
  // 4. Update line_buffer if needed
  useEffect(() => {
    if (productionStatus === 'active' && !hasShiftEnded()) {
      const interval = setInterval(() => {
        setProducedQuantity(prev => prev + 1);
        // In production: This would be triggered by camera events
        // recordProductionEvent(lineId, shiftAssignmentId, 'part_detected', partNumber);
      }, 5000); // Increment every 5 seconds (mock)

      return () => clearInterval(interval);
    }
  }, [productionStatus]);

  const handlePause = () => {
    setProductionStatus(prev => (prev === 'paused' ? 'active' : 'paused'));
  };

  const handleStop = () => {
    setProductionStatus('stopped');
  };

  const getCameraStatusBadge = () => {
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
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
              productionStatus === 'paused'
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
                  className={`h-full transition-all ${
                    productionStatus === 'paused'
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
            <div className="mb-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-black/80 flex flex-col items-center justify-center overflow-hidden aspect-video">
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
            <div className="mb-2 flex items-center justify-end gap-4 text-[11px] text-gray-500 dark:text-gray-400">
              <span>FPS: 25</span>
              <span>Detection accuracy: 98.7%</span>
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
                  {t('productionDetail.optionDetection')}
                </h3>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  AI READY (mock)
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t('productionDetail.optionDetectionPlaceholder')}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Model A</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">210</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Model B</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">146</span>
                </div>
              </div>
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

            {/* Event Log */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ListTree className="w-4 h-4 text-blue-500" />
                  {t('productionDetail.eventLog')}
                </h3>
                <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  MOCK
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">14:30</span>
                  <span className="ml-3 flex-1 text-gray-900 dark:text-gray-100">
                    Live production started
                  </span>
                </div>
                <div className="flex items-start justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">14:10</span>
                  <span className="ml-3 flex-1 text-gray-900 dark:text-gray-100">
                    Camera connected and counting parts
                  </span>
                </div>
                <div className="flex items-start justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">13:55</span>
                  <span className="ml-3 flex-1 text-gray-900 dark:text-gray-100">
                    Daily production plan loaded
                  </span>
                </div>
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
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                shiftStatus === 'completed'
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

              {/* Line Master */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Liniya ustasi (Brigadir)
                </p>
                {lineMaster ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {lineMaster.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      ID: {lineMaster.employeeId} • {lineMaster.position}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Liniya ustasi tayinlanmagan
                  </p>
                )}
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

