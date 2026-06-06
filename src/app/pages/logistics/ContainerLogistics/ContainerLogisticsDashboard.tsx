import React from 'react';
import { 
  Plus, ArrowDownLeft, ArrowUpRight, Clock, Ship, 
  CheckCircle2, AlertCircle, BarChart3, ChevronRight 
} from 'lucide-react';
import { motion } from 'motion/react';

const KPICard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-[32px] flex items-center gap-6 group hover:bg-slate-900/50 transition-all">
    <div className={`w-14 h-14 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon size={28} className={color.replace('bg-', 'text-')} />
    </div>
    <div>
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-1">{label}</h4>
      <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
  </div>
);

const ContainerRow = ({ id, origin, carrier, status, date, type }: any) => {
  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'DENGIZDA': case 'YUKLANDI': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'BOJXONADA': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'QABUL QILINDI': case 'JO\'NATILDI': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'KECHIKDI': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'TAYYORLANMOQDA': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-white/[0.02] rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-slate-800/50">
      <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center font-mono text-[10px] font-black text-slate-500 group-hover:text-indigo-400 transition-colors">
        {type === 'import' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-[13px] font-black text-white uppercase italic tracking-tight font-mono">{id}</h5>
        <p className="text-[10px] font-bold text-slate-500 uppercase truncate mt-0.5">{origin} • {carrier}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase italic ${getStatusStyle(status)}`}>
          {status}
        </span>
        <span className="text-[9px] font-bold text-slate-600 font-mono italic">{date}</span>
      </div>
      <ChevronRight size={14} className="text-slate-800 group-hover:text-white transition-colors" />
    </div>
  );
};

export const ContainerLogisticsDashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Bugun kutilmoqda" value="02" icon={Clock} color="bg-cyan-500" />
        <KPICard label="Bojxonada" value="01" icon={AlertCircle} color="bg-amber-500" />
        <KPICard label="Yuk olish jarayonida" value="03" icon={BarChart3} color="bg-blue-500" />
        <KPICard label="Bugun jo'natildi" value="01" icon={CheckCircle2} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Import */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] p-8 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Kelayotgan Konteynerlar</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Import Yo'nalishi</p>
            </div>
            <button className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all shadow-lg shadow-indigo-600/20 group">
              <Plus size={20} className="group-active:scale-95" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            <ContainerRow type="import" id="MSCU7234891" origin="Xitoy" carrier="MAERSK" status="QABUL QILINDI" date="28.05.2026" />
            <ContainerRow type="import" id="TCKU3891234" origin="Janubiy Koreya" carrier="MSC" status="BOJXONADA" date="30.05.2026" />
            <ContainerRow type="import" id="GESU4521789" origin="Germaniya" carrier="HAPAG" status="DENGIZDA" date="02.06.2026" />
            <ContainerRow type="import" id="HLCU8234567" origin="Xitoy" carrier="CMA-CGM" status="DENGIZDA" date="04.06.2026" />
            <ContainerRow type="import" id="OOLU1234567" origin="Turkiya" carrier="EVERGREEN" status="KECHIKDI" date="25.05.2026" />
          </div>
        </div>

        {/* Right Panel - Export */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] p-8 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Chiqayotgan Konteynerlar</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Eksport (Qozog'iston)</p>
            </div>
            <button className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-lg shadow-emerald-600/20 group">
              <Plus size={20} className="group-active:scale-95" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            <ContainerRow type="export" id="MSCU1234567" origin="Almaty, KZ" carrier="KazAutoTrim" status="JO'NATILDI" date="01.06.2026" />
            <ContainerRow type="export" id="TCKU9876543" origin="Shymkent, KZ" carrier="Central Auto" status="YUKLANDI" date="03.06.2026" />
            <ContainerRow type="export" id="GESU1122334" origin="Almaty, KZ" carrier="KazAutoTrim" status="TAYYORLANMOQDA" date="05.06.2026" />
            <ContainerRow type="export" id="KMTU4455667" origin="Nur-Sultan, KZ" carrier="Astana Parts" status="YUKLANDI" date="02.06.2026" />
          </div>
        </div>
      </div>

      {/* Stats Bottom */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Oxirgi 7 kun statistikasi</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Konteynerlar soni (Import vs Eksport)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase italic">Import</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase italic">Eksport</span>
            </div>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between gap-4 px-4 pt-4 border-l border-b border-slate-800/50 relative">
          {/* Mock Bar Chart */}
          {[
            { day: 'Pn', imp: 3, exp: 1 },
            { day: 'Se', imp: 2, exp: 2 },
            { day: 'Ch', imp: 4, exp: 1 },
            { day: 'Pa', imp: 2, exp: 3 },
            { day: 'Ju', imp: 3, exp: 2 },
            { day: 'Sh', imp: 1, exp: 0 },
            { day: 'Ya', imp: 0, exp: 0 }
          ].map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full max-w-[40px] flex items-end gap-1 h-32">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.imp / 4) * 100}%` }}
                  className="flex-1 bg-indigo-500/40 rounded-t-lg border-x border-t border-indigo-500/30 relative group"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.imp}
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.exp / 4) * 100}%` }}
                  className="flex-1 bg-emerald-500/40 rounded-t-lg border-x border-t border-emerald-500/30 relative group"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.exp}
                  </div>
                </motion.div>
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase italic mb-[-24px]">{item.day}</span>
            </div>
          ))}
        </div>
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
