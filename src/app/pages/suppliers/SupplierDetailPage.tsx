import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Truck,
  X,
  Phone,
  Mail,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
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
import { Textarea } from '../../components/ui/textarea';
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
  calculateSupplierRating,
  calculateSupplyRisk,
  getStatusColor,
  getRiskColor,
  generateMockDeliveryHistory,
  generateMockPurchaseOrders,
} from '../../services/supplierService';

type DestinationType = 'warehouse' | 'line';
type SupplyRequestPriority = 'normal' | 'urgent';

interface SupplyRequest {
  id: string;
  supplierId: string;
  materialId: string;
  quantity: number;
  deliveryDate: string;
  destinationType: DestinationType;
  destinationId: string;
  priority: SupplyRequestPriority;
  status: 'Created' | 'Sent' | 'In Transit' | 'Delivered';
  createdAt: string;
}

// Mock suppliers data (should come from context or API in real app)
const initialSuppliers: EnhancedSupplier[] = [
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

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { materials, productionLines } = useFactory();
  const { t } = useLanguage();
  const [suppliers] = useState<EnhancedSupplier[]>(initialSuppliers);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [isSupplyRequestOpen, setIsSupplyRequestOpen] = useState(false);
  const [supplyRequestForm, setSupplyRequestForm] = useState<{
    materialId: string;
    quantity: number;
    deliveryDate: string;
    destinationType: DestinationType;
    destinationId: string;
    priority: SupplyRequestPriority;
    notes: string;
  }>({
    materialId: '',
    quantity: 0,
    deliveryDate: '',
    destinationType: 'warehouse',
    destinationId: 'warehouse-main',
    priority: 'normal',
    notes: '',
  });

  // Find supplier and initialize
  const supplier = useMemo(() => {
    let found = suppliers.find(s => s.id === id);
    if (!found) return null;

    // Initialize supplier data if needed
    if (!found.deliveryHistory || !found.rating) {
      const materialNames: Record<string, string> = {};
      found.suppliedMaterials.forEach(materialId => {
        const material = materials.find(m => m.id === materialId);
        if (material) materialNames[materialId] = material.name;
      });

      const deliveryHistory = generateMockDeliveryHistory(
        found.id,
        found.suppliedMaterials,
        materialNames
      );

      const rating = calculateSupplierRating(deliveryHistory);
      const recentDelays = deliveryHistory
        .slice(0, 6)
        .filter(d => d.delayDays > 0).length;
      const riskLevel = calculateSupplyRisk(rating, found.status, recentDelays);
      const purchaseOrders = generateMockPurchaseOrders(
        found.id,
        found.suppliedMaterials,
        found.prices
      );

      return {
        ...found,
        deliveryHistory,
        rating,
        riskLevel,
        purchaseOrders,
      };
    }

    return found;
  }, [id, suppliers, materials]);

  useEffect(() => {
    if (supplier && !supplyRequestForm.materialId && supplier.suppliedMaterials.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      setSupplyRequestForm(prev => ({
        ...prev,
        materialId: supplier.suppliedMaterials[0] || '',
        deliveryDate: today,
      }));
    }
  }, [supplier]);

  // Return null if id is missing
  if (!id) {
    return null;
  }

  if (!supplier) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">Supplier not found</p>
          <Button onClick={() => navigate('/suppliers')} className="mt-4">
            Back to Suppliers
          </Button>
        </div>
      </div>
    );
  }

  const openSupplyRequestModal = () => {
    if (!supplier) return;
    const today = new Date().toISOString().split('T')[0];
    const firstMaterial = supplier.suppliedMaterials[0] || '';
    setSupplyRequestForm({
      materialId: firstMaterial,
      quantity: 0,
      deliveryDate: today,
      destinationType: 'warehouse',
      destinationId: 'warehouse-main',
      priority: 'normal',
      notes: '',
    });
    setIsSupplyRequestOpen(true);
  };

  const validateSupplyRequest = (): boolean => {
    if (!supplier) return false;

    if (!supplyRequestForm.materialId) {
      toast.error(t('suppliers.validation.required'));
      return false;
    }

    if (!supplier.suppliedMaterials.includes(supplyRequestForm.materialId)) {
      toast.error(t('suppliers.cannotSelectBlacklisted'));
      return false;
    }

    if (!supplyRequestForm.quantity || supplyRequestForm.quantity <= 0) {
      toast.error(t('suppliers.validation.required'));
      return false;
    }

    if (!supplyRequestForm.deliveryDate) {
      toast.error(t('suppliers.validation.required'));
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(supplyRequestForm.deliveryDate);
    requestedDate.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      toast.error(t('suppliers.validation.required'));
      return false;
    }

    return true;
  };

  const handleSendSupplyRequest = () => {
    if (!supplier) return;
    if (!validateSupplyRequest()) return;

    const newRequest: SupplyRequest = {
      id: `req-${Date.now()}`,
      supplierId: supplier.id,
      materialId: supplyRequestForm.materialId,
      quantity: supplyRequestForm.quantity,
      deliveryDate: supplyRequestForm.deliveryDate,
      destinationType: supplyRequestForm.destinationType,
      destinationId: supplyRequestForm.destinationId,
      priority: supplyRequestForm.priority,
      status: 'Created',
      createdAt: new Date().toISOString(),
    };

    setSupplyRequests(prev => [newRequest, ...prev]);
    setIsSupplyRequestOpen(false);
    toast.success(t('suppliers.supplyRequestSuccess'));

    const today = new Date().toISOString().split('T')[0];
    const firstMaterial = supplier.suppliedMaterials[0] || '';
    setSupplyRequestForm({
      materialId: firstMaterial,
      quantity: 0,
      deliveryDate: today,
      destinationType: 'warehouse',
      destinationId: 'warehouse-main',
      priority: 'normal',
      notes: '',
    });
  };

  const getOpenRequestsCount = (supplierId: string) => {
    return supplyRequests.filter(
      req => req.supplierId === supplierId &&
      (req.status === 'Created' || req.status === 'Sent' || req.status === 'In Transit')
    ).length;
  };

  const isSupplyRequestFormValid = useMemo(() => {
    if (!supplier) return false;
    return (
      supplyRequestForm.materialId !== '' &&
      supplier.suppliedMaterials.includes(supplyRequestForm.materialId) &&
      supplyRequestForm.quantity > 0 &&
      supplyRequestForm.deliveryDate !== '' &&
      supplyRequestForm.destinationId !== ''
    );
  }, [supplier, supplyRequestForm]);

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

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto z-50">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
                  {supplier.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('suppliers.viewDetails')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={getStatusColor(supplier.status)}>
                  {t(`suppliers.status.${supplier.status}`)}
                </Badge>
                {supplier.riskLevel && (
                  <Badge className={getRiskColor(supplier.riskLevel)}>
                    {t('suppliers.supplyRisk')}: {t(`suppliers.risk${supplier.riskLevel.charAt(0).toUpperCase() + supplier.riskLevel.slice(1)}`)}
                  </Badge>
                )}
                {supplier.rating && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {t('suppliers.rating')}: {supplier.rating.overall}/100
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {supplier.status === 'active' && (
                <Button onClick={openSupplyRequestModal}>
                  <Truck className="w-4 h-4 mr-2" />
                  {t('suppliers.sendSupplyRequest')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/suppliers')}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Open Requests Counter */}
            {supplier.status === 'active' && getOpenRequestsCount(supplier.id) > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {getOpenRequestsCount(supplier.id)} {t('suppliers.openRequests')}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
                {t('suppliers.contactInformation')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {supplier.contactPerson} • {supplier.phone}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{supplier.email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Package className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-400">{supplier.address}</span>
                </div>
              </div>
            </div>

            {/* Contract Materials */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">
                {t('suppliers.suppliedMaterials')}
              </h3>
              {supplier.suppliedMaterials.length > 0 ? (
                <div className="space-y-3">
                  {supplier.suppliedMaterials.map(materialId => {
                    const material = materials.find(m => m.id === materialId);
                    return (
                      <div
                        key={materialId}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {material?.name || materialId}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {material?.unit || 'unit'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {supplier.prices[materialId]?.toLocaleString() || 0} {t('suppliers.currency')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('suppliers.perUnit')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('suppliers.noMaterials')}
                </p>
              )}
            </div>

            {/* Performance Metrics */}
            {supplier.rating && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                  {t('suppliers.performanceMetrics')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('suppliers.overallRating')}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${getRatingColor(supplier.rating.overall)}`}>
                        {supplier.rating.overall}/100
                      </p>
                      {getTrendIcon(supplier.rating.trend)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('suppliers.onTimeDelivery')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {supplier.rating.onTimeDeliveryRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('suppliers.averageDelay')}
                    </p>
                    <p
                      className={`text-xl font-semibold ${
                        supplier.rating.averageDelayDays > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {supplier.rating.averageDelayDays > 0 ? '+' : ''}
                      {supplier.rating.averageDelayDays.toFixed(1)} {t('suppliers.days')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {t('suppliers.defectRate')}
                    </p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {supplier.rating.defectRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Delivery History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                {t('suppliers.deliveryHistory')}
              </h4>
              {supplier.deliveryHistory && supplier.deliveryHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {supplier.deliveryHistory.slice(0, 10).map(delivery => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {delivery.materialName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(delivery.date).toLocaleDateString()} • {delivery.quantity}{' '}
                          {t('suppliers.units')}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0">
                        {delivery.delayDays > 0 ? (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                            +{delivery.delayDays} {t('suppliers.delayDays')}
                          </span>
                        ) : delivery.delayDays < 0 ? (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                            {delivery.delayDays} {t('suppliers.delayDays')}
                          </span>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('suppliers.noDeliveryHistory')}
                </p>
              )}
            </div>

            {/* Purchase Orders */}
            {supplier.purchaseOrders && supplier.purchaseOrders.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    {t('suppliers.purchaseOrders')}
                  </h4>
                  <Button variant="outline" size="sm">
                    {t('suppliers.viewOrders')}
                  </Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {supplier.purchaseOrders.slice(0, 5).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {order.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={`ml-3 flex-shrink-0 ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {t(`suppliers.orderStatus.${order.status}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supply Request Modal - Keep existing modal */}
      <Dialog open={isSupplyRequestOpen} onOpenChange={setIsSupplyRequestOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{t('suppliers.supplyRequestTitle')}</DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  {supplier?.name} • {t('suppliers.contractBasedRequest')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {supplier && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    {t('suppliers.deliveryDetails')}
                  </h3>
                  <div>
                    <Label htmlFor="material" className="text-sm font-medium">
                      {t('suppliers.material')} *
                    </Label>
                    <Select
                      value={supplyRequestForm.materialId}
                      onValueChange={value =>
                        setSupplyRequestForm(prev => ({ ...prev, materialId: value }))
                      }
                    >
                      <SelectTrigger id="material" className="mt-1.5">
                        <SelectValue placeholder={t('suppliers.selectMaterial')} />
                      </SelectTrigger>
                      <SelectContent>
                        {supplier.suppliedMaterials.map(materialId => {
                          const material = materials.find(m => m.id === materialId);
                          return (
                            <SelectItem key={materialId} value={materialId}>
                              {material?.name || materialId}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      {t('suppliers.quantity')} *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      value={supplyRequestForm.quantity || ''}
                      onChange={e =>
                        setSupplyRequestForm(prev => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1.5"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryDate" className="text-sm font-medium">
                      {t('suppliers.requiredDeliveryDate')} *
                    </Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={supplyRequestForm.deliveryDate}
                      onChange={e =>
                        setSupplyRequestForm(prev => ({
                          ...prev,
                          deliveryDate: e.target.value,
                        }))
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    {t('suppliers.destinationAndPriority')}
                  </h3>
                  <div>
                    <Label className="text-sm font-medium">
                      {t('suppliers.destinationType')} *
                    </Label>
                    <Select
                      value={supplyRequestForm.destinationType}
                      onValueChange={value => {
                        const defaultId = value === 'warehouse' ? 'warehouse-main' : productionLines[0]?.id || '';
                        setSupplyRequestForm(prev => ({
                          ...prev,
                          destinationType: value as DestinationType,
                          destinationId: defaultId,
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warehouse">
                          {t('suppliers.destinationWarehouse')}
                        </SelectItem>
                        <SelectItem value="line">
                          {t('suppliers.destinationLine')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      {t('suppliers.destination')} *
                    </Label>
                    <Select
                      value={supplyRequestForm.destinationId}
                      onValueChange={value =>
                        setSupplyRequestForm(prev => ({
                          ...prev,
                          destinationId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder={t('suppliers.selectDestination')} />
                      </SelectTrigger>
                      <SelectContent>
                        {supplyRequestForm.destinationType === 'warehouse' ? (
                          <SelectItem value="warehouse-main">
                            {t('suppliers.mainWarehouse')}
                          </SelectItem>
                        ) : (
                          productionLines.map(line => (
                            <SelectItem key={line.id} value={line.id}>
                              {line.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      {t('suppliers.priority')} *
                    </Label>
                    <Select
                      value={supplyRequestForm.priority}
                      onValueChange={value =>
                        setSupplyRequestForm(prev => ({
                          ...prev,
                          priority: value as SupplyRequestPriority,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">
                          {t('suppliers.priorityNormal')}
                        </SelectItem>
                        <SelectItem value="urgent">
                          {t('suppliers.priorityUrgent')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t('suppliers.notes')} ({t('suppliers.optional')})
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={supplyRequestForm.notes}
                  onChange={e =>
                    setSupplyRequestForm(prev => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="mt-1.5"
                  placeholder={t('suppliers.notesPlaceholder')}
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      {t('suppliers.contractPricing')}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      {t('suppliers.priceAutoFromContract')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsSupplyRequestOpen(false)}
            >
              {t('suppliers.cancel')}
            </Button>
            <Button
              onClick={handleSendSupplyRequest}
              disabled={!isSupplyRequestFormValid}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Truck className="w-4 h-4 mr-2" />
              {t('suppliers.sendSupplyRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
