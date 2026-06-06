import { useState } from 'react';
import { motion } from 'motion/react';
import {
    ShoppingBag, Users, TrendingUp, Plus, Search, Building,
    ArrowUpRight, Clock, AlertTriangle, Package, Truck, XCircle,
    FileText, ShoppingCart, ChevronDown, ChevronRight, CheckCircle,
    ClipboardList, Zap, Copy, Send, BarChart3, RefreshCw, Shield
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSales, SalesOrder, SalesOrderStatus } from '../../context/SalesContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

export const CUSTOMERS = [
    { name: 'UzAuto Motors', contact: 'Mirzo Yusupov', email: 'procurement@uzautomotors.uz', phone: '+998 71 100-00-01', segment: 'Platinum', partnerNum: '0000100045' },
    { name: 'GM Uzbekistan', contact: 'Alisher Niyazov', email: 'a.niyazov@gm.uz', phone: '+998 90 123-45-67', segment: 'Gold', partnerNum: '0000100046' },
    { name: 'Hyundai Parts UZ', contact: 'Choi Min', email: 'c.min@hyundai.uz', phone: '+998 71 456-78-90', segment: 'Silver', partnerNum: '0000100047' },
    { name: 'KIA Motors UZ', contact: 'Lee Sang', email: 'l.sang@kia.uz', phone: '+998 71 567-89-01', segment: 'Gold', partnerNum: '0000100048' },
];

