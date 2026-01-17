export type TransferStatus = 'DRAFT' | 'PENDING_RECEIVING' | 'RECEIVED' | 'REJECTED';
export type TransferSourceType = 'LINE_BUFFER';

export interface TransferProductItem {
  sku: string;
  productName: string;
  quantity: number;
  batch: string;
  qcStatus: 'PASSED' | 'FAILED' | 'PENDING';
}

export interface TransferDocument {
  id: string;
  sourceType: TransferSourceType;
  sourceLineId: string;
  sourceLineName: string;
  destinationWarehouseId: string;
  productItems: TransferProductItem[];
  createdAt: string;
  createdBy: string;
  qrCode: string;
  status: TransferStatus;
  receivedAt?: string;
  receivedBy?: string;
  rejectedReason?: string;
  warehouseLocations?: Record<string, string>; // SKU -> location (A-1, B-2, etc)
}

export interface FinishedGoodsRecord {
  id: string;
  sku: string;
  productName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  batches: {
    batch: string;
    quantity: number;
    qcDate: string;
    sourceLine: string;
    warehouseLocation: string;
    receivedAt: string;
    receivedBy: string;
  }[];
  warehouseLocations: string[];
  sourceLines: string[];
  status: 'AVAILABLE_FOR_SALE' | 'RESERVED' | 'SHIPPED';
  lastUpdated: string;
}
