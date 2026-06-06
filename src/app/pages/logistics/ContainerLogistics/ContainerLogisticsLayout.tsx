import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const ContainerLogisticsLayout: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/container-logistics', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/container-logistics/import', label: 'Import', icon: ArrowDownLeft },
    { path: '/container-logistics/export', label: 'Eksport', icon: ArrowUpRight },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-8 space-y-8 overflow-y-auto custom-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
            KONTEYNER LOGISTIKASI
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] uppercase tracking-[0.2em] italic">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Import · Eksport · Bojxona Nazorati
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <nav className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = link.end 
              ? location.pathname === link.path 
              : location.pathname.startsWith(link.path) && link.path !== '/container-logistics';
            
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 relative group ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <link.icon size={18} className={`relative z-10 ${isActive ? 'text-white' : 'group-hover:text-white transition-colors'}`} />
                <span className="relative z-10 font-black uppercase italic text-[11px] tracking-widest">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="flex-1 min-h-0">
        <Outlet />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
      `}</style>
    </div>
  );
};
