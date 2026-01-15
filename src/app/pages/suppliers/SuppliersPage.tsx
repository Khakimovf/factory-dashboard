import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Package,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { toast } from 'sonner';
import {
  EnhancedSupplier,
  SupplierStatus,
  SupplyRisk,
  calculateSupplierRating,
  calculateSupplyRisk,
  getStatusColor,
  getRiskColor,
  generateMockDeliveryHistory,
  generateMockPurchaseOrders,
  DeliveryRecord,
  PurchaseOrder,
} from '../../services/supplierService';


// Convert legacy suppliers to enhanced format
export const initialSuppliers: EnhancedSupplier[] = [
  {
    id: '1',
    name: 'Metallurgiya TMC',
    contactPerson: 'Aliyev Akmal',
    phone: '+998 90 123 4567',
    email: 'info@metallurgiya.uz',
    address: 'Toshkent sh., Chilonzor t., Mustaqillik ko\'chasi 15',
    suppliedMaterials: ['1', '2'],
    prices: { '1': 85000, '2': 120000 },
    deliveryTime: 3,
    reliability: 95,
    status: 'active',
  },
  {
    id: '2',
    name: 'ElectroKomponent LLC',
    contactPerson: 'Karimova Malika',
    phone: '+998 93 234 5678',
    email: 'sales@electrokom.uz',
    address: 'Toshkent sh., Yunusobod t., Amir Temur ko\'chasi 45',
    suppliedMaterials: ['3', '5'],
    prices: { '3': 45000, '5': 32000 },
    deliveryTime: 5,
    reliability: 88,
    status: 'active',
  },
  {
    id: '3',
    name: 'Hardware Supply Co',
    contactPerson: 'Toshmatov Bahodir',
    phone: '+998 94 345 6789',
    email: 'order@hardware.uz',
    address: 'Toshkent sh., Mirzo-Ulug\'bek t., Navoiy ko\'chasi 78',
    suppliedMaterials: ['4'],
    prices: { '4': 2500 },
    deliveryTime: 2,
    reliability: 92,
    status: 'active',
  },
];

