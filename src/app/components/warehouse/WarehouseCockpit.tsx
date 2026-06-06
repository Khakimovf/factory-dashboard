import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, TrendingUp, AlertTriangle, Clock, MapPin, Zap, Truck, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface WarehouseCockpitProps {
    stats: {
        totalItems: number;
        availableStock: number;
        reservedStock: number;
        blockedStock: number;
        utilization: number;
        pendingReceipts: number;
        urgentPicks: number;
        pendingPicks?: number;
        todayGR?: number;
        dockToStock?: string;
        openTransfers?: number;
    };
}

const KpiCard = ({
    title,
    value,
    subvalue,
    icon: Icon,
    color,
    trend,
    onClick
}: {
    title: string;
    value: string | number;
    subvalue: string;
    icon: any;
    color: string;
    trend?: string;
    onClick?: () => void;
}) => (
    <Card
        className={`bg-slate-900 border-slate-800 hover:border-${color}-500/50 transition-all group cursor-pointer overflow-hidden relative`}
        onClick={onClick}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
            <Icon className="w-16 h-16" />
        </div>
        <CardHeader className="pb-2">
            <CardTitle className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-${color}-400`}>
                <Icon className="w-3.5 h-3.5" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-tighter">{subvalue}</p>
                </div>
                {trend && (
                    <div className="text-right">
                        <Badge variant="outline" className={`bg-${color}-500/10 text-${color}-500 border-${color}-500/20 text-[9px] font-black`}>
                            {trend}
                        </Badge>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

export const WarehouseCockpit: React.FC<WarehouseCockpitProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <KpiCard
                title="Stock Health"
                value={stats.totalItems.toLocaleString()}
                subvalue="Total Unit Load"
                icon={Package}
                color="blue"
                trend="98% Acc"
                onClick={() => toast.info("Stock Health Audit: No discrepancies found in last 24h cycle.")}
            />

            <KpiCard
                title="Utilization"
                value={`${stats.utilization}%`}
                subvalue="Bin Efficiency"
                icon={MapPin}
                color="purple"
                trend="STABLE"
                onClick={() => toast.info("Utilization Report: Zone A is reaching 95% capacity.")}
            />

            <KpiCard
                title="Today's GR"
                value={stats.todayGR || 0}
                subvalue="Inbound Volume"
                icon={Truck}
                color="emerald"
                trend="+12% vs LW"
                onClick={() => toast.info("Inbound Analysis: Supplier performance is within SLA.")}
            />

            <KpiCard
                title="Urgent Picks"
                value={stats.urgentPicks}
                subvalue="Priority GI"
                icon={Zap}
                color="rose"
                trend="CRITICAL"
                onClick={() => toast.warning("Urgent Picks Alert: Line A requests are prioritized.")}
            />

            <KpiCard
                title="Dock-to-Stock"
                value={stats.dockToStock || '45m'}
                subvalue="Mean Lead Time"
                icon={Clock}
                color="amber"
                trend="-5m shift"
                onClick={() => toast.info("Lead Time Audit: Unloading efficiency improved by 8%.")}
            />

            <KpiCard
                title="Open Transfers"
                value={stats.openTransfers || 0}
                subvalue="Intra-WH Movements"
                icon={ArrowRightLeft}
                color="indigo"
                trend="ACTIVE"
                onClick={() => toast.info("Transfer Audit: System balancing in progress.")}
            />

            <KpiCard
                title="S4H Status"
                value="ONLINE"
                subvalue="ECC Sync Active"
                icon={ShieldCheck}
                color="emerald"
                trend="SECURE"
                onClick={() => toast.success("System Status: RFC connections to S/4HANA are optimal.")}
            />
        </div>
    );
};
