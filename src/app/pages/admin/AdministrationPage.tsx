import { useState, useEffect } from 'react';
import {
    Users, Shield, Activity, Search, Plus,
    UserPlus, Key, Eye, Trash2, CheckCircle2,
    Clock, Server, ShieldAlert, Filter, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { DevTerminal } from '../../components/DevTerminal';
import { RawDataView } from '../../components/RawDataView';
import { Terminal as TerminalIcon, Database } from 'lucide-react';

export default function AdministrationPage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'dev_tools'>('users');
    const isITSpecialist = user?.role === 'IT_SPECIALIST';

    return (
        <div className="min-h-screen bg-slate-950 p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                        System <span className="text-indigo-500">Administration</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Xodimlar va ruxsatnomalarni boshqarish markazi</p>
                </div>

                <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
                    <TabButton
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                        icon={Users}
                        label="Xodimlar"
                    />
                    <TabButton
                        active={activeTab === 'roles'}
                        onClick={() => setActiveTab('roles')}
                        icon={Shield}
                        label="Rollar"
                    />
                    {isITSpecialist && (
                        <TabButton
                            active={activeTab === 'dev_tools'}
                            onClick={() => setActiveTab('dev_tools')}
                            icon={TerminalIcon}
                            label="IT Tools"
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'users' && <UserManagement key="users" />}
                    {activeTab === 'roles' && <RoleManagement key="roles" />}
                    {activeTab === 'dev_tools' && isITSpecialist && (
                        <motion.div
                            key="dev_tools"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            <DevTerminal />
                            <RawDataView />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm uppercase italic tracking-tight ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:text-slate-300'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}

function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/v1/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Xodimni qidirish (ism, tabel raqami)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    />
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-tight italic"
                >
                    <Plus className="w-5 h-5" />
                    Yangi xodim qo'shish
                </button>
            </div>

            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Xodim</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Tabel Raqami</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Rol</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Xavfsizlik</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Harakatlar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 font-black text-indigo-400">
                                            {user.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white uppercase italic">{user.full_name}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{user.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-black tracking-widest border border-slate-700 uppercase">
                                        {user.employee_id}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-xs text-indigo-400 uppercase italic tracking-tight">
                                    {user.role}
                                </td>
                                <td className="px-6 py-4">
                                    {user.is_first_login ? (
                                        <span className="flex items-center gap-2 text-rose-500 text-xs font-black uppercase italic">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            Parol o'zgarishi shart
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase italic">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Xavfsiz
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-800">
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-800">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddForm && (
                <UserAddModal
                    onClose={() => setShowAddForm(false)}
                    onSuccess={() => {
                        setShowAddForm(false);
                        fetchUsers();
                    }}
                />
            )}
        </motion.div>
    );
}

function UserAddModal({ onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        employee_id: '',
        role: 'QC_OPERATOR',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/v1/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSuccessMessage(`Xodim muvaffaqiyatli qo'shildi. Login: ${formData.username}`);
                setTimeout(() => {
                    onSuccess();
                }, 3000);
            } else {
                const error = await res.json();
                alert(error.detail || 'Xatolik yuz berdi');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl shadow-indigo-500/10"
            >
                <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-900/10 relative">
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 bg-emerald-600 flex items-center justify-center z-10 p-4 text-center"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                                <span className="text-white font-black uppercase italic tracking-tight">{successMessage}</span>
                            </div>
                        </motion.div>
                    )}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <UserPlus className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Yangi xodim</h2>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Tizimga kirish huquqini berish</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">F.I.SH (To'liq)</label>
                            <input
                                required
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="Azamat Qosimov"
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold uppercase italic italic-placeholder"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tabel Raqami</label>
                            <input
                                required
                                type="text"
                                value={formData.employee_id}
                                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                placeholder="VGM-001"
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold uppercase tracking-widest"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username (Majburiy)</label>
                            <input
                                required
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="qosimov_a"
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Parol</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                                >
                                    {showPassword ? <Eye className="w-5 h-5" /> : <Eye className="w-5 h-5 opacity-50" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tizimdagi Rol</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold uppercase italic"
                            >
                                <option value="SUPER_ADMIN">SUPER ADMIN</option>
                                <option value="QC_MANAGER">QC MANAGER</option>
                                <option value="QC_OPERATOR">QC OPERATOR</option>
                                <option value="VGM_GUARD">VGM GUARD</option>
                                <option value="CANTEEN_MANAGER">CANTEEN MANAGER</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic"
                        >
                            Bekor qilish
                        </button>
                        <button
                            type="submit"
                            className="flex-2 px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-tight italic"
                        >
                            Saqlash va Yuborish
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}


import {
    getAllRolePermissions,
    getRolePermissions,
    setAllRolePermissions,
    UserRole,
    PermissionModule,
    PermissionAction
} from '../../utils/roleUtils';

function RoleManagement() {
    const [roles, setRoles] = useState<UserRole[]>([
        'SUPER_ADMIN', 'QC_MANAGER', 'QC_OPERATOR', 'VGM_GUARD',
        'CANTEEN_MANAGER', 'ADMIN', 'WAREHOUSE_ADMIN', 'FACTORY_MANAGER'
    ]);
    const [selectedRole, setSelectedRole] = useState<UserRole>('QC_MANAGER');
    const [permissions, setPermissions] = useState<any>(getAllRolePermissions());
    const [showAddRole, setShowAddRole] = useState(false);

    // Mock user counts for roles
    const userCounts: Record<string, number> = {
        'SUPER_ADMIN': 2,
        'QC_MANAGER': 3,
        'QC_OPERATOR': 12,
        'VGM_GUARD': 8,
        'CANTEEN_MANAGER': 2,
        'ADMIN': 5,
        'WAREHOUSE_ADMIN': 2,
        'FACTORY_MANAGER': 1
    };

    const modules: PermissionModule[] = [
        'dashboard', 'qc', 'vgm', 'canteen', 'admin', 'warehouse', 'production', 'hr', 'maintenance'
    ];
    const actions: PermissionAction[] = ['READ', 'WRITE', 'ADMIN'];

    const hasPermission = (role: UserRole, module: PermissionModule, action: PermissionAction) => {
        return permissions[role]?.some((p: any) => p.module === module && p.action === action);
    };

    const togglePermission = async (module: PermissionModule, action: PermissionAction) => {
        const currentPermissions = [...(permissions[selectedRole] || [])];
        const index = currentPermissions.findIndex(p => p.module === module && p.action === action);

        let newPermissions;
        let changeDescription = '';

        if (index >= 0) {
            newPermissions = currentPermissions.filter((_, i) => i !== index);
            changeDescription = `Removed ${action} permission from ${module} for role ${selectedRole}`;
        } else {
            newPermissions = [...currentPermissions, { module, action }];
            changeDescription = `Added ${action} permission to ${module} for role ${selectedRole}`;
        }

        const nextPermissions = {
            ...permissions,
            [selectedRole]: newPermissions
        };

        setPermissions(nextPermissions);
        setAllRolePermissions(nextPermissions);

        try {
            await fetch('/api/v1/admin/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_ROLE_PERMISSION',
                    module: 'ADMIN',
                    details: {
                        role: selectedRole,
                        target_module: module,
                        target_action: action,
                        description: changeDescription
                    },
                    status: 'SUCCESS'
                })
            });
        } catch (err) {
            console.error('Failed to log audit:', err);
        }
    };

    const handleCreateRole = async (name: string, template: 'OPERATOR' | 'MANAGER' | 'ADMIN') => {
        const newRole = name.toUpperCase().replace(/\s+/g, '_') as UserRole;
        if (roles.includes(newRole)) {
            alert('Bu nomli rol allaqachon mavjud!');
            return;
        }

        let templatePermissions: any[] = [];
        if (template === 'OPERATOR') {
            templatePermissions = modules.map(m => ({ module: m, action: 'READ' }));
        } else if (template === 'MANAGER') {
            templatePermissions = modules.flatMap(m => [
                { module: m, action: 'READ' },
                { module: m, action: 'WRITE' }
            ]);
        } else if (template === 'ADMIN') {
            templatePermissions = modules.flatMap(m => [
                { module: m, action: 'READ' },
                { module: m, action: 'WRITE' },
                { module: m, action: 'ADMIN' }
            ]);
        }

        const nextPermissions = { ...permissions, [newRole]: templatePermissions };
        setPermissions(nextPermissions);
        setAllRolePermissions(nextPermissions);
        setRoles([...roles, newRole]);
        setSelectedRole(newRole);
        setShowAddRole(false);

        // Audit Log
        try {
            await fetch('/api/v1/admin/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREATE_ROLE',
                    module: 'ADMIN',
                    details: { role: newRole, template },
                    status: 'SUCCESS'
                })
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8"
        >
            {/* Left Side: Role List */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Tizim Rollari</h2>
                    <button
                        onClick={() => setShowAddRole(true)}
                        className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/30"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2 h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                    {roles.map((role) => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all group relative overflow-hidden ${selectedRole === role
                                ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <span className={`block font-black uppercase italic tracking-tight text-sm ${selectedRole === role ? 'text-indigo-400' : 'text-slate-300'
                                        }`}>
                                        {role.replace('_', ' ')}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {userCounts[role] || 0} foydalanuvchi
                                    </span>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${selectedRole === role ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
                            </div>
                            {selectedRole === role && (
                                <motion.div
                                    layoutId="role-highlight"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Side: Permission Matrix */}
            <div className="lg:col-span-3">
                <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/50">
                    <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
                                    <Shield className="text-indigo-400 w-6 h-6 shadow-[0_0_10px_rgba(129,140,248,0.3)]" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                    Permission <span className="text-indigo-500">Matrix</span>
                                </h3>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic ml-11">
                                Granular ruxsatnomalar: <span className="text-indigo-400">@{selectedRole}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs border border-slate-700 hover:text-white transition-all uppercase tracking-widest italic group">
                                <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform" />
                                RESET
                            </button>
                        </div>
                    </div>

                    <div className="p-0">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/20">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">System Module</th>
                                    {actions.map(action => (
                                        <th key={action} className="px-10 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                                            {action}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {modules.map((module) => (
                                    <tr key={module} className={`group transition-all ${selectedRole ? 'hover:bg-indigo-500/5' : ''}`}>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-black text-slate-600 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all">
                                                    {module.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="block text-sm font-black text-white uppercase italic tracking-tight">{module}</span>
                                                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{module} moduli boshqaruvi</span>
                                                </div>
                                            </div>
                                        </td>
                                        {actions.map(action => (
                                            <td key={action} className="px-10 py-6 text-center">
                                                <button
                                                    onClick={() => togglePermission(module, action)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-all relative ${hasPermission(selectedRole, module, action)
                                                        ? 'bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                                                        : 'bg-slate-800'
                                                        }`}
                                                >
                                                    <motion.div
                                                        animate={{ x: hasPermission(selectedRole, module, action) ? 24 : 0 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className="w-4 h-4 bg-white rounded-full shadow-lg"
                                                    />
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showAddRole && (
                <RoleAddModal
                    onClose={() => setShowAddRole(false)}
                    onCreate={handleCreateRole}
                />
            )}
        </motion.div>
    );
}

function RoleAddModal({ onClose, onCreate }: any) {
    const [name, setName] = useState('');
    const [template, setTemplate] = useState<'OPERATOR' | 'MANAGER' | 'ADMIN'>('OPERATOR');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-lg overflow-hidden"
            >
                <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-900/10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Plus className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Yangi Rol</h2>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Xavfsizlik darajasini belgilash</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rol nomi</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masalan: LINE MANAGER"
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold uppercase italic"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Xavfsizlik Shablonlari (Preset)</label>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setTemplate('OPERATOR')}
                                className={`p-4 rounded-2xl border text-left transition-all ${template === 'OPERATOR' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700'}`}
                            >
                                <div className="font-bold text-white text-sm uppercase italic">Operator (Read-only)</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Faqatgina ma'lumotlarni ko'rish huquqi</div>
                            </button>
                            <button
                                onClick={() => setTemplate('MANAGER')}
                                className={`p-4 rounded-2xl border text-left transition-all ${template === 'MANAGER' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700'}`}
                            >
                                <div className="font-bold text-white text-sm uppercase italic">Manager (Edit)</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ko'rish va o'zgartirish huquqi</div>
                            </button>
                            <button
                                onClick={() => setTemplate('ADMIN')}
                                className={`p-4 rounded-2xl border text-left transition-all ${template === 'ADMIN' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700'}`}
                            >
                                <div className="font-bold text-white text-sm uppercase italic">Admin (Full Control)</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tizimni to'liq boshqarish huquqi</div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic"
                        >
                            Bekor qilish
                        </button>
                        <button
                            onClick={() => onCreate(name, template)}
                            disabled={!name}
                            className="flex-2 px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-tight italic"
                        >
                            Yaratish
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
