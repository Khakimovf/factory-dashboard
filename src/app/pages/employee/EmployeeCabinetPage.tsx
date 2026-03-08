import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  mockCurrentEmployee,
  calculateWorkExperience,
  mockSalaryHistory,
  mockAttendanceRecords,
  mockLeaveBalance,
  mockDocuments,
} from '../../data/essData';
import {
  User, DollarSign, Clock, Calendar, FileText, Briefcase, Building, Download, Eye,
  AlertCircle, TrendingUp, Send, ShieldCheck, HeartPulse, ShieldAlert, CheckCircle2,
  Trophy, BookOpen, Star, Camera, Car, Heart, UserMinus, Plus, Activity, Gauge
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { submitLateReport } from '../../services/lateReportsService';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Theme Toggler Component (Zen/Paper) ---
function ThemeToggle({ theme, onToggle }: { theme: 'zen' | 'paper', onToggle: () => void }) {
  return (
    <div className="flex bg-slate-900/50 border border-slate-700/50 p-1 rounded-full backdrop-blur-md">
      <button
        onClick={onToggle}
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'paper' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
      >
        Paper
      </button>
      <button
        onClick={onToggle}
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'zen' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
      >
        Zen
      </button>
    </div>
  );
}

// TODO: Replace mock data
const mockEmployee = {
  fullName: 'Aliyev Sardor',
  position: 'Liniya operatori',
  department: 'Ishlab chiqarish',
  hireDate: '2022-01-15T08:00:00.000Z',
  birthdate: '1995-08-25',
  level: 4,
  learningProgress: 75,
  safeDays: 142,
  kudos: 18,
};

const fakeSalaryTrend = [
  { month: 'Set', val: 3200000 },
  { month: 'Okt', val: 3350000 },
  { month: 'Noy', val: 3400000 },
  { month: 'Dek', val: 3800000 },
  { month: 'Yan', val: 3450000 },
  { month: 'Fev', val: 3600000 }
];

type DocStatus = 'Yangi' | 'Ko\'rilgan' | 'Tasdiqlangan';
interface ArchiveDoc {
  id: string;
  title: string;
  category: string;
  date: string;
  status: DocStatus;
  type: 'pdf' | 'img';
  size: string;
}

const initialArchiveDocs: ArchiveDoc[] = [
  { id: 'd1', title: 'Liniya Operatori Yo\'riqnomasi v2.0', category: 'SOP', date: '2026-03-01', status: 'Yangi', type: 'pdf', size: '2.4 MB' },
  { id: 'd2', title: 'Mart 2026 Smena Jadvali', category: 'Ish grafigi', date: '2026-02-28', status: 'Ko\'rilgan', type: 'img', size: '1.2 MB' },
  { id: 'd3', title: 'Qo\'shimcha bonus hisoblash tartibi', category: 'Buyruq va Farmoyishlar', date: '2026-02-15', status: 'Tasdiqlangan', type: 'pdf', size: '0.8 MB' },
  { id: 'd4', title: 'LEAN va 5S Praktikasi Sertifikati', category: 'Sertifikat va Mukofotlar', date: '2026-01-20', status: 'Tasdiqlangan', type: 'pdf', size: '3.5 MB' },
];

const generateHeatmap = () => {
  const days = [];
  for (let i = 0; i < 30; i++) days.push(Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent'));
  return days;
};

export function EmployeeCabinetPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [theme, setTheme] = useState<'zen' | 'paper'>('zen');
  const [isLateModalOpen, setIsLateModalOpen] = useState(false);
  const [lateForm, setLateForm] = useState({ category: '', hours: '', text: '', photo: null as string | null });
  const [overtimeEst, setOvertimeEst] = useState('');

  const [archiveDocs, setArchiveDocs] = useState<ArchiveDoc[]>(initialArchiveDocs);
  const [viewingDoc, setViewingDoc] = useState<ArchiveDoc | null>(null);

  const heatmap = generateHeatmap();

  const isDark = theme === 'zen';
  const isRoot = user?.username === 'Khakimovf';
  const bgClass = isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-900';
  const cardClass = isDark ? 'bg-slate-900/40 backdrop-blur-2xl border border-white/5 ring-1 ring-white/5 shadow-xl hover:bg-slate-900/60 transition-all duration-300' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(amount);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setLateForm({ ...lateForm, photo: event.target?.result as string });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const submitRequest = () => {
    if (!lateForm.category || !lateForm.hours) { toast.error("To'liq to'ldiring"); return; }
    toast.success("So'rov muvaffaqiyatli yuborildi", { description: "HR bo'limi ko'rib chiqmoqda." });
    setIsLateModalOpen(false);
    setLateForm({ category: '', hours: '', text: '', photo: null });
  };

  const handleAcknowledge = () => {
    if (viewingDoc) {
      setArchiveDocs(prev => prev.map(d => d.id === viewingDoc.id ? { ...d, status: 'Tasdiqlangan' } : d));
      toast.success("Hujjat tasdiqlandi", { description: "Tasdiqlash HR tizimiga yozildi.", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> });
      setViewingDoc(null);
    }
  };

  const handleView = (doc: ArchiveDoc) => {
    if (doc.status === 'Yangi') {
      setArchiveDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'Ko\'rilgan' } : d));
    }
    setViewingDoc(doc);
  };

  // ─── 1. Smart Header & Identity ───
  return (
    <div className={`min-h-screen p-4 sm:p-8 font-sans transition-colors duration-500 ${bgClass} pb-24`}>

      {/* Shadow View for Root */}
      {isRoot && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-indigo-600/10 border border-indigo-500/50 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-black text-xs uppercase tracking-widest leading-none mb-1">Root Access Mode</h4>
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">You are currently in SHADOW VIEW (Worker Experience Template)</p>
              </div>
            </div>
            <Badge variant="outline" className="border-indigo-500 text-indigo-400 uppercase text-[9px] font-black tracking-widest px-3 py-1">Khakimovf (ROOT)</Badge>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 max-w-7xl mx-auto">
        <div>
          <h2 className={`text-3xl font-black ${textPrimary} tracking-tight`}>{t('sidebar.employeeCabinet')}</h2>
          <p className={`text-xs font-bold uppercase tracking-widest ${textMuted} mt-1`}>Industrial Nerve Center • Employee Hub</p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'zen' ? 'paper' : 'zen')} />
          <Button onClick={() => setIsLateModalOpen(true)} className="h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50">
            <Send className="w-4 h-4 mr-2" /> So'rov Yuborish / New Request
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Identity Banner (Glassmorphism) */}
        <div className={`relative overflow-hidden rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-50 ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-100'}`} />

          <div className="p-8 sm:p-10 relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">

            {/* Avatar & Badges */}
            <div className="relative">
              <div className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl border-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white'}`}>
                <User className={`w-14 h-14 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <div className="absolute -bottom-3 -right-3 flex flex-col gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white shadow-lg border-2 border-slate-900" title="Safety Expert"><ShieldCheck className="w-4 h-4" /></span>
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-lg border-2 border-slate-900" title="Master Operator"><Trophy className="w-4 h-4" /></span>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              <Badge className={`font-mono text-[10px] px-3 py-1 mb-3 ${isDark ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-100 text-indigo-700'}`}>EMP-4092</Badge>
              <h1 className={`text-4xl sm:text-5xl font-black ${textPrimary} tracking-tight mb-2`}>{mockEmployee.fullName}</h1>
              <p className={`text-sm sm:text-base font-bold uppercase tracking-widest ${textMuted} flex flex-wrap items-center gap-4`}>
                <span><Briefcase className="w-4 h-4 inline mr-1" /> {mockEmployee.position}</span>
                <span>•</span>
                <span><Building className="w-4 h-4 inline mr-1" /> {mockEmployee.department}</span>
              </p>
            </div>

            {/* Shift Countdown */}
            <div className={`mt-6 md:mt-0 p-6 rounded-2xl border min-w-[280px] text-center ${isDark ? 'bg-slate-950/50 border-slate-800 shadow-inner' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'} mb-2`}>Keyingi Smena (Next Shift)</p>
              <p className={`text-4xl font-mono font-black ${textPrimary} tracking-tighter`}>12<span className="text-xl text-slate-500 font-sans mx-1">soat</span>45<span className="text-xl text-slate-500 font-sans ml-1">min</span></p>
              <p className={`text-xs font-bold ${textMuted} mt-2`}><Clock className="w-3.5 h-3.5 inline mr-1" /> Ertaga, 08:00 (1-smena)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── 2. Interactive Financial Hub ─── */}
          <div className={`col-span-1 lg:col-span-2 rounded-3xl border p-6 sm:p-8 flex flex-col ${cardClass}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 ${textPrimary}`}><DollarSign className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} /> Financial Hub</h3>
              <Button variant="ghost" size="sm" className={`text-xs font-bold ${textMuted}`}><Download className="w-4 h-4 mr-2" /> Payslip</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">

              {/* Salary Growth Trend */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Joriy Oylik (Net)</p>
                  <p className={`text-4xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'} tracking-tight`}>{formatCurrency(3600000)}</p>
                </div>
                <div className={`flex-1 min-h-[150px] rounded-xl border p-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fakeSalaryTrend} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDark ? "#34d399" : "#059669"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={isDark ? "#34d399" : "#059669"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#020617' : '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold' }} formatter={(val: number) => formatCurrency(val)} />
                      <Area type="monotone" dataKey="val" stroke={isDark ? "#34d399" : "#059669"} strokeWidth={3} fill="url(#colorSal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Salary Estimator (Overtime) */}
              <div className={`p-6 rounded-2xl border flex flex-col justify-center ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className={`text-sm font-black flex items-center gap-2 mb-2 ${textPrimary}`}><Clock className="w-4 h-4 text-amber-500" /> Overtime Estimator</h4>
                <p className={`text-xs font-medium mb-6 ${textMuted}`}>Qo'shimcha soat ishlasangiz qancha daromad topasiz?</p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className={textMuted}>Qo'shimcha Soat</span>
                      <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{overtimeEst || '0'} soat</span>
                    </div>
                    <Input
                      type="range" min="0" max="20" value={overtimeEst} onChange={e => setOvertimeEst(e.target.value)}
                      className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className={`p-4 rounded-xl border pt-3 text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-1`}>Taxminiy Bonus (+)</p>
                    <p className={`text-2xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {overtimeEst ? formatCurrency(parseInt(overtimeEst) * 45000) : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* OEE Contribution Card */}
          <div className={`col-span-1 border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 ${cardClass}`}>
            <div>
              <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${textPrimary}`}><Activity className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} /> OEE Contribution</h3>
              <div className={`p-5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-cyan-950/20 border-cyan-900/50' : 'bg-cyan-50 border-cyan-200'}`}>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>My Contribution</p>
                  <p className={`text-3xl font-black ${textPrimary} tracking-tighter mt-1`}>84.5%</p>
                </div>
                <Gauge className={`w-10 h-10 ${isDark ? 'text-cyan-500/50' : 'text-cyan-400'}`} />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className={textMuted}>Smena samaradorligi</span>
                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>+2.4% vs Avg</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="h-full bg-cyan-500" style={{ width: '84.5%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ─── 3. Wellness & Heatmap ─── */}
          <div className={`col-span-1 border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 ${cardClass}`}>
            <div>
              <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${textPrimary}`}><HeartPulse className={`w-5 h-5 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} /> Wellness & HSE</h3>
              <div className={`p-5 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-200'}`}>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>Safe Days</p>
                  <p className={`text-3xl font-black ${textPrimary} tracking-tighter mt-1`}>{mockEmployee.safeDays}</p>
                </div>
                <ShieldCheck className={`w-10 h-10 ${isDark ? 'text-rose-500/50' : 'text-rose-400'}`} />
              </div>
            </div>

            <div>
              <h3 className={`text-sm font-black uppercase tracking-widest mb-4 ${textPrimary}`}>Attendance Heatmap</h3>
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-7 gap-1.5">
                  {heatmap.map((status, i) => (
                    <div key={i} className={`aspect-square rounded-sm border ${status === 'present' ? (isDark ? 'bg-emerald-500/80 border-emerald-600' : 'bg-emerald-500 border-emerald-600') :
                      status === 'late' ? (isDark ? 'bg-amber-500/80 border-amber-600' : 'bg-amber-400 border-amber-500') :
                        (isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-slate-300')
                      }`} title={status} />
                  ))}
                </div>
                <div className={`flex items-center justify-between mt-3 text-[9px] font-bold uppercase tracking-widest ${textMuted}`}>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /> Present</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-amber-500" /> Late</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-700 rounded-sm" /> Absent</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 4. Gamification & Career ─── */}
          <div className={`col-span-1 lg:col-span-3 border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 ${cardClass}`}>

            {/* Level & Learning */}
            <div className="flex-1">
              <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 mb-6 ${textPrimary}`}><Trophy className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} /> Career Path</h3>
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className={`text-[10px] uppercase font-black tracking-widest ${textMuted}`}>Current Rank</p>
                    <p className={`text-2xl font-black ${textPrimary}`}>Level {mockEmployee.level}</p>
                  </div>
                  <p className={`text-xs font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{mockEmployee.learningProgress}% Completions</p>
                </div>
                <div className={`w-full h-3 rounded-full mb-3 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full" style={{ width: `${mockEmployee.learningProgress}%` }} />
                </div>
                <p className={`text-xs font-bold ${textMuted}`}><BookOpen className="w-3.5 h-3.5 inline mr-1" /> Keyingi daraja (Lvl 5) uchun 2 ta trening qoldi.</p>
              </div>
            </div>

            {/* Kudos Wall */}
            <div className="flex-1">
              <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 mb-6 ${textPrimary}`}><Star className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} /> Kudos Wall</h3>
              <div className={`h-[150px] rounded-2xl border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden ${isDark ? 'bg-amber-950/10 border-amber-900/30' : 'bg-amber-50 border-amber-200'}`}>
                <Star className={`absolute -right-4 -top-4 w-24 h-24 opacity-10 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                <p className={`text-4xl font-black mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{mockEmployee.kudos}</p>
                <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Total Rahmat received</p>
                <p className={`text-xs font-medium mt-2 ${textPrimary}`}>"Excellent 5s organization yesterday!" - Manager</p>
              </div>
            </div>

          </div>
        </div>

        {/* ─── 5. My Digital Archive ─── */}
        <div className={`mt-8 border rounded-3xl p-6 sm:p-8 flex flex-col ${cardClass}`}>
          <h3 className={`text-lg font-black uppercase tracking-widest flex items-center gap-2 mb-6 border-b pb-4 ${textPrimary} ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <FileText className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} /> SHAXSIY HUJJATLAR ARXIVI
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {archiveDocs.map(doc => {
              const isNew = doc.status === 'Yangi';
              const isAck = doc.status === 'Tasdiqlangan';
              return (
                <div key={doc.id} className={`p-5 rounded-3xl border flex flex-col relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer group overflow-hidden ${isDark ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`} onClick={() => handleView(doc)}>
                  {isNew && <div className="absolute top-0 right-0 py-1.5 px-3 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-xl shadow-lg shadow-rose-500/30">New</div>}

                  <div className="flex justify-between items-start mb-5 text-[10px] font-black uppercase tracking-widest pt-1">
                    <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>{doc.category}</span>
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                    <div className={`p-3.5 rounded-2xl flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-white border'}`}>
                      <FileText className={`w-6 h-6 ${doc.type === 'pdf' ? 'text-rose-500' : 'text-emerald-500'}`} />
                    </div>
                    <h4 className={`text-sm font-black leading-snug ${textPrimary} group-hover:text-indigo-500 transition-colors`}>{doc.title}</h4>
                  </div>

                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-800/20 dark:border-slate-700/50">
                    <Badge className={`font-mono text-[9px] font-black uppercase px-2 py-0.5 ${isNew ? 'bg-rose-500/10 text-rose-500' :
                      isAck ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>{doc.status}</Badge>
                    <span className={`text-[10px] font-bold ${textMuted} flex items-center gap-1.5`}><Calendar className="w-3.5 h-3.5" /> {doc.date}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── 5. Modern Request System Modal ─── */}
      <Dialog open={isLateModalOpen} onOpenChange={setIsLateModalOpen}>
        <DialogContent className={`sm:max-w-md border shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <DialogHeader className="mb-4">
            <DialogTitle className={`text-2xl font-black ${textPrimary}`}>Submit Request</DialogTitle>
            <DialogDescription className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Kechikish / Sababli yo'qlik formasi</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">

            {/* Quick Presets */}
            <div>
              <Label className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-3 block`}>1. Asosiy Sabab (Category)</Label>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setLateForm({ ...lateForm, category: 'Transport' })} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${lateForm.category === 'Transport' ? (isDark ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-indigo-50 border-indigo-500 text-indigo-700') : (isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600')}`}>
                  <Car className="w-5 h-5" /> <span className="text-[10px] font-black uppercase">Transport</span>
                </button>
                <button onClick={() => setLateForm({ ...lateForm, category: 'Health' })} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${lateForm.category === 'Health' ? (isDark ? 'bg-rose-600/20 border-rose-500 text-rose-400' : 'bg-rose-50 border-rose-500 text-rose-700') : (isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600')}`}>
                  <Heart className="w-5 h-5" /> <span className="text-[10px] font-black uppercase">Sog'liq</span>
                </button>
                <button onClick={() => setLateForm({ ...lateForm, category: 'Family' })} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${lateForm.category === 'Family' ? (isDark ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-amber-50 border-amber-500 text-amber-700') : (isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-600')}`}>
                  <UserMinus className="w-5 h-5" /> <span className="text-[10px] font-black uppercase">Oila</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-2 block`}>2. Vaqt (Soat)</Label>
                <Input type="number" placeholder="Uzunligi (mas: 2)" value={lateForm.hours} onChange={e => setLateForm({ ...lateForm, hours: e.target.value })} className={`h-12 font-black ${isDark ? 'bg-slate-950 border-slate-800' : ''}`} />
              </div>
              <div>
                <Label className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-2 block`}>3. Isbot (Ixtiyoriy)</Label>
                <div className={`relative h-12 rounded-xl flex items-center justify-center border-2 border-dashed cursor-pointer overflow-hidden transition-all ${lateForm.photo ? (isDark ? 'border-emerald-500' : 'border-emerald-500') : (isDark ? 'border-slate-700 hover:border-slate-500' : 'border-slate-300')}`}>
                  {lateForm.photo ? <img src={lateForm.photo} className="w-full h-full object-cover opacity-50" /> : <Camera className={`w-5 h-5 ${textMuted}`} />}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
              </div>
            </div>

            <div>
              <Label className={`text-[10px] font-black uppercase tracking-widest ${textMuted} mb-2 block`}>4. Izoh (Comment)</Label>
              <Textarea placeholder="Qo'shimcha tafsilotlar..." value={lateForm.text} onChange={e => setLateForm({ ...lateForm, text: e.target.value })} className={`resize-none h-24 ${isDark ? 'bg-slate-950 border-slate-800' : ''}`} />
            </div>

          </div>

          <DialogFooter className="mt-6 border-t pt-4 border-slate-800">
            <Button onClick={() => setIsLateModalOpen(false)} variant="ghost" className={`font-black uppercase tracking-widest text-[10px] ${textMuted} hover:${textPrimary}`}>Cancel</Button>
            <Button onClick={submitRequest} className={`px-6 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              <Send className="w-4 h-4 mr-2" /> Submit to HR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 6. Document Viewer Modal ─── */}
      <Dialog open={!!viewingDoc} onOpenChange={(o) => (!o) && setViewingDoc(null)}>
        <DialogContent className={`sm:max-w-4xl border shadow-2xl h-[85vh] flex flex-col p-0 overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <DialogHeader className="mb-0 shrink-0 border-b p-6 pb-5 border-slate-800/50">
            <div className="flex justify-between items-start pr-6">
              <div>
                <Badge className={`font-mono text-[10px] uppercase font-black px-2 py-0.5 mb-2 ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>{viewingDoc?.category}</Badge>
                <DialogTitle className={`text-2xl font-black ${textPrimary} leading-tight`}>{viewingDoc?.title}</DialogTitle>
                <DialogDescription className={`text-xs font-bold uppercase tracking-widest ${textMuted} mt-2 flex items-center gap-3`}>
                  <span><Calendar className="w-3.5 h-3.5 inline mr-1" /> {viewingDoc?.date}</span>
                  <span>•</span>
                  <span>File Size: {viewingDoc?.size}</span>
                </DialogDescription>
              </div>
              <Button className={`font-black uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}><Download className="w-4 h-4 mr-2" /> Yuklab olish</Button>
            </div>
          </DialogHeader>

          <div className={`flex-1 m-6 mt-2 rounded-2xl border flex items-center justify-center relative shadow-inner overflow-hidden ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 select-none">
              <FileText className="w-32 h-32 mb-6 text-slate-500" />
              <p className="text-xl font-black uppercase tracking-widest">SECURE PDF PREVIEW</p>
              <p className="text-sm font-bold mt-2 font-mono">UID: {viewingDoc?.id} • HR VALIDATED</p>
            </div>
          </div>

          <div className="p-6 pt-0 shrink-0">
            {viewingDoc?.status !== 'Tasdiqlangan' ? (
              <Button onClick={handleAcknowledge} className={`w-full h-14 font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all transform hover:-translate-y-1 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                <CheckCircle2 className="w-5 h-5 mr-3" /> Tanishdim va Tasdiqlayman
              </Button>
            ) : (
              <div className={`w-full h-14 flex items-center justify-center font-black uppercase tracking-widest text-sm rounded-xl border-2 ${isDark ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <ShieldCheck className="w-5 h-5 mr-3" /> Hujjat Tasdiqlangan (HR Synced)
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}