export function SuppliersPage() {
  const { materials } = useFactory();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Debug: Ensure component renders
  console.log('SuppliersPage rendered');
  const [suppliers, setSuppliers] = useState<EnhancedSupplier[]>(initialSuppliers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<EnhancedSupplier | null>(null);
  const [formData, setFormData] = useState<Omit<EnhancedSupplier, 'id'>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    suppliedMaterials: [],
    prices: {},
    deliveryTime: 0,
    reliability: 0,
    status: 'active',
  });

  // Initialize suppliers with delivery history and ratings
  useEffect(() => {
    setSuppliers(prevSuppliers =>
      prevSuppliers.map(supplier => {
        if (supplier.deliveryHistory && supplier.rating) {
          return supplier; // Already initialized
        }

        const materialNames: Record<string, string> = {};
        supplier.suppliedMaterials.forEach(id => {
          const material = materials.find(m => m.id === id);
          if (material) materialNames[id] = material.name;
        });

        const deliveryHistory = generateMockDeliveryHistory(
          supplier.id,
          supplier.suppliedMaterials,
          materialNames
        );

        const rating = calculateSupplierRating(deliveryHistory);
        const recentDelays = deliveryHistory
          .slice(0, 6)
          .filter(d => d.delayDays > 0).length;
        const riskLevel = calculateSupplyRisk(rating, supplier.status, recentDelays);
        const purchaseOrders = generateMockPurchaseOrders(
          supplier.id,
          supplier.suppliedMaterials,
          supplier.prices
        );

        return {
          ...supplier,
          deliveryHistory,
          rating,
          riskLevel,
          purchaseOrders,
        };
      })
    );
  }, [materials]);

  const handleOpenDialog = (supplier?: EnhancedSupplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        suppliedMaterials: supplier.suppliedMaterials,
        prices: supplier.prices,
        deliveryTime: supplier.deliveryTime,
        reliability: supplier.reliability,
        status: supplier.status,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        suppliedMaterials: [],
        prices: {},
        deliveryTime: 0,
        reliability: 0,
        status: 'active',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      suppliedMaterials: [],
      prices: {},
      deliveryTime: 0,
      reliability: 0,
      status: 'active',
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.contactPerson || !formData.phone) {
      toast.error(t('suppliers.validation.required'));
      return;
    }

    if (editingSupplier) {
      const updated = suppliers.find(s => s.id === editingSupplier.id);
      const updatedSupplier: EnhancedSupplier = {
        ...formData,
        id: editingSupplier.id,
        // Preserve existing calculated data
        deliveryHistory: updated?.deliveryHistory,
        rating: updated?.rating,
        riskLevel: updated?.riskLevel,
        purchaseOrders: updated?.purchaseOrders,
      };

      // Recalculate rating and risk if delivery history exists
      if (updatedSupplier.deliveryHistory) {
        updatedSupplier.rating = calculateSupplierRating(updatedSupplier.deliveryHistory);
        const recentDelays = updatedSupplier.deliveryHistory
          .slice(0, 6)
          .filter(d => d.delayDays > 0).length;
        updatedSupplier.riskLevel = calculateSupplyRisk(
          updatedSupplier.rating!,
          updatedSupplier.status,
          recentDelays
        );
      }

      setSuppliers(suppliers.map(s => (s.id === editingSupplier.id ? updatedSupplier : s)));
      toast.success(t('suppliers.updateSuccess'));
    } else {
      const newSupplier: EnhancedSupplier = {
        ...formData,
        id: Date.now().toString(),
      };
      setSuppliers([...suppliers, newSupplier]);
      toast.success(t('suppliers.createSuccess'));
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('suppliers.confirmDelete'))) {
      setSuppliers(suppliers.filter(s => s.id !== id));
      toast.success(t('suppliers.deleteSuccess'));
    }
  };

  const handleViewDetails = (supplier: EnhancedSupplier) => {
    navigate(`/suppliers/${supplier.id}`);
  };


  const handleMaterialToggle = (materialId: string) => {
    const isSelected = formData.suppliedMaterials.includes(materialId);
    const newMaterials = isSelected
      ? formData.suppliedMaterials.filter(id => id !== materialId)
      : [...formData.suppliedMaterials, materialId];

    const newPrices = { ...formData.prices };
    if (!isSelected) {
      newPrices[materialId] = 0;
    } else {
      delete newPrices[materialId];
    }

    setFormData({
      ...formData,
      suppliedMaterials: newMaterials,
      prices: newPrices,
    });
  };

  const handlePriceChange = (materialId: string, price: string) => {
    setFormData({
      ...formData,
      prices: {
        ...formData.prices,
        [materialId]: parseFloat(price) || 0,
      },
    });
  };

  const getMaterialName = (materialId: string) => {
    return materials.find(m => m.id === materialId)?.name || materialId;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-green-600 dark:text-green-400';
    if (rating >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400 dark:text-gray-500" />;
    }
  };

  // Filter suppliers that can be selected in orders
  const selectableSuppliers = useMemo(
    () => suppliers.filter(s => s.status === 'active'),
    [suppliers]
  );

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {t('suppliers.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('suppliers.subtitle')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('suppliers.addSupplier')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {suppliers.map(supplier => {
          const rating = supplier.rating;
          const riskLevel = supplier.riskLevel || 'low';
          const isBlocked = supplier.status === 'blocked' || supplier.status === 'blacklisted';

          return (
            <div
              key={supplier.id}
              onClick={() => handleViewDetails(supplier)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                isBlocked
                  ? 'border-red-200 dark:border-red-800 opacity-75'
                  : 'border-gray-200 dark:border-gray-700'
              } p-6 cursor-pointer hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {supplier.name}
                    </h3>
                    <Badge className={getStatusColor(supplier.status)}>
                      {t(`suppliers.status.${supplier.status}`)}
                    </Badge>
                  </div>

                  {/* Rating Display */}
                  {rating ? (
                    <div className="flex items-center gap-2 mt-2">
                      {getTrendIcon(rating.trend)}
                      <span className={`text-sm font-medium ${getRatingColor(rating.overall)}`}>
                        {t('suppliers.rating')}: {rating.overall}/100
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {supplier.reliability}% {t('suppliers.reliability')}
                      </span>
                    </div>
                  )}

                  {/* Risk Indicator */}
                  {riskLevel === 'high' && (
                    <div className="flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {t('suppliers.riskHigh')} {t('suppliers.riskIndicator')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleViewDetails(supplier)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={t('suppliers.viewDetails')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDialog(supplier)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('suppliers.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('suppliers.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">{supplier.contactPerson}</span>
                    <br />
                    <span className="text-gray-700 dark:text-gray-300">{supplier.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{supplier.email}</span>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {supplier.deliveryTime} {t('suppliers.days')}
                  </span>
                </div>

                {/* Purchase Orders Summary */}
                {supplier.purchaseOrders && (
                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {supplier.purchaseOrders.filter(po => po.status === 'pending' || po.status === 'in_transit').length}{' '}
                      {t('suppliers.activeOrders')} •{' '}
                      {supplier.purchaseOrders.filter(po => po.status === 'delivered').length}{' '}
                      {t('suppliers.completedOrders')}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('suppliers.suppliedMaterials')}:
                    </span>
                  </div>
                  <div className="space-y-1">
                    {supplier.suppliedMaterials.length > 0 ? (
                      supplier.suppliedMaterials.slice(0, 3).map(materialId => {
                        const material = materials.find(m => m.id === materialId);
                        return (
                          <div
                            key={materialId}
                            className="text-xs text-gray-600 dark:text-gray-400 pl-6"
                          >
                            • {material?.name || materialId} -{' '}
                            {supplier.prices[materialId]?.toLocaleString()} {t('suppliers.currency')}/
                            {material?.unit || 'unit'}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                        {t('suppliers.noMaterials')}
                      </span>
                    )}
                    {supplier.suppliedMaterials.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                        +{supplier.suppliedMaterials.length - 3} {t('suppliers.more')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
            </DialogTitle>
            <DialogDescription>{t('suppliers.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">{t('suppliers.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('suppliers.namePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="status">{t('suppliers.selectStatus')}</Label>
                <Select
                  value={formData.status}
                  onValueChange={value =>
                    setFormData({ ...formData, status: value as SupplierStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('suppliers.statusActive')}</SelectItem>
                    <SelectItem value="blocked">{t('suppliers.statusBlocked')}</SelectItem>
                    <SelectItem value="blacklisted">{t('suppliers.statusBlacklisted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">{t('suppliers.contactPerson')} *</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={e =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder={t('suppliers.contactPersonPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('suppliers.phone')} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+998 90 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">{t('suppliers.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@example.uz"
                />
              </div>
              <div>
                <Label htmlFor="deliveryTime">{t('suppliers.deliveryTime')}</Label>
                <Input
                  id="deliveryTime"
                  type="number"
                  value={formData.deliveryTime}
                  onChange={e =>
                    setFormData({ ...formData, deliveryTime: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">{t('suppliers.address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('suppliers.addressPlaceholder')}
              />
            </div>

            <div>
              <Label>{t('suppliers.selectMaterials')}</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {materials.map(material => (
                  <div key={material.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.suppliedMaterials.includes(material.id)}
                        onChange={() => handleMaterialToggle(material.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {material.name}
                      </span>
                    </div>
                    {formData.suppliedMaterials.includes(material.id) && (
                      <Input
                        type="number"
                        value={formData.prices[material.id] || 0}
                        onChange={e => handlePriceChange(material.id, e.target.value)}
                        placeholder={t('suppliers.pricePerUnit')}
                        className="w-32 ml-2"
                        min="0"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t('suppliers.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {editingSupplier ? t('suppliers.update') : t('suppliers.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
