import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HRSubNav } from './HRSubNav';
import { hrEmployees, Employee, EmployeeStatus } from '../../data/hrEmployees';
import { Users, UserCheck, Heart, Plane, UserX } from 'lucide-react';

export function HRStatsPage() {
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(null);

  // Calculate statistics from employee data
  const totalEmployees = hrEmployees.length;
  const activeEmployees = hrEmployees.filter((e) => e.status === 'active').length;
  const sickEmployees = hrEmployees.filter((e) => e.status === 'sick').length;
  const vacationEmployees = hrEmployees.filter((e) => e.status === 'vacation').length;
  const absentEmployees = hrEmployees.filter((e) => e.status === 'absent').length;

  // Get employees by selected status for detailed view
  const getEmployeesByStatus = (status: EmployeeStatus): Employee[] => {
    return hrEmployees.filter((e) => e.status === status);
  };

  const selectedEmployees = selectedStatus ? getEmployeesByStatus(selectedStatus) : [];

  const handleCardClick = (status: EmployeeStatus) => {
    if (selectedStatus === status) {
      setSelectedStatus(null); // Toggle off if already selected
    } else {
      setSelectedStatus(status);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('hr.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('hr.subtitle')}
        </p>
        <HRSubNav />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 mt-6">
        <StatCard
          title={t('hr.stats.totalEmployees')}
          value={totalEmployees}
          icon={Users}
          color="blue"
        />
        <StatCard
          title={t('hr.stats.activeEmployees')}
          value={activeEmployees}
          icon={UserCheck}
          color="green"
        />
        <ClickableStatCard
          title={t('hr.stats.sickEmployees')}
          value={sickEmployees}
          icon={Heart}
          color="orange"
          status="sick"
          isSelected={selectedStatus === 'sick'}
          onClick={() => handleCardClick('sick')}
        />
        <ClickableStatCard
          title={t('hr.stats.vacationEmployees')}
          value={vacationEmployees}
          icon={Plane}
          color="purple"
          status="vacation"
          isSelected={selectedStatus === 'vacation'}
          onClick={() => handleCardClick('vacation')}
        />
        <ClickableStatCard
          title={t('hr.stats.absentEmployees')}
          value={absentEmployees}
          icon={UserX}
          color="red"
          status="absent"
          isSelected={selectedStatus === 'absent'}
          onClick={() => handleCardClick('absent')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees by Department Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {t('hr.stats.employeesByDepartment')}
          </h3>
          <div className="space-y-3">
            {(() => {
              const employeesByDepartmentMap = new Map<string, number>();
              hrEmployees.forEach((e) => {
                employeesByDepartmentMap.set(
                  e.department,
                  (employeesByDepartmentMap.get(e.department) || 0) + 1
                );
              });
              const employeesByDepartment = Array.from(employeesByDepartmentMap.entries()).map(
                ([department, count]) => ({ department, count })
              );
              const maxDeptCount = employeesByDepartment.reduce(
                (max, item) => (item.count > max ? item.count : max),
                0
              );

              return employeesByDepartment.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('hr.stats.noData')}
                </p>
              ) : (
                employeesByDepartment.map((item) => (
                  <BarRow
                    key={item.department}
                    label={item.department}
                    value={item.count}
                    max={maxDeptCount || 1}
                    colorClass="bg-blue-500"
                  />
                ))
              );
            })()}
          </div>
        </div>

        {/* Detailed Employee List (shown when a status card is clicked) */}
        {selectedStatus && selectedEmployees.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t(`hr.stats.${selectedStatus}Employees`)} - {selectedEmployees.length}
              </h3>
              <button
                onClick={() => setSelectedStatus(null)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {t('hr.employees.close')}
              </button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedEmployees.map((employee) => (
                <div
                  key={employee.employeeId}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {employee.department} • {employee.position}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {employee.employeeId}
                    </span>
                  </div>
                  {employee.statusReason && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                      <span className="font-medium">{t('hr.stats.reason')}:</span>{' '}
                      {employee.statusReason}
                    </p>
                  )}
                  {employee.statusDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="font-medium">{t('hr.stats.date')}:</span>{' '}
                      {new Date(employee.statusDate).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when status is selected but no employees */}
        {selectedStatus && selectedEmployees.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t(`hr.stats.${selectedStatus}Employees`)}
              </h3>
              <button
                onClick={() => setSelectedStatus(null)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {t('hr.employees.close')}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
              {t('hr.stats.noEmployeesWithStatus')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
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

interface ClickableStatCardProps extends StatCardProps {
  status: EmployeeStatus;
  isSelected: boolean;
  onClick: () => void;
}

function ClickableStatCard({
  title,
  value,
  icon: Icon,
  color,
  status,
  isSelected,
  onClick,
}: ClickableStatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all text-left w-full p-4 ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500 dark:ring-blue-400'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </button>
  );
}

interface BarRowProps {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}

function BarRow({ label, value, max, colorClass }: BarRowProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-xs text-gray-600 dark:text-gray-300 truncate">
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`${colorClass} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
