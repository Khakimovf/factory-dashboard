import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { User, DollarSign, Clock, Calendar, FileText, Send, Bell } from 'lucide-react';
import { ESSProfile } from './ESSProfile';
import { ESSSalary } from './ESSSalary';
import { ESSAttendance } from './ESSAttendance';
import { ESSLeave } from './ESSLeave';
import { ESSDocuments } from './ESSDocuments';
import { ESSRequests } from './ESSRequests';
import { ESSNotifications } from './ESSNotifications';

type ESSTab = 'profile' | 'salary' | 'attendance' | 'leave' | 'documents' | 'requests' | 'notifications';

export function EmployeeSelfService() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ESSTab>('profile');

  const tabs: { id: ESSTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profile', label: t('ess.tabs.profile'), icon: User },
    { id: 'salary', label: t('ess.tabs.salary'), icon: DollarSign },
    { id: 'attendance', label: t('ess.tabs.attendance'), icon: Clock },
    { id: 'leave', label: t('ess.tabs.leave'), icon: Calendar },
    { id: 'documents', label: t('ess.tabs.documents'), icon: FileText },
    { id: 'requests', label: t('ess.tabs.requests'), icon: Send },
    { id: 'notifications', label: t('ess.tabs.notifications'), icon: Bell },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ESSProfile />;
      case 'salary':
        return <ESSSalary />;
      case 'attendance':
        return <ESSAttendance />;
      case 'leave':
        return <ESSLeave />;
      case 'documents':
        return <ESSDocuments />;
      case 'requests':
        return <ESSRequests />;
      case 'notifications':
        return <ESSNotifications />;
      default:
        return <ESSProfile />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('ess.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {t('ess.subtitle')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
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
