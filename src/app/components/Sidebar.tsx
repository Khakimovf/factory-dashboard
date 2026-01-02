import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Factory, Users, Wrench } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const navItems = [
  { path: '/', label: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/warehouse', label: 'sidebar.warehouse', icon: Package },
  { path: '/production-lines', label: 'sidebar.productionLines', icon: Factory },
  { path: '/hr', label: 'sidebar.hr', icon: Users },
  { path: '/maintenance', label: 'sidebar.maintenance', icon: Wrench },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('sidebar.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('sidebar.subtitle')}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{t(label)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}