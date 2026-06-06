import React from 'react';
import { FileText, Download, CheckCircle2, XCircle, Clock, Upload, Eye } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';

const DOCUMENTS = [
    { id: 1, name: 'Bill of Lading', file: 'BL_MSCU7234891.pdf', date: '2026-05-15', status: '✅', type: 'Required' },
    { id: 2, name: 'Commercial Invoice', file: 'INV_2026_0442.pdf', date: '2026-05-15', status: '✅', type: 'Required' },
    { id: 3, name: 'Packing List', file: 'PL_2026_0442.pdf', date: '2026-05-16', status: '✅', type: 'Required' },
    { id: 4, name: 'Sertifikat (Origin)', file: 'CERT_CN_882.pdf', date: '2026-05-18', status: '⏳', type: 'Required' },
    { id: 5, name: 'GTD Declaration', file: 'GTD_2026_04821.pdf', date: '2026-05-28', status: '❌', type: 'Internal' },
    { id: 6, name: 'To\'lov Tasdiqi', file: 'PAY_BANK_9921.pdf', date: '2026-05-29', status: '✅', type: 'Financial' },
];

export const DocumentsTab: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Hujjatlar Arxivı</h4>
                {isEditMode && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-[10px] font-black uppercase italic hover:bg-indigo-600/20 transition-all">
                        <Upload size={14} />
                        Hujjat Yuklash
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3">
                {DOCUMENTS.map((doc) => (
                    <div key={doc.id} className="group bg-slate-900/30 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white italic uppercase tracking-tight">{doc.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{doc.file}</span>
                                    <span className="text-[9px] text-slate-700">|</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{doc.date}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Badge className={`px-2 py-0 text-[8px] font-black uppercase italic ${doc.status === '✅' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                doc.status === '⏳' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                {doc.status === '✅' ? 'Tasdiqlandi' : doc.status === '⏳' ? 'Kutilmoqda' : 'Rad Etildi'}
                            </Badge>

                            <div className="flex items-center gap-1">
                                <button title="Ko'rish" className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all">
                                    <Eye size={16} />
                                </button>
                                <button title="Yuklab olish" className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all">
                                    <Download size={16} />
                                </button>
                                {isEditMode && (
                                    <button title="O'chirish" className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all">
                                        <XCircle size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                    <Upload size={24} />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-white uppercase italic">Yangi fayllarni bu yerga tashlang</p>
                    <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">PDF, JPG, PNG (Max 10MB)</p>
                </div>
            </div>
        </div>
    );
};
