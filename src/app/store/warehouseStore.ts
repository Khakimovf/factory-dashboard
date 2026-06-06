import { create } from 'zustand';
import { useFinanceStore } from './financeStore';

// --- Interfaces ---

export interface StockItem {
    materialId: string;
    description: string;
    category: 'FINISHED_GOODS' | 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'SPARE_PART' | 'WIP';
    binLocation: string;
    totalStock: number;
    unrestricted: number;
    reserved: number;
    blocked: number;
    inQuality: number;
    unit: string;
    lastUpdated: string;
    batchNumber?: string;
    status?: string;
    minimumStock: number;
    reorderPoint: number;
}

export interface BinLocation {
    binId: string;        // e.g. "A-L1"
    area: string;         // "Area-01"
    column: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
    level: number;        // 1 | 2 | 3 | 4
    status: 'FULL' | 'OCCUPIED' | 'AVAILABLE';
    materialId?: string;
    quantity?: number;
    maxCapacity: number;
}

export interface EWMTask {
    requestId: string;    // "PK-102"
    type: 'PICKING' | 'PUTAWAY' | 'TRANSFER' | 'BINNING';
    status: 'PRE_ORDER' | 'PENDING' | 'PICKING' | 'COMPLETED';
    toLine?: string;
    materials: { materialId: string; qty: number; sku: string }[];
    assignedTo?: string;
    createdAt: string;
}

export interface WarehouseResource {
    id: string;
    name: string;
    role: 'PICKER' | 'FORKLIFT_OP' | 'RECEIVER' | 'SUPERVISOR';
    status: 'ACTIVE' | 'ON_BREAK' | 'OFFLINE';
    currentTask?: string;
    currentLocation?: string;
    capacityLoad: number; // 0-100%
    efficiency: number;   // 0-100%
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
    zone: string;
}

export interface WarehouseEquipment {
    id: string;
    name: string;
    type: 'FORKLIFT' | 'PALLET_JACK' | 'REACH_TRUCK';
    status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
    batteryLevel: number;
}

export interface MaterialDocument {
    documentId: string;   // "MAT-5000124"
    postDate: string;
    type: 'GOODS_RECEIPT' | 'GOODS_ISSUE' | 'TRANSFER';
    mvmt: number;         // 101 | 261 | 311
    reference: string;    // PO/WO/TO number
    plant: string;        // "P001"
    sloc: string;         // "WH01"
    lineItems: {
        materialId: string;
        description: string;
        qty: number;
        unit: string;
        amount?: number;
    }[];
    clientName?: string;
    courier?: string;
    doverennost?: string;
    validUntil?: string;
    supplier?: string;
}

export interface ASN {
    asnId: string;
    supplier: string;
    expectedDate: string;
    items: { materialId: string; qty: number; poRef: string }[];
    status: 'EXPECTED' | 'AT_GATE' | 'IN_RECEIVING' | 'COMPLETED';
}

export interface AuditSnapshot {
    id: string;
    date: string;
    type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    stockSnapshot: StockItem[];
    adjustments: Record<string, number>; // materialId -> physicalCount
}

interface WarehouseState {
    stock: StockItem[];
    bins: BinLocation[];
    tasks: EWMTask[];
    resources: WarehouseResource[];
    equipment: WarehouseEquipment[];
    documents: MaterialDocument[];
    asns: ASN[];
    auditSnapshots: AuditSnapshot[];

    // Actions
    addStock: (item: Partial<StockItem>) => void;
    updateStock: (materialId: string, updates: Partial<StockItem>) => void;
    deleteStock: (materialId: string) => void;
    adjustStock: (materialId: string, adjustment: number, reason: string) => void;
    updateBin: (binId: string, updates: Partial<BinLocation>) => void;
    addEmployee: (employee: WarehouseResource) => void;
    updateEquipmentStatus: (id: string, status: WarehouseEquipment['status']) => void;
    addDocument: (doc: MaterialDocument) => void;
    processASN: (asnId: string) => void;
    setTasks: (tasks: EWMTask[]) => void;
    freezeAuditSnapshot: (type: AuditSnapshot['type']) => void;
    commitAuditAdjustments: (adjustments: Record<string, number>) => void;
}

// --- Mock Data ---

