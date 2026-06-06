import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { TransferDocument, TransferStatus, FinishedGoodsRecord, GoodsIssueEvent } from '../types/transferDocument';
import { toast } from 'sonner';

export interface PickListItem {
  id: string;
  name: string;
  partNumber: string;
  requiredQty: number;
  currentStock: number;
  binLocation?: string;
  isPicked?: boolean;
}

export interface MockRequest {
  id: string;
  planId: string;
  status: 'Pending' | 'Issuing' | 'IN_TRANSIT_TO_LINE' | 'ON LINE' | 'Completed';
  time: string;
  items: PickListItem[];
  targetTime: number;
  priority?: 'High' | 'Normal' | 'Low';
  assignee?: string;
  type?: string;
  source?: string;
  destination?: string;
  createdAt?: string;
}

interface WarehouseContextType {
  transferDocuments: TransferDocument[];
  finishedGoods: FinishedGoodsRecord[];
  setFinishedGoods: React.Dispatch<React.SetStateAction<FinishedGoodsRecord[]>>;
  goodsIssueLog: GoodsIssueEvent[];
  createTransferDocument: (transfer: Omit<TransferDocument, 'id' | 'qrCode' | 'createdAt'>) => TransferDocument;
  updateTransferStatus: (id: string, status: TransferStatus, receivedBy?: string, locations?: Record<string, string>, rejectedReason?: string) => void;
  acceptTransfer: (transferId: string, receivedBy: string, locations: Record<string, string>) => void;
  rejectTransfer: (transferId: string, receivedBy: string, reason: string) => void;
  getTransferByQR: (qrCode: string) => TransferDocument | undefined;
  reserveFinishedGoods: (sku: string, quantity: number) => void;
  releaseReservation: (sku: string, quantity: number) => void;
  blockStock: (sku: string, quantity: number, reason: string) => void;
  unblockStock: (sku: string, quantity: number) => void;
  shipFinishedGoods: (sku: string, quantity: number) => void;
  addGoodsIssueEvent: (event: GoodsIssueEvent) => void;
  requests: MockRequest[];
  addMaterialRequest: (planId: string, items: PickListItem[], priority?: 'High' | 'Normal' | 'Low', type?: string, destination?: string) => void;
  updateRequestStatus: (id: string, status: MockRequest['status']) => void;
  assignRequest: (id: string, workerName: string) => void;
  markItemAsPicked: (requestId: string, itemId: string) => void;
  dispatchRequestToLine: (requestId: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// ─── Initial Data ─────────────────────────────────────────────────────────────

const initialTransferDocuments: TransferDocument[] = [
  {
    id: 'TRF-001',
    sourceType: 'LINE_BUFFER',
    sourceLineId: '1',
    sourceLineName: 'Assembly Line A',
    destinationWarehouseId: 'WH-001',
    productItems: [
      { sku: 'DT-FL-001', productName: 'Door Trim Front Left', quantity: 500, batch: 'BATCH-2026-04-28-001', qcStatus: 'PASSED' },
      { sku: 'DT-FR-002', productName: 'Door Trim Front Right', quantity: 500, batch: 'BATCH-2026-04-28-002', qcStatus: 'PASSED' },
    ],
    createdAt: new Date().toISOString(),
    createdBy: 'Production Operator',
    qrCode: 'TRF-001-QR',
    status: 'PENDING_RECEIVING',
  },
];

const initialFinishedGoods: FinishedGoodsRecord[] = [
  {
    id: 'FG-001',
    sku: 'DT-FL-001',
    productName: 'Door Trim Front Left',
    unitPrice: 45000,
    totalQuantity: 3500,
    reservedQuantity: 2000,
    availableQuantity: 1400,
    blockedQuantity: 100,
    lowStockThreshold: 500,
    batches: [
      { batch: 'BATCH-2026-04-15-001', quantity: 1200, qcDate: '2026-04-15', sourceLine: 'Assembly Line A', warehouseLocation: 'Z-001', receivedAt: '2026-04-15T08:00:00Z', receivedBy: 'Operator 1', productionDate: '2026-04-15', shift: 'A' },
      { batch: 'BATCH-2026-04-20-002', quantity: 1300, qcDate: '2026-04-20', sourceLine: 'Assembly Line B', warehouseLocation: 'Z-002', receivedAt: '2026-04-20T14:00:00Z', receivedBy: 'Operator 2', productionDate: '2026-04-20', shift: 'B' },
      { batch: 'BATCH-2026-04-27-003', quantity: 1000, qcDate: '2026-04-27', sourceLine: 'Assembly Line A', warehouseLocation: 'Z-003', receivedAt: '2026-04-27T10:00:00Z', receivedBy: 'Operator 1', productionDate: '2026-04-27', shift: 'A' },
    ],
    warehouseLocations: ['Z-001', 'Z-002', 'Z-003'],
    sourceLines: ['Assembly Line A', 'Assembly Line B'],
    status: 'AVAILABLE_FOR_SALE',
    lastUpdated: new Date().toISOString(),
  },
];

const initialRequests: MockRequest[] = [
  {
    id: 'PK-102',
    planId: 'Plan B-2',
    status: 'Pending',
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    items: [
      { id: '1', name: 'Metal Clips', partNumber: 'COMP-001', requiredQty: 200, currentStock: 50000 },
      { id: '2', name: 'Rubber Seals', partNumber: 'COMP-002', requiredQty: 50, currentStock: 200 }
    ],
    targetTime: Date.now() + 45 * 60000,
    priority: 'Normal', type: 'Picking', source: 'Zone A', destination: 'Line B',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
  },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [transferDocuments, setTransferDocuments] = useState<TransferDocument[]>(initialTransferDocuments);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodsRecord[]>(initialFinishedGoods);
  const [goodsIssueLog, setGoodsIssueLog] = useState<GoodsIssueEvent[]>([]);
  const [requests, setRequests] = useState<MockRequest[]>(initialRequests);

  const computeStatus = (fg: FinishedGoodsRecord): FinishedGoodsRecord['status'] => {
    if (fg.availableQuantity <= 0) return 'OUT_OF_STOCK';
    if (fg.lowStockThreshold && fg.availableQuantity < fg.lowStockThreshold) return 'LOW_STOCK';
    if (fg.reservedQuantity > 0 && fg.availableQuantity === 0) return 'RESERVED';
    return 'AVAILABLE_FOR_SALE';
  };

  const addGoodsIssueEvent = useCallback((event: GoodsIssueEvent) => {
    setGoodsIssueLog(prev => [event, ...prev]);
  }, []);

  const addMaterialRequest = (planId: string, items: PickListItem[], priority: 'High' | 'Normal' | 'Low' = 'Normal', type = 'Picking', destination = 'Production Line') => {
    const newRequest: MockRequest = {
      id: `REQ-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
      planId, status: 'Pending',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items, targetTime: Date.now() + (priority === 'High' ? 15 * 60000 : 45 * 60000),
      priority, type, destination, createdAt: new Date().toISOString()
    };
    setRequests(prev => [newRequest, ...prev]);
  };

  const updateRequestStatus = (id: string, status: MockRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const assignRequest = (id: string, assignee: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, assignee } : r));
  };

  const markItemAsPicked = (requestId: string, itemId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        items: r.items.map(item => item.id === itemId ? { ...item, isPicked: true } : item)
      };
    }));
  };

  const dispatchRequestToLine = (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return { ...r, status: 'IN_TRANSIT_TO_LINE' };
    }));
    toast.success(`Request ${requestId} dispatched to line via atomic transaction.`, { icon: '🚛' });
  };

  const createTransferDocument = (transfer: Omit<TransferDocument, 'id' | 'qrCode' | 'createdAt'>): TransferDocument => {
    const id = `TRF-${Date.now()}`;
    const newTransfer: TransferDocument = { ...transfer, id, qrCode: `${id}-QR`, createdAt: new Date().toISOString() };
    setTransferDocuments(prev => [...prev, newTransfer]);
    return newTransfer;
  };

  const updateTransferStatus = (id: string, status: TransferStatus, receivedBy?: string, locations?: Record<string, string>, rejectedReason?: string) => {
    setTransferDocuments(prev => prev.map(t => t.id === id ? {
      ...t, status,
      receivedAt: status === 'RECEIVED' ? new Date().toISOString() : t.receivedAt,
      receivedBy: receivedBy || t.receivedBy,
      warehouseLocations: locations || t.warehouseLocations,
      rejectedReason: rejectedReason || t.rejectedReason,
    } : t));
  };

  const acceptTransfer = (transferId: string, receivedBy: string, locations: Record<string, string>) => {
    const transfer = transferDocuments.find(t => t.id === transferId);
    if (!transfer) return;
    updateTransferStatus(transferId, 'RECEIVED', receivedBy, locations);
    transfer.productItems.forEach(item => {
      if (item.qcStatus !== 'PASSED') return;
      const location = locations[item.sku] || 'UNKNOWN';
      const batch = {
        batch: item.batch, quantity: item.quantity,
        qcDate: new Date().toISOString().split('T')[0],
        sourceLine: transfer.sourceLineName,
        warehouseLocation: location,
        receivedAt: new Date().toISOString(),
        receivedBy,
        productionDate: new Date().toISOString().split('T')[0],
        shift: 'A' as const,
      };
      setFinishedGoods(prev => {
        const existing = prev.find(fg => fg.sku === item.sku);
        if (existing) {
          return prev.map(fg => fg.sku === item.sku ? {
            ...fg,
            totalQuantity: fg.totalQuantity + item.quantity,
            availableQuantity: fg.availableQuantity + item.quantity,
            batches: [...fg.batches, batch],
            warehouseLocations: fg.warehouseLocations.includes(location) ? fg.warehouseLocations : [...fg.warehouseLocations, location],
            sourceLines: fg.sourceLines.includes(transfer.sourceLineName) ? fg.sourceLines : [...fg.sourceLines, transfer.sourceLineName],
            lastUpdated: new Date().toISOString(),
          } : fg);
        } else {
          const newFg: FinishedGoodsRecord = {
            id: `FG-${Date.now()}-${item.sku}`, sku: item.sku, productName: item.productName,
            totalQuantity: item.quantity, reservedQuantity: 0, availableQuantity: item.quantity,
            blockedQuantity: 0, batches: [batch],
            warehouseLocations: [location], sourceLines: [transfer.sourceLineName],
            status: 'AVAILABLE_FOR_SALE', lastUpdated: new Date().toISOString(),
          };
          return [...prev, newFg];
        }
      });
    });
  };

  const rejectTransfer = (transferId: string, receivedBy: string, reason: string) => {
    updateTransferStatus(transferId, 'REJECTED', receivedBy, undefined, reason);
  };

  const getTransferByQR = (qrCode: string): TransferDocument | undefined => {
    return transferDocuments.find(t => t.qrCode === qrCode || t.id === qrCode);
  };

  const reserveFinishedGoods = (sku: string, quantity: number) => {
    setFinishedGoods(prev => prev.map(fg => fg.sku === sku && fg.availableQuantity >= quantity ? {
      ...fg,
      reservedQuantity: fg.reservedQuantity + quantity,
      availableQuantity: fg.availableQuantity - quantity,
      status: computeStatus({ ...fg, availableQuantity: fg.availableQuantity - quantity }),
      lastUpdated: new Date().toISOString(),
    } : fg));
  };

  const releaseReservation = (sku: string, quantity: number) => {
    setFinishedGoods(prev => prev.map(fg => fg.sku === sku ? {
      ...fg,
      reservedQuantity: Math.max(0, fg.reservedQuantity - quantity),
      availableQuantity: fg.availableQuantity + quantity,
      status: computeStatus({ ...fg, availableQuantity: fg.availableQuantity + quantity }),
      lastUpdated: new Date().toISOString(),
    } : fg));
  };

  const blockStock = (sku: string, quantity: number, _reason: string) => {
    setFinishedGoods(prev => prev.map(fg => fg.sku === sku && fg.availableQuantity >= quantity ? {
      ...fg,
      blockedQuantity: fg.blockedQuantity + quantity,
      availableQuantity: fg.availableQuantity - quantity,
      status: computeStatus({ ...fg, availableQuantity: fg.availableQuantity - quantity }),
      lastUpdated: new Date().toISOString(),
    } : fg));
  };

  const unblockStock = (sku: string, quantity: number) => {
    setFinishedGoods(prev => prev.map(fg => fg.sku === sku ? {
      ...fg,
      blockedQuantity: Math.max(0, fg.blockedQuantity - quantity),
      availableQuantity: fg.availableQuantity + quantity,
      status: computeStatus({ ...fg, availableQuantity: fg.availableQuantity + quantity }),
      lastUpdated: new Date().toISOString(),
    } : fg));
  };

  const shipFinishedGoods = (sku: string, quantity: number) => {
    setFinishedGoods(prev => prev.map(fg => fg.sku === sku ? {
      ...fg,
      totalQuantity: Math.max(0, fg.totalQuantity - quantity),
      reservedQuantity: Math.max(0, fg.reservedQuantity - quantity),
      status: computeStatus({ ...fg, totalQuantity: Math.max(0, fg.totalQuantity - quantity) }),
      lastUpdated: new Date().toISOString(),
    } : fg));
  };

  return (
    <WarehouseContext.Provider value={{
      transferDocuments, finishedGoods, setFinishedGoods, goodsIssueLog,
      createTransferDocument, updateTransferStatus, acceptTransfer,
      rejectTransfer, getTransferByQR, reserveFinishedGoods,
      releaseReservation, blockStock, unblockStock,
      shipFinishedGoods, addGoodsIssueEvent,
      requests, addMaterialRequest, updateRequestStatus, assignRequest,
      markItemAsPicked, dispatchRequestToLine,
    }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error('useWarehouse must be used within WarehouseProvider');
  return context;
}
