import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitBranch, ChevronRight, Package, Layers, Plus, Pencil, Trash2,
  Search, RefreshCw, Loader2, X, Save, ChevronUp, ChevronDown,
  ChevronsUpDown, AlertTriangle, FileSpreadsheet, Upload, QrCode, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useDetailsStore, ChildDetail } from '../../../store/detailsStore';
import { UITooltip } from '../../../components/common/UITooltip';
import { BulkDetailImportModal } from '../../../components/details/BulkDetailImportModal';
import { BarcodeScannerModal } from '../../../components/mobile/BarcodeScannerModal';

type SortField = 'code' | 'name' | 'description' | 'quantity_per_unit' | 'unit';
type SortDir = 'asc' | 'desc';

// ─────────────────────────────────────────────────────────────
// Father's Children Page
// ─────────────────────────────────────────────────────────────

export default function FatherChildrenPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    fathers, children, loading,
    fetchFathers, fetchChildren,
    createChild, deleteChild,
  } = useDetailsStore();

  const father = fathers.find(f => f.id === id);
  const fatherChildren = useMemo(
    () => children.filter(c => c.father_detail_id === id),
    [children, id]
  );

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [modal, setModal] = useState<{ mode: 'create' } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  useEffect(() => {
    if (!fathers.length) fetchFathers();
    if (!children.length) fetchChildren();
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let rows = fatherChildren.filter(c =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    );
    return [...rows].sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      if (sortField === 'code') { va = a.code; vb = b.code; }
      else if (sortField === 'name') { va = a.name; vb = b.name; }
      else if (sortField === 'description') { va = a.description || ''; vb = b.description || ''; }
      else if (sortField === 'quantity_per_unit') { va = a.quantity_per_unit; vb = b.quantity_per_unit; }
      else if (sortField === 'unit') { va = a.unit; vb = b.unit; }
      if (typeof va === 'number') return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
      return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    });
  }, [fatherChildren, search, sortField, sortDir]);

  const handleExportExcel = () => {
    if (!filtered.length) {
      toast.error("Ekspor qilish uchun ma'lumot topilmadi");
      return;
    }
    const exportData = filtered.map(c => ({
      'Ota Kodu': father?.code || '',
      'Ota Nomi': father?.name || '',
      'Bola Kodu': c.code,
      'Bola Nomi': c.name,
      'Tavsif': c.description || '',
      'Miqdor (1 dona ota uchun)': c.quantity_per_unit,
      'Birlik': c.unit
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bola_Detallar');
    XLSX.writeFile(workbook, `bola_detallar_${father?.code || 'barchasi'}.xlsx`);
    toast.success("Excel fayl yuklab olindi!");
  };

  return (
    <div className="min-h-full bg-slate-950 p-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <button onClick={() => navigate('/admin/details')} className="hover:text-violet-400 transition-colors flex items-center gap-1">
          <GitBranch className="w-3.5 h-3.5" /> Detallar
        </button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate('/admin/details')} className="hover:text-violet-400 transition-colors flex items-center gap-1">
          <Package className="w-3.5 h-3.5" /> Ota Detallar
        </button>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => navigate(`/admin/details/fathers/${id}`)}
          className="hover:text-violet-400 transition-colors uppercase"
        >
          {father?.code || '...'}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-indigo-300 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Bola Detallar</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Layers className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Bola Detallar
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              {father ? (
                <>Ota detal: <span className="text-violet-300 font-bold">{father.code}</span> — {father.name}</>
              ) : 'Yuklanmoqda...'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 font-black text-lg">{fatherChildren.length}</span>
            <span className="text-slate-500 text-xs font-bold uppercase">ta bola</span>
          </div>

          <UITooltip content="Shtrix-kod / QR Skanerni ochish">
            <button
              onClick={() => setShowScannerModal(true)}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 font-bold text-xs"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
            </button>
          </UITooltip>

          <UITooltip content="Excel fayldan ommaviy import qilish">
            <button
              onClick={() => setShowImportModal(true)}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-emerald-400 hover:bg-emerald-950/40 transition-all flex items-center gap-2 font-bold text-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </UITooltip>

          <UITooltip content="Ro'yxatni Excel faylga eksport qilish">
            <button
              onClick={handleExportExcel}
              className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-amber-400 hover:bg-amber-950/40 transition-all flex items-center gap-2 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Eksport</span>
            </button>
          </UITooltip>

          <button
            onClick={() => setModal({ mode: 'create' })}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-600/25 uppercase tracking-tight italic text-sm"
          >
            <Plus className="w-4 h-4" /> Yangi Bola Detal
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kod yoki nom bo'yicha qidirish..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-11 pr-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={fetchChildren} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all" title="Yangilash">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <SortTh label="Kod" field="code" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Nom" field="name" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Tavsif" field="description" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Miqdor/Dona" field="quantity_per_unit" current={sortField} dir={sortDir} onSort={toggleSort} />
                <SortTh label="Birlik" field="unit" current={sortField} dir={sortDir} onSort={toggleSort} />
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Harakatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(c => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/admin/details/children/${c.id}`)}
                      className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-[10px] font-black tracking-widest border border-indigo-500/20 uppercase hover:bg-indigo-500/20 hover:text-indigo-200 transition-all"
                    >
                      {c.code}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-bold text-white text-sm italic">{c.name}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">{c.description || '—'}</td>
                  <td className="px-6 py-4 text-emerald-400 font-black text-sm font-mono">{c.quantity_per_unit}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-bold uppercase">{c.unit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/details/children/${c.id}`)}
                        className="p-2 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-800"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-800"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
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

      <AnimatePresence>
        {modal && (
          <CreateChildModal
            fatherId={id!}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <BulkDetailImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => fetchChildren()}
      />

      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />
    </div>
  );
}

// ── Sort Header ──────────────────────────────────────────────

function SortTh({ label, field, current, dir, onSort }: {
  label: string; field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void;
}) {
  const active = current === field;
  return (
    <th
      className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic cursor-pointer select-none hover:text-slate-300 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {active
          ? dir === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />
        }
      </div>
    </th>
  );
}

// ── Create Child Modal ───────────────────────────────────────

function CreateChildModal({ fatherId, onClose }: { fatherId: string; onClose: () => void }) {
  const { fathers, createChild } = useDetailsStore();
  const [form, setForm] = useState({
    code: '', name: '', description: '',
    father_detail_id: fatherId,
    quantity_per_unit: 1,
    unit: 'pcs',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createChild({ ...form, quantity_per_unit: Number(form.quantity_per_unit) });
    setSaving(false);
    if (result) {
      toast.success("Bola detal qo'shildi!");
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
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl shadow-indigo-500/10"
      >
        <div className="p-7 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-900/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Plus className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Yangi Bola Detal</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Child Detail</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kod" required>
              <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="CLIP-ABS-01" className={inputCls} />
            </Field>
            <Field label="Nom" required>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="ABS Klips" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Miqdor / 1 dona ota" required>
              <input required type="number" step="0.01" min="0.01" value={form.quantity_per_unit}
                onChange={e => setForm({ ...form, quantity_per_unit: parseFloat(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Birlik" required>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls}>
                <option value="pcs">dona (pcs)</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="m">m</option>
                <option value="litr">litr</option>
              </select>
            </Field>
          </div>
          <Field label="Tavsif">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Qo'shimcha ma'lumot..." rows={2} className={`${inputCls} resize-none`} />
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className={cancelBtn}>Bekor qilish</button>
            <button type="submit" disabled={saving} className={`${saveBtn} bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Saqlash
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

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

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-sm";
const cancelBtn = "flex-1 px-5 py-3 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic text-sm";
const saveBtn = "flex-[2] flex items-center justify-center gap-2 px-5 py-3 text-white font-bold rounded-2xl shadow-lg transition-all uppercase tracking-tight italic text-sm";