const mockStock: StockItem[] = [
    { materialId: 'DT-FL-001', description: 'Door Trim Front Left', category: 'FINISHED_GOODS', binLocation: 'Z-001', totalStock: 3500, unrestricted: 1400, reserved: 2000, blocked: 100, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'BLOCKED', minimumStock: 2000, reorderPoint: 2500, batchNumber: 'B260604A' },
    { materialId: 'DT-FR-002', description: 'Door Trim Front Right', category: 'FINISHED_GOODS', binLocation: 'Z-002', totalStock: 2800, unrestricted: 2800, reserved: 0, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 2000, reorderPoint: 2500, batchNumber: 'B260604B' },
    { materialId: 'HS-MT-003', description: 'Metal Sheet 2mm', category: 'RAW_MATERIAL', binLocation: 'A-03', totalStock: 15000, unrestricted: 12000, reserved: 3000, blocked: 0, inQuality: 0, unit: 'kg', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 5000, reorderPoint: 8000, batchNumber: 'R99201' },
    { materialId: 'PL-AB-004', description: 'ABS Plastic Granule', category: 'RAW_MATERIAL', binLocation: 'B-01', totalStock: 8500, unrestricted: 8500, reserved: 0, blocked: 0, inQuality: 0, unit: 'kg', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 2000, reorderPoint: 4000, batchNumber: 'R99202' },
    { materialId: 'SC-M8-005', description: 'M8 Bolt Set', category: 'SEMI_FINISHED', binLocation: 'C-04', totalStock: 45000, unrestricted: 40000, reserved: 5000, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 10000, reorderPoint: 15000, batchNumber: 'S8810' },
    { materialId: 'RB-SL-006', description: 'Rubber Seal Ring', category: 'RAW_MATERIAL', binLocation: 'D-02', totalStock: 12000, unrestricted: 9000, reserved: 3000, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 5000, reorderPoint: 7000, batchNumber: 'R99203' },
    { materialId: 'WH-CV-007', description: 'Wire Harness Complete', category: 'SEMI_FINISHED', binLocation: 'E-01', totalStock: 680, unrestricted: 180, reserved: 500, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'LOW_STOCK', minimumStock: 1000, reorderPoint: 1200, batchNumber: 'S8811' },
    { materialId: 'FB-GR-008', description: 'Foam Block Grey', category: 'RAW_MATERIAL', binLocation: 'F-03', totalStock: 2100, unrestricted: 2100, reserved: 0, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 500, reorderPoint: 800, batchNumber: 'R99204' },
    { materialId: 'DT-FL-001-WIP', description: 'Door Trim Front Left (WIP)', category: 'WIP', binLocation: 'LINE-01', totalStock: 450, unrestricted: 450, reserved: 0, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 0, reorderPoint: 0, batchNumber: 'W260604A' },
    { materialId: 'DT-FR-002-WIP', description: 'Door Trim Front Right (WIP)', category: 'WIP', binLocation: 'LINE-02', totalStock: 320, unrestricted: 320, reserved: 0, blocked: 0, inQuality: 0, unit: 'pcs', lastUpdated: new Date().toISOString(), status: 'OK', minimumStock: 0, reorderPoint: 0, batchNumber: 'W260604B' },
];

const generateBins = (): BinLocation[] => {
    const bins: BinLocation[] = [];
    const columns: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H')[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (const col of columns) {
        for (let lvl = 1; lvl <= 4; lvl++) {
            let status: 'FULL' | 'OCCUPIED' | 'AVAILABLE' = 'AVAILABLE';
            if (col === 'A') status = 'FULL';
            if (col === 'D' && (lvl === 2 || lvl === 3)) status = 'OCCUPIED';

            bins.push({
                binId: `${col}-L${lvl}`,
                area: 'Area-01',
                column: col,
                level: lvl,
                status,
                maxCapacity: 1000,
                quantity: status === 'AVAILABLE' ? 0 : (status === 'FULL' ? 1000 : 500)
            });
        }
    }
    return bins;
};

const mockResources: WarehouseResource[] = [
    { id: 'W001', name: 'Alex Johnson', role: 'FORKLIFT_OP', status: 'ACTIVE', capacityLoad: 75, currentLocation: 'Area-01', efficiency: 92, shift: 'MORNING', zone: 'Section A' },
    { id: 'W002', name: 'Sarah Miller', role: 'PICKER', status: 'ACTIVE', capacityLoad: 40, currentLocation: 'Zone-B', efficiency: 88, shift: 'MORNING', zone: 'Section B' },
    { id: 'W003', name: 'Mike Ross', role: 'RECEIVER', status: 'ON_BREAK', capacityLoad: 0, efficiency: 95, shift: 'MORNING', zone: 'Receiving' },
    { id: 'W004', name: 'Elena Petrova', role: 'SUPERVISOR', status: 'ACTIVE', capacityLoad: 20, efficiency: 98, shift: 'MORNING', zone: 'Office' },
];

