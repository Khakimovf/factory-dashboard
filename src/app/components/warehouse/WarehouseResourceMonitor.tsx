import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
    User, Activity, Clock, MapPin, CheckCircle2,
    ArrowRightLeft, AlertCircle, X, Shield, Box, Users, UserPlus, Zap
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useWarehouseStore, WarehouseResource } from '../../store/warehouseStore';
import { toast } from 'sonner';

export const WarehouseResourceMonitor: React.FC = () => {
    const { resources, equipment, addEmployee, updateEquipmentStatus } = useWarehouseStore();
    const [shiftFilter, setShiftFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ALL');
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<WarehouseResource | null>(null);
    const [isReassignOpen, setIsReassignOpen] = useState(false);

    const filteredResources = useMemo(() => {
        if (shiftFilter === 'ALL') return resources;
        return resources.filter(r => r.shift === shiftFilter);
    }, [resources, shiftFilter]);

    const handleReassign = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Task successfully reassigned for ${selectedWorker?.name}`, {
            description: "Resource schedule updated in SAP S/4HANA EWM."
        });
        setIsReassignOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-500" />
                        Human & Machine Assets
                    </h3>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mt-1">Resource allocation and status monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl mr-4">
                        {['ALL', 'MORNING', 'AFTERNOON', 'NIGHT'].map(s => (
                            <button
                                key={s}
                                onClick={() => setShiftFilter(s as any)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${shiftFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <Button
                        onClick={() => setIsAddEmployeeOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 h-10 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                        <UserPlus className="w-4 h-4" /> Add Personnel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Roster */}
                <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-950/50 border-b border-slate-800 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black uppercase text-white">Personnel Roster</CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase text-slate-500">Active warehouse workers by shift</CardDescription>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">{filteredResources.length} Count</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950/30 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Employee</th>
                                        <th className="px-6 py-4">Role / Zone</th>
                                        <th className="px-6 py-4">Efficiency</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredResources.map(res => (
                                        <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-400 group-hover:border-blue-500/40 group-hover:text-blue-400 transition-colors">
                                                        {res.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white">{res.name}</p>
                                                        <p className="text-[9px] font-mono text-slate-500 uppercase">{res.shift} Shift</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-300">{res.role}</p>
                                                <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mt-1">Zone: {res.zone || 'Staging'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${res.efficiency > 90 ? 'bg-emerald-500' : res.efficiency > 75 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${res.efficiency}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono font-black text-white">{res.efficiency}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${res.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} border-transparent text-[9px] font-black`}>
                                                    {res.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[9px] font-black uppercase text-slate-500 hover:text-white"
                                                    onClick={() => { setSelectedWorker(res); setIsReassignOpen(true); }}
                                                >
                                                    Reassign
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Equipment Status */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800 shadow-xl rounded-[2rem] overflow-hidden border-t-4 border-t-blue-500">
                        <CardHeader className="bg-slate-950/50 border-b border-slate-800 p-6">
                            <CardTitle className="text-sm font-black uppercase text-white flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                MHE Fleet Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {equipment.map(item => (
                                <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 group hover:border-blue-500/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                                                <Activity className={`w-4 h-4 ${item.status === 'AVAILABLE' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase">{item.name}</p>
                                                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">{item.id}</p>
                                            </div>
                                        </div>
                                        <Badge className={`text-[9px] font-black ${item.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'} border-transparent`}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                        <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Area-01</div>
                                        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {item.batteryLevel}% Bat</div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-600 border-none shadow-xl shadow-blue-900/40 rounded-[2rem] p-6 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <Zap className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <h4 className="font-black uppercase text-xs tracking-widest opacity-80">Safety Incident Score</h4>
                            <p className="text-4xl font-black italic tracking-tighter">0.0</p>
                            <p className="text-[10px] font-bold uppercase opacity-70">Perfect Safety Record — 182 Days</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Reassign Modal */}
            <Modal
                isOpen={isReassignOpen}
                onClose={() => setIsReassignOpen(false)}
                title={selectedWorker ? `Task Reassignment: ${selectedWorker.name}` : 'Reassign Task'}
            >
                {selectedWorker && (
                    <form onSubmit={handleReassign} className="space-y-6">
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                            <AlertCircle className="w-6 h-6 text-blue-500" />
                            <p className="text-xs font-bold text-blue-200/80">
                                This action will override current assignments in SAP EWM. Ensure resource balance before confirming.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Task Priority</Label>
                                    <select className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold uppercase text-white outline-none focus:border-blue-500/50">
                                        <option>HIGH — Urgent</option>
                                        <option>MEDIUM — Routine</option>
                                        <option>LOW — Optional</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Task Category</Label>
                                    <select className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold uppercase text-white outline-none focus:border-blue-500/50">
                                        <option>PICKING</option>
                                        <option>PUTAWAY</option>
                                        <option>TRANSFER</option>
                                        <option>BINNING</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Destination Zone</Label>
                                <Input className="bg-slate-950 border-slate-800 h-11 font-mono uppercase text-xs" placeholder="ZONE-ALPHA-12" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[11px] h-12 shadow-xl shadow-blue-900/20">
                                Confirm Reassignment
                            </Button>
                            <Button type="button" variant="ghost" className="text-slate-500 font-black uppercase tracking-widest text-[11px] h-12" onClick={() => setIsReassignOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};
