import React from 'react';
import {
    Bell, AlertTriangle, Package,
    Truck, ArrowRight, Info
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
    DropdownMenuSeparator, DropdownMenuLabel
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const mockNotifications = [
    { id: 1, type: 'ALERT', message: 'Low Stock: Wire Harness (WH-CV-007)', time: '2m ago', icon: AlertTriangle, color: 'text-rose-500' },
    { id: 2, type: 'TASK', message: 'New Picking Request PK-105 for Line B', time: '15m ago', icon: Package, color: 'text-blue-500' },
    { id: 3, type: 'LOGISTICS', message: 'Truck TRK-001-AB arrived at Gate 2', time: '22m ago', icon: Truck, color: 'text-amber-500' },
];

export default function NotificationDropdown() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 border border-slate-800 bg-slate-900/50 rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all">
                    <Bell className="w-5 h-5 text-slate-400" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#020617]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] bg-[#020617] border-slate-800 text-slate-100 p-0 shadow-2xl rounded-2xl overflow-hidden">
                <DropdownMenuLabel className="bg-slate-900/50 px-5 py-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-black uppercase tracking-tight">Supply Chain Alerts</span>
                        <Badge className="bg-blue-600/10 text-blue-500 border-blue-500/20 text-[9px] font-black uppercase">3 New</Badge>
                    </div>
                </DropdownMenuLabel>

                <div className="max-h-[400px] overflow-y-auto">
                    {mockNotifications.map((n, i) => (
                        <React.Fragment key={n.id}>
                            <DropdownMenuItem className="px-5 py-4 flex items-start gap-4 hover:bg-slate-900/50 cursor-pointer focus:bg-slate-900/50">
                                <div className={`w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 ${n.color} bg-opacity-5`}>
                                    <n.icon className={`w-5 h-5 ${n.color}`} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-xs font-bold text-slate-200 leading-snug">{n.message}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-mono italic">{n.time}</span>
                                        <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1 group">
                                            Resolve <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                            {i < mockNotifications.length - 1 && <DropdownMenuSeparator className="bg-slate-800 mx-5" />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="p-3 bg-slate-950/50 border-t border-slate-800">
                    <Button variant="ghost" className="w-full text-center text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest h-10">
                        <Info className="w-3 h-3 mr-2" /> View All Maintenance Logs
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
