import { useState, useEffect } from 'react';
import {
  Layers, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Search, X, CheckCircle2, AlertTriangle, Package, Loader2,
  Save, RefreshCw, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useDetailsStore, FatherDetail, ChildDetail } from '../../store/detailsStore';

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────

export default function DetailManagementPage() {
  const [activeTab, setActiveTab] = useState<'fathers' | 'children'>('fathers');

  return (
    <div className="min-h-full bg-slate-950 p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/30">
              <GitBranch className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                Detail <span className="text-violet-400">Boshqaruvi</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm">Ota-bola detallar ierarxiyasi va BOM boshqaruvi</p>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <TabBtn active={activeTab === 'fathers'} onClick={() => setActiveTab('fathers')} icon={Package} label="Ota Detallar" />
          <TabBtn active={activeTab === 'children'} onClick={() => setActiveTab('children')} icon={Layers} label="Bola Detallar" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'fathers' && <FatherDetailsPanel key="fathers" />}
        {activeTab === 'children' && <ChildDetailsPanel key="children" />}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm uppercase italic tracking-tight ${
        active ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Father Details Panel
// ─────────────────────────────────────────────────────────────

function FatherDetailsPanel() {
  const { fathers, children, loading, fetchFathers, fetchChildren, deleteFather } = useDetailsStore();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: FatherDetail } | null>(null);

  useEffect(() => {
    fetchFathers();
    fetchChildren();
  }, []);

  const filtered = fathers.filter(
    (f) =>
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" detalini va uning bolalarini o'chirishni tasdiqlaysizmi?`)) return;
    const ok = await deleteFather(id);
    if (ok) toast.success(`"${name}" o'chirildi`);
    else toast.error("O'chirib bo'lmadi");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kod yoki nom bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-medium"
          />
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-violet-600/20 uppercase tracking-tight italic"
        >
          <Plus className="w-4 h-4" /> Yangi Ota Detal
        </button>
        <button onClick={fetchFathers} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami Ota Detallar', value: fathers.length, color: 'text-violet-400', bg: 'bg-violet-600/10 border-violet-500/20' },
          { label: 'Jami Bola Detallar', value: children.length, color: 'text-indigo-400', bg: 'bg-indigo-600/10 border-indigo-500/20' },
          { label: 'O\'rtacha Bola/Ota', value: fathers.length ? (children.length / fathers.length).toFixed(1) : 0, color: 'text-emerald-400', bg: 'bg-emerald-600/10 border-emerald-500/20' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4 backdrop-blur-sm`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                {['', 'Kod', 'Nom', 'Tavsif', 'Bola Soni', 'Harakatlar'].map((h) => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((f) => {
                const childCount = children.filter((c) => c.father_detail_id === f.id).length;
                const isOpen = expanded === f.id;
                const fChildren = children.filter((c) => c.father_detail_id === f.id);

                return (
                  <>
                    <tr key={f.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setExpanded(isOpen ? null : f.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-violet-400 transition-all"
                        >
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg text-xs font-black tracking-widest border border-violet-500/20 uppercase">
                          {f.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white uppercase italic text-sm">{f.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">{f.description || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-black uppercase ${childCount > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                          <Layers className="w-3.5 h-3.5" /> {childCount} ta
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal({ mode: 'edit', item: f })}
                            className="p-2 text-slate-500 hover:text-violet-400 transition-colors rounded-lg hover:bg-slate-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id, f.name)}
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded child rows */}
                    {isOpen && fChildren.map((child) => (
                      <tr key={child.id} className="bg-violet-500/5 border-l-2 border-violet-500/40">
                        <td className="px-4 py-3" />
                        <td className="px-6 py-3 pl-10">
                          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded text-[10px] font-black tracking-widest border border-indigo-500/20">
                            {child.code}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-300 text-xs font-bold italic">{child.name}</td>
                        <td className="px-6 py-3 text-slate-600 text-xs">{child.description || '—'}</td>
                        <td className="px-6 py-3 text-xs text-indigo-300 font-mono">
                          {child.quantity_per_unit} {child.unit}/dona
                        </td>
                        <td />
                      </tr>
                    ))}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Package className="w-12 h-12" />
                      <p className="text-sm font-bold uppercase italic">Ma'lumot topilmadi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <FatherModal
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal(null)}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Child Details Panel
// ─────────────────────────────────────────────────────────────

function ChildDetailsPanel() {
  const { children, fathers, loading, fetchChildren, fetchFathers, deleteChild } = useDetailsStore();
  const [search, setSearch] = useState('');
  const [filterFather, setFilterFather] = useState('');
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: ChildDetail } | null>(null);

  useEffect(() => {
    fetchChildren();
    fetchFathers();
  }, []);

  const filtered = children.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase());
    const matchFather = filterFather ? c.father_detail_id === filterFather : true;
    return matchSearch && matchFather;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" bola detalini o'chirishni tasdiqlaysizmi?`)) return;
    const ok = await deleteChild(id);
    if (ok) toast.success(`"${name}" o'chirildi`);
    else toast.error("O'chirib bo'lmadi");
  };

  const getFatherName = (id: string) => fathers.find((f) => f.id === id)?.name || '—';
  const getFatherCode = (id: string) => fathers.find((f) => f.id === id)?.code || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kod yoki nom bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
          />
        </div>
        <select
          value={filterFather}
          onChange={(e) => setFilterFather(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">Barcha ota detallar</option>
          {fathers.map((f) => (
            <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
          ))}
        </select>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-tight italic"
        >
          <Plus className="w-4 h-4" /> Yangi Bola Detal
        </button>
        <button onClick={fetchChildren} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                {['Kod', 'Nom', 'Ota Detal', 'Miqdor/Dona', 'Birlik', 'Tavsif', 'Harakatlar'].map((h) => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-[10px] font-black tracking-widest border border-indigo-500/20">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-sm italic">{c.name}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-[10px] font-black text-violet-400 uppercase">{getFatherCode(c.father_detail_id)}</div>
                      <div className="text-[10px] text-slate-500">{getFatherName(c.father_detail_id)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-black text-sm font-mono">{c.quantity_per_unit}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-bold uppercase">{c.unit}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-[180px] truncate">{c.description || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal({ mode: 'edit', item: c })}
                        className="p-2 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 text-slate-500 hover:text-rose-500 rounded-lg hover:bg-slate-800 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <Layers className="w-12 h-12" />
                      <p className="text-sm font-bold uppercase italic">Bola detallar topilmadi</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ChildModal
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal(null)}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Father Modal (Create / Edit)
// ─────────────────────────────────────────────────────────────

function FatherModal({ mode, item, onClose }: { mode: 'create' | 'edit'; item?: FatherDetail; onClose: () => void }) {
  const { createFather, updateFather } = useDetailsStore();
  const [form, setForm] = useState({ code: item?.code || '', name: item?.name || '', description: item?.description || '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let result;
    if (mode === 'create') {
      result = await createFather(form);
    } else {
      result = await updateFather(item!.id, form);
    }
    setSaving(false);
    if (result) {
      toast.success(mode === 'create' ? 'Ota detal qo\'shildi!' : 'Ota detal yangilandi!');
      onClose();
    } else {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl shadow-violet-500/10"
      >
        <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-violet-900/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20">
              {mode === 'create' ? <Plus className="text-white w-6 h-6" /> : <Pencil className="text-white w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {mode === 'create' ? 'Yangi Ota Detal' : 'Tahrirlash'}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Father Detail</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <Field label="Kod" required>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="DOOR-PANEL-FL" className={inputCls} />
          </Field>
          <Field label="Nom" required>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Eshik Paneli (FL)" className={inputCls} />
          </Field>
          <Field label="Tavsif">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Qo'shimcha ma'lumot..." rows={3} className={`${inputCls} resize-none`} />
          </Field>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className={cancelBtn}>Bekor qilish</button>
            <button type="submit" disabled={saving} className={saveBtn}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Saqlash
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Child Modal (Create / Edit)
// ─────────────────────────────────────────────────────────────

function ChildModal({ mode, item, onClose }: { mode: 'create' | 'edit'; item?: ChildDetail; onClose: () => void }) {
  const { fathers, createChild, updateChild } = useDetailsStore();
  const [form, setForm] = useState({
    code: item?.code || '',
    name: item?.name || '',
    description: item?.description || '',
    father_detail_id: item?.father_detail_id || (fathers[0]?.id || ''),
    quantity_per_unit: item?.quantity_per_unit ?? 1,
    unit: item?.unit || 'pcs',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let result;
    if (mode === 'create') {
      result = await createChild({ ...form, quantity_per_unit: Number(form.quantity_per_unit) });
    } else {
      result = await updateChild(item!.id, { ...form, quantity_per_unit: Number(form.quantity_per_unit) });
    }
    setSaving(false);
    if (result) {
      toast.success(mode === 'create' ? 'Bola detal qo\'shildi!' : 'Bola detal yangilandi!');
      onClose();
    } else {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl shadow-indigo-500/10"
      >
        <div className="p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-900/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              {mode === 'create' ? <Plus className="text-white w-6 h-6" /> : <Pencil className="text-white w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                {mode === 'create' ? 'Yangi Bola Detal' : 'Tahrirlash'}
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Child Detail</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <Field label="Ota Detal" required>
            <select required value={form.father_detail_id} onChange={(e) => setForm({ ...form, father_detail_id: e.target.value })} className={inputCls}>
              <option value="">— Tanlang —</option>
              {fathers.map((f) => (
                <option key={f.id} value={f.id}>{f.code} — {f.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kod" required>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="CLIP-ABS-01" className={inputCls} />
            </Field>
            <Field label="Nom" required>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ABS Klips" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Miqdor / 1 dona ota" required>
              <input required type="number" step="0.01" min="0.01" value={form.quantity_per_unit}
                onChange={(e) => setForm({ ...form, quantity_per_unit: parseFloat(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Birlik" required>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputCls}>
                <option value="pcs">dona (pcs)</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="m">m</option>
                <option value="litr">litr</option>
              </select>
            </Field>
          </div>
          <Field label="Tavsif">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Qo'shimcha ma'lumot..." rows={2} className={`${inputCls} resize-none`} />
          </Field>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className={cancelBtn}>Bekor qilish</button>
            <button type="submit" disabled={saving} className={`${saveBtn} bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Saqlash
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-bold text-sm";
const cancelBtn = "flex-1 px-6 py-3.5 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic";
const saveBtn = "flex-[2] flex items-center justify-center gap-2 px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 transition-all uppercase tracking-tight italic";
