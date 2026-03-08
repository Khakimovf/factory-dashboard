import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Factory, Users, Wrench, FileText,
  Send, UserCircle, Shield, Truck, ClipboardCheck, Box,
  Utensils, BarChart2, ShieldCheck, Settings, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../utils/roleUtils';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'sidebar.dashboard', icon: LayoutDashboard },
  { path: '/warehouse', label: 'sidebar.warehouse', icon: Package, roles: ['ADMIN', 'system_owner' as any, 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'WAREHOUSE_ADMIN' as any] },
  { path: '/production-lines', label: 'sidebar.productionLines', icon: Factory, roles: ['ADMIN', 'system_owner' as any, 'FACTORY_MANAGER' as any, 'QC_MANAGER' as any, 'line_master'] },
  { path: '/production-lines/operator-plans', label: 'sidebar.operatorPlans', icon: Send, roles: ['ADMIN', 'system_owner' as any, 'FACTORY_MANAGER' as any, 'line_master'] },
  { path: '/qc', label: 'sidebar.qc', icon: ClipboardCheck, roles: ['ADMIN', 'system_owner' as any, 'QC_MANAGER' as any] },
  { path: '/finished-goods', label: 'sidebar.finishedGoods', icon: Box, roles: ['ADMIN', 'system_owner' as any, 'WAREHOUSE_ADMIN' as any, 'WAREHOUSE_MANAGER'] },
  { path: '/logistics-gate', label: 'sidebar.logisticsGate', icon: ShieldCheck, roles: ['ADMIN', 'VGM_GUARD' as any] },
  { path: '/maintenance', label: 'sidebar.maintenance', icon: Wrench, roles: ['ADMIN', 'system_owner' as any, 'maintenance', 'FACTORY_MANAGER' as any] },
  { path: '/hr', label: 'sidebar.hr', icon: Users, roles: ['ADMIN', 'system_owner' as any, 'hr', 'FACTORY_MANAGER' as any] },
  { path: '/canteen', label: 'sidebar.canteen', icon: Utensils, roles: ['ADMIN', 'system_owner' as any, 'canteen', 'FACTORY_MANAGER' as any] },
  { path: '/reports', label: 'sidebar.reports', icon: BarChart2, roles: ['ADMIN', 'system_owner' as any, 'FACTORY_MANAGER' as any, 'QC_MANAGER' as any] },
  { path: '/suppliers', label: 'sidebar.suppliers', icon: Truck, roles: ['ADMIN', 'system_owner' as any, 'WAREHOUSE_ADMIN' as any, 'WAREHOUSE_MANAGER'] }
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (!user) return false;
    // Unrestricted roles
    if (['ADMIN', 'system_owner', 'IT_SPECIALIST'].includes(user.role)) return true;
    return item.roles.includes(user.role);
  });

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 100);
  };

  return (
    <motion.aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={false}
      animate={{ width: isExpanded ? 260 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
      className="bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-[100] group/sidebar"
    >
      {/* Logo Section */}
      <div className="p-5 overflow-hidden flex flex-col items-center">
        <div className="flex items-center gap-3 w-full">
          <div className="min-w-[40px] w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <motion.div
            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
            transition={{ delay: isExpanded ? 0.1 : 0 }}
            className="whitespace-nowrap"
          >
            <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">VGM HUB</h1>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{t('sidebar.subtitle')}</p>
          </motion.div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto scrollbar-hide overflow-x-hidden pt-4">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4 whitespace-nowrap"
          >
            Main Menu
          </motion.div>
        )}

        {filteredNavItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

          return (
            <Link
              key={path}
              to={path}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group/item mb-1 ${isActive
                ? 'text-white'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <>
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 bg-indigo-500/10 rounded-xl border border-indigo-500/20"
                  />
                  <motion.div
                    layoutId="activeBorder"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  />
                </>
              )}

              <div className="min-w-[24px] z-10">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover/item:text-indigo-400'} transition-colors duration-300`} />
              </div>

              <motion.span
                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                transition={{ delay: isExpanded ? 0.1 : 0 }}
                className="font-bold text-[13px] uppercase italic tracking-tight whitespace-nowrap z-10"
              >
                {t(label)}
              </motion.span>

              {isActive && isExpanded && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full z-10 mr-2"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Administration & Footer - Fixed Bottom */}
      <div className="p-3 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 px-3 whitespace-nowrap"
          >
            Control Center
          </motion.div>
        )}

        {user && ['ADMIN', 'system_owner', 'IT_SPECIALIST'].includes(user.role) && (
          <>
            <Link
              to="/admin"
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group/admin mb-1 ${location.pathname === '/admin' || location.pathname === '/admin/system'
                ? 'text-white'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
            >
              {(location.pathname === '/admin' || location.pathname === '/admin/system') && (
                <>
                  <motion.div
                    layoutId="adminGlow"
                    className="absolute inset-0 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                  />
                  <motion.div
                    layoutId="adminBorder"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                </>
              )}
              <div className="min-w-[24px] z-10">
                <Settings className={`w-5 h-5 ${location.pathname === '/admin' || location.pathname === '/admin/system' ? 'text-emerald-400' : 'text-slate-500 group-hover/admin:text-emerald-400'} transition-colors duration-300`} />
              </div>
              <motion.span
                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                transition={{ delay: isExpanded ? 0.1 : 0 }}
                className="font-bold text-[13px] uppercase italic tracking-tight whitespace-nowrap z-10"
              >
                System Admin
              </motion.span>
            </Link>

            <Link
              to="/admin/audit-log"
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group/audit mb-1 ${location.pathname.startsWith('/admin/audit-log')
                ? 'text-white'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
            >
              {location.pathname.startsWith('/admin/audit-log') && (
                <>
                  <motion.div
                    layoutId="auditGlow"
                    className="absolute inset-0 bg-violet-500/10 rounded-xl border border-violet-500/20"
                  />
                  <motion.div
                    layoutId="auditBorder"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  />
                </>
              )}
              <div className="min-w-[24px] z-10">
                <Shield className={`w-5 h-5 ${location.pathname.startsWith('/admin/audit-log') ? 'text-violet-400' : 'text-slate-500 group-hover/audit:text-violet-400'} transition-colors duration-300`} />
              </div>
              <motion.span
                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                transition={{ delay: isExpanded ? 0.1 : 0 }}
                className="font-bold text-[13px] uppercase italic tracking-tight whitespace-nowrap z-10"
              >
                Audit Jurnali
              </motion.span>
            </Link>
          </>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group/logout text-slate-500 hover:bg-rose-500/10 hover:text-rose-500"
        >
          <div className="min-w-[24px]">
            <LogOut className="w-5 h-5 text-slate-600 group-hover/logout:text-rose-500 transition-colors" />
          </div>
          <motion.span
            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
            transition={{ delay: isExpanded ? 0.1 : 0 }}
            className="font-bold text-[13px] uppercase italic tracking-tight whitespace-nowrap"
          >
            {t('header.logout')}
          </motion.span>
        </button>

        {/* User Card */}
        <AnimatePresence>
          {isExpanded && user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 p-3 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 shrink-0">
                <UserCircle className="text-slate-400 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate uppercase italic">{user.fullName}</p>
                <p className="text-[8px] text-slate-500 font-bold truncate tracking-widest uppercase">{user.role}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}