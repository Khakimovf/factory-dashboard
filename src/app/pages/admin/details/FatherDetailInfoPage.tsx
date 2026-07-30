import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GitBranch, ChevronRight, Pencil, Save, X, Loader2, Layers,
  Clock, MessageSquare, Plus, AlertTriangle, FileText,
  Package, ArrowRight, Tag, Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useDetailsStore, CodeChangeLog, ContractComment } from '../../../store/detailsStore';

export default function FatherDetailInfoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    fathers, children, loading,
    fetchFathers, fetchChildren,
    updateFather,
    fetchCodeChanges, changeLogs,
    fetchComments, addComment, comments,
  } = useDetailsStore();

  const father = fathers.find(f => f.id === id);
  const fatherChildren = children.filter(c => c.father_detail_id === id);

  // Form state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    code: '', name: '', description: '',
    category: '', supplier: '', status: '',
  });
  const [saving, setSaving] = useState(false);

  // Code change tracking
  const codeChanged = editing && form.code.toUpperCase() !== (father?.code || '').toUpperCase();
  const [changeReason, setChangeReason] = useState('');
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0]);

  // Comment state
  const [newNote, setNewNote] = useState('');
  const [newFilename, setNewFilename] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  const logs: CodeChangeLog[] = (id ? changeLogs[id] : null) || [];
  const entityComments: ContractComment[] = (id ? comments[id] : null) || [];

  useEffect(() => {
    if (!fathers.length) fetchFathers();
    if (!children.length) fetchChildren();
    if (id) {
      fetchCodeChanges(id, 'father');
      fetchComments(id, 'father');
    }
  }, [id]);

  useEffect(() => {
    if (father) {
      setForm({
        code: father.code,
        name: father.name,
        description: father.description || '',
        category: father.category || 'Plastik Qoliplar',
        supplier: father.supplier || 'Polymer-Uz',
        status: father.status || 'Faol',
      });
    }
  }, [father]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codeChanged && !changeReason.trim()) {
      toast.error("Kod o'zgartirish sababi kiritilishi shart!");
      return;
    }
    setSaving(true);
    const result = await updateFather(id!, {
      ...form,
      ...(codeChanged ? { changeReason, changeDate } : {}),
    });
    setSaving(false);
    if (result) {
      toast.success('Ota detal yangilandi!');
      setEditing(false);
      setChangeReason('');
      if (id) { fetchCodeChanges(id, 'father'); }
    } else {
      toast.error('Xatolik yuz berdi');
    }
  };

  const handleAddComment = async () => {
    if (!newNote.trim()) return;
    setSavingComment(true);
    const result = await addComment(id!, 'father', newNote, newFilename || undefined);
    setSavingComment(false);
    if (result) {
      toast.success("Sharh qo'shildi!");
      setNewNote('');
      setNewFilename('');
      setAddingComment(false);
    } else {
      toast.error("Sharh qo'shib bo'lmadi");
    }
  };

  if (!father && !loading) {
    return (
      <div className="min-h-full bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-center opacity-40">
          <Package className="w-16 h-16 text-violet-400 mx-auto mb-4" />
          <p className="text-white font-black text-xl uppercase italic">Ota Detal Topilmadi</p>
          <button onClick={() => navigate('/admin/details')} className="mt-4 text-violet-400 hover:text-violet-300 text-sm font-bold">
            ← Orqaga qaytish
          </button>
        </div>
      </div>
    );
  }

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
        <span className="text-violet-300 uppercase">{father?.code || '...'}</span>
      </nav>

      {/* Header card */}
      <div className="bg-gradient-to-br from-violet-900/20 to-slate-900/50 border border-violet-500/20 rounded-3xl p-7 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-600/30">
            <Package className="text-white w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-black tracking-widest border border-violet-500/30 uppercase">
                {father?.code}
              </span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ota Detal</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {father?.category || 'Plastik Qoliplar'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {father?.supplier || 'Polymer-Uz'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic">{father?.name}</h1>
            {father?.description && <p className="text-slate-400 text-sm mt-1">{father.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/details/fathers/${id}/children`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold text-sm hover:bg-indigo-600/30 transition-all"
          >
            <Layers className="w-4 h-4" /> Bolalar ({fatherChildren.length})
          </button>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20"
            >
              <Pencil className="w-4 h-4" /> Tahrirlash
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left column: edit form + children table */}
        <div className="xl:col-span-2 space-y-8">

          {/* Edit Form */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="bg-slate-900/60 border border-violet-500/30 rounded-3xl p-7 space-y-5 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-violet-400" /> Ma'lumotlarni Tahrirlash
                  </h2>
                  <button onClick={() => setEditing(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Kod" required>
                      <input required value={form.code}
                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        placeholder="DOOR-PANEL-FL" className={inputCls} />
                    </Field>
                    <Field label="Nom" required>
                      <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        className={inputCls} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Kategoriya">
                      <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Yetkazib Beruvchi">
                      <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Status">
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                        <option value="Faol">Faol</option>
                        <option value="Sinovda">Sinovda</option>
                        <option value="Arxiv">Arxiv</option>
                      </select>
                    </Field>
                  </div>

                  <AnimatePresence>
                    {codeChanged && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden space-y-3"
                      >
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-amber-300 text-xs font-bold">
                            Kod o'zgartirilmoqda: <span className="line-through opacity-60">{father?.code}</span> → <span>{form.code}</span>. Tarix jurnalida qayd etiladi.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="O'zgartirish Sababi" required>
                            <textarea required={codeChanged} value={changeReason}
                              onChange={e => setChangeReason(e.target.value)}
                              placeholder="Sabab..." rows={2} className={`${inputCls} resize-none`} />
                          </Field>
                          <Field label="O'zgartirish Sanasi" required>
                            <input type="date" required={codeChanged} value={changeDate}
                              onChange={e => setChangeDate(e.target.value)} className={inputCls} />
                          </Field>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Field label="Tavsif">
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={2} className={`${inputCls} resize-none`} />
                  </Field>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setEditing(false)} className={cancelBtn}>Bekor qilish</button>
                    <button type="submit" disabled={saving} className={saveBtn}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Saqlash
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Linked Children Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white uppercase italic flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Bola Detallar
                <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-300 rounded-lg text-xs">{fatherChildren.length}</span>
              </h3>
              <button
                onClick={() => navigate(`/admin/details/fathers/${id}/children`)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Barchasini ko'rish <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {fatherChildren.length === 0 ? (
              <div className="py-12 text-center opacity-30">
                <Layers className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm font-bold uppercase italic">Bola detallar yo'q</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    {['Kod', 'Nom', 'Kategoriya', 'Miqdor/Dona'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {fatherChildren.slice(0, 6).map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/admin/details/children/${c.id}`)}
                          className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded text-[10px] font-black tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                          {c.code}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 text-xs font-bold italic">{c.name}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{c.category || 'Fastenerlar'}</td>
                      <td className="px-5 py-3.5 text-emerald-400 font-black text-sm font-mono">{c.quantity_per_unit} {c.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column: change log + comments */}
        <div className="space-y-6">
          {/* Code Change History */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="font-black text-white uppercase italic flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Kod Tarix Jurnali
              </h3>
            </div>
            {logs.length === 0 ? (
              <div className="py-8 text-center opacity-30">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs font-bold uppercase">Tarix yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/30">
                {logs.map((log) => (
                  <div key={log.id} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black text-slate-600 line-through">{log.old_code}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="px-2 py-0.5 bg-violet-500/10 text-violet-300 rounded text-[10px] font-black border border-violet-500/20">{log.new_code}</span>
                    </div>
                    {log.reason && <p className="text-xs text-slate-400 mb-1">{log.reason}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-slate-600">
                      <span>{log.change_date || log.created_at.split('T')[0]}</span>
                      <span>·</span>
                      <span>{log.changed_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contract Comments */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white uppercase italic flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Shartnoma Sharhlari
              </h3>
              <button
                onClick={() => setAddingComment(v => !v)}
                className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence>
              {addingComment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-b border-slate-800/60"
                >
                  <div className="px-6 py-4 space-y-3">
                    <textarea
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Sharh matni..."
                      rows={3}
                      className={`${inputCls} resize-none text-xs`}
                    />
                    <input
                      value={newFilename}
                      onChange={e => setNewFilename(e.target.value)}
                      placeholder="Fayl nomi (ixtiyoriy): shartnoma.pdf"
                      className={`${inputCls} text-xs`}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setAddingComment(false)} className="flex-1 py-2 text-slate-400 border border-slate-700 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all">
                        Bekor
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={savingComment || !newNote.trim()}
                        className="flex-[2] flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {savingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Saqlash
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {entityComments.length === 0 ? (
              <div className="py-8 text-center opacity-30">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs font-bold uppercase">Sharhlar yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/30">
                {entityComments.map(c => (
                  <div key={c.id} className="px-6 py-4">
                    <p className="text-xs text-slate-300 leading-relaxed mb-2">{c.note}</p>
                    {c.filename && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <FileText className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] text-blue-400 font-bold">{c.filename}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <span>{c.created_at.split('T')[0]}</span>
                      <span>·</span>
                      <span>{c.uploaded_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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

const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-bold text-xs";
const cancelBtn = "flex-1 px-5 py-3 border border-slate-700 text-slate-400 font-bold rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-tight italic text-xs";
const saveBtn = "flex-[2] flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 transition-all uppercase tracking-tight italic text-xs";
