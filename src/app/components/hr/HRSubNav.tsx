import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, Users, BarChart3, Library } from 'lucide-react';

export function HRSubNav() {
  const { t } = useLanguage();

  const tabs = [
    // Documents: primary workflow hub for HR
    { to: '/hr', label: t('hr.tabDocuments'), icon: <FileText className="w-4 h-4" /> },
    // Employees: people-centric view
    { to: '/hr/employees', label: t('hr.tabEmployees'), icon: <Users className="w-4 h-4" /> },
    // Statistics: analytical overview
    { to: '/hr/stats', label: t('hr.tabStats'), icon: <BarChart3 className="w-4 h-4" /> },
    // Document library: reference materials
    { to: '/hr/library', label: t('hr.documentLibrary'), icon: <Library className="w-4 h-4" /> },
  ];

  return (
    <div className="mt-8">
      <nav className="flex flex-wrap gap-4 text-base font-medium">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/hr'}
            className={({ isActive }) =>
              [
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors transition-shadow',
                'border border-transparent',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
              ].join(' ')
            }
          >
            <span className="flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 p-1">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


