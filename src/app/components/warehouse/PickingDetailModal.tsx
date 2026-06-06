import React from 'react';
import { usePickingStore, PickingOrder } from '../../store/pickingStore';
import { Badge } from '../ui/badge';
import {
    X, MapPin, Package, Move, Boxes,
    ChevronRight, Info, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export const PickingDetailModal = ({ order, onClose }: { order: PickingOrder, onClose: () => void }) => {
    const { markMaterialDone, startDelivering, markDelivered } = usePickingStore();

    const statuses = ['PENDING', 'ACCEPTED', 'PICKING', 'DELIVERING', 'DELIVERED'];
    const currentStatusIdx = statuses.indexOf(order.status);

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-[#0b0e14] border border-white/10 rounded-[2.5rem] w-[750px] max-w-full max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                style={{ animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>

                {/* Modal Header */}
                <div className="bg-slate-900/30 border-b border-white/5 p-8 flex justify-between items-start flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white text-2xl font-black tracking-tighter uppercase">{order.id}</h2>
                                <p className="text-blue-500 text-[10px] font-black tracking-[0.3em] uppercase opacity-60">S/4HANA EWM Picking Task</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{order.lineName}</Badge>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-white/70 text-xs font-bold">{order.productName}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/20 hover:text-white rounded-2xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Dynamic Stepper */}
                <div className="px-8 py-5 bg-black/20 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        {[
                            { key: 'PENDING', label: 'Kutilmoqda', icon: '⏳' },
                            { key: 'ACCEPTED', label: 'Qabul', icon: '👤' },
                            { key: 'PICKING', label: 'Yig\'ish', icon: '🔄' },
                            { key: 'DELIVERING', label: 'Yo\'lda', icon: '🚚' },
                            { key: 'DELIVERED', label: 'Bajarildi', icon: '✅' },
                        ].map((step, i, arr) => {
                            const stepIdx = statuses.indexOf(step.key);
                            const isActive = stepIdx <= currentStatusIdx;
                            const isCurrent = stepIdx === currentStatusIdx;

                            return (
                                <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 text-slate-700 grayscale opacity-30 border border-slate-800'
                                            } ${isCurrent ? 'animate-pulse' : ''}`}>
                                            <span className="text-lg">{step.icon}</span>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-700'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className="flex-1 h-0.5 mx-2 bg-slate-900 relative bottom-3">
                                            <div className={`h-full bg-blue-500 transition-all duration-1000 ${stepIdx < currentStatusIdx ? 'w-full' : 'w-0'}`} />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Materials List */}
                <div className="overflow-y-auto flex-1 p-8 space-y-4 custom-scrollbar">
                    {order.materials.map((mat, idx) => (
                        <div
                            key={mat.materialId}
                            className={`border-2 rounded-[2rem] p-6 transition-all relative overflow-hidden ${mat.isDone
                                ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                                : 'border-white/5 bg-white/2 hover:border-white/10'
                                }`}
                        >
                            {mat.isDone && (
                                <div className="absolute top-0 right-0 p-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-blue-500/40 text-[9px] font-black tracking-[0.3em] uppercase mb-1">{mat.materialId}</p>
                                    <h4 className="text-white font-black text-lg tracking-tight">{mat.materialName}</h4>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex flex-col">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Required</span>
                                            <span className="text-sm font-black text-white">{mat.requestedQty} {mat.unit}</span>
                                        </div>
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-1.5 flex flex-col">
                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Available</span>
                                            <span className="text-sm font-black text-emerald-500">{mat.availableQty} {mat.unit}</span>
                                        </div>
                                    </div>
                                </div>
                                {!mat.isDone && (
                                    <div className="bg-slate-900 border border-slate-800 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-slate-500">
                                        {idx + 1}/{order.materials.length}
                                    </div>
                                )}
                            </div>

                            {/* Precise Location UI */}
                            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Warehouse Bin Location</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Qator', value: mat.row, color: 'text-amber-400', bg: 'bg-amber-500/10 outline-amber-500/20' },
                                        { label: 'Javon', value: mat.shelf, color: 'text-blue-400', bg: 'bg-blue-500/10 outline-blue-500/20' },
                                        { label: 'Pozitsiya', value: mat.position, color: 'text-purple-400', bg: 'bg-purple-500/10 outline-purple-500/20' },
                                        { label: 'BIN ID', value: mat.binLocation, color: 'text-white', bg: 'bg-white/5 outline-white/10' },
                                    ].map(loc => (
                                        <div key={loc.label} className={`text-center p-3 rounded-xl outline outline-1 ${loc.bg}`}>
                                            <div className={`text-2xl font-black leading-none mb-1.5 ${loc.color}`}>{loc.value}</div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{loc.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {order.status === 'PICKING' && !mat.isDone && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => markMaterialDone(order.id, mat.materialId)}
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98]"
                                    >
                                        Confirm Full Gathering
                                    </button>
                                    <button
                                        onClick={() => {
                                            const qty = prompt(`Enter quantity picked for ${mat.materialName}:`, mat.requestedQty.toString());
                                            if (qty && !isNaN(Number(qty))) {
                                                usePickingStore.getState().partialPick(order.id, mat.materialId, Number(qty));
                                                toast.info(`Partial pick recorded: ${qty} ${mat.unit}`);
                                            }
                                        }}
                                        className="px-6 py-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-500 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all"
                                    >
                                        Partial
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-900/30 border-t border-white/5 p-6 flex-shrink-0">
                    {order.status === 'PICKING' && (() => {
                        const allDone = order.materials.every(m => m.isDone);
                        return (
                            <button
                                onClick={() => { if (allDone) { startDelivering(order.id); onClose(); } }}
                                disabled={!allDone}
                                className="w-full py-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:grayscale text-white rounded-[1.5rem] text-[11px] font-black tracking-widest uppercase transition-all shadow-xl shadow-purple-900/20"
                            >
                                {allDone ? '🚚 Move to Line Delivery' : `⏳ Waiting for ${order.materials.filter(m => !m.isDone).length} Materials`}
                            </button>
                        );
                    })()}

                    {order.status === 'DELIVERING' && (
                        <button
                            onClick={() => { markDelivered(order.id); onClose(); }}
                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] text-[11px] font-black tracking-widest uppercase transition-all animate-pulse shadow-xl shadow-emerald-900/20"
                        >
                            ✅ Finalize Delivery to Line
                        </button>
                    )}

                    {order.status === 'DELIVERED' && (
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl py-5 flex items-center justify-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="text-emerald-500 text-xs font-black tracking-[0.2em] uppercase">
                                Success: Handover Complete @ {new Date(order.deliveredAt!).toLocaleTimeString('uz')}
                            </span>
                        </div>
                    )}

                    <button onClick={onClose} className="w-full mt-3 py-2 text-slate-600 hover:text-white text-[10px] font-black tracking-widest uppercase transition-colors">
                        Close Investigation
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
        </div>
    );
};
