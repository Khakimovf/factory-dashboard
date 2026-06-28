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
  Plus,
  Trash2,
  RefreshCw,
  LayoutDashboard,
  ShoppingCart,
  FileSignature,
  History,
  ShieldAlert,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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

interface SupplyRequestItem {
  materialId: string;
  quantity: number;
}

interface SupplyRequest {
  id: string;
  supplierId: string;
  items: SupplyRequestItem[];
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
    items: { materialId: string; quantity: number }[];
    deliveryDate: string;
    destinationType: DestinationType;
    destinationId: string;
    priority: SupplyRequestPriority;
    notes: string;
  }>({
    items: [{ materialId: '', quantity: 0 }],
    deliveryDate: '',
    destinationType: 'warehouse',
    destinationId: 'warehouse-main',
    priority: 'normal',
    notes: '',
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'procurement' | 'contracts' | 'history'>('overview');

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
    if (supplier && supplyRequestForm.items.length === 1 && !supplyRequestForm.items[0].materialId && supplier.suppliedMaterials.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      setSupplyRequestForm(prev => ({
        ...prev,
        items: [{ materialId: supplier.suppliedMaterials[0] || '', quantity: 0 }],
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
      items: [{
        materialId: targetMaterial,
        quantity: hasCriticalShortage ? 500 : 0, // Smart-fill suggested quantity
      }],
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

    if (supplyRequestForm.items.length === 0) {
      toast.error(t('suppliers.validation.required'));
      return false;
    }

    for (const item of supplyRequestForm.items) {
      if (!item.materialId) {
        toast.error(t('suppliers.validation.required'));
        return false;
      }
      if (!supplier.suppliedMaterials.includes(item.materialId)) {
        toast.error(t('suppliers.cannotSelectBlacklisted'));
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error(t('suppliers.validation.required'));
        return false;
      }
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
      items: supplyRequestForm.items,
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
      items: [{ materialId: firstMaterial, quantity: 0 }],
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
    const itemsValid = supplyRequestForm.items.length > 0 && supplyRequestForm.items.every(
      item => item.materialId !== '' &&
        supplier.suppliedMaterials.includes(item.materialId) &&
        item.quantity > 0
    );

    return (
      itemsValid &&
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
    <div className="w-full min-h-screen px-6 lg:px-12 mx-auto bg-slate-950 overflow-y-auto z-50 custom-scrollbar">
      {/* Global Action Bar (Sticky Header) */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
        <div className="w-full py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/suppliers')}
                className="rounded-full text-slate-400 hover:text-white hover:bg-slate-800 -ml-2"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="h-8 w-px bg-slate-800 mx-2"></div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  {supplier.name}
                  {supplier.riskLevel === 'high' && (
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-xs px-2 py-0.5">
                      <ShieldAlert className="w-3 h-3 mr-1" /> Critical Risk
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  {t('suppliers.viewDetails')} • Strategic Partner
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {supplier.rating && supplier.rating.onTimeDeliveryRate < 50 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Alternative Supplier Suggestion
                </Button>
              )}
              {supplier.status === 'active' && (
                <Button
                  onClick={() => {
                    setActiveTab('procurement');
                    if (hasCriticalShortage) {
                      const today = new Date().toISOString().split('T')[0];
                      setSupplyRequestForm({
                        items: [{ materialId: criticalMaterials[0], quantity: 500 }],
                        deliveryDate: today,
                        destinationType: 'warehouse',
                        destinationId: 'warehouse-main',
                        priority: 'urgent',
                        notes: '[AUTO-FILLED] Critical shortage detected for zero-stock material. Expedited delivery requested.',
                      });
                    }
                  }}
                  className={`px-6 ${hasCriticalShortage
                    ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.4)] border border-rose-400/50"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                >
                  {hasCriticalShortage ? <Zap className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {hasCriticalShortage ? "URGENT SUPPLY REQUEST" : "NEW ORDER"}
                </Button>
              )}
            </div>
          </div>

          {/* Main Tab Navigation */}
          <div className="flex items-center gap-8 mt-6 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview & Analytics
            </button>
            <button
              onClick={() => setActiveTab('procurement')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'procurement'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
            >
              <ShoppingCart className="w-4 h-4" /> Procurement Workspace
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'contracts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
            >
              <FileSignature className="w-4 h-4" /> Contract Vault
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
            >
              <History className="w-4 h-4" /> History & Orders
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-8">

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {/* Left Column Analytics & Materials */}
              <div className="lg:col-span-8 flex flex-col gap-6 w-full">
                {/* Top Layer: Total Spend and Active Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className={`bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col justify-center w-full ${
                    !(supplier.status === 'active' && getOpenRequestsCount(supplier.id) > 0) ? 'md:col-span-2' : ''
                  }`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Spend (YTD)</p>
                    <p className="text-2xl font-bold text-white">{ytdSpend.toLocaleString()} UZS</p>
                  </div>

                  {supplier.status === 'active' && getOpenRequestsCount(supplier.id) > 0 && (
                    <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-lg p-6 flex flex-col justify-center w-full">
                      <p className="text-xs text-indigo-400 uppercase tracking-wider font-semibold mb-1">Active Pipeline</p>
                      <p className="text-2xl font-bold text-indigo-300">
                        {getOpenRequestsCount(supplier.id)} Orders In-Flight
                      </p>
                    </div>
                  )}
                </div>

                {/* Middle Layer: Contact Info */}
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

                {/* Bottom Layer: Supplied Materials */}
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
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-800/50 border border-slate-700/50 rounded-lg gap-4 w-full"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white truncate">
                                {material?.name || materialId}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] py-0.5 px-2 whitespace-nowrap">
                                  ISO 9001
                                </Badge>
                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                  Certified Quality
                                </span>
                              </div>
                            </div>
                            <div className="text-left sm:text-right flex-shrink-0">
                              <p className="text-sm font-bold text-indigo-400 whitespace-nowrap">
                                {supplier.prices[materialId]?.toLocaleString() || 0} {t('suppliers.currency')}
                              </p>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-0.5 whitespace-nowrap">
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
              </div>

              {/* Right Column Indicators */}
              <div className="lg:col-span-4 w-full">
                {/* Performance Metrics */}
                {supplier.rating && (
                  <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6">
                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                      {t('suppliers.performanceMetrics')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                          {t('suppliers.overallRating')}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <p className={`text-2xl font-bold ${getRatingColor(supplier.rating.overall)}`}>
                            {supplier.rating.overall}<span className="text-sm text-slate-500">/100</span>
                          </p>
                          {getTrendIcon(supplier.rating.trend)}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                          {t('suppliers.onTimeDelivery')}
                        </p>
                        <p className="text-2xl font-bold text-white mt-2">
                          {supplier.rating.onTimeDeliveryRate}%
                        </p>
                      </div>
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                          {t('suppliers.averageDelay')}
                        </p>
                        <p
                          className={`text-xl font-bold mt-2 ${supplier.rating.averageDelayDays > 0
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                            }`}
                        >
                          {supplier.rating.averageDelayDays > 0 ? '+' : ''}
                          {supplier.rating.averageDelayDays.toFixed(1)} <span className="text-xs font-medium text-slate-500">{t('suppliers.days')}</span>
                        </p>
                      </div>
                      <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/30 flex flex-col justify-between min-h-[90px]">
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                          {t('suppliers.defectRate')}
                        </p>
                        <p className="text-2xl font-bold text-white mt-2">
                          {supplier.rating.defectRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY & ORDERS */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div className="space-y-3 max-h-[600px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                      {supplier.deliveryHistory.map(delivery => (
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
              </div>

              <div className="space-y-6 min-w-0">
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
                    <div className="space-y-2 max-h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                      {supplier.purchaseOrders.map(order => (
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
        )}

        {/* TAB 2: PROCUREMENT WORKSPACE */}
        {activeTab === 'procurement' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="space-y-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">{t('suppliers.supplyRequestTitle')}</h2>
                      <p className="mt-2 text-sm text-slate-400 font-medium">
                        {supplier?.name} • <span className="text-indigo-400">{t('suppliers.contractBasedRequest')}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {supplier && (
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                          <Truck className="w-4 h-4 text-indigo-400" /> {t('suppliers.deliveryDetails')}
                        </h3>

                        {/* Multi-Item Dynamic List */}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2 mb-4">
                          {supplyRequestForm.items.map((item, index) => {
                            const material = materials.find(m => m.id === item.materialId);
                            const stock = material?.quantity || 0;
                            const isZeroStock = stock === 0 && item.materialId !== '';

                            return (
                              <div key={index} className={`flex items-start gap-4 p-4 rounded-lg border ${isZeroStock ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
                                <div className="flex-1 space-y-4">
                                  <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 sm:col-span-8">
                                      <Label className="text-xs font-semibold text-slate-300">{t('suppliers.material')} *</Label>
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1.5">
                                        <Select
                                          value={item.materialId}
                                          onValueChange={value => {
                                            const newItems = [...supplyRequestForm.items];
                                            newItems[index].materialId = value;
                                            setSupplyRequestForm(prev => ({ ...prev, items: newItems }));
                                          }}
                                        >
                                          <SelectTrigger className="w-full h-9 bg-slate-900 border-slate-700">
                                            <SelectValue placeholder={t('suppliers.selectMaterial')} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {supplier.suppliedMaterials.map(mId => {
                                              const m = materials.find(x => x.id === mId);
                                              return (
                                                <SelectItem key={mId} value={mId}>
                                                  {m?.name || mId}
                                                </SelectItem>
                                              );
                                            })}
                                          </SelectContent>
                                        </Select>
                                        {item.materialId && (
                                          <Badge variant="outline" className={`whitespace-nowrap ${isZeroStock ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 'border-slate-600 text-slate-300 bg-slate-800'}`}>
                                            Stock: {stock}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-span-12 sm:col-span-4">
                                      <Label className="text-xs font-medium">{t('suppliers.quantity')} *</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={item.quantity || ''}
                                        onChange={e => {
                                          const newItems = [...supplyRequestForm.items];
                                          newItems[index].quantity = parseInt(e.target.value) || 0;
                                          setSupplyRequestForm(prev => ({ ...prev, items: newItems }));
                                        }}
                                        className="mt-1.5 h-9 bg-slate-900 border-slate-700"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {supplyRequestForm.items.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newItems = supplyRequestForm.items.filter((_, i) => i !== index);
                                      setSupplyRequestForm(prev => ({ ...prev, items: newItems }));
                                    }}
                                    className="h-9 w-9 mt-[22px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSupplyRequestForm(prev => ({
                                ...prev,
                                items: [...prev.items, { materialId: '', quantity: 0 }]
                              }));
                            }}
                            className="border-dashed border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                          </Button>

                          {supplier.purchaseOrders && supplier.purchaseOrders.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const lastOrder = supplier.purchaseOrders!.find(po => po.status === 'delivered');
                                if (lastOrder) {
                                  const mockedItems = supplier.suppliedMaterials.slice(0, 2).map(mId => ({ materialId: mId, quantity: 200 }));
                                  setSupplyRequestForm(prev => ({ ...prev, items: mockedItems }));
                                  toast.success("Loaded items from last successful order mix");
                                } else {
                                  toast.error("No past successful deliveries found.");
                                }
                              }}
                              className="text-indigo-400 font-medium hover:bg-indigo-500/10 hover:text-indigo-300"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" /> Load Last Order Mix
                            </Button>
                          )}
                        </div>

                        <div className="mt-4">
                          <Label htmlFor="deliveryDate" className="text-sm font-medium text-slate-300">
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
                            className="mt-1.5 bg-slate-900 border-slate-700 text-white"
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
                            <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
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
                          <Label className="text-sm font-medium text-slate-300">
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
                            <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-700">
                              <SelectValue placeholder={t('suppliers.selectDestination')} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
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
                          <Label className="text-sm font-medium text-slate-300">
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
                            <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
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
                        className="mt-1.5 bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                        placeholder={t('suppliers.notesPlaceholder')}
                      />
                    </div>

                    {(() => {
                      const itemsWithVariance = supplyRequestForm.items.filter(item => item.materialId === '1');
                      if (itemsWithVariance.length === 0) return null;

                      const totalVarianceItems = itemsWithVariance.reduce((sum, item) => sum + item.quantity, 0);
                      if (totalVarianceItems === 0) return null;

                      const budgetImpact = (totalVarianceItems * 80100 * 0.06 / 1000000).toFixed(2);

                      return (
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
                                Requested material exceeds historical average price by <strong className="text-rose-100">+6%</strong> (Avg: 80,100 UZS). This +6% increase will cost the factory an additional <strong className="text-rose-100">{budgetImpact} million UZS</strong> this month. Budget review may be required before final approval.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const totalOrderValue = supplyRequestForm.items.reduce((sum, item) => {
                        const price = supplier.prices[item.materialId] || 0;
                        return sum + (item.quantity * price);
                      }, 0);

                      const mockMonthlyBudget = 500000000; // 500 Million UZS mock budget
                      const percentageUsed = (totalOrderValue / mockMonthlyBudget) * 100;

                      return (
                        <div className="bg-indigo-900/10 border border-indigo-800/50 rounded-lg p-5 mt-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Activity className="w-6 h-6 text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-indigo-300 tracking-wide uppercase">
                                  Current Estimated Value
                                </p>
                                <p className="text-3xl font-bold text-white mt-1">
                                  {totalOrderValue.toLocaleString()} <span className="text-sm font-medium text-slate-400">UZS</span>
                                </p>
                              </div>
                            </div>

                            <div className="sm:text-right flex flex-col items-start sm:items-end">
                              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                                Monthly Approved Budget Check
                              </p>
                              <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="w-full sm:w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${percentageUsed > 90 ? 'bg-rose-500' : percentageUsed > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-slate-300 whitespace-nowrap">{percentageUsed.toFixed(1)}%</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                of {mockMonthlyBudget.toLocaleString()} UZS
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800 mt-4 flex justify-end">
                  <Button
                    onClick={handleSendSupplyRequest}
                    disabled={!isSupplyRequestFormValid}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 px-8 h-11"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    APPROVE CONSOLIDATED ORDER & SEND PO
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTRACT VAULT */}
        {activeTab === 'contracts' && (
          <div className="animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors shadow-sm relative group cursor-pointer">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                  <FileSignature className="w-16 h-16 text-indigo-400" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Active Master Agreement</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 z-10">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{supplier.name} - MSA 2026</h3>
                  <div className="space-y-3 mt-4 text-sm text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Signed Date:</span>
                      <span className="text-slate-200 font-medium">Jan 10, 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Expiry Date:</span>
                      <span className="text-emerald-400 font-bold">Jan 10, 2027</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/30 p-4 border-t border-slate-800/50 flex justify-between items-center text-xs">
                  <span className="text-slate-500">PDF • 12 Pages</span>
                  <span className="text-indigo-400 font-medium group-hover:underline">Open Vault View</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors shadow-sm relative group cursor-pointer">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">Expiring Soon</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-400 z-10">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">Quality SLA Addendum</h3>
                  <div className="space-y-3 mt-4 text-sm text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Signed Date:</span>
                      <span className="text-slate-200 font-medium">May 15, 2025</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Expiry Date:</span>
                      <span className="text-amber-400 font-bold">Apr 15, 2026</span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/30 p-4 border-t border-slate-800/50 flex justify-between items-center text-xs">
                  <span className="text-slate-500">PDF • 3 Pages</span>
                  <span className="text-indigo-400 font-medium group-hover:underline">Open Vault View</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div >
  );
}
