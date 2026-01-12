import { useLanguage } from '../../context/LanguageContext';
import { mockSalaryHistory } from '../../data/essData';
import { DollarSign, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function ESSSalary() {
  const { t } = useLanguage();
  const currentMonth = mockSalaryHistory[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return t('ess.salary.statusPaid');
      case 'pending':
        return t('ess.salary.statusPending');
      case 'processing':
        return t('ess.salary.statusProcessing');
      default:
        return status;
    }
  };

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
      {/* Current Month Salary Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">{t('ess.salary.currentMonth')}</p>
            <p className="text-2xl font-semibold">{formatMonth(currentMonth.month)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-200" />
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-blue-100">{t('ess.salary.baseSalary')}</span>
            <span className="text-lg font-semibold">{formatCurrency(currentMonth.baseSalary)}</span>
          </div>
          {currentMonth.bonuses > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-100">{t('ess.salary.bonuses')}</span>
              <span className="text-lg font-semibold text-green-200">
                +{formatCurrency(currentMonth.bonuses)}
              </span>
            </div>
          )}
          {currentMonth.deductions > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-100">{t('ess.salary.deductions')}</span>
              <span className="text-lg font-semibold text-red-200">
                -{formatCurrency(currentMonth.deductions)}
              </span>
            </div>
          )}
          <div className="border-t border-blue-400 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-100 font-semibold">{t('ess.salary.netSalary')}</span>
              <span className="text-2xl font-bold">{formatCurrency(currentMonth.netSalary)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(currentMonth.status)}
            <span className="text-sm text-blue-100">{getStatusLabel(currentMonth.status)}</span>
          </div>
          <button
            onClick={() => {
              // TODO: Implement PDF download when backend API is ready
              alert(t('ess.salary.downloadPlaceholder'));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {t('ess.salary.downloadPDF')}
          </button>
        </div>
      </div>

      {/* Salary History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('ess.salary.history')}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.month')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.baseSalary')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.bonuses')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.deductions')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.netSalary')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('ess.salary.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockSalaryHistory.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/70">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatMonth(record.month)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatCurrency(record.baseSalary)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatCurrency(record.bonuses)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {formatCurrency(record.deductions)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(record.netSalary)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span className="text-gray-700 dark:text-gray-300">
                        {getStatusLabel(record.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        // TODO: Implement PDF download when backend API is ready
                        alert(t('ess.salary.downloadPlaceholder'));
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      {t('ess.salary.download')}
                    </button>
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
