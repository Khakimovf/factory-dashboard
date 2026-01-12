import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { HRSubNav } from './HRSubNav';
import { mockCurrentEmployee, calculateWorkExperience, mockSalaryHistory, mockAttendanceRecords, mockLeaveBalance, mockDocuments, mockLeaveRequests, mockTimeOffRequests } from '../../data/essData';
import { User, DollarSign, Clock, Calendar, FileText, Send, Mail, Phone, Briefcase, Building, Download, Eye, CheckCircle, XCircle, Clock as ClockIcon, AlertCircle, Plus } from 'lucide-react';

type CabinetTab = 'profile' | 'salary' | 'attendance' | 'leave' | 'documents' | 'requests';

export function HRMyCabinet() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<CabinetTab>('profile');

  const tabs: { id: CabinetTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: t('hr.myCabinet.tabs.profile'), icon: User },
    { id: 'salary', label: t('hr.myCabinet.tabs.salary'), icon: DollarSign },
    { id: 'attendance', label: t('hr.myCabinet.tabs.attendance'), icon: Clock },
    { id: 'leave', label: t('hr.myCabinet.tabs.leave'), icon: Calendar },
    { id: 'documents', label: t('hr.myCabinet.tabs.documents'), icon: FileText },
    { id: 'requests', label: t('hr.myCabinet.tabs.requests'), icon: Send },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'salary':
        return <SalarySection />;
      case 'attendance':
        return <AttendanceSection />;
      case 'leave':
        return <LeaveSection />;
      case 'documents':
        return <DocumentsSection />;
      case 'requests':
        return <RequestsSection />;
      default:
        return <ProfileSection />;
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

      {/* Tab Navigation */}
      <div className="mb-6 mt-8">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
}

