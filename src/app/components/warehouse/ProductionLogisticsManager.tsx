import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
    Truck, Smartphone, CheckCircle2, Box, Scan, Zap, User, MapPin,
    Clock, Printer, ArrowLeft, ChevronRight, Navigation, Loader2,
    Monitor, Maximize2, History, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { useWarehouse, MockRequest } from '../../context/WarehouseContext';
import { useFactory } from '../../context/FactoryContext';

export const ProductionLogisticsManager: React.FC = () => {
    const { requests, updateRequestStatus, assignRequest, markItemAsPicked, dispatchRequestToLine } = useWarehouse();
    const { updateMaterialQuantity } = useFactory();
    const [activeTSD, setActiveTSD] = useState<MockRequest | null>(null);

    // TSD Scanner Internal State
    const [scanStep, setScanStep] = useState<'BIN' | 'SKU'>('BIN');
    const [scannedValue, setScannedValue] = useState('');
    const [isDispatching, setIsDispatching] = useState(false);

    const currentRequest = useMemo(() => {
        if (!activeTSD) return null;
        return requests.find(r => r.id === activeTSD.id) || activeTSD;
    }, [activeTSD, requests]);

    const sortedItems = useMemo(() => {
        if (!currentRequest) return [];
        return [...currentRequest.items].sort((a, b) =>
            (a.binLocation || '').localeCompare(b.binLocation || '')
        );
    }, [currentRequest]);

    const nextItem = useMemo(() => {
        return sortedItems.find(item => !item.isPicked);
    }, [sortedItems]);

    const allPicked = useMemo(() => {
        return sortedItems.length > 0 && sortedItems.every(item => item.isPicked);
    }, [sortedItems]);

    const handleAcceptRequest = (requestId: string) => {
        assignRequest(requestId, 'WM_USER_KHK');
        updateRequestStatus(requestId, 'Issuing');
        toast.info("Task assigned to WM_USER_KHK. Picking mode active.");
    };

    const handleScan = () => {
        if (!currentRequest || !nextItem) return;

        if (scanStep === 'BIN') {
            if (scannedValue.toUpperCase() === (nextItem.binLocation || 'A-01-01')) {
                setScanStep('SKU');
                setScannedValue('');
                toast.success("Location Verified ✅");
            } else {
                toast.error("Wrong Bin!", { description: `Expected: ${nextItem.binLocation}` });
            }
        } else if (scanStep === 'SKU') {
            if (scannedValue.toUpperCase() === nextItem.partNumber) {
                markItemAsPicked(currentRequest.id, nextItem.id);
                setScanStep('BIN');
                setScannedValue('');

                const remaining = sortedItems.filter(i => !i.isPicked).length;
                if (remaining === 1) {
                    toast.success("All Items Picked!", { description: "Moving to Dispatch phase." });
                } else {
                    toast.success(`${nextItem.name} Picked ✅`);
                }
            } else {
                toast.error("Invalid Material!", { description: `Expected: ${nextItem.partNumber}` });
            }
        }
    };

    const handleDispatch = async () => {
        if (!currentRequest || !allPicked) return;
        setIsDispatching(true);
        await new Promise(r => setTimeout(r, 1200));

        currentRequest.items.forEach(item => {
            updateMaterialQuantity(item.partNumber, -item.requiredQty);
        });

        dispatchRequestToLine(currentRequest.id);
        setIsDispatching(false);
        setActiveTSD(null);
        toast.success("Liniyaga yetkazilmoqda! 🟢");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[750px]">
            {/* COLUMN 1: Warehouse Queue & Production Orders */}
            <div className="space-y-6 flex flex-col h-full">
                <Card className="bg-slate-900 border-slate-800 shadow-2xl flex flex-col h-full border-t-4 border-t-amber-500 overflow-hidden">
                    <CardHeader className="bg-slate-950/50 border-b border-slate-800 p-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-white">
                                <Truck className="w-4 h-4 text-amber-500" />
                                PP-EWM Logistics Request Queue
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] font-mono text-cyan-400 border-cyan-500/20">
                                SAP S/4HANA EWM
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {requests.map(req => (
                                <div key={req.id} className={`p-4 rounded-xl border transition-all ${req.status === 'Pending' ? 'bg-slate-950 border-slate-800' :
                                        req.status === 'Issuing' ? 'bg-amber-500/5 border-amber-500/30' :
                                            req.status === 'IN_TRANSIT_TO_LINE' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-800 opacity-50'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Request ID</span>
                                            <span className="text-xs font-mono font-bold text-white">{req.id}</span>
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] font-black tracking-widest uppercase border-transparent ${req.status === 'Pending' ? 'text-slate-500 bg-slate-950' :
                                                req.status === 'Issuing' ? 'text-amber-500 bg-amber-500/5' :
                                                    'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                            }`}>
                                            {req.status === 'Pending' ? '🔴 PRE-ORDER' :
                                                req.status === 'Issuing' ? '🟡 PICKING' : '🟢 TRANSIT'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{req.items.length} items to {req.destination}</span>
                                            <span className="text-[9px] text-slate-600 font-mono italic">{req.time}</span>
                                        </div>
                                        {req.status === 'Pending' ? (
                                            <Button size="sm" className="h-8 text-[10px] font-black bg-blue-600" onClick={() => handleAcceptRequest(req.id)}>ACCEPT</Button>
                                        ) : req.status === 'Issuing' ? (
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-black border-amber-500/40 text-amber-500" onClick={() => setActiveTSD(req)}>TSD SCAN</Button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-5 h-5 text-emerald-500" />
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-[2rem]">
                    <CardHeader className="bg-slate-950 border-b border-slate-800 py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center justify-between">
                            Production Orders (PP-SAP)
                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">LIVE</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-800">
                            {[
                                { id: '1004552', line: 'Assy-Line 1', item: 'Door Trim FR', qty: 500, state: 'Staging' },
                                { id: '1004558', line: 'Assy-Line 2', item: 'Body Panel RL', qty: 200, state: 'Ready' },
                            ].map((po, i) => (
                                <div key={i} className="p-4 hover:bg-white/[0.01] transition-colors flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-xs text-white">PO {po.id}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">{po.item} → {po.line}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-xs text-slate-200">{po.qty} PCS</p>
                                        <Button variant="ghost" size="sm" className="h-6 text-[9px] text-blue-500 font-black uppercase p-0">Fulfill Task</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* COLUMN 2: SAP Terminal Simulation / TSD */}
            <div className="flex flex-col h-full">
                {currentRequest ? (
                    <Card className={`flex-1 transition-all duration-700 border-slate-800 shadow-3xl flex flex-col border-t-4 overflow-hidden ${allPicked ? 'bg-emerald-950/40 border-t-emerald-500' : 'bg-slate-900 border-t-blue-500'
                        }`}>
                        <CardHeader className="bg-slate-950/50 border-b border-slate-800 p-4">
                            <CardTitle className="text-sm font-black uppercase flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <Smartphone className={`w-4 h-4 ${allPicked ? 'text-emerald-400' : 'text-blue-500'}`} />
                                    Terminal Session
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono opacity-50">{currentRequest.id}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <button onClick={() => setActiveTSD(null)} className="text-slate-500 hover:text-white flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                                        <ArrowLeft className="w-4 h-4" /> Exit
                                    </button>
                                    <span className={`text-[10px] font-black uppercase ${allPicked ? 'text-emerald-500' : 'text-blue-500'}`}>
                                        {allPicked ? 'ALL ITEMS READY' : 'PICKING IN PROGRESS'}
                                    </span>
                                </div>

                                {!allPicked && nextItem ? (
                                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                                        <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
                                            <div className="flex justify-between border-b border-slate-800 pb-4">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bin</p>
                                                    <p className="text-2xl font-black font-mono text-white tracking-widest">{nextItem.binLocation}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qty</p>
                                                    <p className="text-2xl font-black text-amber-500 font-mono">{nextItem.requiredQty}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-bold text-slate-300 uppercase">{nextItem.name}</p>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder={scanStep === 'BIN' ? "Scan Bin..." : "Scan SKU..."}
                                                    value={scannedValue}
                                                    onChange={e => setScannedValue(e.target.value)}
                                                    className="h-12 bg-black border-slate-700 font-mono text-xs"
                                                    onKeyDown={e => e.key === 'Enter' && handleScan()}
                                                />
                                                <Button onClick={handleScan} className="h-12 w-12 bg-blue-600"><Scan /></Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : allPicked ? (
                                    <div className="text-center py-10 space-y-6">
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase italic">READY FOR DISPATCH</h3>
                                        <Button className="w-full h-16 bg-emerald-600 font-black uppercase text-lg shadow-xl" onClick={handleDispatch} disabled={isDispatching}>
                                            {isDispatching ? <Loader2 className="animate-spin" /> : 'SEND TO PRODUCTION LINE'}
                                        </Button>
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-950 rounded-2xl border border-white/5">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                                    <User className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase">Operator</p>
                                    <p className="text-xs font-black text-slate-200">KHK_WM_PICKER</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex-1 bg-black border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">SAP S/4HANA EWM TERMINAL</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500"><Maximize2 className="w-3 h-3" /></Button>
                        </div>
                        <div className="flex-1 p-8 font-mono text-[11px] text-emerald-400/80 space-y-6">
                            <div className="space-y-1">
                                <p className="text-emerald-500 font-bold">VGM_WM_STAGING_CTRL_01</p>
                                <p>Session: ACTIVE | Area: 01 | SLoc: WH01</p>
                                <p className="opacity-30">--------------------------------------------------</p>
                            </div>

                            <div className="p-6 border border-emerald-500/20 rounded-2xl bg-emerald-500/5 text-center space-y-4">
                                <Monitor className="w-12 h-12 text-emerald-500/40 mx-auto" />
                                <p className="text-xs font-black uppercase text-emerald-500 tracking-widest">Waiting for Task Selection</p>
                                <p className="text-[9px] opacity-60">Select an active picking request from the queue to initialize the scanning terminal.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/50">
                                    <p className="text-slate-500 uppercase text-[9px] mb-2 font-black">Today's Throughput</p>
                                    <p className="text-xl font-black text-white">1,240 <span className="text-[10px] opacity-50">PCS</span></p>
                                </div>
                                <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/50">
                                    <p className="text-slate-500 uppercase text-[9px] mb-2 font-black">Open Transfers</p>
                                    <p className="text-xl font-black text-amber-500">12 <span className="text-[10px] opacity-50">TASKS</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
