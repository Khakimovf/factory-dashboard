import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import {
    Cpu, Package, QrCode, ClipboardCheck, ArrowLeft,
    ChevronRight, CheckCircle2, AlertTriangle, Scan, History,
    Settings2, Box, Layers, Activity, Zap, PenTool
} from 'lucide-react';
import { toast } from 'sonner';

export function SAPInpanelCockpit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { productionLines, updateProductionLine, materials } = useFactory();
    const line = productionLines.find(l => l.id === id);

    const [bins, setBins] = useState<{ id: string; current: number; target: number; skuId: string }[]>([]);
    const [queue, setQueue] = useState<{ skuId: string; name: string; bomStatus: string; qty: number }[]>([]);
    const [verificationQueue, setVerificationQueue] = useState<{ batchId: string; skuId: string; timestamp: string; status: 'pending' | 'signed' }[]>([]);

    useEffect(() => {
        if (line?.sapData) {
            setBins(line.sapData.bins);
            setQueue(line.sapData.productionQueue);
            setVerificationQueue(line.sapData.awaitingVerification || []);
        }
    }, [line?.id]);

    if (!line || line.type !== 'sap_inpanel') {
        return <div className="p-8 text-red-500">SAP Line not found or invalid type</div>;
    }

    // TPA Synergy Data
    const tpaLine = productionLines.find(l => l.type === 'tpa_molding');
    const tpaMachines = tpaLine?.tpaData?.machines || [];

    const handleLogUnit = (binId: string) => {
        setBins(prev => prev.map(b => {
            if (b.id === binId && b.current < b.target) {
                return { ...b, current: b.current + 1 };
            }
            return b;
        }));
    };

    const finalizeBin = (binId: string) => {
        const bin = bins.find(b => b.id === binId);
        if (!bin || bin.current < bin.target) return;

        const batchId = `SAP-${binId}-${Date.now().toString().slice(-4)}`;
        const newVerification = {
            batchId,
            skuId: bin.skuId,
            timestamp: new Date().toLocaleTimeString(),
            status: 'pending' as const
        };

        setVerificationQueue(prev => [newVerification, ...prev]);

        // Reset bin and update completed count
        setBins(prev => prev.map(b => b.id === binId ? { ...b, current: 0 } : b));

        updateProductionLine(line.id, {
            sapData: {
                ...line.sapData!,
                bins: bins.map(b => b.id === binId ? { ...b, current: 0 } : b),
                awaitingVerification: [newVerification, ...(line.sapData?.awaitingVerification || [])],
                completedBins: (line.sapData?.completedBins || 0) + 1
            },
            output: line.output + bin.target
        });

        toast.success(`Bin ${binId} completed. Awaiting Batch Verification.`);
    };

    const verifyBatch = (batchId: string) => {
        setVerificationQueue(prev => prev.map(v => v.batchId === batchId ? { ...v, status: 'signed' } : v));
        toast.success(`Batch ${batchId} digitally signed by QC.`);
    };

    return (
        <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-mono selection:bg-cyan-500/30">
            {/* Blueprint Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#22d3ee_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(`/production-lines/${id}`)}
                        className="p-2 border border-slate-800 hover:border-cyan-500/50 rounded transition-colors text-slate-500 hover:text-cyan-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-3">
                            <span className="text-cyan-400">[</span> SAP-COMPLEX-ASSEMBLY <span className="text-cyan-400">]</span>
                        </h1>
                        <p className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-[0.2em]">High-Mix Production Cockpit • Station: SAP-HMIX-04</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global OEE Index</span>
                        <span className="text-xl font-black text-cyan-400 leading-none">{line.efficiency}.8%</span>
                    </div>
                    <div className="h-10 w-px bg-slate-800" />
                    <button className="p-2 bg-slate-900 border border-slate-800 rounded hover:border-cyan-500 transition-colors">
                        <Settings2 className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">

                {/* LEFT COLUMN: Production Grid & Supply Bridge */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Multi-SKU Production Board */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded p-6">
                        <h2 className="text-xs font-black text-cyan-400 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                            <Layers className="w-4 h-4" />
                            High-Mix Production Board
                        </h2>
                        <div className="space-y-3">
                            {queue.map((sku, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded group hover:border-cyan-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-6 rounded-full ${sku.bomStatus === 'Complete' ? 'bg-cyan-500' :
                                            sku.bomStatus === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                                            } shadow-[0_0_8px_rgba(34,211,238,0.2)]`} />
                                        <div>
                                            <p className="text-[11px] font-black text-white">{sku.skuId}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">{sku.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${sku.bomStatus === 'Complete' ? 'bg-cyan-500/10 text-cyan-400' :
                                            sku.bomStatus === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            BOM {sku.bomStatus}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* TPA Supply Chain Bridge */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded p-6">
                        <h2 className="text-xs font-black text-cyan-400 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                            <Activity className="w-4 h-4" />
                            TPA Supply Chain Bridge
                        </h2>
                        <div className="space-y-4">
                            {line.requiredMaterials.map((rm, i) => {
                                const m = materials.find(mat => mat.id === rm.materialId);
                                const isTpaComponent = rm.materialId === '5'; // Plastic Casings from TPA-01
                                const tpaMachine = tpaMachines.find(mac => mac.id === 'TPA-01');
                                const isHalt = isTpaComponent && tpaMachine?.status !== 'running';

                                return (
                                    <div key={i} className={`p-4 border rounded transition-all ${isHalt ? 'bg-red-500/5 border-red-500/40 animate-pulse' : 'bg-slate-950 border-slate-800'
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">{m?.name}</span>
                                            <span className={`text-[10px] font-bold ${isHalt ? 'text-red-400' : 'text-cyan-400'}`}>
                                                {m?.quantity} {m?.unit}
                                            </span>
                                        </div>
                                        {isTpaComponent && (
                                            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-900">
                                                <span className="text-[8px] text-slate-500 uppercase">Input Feed: TPA-01</span>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isHalt ? 'bg-red-500' : 'bg-green-500'}`} />
                                                    <span className={`text-[8px] font-black uppercase ${isHalt ? 'text-red-500' : 'text-green-500'}`}>
                                                        {isHalt ? 'TPA Production Halt' : 'Active Flow'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: Multi-Bin Controller */}
                <div className="lg:col-span-5">
                    <div className="bg-slate-900/40 border border-cyan-500/20 rounded p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Layers className="w-32 h-32 text-cyan-400" />
                        </div>

                        <h2 className="text-xs font-black text-cyan-400 mb-8 flex items-center gap-2 uppercase tracking-widest relative z-10">
                            <Box className="w-4 h-4" />
                            Multi-Bin Controller [SYS-ID: XM-04]
                        </h2>

                        <div className="grid grid-cols-2 gap-6 relative z-10">
                            {bins.map((bin) => (
                                <div key={bin.id} className="bg-slate-950 border border-slate-800 rounded p-5 relative group hover:border-cyan-500/50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-black text-cyan-400 tracking-tighter">{bin.id}</span>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase">{bin.skuId}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-white">{bin.current} / {bin.target}</span>
                                    </div>

                                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-6 border border-slate-800">
                                        <div
                                            className={`h-full transition-all duration-300 ${bin.current >= bin.target ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-700'}`}
                                            style={{ width: `${(bin.current / bin.target) * 100}%` }}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLogUnit(bin.id)}
                                            disabled={bin.current >= bin.target}
                                            className="flex-1 py-1.5 bg-slate-900 border border-slate-800 text-[9px] font-black uppercase tracking-tighter hover:bg-slate-800 disabled:opacity-20 transition-all"
                                        >
                                            Log Unit
                                        </button>
                                        {bin.current >= bin.target && (
                                            <button
                                                onClick={() => finalizeBin(bin.id)}
                                                className="flex-1 py-1.5 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase tracking-tighter hover:bg-cyan-400 animate-pulse"
                                            >
                                                Print QR
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest">
                            <span>Active Virtual Buffers: 4/4</span>
                            <span>Bin Capacity Variance: Adaptive</span>
                        </div>
                    </div>

                    <div className="mt-6 p-6 bg-cyan-950/20 border border-cyan-500/20 rounded flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                                <Zap className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-cyan-400 uppercase">Live Efficiency Signal</p>
                                <p className="text-[9px] text-cyan-500/50 uppercase">Operational Parity Verified</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-black text-white">99.2</span>
                            <span className="text-[8px] text-cyan-400 font-bold">STABILITY</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Quality Gate / Verification */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded flex flex-col h-full min-h-[600px]">
                        <div className="p-6 border-b border-slate-800">
                            <h2 className="text-xs font-black text-cyan-400 flex items-center gap-2 uppercase tracking-tighter">
                                <ClipboardCheck className="w-4 h-4" />
                                Batch verification
                            </h2>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {verificationQueue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                    <History className="w-12 h-12 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Buffer Empty</p>
                                </div>
                            ) : (
                                verificationQueue.map((v, i) => (
                                    <div key={i} className={`p-4 border rounded ${v.status === 'signed' ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-slate-950 border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-500 uppercase mb-1">Lot Number</span>
                                                <span className="text-xs font-black text-white leading-none">{v.batchId}</span>
                                            </div>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${v.status === 'signed' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                {v.status === 'signed' ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-[8px] text-slate-600 font-bold">{v.timestamp}</span>
                                            {v.status === 'pending' && (
                                                <button
                                                    onClick={() => verifyBatch(v.batchId)}
                                                    className="text-[9px] font-black text-cyan-400 hover:text-white flex items-center gap-1 group"
                                                >
                                                    <PenTool className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                    Sign Lot
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Verification Rate</span>
                                <span className="text-[10px] font-black text-cyan-400">100% Target</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase">
                                    <span>Approved today</span>
                                    <span>{line.sapData?.completedBins || 0}</span>
                                </div>
                                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase">
                                    <span>Pending QC</span>
                                    <span>{verificationQueue.filter(v => v.status === 'pending').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
