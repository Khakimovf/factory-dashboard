import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
    Layers, Info, Map as MapIcon, Maximize2, Move, Truck,
    LayoutGrid, Box, History, ExternalLink, ArrowRightLeft, X, Map, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useWarehouseStore } from '../../store/warehouseStore';
import { Modal } from '../common/Modal';

export const BinManagementMap: React.FC = () => {
    const { bins } = useWarehouseStore();
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const rows = [1, 2, 3, 4, 5];
    const levels = ['L1', 'L2', 'L3', 'L4'];

    const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

    const binData = useMemo(() => {
        const map: Record<string, any> = {};
        bins.forEach(b => { map[b.binId] = b; });
        return map;
    }, [bins]);

    const getColor = (status: string) => {
        switch (status) {
            case 'FULL': return 'bg-rose-500 border-rose-400 text-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse-subtle';
            case 'OCCUPIED': return 'bg-amber-500 border-amber-400 text-amber-900';
            case 'AVAILABLE': return 'bg-emerald-500/40 border-emerald-500/50 text-emerald-100 hover:bg-emerald-500/60';
            default: return 'bg-slate-800/50 border-slate-700 text-slate-500 opacity-30';
        }
    };

    const selectedBin = selectedBinId ? binData[selectedBinId] : null;

    return (
        <TooltipProvider delayDuration={0}>
            <div className="space-y-4">
                {/* Header Legend */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-blue-500 uppercase font-black tracking-widest leading-none mb-1">Interactive Map</span>
                            <span className="text-sm font-black text-white leading-tight">Warehouse Area-01</span>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-rose-500" />
                                <span className="text-[10px] text-slate-400 uppercase font-black">Full</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                                <span className="text-[10px] text-slate-400 uppercase font-black">Occupied</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
                                <span className="text-[10px] text-slate-400 uppercase font-black">Available</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 border-slate-800 bg-slate-950 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-white">
                            <Layers className="w-3.5 h-3.5 mr-2" /> Layers
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-4 border-slate-800 bg-slate-950 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-white">
                            <Move className="w-3.5 h-3.5 mr-2" /> Pan
                        </Button>
                    </div>
                </div>

                <div className="relative bg-[#020617] border border-slate-800 rounded-3xl p-8 overflow-auto shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] h-[calc(100vh-320px)] min-h-[500px] custom-scrollbar">
                    <div className="flex gap-10 min-w-max pb-6">
                        {sections.map(section => (
                            <div key={section} className="flex-none w-[200px] space-y-4">
                                <div className="text-center font-black text-[10px] text-slate-500 bg-slate-900 border border-slate-800 rounded-lg py-2 uppercase tracking-[0.3em] shadow-lg flex items-center justify-center gap-3">
                                    <LayoutGrid className="w-3.5 h-3.5 opacity-50 text-blue-500" /> SECTION {section}
                                </div>
                                <div className="space-y-8">
                                    {rows.map(row => (
                                        <div key={row} className="relative group p-2 border border-blue-500/0 hover:border-blue-500/10 rounded-2xl transition-all duration-300">
                                            <div className="grid grid-cols-2 gap-2">
                                                {levels.map(level => {
                                                    const binId = `${section}-L${level.replace('L', '')}`;
                                                    // In store we use Section-Level format, e.g. A-L1
                                                    // This map is simplified, for now we map all rows to the same status per section/level
                                                    const data = binData[binId] || { status: 'AVAILABLE', quantity: 0, maxCapacity: 1000 };
                                                    const util = Math.round((data.quantity / data.maxCapacity) * 100);

                                                    return (
                                                        <Tooltip key={`${section}-${row}-${level}`}>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    onClick={() => setSelectedBinId(binId)}
                                                                    className={`h-9 w-full rounded-md border flex items-center justify-center text-[9px] font-black cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg ${getColor(data.status)}`}
                                                                >
                                                                    {level}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="bg-[#0a0f1e] border-slate-800 text-white p-0 overflow-hidden shadow-2xl rounded-xl min-w-[200px]">
                                                                <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                                                    <span className="font-black font-mono text-blue-400">{binId}</span>
                                                                    <Badge variant="outline" className={`text-[9px] bg-black/50 ${data.status === 'FULL' ? 'border-rose-500 text-rose-500' : 'border-slate-800'}`}>{util}% Full</Badge>
                                                                </div>
                                                                <div className="p-4 space-y-3">
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Material</p>
                                                                        <p className="text-xs font-bold text-slate-100 truncate">{data.materialId || 'EMPTY BIN'}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Quantity</p>
                                                                        <p className="text-xs font-bold text-slate-100">{data.quantity?.toLocaleString() || 0} / {data.maxCapacity} {data.unit || 'pcs'}</p>
                                                                    </div>
                                                                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                                                        <div className={`h-full ${util > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${util}%` }} />
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                })}
                                            </div>
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] opacity-30 group-hover:opacity-100 transition-all pointer-events-none">
                                                ROW {row}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ground Zones */}
                    <div className="mt-12 grid grid-cols-3 gap-6">
                        {[
                            { name: 'Inbound Staging', icon: <Truck />, color: 'text-blue-500' },
                            { name: 'Quality Hold Area', icon: <Layers />, color: 'text-rose-500' },
                            { name: 'Outbound Lane 01', icon: <Move />, color: 'text-amber-500' }
                        ].map((zone, i) => (
                            <div key={i} className="p-6 border border-dashed border-white/5 rounded-[2rem] flex items-center gap-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <div className={`p-3 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform ${zone.color}`}>{zone.icon}</div>
                                <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] group-hover:text-slate-300">{zone.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-wide">
                            SAP EWM Intelligence: Optimal bin distribution algorithm active.
                            <span className="text-blue-500 ml-2">Area 01 Section A</span> is currently prioritized for high-rotation goods.
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black text-blue-500 hover:bg-blue-500/10 tracking-widest">
                        Strategy Details
                    </Button>
                </div>
            </div>

            <Modal
                isOpen={!!selectedBinId}
                onClose={() => setSelectedBinId(null)}
                title={selectedBinId ? `Storage Bin Investigation: ${selectedBinId}` : ''}
            >
                {selectedBin && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Physical Location</span>
                                <p className="text-xl font-black text-white">{selectedBin.area} / {selectedBin.column}-{selectedBin.level}</p>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-1">
                                <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Occupancy State</span>
                                <div className="flex items-center gap-2 pt-1">
                                    <div className={`w-2 h-2 rounded-full ${selectedBin.status === 'FULL' ? 'bg-rose-500' : (selectedBin.status === 'OCCUPIED' ? 'bg-amber-500' : 'bg-emerald-500')}`} />
                                    <p className="text-xs font-black text-slate-100 uppercase">{selectedBin.status}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Box className="w-4 h-4" /> Stored Content
                            </h4>
                            {selectedBin.status === 'AVAILABLE' ? (
                                <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl text-center">
                                    <p className="text-slate-500 font-bold text-sm">Bin is currently empty.</p>
                                    <p className="text-[10px] text-slate-600 uppercase font-black mt-1">Ready for Putaway Operations</p>
                                </div>
                            ) : (
                                <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden p-6 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none">Material SKU</p>
                                            <p className="text-lg font-black text-white font-mono">{selectedBin.materialId || 'RM-PP-001'}</p>
                                        </div>
                                        <Badge className="bg-blue-600/10 text-blue-400 border-blue-600/30 text-[10px] font-black">ACTIVE BATCH</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Current Quantity</p>
                                            <p className="text-2xl font-black text-white">{selectedBin.quantity?.toLocaleString() || 0} <span className="text-xs opacity-50 uppercase">pcs</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Utilization</p>
                                            <p className="text-2xl font-black text-emerald-400">
                                                {Math.round((selectedBin.quantity || 0) / selectedBin.maxCapacity * 100)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button className="flex-1 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-xs h-12 shadow-xl shadow-blue-900/20">
                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Stock Movement
                            </Button>
                            {selectedBin.status !== 'AVAILABLE' && (
                                <Button variant="outline" className="border-rose-900/50 text-rose-500 hover:bg-rose-950 font-black uppercase tracking-widest text-xs h-12" onClick={() => { useWarehouseStore.getState().updateBin(selectedBin.binId, { status: 'AVAILABLE', quantity: 0, materialId: undefined }); setSelectedBinId(null); toast.success('Bin Cleared Successfully'); }}>
                                    <X className="w-4 h-4 mr-2" /> Clear Bin
                                </Button>
                            )}
                            <Button variant="ghost" className="h-12 w-12 p-0 text-slate-500 hover:text-white" onClick={() => setSelectedBinId(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </TooltipProvider>
    );
};
