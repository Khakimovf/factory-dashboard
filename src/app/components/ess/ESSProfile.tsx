import { useLanguage } from '../../context/LanguageContext';
import { mockCurrentEmployee, calculateWorkExperience } from '../../data/essData';
import { User, Mail, Phone, Calendar, Briefcase, Building } from 'lucide-react';

export function ESSProfile() {
  const { t } = useLanguage();
  const workExp = calculateWorkExperience(mockCurrentEmployee.employmentDate);

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {mockCurrentEmployee.fullName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {mockCurrentEmployee.employeeId}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                icon={Building}
                label={t('ess.profile.department')}
                value={mockCurrentEmployee.department}
              />
              <DetailItem
                icon={Briefcase}
                label={t('ess.profile.position')}
                value={mockCurrentEmployee.position}
              />
              <DetailItem
                icon={Mail}
                label={t('ess.profile.email')}
                value={mockCurrentEmployee.email}
              />
              <DetailItem
                icon={Phone}
                label={t('ess.profile.phone')}
                value={mockCurrentEmployee.phone}
              />
              <DetailItem
                icon={Calendar}
                label={t('ess.profile.hireDate')}
                value={new Date(mockCurrentEmployee.employmentDate).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
              <DetailItem
                icon={Briefcase}
                label={t('ess.profile.workExperience')}
                value={`${workExp.years} ${t('ess.profile.years')} ${workExp.months} ${t('ess.profile.months')}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('ess.profile.additionalInfo')}
        </h4>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {/* TODO: Add additional employee information from API */}
            {t('ess.profile.noAdditionalInfo')}
          </p>
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
