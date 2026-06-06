import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Eye, Edit2, FileText, 
  X, Copy, CheckCircle2, AlertCircle, MapPin, 
  Printer, ArrowUpRight, DollarSign, Package,
  Truck, ArrowRight, Info, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Mock Data ---
const DESTINATIONS = ['Almaty, KZ', 'Shymkent, KZ', 'Nur-Sultan, KZ', 'Aktau, KZ'];

const EXPORT_CONTAINERS = [
  { 
    id: 'MSCU1234567', destination: 'Almaty, KZ', company: 'KazAutoTrim LLP', address: 'Almaty, str. Abay 45', carrier: 'MAERSK', agent: 'Agent KZ Pro',
    gtd: 'EX-2026-00122', date: '01.06.2026', products: 'Door Trim L/R, Dashboard Cover', 
    count: '4,200 pcs', status: 'JO\'NATILDI', type: '40\' HC', value: '$45,800',
    docs: { contract: true, inv: true, cert: true, ex1: true, cmr: true, qabul: true }
  },
  { 
    id: 'TCKU9876543', destination: 'Shymkent, KZ', company: 'Central Auto Parts', address: 'Shymkent, Ind. Zone 12', carrier: 'MSC', agent: 'Logist KZ',
    gtd: 'EX-2026-00145', date: '03.06.2026', products: 'A/B-Pillar Trim Set', 
    count: '2,800 pcs', status: 'YUKLANDI', type: '20\' Dry', value: '$22,400',
    docs: { contract: true, inv: true, cert: true, ex1: true, cmr: true, qabul: false }
  },
  { 
    id: 'GESU1122334', destination: 'Almaty, KZ', company: 'KazAutoTrim LLP', address: 'Almaty, str. Abay 45', carrier: 'HAPAG', agent: 'Agent KZ Pro',
    gtd: '—', date: '05.06.2026', products: 'Glove Box, Console', 
    count: '1,600 pcs', status: 'TAYYORLANMOQDA', type: '40\' HC', value: '$18,900',
    docs: { contract: true, inv: true, cert: false, ex1: false, cmr: false, qabul: false }
  },
  { 
    id: 'KMTU4455667', destination: 'Nur-Sultan, KZ', company: 'Astana Parts', address: 'Astana, 5th Avenue', carrier: 'CMA-CGM', agent: 'Capital Trans',
    gtd: 'EX-2026-00110', date: '02.06.2026', products: 'Plastic Bumpers', 
    count: '3,100 pcs', status: 'YUKLANDI', type: '40\' Dry', value: '$35,200',
    docs: { contract: true, inv: true, cert: true, ex1: true, cmr: true, qabul: false }
  }
];

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    'TAYYORLANMOQDA': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    'YUKLANDI': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'BOJXONADA': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'JO\'NATILDI': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase italic tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