const mockEquipment: WarehouseEquipment[] = [
    { id: 'FL-01', name: 'Forklift 01', type: 'FORKLIFT', status: 'IN_USE', batteryLevel: 85 },
    { id: 'FL-02', name: 'Forklift 02', type: 'FORKLIFT', status: 'AVAILABLE', batteryLevel: 92 },
    { id: 'PJ-01', name: 'Pallet Jack 01', type: 'PALLET_JACK', status: 'AVAILABLE', batteryLevel: 100 },
    { id: 'RT-01', name: 'Reach Truck 01', type: 'REACH_TRUCK', status: 'MAINTENANCE', batteryLevel: 15 },
];

const mockTasks: EWMTask[] = [
    { requestId: 'PK-102', type: 'PICKING', status: 'PENDING', materials: [{ materialId: 'DT-FL-001', qty: 200, sku: 'DT-FL-001' }], createdAt: new Date().toISOString() },
    { requestId: 'PT-205', type: 'PUTAWAY', status: 'PRE_ORDER', materials: [{ materialId: 'HS-MT-003', qty: 500, sku: 'HS-MT-003' }], createdAt: new Date().toISOString() },
];

const mockDocuments: MaterialDocument[] = [
    { documentId: 'GI-10002-1780673207154', postDate: new Date().toISOString(), type: 'GOODS_ISSUE', mvmt: 261, reference: '10002', plant: 'P001', sloc: 'WH01', clientName: 'UzAuto Motors JSC', courier: 'Karimov Jasur', lineItems: [{ materialId: 'DT-FL-001', description: 'Door Trim Front Left', qty: 1500, unit: 'pcs' }, { materialId: 'DT-FR-002', description: 'Door Trim Front Right', qty: 1500, unit: 'pcs' }] },
    { documentId: 'GR-144414-1780673664739', postDate: new Date().toISOString(), type: 'GOODS_RECEIPT', mvmt: 101, reference: '144414', plant: 'P001', sloc: 'WH01', supplier: 'Hardware Supply Co.', lineItems: [{ materialId: 'HS-MT-003', description: 'Metal Sheet 2mm', qty: 8500, unit: 'kg' }] },
    { documentId: 'MAT-5000124', postDate: new Date().toISOString(), type: 'GOODS_RECEIPT', mvmt: 101, reference: 'PO-8821', plant: 'P001', sloc: 'WH01', lineItems: [{ materialId: 'DT-FL-001', description: 'Door Trim Front Left', qty: 500, unit: 'pcs' }] },
];

const mockASNs: ASN[] = [
    { asnId: 'ASN-9901', supplier: 'Logistics Pro', expectedDate: new Date().toISOString(), status: 'AT_GATE', items: [{ materialId: 'RB-SL-006', qty: 5000, poRef: 'PO-1122' }] },
];

// --- Store ---

