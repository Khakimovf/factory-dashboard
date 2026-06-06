import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Box, Send, Clock, CheckCircle2, AlertCircle, Search, Filter, Printer } from 'lucide-react';
import { Input } from '../ui/input';
import { toast } from 'sonner';

interface OutboundOrder {
    id: string;
    customer: string;
    status: 'Pending' | 'Picking' | 'Staging' | 'Shipped';
    priority: 'High' | 'Normal';
    items: number;
    time: string;
}

export const GoodsIssueManager: React.FC = () => {
    const [orders, setOrders] = useState<OutboundOrder[]>([
        { id: 'DEL-88291', customer: 'Automotive Plant A', status: 'Pending', priority: 'High', items: 12, time: '10:30' },
        { id: 'DEL-88295', customer: 'Assembly Line B', status: 'Picking', priority: 'Normal', items: 5, time: '11:15' },
        { id: 'DEL-88301', customer: 'Global Export Corp', status: 'Pending', priority: 'Normal', items: 45, time: '14:00' },
    ]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-slate-800 text-slate-400 border-slate-700';
            case 'Picking': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'Staging': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Shipped': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-500" />
                        Outbound Deliveries
                    </h2>
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">SAP SD Integrated</Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-slate-950 border-slate-800">
                        <Printer className="w-4 h-4 mr-2" />
                        Print Pick Lists
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Create Shipment
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Ready to Pick</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14 <span className="text-sm font-normal text-muted-foreground ml-1">Orders</span></div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">In Staging</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">6 <span className="text-sm font-normal text-muted-foreground ml-1">Orders</span></div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Shipped Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">142 <span className="text-sm font-normal text-muted-foreground ml-1">Orders</span></div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Filter Deliveries..." className="pl-9 h-9 bg-slate-950 border-slate-800 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase">All</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase text-blue-500">Urgent</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase">Delayed</Button>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead>Delivery ID</TableHead>
                            <TableHead>Destination / Customer</TableHead>
                            <TableHead>Qty Items</TableHead>
                            <TableHead>Target Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="border-slate-800 hover:bg-slate-800/20 group">
                                <TableCell className="font-mono text-sm font-bold flex items-center gap-2">
                                    {order.priority === 'High' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
                                    {order.id}
                                </TableCell>
                                <TableCell className="font-medium">{order.customer}</TableCell>
                                <TableCell>{order.items} Units</TableCell>
                                <TableCell className="text-muted-foreground text-sm flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {order.time}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        toast.success(`Pick List for ${order.id} generated.`);
                                    }}>
                                        Process
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
