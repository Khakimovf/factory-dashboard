export type OrderType =
  | 'hire'
  | 'termination'
  | 'position_change'
  | 'vacation'
  | 'disciplinary';

export type OrderStatus = 'draft' | 'sent' | 'approved' | 'rejected';

export interface HROrder {
  orderId: string;
  employeeId: string;
  employeeName: string;
  orderType: OrderType;
  date: string; // ISO string
  status: OrderStatus;
}

// Mock orders for HR orders module & statistics
export const hrOrders: HROrder[] = [
  {
    orderId: 'ORD-2026-001',
    employeeId: 'EMP-001',
    employeeName: 'Aliyev Sardor',
    orderType: 'hire',
    date: new Date().toISOString(),
    status: 'approved',
  },
  {
    orderId: 'ORD-2026-002',
    employeeId: 'EMP-002',
    employeeName: 'Karimova Dilnoza',
    orderType: 'vacation',
    date: new Date().toISOString(),
    status: 'draft',
  },
  {
    orderId: 'ORD-2025-015',
    employeeId: 'EMP-003',
    employeeName: 'Rustamov Bekzod',
    orderType: 'termination',
    date: '2025-11-25T08:00:00.000Z',
    status: 'approved',
  },
  {
    orderId: 'ORD-2025-022',
    employeeId: 'EMP-004',
    employeeName: 'Ismoilova Maftuna',
    orderType: 'position_change',
    date: '2025-12-15T08:00:00.000Z',
    status: 'sent',
  },
  {
    orderId: 'ORD-2025-030',
    employeeId: 'EMP-001',
    employeeName: 'Aliyev Sardor',
    orderType: 'disciplinary',
    date: '2025-12-20T08:00:00.000Z',
    status: 'rejected',
  },
];