// Profile Section
function ProfileSection() {
  const { t } = useLanguage();
  const workExp = calculateWorkExperience(mockCurrentEmployee.employmentDate);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {mockCurrentEmployee.fullName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {mockCurrentEmployee.employeeId}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem icon={Building} label={t('hr.myCabinet.profile.department')} value={mockCurrentEmployee.department} />
              <DetailItem icon={Briefcase} label={t('hr.myCabinet.profile.position')} value={mockCurrentEmployee.position} />
              <DetailItem icon={Mail} label={t('hr.myCabinet.profile.email')} value={mockCurrentEmployee.email} />
              <DetailItem icon={Phone} label={t('hr.myCabinet.profile.phone')} value={mockCurrentEmployee.phone} />
              <DetailItem
                icon={Calendar}
                label={t('hr.myCabinet.profile.hireDate')}
                value={new Date(mockCurrentEmployee.employmentDate).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <DetailItem
                icon={Briefcase}
                label={t('hr.myCabinet.profile.workExperience')}
                value={`${workExp.years} ${t('hr.myCabinet.profile.years')} ${workExp.months} ${t('hr.myCabinet.profile.months')}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// Salary Section
function SalarySection() {
  const { t } = useLanguage();
  const currentMonth = mockSalaryHistory[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">{t('hr.myCabinet.salary.currentMonth')}</p>
            <p className="text-2xl font-semibold">{formatMonth(currentMonth.month)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-200" />
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-blue-100">{t('hr.myCabinet.salary.baseSalary')}</span>
            <span className="text-lg font-semibold">{formatCurrency(currentMonth.baseSalary)}</span>
          </div>
          {currentMonth.bonuses > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-100">{t('hr.myCabinet.salary.bonuses')}</span>
              <span className="text-lg font-semibold text-green-200">+{formatCurrency(currentMonth.bonuses)}</span>
            </div>
          )}
          {currentMonth.deductions > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-100">{t('hr.myCabinet.salary.deductions')}</span>
              <span className="text-lg font-semibold text-red-200">-{formatCurrency(currentMonth.deductions)}</span>
            </div>
          )}
          <div className="border-t border-blue-400 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-100 font-semibold">{t('hr.myCabinet.salary.netSalary')}</span>
              <span className="text-2xl font-bold">{formatCurrency(currentMonth.netSalary)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => alert(t('hr.myCabinet.salary.downloadPlaceholder'))}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          {t('hr.myCabinet.salary.downloadPDF')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('hr.myCabinet.salary.history')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.salary.month')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.salary.baseSalary')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.salary.bonuses')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.salary.deductions')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.salary.netSalary')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockSalaryHistory.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{formatMonth(record.month)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(record.baseSalary)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(record.bonuses)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(record.deductions)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(record.netSalary)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Attendance Section
function AttendanceSection() {
  const { t } = useLanguage();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthRecords = mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const totalDays = monthRecords.length;
  const lateDays = monthRecords.filter((r) => r.isLate).length;
  const onTimeDays = totalDays - lateDays;
  const totalHours = monthRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title={t('hr.myCabinet.attendance.totalDays')} value={totalDays} icon={CheckCircle} color="blue" />
        <SummaryCard title={t('hr.myCabinet.attendance.onTime')} value={onTimeDays} icon={CheckCircle} color="green" />
        <SummaryCard title={t('hr.myCabinet.attendance.late')} value={lateDays} icon={AlertCircle} color="orange" />
        <SummaryCard title={t('hr.myCabinet.attendance.totalHours')} value={totalHours.toFixed(1)} icon={Clock} color="purple" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('hr.myCabinet.attendance.dailyRecords')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.attendance.date')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.attendance.checkIn')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.attendance.checkOut')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.attendance.workHours')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('hr.myCabinet.attendance.status')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockAttendanceRecords.slice(0, 30).map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{record.checkIn || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{record.checkOut || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {record.isLate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                        <AlertCircle className="w-3 h-3" />
                        {t('hr.myCabinet.attendance.late')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        {t('hr.myCabinet.attendance.onTime')}
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

// Leave Section
function LeaveSection() {
  const { t } = useLanguage();
  const workExp = calculateWorkExperience(mockCurrentEmployee.employmentDate);
  const usedPercentage = (mockLeaveBalance.usedDays / mockLeaveBalance.totalDays) * 100;
  const remainingPercentage = (mockLeaveBalance.remainingDays / mockLeaveBalance.totalDays) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          {t('hr.myCabinet.leave.workExperience')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('hr.myCabinet.leave.totalExperience')}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {workExp.years} {t('hr.myCabinet.leave.years')} {workExp.months} {t('hr.myCabinet.leave.months')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('hr.myCabinet.leave.hireDate')}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LeaveBalanceCard title={t('hr.myCabinet.leave.totalDays')} value={mockLeaveBalance.totalDays} icon={Calendar} color="blue" />
        <LeaveBalanceCard title={t('hr.myCabinet.leave.usedDays')} value={mockLeaveBalance.usedDays} icon={CheckCircle} color="orange" />
        <LeaveBalanceCard title={t('hr.myCabinet.leave.remainingDays')} value={mockLeaveBalance.remainingDays} icon={Clock} color="green" />
        <LeaveBalanceCard title={t('hr.myCabinet.leave.pendingDays')} value={mockLeaveBalance.pendingDays} icon={ClockIcon} color="purple" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('hr.myCabinet.leave.leaveProgress')}</h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('hr.myCabinet.leave.used')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {mockLeaveBalance.usedDays} / {mockLeaveBalance.totalDays} {t('hr.myCabinet.leave.days')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-orange-500 h-3 rounded-full transition-all" style={{ width: `${usedPercentage}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('hr.myCabinet.leave.remaining')}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {mockLeaveBalance.remainingDays} / {mockLeaveBalance.totalDays} {t('hr.myCabinet.leave.days')}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${remainingPercentage}%` }} />
          </div>
        </div>
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

// Documents Section
function DocumentsSection() {
  const { t } = useLanguage();

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return t('hr.myCabinet.documents.typeContract');
      case 'order':
        return t('hr.myCabinet.documents.typeOrder');
      case 'certificate':
        return t('hr.myCabinet.documents.typeCertificate');
      default:
        return t('hr.myCabinet.documents.typeOther');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('hr.myCabinet.documents.title')}</h3>
      </div>
      {mockDocuments.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('hr.myCabinet.documents.noDocuments')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {mockDocuments.map((doc) => (
            <div key={doc.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{doc.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getDocumentTypeLabel(doc.type)}</span>
                      {doc.size && <span>• {doc.size}</span>}
                      <span>
                        • {new Date(doc.uploadDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => alert(t('hr.myCabinet.documents.viewPlaceholder'))}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('hr.myCabinet.documents.view')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => alert(t('hr.myCabinet.documents.downloadPlaceholder'))}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={t('hr.myCabinet.documents.download')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Requests Section
function RequestsSection() {
  const { t } = useLanguage();
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            {t('hr.myCabinet.requests.statusApproved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            {t('hr.myCabinet.requests.statusRejected')}
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <ClockIcon className="w-3 h-3" />
            {t('hr.myCabinet.requests.statusPending')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('hr.myCabinet.requests.title')}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLeaveForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('hr.myCabinet.requests.newLeaveRequest')}
          </button>
          <button
            onClick={() => setShowTimeOffForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('hr.myCabinet.requests.newTimeOffRequest')}
          </button>
        </div>
      </div>

      {showLeaveForm && (
        <LeaveRequestForm
          onClose={() => setShowLeaveForm(false)}
          onSubmit={(data) => {
            console.log('Leave request:', data);
            setShowLeaveForm(false);
            alert(t('hr.myCabinet.requests.submitPlaceholder'));
          }}
        />
      )}

      {showTimeOffForm && (
        <TimeOffRequestForm
          onClose={() => setShowTimeOffForm(false)}
          onSubmit={(data) => {
            console.log('Time-off request:', data);
            setShowTimeOffForm(false);
            alert(t('hr.myCabinet.requests.submitPlaceholder'));
          }}
        />
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('hr.myCabinet.requests.leaveRequests')}</h4>
          {mockLeaveRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t('hr.myCabinet.requests.noLeaveRequests')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockLeaveRequests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{req.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(req.startDate).toLocaleDateString('uz-UZ')} - {new Date(req.endDate).toLocaleDateString('uz-UZ')} ({req.days} {t('hr.myCabinet.leave.days')})
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{req.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('hr.myCabinet.requests.timeOffRequests')}</h4>
          {mockTimeOffRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t('hr.myCabinet.requests.noTimeOffRequests')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mockTimeOffRequests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{req.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(req.date).toLocaleDateString('uz-UZ')}
                        {req.hours && ` • ${req.hours} ${t('hr.myCabinet.attendance.hours')}`}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{req.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface LeaveRequestFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function LeaveRequestForm({ onClose, onSubmit }: LeaveRequestFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('hr.myCabinet.requests.newLeaveRequest')}</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.leaveType')}</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="annual">{t('hr.myCabinet.requests.leaveTypeAnnual')}</option>
            <option value="sick">{t('hr.myCabinet.requests.leaveTypeSick')}</option>
            <option value="personal">{t('hr.myCabinet.requests.leaveTypePersonal')}</option>
            <option value="unpaid">{t('hr.myCabinet.requests.leaveTypeUnpaid')}</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.startDate')}</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.endDate')}</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.reason')}</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            rows={3}
            required
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            {t('hr.myCabinet.requests.submit')}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium">
            {t('hr.myCabinet.requests.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}

interface TimeOffRequestFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function TimeOffRequestForm({ onClose, onSubmit }: TimeOffRequestFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    type: 'half_day',
    date: '',
    hours: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('hr.myCabinet.requests.newTimeOffRequest')}</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.timeOffType')}</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value="half_day">{t('hr.myCabinet.requests.timeOffTypeHalfDay')}</option>
            <option value="few_hours">{t('hr.myCabinet.requests.timeOffTypeFewHours')}</option>
            <option value="emergency">{t('hr.myCabinet.requests.timeOffTypeEmergency')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.date')}</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            required
          />
        </div>
        {formData.type === 'few_hours' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.attendance.hours')}</label>
            <input
              type="number"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              min="1"
              max="8"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('hr.myCabinet.requests.reason')}</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            rows={3}
            required
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            {t('hr.myCabinet.requests.submit')}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium">
            {t('hr.myCabinet.requests.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