export const useWarehouseStore = create<WarehouseState>((set) => ({
    stock: mockStock,
    bins: generateBins(),
    tasks: mockTasks,
    resources: mockResources,
    equipment: mockEquipment,
    documents: mockDocuments,
    asns: mockASNs,
    auditSnapshots: [],

    // Actions
    addStock: (item) => set((state) => ({
        stock: [
            ...state.stock,
            {
                materialId: item.materialId || `NEW-${Date.now()}`,
                description: item.description || 'New Material',
                category: item.category || 'FINISHED_GOODS',
                binLocation: item.binLocation || 'UNASSIGNED',
                totalStock: item.totalStock || 0,
                unrestricted: item.unrestricted || 0,
                reserved: item.reserved || 0,
                blocked: item.blocked || 0,
                inQuality: item.inQuality || 0,
                unit: item.unit || 'pcs',
                minimumStock: item.minimumStock || 0,
                reorderPoint: item.reorderPoint || 0,
                lastUpdated: new Date().toISOString(),
                ...item
            } as StockItem
        ]
    })),

    updateStock: (materialId, updates) => set((state) => ({
        stock: state.stock.map((s) => s.materialId === materialId ? { ...s, ...updates, lastUpdated: new Date().toISOString() } : s)
    })),

    deleteStock: (materialId) => set((state) => ({
        stock: state.stock.filter((s) => s.materialId !== materialId)
    })),

    adjustStock: (materialId, adjustment, reason) => set((state) => ({
        stock: state.stock.map((s) => {
            if (s.materialId === materialId) {
                const newTotal = s.totalStock + adjustment;
                return {
                    ...s,
                    totalStock: newTotal,
                    unrestricted: s.unrestricted + adjustment,
                    lastUpdated: new Date().toISOString()
                };
            }
            return s;
        })
    })),

    updateBin: (binId, updates) => set((state) => ({
        bins: state.bins.map((b) => b.binId === binId ? { ...b, ...updates } : b)
    })),

    addEmployee: (employee) => set((state) => ({
        resources: [...state.resources, employee]
    })),

    updateEquipmentStatus: (id, status) => set((state) => ({
        equipment: state.equipment.map((e) => e.id === id ? { ...e, status } : e)
    })),

    addDocument: (doc) => set((state) => {
        // Automatically trigger double-entry accounting entries
        try {
            const getMaterialPrice = (sku: string): number => {
                const prices: Record<string, number> = {
                    'DT-FL-001': 90,
                    'DT-FR-002': 90,
                    'HS-MT-003': 15,
                    'PL-AB-004': 25,
                    'SC-M8-005': 1.5,
                    'RB-SL-006': 2,
                    'WH-CV-007': 45,
                    'FB-GR-008': 12,
                };
                return prices[sku] || 25;
            };

            const totalValue = doc.lineItems.reduce((sum, item) => {
                const price = item.amount || getMaterialPrice(item.materialId);
                return sum + (item.qty * price);
            }, 0);

            if (totalValue > 0) {
                if (doc.type === 'GOODS_RECEIPT') {
                    useFinanceStore.getState().addVoucher(
                        '1010 - Raw Material Inventory',
                        '6010 - Accounts Payable / Vendor',
                        totalValue,
                        `GR Putaway - Ref: ${doc.reference || doc.documentId}`,
                        'Ta\'minot',
                        doc.postDate ? doc.postDate.split('T')[0] : undefined
                    );
                    // Update B2B supplier contract progress
                    const supplier = doc.supplier || 'Hardware Supply Co.';
                    const qty = doc.lineItems.reduce((s, item) => s + item.qty, 0);
                    useFinanceStore.getState().recordContractProgress(supplier, qty);
                } else if (doc.type === 'GOODS_ISSUE') {
                    useFinanceStore.getState().addVoucher(
                        '2010 - Work-In-Progress Balance',
                        '1010 - Raw Material Inventory',
                        totalValue,
                        `GI Production - Ref: ${doc.reference || doc.documentId}`,
                        'Ishlab Chiqarish',
                        doc.postDate ? doc.postDate.split('T')[0] : undefined
                    );
                    // Update B2B customer contract progress
                    const client = doc.clientName || 'UzAuto Motors JSC';
                    const qty = doc.lineItems.reduce((s, item) => s + item.qty, 0);
                    useFinanceStore.getState().recordContractProgress(client, qty);
                }
            }
        } catch (e) {
            console.error("Auto-ledger posting failed", e);
        }

        return {
            documents: [doc, ...state.documents]
        };
    }),

    processASN: (asnId) => set((state) => ({
        asns: state.asns.map((a) => a.asnId === asnId ? { ...a, status: 'IN_RECEIVING' } : a)
    })),

    setTasks: (tasks) => set({ tasks }),

    freezeAuditSnapshot: (type) => set((state) => ({
        auditSnapshots: [
            {
                id: `AUDIT-${type}-${Date.now()}`,
                date: new Date().toISOString(),
                type,
                stockSnapshot: JSON.parse(JSON.stringify(state.stock)), // Deep copy
                adjustments: {}
            },
            ...state.auditSnapshots
        ]
    })),

    commitAuditAdjustments: (adjustments) => set((state) => {
        const latestAudit = state.auditSnapshots[0];
        if (!latestAudit) return state;

        const updatedSnapshots = [
            { ...latestAudit, adjustments },
            ...state.auditSnapshots.slice(1)
        ];

        // Also update live stock based on discrepancies
        const updatedStock = state.stock.map(item => {
            const physicalCount = adjustments[item.materialId];
            if (physicalCount !== undefined) {
                return {
                    ...item,
                    totalStock: physicalCount,
                    unrestricted: physicalCount, // Simplified for mock
                    lastUpdated: new Date().toISOString()
                };
            }
            return item;
        });

        return {
            auditSnapshots: updatedSnapshots,
            stock: updatedStock
        };
    }),
}));
