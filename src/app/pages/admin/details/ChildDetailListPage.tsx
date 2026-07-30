import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, Layers, Package, Plus, Pencil, Trash2, Search, RefreshCw,
  Loader2, X, Save, ChevronUp, ChevronDown, ChevronsUpDown, Download,
  SlidersHorizontal, CheckSquare, Square, Edit3, Tag, Building2, AlertCircle,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useDetailsStore, ChildDetail } from '../../../store/detailsStore';

type SortField = 'code' | 'name' | 'category' | 'supplier' | 'father' | 'stock_level' | 'quantity_per_unit' | 'unit';
type SortDir = 'asc' | 'desc';

interface ColumnConfig {
  code: boolean;
  name: boolean;
  category: boolean;
  supplier: boolean;
  father: boolean;
  stock: boolean;
  qty: boolean;
  actions: boolean;
}

export default function ChildDetailListPage() {
  const navigate = useNavigate();
  const {
    fathers, children, loading,
    fetchFathers, fetchChildren,
    deleteChild, bulkUpdateChildren, bulkDeleteChildren,
    createChild,
  } = useDetailsStore();

  // Multi-criteria filtering
  const [search, setSearch] = useState('');
  const [filterFather, setFilterFather] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState(''); // 'all' | 'ok' | 'low' | 'out'

  // Sorting
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkEditModal, setBulkEditModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ category: '', supplier: '', status: '' });

  // Column Customization
  const [showColMenu, setShowColMenu] = useState(false);
  const [cols, setCols] = useState<ColumnConfig>({
    code: true,
    name: true,
    category: true,
    supplier: true,
    father: true,
    stock: true,
    qty: true,
    actions: true,
  });

  const [modal, setModal] = useState(false);

  useEffect(() => {
    fetchFathers();
    fetchChildren();
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const getFather = (id: string) => fathers.find(f => f.id === id);

  const categories = useMemo(() => Array.from(new Set(children.map(c => c.category).filter(Boolean))), [children]);
  const suppliers = useMemo(() => Array.from(new Set(children.map(c => c.supplier).filter(Boolean))), [children]);

  // Stock status helper
  const getStockStatus = (stock?: number) => {
    const qty = stock ?? 0;
    if (qty > 50) return { label: 'Zaxirada', type: 'ok', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 };
    if (qty > 0) return { label: 'Kam Zaxira', type: 'low', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle };
    return { label: 'Tugagan', type: 'out', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertCircle };
  };

  // Filtered & sorted
  const filtered = useMemo(() => {
    let rows = children.filter(c => {
      const f = getFather(c.father_detail_id);
      const matchSearch =
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (f?.code || '').toLowerCase().includes(search.toLowerCase());

      const matchFather = filterFather ? c.father_detail_id === filterFather : true;
      const matchCategory = filterCategory ? c.category === filterCategory : true;
      const matchSupplier = filterSupplier ? c.supplier === filterSupplier : true;

      const status = getStockStatus(c.stock_level).type;
      const matchStock = filterStockStatus ? status === filterStockStatus : true;

      return matchSearch && matchFather && matchCategory && matchSupplier && matchStock;
    });

    return [...rows].sort((a, b) => {
      let va: string | number = '', vb: string | number = '';
      if (sortField === 'code') { va = a.code; vb = b.code; }
      else if (sortField === 'name') { va = a.name; vb = b.name; }
      else if (sortField === 'category') { va = a.category || ''; vb = b.category || ''; }
      else if (sortField === 'supplier') { va = a.supplier || ''; vb = b.supplier || ''; }
      else if (sortField === 'father') {
        va = getFather(a.father_detail_id)?.code || '';
        vb = getFather(b.father_detail_id)?.code || '';
      }
      else if (sortField === 'stock_level') { va = a.stock_level ?? 0; vb = b.stock_level ?? 0; }
      else if (sortField === 'quantity_per_unit') { va = a.quantity_per_unit; vb = b.quantity_per_unit; }
      else if (sortField === 'unit') { va = a.unit; vb = b.unit; }

      if (typeof va === 'number') return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
      return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    });
  }, [children, search, filterFather, filterCategory, filterSupplier, filterStockStatus, sortField, sortDir, fathers]);

  // Checkboxes helper
  const allSelected = filtered.length > 0 && filtered.every(r => selectedIds.includes(r.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };
  const toggleSelect = (id: string) => {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.length} ta bola detalni o'chirishni tasdiqlaysizmi?`)) return;
    await bulkDeleteChildren(selectedIds);
    toast.success(`${selectedIds.length} ta bola detal o'chirildi`);
    setSelectedIds([]);
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await bulkUpdateChildren(selectedIds, bulkForm);
    toast.success(`${selectedIds.length} ta bola detal yangilandi`);
    setBulkEditModal(false);
    setSelectedIds([]);
  };

  // Export to CSV
  const exportToCSV = () => {
    const exportData = (selectedIds.length > 0 ? children.filter(c => selectedIds.includes(c.id)) : filtered);
    const headers = ['ID', 'Kod', 'Nom', 'Ota Detal Kodi', 'Kategoriya', 'Yetkazib Beruvchi', 'Miqdor/Dona', 'Birlik', 'Zaxira Miqdori', 'Status'];
    const csvRows = [headers.join(',')];

    exportData.forEach(c => {
      const f = getFather(c.father_detail_id);
      const row = [
        c.id,
        `"${c.code}"`,
        `"${c.name}"`,
        `"${f?.code || ''}"`,
        `"${c.category || ''}"`,
        `"${c.supplier || ''}"`,
        c.quantity_per_unit,
        `"${c.unit}"`,
        c.stock_level ?? 0,
        `"${c.status || 'Faol'}"`,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bola_detallar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV fayl yuklab olindi!');
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" bola detalini o'chirishni tasdiqlaysizmi?`)) return;
    const ok = await deleteChild(id);
    if (ok) toast.success(`"${name}" o'chirildi`);
    else toast.error("O'chirib bo'lmadi");
  };

  return (
    <div className="min-h-full bg-slate-950 p-8 space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
            <Layers className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              Bola <span className="text-indigo-400">Detallar</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium">Barcha bola detallar va sub-komponentlar ro'yxati</p>
          </div>
        </div>

        {/* Nav pills */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-xl gap-1">
          <NavPill label="Ota Detallar" icon={Package} onClick={() => navigate('/admin/details')} />
          <NavPill active label="Bola Detallar" icon={Layers} onClick={() => {}} />
        </div>
      </div>

      {/* Quick Stock Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Zaxira Holati:</span>
        {[
          { id: '', label: 'Barchasi', color: 'bg-slate-900 text-slate-400 border-slate-800' },
          { id: 'ok', label: '🟢 Zaxirada (>50)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
          { id: 'low', label: '🟡 Kam Zaxira (1-50)', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
          { id: 'out', label: '🔴 Tugagan (0)', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setFilterStockStatus(p.id)}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
              filterStockStatus === p.id
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : `${p.color} hover:text-white`
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kod, nom, tavsif, ota kodi bo'yicha..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pl-11 pr-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Father Filter */}
        <select
          value={filterFather}
          onChange={e => setFilterFather(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[170px]"
        >
          <option value="">Barcha Ota Detallar</option>
          {fathers.map(f => <option key={f.id} value={f.id}>{f.code} — {f.name}</option>)}
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[150px]"
        >
          <option value="">Barcha Kategoriyalar</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Supplier Filter */}
        <select
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-w-[160px]"
        >
          <option value="">Barcha Yetkazib Beruvchilar</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Column Config Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowColMenu(v => !v)}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Ustunlar moslashuvi"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Ustunlar</span>
          </button>

          {showColMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-30 p-3 space-y-2">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 border-b border-slate-800 pb-1">
                Ko'rinadigan ustunlar
              </div>
              {Object.keys(cols).map(k => (
                <label key={k} className="flex items-center gap-2 text-xs font-bold text-slate-300 capitalize cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={(cols as any)[k]}
                    onChange={e => setCols({ ...cols, [k]: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  {k === 'stock' ? 'Zaxira Holati' : k === 'qty' ? 'Miqdor/Dona' : k}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* CSV Export */}
        <button
          onClick={exportToCSV}
          className="p-2.5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all"
          title="CSV Fayl sifatida eksport qilish"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV Eksport</span>
        </button>

        {/* Create button */}
        <button
          onClick={() => setModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-600/25 uppercase tracking-tight italic text-xs ml-auto"
        >
          <Plus className="w-4 h-4" /> Yangi Bola Detal
        </button>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-indigo-500/40 rounded-2xl px-6 py-3 shadow-2xl shadow-indigo-600/30 backdrop-blur-xl z-40 flex items-center gap-4 text-xs font-bold"
          >
            <div className="flex items-center gap-2 text-indigo-300 font-black">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>{selectedIds.length} ta tanlandi</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <button
              onClick={() => setBulkEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl hover:bg-indigo-600/30 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" /> Ommaviy Tahrirlash
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 rounded-xl hover:bg-emerald-600/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Tanlanganlarni Eksport qilish
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 border border-rose-500/30 text-rose-300 rounded-xl hover:bg-rose-600/30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> O'chirish
            </button>
            <button onClick={() => setSelectedIds([])} className="text-slate-500 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                <th className="px-4 py-5 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-white">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                {cols.code && <SortTh label="Kod" field="code" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.name && <SortTh label="Nom" field="name" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.father && <SortTh label="Ota Detal Kodi" field="father" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.category && <SortTh label="Kategoriya" field="category" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.supplier && <SortTh label="Yetkazib Beruvchi" field="supplier" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.stock && <SortTh label="Zaxira Holati" field="stock_level" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.qty && <SortTh label="Miqdor/Dona" field="quantity_per_unit" current={sortField} dir={sortDir} onSort={toggleSort} />}
                {cols.actions && <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Harakatlar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(c => {
                const f = getFather(c.father_detail_id);
                const isSelected = selectedIds.includes(c.id);
                const stockInfo = getStockStatus(c.stock_level);
                const IconComponent = stockInfo.icon;

                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-slate-800/30 transition-colors group ${isSelected ? 'bg-indigo-900/10' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <button onClick={() => toggleSelect(c.id)} className="text-slate-500 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>

                    {cols.code && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/admin/details/children/${c.id}`)}
                          className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-[10px] font-black tracking-widest border border-indigo-500/20 uppercase hover:bg-indigo-500/20 hover:text-indigo-200 transition-all cursor-pointer"
                        >
                          {c.code}
                        </button>
                      </td>
                    )}

                    {cols.name && <td className="px-6 py-4 font-bold text-white text-sm italic">{c.name}</td>}

                    {cols.father && (
                      <td className="px-6 py-4">
                        {f ? (
                          <button
                            onClick={() => navigate(`/admin/details/fathers/${f.id}`)}
                            className="px-2.5 py-1 bg-violet-500/10 text-violet-300 rounded text-[10px] font-black tracking-widest border border-violet-500/20 uppercase hover:bg-violet-500/20 transition-all"
                          >
                            {f.code}
                          </button>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                    )}

                    {cols.category && (
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <Tag className="w-3 h-3 text-cyan-400" /> {c.category || '—'}
                        </span>
                      </td>
                    )}

                    {cols.supplier && (
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <Building2 className="w-3 h-3 text-indigo-400" /> {c.supplier || '—'}
                        </span>
                      </td>
                    )}

                    {cols.stock && (
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${stockInfo.badge}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{c.stock_level ?? 0} {c.unit}</span>
                        </span>
                      </td>
                    )}

                    {cols.qty && (
                      <td className="px-6 py-4 text-emerald-400 font-black text-sm font-mono">
                        {c.quantity_per_unit} <span className="text-xs text-slate-500 font-normal">{c.unit}</span>
                      </td>
                    )}

                    {cols.actions && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/details/children/${c.id}`)}
                            title="Tahrirlash"
                            className="p-2 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            title="O'chirish"
                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
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

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {bulkEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-black text-white text-lg uppercase italic flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" /> Ommaviy Tahrirlash ({selectedIds.length})
                </h3>
                <button onClick={() => setBulkEditModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleBulkEditSubmit} className="p-6 space-y-4">
                <Field label="Yangi Kategoriya">
                  <input value={bulkForm.category} onChange={e => setBulkForm({ ...bulkForm, category: e.target.value })}
                    placeholder="Masalan: Fastenerlar" className={inputCls} />
                </Field>
                <Field label="Yangi Yetkazib Beruvchi">
                  <input value={bulkForm.supplier} onChange={e => setBulkForm({ ...bulkForm, supplier: e.target.value })}
                    placeholder="Masalan: GlobalFasteners" className={inputCls} />
                </Field>
                <Field label="Yangi Status">
                  <select value={bulkForm.status} onChange={e => setBulkForm({ ...bulkForm, status: e.target.value })} className={inputCls}>
                    <option value="">O'zgartirilmasin</option>
                    <option value="Faol">Faol</option>
                    <option value="Sinovda">Sinovda</option>
                    <option value="Arxiv">Arxiv</option>
                  </select>
                </Field>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setBulkEditModal(false)} className={cancelBtn}>Bekor qilish</button>
                  <button type="submit" className={`${saveBtn} bg-indigo-600 hover:bg-indigo-500`}>Saqlash</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <CreateChildModal fathers={fathers} createChild={createChild} onClose={() => setModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents
function NavPill({ active, label, icon: Icon, onClick }: { active?: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm uppercase italic tracking-tight transition-all ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

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

function CreateChildModal({ fathers, createChild, onClose }: {
  fathers: any[];
  createChild: (data: any) => Promise<any>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    code: '', name: '', description: '',
    father_detail_id: fathers[0]?.id || '',
    quantity_per_unit: 1,
    unit: 'pcs',
    category: 'Fastenerlar',
    supplier: 'GlobalFasteners',
    stock_level: 250,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createChild({ ...form, quantity_per_unit: Number(form.quantity_per_unit), stock_level: Number(form.stock_level) });
    setSaving(false);
    if (result) { toast.success("Bola detal qo'shildi!"); onClose(); }
    else toast.error('Xatolik yuz berdi');
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
          <Field label="Ota Detal" required>
            <select required value={form.father_detail_id} onChange={e => setForm({ ...form, father_detail_id: e.target.value })} className={inputCls}>
              <option value="">— Tanlang —</option>
              {fathers.map(f => <option key={f.id} value={f.id}>{f.code} — {f.name}</option>)}
            </select>
          </Field>
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
            <Field label="Kategoriya">
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                placeholder="Fastenerlar" className={inputCls} />
            </Field>
            <Field label="Yetkazib Beruvchi">
              <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}
                placeholder="GlobalFasteners" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Miqdor / Dona" required>
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
            <Field label="Zaxira Miqdori">
              <input type="number" value={form.stock_level}
                onChange={e => setForm({ ...form, stock_level: parseFloat(e.target.value) })} className={inputCls} />
            </Field>
          </div>
          <Field label="Tavsif">
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Qo'shimcha..." rows={2} className={`${inputCls} resize-none`} />
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

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-xs";
const cancelBtn = "flex-1 px-5 py-3 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic text-xs";
const saveBtn = "flex-[2] flex items-center justify-center gap-2 px-5 py-3 text-white font-bold rounded-2xl shadow-lg transition-all uppercase tracking-tight italic text-xs";
