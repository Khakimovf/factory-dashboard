import { useLanguage } from '../../context/LanguageContext';
import { HRSubNav } from './HRSubNav';
import { hrEmployees } from '../../data/hrEmployees';

function isToday(dateString: string) {
  const d = new Date(dateString);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function HRStatsPage() {
  const { t } = useLanguage();

  const totalEmployees = hrEmployees.length;
  const activeEmployees = hrEmployees.filter((e) => e.status === 'active').length;
  const hiredToday = hrEmployees.filter((e) => isToday(e.employmentDate)).length;

  const employeesByDepartmentMap = new Map<string, number>();
  hrEmployees.forEach((e) => {
    employeesByDepartmentMap.set(e.department, (employeesByDepartmentMap.get(e.department) || 0) + 1);
  });
  const employeesByDepartment = Array.from(employeesByDepartmentMap.entries()).map(
    ([department, count]) => ({ department, count }),
  );
  const maxDeptCount = employeesByDepartment.reduce(
    (max, item) => (item.count > max ? item.count : max),
    0,
  );


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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
          <StatCard title={t('hr.stats.totalEmployees')} value={totalEmployees} />
          <StatCard title={t('hr.stats.activeEmployees')} value={activeEmployees} />
          <StatCard title={t('hr.stats.hiredToday')} value={hiredToday} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {t('hr.stats.employeesByDepartment')}
            </h3>
            <div className="space-y-3">
              {employeesByDepartment.map((item) => (
                <BarRow
                  key={item.department}
                  label={item.department}
                  value={item.count}
                  max={maxDeptCount || 1}
                  colorClass="bg-blue-500"
                />
              ))}
              {employeesByDepartment.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('hr.stats.noData')}
                </p>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
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


