import { createContext, useContext, useState, ReactNode } from 'react';
import { TransferDocument, TransferStatus, FinishedGoodsRecord } from '../types/transferDocument';

export interface PickListItem {
  id: string;
  name: string;
  partNumber: string;
  requiredQty: number;
  currentStock: number;
  binLocation?: string;
}

export interface MockRequest {
  id: string;
  planId: string;
  status: 'Pending' | 'Issuing' | 'ON LINE' | 'Completed';
  time: string;
  items: PickListItem[];
  targetTime: number;
  priority?: 'Normal' | 'High';
}

interface WarehouseContextType {
  transferDocuments: TransferDocument[];
  finishedGoods: FinishedGoodsRecord[];
  createTransferDocument: (transfer: Omit<TransferDocument, 'id' | 'qrCode' | 'createdAt'>) => TransferDocument;
  updateTransferStatus: (id: string, status: TransferStatus, receivedBy?: string, locations?: Record<string, string>, rejectedReason?: string) => void;
  acceptTransfer: (transferId: string, receivedBy: string, locations: Record<string, string>) => void;
  rejectTransfer: (transferId: string, receivedBy: string, reason: string) => void;
  getTransferByQR: (qrCode: string) => TransferDocument | undefined;
  reserveFinishedGoods: (sku: string, quantity: number) => void;
  releaseReservation: (sku: string, quantity: number) => void;
  requests: MockRequest[];
  addMaterialRequest: (planId: string, items: PickListItem[], priority?: 'Normal' | 'High') => void;
  updateRequestStatus: (id: string, status: MockRequest['status']) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// Mock initial data
const initialTransferDocuments: TransferDocument[] = [
  {
    id: 'TRF-001',
    sourceType: 'LINE_BUFFER',
    sourceLineId: '1',
    sourceLineName: 'Assembly Line A',
    destinationWarehouseId: 'WH-001',
    productItems: [
      { sku: 'DT-ALL-001', productName: 'Door Trim ALL', quantity: 45, batch: 'BATCH-2025-01-15-001', qcStatus: 'PASSED' },
      { sku: 'DP-PNL-002', productName: 'Dashboard Panel', quantity: 32, batch: 'BATCH-2025-01-15-002', qcStatus: 'PASSED' },
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
    sku: 'VD-001',
    productName: 'Vagon detallari',
    totalQuantity: 450,
    reservedQuantity: 50,
    availableQuantity: 400,
    batches: [
      {
        batch: 'BATCH-2025-01-10-001',
        quantity: 200,
        qcDate: '2025-01-10',
        sourceLine: 'Assembly Line A',
        warehouseLocation: 'A-1',
        receivedAt: '2025-01-10T10:00:00',
        receivedBy: 'Warehouse Operator 1',
      },
      {
        batch: 'BATCH-2025-01-12-002',
        quantity: 250,
        qcDate: '2025-01-12',
        sourceLine: 'Assembly Line B',
        warehouseLocation: 'A-2',
        receivedAt: '2025-01-12T14:30:00',
        receivedBy: 'Warehouse Operator 2',
      },
    ],
    warehouseLocations: ['A-1', 'A-2'],
    sourceLines: ['Assembly Line A', 'Assembly Line B'],
    status: 'AVAILABLE_FOR_SALE',
    lastUpdated: '2025-01-15T08:00:00',
  },
];

const initialRequests: MockRequest[] = [];

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [transferDocuments, setTransferDocuments] = useState<TransferDocument[]>(initialTransferDocuments);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodsRecord[]>(initialFinishedGoods);
  const [requests, setRequests] = useState<MockRequest[]>(initialRequests);

  const addMaterialRequest = (planId: string, items: PickListItem[], priority: 'Normal' | 'High' = 'Normal') => {
    const newRequest: MockRequest = {
      id: `REQ-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`,
      planId,
      status: 'Pending',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items,
      targetTime: Date.now() + (priority === 'High' ? 15 * 60000 : 45 * 60000),
      priority
    };
    setRequests(prev => [newRequest, ...prev]);
  };

  const updateRequestStatus = (id: string, status: MockRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const createTransferDocument = (transfer: Omit<TransferDocument, 'id' | 'qrCode' | 'createdAt'>): TransferDocument => {
    const id = `TRF-${Date.now()}`;
    const newTransfer: TransferDocument = {
      ...transfer,
      id,
      qrCode: `${id}-QR`,
      createdAt: new Date().toISOString(),
    };
    setTransferDocuments(prev => [...prev, newTransfer]);
    return newTransfer;
  };

  const updateTransferStatus = (
    id: string,
    status: TransferStatus,
    receivedBy?: string,
    locations?: Record<string, string>,
    rejectedReason?: string
  ) => {
    setTransferDocuments(prev =>
      prev.map(transfer =>
        transfer.id === id
          ? {
            ...transfer,
            status,
            receivedAt: status === 'RECEIVED' ? new Date().toISOString() : transfer.receivedAt,
            receivedBy: receivedBy || transfer.receivedBy,
            warehouseLocations: locations || transfer.warehouseLocations,
            rejectedReason: rejectedReason || transfer.rejectedReason,
          }
          : transfer
      )
    );
  };

  const acceptTransfer = (transferId: string, receivedBy: string, locations: Record<string, string>) => {
    const transfer = transferDocuments.find(t => t.id === transferId);
    if (!transfer) return;

    // Update transfer status
    updateTransferStatus(transferId, 'RECEIVED', receivedBy, locations);

    // Create or update finished goods records
    transfer.productItems.forEach(item => {
      if (item.qcStatus !== 'PASSED') return;

      const existingGoods = finishedGoods.find(fg => fg.sku === item.sku);
      const location = locations[item.sku] || 'UNKNOWN';
      const batch = {
        batch: item.batch,
        quantity: item.quantity,
        qcDate: new Date().toISOString().split('T')[0],
        sourceLine: transfer.sourceLineName,
        warehouseLocation: location,
        receivedAt: new Date().toISOString(),
        receivedBy,
      };

      if (existingGoods) {
        // Update existing record
        setFinishedGoods(prev =>
          prev.map(fg =>
            fg.sku === item.sku
              ? {
                ...fg,
                totalQuantity: fg.totalQuantity + item.quantity,
                availableQuantity: fg.availableQuantity + item.quantity,
                batches: [...fg.batches, batch],
                warehouseLocations: fg.warehouseLocations.includes(location)
                  ? fg.warehouseLocations
                  : [...fg.warehouseLocations, location],
                sourceLines: fg.sourceLines.includes(transfer.sourceLineName)
                  ? fg.sourceLines
                  : [...fg.sourceLines, transfer.sourceLineName],
                lastUpdated: new Date().toISOString(),
              }
              : fg
          )
        );
      } else {
        // Create new record
        const newGoods: FinishedGoodsRecord = {
          id: `FG-${Date.now()}-${item.sku}`,
          sku: item.sku,
          productName: item.productName,
          totalQuantity: item.quantity,
          reservedQuantity: 0,
          availableQuantity: item.quantity,
          batches: [batch],
          warehouseLocations: [location],
          sourceLines: [transfer.sourceLineName],
          status: 'AVAILABLE_FOR_SALE',
          lastUpdated: new Date().toISOString(),
        };
        setFinishedGoods(prev => [...prev, newGoods]);
      }
    });
  };

  const rejectTransfer = (transferId: string, receivedBy: string, reason: string) => {
    updateTransferStatus(transferId, 'REJECTED', receivedBy, undefined, reason);
  };

  const getTransferByQR = (qrCode: string): TransferDocument | undefined => {
    return transferDocuments.find(t => t.qrCode === qrCode || t.id === qrCode);
  };

  const reserveFinishedGoods = (sku: string, quantity: number) => {
    setFinishedGoods(prev =>
      prev.map(fg =>
        fg.sku === sku && fg.availableQuantity >= quantity
          ? {
            ...fg,
            reservedQuantity: fg.reservedQuantity + quantity,
            availableQuantity: fg.availableQuantity - quantity,
            status: fg.availableQuantity - quantity === 0 ? 'RESERVED' : fg.status,
            lastUpdated: new Date().toISOString(),
          }
          : fg
      )
    );
  };

  const releaseReservation = (sku: string, quantity: number) => {
    setFinishedGoods(prev =>
      prev.map(fg =>
        fg.sku === sku
          ? {
            ...fg,
            reservedQuantity: Math.max(0, fg.reservedQuantity - quantity),
            availableQuantity: fg.availableQuantity + quantity,
            status: 'AVAILABLE_FOR_SALE',
            lastUpdated: new Date().toISOString(),
          }
          : fg
      )
    );
  };

  return (
    <WarehouseContext.Provider
      value={{
        transferDocuments,
        finishedGoods,
        createTransferDocument,
        updateTransferStatus,
        acceptTransfer,
        rejectTransfer,
        getTransferByQR,
        reserveFinishedGoods,
        releaseReservation,
        requests,
        addMaterialRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within WarehouseProvider');
  }
  return context;
}
