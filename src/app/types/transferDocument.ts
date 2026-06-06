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
  warehouseLocations?: Record<string, string>;
}

export interface FinishedGoodsBatch {
  batch: string;
  quantity: number;
  qcDate: string;
  sourceLine: string;
  warehouseLocation: string;
  receivedAt: string;
  receivedBy: string;
  unitPrice?: number;
  productionDate?: string;
  shift?: 'A' | 'B' | 'C';
}

export interface GoodsIssueEvent {
  id: string;
  soId: string;
  sku: string;
  batchId: string;
  quantity: number;
  binLocation: string;
  timestamp: string;
  actor: string;
  role: string;
}

export interface FinishedGoodsRecord {
  id: string;
  sku: string;
  productName: string;
  unitPrice?: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  blockedQuantity: number;
  lowStockThreshold?: number;
  batches: FinishedGoodsBatch[];
  warehouseLocations: string[];
  sourceLines: string[];
  status: 'AVAILABLE_FOR_SALE' | 'RESERVED' | 'SHIPPED' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
}
