import { useLanguage } from '../../context/LanguageContext';
import { mockAttendanceRecords } from '../../data/essData';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ESSAttendance() {
  const { t } = useLanguage();

  // Calculate monthly summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRecords = mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const totalDays = monthRecords.length;
  const lateDays = monthRecords.filter((r) => r.isLate).length;
  const absentDays = monthRecords.filter((r) => r.isAbsent).length;
  const onTimeDays = totalDays - lateDays - absentDays;
  const totalHours = monthRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title={t('ess.attendance.totalDays')}
          value={totalDays}
          icon={CheckCircle}
          color="blue"
        />
        <SummaryCard
          title={t('ess.attendance.onTime')}
          value={onTimeDays}
          icon={CheckCircle}
          color="green"
        />
        <SummaryCard
          title={t('ess.attendance.late')}
          value={lateDays}
          icon={AlertCircle}
          color="orange"
        />
        <SummaryCard
          title={t('ess.attendance.totalHours')}
          value={totalHours.toFixed(1)}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Monthly Chart (UI only) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('ess.attendance.monthlyChart')}
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {monthRecords.map((record, index) => {
            const date = new Date(record.date);
            const day = date.getDate();
            const maxHours = 9;
            const height = record.workHours ? (record.workHours / maxHours) * 100 : 0;
            const color = record.isLate
              ? 'bg-orange-500'
              : record.isAbsent
              ? 'bg-red-500'
              : 'bg-green-500';

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
                  style={{ height: `${height}%` }}
                  title={`${day}: ${record.workHours?.toFixed(1) || 0}h`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{day}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          {t('ess.attendance.chartNote')}
        </p>
      </div>

      {/* Daily Attendance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('ess.attendance.dailyRecords')}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.attendance.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.attendance.checkIn')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.attendance.checkOut')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.attendance.workHours')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.attendance.status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockAttendanceRecords.slice(0, 30).map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {record.checkIn || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {record.checkOut || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {record.isAbsent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        <XCircle className="w-3 h-3" />
                        {t('ess.attendance.absent')}
                      </span>
                    ) : record.isLate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                        <AlertCircle className="w-3 h-3" />
                        {t('ess.attendance.late')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        {t('ess.attendance.onTime')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
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
