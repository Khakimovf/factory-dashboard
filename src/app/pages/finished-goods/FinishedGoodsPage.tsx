import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Package, Plus, AlertTriangle, MapPin, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export interface FinishedProduct {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  minStock: number;
  location: string;
  status: 'in_stock' | 'reserved' | 'shipped';
  orderId?: string;
  orderNumber?: string;
  lastUpdated: string;
}

export const initialFinishedProducts: FinishedProduct[] = [
  {
    id: '1',
    productName: 'Vagon detallari',
    productCode: 'VD-001',
    quantity: 450,
    minStock: 100,
    location: 'Ombor A-1',
    status: 'in_stock',
    lastUpdated: '2025-01-15',
  },
  {
    id: '2',
    productName: 'Avtomobil komponentlari',
    productCode: 'AK-002',
    quantity: 850,
    minStock: 200,
    location: 'Ombor A-2',
    status: 'in_stock',
    lastUpdated: '2025-01-15',
  },
  {
    id: '3',
    productName: 'Metall konstruksiyalar',
    productCode: 'MK-003',
    quantity: 75,
    minStock: 100,
    location: 'Ombor B-1',
    status: 'in_stock',
    orderId: '3',
    orderNumber: 'ORD-2025-003',
    lastUpdated: '2025-01-14',
  },
  {
    id: '4',
    productName: 'Elektron komponentlar',
    productCode: 'EK-004',
    quantity: 1200,
    minStock: 500,
    location: 'Ombor B-2',
    status: 'reserved',
    orderId: '1',
    orderNumber: 'ORD-2025-001',
    lastUpdated: '2025-01-15',
  },
];

export function FinishedGoodsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<FinishedProduct[]>(initialFinishedProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState<Omit<FinishedProduct, 'id' | 'lastUpdated'>>({
    productName: '',
    productCode: '',
    quantity: 0,
    minStock: 0,
    location: '',
    status: 'in_stock',
  });

  const lowStockProducts = products.filter(p => p.quantity <= p.minStock && p.status === 'in_stock');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = () => {
    setFormData({
      productName: '',
      productCode: '',
      quantity: 0,
      minStock: 0,
      location: '',
      status: 'in_stock',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.productName || !formData.productCode || !formData.location) {
      toast.error(t('finishedGoods.validation.required'));
      return;
    }

    const newProduct: FinishedProduct = {
      ...formData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setProducts([newProduct, ...products]);
    toast.success(t('finishedGoods.createSuccess'));
    setIsDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      in_stock: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      reserved: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      shipped: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    };
    return variants[status as keyof typeof variants] || variants.in_stock;
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {t('finishedGoods.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('finishedGoods.subtitle')}</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          {t('finishedGoods.addProduct')}
        </Button>
      </div>

      {/* Low Stock Warning */}
      {lowStockProducts.length > 0 && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
              {t('finishedGoods.lowStockWarning').replace('{count}', lowStockProducts.length.toString())}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <Input
            placeholder={t('finishedGoods.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('finishedGoods.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('finishedGoods.allStatuses')}</SelectItem>
            <SelectItem value="in_stock">{t('finishedGoods.inStock')}</SelectItem>
            <SelectItem value="reserved">{t('finishedGoods.reserved')}</SelectItem>
            <SelectItem value="shipped">{t('finishedGoods.shipped')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            {t('finishedGoods.noProducts')}
          </div>
        ) : (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                product.quantity <= product.minStock
                  ? 'border-orange-300 dark:border-orange-700'
                  : 'border-gray-200 dark:border-gray-700'
              } p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {product.productName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.productCode}</p>
                </div>
                <Badge className={getStatusBadge(product.status)}>
                  {t(`finishedGoods.${product.status}`)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('finishedGoods.quantity')}</span>
                  <span className={`text-lg font-semibold ${
                    product.quantity <= product.minStock
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {product.quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('finishedGoods.minStock')}</span>
                  <span className="text-sm text-gray-900 dark:text-white">{product.minStock}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
                {product.orderNumber && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('finishedGoods.linkedOrder')}: {product.orderNumber}
                    </p>
                  </div>
                )}
                {product.quantity <= product.minStock && (
                  <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('finishedGoods.lowStock')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finishedGoods.addProduct')}</DialogTitle>
            <DialogDescription>{t('finishedGoods.dialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">{t('finishedGoods.productName')} *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder={t('finishedGoods.productNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="productCode">{t('finishedGoods.productCode')} *</Label>
              <Input
                id="productCode"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                placeholder="VD-001"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">{t('finishedGoods.quantity')} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="minStock">{t('finishedGoods.minStock')}</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">{t('finishedGoods.location')} *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ombor A-1"
              />
            </div>
            <div>
              <Label htmlFor="status">{t('finishedGoods.status')}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">{t('finishedGoods.inStock')}</SelectItem>
                  <SelectItem value="reserved">{t('finishedGoods.reserved')}</SelectItem>
                  <SelectItem value="shipped">{t('finishedGoods.shipped')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('finishedGoods.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('finishedGoods.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
