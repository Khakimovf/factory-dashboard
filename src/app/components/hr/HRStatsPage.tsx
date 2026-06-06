import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HRSubNav } from './HRSubNav';
import { hrEmployees, Employee, EmployeeStatus } from '../../data/hrEmployees';
import { Users, UserCheck, Heart, Plane, UserX, Clock, CheckCircle, XCircle, Search, X } from 'lucide-react';
import { getLateReports, updateLateReportStatus } from '../../services/lateReportsService';
import { LateArrivalReport, getReasonLabel } from '../../data/lateReportsData';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

export function HRStatsPage() {
  const { t } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | null>(null);
  const [lateReports, setLateReports] = useState<LateArrivalReport[]>([]);
  const [isLateReportsDrawerOpen, setIsLateReportsDrawerOpen] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all'>('today');
  const [shiftFilter, setShiftFilter] = useState<'08:00' | '20:00' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'new' | 'approved' | 'rejected' | 'all'>('all');

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

  const loadLateReports = async () => {
    setIsLoadingReports(true);
    try {
      const reports = await getLateReports();
      setLateReports(reports);
    } catch (error) {
      toast.error('Xatolik: Kechikish hisobotlarini yuklashda muammo');
      console.error('Failed to load late reports:', error);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await updateLateReportStatus(reportId, 'approved');
      toast.success('Hisobot tasdiqlandi');
      await loadLateReports(); // Refresh list
    } catch (error) {
      toast.error('Xatolik: Hisobotni tasdiqlashda muammo');
      console.error('Failed to approve report:', error);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      await updateLateReportStatus(reportId, 'rejected');
      toast.success('Hisobot rad etildi');
      await loadLateReports(); // Refresh list
    } catch (error) {
      toast.error('Xatolik: Hisobotni rad etishda muammo');
      console.error('Failed to reject report:', error);
    }
  };

  // Load late reports when drawer opens
  useEffect(() => {
    if (isLateReportsDrawerOpen) {
      loadLateReports();
    }
  }, [isLateReportsDrawerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = [...lateReports];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.employee_name.toLowerCase().includes(query) ||
        r.employee_id.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      filtered = filtered.filter(r => {
        const reportDate = new Date(r.created_at);
        if (dateFilter === 'today') {
          return reportDate >= today;
        } else if (dateFilter === 'yesterday') {
          return reportDate >= yesterday && reportDate < today;
        }
        return true;
      });
    }

    // Shift filter
    if (shiftFilter !== 'all') {
      filtered = filtered.filter(r => r.shift_start_time === shiftFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    return filtered;
  }, [lateReports, searchQuery, dateFilter, shiftFilter, statusFilter]);

  const newReportsCount = lateReports.filter(r => r.status === 'new').length;

  return (
    <div className="p-8 bg-background text-foreground min-h-full">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('hr.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('hr.subtitle')}
        </p>
        <HRSubNav />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8 mt-6">
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
        <ClickableStatCard
          title="Kechikish hisobotlari"
          value={newReportsCount}
          icon={Clock}
          color="orange"
          status="late-reports"
          isSelected={isLateReportsDrawerOpen}
          onClick={() => setIsLateReportsDrawerOpen(true)}
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

      {/* Late Arrival Reports Drawer */}
      <Drawer open={isLateReportsDrawerOpen} onOpenChange={setIsLateReportsDrawerOpen} direction="right">
        <DrawerContent className="!w-[55vw] !max-w-4xl min-w-[600px] bg-background text-foreground border-border data-[vaul-drawer-direction=right]:!w-[55vw] data-[vaul-drawer-direction=right]:!max-w-4xl">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl font-semibold text-foreground">
                  Kechikish hisobotlari
                </DrawerTitle>
                <DrawerDescription className="text-sm text-muted-foreground mt-1">
                  Jami: {filteredReports.length} ta hisobot
                </DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLateReportsDrawerOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Xodim nomi yoki ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'today' | 'yesterday' | 'all')}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="today">Bugun</option>
                <option value="yesterday">Kecha</option>
                <option value="all">Barcha kunlar</option>
              </select>

              {/* Shift Filter */}
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value as '08:00' | '20:00' | 'all')}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Barcha smenalar</option>
                <option value="08:00">Kunduzi (08:00)</option>
                <option value="20:00">Tungi (20:00)</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'new' | 'approved' | 'rejected' | 'all')}
                className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Barcha statuslar</option>
                <option value="new">Kutilmoqda</option>
                <option value="approved">Tasdiqlangan</option>
                <option value="rejected">Rad etilgan</option>
              </select>
            </div>
          </DrawerHeader>

          {/* Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingReports ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Hisobotlar topilmadi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Xodim</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Bo'lim</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Smena</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Kechikish</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Sabab</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Yuborilgan</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className={`border-b border-border hover:bg-muted/50 transition-colors ${report.status === 'new' ? 'bg-orange-950/20' : ''
                          }`}
                      >
                        <td className="p-3">
                          <div>
                            <div className="text-sm font-medium text-foreground">{report.employee_name}</div>
                            <div className="text-xs text-muted-foreground">{report.employee_id}</div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-foreground">{report.department}</td>
                        <td className="p-3 text-sm text-foreground">{report.shift_start_time}</td>
                        <td className="p-3 text-sm text-foreground">
                          {report.late_minutes} daq
                          <br />
                          <span className="text-xs text-muted-foreground">
                            ({(report.late_minutes / 60).toFixed(1)} soat)
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-foreground">{getReasonLabel(report.reason)}</div>
                          {report.notes && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate" title={report.notes}>
                              {report.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString('uz-UZ', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          <br />
                          {new Date(report.created_at).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${report.status === 'new'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                : report.status === 'approved'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}
                          >
                            {report.status === 'new'
                              ? 'Kutilmoqda'
                              : report.status === 'approved'
                                ? 'Tasdiqlangan'
                                : 'Rad etilgan'}
                          </span>
                        </td>
                        <td className="p-3">
                          {report.status === 'new' ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveReport(report.id)}
                                className="h-7 px-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Tasdiqlash
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectReport(report.id)}
                                className="h-7 px-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                Rad etish
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
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
  status: EmployeeStatus | 'late-reports';
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
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all text-left w-full p-4 ${isSelected
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
