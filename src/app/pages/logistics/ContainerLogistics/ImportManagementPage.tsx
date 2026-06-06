import React, { useState } from 'react';
import {
  Search, Filter, Plus, Eye, Edit2, FileText,
  X, Copy, CheckCircle2, AlertCircle, MapPin,
  User, Calendar, DollarSign, Package, ChevronRight,
  Truck, ArrowRight, ShieldCheck, Clock, TrendingUp,
  BarChart3, CreditCard, Activity, CalendarDays, Ship
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContainerModal } from './components/ContainerModal';

// --- Mock Data ---
const COUNTRIES = ['Xitoy', 'Janubiy Koreya', 'Germaniya', 'Rossiya', 'Turkiya'];

const IMPORT_CONTAINERS = [
  {
    id: 'MSCU7234891', origin: 'Xitoy', port: 'Shanghai', carrier: 'MAERSK', agent: 'Logistics Pro UZ',
    seal: 'ML-2026-44821', gtd: 'GTD-2026-04821', date: '28.05.2026', materials: 'ABS granula 18t',
    weight: '18,500', status: 'QABUL QILINDI', type: '40\' HC',
    landedCost: 32450, risk: 'LOW',
    docs: { bl: true, inv: true, pl: true, cert: true, gtd: true, pay: true }
  },
  {
    id: 'TCKU3891234', origin: 'Janubiy Koreya', port: 'Busan', carrier: 'MSC', agent: 'Korea Trans',
    seal: 'SC-2026-99120', gtd: 'GTD-2026-04756', date: '30.05.2026', materials: 'Polimer qo\'shimchalari',
    weight: '8,500', status: 'BOJXONADA', type: '20\' Dry',
    landedCost: 18200, risk: 'MEDIUM',
    docs: { bl: true, inv: true, pl: true, cert: true, gtd: false, pay: false }
  },
  {
    id: 'GESU4521789', origin: 'Germaniya', port: 'Hamburg', carrier: 'HAPAG', agent: 'Global Log',
    seal: 'HG-2026-11234', gtd: 'GTD-2026-04892', date: '02.06.2026', materials: 'Plastifikator 12t',
    weight: '12,000', status: 'DENGIZDA', type: '40\' HC',
    landedCost: 45600, risk: 'LOW',
    docs: { bl: true, inv: true, pl: true, cert: false, gtd: false, pay: false }
  },
  {
    id: 'HLCU8234567', origin: 'Xitoy', port: 'Ningbo', carrier: 'CMA-CGM', agent: 'Uz Logistics',
    seal: 'CMA-99221', gtd: '—', date: '04.06.2026', materials: 'Rang-boyoqlar',
    weight: '4,200', status: 'DENGIZDA', type: '20\' Dry',
    landedCost: 12400, risk: 'HIGH',
    docs: { bl: true, inv: true, pl: false, cert: false, gtd: false, pay: false }
  },
  {
    id: 'OOLU1234567', origin: 'Turkiya', port: 'Istanbul', carrier: 'EVERGREEN', agent: 'Bosphorus Cargo',
    seal: 'EV-88211', gtd: 'GTD-2026-04611', date: '25.05.2026', materials: 'Metal qismlari',
    weight: '6,800', status: 'KECHIKDI', type: '40\' Dry',
    landedCost: 28900, risk: 'HIGH',
    docs: { bl: true, inv: false, pl: false, cert: false, gtd: false, pay: false }
  }
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    'DENGIZDA': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'BOJXONADA': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'QABUL QILINDI': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'KECHIKDI': 'bg-red-500/10 text-red-500 border-red-500/20',
    'KUTILMOQDA': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase italic tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const styles: any = {
    'LOW': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'MEDIUM': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'HIGH': 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase italic ${styles[risk]}`}>
      {risk}
    </span>
  );
};

export const ImportManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('Barchasi');
  const [activeTab, setActiveTab] = useState('Barcha');
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = IMPORT_CONTAINERS.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = filterCountry === 'Barchasi' || c.origin === filterCountry;
    const matchesTab = activeTab === 'Barcha' ||
      (activeTab === 'Kutilmoqda' && c.status === 'DENGIZDA') ||
      (activeTab === 'Bojxonada' && c.status === 'BOJXONADA') ||
      (activeTab === 'Qabul qilindi' && c.status === 'QABUL QILINDI') ||
      (activeTab === 'Kechikdi' && c.status === 'KECHIKDI');
    return matchesSearch && matchesCountry && matchesTab;
  });

  const stats = [
    { label: 'Jami Import', value: '23', icon: BarChart3, color: 'text-indigo-400', sub: 'Bu oy' },
    { label: 'Dengizda', value: '8', icon: Ship, color: 'text-blue-400', sub: 'Tranzit' },
    { label: 'Bojxonada', value: '4', icon: ShieldCheck, color: 'text-amber-400', sub: 'Terminal' },
    { label: 'Bu oy xarajat', value: '$124,500', icon: CreditCard, color: 'text-emerald-400', sub: 'Landed Cost' },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">GLOBAL HARIDLAR <span className="text-indigo-500">VA LOGISTIKA NAZORATI</span></h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Import · Eksport · Bojxona · Yetkazib beruvchilar · Landed Cost</p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/30 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between group hover:border-slate-700 transition-all">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</h3>
                <span className="text-[8px] font-bold text-slate-600 uppercase">{stat.sub}</span>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center ${stat.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-6 shrink-0 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            {['Barcha', 'Kutilmoqda', 'Bojxonada', 'Qabul qilindi', 'Kechikdi'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase italic transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSelectedContainer(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase italic shadow-lg shadow-emerald-600/20 transition-all group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Yangi Konteyner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Qidirish..."
              className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 focus:bg-slate-900/50 transition-all placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer">
              <option>Sana oralig'i (Barchasi)</option>
              <option>Oxirgi 7 kun</option>
              <option>Shu oy</option>
              <option>Kutilayotgan (Iyun)</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select
              className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              <option value="Barchasi">Barcha Mamlakatlar</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer">
              <option>Qiymat oralig'i (Barchasi)</option>
              <option>$0 — $10,000</option>
              <option>$10,000 — $50,000</option>
              <option>$50,000+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-[32px] overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-[#020617] text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800/50 z-10">
              <tr>
                <th className="p-6">Konteyner #</th>
                <th className="p-6">Origin / Port</th>
                <th className="p-6">Tashuvchi</th>
                <th className="p-6">Bojxona GTD</th>
                <th className="p-6 text-right">Yuk Miqdori</th>
                <th className="p-6 text-right">Landed Cost</th>
                <th className="p-6 text-center">Risk</th>
                <th className="p-6">Holat</th>
                <th className="p-6 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredData.map((container, i) => (
                <tr
                  key={container.id}
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedContainer(container);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-white font-black font-mono italic text-[13px] tracking-tight">{container.id}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase mt-1">{container.type}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-indigo-500" />
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold text-[12px] uppercase italic">{container.origin}</span>
                        <span className="text-[9px] text-slate-600 uppercase">{container.port}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-slate-400 font-bold text-xs uppercase italic">{container.carrier}</td>
                  <td className="p-6 font-mono text-[11px] text-slate-500 font-black italic">{container.gtd}</td>
                  <td className="p-6 text-right text-white font-mono font-bold italic text-xs">{container.weight} kg</td>
                  <td className="p-6 text-right text-emerald-400 font-mono font-black italic text-xs">${container.landedCost?.toLocaleString()}</td>
                  <td className="p-6 text-center"><RiskBadge risk={container.risk} /></td>
                  <td className="p-6"><StatusBadge status={container.status} /></td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-indigo-600 rounded-lg text-slate-500 hover:text-white transition-all"><Eye size={16} /></button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-all"><FileText size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ContainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        container={selectedContainer}
        onSave={(data) => {
          console.log('Saved:', data);
          setIsModalOpen(false);
        }}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
      `}</style>
    </div>
  );
};
