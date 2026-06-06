import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useWarehouse } from './WarehouseContext';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SalesOrderStatus =
    | 'DRAFT'
    | 'ATP_CHECK'
    | 'CONFIRMED'
    | 'PICKING_PENDING'
    | 'PICKING'
    | 'PACKING'
    | 'GOODS_ISSUED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';

export interface AuditEntry {
    timestamp: string;
    fromStatus: SalesOrderStatus | null;
    toStatus: SalesOrderStatus;
    actor: string;
    role: string;
    note?: string;
}

export interface SOPickItem {
    sku: string;
    productName: string;
    batchId: string;
    binLocation: string;
    quantityRequired: number;
    quantityPicked: number;
    confirmed: boolean;
}

export interface SalesOrderLine {
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    binLocation?: string;
    lineTotal: number;
}

export interface IDocItem {
    ITM_NUMBER: string;
    MATERIAL: string;
    SHORT_TEXT: string;
    TARGET_QTY: string;
    TARGET_QU: string;
    NETPR: string;
    CURRENCY: string;
}

export interface IDocPayload {
    IDOC_TYPE: string;
    MESTYP: string;
    MESCOD: string;
    PARTNER_NUMB: string; // UzAuto Motors SAP partner number
    PARTNER_TYPE: string;
    SALES_ORG: string;
    DIST_CHAN: string;
    DIVISION: string;
    DOC_TYPE: string;
    ORDER_DATE: string;
    DELIV_DATE: string;
    NETWR: string;
    CURRENCY: string;
    INCOTERMS1: string;
    INCOTERMS2: string;
    ITEMS: IDocItem[];
    GENERATED_AT: string;
    MESSAGE_ID: string;
}

export interface ATPCheckResult {
    available: boolean;
    items: {
        sku: string;
        productName: string;
        requested: number;
        available: number;
        shortfall: number;
        batches: string[];
    }[];
}