export const STATUS_CONFIG: Record<SalesOrderStatus, { label: string; color: string; dot: string }> = {
    DRAFT: { label: 'Draft', color: 'bg-slate-500/15 text-slate-400 border-slate-500/25', dot: 'bg-slate-500' },
    ATP_CHECK: { label: 'ATP Check', color: 'bg-sky-500/15 text-sky-400 border-sky-500/25', dot: 'bg-sky-400' },
    CONFIRMED: { label: 'Confirmed', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25', dot: 'bg-blue-500' },
    PICKING_PENDING: { label: 'Pick Pending', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25', dot: 'bg-violet-500' },
    PICKING: { label: 'Picking', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25', dot: 'bg-purple-500' },
    PACKING: { label: 'Packing', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dot: 'bg-amber-500' },
    GOODS_ISSUED: { label: 'Goods Issued', color: 'bg-orange-500/15 text-orange-400 border-orange-500/25', dot: 'bg-orange-500' },
    SHIPPED: { label: 'Shipped', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25', dot: 'bg-cyan-400' },
    DELIVERED: { label: 'Delivered', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-500' },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-500/15 text-red-400 border-red-500/25', dot: 'bg-red-500' },
};

export const FLOW_STEPS: SalesOrderStatus[] = ['DRAFT', 'ATP_CHECK', 'CONFIRMED', 'PICKING_PENDING', 'PICKING', 'PACKING', 'GOODS_ISSUED', 'SHIPPED', 'DELIVERED'];

export function StatusPill({ status }: { status: SalesOrderStatus }) {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

export function FlowBar({ status }: { status: SalesOrderStatus }) {
    if (status === 'CANCELLED') return (
        <div className="flex items-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[9px] text-red-400 font-black uppercase">Order Cancelled</span>
        </div>
    );
    const idx = FLOW_STEPS.indexOf(status);
    return (
        <div className="flex items-center gap-0.5 py-1">
            {FLOW_STEPS.map((s, i) => {
                const done = i < idx; const active = i === idx;
                return (
                    <div key={s} className="flex items-center">
                        <div className={`w-2 h-2 rounded-full transition-all ${done ? 'bg-emerald-500' : active ? 'bg-cyan-400 ring-2 ring-cyan-400/30' : 'bg-slate-700'}`} />
                        {i < FLOW_STEPS.length - 1 && <div className={`w-4 h-0.5 ${i < idx ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                    </div>
                );
            })}
        </div>
    );
}

export function AuditTrail({ order }: { order: SalesOrder }) {
    return (
        <div className="pl-4 border-l-2 border-slate-800 ml-4 space-y-3 py-2">
            {[...order.auditLog].reverse().map((entry, i) => (
                <div key={i} className="relative pl-4">
                    <div className="absolute -left-[9px] top-1 w-3 h-3 rounded-full border-2 border-slate-800 bg-slate-900" />
                    <div className="flex items-center gap-2 mb-0.5">
                        <StatusPill status={entry.toStatus} />
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    {entry.note && <p className="text-[10px] text-slate-400">{entry.note}</p>}
                    <p className="text-[9px] text-slate-600">by {entry.actor} · {entry.role}</p>
                </div>
            ))}
        </div>
    );
}

export function ATPModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
    const { runATPCheck, confirmOrder, salesOrders } = useSales();
    const order = salesOrders.find(o => o.id === orderId);
    const [result, setResult] = useState(order?.atpResult || null);
    const [checked, setChecked] = useState(!!order?.atpResult);

    const doCheck = () => {
        const r = runATPCheck(orderId);
        setResult(r); setChecked(true);
    };
    const doConfirm = () => { confirmOrder(orderId); toast.success(`${orderId} confirmed — ready for picking`); onClose(); };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-sky-500/30 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-base font-black text-white flex items-center gap-2"><Zap className="w-5 h-5 text-sky-400" /> ATP Check — {orderId}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-400">Availability-to-Promise check against real-time finished goods stock.</p>
                    {!checked ? (
                        <Button onClick={doCheck} className="w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-widest rounded-xl gap-2">
                            <RefreshCw className="w-4 h-4" /> Run ATP Check
                        </Button>
                    ) : result && (
                        <div className="space-y-3">
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${result.available ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                {result.available ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                                <span className={`font-black text-sm ${result.available ? 'text-emerald-300' : 'text-red-300'}`}>
                                    {result.available ? 'ALL ITEMS AVAILABLE ✓' : 'STOCK SHORTAGE DETECTED'}
                                </span>
                            </div>
                            {result.items.map(item => (
                                <div key={item.sku} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs text-cyan-400 font-bold">{item.sku}</span>
                                        {item.shortfall > 0 && <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">SHORT: {item.shortfall.toLocaleString()} PCS</span>}
                                    </div>
                                    <p className="text-xs text-slate-300 mb-2">{item.productName}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Requested', value: item.requested, color: 'text-white' },
                                            { label: 'Available', value: item.available, color: item.available >= item.requested ? 'text-emerald-400' : 'text-red-400' },
                                        ].map(c => (
                                            <div key={c.label} className="bg-slate-900 rounded-lg p-2">
                                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{c.label}</p>
                                                <p className={`text-base font-black font-mono ${c.color}`}>{c.value.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={onClose} className="flex-1 h-10 border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs">Close</Button>
                                <Button onClick={doConfirm} disabled={!result.available}
                                    className={`flex-1 h-10 font-black rounded-xl text-xs uppercase tracking-widest ${result.available ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                                    Confirm Order
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export function OrderRow({ order }: { order: SalesOrder }) {
    const { confirmOrder, startPicking, executeGoodsIssue, confirmShipment, confirmDelivery, cancelOrder } = useSales();
    const [expanded, setExpanded] = useState(false);
    const [showATP, setShowATP] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const totalQty = order.lines.reduce((s, l) => s + l.quantity, 0);
    const canCancel = !['DELIVERED', 'CANCELLED', 'GOODS_ISSUED', 'SHIPPED'].includes(order.status);

    const handleAction = () => {
        switch (order.status) {
            case 'DRAFT': setShowATP(true); break;
            case 'ATP_CHECK': confirmOrder(order.id); toast.success(`${order.id} confirmed`); break;
            case 'CONFIRMED': startPicking(order.id); toast.success('Pick list created — go to FG Picking tab'); break;
            case 'PACKING': executeGoodsIssue(order.id); toast.success(`GI executed for ${order.id} — IDoc generated`); break;
            case 'GOODS_ISSUED': confirmShipment(order.id); toast.success('Shipment confirmed'); break;
            case 'SHIPPED': confirmDelivery(order.id); toast.success('Delivery confirmed — POD received'); break;
        }
    };

    const getActionLabel = () => {
        const map: Partial<Record<SalesOrderStatus, string>> = {
            DRAFT: 'Run ATP Check',
            ATP_CHECK: 'Confirm Order',
            CONFIRMED: 'Start Picking',
            PACKING: 'Execute GI',
            GOODS_ISSUED: 'Confirm Shipment',
            SHIPPED: 'Confirm Delivery',
        };
        return map[order.status] || null;
    };

    const actionLabel = getActionLabel();

    return (
        <>
            {showATP && <ATPModal orderId={order.id} onClose={() => setShowATP(false)} />}
            <div className={`border-b border-slate-800/70 transition-colors ${expanded ? 'bg-slate-900/60' : 'hover:bg-slate-800/20'}`}>
                <div className="px-5 py-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                    <div className="shrink-0">{expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}</div>
                    <span className="font-mono text-xs font-black text-violet-400 w-28 shrink-0">{order.id}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">{order.customer}</p>
                        <p className="text-[10px] text-slate-500 truncate">{order.lines.map(l => l.productName).join(', ')}</p>
                    </div>
                    <div className="text-right shrink-0 hidden md:block">
                        <p className="text-sm font-black font-mono text-white">{totalQty.toLocaleString()} <span className="text-[9px] text-slate-500">PCS</span></p>
                        <p className="text-[10px] text-slate-400 font-mono">{(order.totalAmount / 1000000).toFixed(2)}M UZS</p>
                    </div>
                    <div className="shrink-0 hidden sm:block"><FlowBar status={order.status} /></div>
                    <div className="shrink-0"><StatusPill status={order.status} /></div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 hidden lg:block">{order.createdAt.split('T')[0]}</span>
                    <div className="shrink-0 flex gap-2" onClick={e => e.stopPropagation()}>
                        {actionLabel && (
                            <Button size="sm" onClick={handleAction}
                                className="h-7 text-[9px] font-black uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-3">
                                {actionLabel}
                            </Button>
                        )}
                        {canCancel && (
                            <button onClick={() => setShowCancel(!showCancel)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Cancel Inline */}
                {showCancel && (
                    <div className="px-5 pb-4 flex items-center gap-3 border-t border-slate-800/50 pt-3 bg-red-950/10">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <Input value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Cancellation reason (required)..."
                            className="h-8 bg-slate-950 border-red-500/30 text-white text-xs flex-1 rounded-lg" />
                        <Button size="sm" disabled={!cancelReason.trim()} onClick={() => { cancelOrder(order.id, cancelReason); setShowCancel(false); toast.error(`${order.id} cancelled`); }}
                            className="h-8 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[9px] rounded-lg px-3">Cancel SO</Button>
                        <button onClick={() => setShowCancel(false)} className="text-slate-500"><XCircle className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Expanded: Lines + Audit Trail */}
                {expanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-slate-800/50 pt-4">
                        {/* Order Lines */}
                        <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                            <div className="grid grid-cols-[1fr_80px_100px_90px_100px] gap-3 px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                <span>Product</span><span>SKU</span><span className="text-right">Qty (PCS)</span><span className="text-right">Unit Price</span><span className="text-right">Line Total</span>
                            </div>
                            {order.lines.map(l => (
                                <div key={l.sku} className="grid grid-cols-[1fr_80px_100px_90px_100px] gap-3 px-4 py-3 items-center text-xs border-b border-slate-800/50 last:border-0">
                                    <span className="font-bold text-slate-200">{l.productName}</span>
                                    <span className="font-mono text-cyan-400 text-[10px]">{l.sku}</span>
                                    <span className="text-right font-black font-mono text-white">{l.quantity.toLocaleString()}</span>
                                    <span className="text-right font-mono text-slate-400">{l.unitPrice.toLocaleString()}</span>
                                    <span className="text-right font-black font-mono text-emerald-400">{l.lineTotal.toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="px-4 py-2.5 border-t border-slate-800 flex justify-end gap-6 text-xs font-black">
                                <span className="text-slate-400">Subtotal: <span className="text-white font-mono">{order.subtotal.toLocaleString()}</span></span>
                                {order.discount > 0 && <span className="text-amber-400">Discount: {order.discount}%</span>}
                                <span className="text-emerald-400">TOTAL: <span className="font-mono text-base">{order.totalAmount.toLocaleString()} UZS</span></span>
                            </div>
                        </div>

                        {/* SAP Partner Info */}
                        {order.sapPartnerNumber && (
                            <div className="flex items-center gap-4 text-[10px] text-slate-500 bg-slate-950 rounded-xl px-4 py-2.5 border border-slate-800">
                                <Shield className="w-3.5 h-3.5 text-violet-400" />
                                <span>SAP Partner: <span className="font-mono text-violet-400 font-black">{order.sapPartnerNumber}</span></span>
                                <span>Incoterms: <span className="font-mono text-slate-300">{order.incoterms}</span></span>
                                {order.deliveryNoteNumber && <span>DN: <span className="font-mono text-cyan-400 font-black">{order.deliveryNoteNumber}</span></span>}
                            </div>
                        )}

                        {/* Audit Trail */}
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" /> Audit Trail</p>
                            <AuditTrail order={order} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
