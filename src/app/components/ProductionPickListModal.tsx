import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Package, Check, MapPin } from 'lucide-react';

export interface PickListItem {
    id: string;
    name: string;
    partNumber: string;
    requiredQty: number;
    binLocation: string;
}

export interface ProductionPickListModalProps {
    isOpen: boolean;
    onClose: () => void;
    planId: string;
    items: PickListItem[];
    onConfirm: () => void;
}

export function ProductionPickListModal({ isOpen, onClose, planId, items, onConfirm }: ProductionPickListModalProps) {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const toggleCheck = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const next = new Set(checkedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCheckedItems(next);
    };

    const toggleAll = () => {
        if (checkedItems.size === items.length) setCheckedItems(new Set());
        else setCheckedItems(new Set(items.map(i => i.id)));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[750px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border-border">
                <div className="p-5 flex-shrink-0 border-b border-border bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="w-5 h-5 text-primary" />
                            Production Kit Pick-List
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            Review and verify required materials for <strong className="text-foreground tracking-wide">{planId}</strong>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-0 bg-background">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/80 border-b border-border text-muted-foreground font-semibold sticky top-0 backdrop-blur-md z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-left w-12 border-r border-border/50">
                                    <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-primary cursor-pointer w-4 h-4 translate-y-0.5"
                                        checked={checkedItems.size === items.length && items.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">Part Name</th>
                                <th className="px-4 py-3 text-left">Part Number</th>
                                <th className="px-4 py-3 text-left">Bin Location</th>
                                <th className="px-4 py-3 text-right">Req. Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {items.map(item => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-muted/40 transition-colors cursor-pointer ${checkedItems.has(item.id) ? 'bg-primary/5' : ''}`}
                                    onClick={() => toggleCheck(item.id)}
                                >
                                    <td className="px-4 py-2 border-r border-border/30 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-input text-primary focus:ring-primary cursor-pointer w-4 h-4 translate-y-0.5"
                                            checked={checkedItems.has(item.id)}
                                            onChange={(e) => toggleCheck(item.id, e as any)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>
                                    <td className="px-4 py-2.5 font-medium text-foreground">{item.name}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">{item.partNumber}</td>
                                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/50 border border-border/50">
                                            <MapPin className="w-3 h-3" /> {item.binLocation}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-bold text-foreground tracking-tight">
                                        {item.requiredQty.toLocaleString()} <span className="text-[10px] font-normal opacity-70 uppercase">pcs</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20 flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                            {checkedItems.size} of {items.length} verified
                        </span>
                        {checkedItems.size !== items.length && (
                            <span className="text-xs text-muted-foreground">Please verify all parts to issue.</span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} className="px-6 font-medium">Cancel</Button>
                        <Button
                            onClick={() => {
                                onConfirm();
                                setCheckedItems(new Set()); // reset on success
                            }}
                            disabled={checkedItems.size !== items.length}
                            className="font-semibold px-6 shadow-md"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm Issuance
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
