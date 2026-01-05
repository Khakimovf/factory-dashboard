import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export function HRSubNav() {
  const { t } = useLanguage();

  const tabs = [
    { to: '/hr/employees', label: t('hr.tabEmployees') },
    { to: '/hr', label: t('hr.tabDocuments') },
    { to: '/hr/stats', label: t('hr.tabStats') },
  ];

  return (
    <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
      <nav className="flex flex-wrap gap-4 -mb-px text-sm font-medium">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/hr'}
            className={({ isActive }) =>
              [
                'px-3 pb-2 border-b-2 transition-colors',
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500',
              ].join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}


