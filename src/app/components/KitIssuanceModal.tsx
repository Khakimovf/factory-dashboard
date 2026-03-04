import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Package, MapPin, Zap, AlertCircle, QrCode, CheckCircle2, ShieldAlert } from 'lucide-react';

import { PickListItem } from '../context/WarehouseContext';

export interface KitIssuanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    items: PickListItem[];
    onIssueToLine: (planId: string) => void;
}

export function KitIssuanceModal({ isOpen, onClose, planId, items, onIssueToLine }: KitIssuanceModalProps) {
    const [isIssuing, setIsIssuing] = useState(false);
    const [scannedItems, setScannedItems] = useState<Set<string>>(new Set());

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setIsIssuing(false);
            setScannedItems(new Set());
        }
    }, [isOpen]);

    // Check for critical stock shortages that completely prevent scanning/issuing
    const hasCriticalShortages = items.some(item => item.currentStock < item.requiredQty);

    // All items must be scanned, and there must not be critical shortages
    const canIssue = scannedItems.size === items.length && !hasCriticalShortages && items.length > 0;

    const handleScan = (id: string, hasShortage: boolean) => {
        if (hasShortage) return; // Prevent scanning if there's no stock

        setScannedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleIssue = () => {
        if (!canIssue) return;
        setIsIssuing(true);
        // Simulate API delay for realism
        setTimeout(() => {
            onIssueToLine(planId);
            setIsIssuing(false);
        }, 800);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-border bg-background">
                {/* HEADER */}
                <div className="p-4 flex-shrink-0 border-b border-border bg-muted/30 flex justify-between items-start">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                            <Package className="w-5 h-5 text-primary" />
                            Kit Issuance Review (Pick-List)
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs flex items-center">
                            Verify required material manifest for Production Plan: <strong className="text-foreground tracking-widest bg-foreground/5 px-1.5 py-0.5 rounded border border-border/50 ml-1 mr-3">{planId}</strong>
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1 font-bold tracking-wider"><MapPin className="w-3 h-3" /> SORTED OPTIMAL PICK PATH</span>
                        </DialogDescription>
                    </DialogHeader>

                    {hasCriticalShortages && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded text-xs font-bold shadow-sm">
                            <ShieldAlert className="w-4 h-4" /> INSUFFICIENT INVENTORY DETECTED
                        </div>
                    )}
                </div>

                {/* DATA GRID */}
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-xs leading-tight select-none">
                        <thead className="bg-muted/90 border-b border-border text-muted-foreground font-semibold sticky top-0 backdrop-blur-md z-10 shadow-sm uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-3 py-2 text-left w-12 border-r border-border/40 text-center">Scan</th>
                                <th className="px-3 py-2 text-left border-r border-border/40 w-28">Part Number</th>
                                <th className="px-3 py-2 text-left border-r border-border/40">Part Name</th>
                                <th className="px-3 py-2 text-left border-r border-border/40 w-24">Location</th>
                                <th className="px-3 py-2 text-right border-r border-border/40 w-24">Req. Qty</th>
                                <th className="px-3 py-2 text-center w-36">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {useMemo(() => [...items].sort((a, b) => a.binLocation.localeCompare(b.binLocation)), [items]).map((item) => {
                                const hasShortage = item.currentStock < item.requiredQty;
                                const isScanned = scannedItems.has(item.id);

                                return (
                                    <tr
                                        key={item.id}
                                        className={`transition-colors group ${hasShortage
                                            ? 'bg-red-500/5 hover:bg-red-500/10'
                                            : isScanned
                                                ? 'bg-green-500/5 hover:bg-green-500/10'
                                                : 'hover:bg-muted/30'
                                            }`}
                                    >
                                        <td className={`px-3 py-2 border-r border-border/30 text-center ${isScanned ? 'border-l-2 border-l-green-500' : hasShortage ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-transparent'}`}>
                                            <Button
                                                size="icon"
                                                variant={isScanned ? "default" : "outline"}
                                                className={`w-7 h-7 rounded-sm ${isScanned ? 'bg-green-600 hover:bg-green-700' : hasShortage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={() => handleScan(item.id, hasShortage)}
                                                disabled={hasShortage}
                                                title={hasShortage ? "Cannot scan: Insufficient stock" : "Scan QR"}
                                            >
                                                {isScanned ? <CheckCircle2 className="w-4 h-4 text-white" /> : <QrCode className="w-4 h-4" />}
                                            </Button>
                                        </td>
                                        <td className="px-3 py-2.5 font-mono text-xs font-bold text-foreground border-r border-border/30 tracking-tight">{item.partNumber}</td>
                                        <td className="px-3 py-2.5 font-medium text-foreground border-r border-border/30">{item.name}</td>
                                        <td className="px-3 py-2.5 text-muted-foreground border-r border-border/30">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted border border-border/50 font-mono text-[10px] uppercase font-bold text-foreground">
                                                <MapPin className="w-3 h-3 text-muted-foreground" /> {item.binLocation}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-bold text-foreground border-r border-border/30 text-sm">
                                            {item.requiredQty.toLocaleString()} <span className="text-[9px] font-normal opacity-70 uppercase">pcs</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            {hasShortage ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-red-500 font-bold tracking-wide uppercase text-[10px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Insufficient Stock</span>
                                                    <span className="text-[9px] mt-0.5 text-muted-foreground">Have: {item.currentStock.toLocaleString()}</span>
                                                </div>
                                            ) : isScanned ? (
                                                <span className="text-green-500 font-bold tracking-widest uppercase text-[11px] flex items-center justify-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground font-semibold tracking-wider uppercase text-[10px]">Awaiting Scan</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 border-t border-border flex justify-between items-center bg-muted/40 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground text-sm">
                                Progress: {scannedItems.size} / {items.length} Scanned
                            </span>
                            {scannedItems.size > 0 && scannedItems.size < items.length && !hasCriticalShortages && (
                                <span className="text-xs text-blue-500 font-semibold animate-pulse">Scanning in progress...</span>
                            )}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-semibold">
                            All components must be physically scanned to issue kit
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="px-6 font-bold h-10 text-xs shadow-sm">Cancel</Button>

                        {/* Developer Tool: Auto-Scan All Button (For simulation ease) */}
                        {!hasCriticalShortages && scannedItems.size < items.length && (
                            <Button
                                variant="secondary"
                                onClick={() => setScannedItems(new Set(items.map(i => i.id)))}
                                className="h-10 text-xs px-4"
                            >
                                Auto-Scan All
                            </Button>
                        )}

                        <Button
                            onClick={handleIssue}
                            disabled={!canIssue || isIssuing}
                            className={`font-black px-8 shadow-md h-10 text-xs uppercase tracking-wider transition-all border border-transparent ${canIssue && !isIssuing ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]' : 'opacity-60 grayscale'}`}
                        >
                            {isIssuing ? (
                                <span className="flex items-center gap-2 animate-pulse">
                                    <Zap className="w-4 h-4 fill-current" /> Transferring...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 fill-current" />
                                    Issue To Line <span className="text-[9px] capitalize opacity-80 font-semibold">(Liniyaga chiqarish)</span>
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
