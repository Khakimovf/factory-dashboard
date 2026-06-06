import React, { useState } from 'react';
import { usePickingStore, PickingOrder } from '../../store/pickingStore';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    Clock, User, Package, Truck, CheckCircle2,
    AlertCircle, Search, Filter, Calendar, Hash, Zap, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { PickingOrderCard } from './PickingOrderCard';

const KpiCard = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: React.ReactNode }) => (
    <Card className="bg-slate-900/50 border-slate-800 shadow-xl backdrop-blur-sm overflow-hidden group">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">{label}</p>
                    <p className={`text-3xl font-black text-white`}>{value}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
            </div>
            <div className={`h-1 w-full bg-slate-800 mt-4 rounded-full overflow-hidden`}>
                <div className={`h-full ${color}`} style={{ width: '65%' }} />
            </div>
        </CardContent>
    </Card>
);

export default function PickingOrdersTab() {
    const { orders } = usePickingStore();
    const [search, setSearch] = useState('');

    const pending = orders.filter(o => o.status === 'PENDING');
    const accepted = orders.filter(o => o.status === 'ACCEPTED');
    const picking = orders.filter(o => o.status === 'PICKING');
    const delivering = orders.filter(o => o.status === 'DELIVERING');

    const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.lineName.toLowerCase().includes(search.toLowerCase()) ||
        o.productName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* KPI Strip */}
            <div className="grid grid-cols-4 gap-4">
                <KpiCard label="Kutilayotgan" value={pending.length} color="bg-red-500" icon={<Clock className="w-5 h-5 text-red-500" />} />
                <KpiCard label="Qabul qilingan" value={accepted.length} color="bg-yellow-500" icon={<User className="w-5 h-5 text-yellow-500" />} />
                <KpiCard label="Yig'ilmoqda" value={picking.length} color="bg-blue-500" icon={<Package className="w-5 h-5 text-blue-500" />} />
                <KpiCard label="Yetkazilmoqda" value={delivering.length} color="bg-purple-500" icon={<Truck className="w-5 h-5 text-purple-500" />} />
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-2 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="flex-1 flex items-center gap-3 px-4">
                    <Search className="w-4 h-4 text-slate-500" />
                    <input
                        placeholder="Zayavka ID, Liniya yoki Mahsulot bo'yicha qidirish..."
                        className="bg-transparent border-none p-0 h-10 focus:outline-none text-sm w-full text-slate-200 placeholder:text-slate-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <Button
                        variant="outline"
                        className="h-10 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 font-black uppercase text-[10px] tracking-widest text-blue-400 group"
                        onClick={() => toast.success("Wave Picking Strategy Initialized")}
                    >
                        <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" /> Wave Picking
                    </Button>
                    <Button variant="outline" className="h-10 border-slate-800 bg-slate-950/50 hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-400">
                        <Printer className="w-4 h-4 mr-2" /> Print All
                    </Button>
                    <div className="h-6 w-px bg-slate-800 mx-2" />
                    <Button variant="outline" className="h-10 border-slate-800 bg-slate-950/50 hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest text-slate-400">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                </div>
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 gap-4">
                {filtered.length > 0 ? (
                    filtered.map(order => (
                        <PickingOrderCard key={order.id} order={order} />
                    ))
                ) : (
                    <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
                        <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Zayavkalar topilmadi</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] px-2 text-slate-600 font-black uppercase tracking-widest italic opacity-50">
                <span>Total Active Picking Orders: {filtered.length}</span>
                <span className="flex items-center gap-2 text-blue-500">Live picking stream connected <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /></span>
            </div>
        </div>
    );
}
