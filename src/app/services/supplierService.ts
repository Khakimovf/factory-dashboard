/**
 * Supplier Service
 * Handles supplier performance calculations, ratings, and risk assessment
 */

export type SupplierStatus = 'active' | 'blocked' | 'blacklisted';
export type SupplyRisk = 'low' | 'medium' | 'high';

export interface DeliveryRecord {
  id: string;
  date: string; // ISO date string
  materialId: string;
  materialName: string;
  quantity: number;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  delayDays: number; // Negative if early, positive if late
  defectCount?: number; // From QC module
  totalQuantity?: number; // For defect rate calculation
}

export interface SupplierRating {
  overall: number; // 0-100
  onTimeDeliveryRate: number; // Percentage
  averageDelayDays: number; // Can be negative
  defectRate: number; // Percentage
  trend: 'up' | 'down' | 'stable'; // Compared to previous period
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  materials: { materialId: string; quantity: number; price: number }[];
  totalAmount: number;
}

export interface EnhancedSupplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: SupplierStatus;
  suppliedMaterials: string[]; // Material IDs
  prices: Record<string, number>; // Material ID -> price per unit
  deliveryTime: number; // Days (promised)
  reliability: number; // Legacy field (0-100), kept for backward compatibility
  // New fields
  rating?: SupplierRating;
  deliveryHistory?: DeliveryRecord[];
  purchaseOrders?: PurchaseOrder[];
  riskLevel?: SupplyRisk;
}

/**
 * Calculate supplier rating based on delivery history
 */
export function calculateSupplierRating(
  deliveryHistory: DeliveryRecord[],
  previousPeriodHistory?: DeliveryRecord[]
): SupplierRating {
  if (deliveryHistory.length === 0) {
    return {
      overall: 0,
      onTimeDeliveryRate: 0,
      averageDelayDays: 0,
      defectRate: 0,
      trend: 'stable',
    };
  }

  // Calculate on-time delivery rate
  const onTimeDeliveries = deliveryHistory.filter(
    d => d.delayDays <= 0
  ).length;
  const onTimeDeliveryRate = (onTimeDeliveries / deliveryHistory.length) * 100;

  // Calculate average delay
  const totalDelay = deliveryHistory.reduce((sum, d) => sum + d.delayDays, 0);
  const averageDelayDays = totalDelay / deliveryHistory.length;

  // Calculate defect rate
  const totalDefects = deliveryHistory.reduce(
    (sum, d) => sum + (d.defectCount || 0),
    0
  );
  const totalQuantity = deliveryHistory.reduce(
    (sum, d) => sum + (d.totalQuantity || d.quantity),
    0
  );
  const defectRate = totalQuantity > 0 ? (totalDefects / totalQuantity) * 100 : 0;

  // Calculate overall rating (weighted)
  // On-time: 40%, Delay: 30%, Defect rate: 30%
  const delayScore = Math.max(0, 100 - Math.abs(averageDelayDays) * 10); // -10 points per day
  const defectScore = Math.max(0, 100 - defectRate * 2); // -2 points per % defect
  const overall = (onTimeDeliveryRate * 0.4) + (delayScore * 0.3) + (defectScore * 0.3);

  // Determine trend
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (previousPeriodHistory && previousPeriodHistory.length > 0) {
    const prevOnTimeRate =
      (previousPeriodHistory.filter(d => d.delayDays <= 0).length /
        previousPeriodHistory.length) *
      100;
    if (onTimeDeliveryRate > prevOnTimeRate + 5) trend = 'up';
    else if (onTimeDeliveryRate < prevOnTimeRate - 5) trend = 'down';
  }

  return {
    overall: Math.round(overall),
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
    averageDelayDays: Math.round(averageDelayDays * 10) / 10,
    defectRate: Math.round(defectRate * 10) / 10,
    trend,
  };
}

/**
 * Calculate supply risk level
 */
