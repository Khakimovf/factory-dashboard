import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
    Search, Filter, MoreHorizontal, Download, LayoutGrid,
    ArrowRightLeft, FileOutput, FlaskConical, Eye, Plus, Pencil, Trash2, History
} from 'lucide-react';
import { toast } from 'sonner';
import { useWarehouseStore, StockItem } from '../../store/warehouseStore';
import { Modal } from '../common/Modal';
import { FilterModal } from './FilterModal';

// ─── CSV Export Function ──────────────────────────────────────────────────────

function exportStockCSV(items: StockItem[]) {
    const headers = ['Material ID', 'Description', 'Bin', 'Total', 'Unrestricted', 'Reserved', 'Blocked', 'Status'];
    const rows = items.map(m => [
        m.materialId,
        `"${m.description}"`,
        m.binLocation,
        m.totalStock,
        m.unrestricted,
        m.reserved,
        m.blocked,
        m.status || 'OK'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse-stock.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Context Menu Component ───────────────────────────────────────────────────

interface CtxMenuProps {
    item: StockItem;
    onViewDetail: (item: StockItem) => void;
    position: { x: number; y: number };
    onClose: () => void;
}

const ContextMenu: React.FC<CtxMenuProps> = ({ item, onViewDetail, position, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuItems = [
        { label: 'View Details', icon: <Eye className="w-4 h-4 text-slate-400" />, action: () => { onViewDetail(item); onClose(); } },
        { label: 'Edit Material', icon: <Pencil className="w-4 h-4 text-blue-400" />, action: () => { toast.info(`Edit mode for ${item.materialId}`); onClose(); } },
        { label: 'Stock Transfer', icon: <ArrowRightLeft className="w-4 h-4 text-emerald-400" />, action: () => { toast.info(`Transfer initiated: ${item.materialId}`); onClose(); } },
        { label: 'Post Goods Issue', icon: <FileOutput className="w-4 h-4 text-amber-400" />, action: () => { toast.success(`GI Posted: ${item.materialId}`); onClose(); } },
        { label: 'Delete Record', icon: <Trash2 className="w-4 h-4 text-rose-400" />, action: () => { if (confirm('Delete this record?')) { useWarehouseStore.getState().deleteStock(item.materialId); toast.error('Material Deleted'); } onClose(); } },
    ];

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const menuW = 200;
    const menuH = 180;
    const left = position.x + menuW > vpW ? position.x - menuW : position.x;
    const top = position.y + menuH > vpH ? position.y - menuH : position.y;

    return (
        <div
            ref={ref}
            style={{ position: 'fixed', left, top, zIndex: 9999 }}
            className="w-[200px] bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-tight">Material ID</p>
                <p className="text-xs font-black text-blue-400 font-mono truncate">{item.materialId}</p>
            </div>
            <div className="py-1">
                {menuItems.map((mi) => (
                    <button
                        key={mi.label}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors text-left"
                        onClick={(e) => {
                            e.stopPropagation();
                            mi.action();
                        }}
                    >
                        {mi.icon} {mi.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── Main StockOverview Component ─────────────────────────────────────────────

type CategoryFilter = '' | 'FINISHED_GOODS' | 'RAW_MATERIAL' | 'SEMI_FINISHED';
type StockTypeFilter = '' | 'unrestricted' | 'reserved' | 'blocked';

export const StockOverview: React.FC = () => {
    const { stock } = useWarehouseStore();

    const [search, setSearch] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [ctxMenu, setCtxMenu] = useState<{ item: StockItem; x: number; y: number } | null>(null);

    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('');
    const [stockTypeFilter, setStockTypeFilter] = useState<StockTypeFilter>('');

    const filtered = useMemo(() => {
        return stock.filter(item => {
            const matchSearch =
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.materialId.toLowerCase().includes(search.toLowerCase()) ||
                item.binLocation.toLowerCase().includes(search.toLowerCase());

            const matchCat = categoryFilter === '' || item.category === categoryFilter;

            const matchStockType =
                stockTypeFilter === '' ||
                (stockTypeFilter === 'unrestricted' && item.unrestricted > 0) ||
                (stockTypeFilter === 'reserved' && item.reserved > 0) ||
                (stockTypeFilter === 'blocked' && item.blocked > 0);

            return matchSearch && matchCat && matchStockType;
        });
    }, [stock, search, categoryFilter, stockTypeFilter]);

    const activeFiltersCount = [categoryFilter, stockTypeFilter].filter(Boolean).length;

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'OK': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'BLOCKED': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'LOW_STOCK': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const handleContextMenu = (e: React.MouseEvent, item: StockItem) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ item, x: e.clientX, y: e.clientY });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search SKU, Bin, or Material..."
                        className="pl-9 bg-slate-900 border-slate-800 focus:border-blue-500/50"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all tracking-[0.15em] flex items-center justify-center gap-2"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus className="w-4 h-4" /> Add Material
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 hover:bg-amber-500/5 transition-all tracking-[0.15em] flex items-center justify-center gap-2"
                        onClick={() => setIsAdjustModalOpen(true)}
                    >
                        <History className="w-4 h-4" /> Adjustment
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-800 bg-slate-900 hover:bg-slate-800 relative"
                        onClick={() => setIsFilterOpen(true)}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 rounded-full text-[9px] flex items-center justify-center text-white font-black">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-800 bg-slate-900 hover:bg-slate-800"
                        onClick={() => {
                            exportStockCSV(filtered);
                            toast.success('Exported successfully', {
                                description: `Downloaded ${filtered.length} material records.`
                            });
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader className="bg-slate-900/80">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest">Material ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Bin Location</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Total Stock</TableHead>
                            <TableHead className="text-right text-emerald-400 text-[10px] font-black uppercase tracking-widest">Unrestricted</TableHead>
                            <TableHead className="text-right text-blue-400 text-[10px] font-black uppercase tracking-widest">Min Stock</TableHead>
                            <TableHead className="text-right text-amber-400 text-[10px] font-black uppercase tracking-widest">Reserved</TableHead>
                            <TableHead className="text-right text-rose-400 text-[10px] font-black uppercase tracking-widest">Blocked</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No materials found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((item) => (
                                <TableRow
                                    key={item.materialId}
                                    className="border-slate-800 hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedItem(item)}
                                    onContextMenu={(e) => handleContextMenu(e, item)}
                                >
                                    <TableCell className="font-mono text-xs font-bold text-blue-400">{item.materialId}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-200">{item.description}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                                {item.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-800 border-slate-700 font-mono text-[10px]">
                                            <LayoutGrid className="w-3 h-3 mr-1.5 opacity-50 text-blue-500" />
                                            {item.binLocation}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-100">
                                        {item.totalStock.toLocaleString()}
                                        <span className="text-[10px] text-muted-foreground ml-1 font-normal lowercase">{item.unit}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium text-emerald-400/90">{item.unrestricted.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono font-medium text-blue-400/70">{item.minimumStock?.toLocaleString() || '0'}</TableCell>
                                    <TableCell className="text-right font-mono font-medium text-amber-400/90">
                                        {item.reserved > 0 ? item.reserved.toLocaleString() : '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium text-rose-400/90">
                                        {item.blocked > 0 ? item.blocked.toLocaleString() : '—'}
                                    </TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        <button
                                            className="p-1.5 hover:bg-white/5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => handleContextMenu(e, item)}
                                        >
                                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="px-1 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                <span>Showing {filtered.length} of {stock.length} materials</span>
                <span>Plant: P001 | Storage Location: WH01</span>
            </div>

            {ctxMenu && (
                <ContextMenu
                    item={ctxMenu.item}
                    position={{ x: ctxMenu.x, y: ctxMenu.y }}
                    onViewDetail={(item) => setSelectedItem(item)}
                    onClose={() => setCtxMenu(null)}
                />
            )}

            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem ? `${selectedItem.materialId} — Detail View` : ''}
            >
                {selectedItem && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</Label>
                                <p className="text-sm font-bold text-slate-100 uppercase">{selectedItem.category.replace('_', ' ')}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</Label>
                                <div>
                                    <Badge className={`text-[10px] font-black uppercase ${getStatusColor(selectedItem.status)}`}>
                                        {selectedItem.status || 'OK'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Bin Location</Label>
                                <p className="text-sm font-bold text-blue-400 font-mono underline decoration-blue-500/20 underline-offset-4">
                                    {selectedItem.binLocation}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Stock</Label>
                                <p className="text-sm font-bold text-slate-100 italic">
                                    {selectedItem.totalStock.toLocaleString()} {selectedItem.unit}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Batch Number</Label>
                                <p className="text-sm font-bold text-blue-400 font-mono">
                                    {selectedItem.batchNumber || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reorder Point</Label>
                                <p className="text-sm font-bold text-amber-500">
                                    {selectedItem.reorderPoint?.toLocaleString() || '0'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 grid grid-cols-2 gap-y-4">
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Unrestricted</span>
                                <p className="text-xl font-black text-white">{selectedItem.unrestricted.toLocaleString()}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest">Reserved</span>
                                <p className="text-xl font-black text-white">{selectedItem.reserved.toLocaleString()}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-rose-500 tracking-widest">Blocked</span>
                                <p className="text-xl font-black text-white">{selectedItem.blocked.toLocaleString()}</p>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">In Quality</span>
                                <p className="text-xl font-black text-white">{selectedItem.inQuality.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-xs h-11"
                                onClick={() => {
                                    toast.info(`Stock Transfer started for ${selectedItem.materialId}`);
                                    setSelectedItem(null);
                                }}
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Transfer
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-xs h-11"
                                onClick={() => {
                                    toast.success(`GI Posted for ${selectedItem.materialId}`);
                                    setSelectedItem(null);
                                }}
                            >
                                <FileOutput className="w-4 h-4 mr-2" />
                                Post GI
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create New Material Record"
            >
                <form onSubmit={(e) => { e.preventDefault(); toast.success('New Material Created'); setIsAddModalOpen(false); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Material ID</Label>
                            <Input placeholder="MAT-00X" required className="bg-slate-950 border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Category</Label>
                            <select className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md text-xs font-bold uppercase px-3 text-white">
                                <option>FINISHED_GOODS</option>
                                <option>RAW_MATERIAL</option>
                                <option>SEMI_FINISHED</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Description</Label>
                            <Input placeholder="Material full description..." required className="bg-slate-950 border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Min Stock</Label>
                            <Input type="number" placeholder="1000" className="bg-slate-950 border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Reorder Point</Label>
                            <Input type="number" placeholder="1200" className="bg-slate-950 border-slate-800" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs h-11">Save Record</Button>
                        <Button type="button" variant="ghost" className="text-slate-500 font-black uppercase text-xs h-11" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isAdjustModalOpen}
                onClose={() => setIsAdjustModalOpen(false)}
                title="Stock Adjustment (Cycle Count)"
            >
                <form onSubmit={(e) => { e.preventDefault(); toast.success('Stock Adjustment Posted'); setIsAdjustModalOpen(false); }} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Select Material</Label>
                        <select className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md text-xs font-bold uppercase px-3 text-white">
                            {stock.map(s => <option key={s.materialId}>{s.materialId} — {s.description}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Adjustment Qty (+/-)</Label>
                            <Input type="number" placeholder="e.g. -50" required className="bg-slate-950 border-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-500">Adjustment Reason</Label>
                            <select className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md text-xs font-bold uppercase px-3 text-white">
                                <option>Cycle Count Discrepancy</option>
                                <option>Damaged Goods</option>
                                <option>Quality Inspection Failure</option>
                                <option>System Correction</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 font-black uppercase text-xs h-11">Post Adjustment</Button>
                        <Button type="button" variant="ghost" className="text-slate-500 font-black uppercase text-xs h-11" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(cat, status) => {
                    setCategoryFilter(cat as CategoryFilter);
                    setStockTypeFilter(status as StockTypeFilter);
                }}
                onReset={() => {
                    setCategoryFilter('');
                    setStockTypeFilter('');
                }}
                initialCategory={categoryFilter}
                initialStatus={stockTypeFilter}
            />
        </div>
    );
};
