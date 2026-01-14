import { useState } from 'react';
import { Activity, ArrowLeft, Camera, AlertTriangle, ListTree } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useFactory } from '../../context/FactoryContext';

export function ProductionLivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { productionLines } = useFactory();

  const line = productionLines.find(l => l.id === id);

  // Mocked daily production data
  const PLAN = 1000;
  const FACT = 356;
  const REMAINING = PLAN - FACT;

  const [productionStatus, setProductionStatus] = useState<'active' | 'paused' | 'stopped'>('active');

  const PROGRESS = Math.max(0, Math.min(100, Math.round((FACT / PLAN) * 100)));

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

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.plan')}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{PLAN}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('productionDetail.unitsPerDay') ?? 'unit/day'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.fact')}</p>
                <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">{FACT}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('productionDetail.cameraLabel') ?? 'Camera count'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.remaining')}</p>
                <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{REMAINING}</p>
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
        </div>
      </div>
    </div>
  );
}

