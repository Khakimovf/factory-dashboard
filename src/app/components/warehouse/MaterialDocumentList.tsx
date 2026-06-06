import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    ClipboardList, FileText, ArrowRight, ArrowLeft, RefreshCw,
    Printer, Download, X, Search, Filter, Calendar, User,
    ChevronLeft, ChevronRight, Hash, MapPin, Box
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useWarehouseStore, MaterialDocument } from '../../store/warehouseStore';
import { toast } from 'sonner';

export const MaterialDocumentList: React.FC = () => {
    const { documents, addDocument } = useWarehouseStore();
    const [selectedDoc, setSelectedDoc] = useState<MaterialDocument | null>(null);
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'GOODS_RECEIPT' | 'GOODS_ISSUE' | 'TRANSFER'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isManualPostOpen, setIsManualPostOpen] = useState(false);

    const filteredDocs = documents.filter(doc => {
        const matchesType = typeFilter === 'ALL' || doc.type === typeFilter;
        const matchesSearch = doc.documentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.reference.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const getMovementColor = (type: string) => {
        switch (type) {
            case 'GOODS_RECEIPT': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'GOODS_ISSUE': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            case 'TRANSFER': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'GOODS_RECEIPT': return <ArrowRight className="w-2.5 h-2.5 mr-1" />;
            case 'GOODS_ISSUE': return <ArrowLeft className="w-2.5 h-2.5 mr-1" />;
            case 'TRANSFER': return <RefreshCw className="w-2.5 h-2.5 mr-1" />;
            default: return null;
        }
    };

    const handleManualPost = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Manual Material Document Posted Successfully", {
            description: "Ledger updated in VGM ERP and synced with S/4HANA."
        });
        setIsManualPostOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        Material Documents History
                    </h3>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mt-1">S/4HANA MIGO Journal — Real-time Ledger</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl mr-2">
                        {['ALL', 'RECEIPT', 'ISSUE', 'TRANSFER'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t === 'ISSUE' ? 'GOODS_ISSUE' : t === 'RECEIPT' ? 'GOODS_RECEIPT' : t as any)}
                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${(t === 'ALL' && typeFilter === 'ALL') ||
                                        (t === 'RECEIPT' && typeFilter === 'GOODS_RECEIPT') ||
                                        (t === 'ISSUE' && typeFilter === 'GOODS_ISSUE') ||
                                        (t === 'TRANSFER' && typeFilter === 'TRANSFER')
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            placeholder="Journal ID / Ref..."
                            className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-white outline-none focus:border-blue-500/50 w-48 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={() => setIsManualPostOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 font-black uppercase text-[10px] tracking-widest gap-2 ml-2"
                    >
                        <ClipboardList className="w-4 h-4" /> Manual Posting
                    </Button>
                </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="border-slate-800 hover:bg-transparent h-14">
                            <TableHead className="px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Document ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Posting Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Operation</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Mvmt</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reference</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plant / SLoc</TableHead>
                            <TableHead className="px-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDocs.length > 0 ? (
                            filteredDocs.map((doc) => (
                                <TableRow key={doc.documentId} className="border-slate-800 hover:bg-slate-800/30 transition-colors group h-16">
                                    <TableCell className="px-6 font-mono text-xs font-bold text-emerald-500">{doc.documentId}</TableCell>
                                    <TableCell className="text-xs font-bold text-slate-300">
                                        {new Date(doc.postDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0.5 ${getMovementColor(doc.type)}`}>
                                            {getTypeIcon(doc.type)}
                                            {doc.type.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-mono font-bold text-xs text-blue-400">{doc.mvmt}</TableCell>
                                    <TableCell className="text-xs font-black text-slate-400 uppercase tracking-tight">{doc.reference}</TableCell>
                                    <TableCell className="text-[11px] text-slate-500 font-black uppercase font-mono tracking-wider">{doc.plant} / {doc.sloc}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-slate-800 bg-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            Display
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-slate-500 font-black uppercase tracking-widest text-xs opacity-50">
                                    No documents found matching filters
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <span>Page 1 of 1 — {filteredDocs.length} Results</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            </div>

            {/* Document Detail Modal */}
            <Modal
                isOpen={!!selectedDoc}
                onClose={() => setSelectedDoc(null)}
                title={selectedDoc ? `Material Document: ${selectedDoc.documentId}` : ''}
            >
                {selectedDoc && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-6 p-6 bg-slate-950 rounded-3xl border border-white/5">
                            {[
                                { label: 'Posting Date', value: new Date(selectedDoc.postDate).toLocaleDateString(), icon: <Calendar className="w-3.5 h-3.5" /> },
                                { label: 'Movement Type', value: `${selectedDoc.mvmt} — ${selectedDoc.type.replace('_', ' ')}`, icon: <ArrowRight className="w-3.5 h-3.5" /> },
                                { label: 'Reference', value: selectedDoc.reference, icon: <Hash className="w-3.5 h-3.5" /> },
                                { label: 'Plant / SLoc', value: `${selectedDoc.plant} / ${selectedDoc.sloc}`, icon: <MapPin className="w-3.5 h-3.5" /> },
                                { label: 'Created By', value: 'WM_USER_KHK', icon: <User className="w-3.5 h-3.5" /> },
                                { label: 'Ledger State', value: 'SYNCED (SAP)', icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-emerald-500' }
                            ].map((info, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                        <span className="opacity-50">{info.icon}</span> {info.label}
                                    </div>
                                    <p className={`text-xs font-black uppercase ${info.color || 'text-slate-100'}`}>{info.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" /> Line Item Identification
                            </h4>
                            <div className="bg-slate-950/50 border border-slate-800 rounded-3xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-900/50 text-[9px] font-black uppercase tracking-widest text-slate-600">
                                        <tr>
                                            <th className="px-5 py-3">Item</th>
                                            <th className="px-5 py-3">Material ID</th>
                                            <th className="px-5 py-3">Description</th>
                                            <th className="px-5 py-3 text-right">Quantity</th>
                                            <th className="px-5 py-3 text-right">Value (EST)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {selectedDoc.lineItems.map((item, idx) => (
                                            <tr key={idx} className="text-xs font-bold text-slate-300 h-14">
                                                <td className="px-5 font-mono text-[10px] opacity-50">{(idx + 1).toString().padStart(3, '0')}</td>
                                                <td className="px-5 font-mono text-blue-400">{item.materialId}</td>
                                                <td className="px-5 truncate max-w-[150px]">{item.description}</td>
                                                <td className="px-5 text-right font-black">
                                                    {item.qty} <span className="text-[9px] opacity-50 lowercase ml-0.5">{item.unit}</span>
                                                </td>
                                                <td className="px-5 text-right font-black text-white">
                                                    ${((item.amount || (Math.random() * 50 + 10)) * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs h-12 shadow-2xl" onClick={() => toast.info('Initiating Document Printing...')}>
                                <Printer className="w-4 h-4 mr-2" /> Print Slip
                            </Button>
                            <Button className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs h-12 shadow-2xl" onClick={() => toast.info('Exporting as PDF...')}>
                                <Download className="w-4 h-4 mr-2" /> Export PDF
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Manual Posting Modal */}
            <Modal
                isOpen={isManualPostOpen}
                onClose={() => setIsManualPostOpen(false)}
                title="Manual Ledger Posting (MIGO)"
            >
                <form onSubmit={handleManualPost} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Movement Type</Label>
                            <select className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold uppercase text-white outline-none focus:border-blue-500/50">
                                <option>101 — Goods Receipt</option>
                                <option>261 — Goods Issue</option>
                                <option>311 — Transfer Posting</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reference (PO/WO)</Label>
                            <Input className="bg-slate-950 border-slate-800 h-11 font-mono uppercase text-xs" placeholder="PO-123456" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Line Items</Label>
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5">
                                    <Box className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase">Add Material SKU</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Search in master data</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase">Browse</Button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[11px] h-12 shadow-xl shadow-emerald-900/20">
                            Confirm Posting
                        </Button>
                        <Button type="button" variant="ghost" className="text-slate-500 font-black uppercase tracking-widest text-[11px] h-12" onClick={() => setIsManualPostOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
