import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Lock, User, Eye, EyeOff, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { login, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already authenticated, redirect immediately
    if (isAuthenticated && !isLoading) {
        return <Navigate to={from} replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            // Navigation handled by the redirect above on next render
        } catch (err: any) {
            setError(err.message || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-8 relative overflow-y-auto overflow-x-hidden">
            {/* Background FX */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-900/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full" />
                {/* Grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo block */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-5"
                    >
                        <Building2 className="text-white w-10 h-10" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        VGM <span className="text-indigo-400">ERP</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">
                        Enterprise Management System
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 border border-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/40">
                    <div className="mb-6">
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">Kirish</h2>
                        <p className="text-slate-500 text-xs mt-0.5">Hisobingizga ulaning</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Foydalanuvchi nomi
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="username-input"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="username"
                                    className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Parol
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    id="password-input"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl py-3.5 pl-11 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3"
                                >
                                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                    <p className="text-rose-400 text-xs font-bold">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <button
                            id="login-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-3 uppercase tracking-wider text-sm group"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Kirish
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.3em] mt-6">
                    VGM HUB © 2026 — ERP v2.0
                </p>
            </motion.div>
        </div>
    );
}