export function calculateSupplyRisk(
  rating: SupplierRating,
  status: SupplierStatus,
  recentDelays: number // Number of delayed deliveries in last 3 months
): SupplyRisk {
  // Blacklisted suppliers are always high risk
  if (status === 'blacklisted') return 'high';
  if (status === 'blocked') return 'high';

  // High risk conditions
  if (
    rating.overall < 60 ||
    rating.averageDelayDays > 5 ||
    recentDelays > 3 ||
    rating.defectRate > 10
  ) {
    return 'high';
  }

  // Medium risk conditions
  if (
    rating.overall < 75 ||
    rating.averageDelayDays > 2 ||
    recentDelays > 1 ||
    rating.defectRate > 5
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get status color classes
 */
export function getStatusColor(status: SupplierStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'blocked':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'blacklisted':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
}

/**
 * Get risk color classes
 */
export function getRiskColor(risk: SupplyRisk): string {
  switch (risk) {
    case 'low':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
}

/**
 * Generate mock delivery history for a supplier
 */
export function generateMockDeliveryHistory(
  supplierId: string,
  materialIds: string[],
  materialNames: Record<string, string>
): DeliveryRecord[] {
  const history: DeliveryRecord[] = [];
  const today = new Date();
  
  // Generate last 6 months of deliveries
  for (let i = 0; i < 12; i++) {
    const deliveryDate = new Date(today);
    deliveryDate.setMonth(deliveryDate.getMonth() - i);
    
    const materialId = materialIds[Math.floor(Math.random() * materialIds.length)];
    const expectedDate = new Date(deliveryDate);
    expectedDate.setDate(expectedDate.getDate() - 5); // Expected 5 days before
    
    const delayDays = Math.floor(Math.random() * 10) - 2; // -2 to 7 days
    const actualDate = new Date(expectedDate);
    actualDate.setDate(actualDate.getDate() + delayDays);
    
    const quantity = Math.floor(Math.random() * 1000) + 100;
    const defectCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
    
    history.push({
      id: `delivery-${supplierId}-${i}`,
      date: deliveryDate.toISOString().split('T')[0],
      materialId,
      materialName: materialNames[materialId] || materialId,
      quantity,
      expectedDeliveryDate: expectedDate.toISOString().split('T')[0],
      actualDeliveryDate: actualDate.toISOString().split('T')[0],
      delayDays,
      defectCount,
      totalQuantity: quantity,
    });
  }
  
  return history.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get suppliers that can be selected in purchase orders
 * Blocked and blacklisted suppliers are excluded
 */
export function getSelectableSuppliers(suppliers: EnhancedSupplier[]): EnhancedSupplier[] {
  return suppliers.filter(s => s.status === 'active');
}

/**
 * Generate mock purchase orders for a supplier
 */
export function generateMockPurchaseOrders(
  supplierId: string,
  materialIds: string[],
  prices: Record<string, number>
): PurchaseOrder[] {
  const orders: PurchaseOrder[] = [];
  const today = new Date();
  const statuses: PurchaseOrder['status'][] = ['pending', 'in_transit', 'delivered', 'delivered', 'delivered'];
  
  for (let i = 0; i < 5; i++) {
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() - (i * 10));
    
    const expectedDate = new Date(orderDate);
    expectedDate.setDate(expectedDate.getDate() + 7);
    
    const materialId = materialIds[Math.floor(Math.random() * materialIds.length)];
    const quantity = Math.floor(Math.random() * 500) + 50;
    const price = prices[materialId] || 0;
    
    orders.push({
      id: `po-${supplierId}-${i}`,
      supplierId,
      orderDate: orderDate.toISOString().split('T')[0],
      expectedDeliveryDate: expectedDate.toISOString().split('T')[0],
      status: statuses[i] || 'delivered',
      materials: [{ materialId, quantity, price }],
      totalAmount: quantity * price,
    });
  }
  
  return orders.sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
}
