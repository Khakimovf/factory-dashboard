import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import {
    Construction, Activity, Zap, Layers, ArrowLeft,
    Settings, AlertCircle, RefreshCw, Box, MoveRight,
    Thermometer, Gauge, ShieldAlert, CheckCircle2,
    Database, Cpu, History, BarChart3, PenTool
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';

const MOLD_LIBRARY = [
    { id: 'M-1024-PL', name: 'Plastic Casing V1', sku: 'PC-V1', cycle: 12.5 },
    { id: 'M-2055-HS', name: 'Housing Shield', sku: 'HS-78', cycle: 15.0 },
    { id: 'M-3011-RG', name: 'Rear Grille', sku: 'RG-09', cycle: 18.2 },
    { id: 'M-4044-BT', name: 'Button Set', sku: 'BS-XP', cycle: 8.5 }
];

export function TPAMoldingCockpit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { productionLines, updateProductionLine, updateMaterialQuantity, updateTPAMachine } = useFactory();
    const line = productionLines.find(l => l.id === id);

    const [ticker, setTicker] = useState<{ line: string, qty: number, time: string, sku: string }[]>([]);
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [telemetry, setTelemetry] = useState<Record<string, { temp: number; pressure: number }>>({});

    // Dynamic Telemetry Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setTelemetry(prev => {
                const newTel = { ...prev };
                line?.tpaData?.machines.forEach(m => {
                    if (m.status === 'running') {
                        newTel[m.id] = {
                            temp: 230 + (Math.random() * 4 - 2),
                            pressure: 1800 + (Math.random() * 20 - 10)
                        };
                    }
                });
                return newTel;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, [line]);

    if (!line || line.type !== 'tpa_molding') {
        return <div className="p-8 text-red-500 italic font-black uppercase">TPA DATA STREAM OFFLINE</div>;
    }

    const handleProduce = (machineId: string) => {
        const machine = line.tpaData?.machines.find(m => m.id === machineId);
        if (!machine) return;

        const producedQty = 20;
        updateMaterialQuantity('5', producedQty + 180);

        const targetLines = ['Line A', 'Line B', 'SAP Inpanel'];
        const targetLine = targetLines[Math.floor(Math.random() * targetLines.length)];

        setTicker(prev => [{
            line: targetLine,
            qty: producedQty,
            sku: machine.mold.split('-')[1] || 'COMP',
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 8));

        toast.success(`Batch Produced (Machine ${machineId})`, {
            description: `Sent ${producedQty} units to ${targetLine}.`
        });
    };

    const handleMoldChange = (machineId: string, moldId: string) => {
        const mold = MOLD_LIBRARY.find(m => m.id === moldId);
        if (!mold) return;

        updateTPAMachine(line.id, machineId, {
            mold: mold.id,
            cycleTime: mold.cycle,
            status: 'setup'
        });

        toast.info(`Mold Change Initiated: ${moldId}`, {
            description: "Machine entered SETUP mode."
        });
    };

    const toggleMachineStatus = (machineId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'running' ? 'stopped' : 'running';
        updateTPAMachine(line.id, machineId, { status: newStatus });

        if (newStatus === 'stopped') {
            toast.error(`Machine ${machineId} HALTED`, {
                description: "Supply chain risk triggered for SAP Cockpit."
            });
        } else {
            toast.success(`Machine ${machineId} RESUMED`);
        }
    };

    return (
        <div className="p-8 bg-slate-950 min-h-full text-slate-100 font-mono selection:bg-purple-500/30">
            {/* Blueprint Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#a855f7_1px,transparent_1px),linear-gradient(to_bottom,#a855f7_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(`/production-lines/${id}`)}
                        className="p-2 border border-slate-800 hover:border-purple-500/50 rounded transition-colors text-slate-500 hover:text-purple-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-3">
                            <span className="text-purple-500">[</span> TPA-MASS-INJECTION <span className="text-purple-500">]</span>
                        </h1>
                        <p className="text-[10px] text-purple-500/60 font-bold uppercase tracking-[0.2em]">High-Telemetry Molding Command • Section: {line.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Molding OEE</span>
                        <span className="text-2xl font-black text-purple-400 leading-none">{line.efficiency}.4%</span>
                    </div>
                    <div className="h-10 w-px bg-slate-800" />
                    <button className="p-2 bg-slate-950 border border-slate-800 rounded hover:border-purple-500 transition-colors shadow-xl">
                        <Settings className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                {/* Core KPIs */}
                <div className="bg-slate-900/40 border border-slate-800 rounded p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-16 h-16 text-yellow-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Average Cycle</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">13.4</span>
                        <span className="text-sm font-bold text-slate-500 italic uppercase">sec</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-tighter">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Optimal Range Verified
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded p-6 relative overflow-hidden group hover:border-rose-500/30 transition-colors shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert className="w-16 h-16 text-rose-500" />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Scrap Rate</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-rose-500 tracking-tighter">{line.tpaData?.scrapRate || 1.2}%</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-rose-500/70 uppercase">
                        <AlertCircle className="w-3 h-3" />
                        Correction Required
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded p-6 shadow-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tooling Status</span>
                    <div className="flex items-center gap-3 mt-2">
                        <h3 className="text-3xl font-black text-white">{line.tpaData?.machines.filter(m => m.status === 'running').length || 0}</h3>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-green-500 font-black uppercase">Active Molds</span>
                            <span className="text-[8px] text-slate-600 font-black uppercase">Ready for Shift</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-purple-500/20 rounded p-6 shadow-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Factory Feed Flow</span>
                    <div className="flex items-center gap-3 text-green-400 mt-2">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="text-sm font-black uppercase tracking-tight">Healthy Pipeline</span>
                    </div>
                    <p className="text-[9px] text-slate-600 mt-3 italic leading-tight uppercase font-bold tracking-tighter">Molding synchronized with SAP Inpanel buffers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                {/* Machine Monitoring Grid */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black text-purple-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <Cpu className="w-4 h-4" />
                            Diagnostic Machine grid
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {line.tpaData?.machines.map(machine => (
                            <div key={machine.id} className="bg-slate-900/60 border border-slate-800 rounded p-6 group hover:border-purple-500/40 transition-all duration-300 shadow-2xl">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{machine.id}</h3>
                                        <Badge variant="outline" className="text-[8px] border-slate-700 text-slate-500 uppercase mt-1">Injection Station</Badge>
                                    </div>
                                    <button
                                        onClick={() => toggleMachineStatus(machine.id, machine.status)}
                                        className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-all ${machine.status === 'running' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                                            machine.status === 'setup' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                            }`}
                                    >
                                        {machine.status}
                                    </button>
                                </div>

                                {/* Telemetry Gauges (Simulated) */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-950 p-4 border border-slate-800 rounded relative group/intel">
                                        <Thermometer className="w-3 h-3 text-rose-500 absolute top-2 right-2 opacity-50" />
                                        <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">Melt Temp</span>
                                        <span className="text-xl font-black text-slate-200">
                                            {telemetry[machine.id]?.temp.toFixed(1) || '---'}
                                            <span className="text-[10px] text-slate-600 ml-1">°C</span>
                                        </span>
                                        <div className="mt-2 h-1 w-full bg-slate-900 rounded-full">
                                            <div className="h-full bg-rose-500 w-[75%]" />
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-4 border border-slate-800 rounded relative">
                                        <Gauge className="w-3 h-3 text-cyan-400 absolute top-2 right-2 opacity-50" />
                                        <span className="text-[8px] font-black text-slate-600 uppercase block mb-1">Pressure</span>
                                        <span className="text-xl font-black text-slate-200">
                                            {telemetry[machine.id]?.pressure.toFixed(0) || '---'}
                                            <span className="text-[10px] text-slate-600 ml-1">PSI</span>
                                        </span>
                                        <div className="mt-2 h-1 w-full bg-slate-900 rounded-full">
                                            <div className="h-full bg-cyan-400 w-[60%]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded border border-dashed border-slate-800 mb-6 group-hover:border-purple-500/30 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-600 uppercase">Loaded Tooling</span>
                                        <span className="text-xs font-black text-purple-400 uppercase tracking-tighter italic">{machine.mold}</span>
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:text-white">
                                                <PenTool className="w-4 h-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-slate-900 border-slate-800 text-white font-mono">
                                            <DialogHeader>
                                                <DialogTitle className="text-white uppercase font-black">Change Mold: {machine.id}</DialogTitle>
                                            </DialogHeader>
                                            <div className="py-6 space-y-4">
                                                {MOLD_LIBRARY.map(mold => (
                                                    <button
                                                        key={mold.id}
                                                        onClick={() => handleMoldChange(machine.id, mold.id)}
                                                        className={`w-full p-4 border rounded-xl flex items-center justify-between group transition-all ${machine.mold === mold.id ? 'bg-purple-500 text-slate-950 border-purple-400' : 'bg-slate-950 border-slate-800 hover:border-purple-500/50'
                                                            }`}
                                                    >
                                                        <div className="text-left">
                                                            <p className="font-black uppercase text-sm leading-none">{mold.id}</p>
                                                            <p className={`text-[10px] font-bold uppercase mt-1 ${machine.mold === mold.id ? 'text-slate-900' : 'text-slate-500'}`}>{mold.name}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black uppercase">Cycle: {mold.cycle}s</p>
                                                            <p className={`text-[10px] font-black uppercase ${machine.mold === mold.id ? 'text-slate-900' : 'text-purple-500'}`}>SKU: {mold.sku}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleProduce(machine.id)}
                                        disabled={machine.status !== 'running'}
                                        className="flex-1 py-3 bg-purple-600 border border-purple-500 hover:bg-purple-700 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] disabled:opacity-10 shadow-lg shadow-purple-600/20"
                                    >
                                        Trigger Cycle
                                    </button>
                                    <button
                                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-rose-500/50 text-slate-600 hover:text-rose-500 transition-all"
                                        onClick={() => navigate('/maintenance/failure-reports/new')}
                                    >
                                        <ShieldAlert className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logistics Hub */}
                <div className="lg:col-span-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black text-amber-500 flex items-center gap-2 uppercase tracking-[0.2em]">
                            <MoveRight className="w-4 h-4" />
                            Logistics Hub Stream
                        </h2>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded p-6 flex-1 flex flex-col shadow-2xl">
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] mb-6 pr-2 custom-scrollbar">
                            {ticker.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                                    <RefreshCw className="w-12 h-12 mb-4 animate-spin-slow text-slate-500" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Output</p>
                                </div>
                            ) : (
                                ticker.map((t, i) => (
                                    <div key={i} className="bg-slate-950 p-4 border border-slate-800 rounded flex items-center justify-between group animate-in slide-in-from-right duration-500 hover:border-amber-500/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                <Box className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-white uppercase">{t.line}</span>
                                                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase">DISPATCHED</Badge>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">+{t.qty} Units [{t.sku}]</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-slate-700 font-black uppercase">{t.time}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="bg-slate-950 p-5 rounded border border-slate-800 relative overflow-hidden group mt-auto">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">System Feed Health</span>
                                <span className="text-xs font-black text-amber-500">92%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-4">
                                <div className="h-full bg-amber-500 w-[92%] shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all duration-1000" />
                            </div>
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4 text-slate-700 font-black" />
                                <p className="text-[8px] text-slate-600 leading-relaxed font-bold uppercase tracking-tighter">Real-time inventory bridge active. TPA-MASS-01 feeding SAP Inpanel buffers directly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
