import { create } from 'zustand';

export type PickingStatus =
    | 'PENDING'     // Warehouse hodimi hali qabul qilmagan
    | 'ACCEPTED'    // Hodim qabul qildi, hali boshlamadi
    | 'PICKING'     // Yig'ish jarayonida
    | 'DELIVERING'  // Liniyaga olib chiqilmoqda
    | 'DELIVERED';  // Yetkazildi, liniya tasdiqlaydi

export interface PickingMaterial {
    materialId: string;
    materialName: string;
    requestedQty: number;
    unit: string;
    // Omborhonada joylashuvi
    binLocation: string;  // masalan "A-03"
    row: string;          // masalan "A"
    shelf: number;        // masalan 3
    position: number;     // masalan 1
    availableQty: number;
    pickedQty: number;
    isDone: boolean;
}

export interface PickingOrder {
    id: string;
    // Qaysi liniyadan kelgan
    lineId: string;
    lineName: string;
    // Plan ma'lumotlari
    planDate: string;
    shift: string;
    productName: string;
    targetQty: number;
    // Holat
    status: PickingStatus;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
    createdAt: string;
    // Warehouse hodimi
    assignedTo: string | null;
    acceptedAt: string | null;
    pickingStartedAt: string | null;
    deliveringAt: string | null;
    deliveredAt: string | null;
    // Materiallar
    materials: PickingMaterial[];
}

interface PickingStore {
    orders: PickingOrder[];
    // Hodim amaliyotlari
    acceptOrder: (orderId: string, workerName: string) => void;
    startPicking: (orderId: string) => void;
    markMaterialDone: (orderId: string, materialId: string) => void;
    partialPick: (orderId: string, materialId: string, qty: number) => void;
    startDelivering: (orderId: string) => void;
    markDelivered: (orderId: string) => void;
    returnOrder: (orderId: string) => void;
}

// Mock zayavkalar — operator-plans dan kelgan deb hisoblaymiz
const mockOrders: PickingOrder[] = [
    {
        id: 'PK-2026-001',
        lineId: '1', lineName: 'Assembly Line A',
        planDate: '2026-05-31', shift: '1-smena',
        productName: 'Door Trim Complete Set',
        targetQty: 100,
        status: 'PENDING',
        priority: 'HIGH',
        createdAt: '2026-05-31T08:00:00',
        assignedTo: null, acceptedAt: null,
        pickingStartedAt: null, deliveringAt: null, deliveredAt: null,
        materials: [
            {
                materialId: 'PP-B01', materialName: 'Polypropylene Granules',
                requestedQty: 400, unit: 'kg',
                binLocation: 'B-01', row: 'B', shelf: 1, position: 1,
                availableQty: 15000, pickedQty: 0, isDone: false,
            },
            {
                materialId: 'HW-G01', materialName: 'General Hardware Kit',
                requestedQty: 1000, unit: 'pcs',
                binLocation: 'C-04', row: 'C', shelf: 4, position: 2,
                availableQty: 5000, pickedQty: 0, isDone: false,
            },
        ],
    },
    {
        id: 'PK-2026-002',
        lineId: '2', lineName: 'Assembly Line B',
        planDate: '2026-05-31', shift: '1-smena',
        productName: 'Wire Harness Assembly',
        targetQty: 60,
        status: 'PENDING',
        priority: 'NORMAL',
        createdAt: '2026-05-31T08:15:00',
        assignedTo: null, acceptedAt: null,
        pickingStartedAt: null, deliveringAt: null, deliveredAt: null,
        materials: [
            {
                materialId: 'WH-CV-007', materialName: 'Wire Harness Complete',
                requestedQty: 5, unit: 'pcs',
                binLocation: 'E-01', row: 'E', shelf: 1, position: 1,
                availableQty: 180, pickedQty: 0, isDone: false,
            },
            {
                materialId: 'PL-AB-004', materialName: 'ABS Plastic Granule',
                requestedQty: 20, unit: 'kg',
                binLocation: 'B-01', row: 'B', shelf: 1, position: 3,
                availableQty: 8500, pickedQty: 0, isDone: false,
            },
        ],
    },
    {
        id: 'PK-2026-003',
        lineId: '5', lineName: 'TPA Molding Workshop',
        planDate: '2026-05-31', shift: '1-smena',
        productName: 'Body Panel Kit',
        targetQty: 80,
        status: 'ACCEPTED',
        priority: 'HIGH',
        createdAt: '2026-05-31T07:45:00',
        assignedTo: 'Mike Ross',
        acceptedAt: '2026-05-31T08:05:00',
        pickingStartedAt: null, deliveringAt: null, deliveredAt: null,
        materials: [
            {
                materialId: 'HS-MT-003', materialName: 'Metal Sheet 2mm',
                requestedQty: 50, unit: 'kg',
                binLocation: 'A-03', row: 'A', shelf: 3, position: 1,
                availableQty: 12000, pickedQty: 0, isDone: false,
            },
        ],
    },
];

export const usePickingStore = create<PickingStore>((set) => ({
    orders: mockOrders,

    acceptOrder: (orderId, workerName) =>
        set((s) => ({
            orders: s.orders.map((o) =>
                o.id === orderId
                    ? { ...o, status: 'ACCEPTED', assignedTo: workerName, acceptedAt: new Date().toISOString() }
                    : o
            ),
        })),

    startPicking: (orderId) =>
        set((s) => ({
            orders: s.orders.map((o) =>
                o.id === orderId
                    ? { ...o, status: 'PICKING', pickingStartedAt: new Date().toISOString() }
                    : o
            ),
        })),

    markMaterialDone: (orderId, materialId) =>
        set((s) => ({
            orders: s.orders.map((o) => {
                if (o.id !== orderId) return o;
                const updated = o.materials.map((m) =>
                    m.materialId === materialId
                        ? { ...m, pickedQty: m.requestedQty, isDone: true }
                        : m
                );
                return { ...o, materials: updated };
            }),
        })),

    partialPick: (orderId, materialId, qty) =>
        set((s) => ({
            orders: s.orders.map((o) => {
                if (o.id !== orderId) return o;
                const updated = o.materials.map((m) =>
                    m.materialId === materialId
                        ? { ...m, pickedQty: qty, isDone: qty >= m.requestedQty }
                        : m
                );
                return { ...o, materials: updated };
            }),
        })),

    startDelivering: (orderId) =>
        set((s) => ({
            orders: s.orders.map((o) =>
                o.id === orderId
                    ? { ...o, status: 'DELIVERING', deliveringAt: new Date().toISOString() }
                    : o
            ),
        })),

    markDelivered: (orderId) =>
        set((s) => ({
            orders: s.orders.map((o) =>
                o.id === orderId
                    ? { ...o, status: 'DELIVERED', deliveredAt: new Date().toISOString() }
                    : o
            ),
        })),

    returnOrder: (orderId) =>
        set((s) => ({
            orders: s.orders.filter((o) => o.id !== orderId),
        })),
}));
