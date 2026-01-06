import { useState } from 'react';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Package, AlertTriangle, CheckCircle, Search, ArrowLeft, User, FileText } from 'lucide-react';
import { Material } from '../context/FactoryContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function Warehouse() {
  const { materials, addMaterial, updateMaterialQuantity } = useFactory();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRow, setSelectedRow] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [responsiblePersons, setResponsiblePersons] = useState<Record<string, string>>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  
  // Add Material Modal State
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    materialId: '',
    unit: '',
    quantity: '',
    minStock: '',
  });
  const [materialError, setMaterialError] = useState('');
  
  // Quantity editing state
  const [editingQuantity, setEditingQuantity] = useState<Record<string, string>>({});

  const categories = ['all', ...Array.from(new Set(materials.map(m => m.category)))];

  // Mock function to assign materials to rows (distribute evenly by index)
  const getMaterialRow = (materialId: string): 'A' | 'B' | 'C' | 'D' => {
    const materialIndex = materials.findIndex(m => m.id === materialId);
    const rows: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    return rows[materialIndex % 4];
  };

  const getRowMaterials = (row: 'A' | 'B' | 'C' | 'D'): Material[] => {
    return materials.filter(m => getMaterialRow(m.id) === row);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const rowMaterials = selectedRow ? getRowMaterials(selectedRow) : [];

  const filteredRowMaterials = selectedRow
    ? rowMaterials.filter(material => {
        const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    : [];

  // Show row selection view if no row is selected
  if (!selectedRow) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('warehouse.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('warehouse.subtitle')}</p>
          </div>
          <Link
            to="/warehouse/requests"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            {t('warehouse.requests.title')}
          </Link>
        </div>

        {/* Row Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['A', 'B', 'C', 'D'] as const).map(row => {
            const rowMaterials = getRowMaterials(row);
            const totalMaterials = rowMaterials.length;
            const wellStocked = rowMaterials.filter(m => m.quantity > m.minStock).length;
            const lowStock = rowMaterials.filter(m => m.quantity <= m.minStock).length;

            return (
              <div
                key={row}
                onClick={() => setSelectedRow(row)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md hover:border-blue-500 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('warehouse.row')} {row}</h3>
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('warehouse.totalMaterials')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{totalMaterials}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('warehouse.wellStocked')}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{wellStocked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('warehouse.lowStock')}</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">{lowStock}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Show row detail view
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('warehouse.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('warehouse.subtitle')}</p>
      </div>

      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedRow(null)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('warehouse.backToRows')}
          </button>
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {t('warehouse.row')} {selectedRow}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('warehouse.rowDetailSubtitle')}</p>
          </div>
        </div>
        <Link
          to="/warehouse/requests"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          {t('warehouse.requests.title')}
        </Link>
      </div>

      {/* Responsible Person Field */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          {t('warehouse.responsiblePerson')}
        </label>
        <input
          type="text"
          value={responsiblePersons[selectedRow] || ''}
          onChange={(e) => setResponsiblePersons({ ...responsiblePersons, [selectedRow]: e.target.value })}
          placeholder={t('warehouse.responsiblePersonPlaceholder')}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryCard
          icon={<Package className="w-6 h-6" />}
          title={t('warehouse.totalMaterials')}
          value={rowMaterials.length}
          color="blue"
        />
        <SummaryCard
          icon={<CheckCircle className="w-6 h-6" />}
          title={t('warehouse.wellStocked')}
          value={rowMaterials.filter(m => m.quantity > m.minStock).length}
          color="green"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title={t('warehouse.lowStock')}
          value={rowMaterials.filter(m => m.quantity <= m.minStock).length}
          color="orange"
        />
      </div>

      {/* Filters and Add Material Button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder={t('warehouse.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 items-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? t('warehouse.all') : category}
              </button>
            ))}
            <Button
              onClick={() => {
                setIsAddMaterialOpen(true);
                setNewMaterial({ materialId: '', unit: '', quantity: '', minStock: '' });
                setMaterialError('');
              }}
              className="ml-auto"
            >
              {t('warehouse.addMaterial')}
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Materials List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('warehouse.material')}</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('warehouse.category')}</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('warehouse.stockLevel')}</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('warehouse.status')}</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 dark:text-white">{t('warehouse.minStock')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRowMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t('warehouse.noMaterials')}
                  </td>
                </tr>
              ) : (
                filteredRowMaterials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{material.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{material.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingQuantity[material.id] !== undefined ? editingQuantity[material.id] : material.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditingQuantity({ ...editingQuantity, [material.id]: value });
                            }}
                            onBlur={(e) => {
                              const newQuantity = parseFloat(e.target.value);
                              if (!isNaN(newQuantity) && newQuantity >= 0 && newQuantity !== material.quantity) {
                                updateMaterialQuantity(material.id, newQuantity);
                                toast.success(t('warehouse.quantityUpdated'));
                                const updated = { ...editingQuantity };
                                delete updated[material.id];
                                setEditingQuantity(updated);
                              } else {
                                const updated = { ...editingQuantity };
                                delete updated[material.id];
                                setEditingQuantity(updated);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-24 h-8 text-sm"
                            min="0"
                            step="0.01"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{material.unit}</span>
                        </div>
                        <div className="mt-1 w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              material.quantity > material.minStock ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                            style={{
                              width: `${Math.min((material.quantity / (material.minStock * 2)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {material.quantity > material.minStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          {t('warehouse.inStock')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                          <AlertTriangle className="w-3 h-3" />
                          {t('warehouse.lowStock')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {material.minStock} {material.unit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Dialog */}
      <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('warehouse.addMaterialTitle')}</DialogTitle>
            <DialogDescription>
              {t('warehouse.addMaterialTitle')}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddMaterial();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="materialId">{t('warehouse.materialId')} *</Label>
              <Input
                id="materialId"
                type="text"
                value={newMaterial.materialId}
                onChange={(e) => {
                  setNewMaterial({ ...newMaterial, materialId: e.target.value });
                  setMaterialError('');
                }}
                placeholder={t('warehouse.materialIdPlaceholder')}
                required
                className={materialError ? 'border-red-500' : ''}
              />
              {materialError && (
                <p className="text-sm text-red-500 dark:text-red-400">{materialError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">{t('warehouse.measurementUnit')} *</Label>
              <Select
                value={newMaterial.unit}
                onValueChange={(value) => setNewMaterial({ ...newMaterial, unit: value })}
                required
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder={t('warehouse.selectUnit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">{t('warehouse.kg')}</SelectItem>
                  <SelectItem value="litr">{t('warehouse.litr')}</SelectItem>
                  <SelectItem value="dona">{t('warehouse.dona')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{t('warehouse.initialQuantity')} *</Label>
              <Input
                id="quantity"
                type="number"
                value={newMaterial.quantity}
                onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                placeholder={t('warehouse.initialQuantityPlaceholder')}
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">{t('warehouse.minStock')}</Label>
              <Input
                id="minStock"
                type="number"
                value={newMaterial.minStock}
                onChange={(e) => setNewMaterial({ ...newMaterial, minStock: e.target.value })}
                placeholder={t('warehouse.minStockPlaceholder')}
                min="0"
                step="0.01"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddMaterialOpen(false);
                  setNewMaterial({ materialId: '', unit: '', quantity: '', minStock: '' });
                  setMaterialError('');
                }}
              >
                {t('warehouse.cancel')}
              </Button>
              <Button type="submit">{t('warehouse.save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleAddMaterial() {
    // Validation
    if (!newMaterial.materialId.trim()) {
      setMaterialError(t('warehouse.materialIdRequired'));
      return;
    }

    if (!newMaterial.unit) {
      return;
    }

    const quantity = parseFloat(newMaterial.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setMaterialError(t('warehouse.initialQuantityMin'));
      return;
    }

    const minStock = newMaterial.minStock ? parseFloat(newMaterial.minStock) : 0;

    try {
      addMaterial({
        materialId: newMaterial.materialId.trim(),
        name: `Material ${newMaterial.materialId.trim()}`,
        unit: newMaterial.unit,
        quantity,
        minStock,
        category: 'Raw Material', // Default category, can be enhanced later
      });

      toast.success(t('warehouse.materialAdded'));
      setIsAddMaterialOpen(false);
      setNewMaterial({ materialId: '', unit: '', quantity: '', minStock: '' });
      setMaterialError('');
    } catch (error: any) {
      if (error.message === 'Bu detal allaqachon mavjud') {
        setMaterialError(t('warehouse.materialExists'));
      } else {
        setMaterialError(error.message || 'Xatolik yuz berdi');
      }
    }
  }
}

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: 'blue' | 'green' | 'orange';
}

function SummaryCard({ icon, title, value, color }: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
