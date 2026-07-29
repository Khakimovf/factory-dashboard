import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Factory, Users, Wrench, BarChart2,
  ShieldCheck, Settings, LogOut, IdCard, DollarSign, ShoppingCart,
  Truck, Box, ClipboardCheck, Send, Utensils, ChevronRight, Shield, UserCircle,
  Grid, Calendar, QrCode, Ship, LayoutGrid, ScrollText, Cpu, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../utils/roleUtils';

interface NavItem {
  path?: string;
  label: string;
  icon: any;
  roles?: UserRole[];
  children?: { path: string; label: string; roles?: UserRole[]; icon?: any }[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'sidebar.dashboard', icon: LayoutDashboard },
  {
    label: 'sidebar.logisticsAndWarehouse',
    icon: Box,
    roles: ['ADMIN', 'system_owner' as any, 'WAREHOUSE_MANAGER', 'WAREHOUSE_STAFF', 'WAREHOUSE_ADMIN' as any, 'maintenance', 'FACTORY_MANAGER' as any],
    children: [
      { path: '/warehouse', label: 'sidebar.warehouse' },
      { path: '/finished-goods', label: 'sidebar.finishedGoods', roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
      { path: '/suppliers', label: 'sidebar.suppliers', roles: ['ADMIN', 'WAREHOUSE_MANAGER'] },
      { path: '/container-logistics', label: 'sidebar.containerLogistics', roles: ['ADMIN', 'WAREHOUSE_MANAGER'], icon: Ship },
      { path: '/warehouse/inventory-reconciliation', label: 'sidebar.inventoryReconciliation', roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'FACTORY_MANAGER' as any], icon: ClipboardCheck },
    ]
  },
  { path: '/maintenance', label: 'sidebar.maintenance', icon: Wrench, roles: ['ADMIN', 'system_owner' as any, 'maintenance', 'WAREHOUSE_MANAGER', 'FACTORY_MANAGER' as any] },
  {
    label: 'sidebar.production',
    icon: Factory,
    roles: ['ADMIN', 'system_owner' as any, 'FACTORY_MANAGER' as any, 'QC_MANAGER' as any, 'line_master'],
    children: [
      { path: '/production-lines', label: 'sidebar.productionLines' },
      { path: '/production-lines/operator-plans', label: 'sidebar.operatorPlans' },
      { path: '/qc', label: 'sidebar.qc' },
      { path: '/mrp', label: 'sidebar.mrp' },
      { path: '/traceability', label: 'sidebar.traceability' },
      { path: '/brak-recycling', label: '♻️ Brak va Qayta Ishlash' },
    ]
  },
  {
    label: 'sidebar.hrAndService',
    icon: Users,
    roles: ['ADMIN', 'system_owner' as any, 'hr', 'FACTORY_MANAGER' as any, 'canteen'],
    children: [
      { path: '/hr', label: 'sidebar.hr', roles: ['ADMIN', 'system_owner' as any, 'hr'] },
      { path: '/worker-cabinet', label: 'sidebar.employeeCabinet' },
      { path: '/canteen', label: 'sidebar.canteen', roles: ['ADMIN', 'system_owner' as any, 'canteen'] },
      { path: '/shift-schedule', label: 'sidebar.shiftSchedule' },
    ]
  },
  { path: '/logistics-gate', label: 'sidebar.logisticsGate', icon: Shield, roles: ['ADMIN', 'VGM_GUARD' as any] },
  { path: '/reports', label: 'sidebar.reports', icon: BarChart2, roles: ['ADMIN', 'system_owner' as any, 'FACTORY_MANAGER' as any] },
  {
    label: 'Moliya (FI/CO)',
    icon: DollarSign,
    roles: ['ADMIN', 'system_owner' as any, 'IT_SPECIALIST' as any],
    children: [
      { path: '/finance', label: 'Moliyaviy Boshqaruv' },
      { path: '/finance/contracts', label: 'Shartnomalar (Contracts)' }
    ]
  },
  { path: '/procurement', label: 'Ta\'minot (MM)', icon: ShoppingCart, roles: ['ADMIN', 'system_owner' as any, 'IT_SPECIALIST' as any] },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const sidebarTimeoutRef = useRef<any>(null);
  const dropdownTimeoutRef = useRef<any>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const checkRoles = (roles?: UserRole[]) => {
    if (!roles) return true;
    if (!user) return false;
    if (['ADMIN', 'SUPER_ADMIN', 'system_owner', 'IT_SPECIALIST'].includes(user.role)) return true;
    return roles.includes(user.role);
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.children) {
      return checkRoles(item.roles) || item.children.some(child => checkRoles(child.roles));
    }
    return checkRoles(item.roles);
  });

  const handleSidebarMouseEnter = () => {
    if (sidebarTimeoutRef.current) clearTimeout(sidebarTimeoutRef.current);
    setIsExpanded(true);
  };

  const handleSidebarMouseLeave = () => {
    sidebarTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setActiveDropdown(null);
    }, 300);
  };

  const handleDropdownMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(label);
  };

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      // Keep open if mouse moves within the dropdown sub-items
    }, 100);
  };

  return (
    <motion.aside
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
      initial={false}
      animate={{ width: isExpanded ? 260 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
      className="bg-[#020617] border-r border-slate-800 flex flex-col h-screen sticky top-0 z-[100] group/sidebar shadow-2xl"
    >
      {/* Logo Section */}
      <div className="p-5 overflow-hidden flex flex-col items-center border-b border-white/5 bg-slate-950/50">
        <div className="flex items-center gap-3 w-full">
          <div className="min-w-[40px] w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-500" />
            <ShieldCheck className="text-white w-6 h-6 z-10 relative" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </div>
          <motion.div
            animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
            transition={{ delay: isExpanded ? 0.1 : 0 }}
            className="whitespace-nowrap"
          >
            <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">VGM HUB</h1>
            <p className="text-[8px] text-indigo-400/70 font-black uppercase tracking-[0.3em]">{t('sidebar.subtitle')}</p>
          </motion.div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto scrollbar-hide overflow-x-hidden pt-4">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4 whitespace-nowrap flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Core Systems
          </motion.div>
        )}

        {filteredNavItems.map((item) => {
          const { path, label, icon: Icon, children } = item;
          const isDropdown = !!children;
          const isOpen = activeDropdown === label;
          const isActive = path ? (location.pathname === path || (path !== '/' && location.pathname.startsWith(path))) : children?.some(c => location.pathname === c.path);

          if (isDropdown) {
            return (
              <div
                key={label}
                onMouseEnter={() => handleDropdownMouseEnter(label)}
                onMouseLeave={handleDropdownMouseLeave}
                className="relative"
              >
                <div
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer group/item mb-1 ${isOpen || isActive ? 'text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                    }`}
                >
                  <div className="min-w-[24px] z-10">
                    <Icon className={`w-5 h-5 ${isOpen || isActive ? 'text-indigo-400' : 'text-slate-500 group-hover/item:text-indigo-400'} transition-colors duration-300`} />
                  </div>
                  <motion.span
                    animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                    transition={{ delay: isExpanded ? 0.1 : 0 }}
                    className="font-bold text-[13px] uppercase italic tracking-tight whitespace-nowrap z-10"
                  >
                    {t(label)}
                  </motion.span>
                  {isExpanded && (
                    <motion.div
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      className="ml-auto text-slate-600 group-hover/item:text-indigo-400"
                    >
                      <ChevronRight size={14} />
                    </motion.div>
                  )}
                </div>

                <AnimatePresence>
                  {isOpen && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden bg-slate-900/30 rounded-xl mb-2"
                    >
                      <div className="py-1 flex flex-col">
                        {children.filter(c => checkRoles(c.roles)).map((child) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-3 pl-10 pr-3 py-2 text-[12px] font-bold uppercase italic transition-all hover:bg-white/5 border-l-2 border-transparent ${isChildActive ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                              {child.icon ? <child.icon size={14} className={isChildActive ? 'text-emerald-400' : 'text-slate-500'} /> : null}
                              <span>{t(child.label)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={path}
              to={path!}
              onMouseEnter={() => setActiveDropdown(null)}
              className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group/item mb-1 ${isActive ? 'text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
            >
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
            </Link>
          );
        })}
      </nav>

      {/* Control Center */}
      <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-md">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 px-3 whitespace-nowrap"
          >
            Terminal Control
          </motion.div>
        )}

        {user && ['ADMIN', 'SUPER_ADMIN', 'system_owner', 'IT_SPECIALIST'].includes(user.role) && (
          <div
            onMouseEnter={() => handleDropdownMouseEnter('admin')}
            onMouseLeave={handleDropdownMouseLeave}
            className="relative"
          >
            <div
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer group/admin mb-1 ${activeDropdown === 'admin' ? 'text-white' : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
            >
              <div className="min-w-[24px] z-10">
                <Settings className="w-5 h-5 group-hover/admin:text-emerald-400 transition-colors" />
              </div>
              <motion.span
                animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
                transition={{ delay: isExpanded ? 0.1 : 0 }}
                className="font-bold text-[13px] uppercase italic tracking-tight whitespace-nowrap z-10"
              >
                {t('sidebar.systemRoot')}
              </motion.span>
              {isExpanded && (
                <motion.div
                  animate={{ rotate: activeDropdown === 'admin' ? 90 : 0 }}
                  className="ml-auto text-slate-600"
                >
                  <ChevronRight size={14} />
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {activeDropdown === 'admin' && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-emerald-500/5 rounded-xl mb-2"
                >
                  <div className="py-1 flex flex-col">
                    {[{
                      to: '/admin',
                      label: 'Control Panel',
                      icon: LayoutGrid,
                    }, {
                      to: '/admin/audit-log',
                      label: 'Audit Jurnali',
                      icon: ScrollText,
                    }, {
                      to: '/system-settings',
                      label: 'Tizim Sozlamalari',
                      icon: Cpu,
                    }, {
                      to: '/admin/details',
                      label: 'Detail Boshqaruvi',
                      icon: GitBranch,
                    }].map(({ to, label, icon: ChildIcon }) => {
                      const isChildActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
                      return (
                        <Link
                          key={to}
                          to={to}
                          className={`flex items-center gap-3 pl-8 pr-3 py-2.5 text-[11px] font-bold uppercase italic transition-all hover:bg-white/5 border-l-2 ${
                            isChildActive
                              ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5'
                              : 'text-slate-500 hover:text-slate-300 border-transparent'
                          }`}
                        >
                          <ChildIcon size={13} className={isChildActive ? 'text-emerald-400' : 'text-slate-600'} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-4 p-3 bg-gradient-to-br from-slate-900 to-indigo-950/30 rounded-2xl border border-white/5 flex items-center gap-3 shadow-inner"
            >
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30 shrink-0 shadow-lg">
                <UserCircle className="text-indigo-400 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate uppercase italic tracking-tight">{user.fullName}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[8px] text-slate-500 font-bold truncate tracking-widest uppercase">{user.role}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
