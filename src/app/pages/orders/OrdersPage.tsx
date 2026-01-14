import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShoppingCart, Plus, Eye, Calendar, User, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerContact: string;
  productName: string;
  quantity: number;
  orderDate: string;
  dueDate: string;
  status: 'new' | 'in_production' | 'completed';
  assignedLineId?: string;
  assignedLineName?: string;
  notes?: string;
}

const initialOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerName: 'O\'zbekiston Temir Yo\'llari',
    customerContact: '+998 90 123 4567',
    productName: 'Vagon detallari',
    quantity: 500,
    orderDate: '2025-01-10',
    dueDate: '2025-02-15',
    status: 'in_production',
    assignedLineId: '1',
    assignedLineName: 'Assembly Line A',
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerName: 'UzAuto Motors',
    customerContact: '+998 93 234 5678',
    productName: 'Avtomobil komponentlari',
    quantity: 1000,
    orderDate: '2025-01-12',
    dueDate: '2025-02-20',
    status: 'new',
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerName: 'Metallurgiya Zavodi',
    customerContact: '+998 94 345 6789',
    productName: 'Metall konstruksiyalar',
    quantity: 250,
    orderDate: '2025-01-08',
    dueDate: '2025-01-30',
    status: 'completed',
    assignedLineId: '2',
    assignedLineName: 'Assembly Line B',
  },
];

export function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState<Omit<Order, 'id' | 'orderNumber'>>({
    customerName: '',
    customerContact: '',
    productName: '',
    quantity: 0,
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'new',
  });

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(o => o.status === selectedStatus);

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setSelectedOrder(order);
    } else {
      setSelectedOrder(null);
      setFormData({
        customerName: '',
        customerContact: '',
        productName: '',
        quantity: 0,
        orderDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'new',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.customerName || !formData.productName || !formData.quantity) {
      toast.error(t('orders.validation.required'));
      return;
    }

    if (selectedOrder) {
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...selectedOrder, ...formData } : o));
      toast.success(t('orders.updateSuccess'));
    } else {
      const newOrder: Order = {
        ...formData,
        id: Date.now().toString(),
        orderNumber: `ORD-2025-${String(orders.length + 1).padStart(3, '0')}`,
      };
      setOrders([newOrder, ...orders]);
      toast.success(t('orders.createSuccess'));
    }
    setIsDialogOpen(false);
  };

  const handleStatusChange = (id: string, status: 'new' | 'in_production' | 'completed') => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    toast.success(t('orders.statusUpdated'));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      in_production: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    };
    return variants[status as keyof typeof variants] || variants.new;
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {t('orders.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('orders.subtitle')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('orders.addOrder')}
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('orders.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('orders.allStatuses')}</SelectItem>
            <SelectItem value="new">{t('orders.new')}</SelectItem>
            <SelectItem value="in_production">{t('orders.inProduction')}</SelectItem>
            <SelectItem value="completed">{t('orders.completed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.orderNumber')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.customer')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.product')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.quantity')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.dueDate')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('orders.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t('orders.noOrders')}
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerContact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.dueDate}</td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusBadge(order.status)}>
                        {t(`orders.${order.status}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t('orders.view')}
                        </Button>
                        {order.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, 'in_production')}
                            className="text-yellow-600 dark:text-yellow-400"
                          >
                            {t('orders.startProduction')}
                          </Button>
                        )}
                        {order.status === 'in_production' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="text-green-600 dark:text-green-400"
                          >
                            {t('orders.complete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder ? t('orders.orderDetails') : t('orders.addOrder')}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? t('orders.viewOrderInfo') : t('orders.createNewOrder')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('orders.orderNumber')}: {selectedOrder.orderNumber}
                </p>
                {selectedOrder.assignedLineName && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('orders.assignedLine')}: {selectedOrder.assignedLineName}
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">{t('orders.customerName')} *</Label>
                <Input
                  id="customerName"
                  value={selectedOrder ? selectedOrder.customerName : formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  disabled={!!selectedOrder}
                />
              </div>
              <div>
                <Label htmlFor="customerContact">{t('orders.customerContact')}</Label>
                <Input
                  id="customerContact"
                  value={selectedOrder ? selectedOrder.customerContact : formData.customerContact}
                  onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                  disabled={!!selectedOrder}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="productName">{t('orders.productName')} *</Label>
              <Input
                id="productName"
                value={selectedOrder ? selectedOrder.productName : formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                disabled={!!selectedOrder}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">{t('orders.quantity')} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={selectedOrder ? selectedOrder.quantity : formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  disabled={!!selectedOrder}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">{t('orders.dueDate')}</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={selectedOrder ? selectedOrder.dueDate : formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  disabled={!!selectedOrder}
                />
              </div>
            </div>
            {selectedOrder && (
              <div>
                <Label>{t('orders.status')}</Label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t('orders.new')}</SelectItem>
                    <SelectItem value="in_production">{t('orders.inProduction')}</SelectItem>
                    <SelectItem value="completed">{t('orders.completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('orders.close')}
            </Button>
            {!selectedOrder && (
              <Button onClick={handleSave}>{t('orders.create')}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
