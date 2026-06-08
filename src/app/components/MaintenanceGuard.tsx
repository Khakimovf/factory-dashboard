import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldAlert, Wifi, Lock, AlertTriangle } from 'lucide-react';
import { useMaintenance } from '../context/MaintenanceContext';
import { useMaintenanceStore } from '../store/maintenanceStore';

/**
 * MaintenanceGuard — wraps the main layout content.
 * If the current route belongs to a locked module or child sub-route, this replaces the children
 * with a full-screen maintenance lock screen.
 */
export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const { activeBroadcast, dismissBroadcast } = useMaintenance();
    const location = useLocation();

    // Select modules to reactively trigger updates on toggle
    const modules = useMaintenanceStore((state) => state.modules);
    const isRouteLocked = useMaintenanceStore((state) => state.isRouteLocked);

    const lockedInfo = isRouteLocked(location.pathname);


    // Determine if the broadcast matches the current path layout
    const isBroadcastVisible = React.useMemo(() => {
        if (!activeBroadcast) return false;
        
        const targets = activeBroadcast.targets;
        // If target contains "ALL MODULES", it shows globally
        const hasAll = targets.some(t => t.toUpperCase().includes('ALL MODULES'));
        if (hasAll) return true;

        // Admin panel should always display the broadcast for verification
        if (location.pathname === '/system-settings') return true;

        // Check matching route prefixes
        return targets.some(t => {
            const label = t.toUpperCase();
            if (label.includes('OMBOR') || label.includes('LOGISTIKA')) {
                return location.pathname.startsWith('/warehouse');
            }
            if (label.includes('GATE') || label.includes('TERMINAL') || label.includes('POST-1')) {
                return location.pathname.startsWith('/logistics-gate');
            }
            if (label.includes('MOLIYA') || label.includes('FINANCE')) {
                return location.pathname.startsWith('/finance');
            }
            return false;
        });
    }, [activeBroadcast, location.pathname]);

    return (
        <>
            {/* ── Global Broadcast Banner ──────────────────────────────────────── */}
            {isBroadcastVisible && activeBroadcast && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    className={`sticky top-0 z-[500] w-full flex items-center justify-between gap-4 px-6 py-3 border-b shadow-2xl ${
                        activeBroadcast.severity === 'critical'
                            ? 'bg-rose-950/95 border-rose-500/60 shadow-rose-500/20'
                            : 'bg-amber-950/95 border-amber-500/60 shadow-amber-500/20'
                    } backdrop-blur-md`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            activeBroadcast.severity === 'critical'
                                ? 'bg-rose-500/20 border border-rose-500/30'
                                : 'bg-amber-500/20 border border-amber-500/30'
                        }`}>
                            {activeBroadcast.severity === 'critical'
                                ? <ShieldAlert className="w-4 h-4 text-rose-400" />
                                : <AlertTriangle className="w-4 h-4 text-amber-400" />
                            }
                        </div>
                        <div className="min-w-0">
                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-0.5 ${
                                activeBroadcast.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'
                            }`}>
                                {activeBroadcast.severity === 'critical' ? '🚨 KRITIK TIZIM OGOHLANTIRISHI' : '📡 TIZIM XABARNOMASI'} ·{' '}
                                {activeBroadcast.targets.join(' · ')}
                            </p>
                            {/* Marquee scroll for the message */}
                            <div className="overflow-hidden">
                                <motion.p
                                    animate={{ x: ['100%', '-120%'] }}
                                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                                    className={`text-[11px] font-bold whitespace-nowrap ${
                                        activeBroadcast.severity === 'critical' ? 'text-rose-200' : 'text-amber-200'
                                    }`}
                                >
                                    {activeBroadcast.message}
                                    &nbsp;&nbsp;⬤&nbsp;&nbsp;
                                    {activeBroadcast.message}
                                </motion.p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <Wifi className={`w-3 h-3 ${
                                activeBroadcast.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                            } animate-pulse`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${
                                activeBroadcast.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'
                            }`}>LIVE</span>
                        </div>
                        <button
                            onClick={dismissBroadcast}
                            className="text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-lg transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </motion.div>
            )}

            {/* ── Module Lock Screen ───────────────────────────────────────────── */}
            {lockedInfo ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-[#020617] relative overflow-hidden"
                >
                    {/* Animated grid background */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(99,102,241,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.4) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />
                    {/* Glow orb */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="relative z-10 max-w-lg w-full mx-6 text-center"
                    >
                        {/* Icon */}
                        <div className="mx-auto mb-8 w-24 h-24 bg-rose-500/10 border border-rose-500/30 rounded-[28px] flex items-center justify-center shadow-2xl shadow-rose-500/10 relative">
                            <Lock className="w-12 h-12 text-rose-500" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-[28px] border border-rose-500/20"
                            />
                        </div>

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.3em]">
                                MAINTENANCE MODE ACTIVE
                            </span>
                        </div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                            {lockedInfo.lockLabel}
                        </h2>
                        <p className="text-sm font-bold text-slate-400 leading-relaxed mb-2">
                            Ushbu bo'limda tizim administratori tomonidan yangilanish ishlari olib borilmoqda.
                        </p>
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                            (Section under active maintenance by Admin)
                        </p>

                        {/* Pulsing border card */}
                        <div className="mt-8 p-5 bg-slate-900/60 border border-rose-500/10 rounded-2xl space-y-3">
                            {['Checking system integrity...', 'Applying patch set v2.6.1...', 'Verifying database indices...'].map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                                    className="flex items-center gap-3 text-[10px] font-mono text-slate-500"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500/60 shrink-0" />
                                    {msg}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            ) : (
                <>{children}</>
            )}
        </>
    );
}