export interface SalesOrder {
    id: string;              // SO-2026-XXX
    deliveryNoteNumber?: string; // DN-2026-NNNN
    shipmentId?: string;
    customer: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    sapPartnerNumber?: string;
    incoterms?: string;
    paymentTerms?: string;
    lines: SalesOrderLine[];
    pickList: SOPickItem[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    status: SalesOrderStatus;
    auditLog: AuditEntry[];
    atpResult?: ATPCheckResult;
    idocPayload?: IDocPayload;
    createdAt: string;
    atpCheckedAt?: string;
    confirmedAt?: string;
    pickingStartedAt?: string;
    packedAt?: string;
    goodsIssuedAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    notes?: string;
}

export interface SalesStats {
    totalRevenue: number;
    totalOrders: number;
    activeOrders: number;
    deliveredOrders: number;
    averageOrderValue: number;
    dailyShippedQty: number;
    pendingOrderCount: number;
    shippedOrders: number;
    shippedItems: number;
    monthlyRevenue: { month: string; revenue: number; orders: number }[];
}

interface SalesContextType {
    salesOrders: SalesOrder[];
    salesStats: SalesStats;
    createOrder: (
        customer: string,
        lines: Omit<SalesOrderLine, 'lineTotal'>[],
        options?: { discount?: number; contactPerson?: string; email?: string; phone?: string; notes?: string; incoterms?: string }
    ) => SalesOrder | null;
    runATPCheck: (orderId: string) => ATPCheckResult;
    confirmOrder: (orderId: string) => void;
    startPicking: (orderId: string) => void;
    confirmPick: (orderId: string, pickedItems: SOPickItem[]) => void;
    confirmPack: (orderId: string) => void;
    executeGoodsIssue: (orderId: string) => void;
    confirmShipment: (orderId: string) => void;
    confirmDelivery: (orderId: string) => void;
    cancelOrder: (orderId: string, reason: string) => void;
    getIdocPayload: (orderId: string) => IDocPayload | null;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SalesContext = createContext<SalesContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

let soCounter = 220;
let dnCounter = 1001;

function generateSOId(): string { return `SO-2026-${soCounter++}`; }
function generateDNId(): string { return `DN-2026-${dnCounter++}`; }

function generateIDoc(order: SalesOrder): IDocPayload {
    return {
        IDOC_TYPE: 'ORDERS05',
        MESTYP: 'ORDERS',
        MESCOD: 'UZA',
        PARTNER_NUMB: order.sapPartnerNumber || '0000100045',
        PARTNER_TYPE: 'KU',
        SALES_ORG: '1000',
        DIST_CHAN: '10',
        DIVISION: '00',
        DOC_TYPE: 'ZOR',
        ORDER_DATE: order.createdAt.split('T')[0],
        DELIV_DATE: order.shippedAt ? order.shippedAt.split('T')[0] : order.createdAt.split('T')[0],
        NETWR: order.totalAmount.toFixed(2),
        CURRENCY: 'UZS',
        INCOTERMS1: order.incoterms || 'DAP',
        INCOTERMS2: 'ANDIJAN',
        ITEMS: order.lines.map((l, i) => ({
            ITM_NUMBER: String((i + 1) * 10).padStart(6, '0'),
            MATERIAL: l.sku,
            SHORT_TEXT: l.productName,
            TARGET_QTY: String(l.quantity),
            TARGET_QU: 'PC',
            NETPR: l.unitPrice.toFixed(2),
            CURRENCY: 'UZS',
        })),
        GENERATED_AT: new Date().toISOString(),
        MESSAGE_ID: `MSG-${Date.now()}`,
    };
}

function buildAuditEntry(
    fromStatus: SalesOrderStatus | null,
    toStatus: SalesOrderStatus,
    note?: string
): AuditEntry {
    return {
        timestamp: new Date().toISOString(),
        fromStatus,
        toStatus,
        actor: 'Current User',
        role: 'Warehouse Manager',
        note,
    };
}

function computeStats(orders: SalesOrder[]): SalesStats {
    const delivered = orders.filter(o => o.status === 'DELIVERED');
    const active = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
    const pending = orders.filter(o => ['DRAFT', 'ATP_CHECK', 'CONFIRMED', 'PICKING_PENDING', 'PICKING', 'PACKING'].includes(o.status));
    const totalRevenue = delivered.reduce((s, o) => s + o.totalAmount, 0);
    const today = new Date().toISOString().slice(0, 10);
    const dailyShippedQty = orders
        .filter(o => o.goodsIssuedAt && o.goodsIssuedAt.slice(0, 10) === today)
        .flatMap(o => o.lines)
        .reduce((s, l) => s + l.quantity, 0);

    const monthly: Record<string, { revenue: number; orders: number }> = {};
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    delivered.forEach(o => {
        const d = new Date(o.createdAt);
        const key = months[d.getMonth()];
        if (!monthly[key]) monthly[key] = { revenue: 0, orders: 0 };
        monthly[key].revenue += o.totalAmount;
        monthly[key].orders += 1;
    });
    const monthlyRevenue = Object.entries(monthly).map(([month, v]) => ({ month, ...v }));

    const shipped = orders.filter(o => ['SHIPPED', 'DELIVERED', 'GOODS_ISSUED'].includes(o.status));
    const shippedItems = shipped.flatMap(o => o.lines).reduce((s, l) => s + l.quantity, 0);

    return {
        totalRevenue,
        totalOrders: orders.length,
        activeOrders: active.length,
        deliveredOrders: delivered.length,
        averageOrderValue: delivered.length > 0 ? totalRevenue / delivered.length : 0,
        dailyShippedQty,
        pendingOrderCount: pending.length,
        shippedOrders: shipped.length,
        shippedItems,
        monthlyRevenue,
    };
}

// ─── Initial demo data ────────────────────────────────────────────────────────

const makeAudit = (from: SalesOrderStatus | null, to: SalesOrderStatus, note?: string): AuditEntry => ({
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString(),
    fromStatus: from,
    toStatus: to,
    actor: 'System / Demo',
    role: 'Admin',
    note,
});

const INITIAL_ORDERS: SalesOrder[] = [
    {
        id: 'SO-2026-219',
        customer: 'UzAuto Motors',
        contactPerson: 'Mirzo Yusupov',
        email: 'procurement@uzautomotors.uz',
        phone: '+998 71 100-00-01',
        sapPartnerNumber: '0000100045',
        incoterms: 'DAP',
        paymentTerms: 'Net 30',
        lines: [
            { sku: 'DT-FL-001', productName: 'Door Trim Front Left', quantity: 2000, unitPrice: 45000, binLocation: 'Z-001', lineTotal: 90000000 },
            { sku: 'DT-FR-002', productName: 'Door Trim Front Right', quantity: 2000, unitPrice: 45000, binLocation: 'Z-002', lineTotal: 90000000 },
        ],
        pickList: [],
        subtotal: 180000000, discount: 0, totalAmount: 180000000,
        status: 'PICKING_PENDING',
        auditLog: [
            makeAudit(null, 'DRAFT'),
            makeAudit('DRAFT', 'ATP_CHECK'),
            makeAudit('ATP_CHECK', 'CONFIRMED', 'ATP check passed — 3,500 units available'),
            makeAudit('CONFIRMED', 'PICKING_PENDING', 'Pick order issued to warehouse floor'),
        ],
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        atpCheckedAt: new Date(Date.now() - 1.9 * 86400000).toISOString(),
        confirmedAt: new Date(Date.now() - 1.8 * 86400000).toISOString(),
        pickingStartedAt: undefined,
    },
    {
        id: 'SO-2026-218',
        customer: 'UzAuto Motors',
        contactPerson: 'Mirzo Yusupov',
        email: 'procurement@uzautomotors.uz',
        phone: '+998 71 100-00-01',
        sapPartnerNumber: '0000100045',
        incoterms: 'DAP',
        paymentTerms: 'Net 30',
        lines: [
            { sku: 'DT-RL-003', productName: 'Door Trim Rear Left', quantity: 1500, unitPrice: 42000, binLocation: 'Z-003', lineTotal: 63000000 },
        ],
        pickList: [],
        subtotal: 63000000, discount: 0, totalAmount: 63000000,
        status: 'GOODS_ISSUED',
        auditLog: [
            makeAudit(null, 'DRAFT'),
            makeAudit('DRAFT', 'CONFIRMED', 'Fast-track confirmation'),
            makeAudit('CONFIRMED', 'PICKING_PENDING'),
            makeAudit('PICKING_PENDING', 'PICKING', 'Picker: Alisher Toshmatov assigned'),
            makeAudit('PICKING', 'PACKING', 'All 1,500 units picked and verified'),
            makeAudit('PACKING', 'GOODS_ISSUED', 'GI executed — IDoc ORDERS05 sent to UzAuto SAP'),
        ],
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        confirmedAt: new Date(Date.now() - 3.5 * 86400000).toISOString(),
        goodsIssuedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
        deliveryNoteNumber: 'DN-2026-1000',
    },
    {
        id: 'SO-2026-217',
        customer: 'GM Uzbekistan',
        contactPerson: 'Alisher Niyazov',
        email: 'a.niyazov@gm.uz',
        phone: '+998 90 123-45-67',
        incoterms: 'EXW',
        paymentTerms: 'Net 15',
        lines: [
            { sku: 'SP-001', productName: 'Small Plastic Component Set', quantity: 5000, unitPrice: 8500, lineTotal: 42500000 },
        ],
        pickList: [],
        subtotal: 42500000, discount: 2, totalAmount: 41650000,
        status: 'DELIVERED',
        auditLog: [
            makeAudit(null, 'DRAFT'),
            makeAudit('DRAFT', 'CONFIRMED'),
            makeAudit('CONFIRMED', 'PICKING_PENDING'),
            makeAudit('PICKING_PENDING', 'PICKING'),
            makeAudit('PICKING', 'PACKING'),
            makeAudit('PACKING', 'GOODS_ISSUED'),
            makeAudit('GOODS_ISSUED', 'SHIPPED', 'Truck GMU-8821 departed 06:30'),
            makeAudit('SHIPPED', 'DELIVERED', 'POD received from driver'),
        ],
        deliveryNoteNumber: 'DN-2026-999',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        goodsIssuedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        shippedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        deliveredAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
        id: 'SO-2026-216',
        customer: 'Hyundai Parts UZ',
        contactPerson: 'Choi Min',
        email: 'c.min@hyundai.uz',
        phone: '+998 71 456-78-90',
        incoterms: 'DAP',
        paymentTerms: 'Net 30',
        lines: [
            { sku: 'DT-RR-004', productName: 'Door Trim Rear Right', quantity: 800, unitPrice: 42000, lineTotal: 33600000 },
        ],
        pickList: [],
        subtotal: 33600000, discount: 0, totalAmount: 33600000,
        status: 'CONFIRMED',
        auditLog: [
            makeAudit(null, 'DRAFT'),
            makeAudit('DRAFT', 'ATP_CHECK'),
            makeAudit('ATP_CHECK', 'CONFIRMED', 'Stock sufficient'),
        ],
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        atpCheckedAt: new Date(Date.now() - 0.9 * 86400000).toISOString(),
        confirmedAt: new Date(Date.now() - 0.8 * 86400000).toISOString(),
    },
    {
        id: 'SO-2026-215',
        customer: 'UzAuto Motors',
        contactPerson: 'Mirzo Yusupov',
        email: 'procurement@uzautomotors.uz',
        phone: '+998 71 100-00-01',
        sapPartnerNumber: '0000100045',
        incoterms: 'DAP',
        paymentTerms: 'Net 30',
        lines: [
            { sku: 'DT-FL-001', productName: 'Door Trim Front Left', quantity: 500, unitPrice: 45000, lineTotal: 22500000 },
        ],
        pickList: [],
        subtotal: 22500000, discount: 0, totalAmount: 22500000,
        status: 'DRAFT',
        auditLog: [makeAudit(null, 'DRAFT')],
        createdAt: new Date().toISOString(),
    },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SalesProvider({ children }: { children: ReactNode }) {
    const { reserveFinishedGoods, releaseReservation, shipFinishedGoods, finishedGoods, addGoodsIssueEvent } = useWarehouse();
    const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(INITIAL_ORDERS);

    const salesStats = computeStats(salesOrders);

    const createOrder = useCallback((
        customer: string,
        lines: Omit<SalesOrderLine, 'lineTotal'>[],
        options?: { discount?: number; contactPerson?: string; email?: string; phone?: string; notes?: string; incoterms?: string }
    ): SalesOrder | null => {
        for (const line of lines) {
            const fg = finishedGoods.find(f => f.sku === line.sku);
            if (!fg || fg.availableQuantity < line.quantity) return null;
        }
        const discount = options?.discount ?? 0;
        const hydratedLines: SalesOrderLine[] = lines.map(l => ({ ...l, lineTotal: l.quantity * l.unitPrice }));
        const subtotal = hydratedLines.reduce((s, l) => s + l.lineTotal, 0);
        const totalAmount = subtotal * (1 - discount / 100);
        const order: SalesOrder = {
            id: generateSOId(),
            customer,
            contactPerson: options?.contactPerson,
            email: options?.email,
            phone: options?.phone,
            incoterms: options?.incoterms || 'DAP',
            sapPartnerNumber: customer === 'UzAuto Motors' ? '0000100045' : undefined,
            lines: hydratedLines,
            pickList: [],
            subtotal, discount, totalAmount,
            status: 'DRAFT',
            auditLog: [buildAuditEntry(null, 'DRAFT', 'Sales Order created')],
            createdAt: new Date().toISOString(),
            notes: options?.notes,
        };
        lines.forEach(l => reserveFinishedGoods(l.sku, l.quantity));
        setSalesOrders(prev => [order, ...prev]);
        return order;
    }, [finishedGoods, reserveFinishedGoods]);

    const runATPCheck = useCallback((orderId: string): ATPCheckResult => {
        const order = salesOrders.find(o => o.id === orderId);
        if (!order) return { available: false, items: [] };
        const items = order.lines.map(l => {
            const fg = finishedGoods.find(f => f.sku === l.sku);
            const avail = fg ? fg.availableQuantity : 0;
            return {
                sku: l.sku,
                productName: l.productName,
                requested: l.quantity,
                available: avail,
                shortfall: Math.max(0, l.quantity - avail),
                batches: fg ? fg.batches.map(b => b.batch) : [],
            };
        });
        const allAvailable = items.every(i => i.shortfall === 0);
        const result: ATPCheckResult = { available: allAvailable, items };
        setSalesOrders(prev => prev.map(o => o.id === orderId ? {
            ...o, status: 'ATP_CHECK', atpResult: result,
            atpCheckedAt: new Date().toISOString(),
            auditLog: [...o.auditLog, buildAuditEntry(o.status, 'ATP_CHECK', `ATP: ${allAvailable ? 'PASS — all stock available' : `FAIL — shortfall on ${items.filter(i => i.shortfall > 0).map(i => i.sku).join(', ')}`}`)],
        } : o));
        return result;
    }, [salesOrders, finishedGoods]);

    const confirmOrder = useCallback((orderId: string) => {
        setSalesOrders(prev => prev.map(o => {
            if (o.id !== orderId || !['DRAFT', 'ATP_CHECK', 'RESERVED'].includes(o.status)) return o;
            return {
                ...o, status: 'CONFIRMED', confirmedAt: new Date().toISOString(),
                auditLog: [...o.auditLog, buildAuditEntry(o.status, 'CONFIRMED', 'Order confirmed — ready for warehouse')],
            };
        }));
    }, []);

    const startPicking = useCallback((orderId: string) => {
        setSalesOrders(prev => prev.map(o => {
            if (o.id !== orderId || (o.status !== 'CONFIRMED' && o.status !== 'PICKING_PENDING')) return o;
            // Build FIFO pick list from warehouse batches
            const pickList: SOPickItem[] = o.lines.flatMap(line => {
                const fg = finishedGoods.find(f => f.sku === line.sku);
                if (!fg) return [];
                // Sort batches by receivedAt for FIFO
                const sorted = [...fg.batches].sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
                let remaining = line.quantity;
                const items: SOPickItem[] = [];
                for (const batch of sorted) {
                    if (remaining <= 0) break;
                    const pickQty = Math.min(remaining, batch.quantity);
                    items.push({
                        sku: line.sku,
                        productName: line.productName,
                        batchId: batch.batch,
                        binLocation: batch.warehouseLocation,
                        quantityRequired: pickQty,
                        quantityPicked: 0,
                        confirmed: false,
                    });
                    remaining -= pickQty;
                }
                return items;
            });
            return {
                ...o, status: 'PICKING_PENDING', pickList,
                pickingStartedAt: new Date().toISOString(),
                auditLog: [...o.auditLog, buildAuditEntry(o.status, 'PICKING_PENDING', `Pick list generated — ${pickList.length} line(s)`)],
            };
        }));
    }, [finishedGoods]);

    const confirmPick = useCallback((orderId: string, pickedItems: SOPickItem[]) => {
        setSalesOrders(prev => prev.map(o => {
            if (o.id !== orderId) return o;
            return {
                ...o, status: 'PACKING', pickList: pickedItems,
                auditLog: [...o.auditLog, buildAuditEntry(o.status, 'PACKING',
                    `All ${pickedItems.length} pick lines confirmed. Moving to packing.`)],
            };
        }));
    }, []);

    const confirmPack = useCallback((orderId: string) => {
        setSalesOrders(prev => prev.map(o => {
            if (o.id !== orderId || o.status !== 'PACKING') return o;
            return {
                ...o, status: 'PACKING', packedAt: new Date().toISOString(),
                auditLog: [...o.auditLog, buildAuditEntry(o.status, 'PACKING', 'Packing list confirmed')],
            };
        }));
    }, []);

    const executeGoodsIssue = useCallback((orderId: string) => {
        const order = salesOrders.find(o => o.id === orderId);
        if (!order) return;
        // Deduct from warehouse
        order.lines.forEach(l => shipFinishedGoods(l.sku, l.quantity));
        // Log GI events per pick line
        order.pickList.forEach(p => {
            addGoodsIssueEvent({
                id: `GI-${Date.now()}-${p.batchId}`,
                soId: orderId,
                sku: p.sku,
                batchId: p.batchId,
                quantity: p.quantityRequired,
                binLocation: p.binLocation,
                timestamp: new Date().toISOString(),
                actor: 'Warehouse Manager',
                role: 'WH_MANAGER',
            });
        });
        const dn = generateDNId();
        const idocPayload = generateIDoc({ ...order, deliveryNoteNumber: dn, status: 'GOODS_ISSUED' });
        setSalesOrders(prev => prev.map(o => o.id === orderId ? {
            ...o, status: 'GOODS_ISSUED',
            goodsIssuedAt: new Date().toISOString(),
            deliveryNoteNumber: dn,
            idocPayload,
            auditLog: [...o.auditLog, buildAuditEntry(o.status, 'GOODS_ISSUED', `GI executed — DN: ${dn} — IDoc ORDERS05 generated`)],
        } : o));
    }, [salesOrders, shipFinishedGoods, addGoodsIssueEvent]);

    const confirmShipment = useCallback((orderId: string) => {
        setSalesOrders(prev => prev.map(o => {
            if (o.id !== orderId || o.status !== 'GOODS_ISSUED') return o;
            return {
                ...o, status: 'SHIPPED', shippedAt: new Date().toISOString(),
                auditLog: [...o.auditLog, buildAuditEntry(o.status, 'SHIPPED', 'Truck departed — shipment confirmed')],
            };
        }));
    }, []);

    const confirmDelivery = useCallback((orderId: string) => {
        setSalesOrders(prev => prev.map(o => {
            if (o.id !== orderId || o.status !== 'SHIPPED') return o;
            return {
                ...o, status: 'DELIVERED', deliveredAt: new Date().toISOString(),
                auditLog: [...o.auditLog, buildAuditEntry(o.status, 'DELIVERED', 'POD received — order complete')],
            };
        }));
    }, []);

    const cancelOrder = useCallback((orderId: string, reason: string) => {
        const order = salesOrders.find(o => o.id === orderId);
        if (!order || ['DELIVERED', 'CANCELLED', 'GOODS_ISSUED', 'SHIPPED'].includes(order.status)) return;
        if (['DRAFT', 'ATP_CHECK', 'CONFIRMED', 'PICKING_PENDING', 'PICKING', 'PACKING'].includes(order.status)) {
            order.lines.forEach(l => releaseReservation(l.sku, l.quantity));
        }
        setSalesOrders(prev => prev.map(o => o.id === orderId ? {
            ...o, status: 'CANCELLED', cancelledAt: new Date().toISOString(),
            cancellationReason: reason,
            auditLog: [...o.auditLog, buildAuditEntry(o.status, 'CANCELLED', `Cancelled: ${reason}`)],
        } : o));
    }, [salesOrders, releaseReservation]);

    const getIdocPayload = useCallback((orderId: string): IDocPayload | null => {
        const order = salesOrders.find(o => o.id === orderId);
        if (!order) return null;
        return order.idocPayload || generateIDoc(order);
    }, [salesOrders]);

    return (
        <SalesContext.Provider value={{
            salesOrders, salesStats,
            createOrder, runATPCheck, confirmOrder, startPicking,
            confirmPick, confirmPack, executeGoodsIssue,
            confirmShipment, confirmDelivery, cancelOrder, getIdocPayload,
        }}>
            {children}
        </SalesContext.Provider>
    );
}

export function useSales() {
    const ctx = useContext(SalesContext);
    if (!ctx) throw new Error('useSales must be used within SalesProvider');
    return ctx;
}