const CMRModal = ({ isOpen, onClose, container }: any) => {
  if (!container) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-6 text-black">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
               <div>
                  <h2 className="text-xl font-black text-white italic uppercase">CMR / Yuk Xati — Oldindan Ko'rish</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Print-ready document generation</p>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
               </button>
            </div>

            {/* Document Preview Area */}
            <div className="flex-1 overflow-y-auto p-12 bg-slate-800/30 flex justify-center custom-scrollbar">
               <div id="printable-cmr" className="w-[210mm] min-h-[297mm] bg-white text-black p-[15mm] shadow-2xl rounded-sm font-serif">
                  <div className="border-[0.5mm] border-black p-4 space-y-8">
                     <div className="text-center border-b-[0.5mm] border-black pb-4">
                        <h1 className="text-2xl font-bold uppercase tracking-widest">CMR INTERNATIONAL CONSIGNMENT NOTE</h1>
                        <p className="text-[10px] italic mt-1">This transport is subject to the Convention on the Contract for the International Carriage of Goods by Road (CMR)</p>
                     </div>

                     <div className="grid grid-cols-2 border-b-[0.5mm] border-black">
                        <div className="border-r-[0.5mm] border-black p-4 space-y-1">
                           <p className="text-[8px] font-bold uppercase">1. Sender (Jo'natuvchi)</p>
                           <p className="text-sm font-bold italic uppercase">VGM HUB MANUFACTURING UZ</p>
                           <p className="text-xs">Industiral Park, Tashkent, Uzbekistan</p>
                           <p className="text-xs">TIN: 301294821</p>
                        </div>
                        <div className="p-4 space-y-1">
                           <p className="text-[8px] font-bold uppercase">2. Consignee (Qabul qiluvchi)</p>
                           <p className="text-sm font-bold uppercase">{container.company}</p>
                           <p className="text-xs">{container.address}</p>
                           <p className="text-xs">{container.destination}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 border-b-[0.5mm] border-black">
                        <div className="border-r-[0.5mm] border-black p-4 space-y-1">
                           <p className="text-[8px] font-bold uppercase">3. Place of delivery (Yetkazish manzili)</p>
                           <p className="text-sm font-bold uppercase">{container.destination}</p>
                           <p className="text-xs italic uppercase">Republic of Kazakhstan</p>
                        </div>
                        <div className="p-4 space-y-1">
                           <p className="text-[8px] font-bold uppercase">4. Place and date of taking over goods</p>
                           <p className="text-sm font-bold uppercase">Tashkent, UZ</p>
                           <p className="text-xs">Date: {container.date}</p>
                        </div>
                     </div>

                     <div className="p-4 space-y-4 min-h-[300px]">
                        <p className="text-[8px] font-bold uppercase">5. Description of goods</p>
                        <table className="w-full text-sm border-collapse">
                           <thead className="bg-gray-100 uppercase text-[10px]">
                              <tr>
                                 <th className="border border-black p-1 text-left">Description / Mahsulot tavsifi</th>
                                 <th className="border border-black p-1 text-center">Unit</th>
                                 <th className="border border-black p-1 text-right">Quantity</th>
                              </tr>
                           </thead>
                           <tbody className="font-bold">
                              <tr>
                                 <td className="border border-black p-2">{container.products}</td>
                                 <td className="border border-black p-2 text-center">PCS</td>
                                 <td className="border border-black p-2 text-right">{container.count}</td>
                              </tr>
                              {[1,2,3,4,5].map(i => (
                                <tr key={i}><td className="border border-black p-3" /><td className="border border-black p-3" /><td className="border border-black p-3" /></tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     <div className="grid grid-cols-3 border-t-[0.5mm] border-black text-[9px]">
                        <div className="border-r-[0.5mm] border-black p-4 space-y-2">
                           <p className="font-bold uppercase">6. Container No.</p>
                           <p className="text-lg font-bold font-mono">{container.id}</p>
                        </div>
                        <div className="border-r-[0.5mm] border-black p-4 space-y-2">
                           <p className="font-bold uppercase">7. Seal No.</p>
                           <p className="text-lg font-bold font-mono">SL-2026-9921</p>
                        </div>
                        <div className="p-4 space-y-2">
                           <p className="font-bold uppercase text-right">8. Gross Weight</p>
                           <p className="text-lg font-bold italic text-right">18,500 KG</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 border-t-[0.5mm] border-black h-32">
                        <div className="border-r-[0.5mm] border-black p-2 flex flex-col justify-between">
                           <p className="text-[7px] uppercase font-bold text-center">9. Signature and stamp of sender</p>
                           <div className="border border-dashed border-gray-300 flex-1 m-2" />
                        </div>
                        <div className="border-r-[0.5mm] border-black p-2 flex flex-col justify-between">
                           <p className="text-[7px] uppercase font-bold text-center">10. Signature and stamp of carrier</p>
                           <div className="border border-dashed border-gray-300 flex-1 m-2" />
                        </div>
                        <div className="p-2 flex flex-col justify-between">
                           <p className="text-[7px] uppercase font-bold text-center">11. Date and signature of consignee</p>
                           <div className="border border-dashed border-gray-300 flex-1 m-2" />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-950 border-t border-slate-800 flex gap-4 shrink-0 justify-end">
               <button onClick={onClose} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase italic transition-all">Yopish</button>
               <button 
                onClick={() => window.print()}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase italic transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
               >
                  <Printer size={18} /> Chop etish
               </button>
            </div>

            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #printable-cmr, #printable-cmr * { visibility: visible !important; }
                #printable-cmr { 
                  position: fixed !important; 
                  left: 0 !important; 
                  top: 0 !important; 
                  width: 210mm !important;
                  height: 297mm !important;
                  margin: 0 !important;
                  padding: 15mm !important;
                  box-shadow: none !important; 
                  border: none !important; 
                  z-index: 9999 !important;
                }
              }
            `}</style>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const ExportManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterDest, setFilterDest] = useState('Barchasi');
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCMRModalOpen, setIsCMRModalOpen] = useState(false);

  const filteredData = EXPORT_CONTAINERS.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase()) || 
                         c.company.toLowerCase().includes(search.toLowerCase());
    const matchesDest = filterDest === 'Barchasi' || c.destination === filterDest;
    return matchesSearch && matchesDest;
  });

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col gap-2 shrink-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] italic ml-1">KZ · Almaty / Shymkent ombor yetkazma</p>
       </div>

      {/* Header & Tabs */}
      <div className="flex flex-col gap-6 shrink-0">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Eksport Registry</h2>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Yuklandi: 2</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Jo'natildi: 1</span>
                 </div>
              </div>
           </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase italic shadow-lg shadow-indigo-600/20 transition-all group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Yangi Jo'natma
          </button>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Konteyner yoki mijoz bo'yicha qidirish..."
              className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:bg-slate-900/50 transition-all placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select
              className="w-full bg-slate-900/30 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              value={filterDest}
              onChange={(e) => setFilterDest(e.target.value)}
            >
              <option value="Barchasi">Barcha Shaharlar</option>
              {DESTINATIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-[32px] overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-[#020617] text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-800/50 z-10">
              <tr>
                <th className="p-6">Konteyner #</th>
                <th className="p-6">Tayinlash joyi</th>
                <th className="p-6">Xaridor</th>
                <th className="p-6">Jo'natish sanasi</th>
                <th className="p-6">Mahsulotlar</th>
                <th className="p-6 text-right">Invoice Qiymati</th>
                <th className="p-6">Holat</th>
                <th className="p-6 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {filteredData.map((container) => (
                <tr 
                  key={container.id} 
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => setSelectedContainer(container)}
                >
                  <td className="p-6">
                    <span className="text-white font-black font-mono italic text-[13px] tracking-tight">{container.id}</span>
                  </td>
                  <td className="p-6 text-slate-300 font-bold text-[12px] uppercase italic">{container.destination}</td>
                  <td className="p-6 text-slate-400 font-bold text-xs uppercase">{container.company}</td>
                  <td className="p-6 text-white font-mono font-bold italic text-xs">{container.date}</td>
                  <td className="p-6 text-slate-500 font-bold text-[11px] italic shrink-0">
                    <div className="flex flex-col">
                       <span>{container.products}</span>
                       <span className="text-indigo-500/80 mt-1 uppercase text-[9px] font-black">{container.count}</span>
                    </div>
                  </td>
                  <td className="p-6 text-right font-mono text-xs font-black text-emerald-400 italic">{container.value}</td>
                  <td className="p-6"><StatusBadge status={container.status} /></td>
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-indigo-600 rounded-lg text-slate-500 hover:text-white transition-all"><Eye size={16} /></button>
                      <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-all"><Printer size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedContainer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedContainer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-slate-950 border-l border-slate-800 z-[120] shadow-2xl flex flex-col"
            >
              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-black text-white font-mono italic tracking-tighter leading-none">{selectedContainer.id}</h2>
                    <StatusBadge status={selectedContainer.status} />
                  </div>
                  <button onClick={() => setSelectedContainer(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                {/* Section: Asosiy */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic border-b border-white/5 pb-2">Eksport Ma'lumotlari</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-[11px]">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-500 uppercase tracking-tighter">Xaridor:</p>
                      <p className="font-black text-white italic">{selectedContainer.company}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-500 uppercase tracking-tighter">Manzil:</p>
                      <p className="font-black text-white italic">{selectedContainer.destination}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-500 uppercase tracking-tighter">Tashuvchi:</p>
                      <p className="font-black text-white italic">{selectedContainer.carrier}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-500 uppercase tracking-tighter">Tip:</p>
                      <p className="font-black text-white font-mono italic">{selectedContainer.type}</p>
                    </div>
                  </div>
                </section>

                {/* Section: Bojxona */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic border-b border-emerald-500/10 pb-2">Bojxona (Eksport)</h3>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-500 uppercase">EKSPORT GTD</p>
                          <p className="text-xs font-black text-white font-mono italic tracking-tight">{selectedContainer.gtd}</p>
                        </div>
                        <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"><Copy size={14} /></button>
                     </div>
                     <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-bold text-slate-500 uppercase italic">HS-Code:</span>
                           <span className="text-[10px] font-black text-white italic">3926.30 — Plastmasa</span>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-bold text-slate-500 uppercase italic">Bojxona Posti:</span>
                           <span className="text-[10px] font-black text-white italic">O'zbekiston Exit</span>
                        </div>
                     </div>
                  </div>
                </section>

                {/* Section: Yuk Tarkibi */}
                <section className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Yuk Tarkibi FCA/FOB</h3>
                      <button className="text-[9px] font-black text-indigo-400 uppercase italic"><Info size={12} /></button>
                   </div>
                   <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead className="bg-[#020617] text-slate-500 border-b border-slate-800/50 uppercase font-black tracking-tighter">
                          <tr>
                            <th className="p-3">Mahsulot</th>
                            <th className="p-3 text-right">Miqdor</th>
                            <th className="p-3 text-right">Narxi (USD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30 text-white font-bold italic">
                          <tr><td className="p-3">Door Trim L/R</td><td className="p-3 text-right">2,200</td><td className="p-3 text-right font-mono">$12.50</td></tr>
                          <tr><td className="p-3">Dash Cover</td><td className="p-3 text-right">2,000</td><td className="p-3 text-right font-mono">$18.25</td></tr>
                        </tbody>
                        <tfoot className="bg-slate-950/50">
                          <tr>
                            <td className="p-3 uppercase font-black text-slate-500">Jami</td>
                            <td className="p-3 text-right font-black">4,200</td>
                            <td className="p-3 text-right font-black text-emerald-400 italic">45,800.00</td>
                          </tr>
                        </tfoot>
                      </table>
                   </div>
                   <button 
                    onClick={() => setIsCMRModalOpen(true)}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase italic text-[11px] border border-slate-700 transition-all flex items-center justify-center gap-2"
                   >
                      <Printer size={16} /> Yuk xatini chop etish
                   </button>
                </section>

                {/* Section: Hujjatlar */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic border-b border-white/5 pb-2">Eksport Hujjatlari</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'contract', label: 'Eksport Kontrakt' },
                      { key: 'inv', label: 'Invoice + Packing list' },
                      { key: 'cert', label: 'Kelib chiqish sertifikati (СТ-1)' },
                      { key: 'ex1', label: 'EX-1 Bojxona Ruxsatnomasi' },
                      { key: 'cmr', label: 'CMR (Yo\'l yuki xati)' },
                      { key: 'qabul', label: 'KZ Bojxona qabul tasdiqi' },
                    ].map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-800/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic tracking-tighter">{doc.label}</span>
                        {selectedContainer.docs[doc.key] ? 
                          <CheckCircle2 size={16} className="text-emerald-500" /> : 
                          <Clock size={16} className="text-slate-700" />
                        }
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: Timeline */}
                <section className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic border-b border-white/5 pb-2">Jo'natma Holati</h3>
                  <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800/50">
                    <div className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <p className="text-[11px] font-black text-white italic uppercase tracking-tighter">Yuklash yakunlandi</p>
                      <p className="text-[9px] font-bold text-slate-600 uppercase">01.06.2026</p>
                    </div>
                    <div className="relative">
                      <div className={`absolute -left-[19px] top-1.5 w-4 h-4 rounded-full flex items-center justify-center ${selectedContainer.status === 'YUKLANDI' ? 'bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-emerald-500'}`}>
                         <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <p className="text-[11px] font-black text-white italic uppercase tracking-tighter">Korxona chiqish bojxonasi</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <p className="text-[11px] font-black text-slate-600 italic uppercase tracking-tighter">KZ Bojxona (Kutilmoqda)</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-4 shrink-0">
                 <button className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase italic transition-all">Tahrirlash</button>
                 <button onClick={() => setSelectedContainer(null)} className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl text-[10px] font-black uppercase italic transition-all">Yopish</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CMRModal 
        isOpen={isCMRModalOpen}
        onClose={() => setIsCMRModalOpen(false)}
        container={selectedContainer}
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
