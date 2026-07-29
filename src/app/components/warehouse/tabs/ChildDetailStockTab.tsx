import { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, ArrowDownCircle, AlertTriangle, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useDetailsStore, StockItem } from '../../../store/detailsStore';

export function ChildDetailStockTab() {
  const { stockItems, loading, fetchStock, receiveStock, fathers, children, fetchFathers, fetchChildren } = useDetailsStore();
  const [search, setSearch] = useState('');
  const [receiveModal, setReceiveModal] = useState<StockItem | null>(null);
  const [receiveQty, setReceiveQty] = useState(0);
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    fetchStock();
    fetchFathers();
    fetchChildren();
  }, []);

  const filtered = stockItems.filter(
    (item) =>
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const okCount = stockItems.filter(i => i.status === 'OK').length;
  const lowCount = stockItems.filter(i => i.status === 'LOW').length;
  const outCount = stockItems.filter(i => i.status === 'OUT').length;

  const handleReceive = async () => {
    if (!receiveModal || receiveQty <= 0) return;
    setReceiving(true);
    await receiveStock(receiveModal.code, receiveQty);
    setReceiving(false);
    toast.success(`${receiveModal.code} — ${receiveQty} ${receiveModal.unit} qabul qilindi`);
    setReceiveModal(null);
    setReceiveQty(0);
  };

  const statusBadge = (s: string) => {
    if (s === 'OK') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (s === 'LOW') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const statusIcon = (s: string) => {
    if (s === 'OK') return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (s === 'LOW') return <AlertTriangle className="w-3.5 h-3.5" />;
    return <XCircle className="w-3.5 h-3.5" />;
  };

  const statusLabel = (s: string) => s === 'OK' ? 'Yetarli' : s === 'LOW' ? 'Kam' : 'Tugagan';

  const getParentName = (code: string) => {
    const child = children.find(c => c.code === code);
    if (!child) return '—';
    const father = fathers.find(f => f.id === child.father_detail_id);
    return father ? `${father.code}` : '—';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Package className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Bola Detallar Zaxirasi</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Child Detail Stock Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kod yoki nom bo'yicha..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium text-sm w-64"
            />
          </div>
          <button onClick={fetchStock} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Yetarli', count: okCount, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/20', icon: CheckCircle2 },
          { label: 'Kam', count: lowCount, color: 'text-amber-400', bg: 'bg-amber-600/10 border-amber-500/20', icon: AlertTriangle },
          { label: 'Tugagan', count: outCount, color: 'text-rose-400', bg: 'bg-rose-600/10 border-rose-500/20', icon: XCircle },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} className={`${bg} border rounded-2xl p-4 flex items-center gap-4`}>
            <Icon className={`w-8 h-8 ${color}`} />
            <div>
              <div className={`text-3xl font-black ${color}`}>{count}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Table */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                {['Kod', 'Nom', 'Ota Detal', 'Zaxirada', 'Birlik', 'Holat', 'Qabul Qilish'].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((item) => (
                <tr key={item.code} className={`transition-colors group ${item.status === 'OUT' ? 'bg-rose-500/5' : item.status === 'LOW' ? 'bg-amber-500/5' : ''} hover:bg-white/5`}>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-[10px] font-black border border-indigo-500/20 tracking-widest">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-sm italic">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-violet-400 uppercase bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                      {getParentName(item.code)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-lg font-mono">
                    <span className={item.status === 'OK' ? 'text-emerald-400' : item.status === 'LOW' ? 'text-amber-400' : 'text-rose-400'}>
                      {item.in_stock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-bold uppercase">{item.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase w-fit ${statusBadge(item.status)}`}>
                      {statusIcon(item.status)}
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { setReceiveModal(item); setReceiveQty(0); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" /> Qabul
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Package className="w-12 h-12" />
                      <p className="text-sm font-bold uppercase italic">Bola detal topilmadi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Receive Modal */}
      <AnimatePresence>
        {receiveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl shadow-emerald-500/10"
            >
              <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-emerald-900/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                    <ArrowDownCircle className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Zaxira Qabul Qilish</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{receiveModal.code}</p>
                  </div>
                </div>
                <button onClick={() => setReceiveModal(null)} className="text-slate-600 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">Joriy Zaxira</div>
                    <div className="text-2xl font-black text-indigo-400">{receiveModal.in_stock.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{receiveModal.unit}</div>
                  </div>
                  <div className="text-slate-600">→</div>
                  <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">Qabul Qilingandan So'ng</div>
                    <div className="text-2xl font-black text-emerald-400">{(receiveModal.in_stock + receiveQty).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{receiveModal.unit}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Qabul Qilinadigan Miqdor ({receiveModal.unit})
                  </label>
                  <input
                    type="number" min={1} value={receiveQty || ''}
                    onChange={(e) => setReceiveQty(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-white font-black text-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-center"
                  />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setReceiveModal(null)}
                    className="flex-1 px-6 py-4 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic">
                    Bekor
                  </button>
                  <button
                    onClick={handleReceive}
                    disabled={receiving || receiveQty <= 0}
                    className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 transition-all uppercase tracking-tight italic"
                  >
                    {receiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                    Qabul Qilish
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
