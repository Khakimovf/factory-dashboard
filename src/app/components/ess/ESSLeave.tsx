import { useLanguage } from '../../context/LanguageContext';
import { mockLeaveBalance, calculateWorkExperience, mockCurrentEmployee } from '../../data/essData';
import { Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export function ESSLeave() {
  const { t } = useLanguage();
  const workExp = calculateWorkExperience(mockCurrentEmployee.employmentDate);
  const usedPercentage = (mockLeaveBalance.usedDays / mockLeaveBalance.totalDays) * 100;
  const remainingPercentage = (mockLeaveBalance.remainingDays / mockLeaveBalance.totalDays) * 100;

  return (
    <div className="space-y-6">
      {/* Work Experience Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {t('ess.leave.workExperience')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {t('ess.leave.totalExperience')}
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {workExp.years} {t('ess.profile.years')} {workExp.months} {t('ess.profile.months')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {t('ess.leave.hireDate')}
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {new Date(mockCurrentEmployee.employmentDate).toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LeaveBalanceCard
          title={t('ess.leave.totalDays')}
          value={mockLeaveBalance.totalDays}
          icon={Calendar}
          color="blue"
        />
        <LeaveBalanceCard
          title={t('ess.leave.usedDays')}
          value={mockLeaveBalance.usedDays}
          icon={CheckCircle}
          color="orange"
        />
        <LeaveBalanceCard
          title={t('ess.leave.remainingDays')}
          value={mockLeaveBalance.remainingDays}
          icon={Clock}
          color="green"
        />
        <LeaveBalanceCard
          title={t('ess.leave.pendingDays')}
          value={mockLeaveBalance.pendingDays}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Leave Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('ess.leave.leaveProgress')}
        </h3>

        {/* Used Leave Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('ess.leave.used')}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {mockLeaveBalance.usedDays} / {mockLeaveBalance.totalDays} {t('ess.leave.days')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all"
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
        </div>

        {/* Remaining Leave Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('ess.leave.remaining')}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {mockLeaveBalance.remainingDays} / {mockLeaveBalance.totalDays} {t('ess.leave.days')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${remainingPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leave Entitlement Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          {t('ess.leave.entitlementInfo')}
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          {t('ess.leave.entitlementNote')}
        </p>
      </div>
    </div>
  );
}

interface LeaveBalanceCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function LeaveBalanceCard({ title, value, icon: Icon, color }: LeaveBalanceCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
