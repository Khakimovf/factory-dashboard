import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Utensils, Users, Clock, CheckCircle, AlertCircle, Settings, Lock, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { countUniqueEmployeesToday, generateMockTurnstileLogs, TurnstileLog } from '../../services/attendanceService';
import { isAdmin, getCurrentUserRole } from '../../utils/roleUtils';
import { toast } from 'sonner';

export interface DailyMealPlan {
  id: string;
  date: string;
  totalEmployees: number;
  beforeCutoff: number;
  afterCutoff: number;
  byShift: Record<string, number>;
  bufferPercent: number;
  finalCount: number; // totalEmployees + buffer
  status: 'pending' | 'finalized';
  finalizedAt?: string;
  finalizedBy?: string;
  cutoffTime?: string; // Time when finalized (HH:MM format)
}

// Canteen settings stored in localStorage (in production, this would be in backend)
const CANTEEN_SETTINGS_KEY = 'canteen_settings_v1';
const DEFAULT_BUFFER_PERCENT = 5;
const MAX_BUFFER_PERCENT = 15;
const DEFAULT_CUTOFF_TIME = '09:00';

interface CanteenSettings {
  bufferPercent: number;
  cutoffTime: string;
}

function loadCanteenSettings(): CanteenSettings {
  try {
    const stored = localStorage.getItem(CANTEEN_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {
    bufferPercent: DEFAULT_BUFFER_PERCENT,
    cutoffTime: DEFAULT_CUTOFF_TIME,
  };
}

function saveCanteenSettings(settings: CanteenSettings): void {
  try {
    localStorage.setItem(CANTEEN_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

// Map shift names to translation keys
function getShiftTranslationKey(shift: string): string {
  const shiftMap: Record<string, string> = {
    'Morning': 'shiftMorning',
    'Afternoon': 'shiftAfternoon',
    'Night': 'shiftNight',
  };
  return shiftMap[shift] || 'shiftUnknown';
}

export function CanteenPage() {
  const { t } = useLanguage();
  const [turnstileLogs, setTurnstileLogs] = useState<TurnstileLog[]>(() => generateMockTurnstileLogs());
  const [settings, setSettings] = useState<CanteenSettings>(loadCanteenSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dailyPlans, setDailyPlans] = useState<DailyMealPlan[]>([]);
  const [tempBufferPercent, setTempBufferPercent] = useState(settings.bufferPercent);
  const [tempCutoffTime, setTempCutoffTime] = useState(settings.cutoffTime);

  const currentRole = getCurrentUserRole();
  const canEdit = isAdmin() || currentRole === 'hr'; // Admin and HR can edit
  const isCanteenRole = currentRole === 'canteen'; // Canteen role is read-only

  // Calculate current attendance count with configurable cutoff
  const attendanceCount = useMemo(() => {
    return countUniqueEmployeesToday(turnstileLogs, settings.cutoffTime, '06:00');
  }, [turnstileLogs, settings.cutoffTime]);

  // Check if count should be finalized (after cutoff time)
  const currentTime = new Date();
  const [cutoffHour, cutoffMinute] = settings.cutoffTime.split(':').map(Number);
  const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const cutoffTimeMinutes = cutoffHour * 60 + cutoffMinute;
  const isAfterCutoff = currentTimeMinutes >= cutoffTimeMinutes;
  const today = new Date().toISOString().split('T')[0];

  // Get today's plan or create pending one
  const todayPlan = useMemo(() => {
    const existing = dailyPlans.find(p => p.date === today);
    if (existing) return existing;

    const finalCount = Math.ceil(attendanceCount.totalEmployees * (1 + settings.bufferPercent / 100));
    return {
      id: `plan-${today}`,
      date: today,
      totalEmployees: attendanceCount.totalEmployees,
      beforeCutoff: attendanceCount.beforeCutoff,
      afterCutoff: attendanceCount.afterCutoff,
      byShift: attendanceCount.byShift,
      bufferPercent: settings.bufferPercent,
      finalCount,
      status: isAfterCutoff ? 'finalized' : 'pending',
      finalizedAt: isAfterCutoff ? new Date().toISOString() : undefined,
      finalizedBy: isAfterCutoff ? 'System' : undefined,
      cutoffTime: settings.cutoffTime,
    } as DailyMealPlan;
  }, [dailyPlans, today, attendanceCount, settings.bufferPercent, isAfterCutoff, settings.cutoffTime]);

  // Auto-finalize at cutoff time
  useEffect(() => {
    if (isAfterCutoff && todayPlan.status === 'pending') {
      const finalizedPlan: DailyMealPlan = {
        ...todayPlan,
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
        finalizedBy: 'System',
        cutoffTime: settings.cutoffTime,
      };
      setDailyPlans(prev => {
        const filtered = prev.filter(p => p.date !== today);
        return [finalizedPlan, ...filtered];
      });
      toast.success(t('canteen.autoFinalized'));
    }
  }, [isAfterCutoff, todayPlan, today, t, settings.cutoffTime]);

  // Update today's plan when attendance changes (ONLY if not finalized)
  useEffect(() => {
    if (todayPlan.status === 'pending' && !isAfterCutoff) {
      const updatedPlan: DailyMealPlan = {
        ...todayPlan,
        totalEmployees: attendanceCount.totalEmployees,
        beforeCutoff: attendanceCount.beforeCutoff,
        afterCutoff: attendanceCount.afterCutoff,
        byShift: attendanceCount.byShift,
        finalCount: Math.ceil(attendanceCount.totalEmployees * (1 + settings.bufferPercent / 100)),
        bufferPercent: settings.bufferPercent,
      };
      setDailyPlans(prev => {
        const filtered = prev.filter(p => p.date !== today);
        return [updatedPlan, ...filtered];
      });
    }
  }, [attendanceCount, settings.bufferPercent, todayPlan.status, today, isAfterCutoff]);

  const handleManualFinalize = () => {
    if (todayPlan.status === 'finalized') {
      toast.error(t('canteen.alreadyFinalized'));
      return;
    }

    const finalizedPlan: DailyMealPlan = {
      ...todayPlan,
      status: 'finalized',
      finalizedAt: new Date().toISOString(),
      finalizedBy: currentRole === 'hr' ? 'HR' : 'Admin', // Get from auth context
      cutoffTime: settings.cutoffTime,
    };
    setDailyPlans(prev => {
      const filtered = prev.filter(p => p.date !== today);
      return [finalizedPlan, ...filtered];
    });
    toast.success(t('canteen.manualFinalized'));
  };

  const handleSaveSettings = () => {
    // Validate buffer percent
    if (tempBufferPercent < 0 || tempBufferPercent > MAX_BUFFER_PERCENT) {
      toast.error(`Buffer must be between 0 and ${MAX_BUFFER_PERCENT}%`);
      return;
    }

    // Validate cutoff time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(tempCutoffTime)) {
      toast.error('Invalid time format. Use HH:MM (e.g., 09:00)');
      return;
    }

    const newSettings: CanteenSettings = {
      bufferPercent: tempBufferPercent,
      cutoffTime: tempCutoffTime,
    };

    setSettings(newSettings);
    saveCanteenSettings(newSettings);

    // Update today's plan if not finalized
    if (todayPlan.status === 'pending') {
      const updatedPlan: DailyMealPlan = {
        ...todayPlan,
        bufferPercent: tempBufferPercent,
        finalCount: Math.ceil(attendanceCount.totalEmployees * (1 + tempBufferPercent / 100)),
        cutoffTime: tempCutoffTime,
      };
      setDailyPlans(prev => {
        const filtered = prev.filter(p => p.date !== today);
        return [updatedPlan, ...filtered];
      });
    }

    setIsSettingsOpen(false);
    toast.success(t('canteen.settingsSaved'));
  };

  const handleOpenSettings = () => {
    setTempBufferPercent(settings.bufferPercent);
    setTempCutoffTime(settings.cutoffTime);
    setIsSettingsOpen(true);
  };

  const isFinalized = todayPlan.status === 'finalized';

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <Utensils className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {t('canteen.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('canteen.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={handleOpenSettings}>
              <Settings className="w-4 h-4 mr-2" />
              {t('canteen.settings')}
            </Button>
          )}
          {canEdit && !isFinalized && (
            <Button onClick={handleManualFinalize}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('canteen.finalizeNow')}
            </Button>
          )}
        </div>
      </div>

      {/* Finalized Message */}
      {isFinalized && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-300">
                {t('canteen.finalizedMessage')}
              </p>
              {todayPlan.finalizedAt && todayPlan.finalizedBy && (
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {t('canteen.finalizedBy')}: {todayPlan.finalizedBy} • {t('canteen.finalizedAt')}: {new Date(todayPlan.finalizedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Read-only mode notice for canteen role */}
      {isCanteenRole && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">{t('canteen.readOnlyMode')}</p>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-6">
        <Badge
          className={
            isFinalized
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-base px-4 py-2'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-base px-4 py-2'
          }
        >
          {isFinalized ? (
            <>
              <Lock className="w-4 h-4 mr-2 inline" />
              {t('canteen.finalized')}
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2 inline" />
              {t('canteen.pending')}
            </>
          )}
        </Badge>
      </div>

      {/* Big Numbers Dashboard */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 cursor-help">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('canteen.totalEmployees')}</h3>
                </div>
                <p className="text-5xl font-bold text-gray-900 dark:text-white">{todayPlan.totalEmployees}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('canteen.uniqueEntries')}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('canteen.totalEmployeesTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 cursor-help">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('canteen.beforeCutoff')}</h3>
                </div>
                <p className="text-5xl font-bold text-green-600 dark:text-green-400">{todayPlan.beforeCutoff}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('canteen.enteredBefore0900')}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('canteen.beforeCutoffTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 cursor-help">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('canteen.afterCutoff')}</h3>
                </div>
                <p className="text-5xl font-bold text-orange-600 dark:text-orange-400">{todayPlan.afterCutoff}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('canteen.enteredAfter0900')}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('canteen.afterCutoffTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-blue-300 dark:border-blue-700 p-8 cursor-help">
                <div className="flex items-center gap-3 mb-4">
                  <Utensils className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('canteen.finalMealCount')}</h3>
                  {isFinalized && (
                    <span title={t('canteen.lockIconTooltip')}>
                      <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </span>
                  )}
                </div>
                <p className="text-5xl font-bold text-blue-600 dark:text-blue-400">{todayPlan.finalCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t('canteen.withBuffer')} (+{todayPlan.bufferPercent}%)
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('canteen.finalCountTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Shift Breakdown */}
      {Object.keys(todayPlan.byShift).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('canteen.shiftBreakdown')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(todayPlan.byShift).map(([shift, count]) => (
              <div key={shift} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t(`canteen.${getShiftTranslationKey(shift)}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">{t('canteen.howItWorks')}</p>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-disc list-inside">
              <li>{t('canteen.info1')}</li>
              <li>{t('canteen.info2')}</li>
              <li>{t('canteen.info3')}</li>
              {!isFinalized && (
                <li>{t('canteen.info4')}</li>
              )}
            </ul>
            {!isFinalized && (
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-3">
                {t('canteen.cutoffTime')}: {settings.cutoffTime}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('canteen.settings')}</DialogTitle>
            <DialogDescription>{t('canteen.settingsDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bufferPercent">{t('canteen.bufferPercent')}</Label>
              <Input
                id="bufferPercent"
                type="number"
                min="0"
                max={MAX_BUFFER_PERCENT}
                step="0.1"
                value={tempBufferPercent}
                onChange={(e) => setTempBufferPercent(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('canteen.bufferDescription')} ({t('canteen.bufferExplanation')})
              </p>
            </div>
            <div>
              <Label htmlFor="cutoffTime">{t('canteen.cutoffTime')}</Label>
              <Input
                id="cutoffTime"
                type="text"
                placeholder="09:00"
                value={tempCutoffTime}
                onChange={(e) => setTempCutoffTime(e.target.value)}
                pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('canteen.cutoffTimeDescription')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              {t('canteen.cancel')}
            </Button>
            <Button onClick={handleSaveSettings}>{t('canteen.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
