import React, { useState } from 'react';
import { Hash, User } from 'lucide-react';
import { usePickingStore, PickingOrder } from '../../store/pickingStore';
import { PickingDetailModal } from './PickingDetailModal';
import { AssignWorkerModal } from './AssignWorkerModal';

const statusStyle = {
    PENDING: 'bg-red-500/10 text-red-500 border-red-500/20',
    ACCEPTED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    PICKING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    DELIVERING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    DELIVERED: 'bg-green-500/10 text-green-500 border-green-500/20'
};

const borderColor = {
    PENDING: 'border-red-500/20 bg-red-500/[0.02]',
    ACCEPTED: 'border-yellow-500/20 bg-yellow-500/[0.02]',
    PICKING: 'border-blue-500/20 bg-blue-500/[0.02]',
    DELIVERING: 'border-purple-500/20 bg-purple-500/[0.02]',
    DELIVERED: 'border-green-500/20 bg-green-500/[0.02]'
};

const statusLabel = {
    PENDING: '⏳ KUTILMOQDA',
    ACCEPTED: '👤 QABUL QILINGAN',
    PICKING: '🔄 YIG\'ILMOQDA',
    DELIVERING: '🚚 YO\'LDA',
    DELIVERED: '✅ YETKAZILDI'
};

const priorityBg = {
    HIGH: 'bg-red-600 text-white',
    NORMAL: 'bg-blue-600 text-white',
    LOW: 'bg-slate-700 text-white'
};

export const PickingOrderCard = ({ order }: { order: PickingOrder }) => {
    const { acceptOrder, startPicking, startDelivering, markDelivered } = usePickingStore();
    const [showDetail, setShowDetail] = useState(false);
    const [showAssign, setShowAssign] = useState(false);

    const doneCount = order.materials.filter(m => m.isDone).length;
    const totalCount = order.materials.length;

    return (
        <>
            <div className={`border rounded-2xl p-6 transition-all hover:shadow-2xl hover:bg-white/[0.03] group ${borderColor[order.status]}`}>
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md tracking-tighter uppercase ${priorityBg[order.priority]}`}>
                            {order.priority}
                        </span>
                        <span className="text-white font-mono font-bold text-lg tracking-tight uppercase">{order.id}</span>
                    </div>
                    <span className={`text-[10px] px-3 py-1.5 rounded-lg border font-black tracking-widest uppercase ${statusStyle[order.status]}`}>
                        {statusLabel[order.status]}
                    </span>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="opacity-50">🏭</span>
                            <span className="text-blue-400 font-bold uppercase tracking-tight">{order.lineName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-base">
                            <span className="opacity-50">📦</span>
                            <span className="text-white font-black">{order.productName}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Plan & Shift</p>
                            <p className="text-xs text-slate-300 font-bold">{order.planDate} | {order.shift}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Target Qty</p>
                            <p className="text-sm text-white font-black">{order.targetQty} <span className="text-[10px] opacity-40 uppercase">pcs</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-[10px] text-white/40 font-black uppercase tracking-widest mb-6 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Hash className="w-3 h-3 text-blue-500" /> {totalCount} Materials</span>
                    {order.assignedTo && <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><User className="w-3 h-3 text-yellow-500" /> {order.assignedTo}</span>}
                    <span className="flex items-center gap-2 ml-auto opacity-30">Created: {new Date(order.createdAt).toLocaleTimeString('uz')}</span>
                </div>

                {/* Progress bar — faqat PICKING holatida */}
                {order.status === 'PICKING' && (
                    <div className="mb-6 bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                        <div className="flex justify-between text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">
                            <span>Picking Progress</span>
                            <span>{doneCount}/{totalCount} materials gathered</span>
                        </div>
                        <div className="h-1.5 bg-blue-950 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-700"
                                style={{ width: `${(doneCount / totalCount) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 justify-end mt-4">
                    <button
                        onClick={() => setShowDetail(true)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black rounded-xl tracking-widest uppercase transition-all border border-white/5"
                    >
                        📋 View Zayavka
                    </button>

                    {order.status === 'PENDING' && (
                        <button
                            onClick={() => setShowAssign(true)}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl tracking-widest uppercase transition-all shadow-lg shadow-emerald-900/20"
                        >
                            ✅ Accept Order
                        </button>
                    )}
                    {order.status === 'ACCEPTED' && (
                        <button
                            onClick={() => startPicking(order.id)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-xl tracking-widest uppercase transition-all shadow-lg shadow-blue-900/20"
                        >
                            🔄 Start Picking
                        </button>
                    )}
                    {order.status === 'PICKING' && (
                        <button
                            onClick={() => { if (doneCount === totalCount) startDelivering(order.id); }}
                            disabled={doneCount < totalCount}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[10px] font-black rounded-xl tracking-widest uppercase transition-all shadow-lg shadow-purple-900/20"
                        >
                            🚚 Move to Line
                        </button>
                    )}
                    {order.status === 'DELIVERING' && (
                        <button
                            onClick={() => markDelivered(order.id)}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-xl tracking-widest uppercase transition-all animate-pulse shadow-lg shadow-emerald-900/20"
                        >
                            📦 Confirm Delivery
                        </button>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showDetail && (
                <PickingDetailModal order={order} onClose={() => setShowDetail(false)} />
            )}
            {showAssign && (
                <AssignWorkerModal
                    onAssign={(name) => { acceptOrder(order.id, name); setShowAssign(false); }}
                    onClose={() => setShowAssign(false)}
                />
            )}
        </>
    );
};
