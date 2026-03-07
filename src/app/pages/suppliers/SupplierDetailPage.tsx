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
  FileText,
  Activity,
  Zap,
  Shuffle,
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

  // Calculate YTD Spend and Critical Shortage
  const ytdSpend = useMemo(() => {
    if (!supplier || !supplier.purchaseOrders) return 0;
    return supplier.purchaseOrders.reduce((sum, po) => sum + (po.status !== 'cancelled' ? po.totalAmount : 0), 0);
  }, [supplier]);

  const criticalMaterials = useMemo(() => {
    if (!supplier) return [];
    // Mock simulation: material "1" (Steel Sheets) is at zero stock and critical
    return supplier.suppliedMaterials.filter(mId => mId === '1');
  }, [supplier]);

  const hasCriticalShortage = criticalMaterials.length > 0;

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
    const targetMaterial = hasCriticalShortage ? criticalMaterials[0] : (supplier.suppliedMaterials[0] || '');
    const defaultPriority = hasCriticalShortage ? 'urgent' : 'normal';

    setSupplyRequestForm({
      materialId: targetMaterial,
      quantity: hasCriticalShortage ? 500 : 0, // Smart-fill suggested quantity
      deliveryDate: today,
      destinationType: 'warehouse',
      destinationId: 'warehouse-main',
      priority: defaultPriority,
      notes: hasCriticalShortage ? '[AUTO-FILLED] Critical shortage detected for zero-stock material. Expedited delivery requested.' : '',
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

    // Simulated SAP PO Email functionality
    setTimeout(() => {
      toast.success(
        <div className="flex flex-col gap-1.5">
          <span className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> SAP Purchase Order Generated</span>
          <span className="text-sm font-medium">Auto-sent formal inquiry PDF to {supplier.email}</span>
        </div>,
        { duration: 5000 }
      );
    }, 600);

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
    <div className="fixed inset-0 bg-slate-950 overflow-y-auto z-50">
      {/* Header Section */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 shadow-sm">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {supplier.name}
                </h1>
                <p className="text-sm text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  {t('suppliers.viewDetails')} • Strategic Partner
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
              {supplier.rating && supplier.rating.onTimeDeliveryRate < 50 && (
                <Button
                  variant="outline"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Alternative Supplier Suggestion
                </Button>
              )}
              {supplier.status === 'active' && (
                <Button
                  onClick={openSupplyRequestModal}
                  className={hasCriticalShortage
                    ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400/50"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }
                >
                  {hasCriticalShortage ? <Zap className="w-4 h-4 mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                  {hasCriticalShortage ? "URGENT SUPPLY REQUEST" : t('suppliers.sendSupplyRequest')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/suppliers')}
                className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-8">
        {/* Financial & Status Guardrails */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Spend (YTD)</p>
            <p className="text-2xl font-bold text-white">{ytdSpend.toLocaleString()} UZS</p>
          </div>

          {supplier.status === 'active' && getOpenRequestsCount(supplier.id) > 0 && (
            <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-lg p-4 flex flex-col justify-center">
              <p className="text-xs text-indigo-400 uppercase tracking-wider font-semibold mb-1">Active Pipeline</p>
              <p className="text-2xl font-bold text-indigo-300">
                {getOpenRequestsCount(supplier.id)} Orders In-Flight
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6 min-w-0">
            {/* Contact Info */}
            <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                {t('suppliers.contactInformation')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300 font-medium tracking-wide">
                    {supplier.contactPerson} • {supplier.phone}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300 font-medium tracking-wide">{supplier.email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Package className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-400 leading-relaxed">{supplier.address}</span>
                </div>
              </div>
            </div>

            {/* Contract Materials */}
            <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                {t('suppliers.suppliedMaterials')}
              </h3>
              {supplier.suppliedMaterials.length > 0 ? (
                <div className="space-y-3">
                  {supplier.suppliedMaterials.map(materialId => {
                    const material = materials.find(m => m.id === materialId);
                    return (
                      <div
                        key={materialId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg gap-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">
                            {material?.name || materialId}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] py-0">
                              ISO 9001
                            </Badge>
                            <span className="text-xs text-slate-500 font-medium">
                              Certified Quality
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-indigo-400">
                            {supplier.prices[materialId]?.toLocaleString() || 0} {t('suppliers.currency')}
                          </p>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5">
                            {t('suppliers.perUnit')} ({material?.unit || 'unit'})
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  {t('suppliers.noMaterials')}
                </p>
              )}
            </div>

            {/* Performance Metrics */}
            {supplier.rating && (
              <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                  {t('suppliers.performanceMetrics')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">
                      {t('suppliers.overallRating')}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`text-2xl font-bold ${getRatingColor(supplier.rating.overall)}`}>
                        {supplier.rating.overall}<span className="text-sm text-slate-500">/100</span>
                      </p>
                      {getTrendIcon(supplier.rating.trend)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">
                      {t('suppliers.onTimeDelivery')}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {supplier.rating.onTimeDeliveryRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">
                      {t('suppliers.averageDelay')}
                    </p>
                    <p
                      className={`text-xl font-bold ${supplier.rating.averageDelayDays > 0
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                        }`}
                    >
                      {supplier.rating.averageDelayDays > 0 ? '+' : ''}
                      {supplier.rating.averageDelayDays.toFixed(1)} <span className="text-sm font-medium">{t('suppliers.days')}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">
                      {t('suppliers.defectRate')}
                    </p>
                    <p className="text-xl font-bold text-white">
                      {supplier.rating.defectRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 min-w-0">
            {/* Delivery History */}
            <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t('suppliers.deliveryHistory')}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Live Trends
                </div>
              </div>
              {supplier.deliveryHistory && supplier.deliveryHistory.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                  {supplier.deliveryHistory.slice(0, 10).map(delivery => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm">
                          {delivery.materialName}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
                          {new Date(delivery.date).toLocaleDateString()} • {delivery.quantity}{' '}
                          {t('suppliers.units')}
                        </p>
                      </div>
                      <div className="text-right ml-3 flex-shrink-0 flex items-center gap-3">
                        {/* Mini visual indicator */}
                        <div className="hidden sm:block w-16 h-1 bg-slate-700 rounded-full overflow-hidden mr-2">
                          <div className={`h-full ${delivery.delayDays > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: delivery.delayDays > 0 ? '100%' : '50%' }} />
                        </div>
                        {delivery.delayDays > 0 ? (
                          <span className="text-xs text-rose-400 font-bold whitespace-nowrap bg-rose-900/20 px-2 py-1 rounded border border-rose-800/50">
                            +{delivery.delayDays} {t('suppliers.delayDays')}
                          </span>
                        ) : delivery.delayDays < 0 ? (
                          <span className="text-xs text-emerald-400 font-bold whitespace-nowrap bg-emerald-900/20 px-2 py-1 rounded border border-emerald-800/50">
                            {delivery.delayDays} {t('suppliers.delayDays')}
                          </span>
                        ) : (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">
                  {t('suppliers.noDeliveryHistory')}
                </p>
              )}
            </div>

            {/* Purchase Orders */}
            {supplier.purchaseOrders && supplier.purchaseOrders.length > 0 && (
              <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    {t('suppliers.purchaseOrders')}
                  </h4>
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    {t('suppliers.viewOrders')}
                  </Button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                  {supplier.purchaseOrders.slice(0, 5).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3.5 bg-slate-800/50 rounded-lg border border-slate-700/50 text-sm hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">
                          {order.id}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={`ml-3 flex-shrink-0 px-2.5 py-1 ${order.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : order.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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

      {/* Supply Request Modal */}
      <Dialog open={isSupplyRequestOpen} onOpenChange={setIsSupplyRequestOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader className="space-y-3 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-white tracking-tight">{t('suppliers.supplyRequestTitle')}</DialogTitle>
                  <DialogDescription className="mt-2 text-sm text-slate-400 font-medium">
                    {supplier?.name} • <span className="text-indigo-400">{t('suppliers.contractBasedRequest')}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {supplier && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-400" /> {t('suppliers.deliveryDetails')}
                    </h3>
                    <div>
                      <Label htmlFor="material" className="text-sm font-semibold text-slate-300">
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

                  <div className="space-y-5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-indigo-400" /> {t('suppliers.destinationAndPriority')}
                    </h3>
                    <div>
                      <Label className="text-sm font-semibold text-slate-300">
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

                <div className="pt-5 border-t border-slate-800">
                  <Label htmlFor="notes" className="text-sm font-semibold text-slate-300">
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

                {supplyRequestForm.materialId === '1' && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 mt-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <AlertTriangle className="w-16 h-16 text-rose-500" />
                    </div>
                    <div className="flex items-start gap-3 relative z-10">
                      <TrendingUp className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-rose-300 tracking-wide uppercase">
                          Price Variance Alert
                        </p>
                        <p className="text-xs text-rose-200/80 mt-1 font-medium leading-relaxed">
                          Requested material exceeds historical average price by <strong className="text-rose-100">+6%</strong> (Avg: 80,100 UZS). This +6% increase will cost the factory an additional <strong className="text-rose-100">{(supplyRequestForm.quantity * 80100 * 0.06 / 1000000).toFixed(2)} million UZS</strong> this month. Budget review may be required before final approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-indigo-300 tracking-wide">
                        {t('suppliers.contractPricing')}
                      </p>
                      <p className="text-xs text-indigo-400/80 mt-1 font-medium">
                        {t('suppliers.priceAutoFromContract')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-5 border-t border-slate-800 mt-2">
              <Button
                variant="outline"
                onClick={() => setIsSupplyRequestOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                {t('suppliers.cancel')}
              </Button>
              <Button
                onClick={handleSendSupplyRequest}
                disabled={!isSupplyRequestFormValid}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PO & Send
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
