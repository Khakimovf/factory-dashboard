import { useLanguage } from '../../context/LanguageContext';
import {
  mockCurrentEmployee,
  calculateWorkExperience,
  mockSalaryHistory,
  mockAttendanceRecords,
  mockLeaveBalance,
  mockDocuments,
} from '../../data/essData';
import {
  User,
  DollarSign,
  Clock,
  Calendar,
  FileText,
  Briefcase,
  Building,
  Download,
  Eye,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

// TODO: Replace mock data with API calls when backend is ready
const mockEmployee = {
  fullName: 'Aliyev Sardor',
  position: 'Liniya operatori',
  department: 'Ishlab chiqarish',
  hireDate: '2022-01-15T08:00:00.000Z',
  // TODO: Replace mock birthdate with real employee birthdate from backend
  birthdate: '1995-08-25',
};

export function EmployeeCabinetPage() {
  const { t, language } = useLanguage();
  const workExp = calculateWorkExperience(mockEmployee.hireDate);
  const currentMonth = mockSalaryHistory[0];
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = mockAttendanceRecords.find((r) => r.date === today);
  const currentMonthRecords = mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });
  const lateDays = currentMonthRecords.filter((r) => r.isLate).length;
  const totalHours = currentMonthRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
  const usedPercentage = (mockLeaveBalance.usedDays / mockLeaveBalance.totalDays) * 100;
  const remainingPercentage = (mockLeaveBalance.remainingDays / mockLeaveBalance.totalDays) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    if (language === 'ru') {
      const monthName = date.toLocaleDateString('ru-RU', { month: 'long' });
      const yearStr = date.toLocaleDateString('ru-RU', { year: 'numeric' });
      return `${monthName} ${yearStr} г.`;
    }
    return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return t('employeeCabinet.documents.typeContract');
      case 'order':
        return t('employeeCabinet.documents.typeOrder');
      case 'certificate':
        return t('employeeCabinet.documents.typeCertificate');
      default:
        return t('employeeCabinet.documents.typeOther');
    }
  };

  const calculateDaysUntilBirthday = (birthdate: string): number | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = birthdate.split('-').map(Number);
    const thisYearBirthday = new Date(today.getFullYear(), month - 1, day);
    thisYearBirthday.setHours(0, 0, 0, 0);
    
    let nextBirthday = thisYearBirthday;
    
    if (thisYearBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
      nextBirthday.setHours(0, 0, 0, 0);
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilBirthday = calculateDaysUntilBirthday(mockEmployee.birthdate);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('employeeCabinet.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1 - MENING PROFILIM */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t('employeeCabinet.profile.title')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  {mockEmployee.fullName}
                </h4>
                <div className="space-y-2 mt-3">
                  <DetailRow icon={Briefcase} label={t('employeeCabinet.profile.position')} value={mockEmployee.position} />
                  <DetailRow icon={Building} label={t('employeeCabinet.profile.department')} value={mockEmployee.department} />
                  <DetailRow
                    icon={Calendar}
                    label={t('employeeCabinet.profile.hireDate')}
                    value={formatDate(mockEmployee.hireDate)}
                  />
                  <DetailRow
                    icon={TrendingUp}
                    label={t('employeeCabinet.profile.workExperience')}
                    value={`${workExp.years} ${t('employeeCabinet.profile.years')} ${workExp.months} ${t('employeeCabinet.profile.months')}`}
                  />
                  {daysUntilBirthday !== null && (
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {daysUntilBirthday === 0
                            ? t('employeeCabinet.profile.birthdayToday')
                            : t('employeeCabinet.profile.birthdayUpcoming').replace('{days}', daysUntilBirthday.toString())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 - MENING OYLIKIM */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            {t('employeeCabinet.salary.title')}
          </h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-4 text-white">
              <p className="text-green-100 text-sm mb-1">{t('employeeCabinet.salary.lastSalary')}</p>
              <p className="text-2xl font-bold">{formatCurrency(currentMonth.netSalary)}</p>
              <p className="text-green-100 text-xs mt-1">{formatMonth(currentMonth.month)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('employeeCabinet.salary.baseSalary')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(currentMonth.baseSalary)}</span>
              </div>
              {currentMonth.bonuses > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('employeeCabinet.salary.bonuses')}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(currentMonth.bonuses)}</span>
                </div>
              )}
              {currentMonth.deductions > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{t('employeeCabinet.salary.deductions')}</span>
                  <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(currentMonth.deductions)}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                // TODO: Implement PDF download when backend API is ready
                alert(t('employeeCabinet.salary.downloadPlaceholder'));
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              {t('employeeCabinet.salary.downloadPDF')}
            </button>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('employeeCabinet.salary.history')}</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {mockSalaryHistory.slice(0, 3).map((record, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{formatMonth(record.month)}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(record.netSalary)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 - DAVOMATIM */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {t('employeeCabinet.attendance.title')}
          </h3>
          <div className="space-y-4">
            {todayRecord ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('employeeCabinet.attendance.checkInToday')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{todayRecord.checkIn || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('employeeCabinet.attendance.checkOutToday')}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{todayRecord.checkOut || '-'}</p>
                  </div>
                </div>
                {todayRecord.isLate && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs text-orange-700 dark:text-orange-400">{t('employeeCabinet.attendance.lateToday')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('employeeCabinet.attendance.noRecordToday')}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('employeeCabinet.attendance.lateDays')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{lateDays}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('employeeCabinet.attendance.totalHours')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalHours.toFixed(1)} {t('employeeCabinet.attendance.hours')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 - MEHNAT STAJI & TA'TIL */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            {t('employeeCabinet.leave.title')}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('employeeCabinet.leave.annualLeaveLimit')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{mockLeaveBalance.totalDays} {t('employeeCabinet.leave.days')}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('employeeCabinet.leave.usedLeave')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {mockLeaveBalance.usedDays} / {mockLeaveBalance.totalDays} {t('employeeCabinet.leave.days')}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${usedPercentage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('employeeCabinet.leave.remainingLeave')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {mockLeaveBalance.remainingDays} / {mockLeaveBalance.totalDays} {t('employeeCabinet.leave.days')}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${remainingPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 - HUJJATLARIM */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          {t('employeeCabinet.documents.title')}
        </h3>
        {mockDocuments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('employeeCabinet.documents.noDocuments')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        // TODO: Implement view document when backend API is ready
                        alert(t('employeeCabinet.documents.viewPlaceholder'));
                      }}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title={t('employeeCabinet.documents.view')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement download document when backend API is ready
                        alert(t('employeeCabinet.documents.downloadPlaceholder'));
                      }}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title={t('employeeCabinet.documents.download')}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{getDocumentTypeLabel(doc.type)}</h4>
                {doc.size && <p className="text-xs text-gray-400 dark:text-gray-500">{doc.size}</p>}
              </div>
            ))}
            {/* Ish grafigi card */}
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex-shrink-0">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // TODO: Implement view work schedule when backend API is ready
                      alert(t('employeeCabinet.documents.viewSchedulePlaceholder'));
                    }}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={t('employeeCabinet.documents.view')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement download work schedule when backend API is ready
                      alert(t('employeeCabinet.documents.downloadSchedulePlaceholder'));
                    }}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title={t('employeeCabinet.documents.download')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('employeeCabinet.documents.workSchedule')}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('employeeCabinet.documents.workScheduleSubtitle')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}: </span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
      </div>
    </div>
  );
}
