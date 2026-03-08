import { useState } from 'react';
import { ShieldCheck, Key, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ChangePasswordPage() {
    const { user, updatePassword } = useAuth();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Parollar mos kelmadi');
            return;
        }
        if (newPassword.length < 6) {
            setError('Parol kamida 6 belgidan iborat bo\'lishi kerak');
            return;
        }

        setLoading(true);
        try {
            await updatePassword(newPassword);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-10 shadow-2xl shadow-indigo-500/10 backdrop-blur-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full" />

                    <div className="relative z-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8 border border-indigo-400/30">
                            <ShieldCheck className="text-white w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                Xavfsizlik <span className="text-indigo-400">Birinchi</span>
                            </h1>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                                Birinchi marta kirish: Parolni yangilang
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-rose-500 text-xs font-bold uppercase italic">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                                    <input
                                        required
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="YANGI PAROL"
                                        className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black tracking-widest uppercase italic-placeholder"
                                    />
                                </div>

                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
                                    <input
                                        required
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="PAROLNI TASDIQLASH"
                                        className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-black tracking-widest uppercase italic-placeholder"
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 uppercase italic tracking-wider group"
                            >
                                {loading ? 'YUBORILMOQDA...' : (
                                    <>
                                        PAROLNI SAQLASH
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                MIN 6 BELGI
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                XAVFSIZLIK KODI
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] mt-8">
                    VGM HUB SECURITY PROTOCOL v4.0
                </p>
            </motion.div>
        </div>
    );
}
