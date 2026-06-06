import { Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isControlsHovered, setIsControlsHovered] = useState(false);
  const navigate = useNavigate();

  const isITSpecialist = ['IT_SPECIALIST', 'SUPER_ADMIN', 'system_owner'].includes(user?.role || '');

  return (
    <header className="h-16 border-b border-white/5 bg-slate-950/20 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-[60] shadow-2xl ring-1 ring-white/5">
      <div className="flex-1" />

      <div className="flex items-center gap-6">
        {/* Language & Theme Controls Group */}
        <motion.div
          onMouseEnter={() => setIsControlsHovered(true)}
          onMouseLeave={() => setIsControlsHovered(false)}
          animate={{ opacity: isControlsHovered ? 1 : 0.4 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-4 border-r border-white/10 pr-6"
        >
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/40 rounded-xl p-1 border border-white/5">
            {['uz', 'ru', 'kr'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase italic tracking-widest ${language === lang
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-slate-900/40 flex items-center justify-center border border-white/5 hover:bg-slate-800 transition-all group"
            title={t('header.theme')}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
            )}
          </button>
        </motion.div>

        {/* User Profile Hook */}
        <div
          className="relative"
          onMouseEnter={() => {
            setIsProfileHovered(true);
            setShowProfileMenu(true);
          }}
          onMouseLeave={() => {
            setIsProfileHovered(false);
            setShowProfileMenu(false);
          }}
        >
          <motion.div
            animate={{
              backgroundColor: isProfileHovered ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0)',
            }}
            className="flex items-center gap-3 px-2 py-1.5 rounded-2xl transition-all border border-transparent hover:border-white/5 backdrop-blur-md overflow-hidden min-w-[48px] cursor-pointer"
          >
            {/* Avatar with Status */}
            <div className="relative flex-shrink-0">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${isITSpecialist ? 'from-amber-400 to-orange-600' : 'from-indigo-500 to-violet-600'} flex items-center justify-center text-white border border-white/10 shadow-lg relative group`}>
                <span className="text-xs font-black italic tracking-tighter">
                  {user?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'FA'}
                </span>
                {isITSpecialist && (
                  <div className="absolute -top-1 -right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-1.5 py-0.5 bg-amber-500 text-[6px] font-black text-slate-950 rounded-md shadow-lg border border-white/20 animate-pulse">
                      DEV
                    </div>
                  </div>
                )}
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
            </div>

            {/* Profile Info - Fades & Slididng Expands */}
            <AnimatePresence>
              {isProfileHovered && (
                <motion.div
                  initial={{ width: 0, opacity: 0, x: 10 }}
                  animate={{ width: 'auto', opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, ease: "circOut" }}
                  className="flex items-center gap-3 whitespace-nowrap overflow-hidden"
                >
                  <div className="text-left">
                    <p className="text-xs font-black text-white uppercase italic tracking-tight">
                      {user?.fullName || t('common.userName')}
                    </p>
                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.15em] italic">
                      {isITSpecialist ? 'SYSTEM OWNER' : user?.role || t('sidebar.role')}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-72 bg-slate-900/95 backdrop-blur-2xl rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 py-2 z-20 ring-1 ring-white/10"
              >
                <div className="px-6 py-4 border-b border-white/5 mb-2 bg-gradient-to-br from-slate-900 to-indigo-900/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">
                    {isITSpecialist ? 'ROOT ACCESS ENABLED' : 'Authenticated Session'}
                  </p>
                  <p className="text-sm font-black text-white italic tracking-tight">
                    {isITSpecialist ? 'IT Specialist' : user?.role?.replace('_', ' ') || 'Active Administrator'}
                  </p>
                  {isITSpecialist && (
                    <div className="mt-2 text-[8px] font-bold text-amber-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      VIRTUAL TERMINAL READY
                    </div>
                  )}
                </div>

                <div className="px-2 space-y-1">
                  <ProfileMenuItem icon={User} label={t('header.profile')} color="text-indigo-400" />
                  <div className="h-[1px] bg-white/5 mx-4 my-2" />
                  <ProfileMenuItem
                    icon={LogOut}
                    label={t('header.logout')}
                    color="text-rose-500"
                    onClick={() => { logout(); navigate('/login'); }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function ProfileMenuItem({ icon: Icon, label, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-5 py-3.5 text-left text-[11px] font-black uppercase italic tracking-widest ${color || 'text-slate-300'} hover:bg-white/5 rounded-2xl flex items-center gap-4 transition-all group`}
    >
      <div className={`p-2 rounded-lg bg-slate-950 border border-white/5 group-hover:border-white/20 transition-all ${color || 'text-slate-400'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      {label}
    </button>
  );
}
