import React, { useState } from 'react';
import {
    Users, Shield, Activity, Search, Plus, Filter,
    MoreVertical, CheckCircle2, XCircle, AlertCircle,
    Download, FilterX, Loader2, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface AdminUser {
    id: string;
    fullName: string;
    username: string;
    role: string;
    status: 'active' | 'inactive';
    lastActive: string;
}

const MOCK_ADMIN_USERS: AdminUser[] = [
    { id: '1', fullName: 'System Administrator', username: 'admin', role: 'ADMIN', status: 'active', lastActive: '2 min oldin' },
    { id: '2', fullName: 'Azamat Qosimov', username: 'vgm_guard', role: 'VGM_GUARD', status: 'active', lastActive: '1 soat oldin' },
    { id: '3', fullName: 'Dilshod Ergashev', username: 'qc_manager', role: 'QC_MANAGER', status: 'inactive', lastActive: '3 kun oldin' }
];

const MOCK_AUDIT_LOGS = [
    { id: '1', user: 'admin', action: 'Login', module: 'Auth', timestamp: '2026-03-07 15:30:12', status: 'success' },
    { id: '2', user: 'vgm_guard', action: 'Entry Record', module: 'Logistics', timestamp: '2026-03-07 15:35:45', status: 'success' },
    { id: '3', user: 'admin', action: 'Add User', module: 'Admin', timestamp: '2026-03-07 15:40:00', status: 'success' },
    { id: '4', user: 'unknown', action: 'Failed Login', module: 'Auth', timestamp: '2026-03-07 15:42:10', status: 'failed' }
];

export function AdminPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="min-h-full bg-slate-950 p-8 pt-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
                            <Shield className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">ADMINISTRATION</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{t('admin.title')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button className="bg-slate-900 hover:bg-slate-800 border-slate-800 text-white font-bold h-12 px-6 rounded-2xl gap-2 italic ring-1 ring-slate-800">
                        <Download className="w-4 h-4" /> EKSPORT
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 px-8 rounded-2xl shadow-lg shadow-emerald-600/20 italic gap-2 transition-all active:scale-95">
                        <Plus className="w-5 h-5" /> {t('admin.addNewUser')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="users" className="space-y-8" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1.5 rounded-2xl h-14">
                        <TabsTrigger value="users" className="rounded-xl px-8 font-black uppercase italic tracking-tight data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            {t('admin.userManagement')}
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-xl px-8 font-black uppercase italic tracking-tight data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            {t('admin.auditLog')}
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-xl px-8 font-black uppercase italic tracking-tight data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                            Tizim sozlamalari
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                            placeholder="Qidiruv..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border-slate-800 h-14 pl-12 rounded-2xl text-white font-bold focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                </div>

                <TabsContent value="users">
                    <Card className="bg-slate-900/50 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/30">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('admin.fullName')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('admin.role')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('admin.status')}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Oxirgi faollik</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{t('admin.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {MOCK_ADMIN_USERS.map((u) => (
                                            <tr key={u.id} className="hover:bg-indigo-500/5 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 font-bold text-slate-400">
                                                            {u.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-bold italic">{u.fullName}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">@{u.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-black italic rounded-lg px-3 py-1">
                                                        {u.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        {u.status === 'active' ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                                                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> FAOL
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs uppercase">
                                                                <span className="w-2 h-2 bg-slate-600 rounded-full" /> Noactive
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-slate-400 font-bold text-sm italic">{u.lastActive}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audit">
                    <Card className="bg-slate-900/50 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-900/30">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Module</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {MOCK_AUDIT_LOGS.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-8 py-6 font-mono text-[11px] text-slate-400 font-bold italic">{log.timestamp}</td>
                                                <td className="px-8 py-6 font-black text-white italic text-sm">{log.user}</td>
                                                <td className="px-8 py-6">
                                                    <Badge variant="outline" className="border-slate-800 text-slate-400 font-bold tracking-widest uppercase text-[9px] rounded-md">
                                                        {log.module}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-slate-300 font-bold italic">{log.action}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <Badge className={log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}>
                                                        {log.status.toUpperCase()}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
