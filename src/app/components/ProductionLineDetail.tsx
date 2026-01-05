import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { useDailyProductionPlan } from '../context/DailyProductionPlanContext';
import { maintenanceApi } from '../services/maintenanceApi';
import { ArrowLeft, Package, PlayCircle, PauseCircle, Settings, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { LinePlanModal } from './hr/LinePlanModal';

export function ProductionLineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { productionLines, materials, updateProductionLine, requestMaterials } = useFactory();
  const { t } = useLanguage();
  const { getTodayLinePlan } = useDailyProductionPlan();
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceDateTime, setMaintenanceDateTime] = useState('');
  const [showProductionPlan, setShowProductionPlan] = useState(false);

  const line = productionLines.find(l => l.id === id);
  
  // Get today's plan for this line
  const todayPlan = line ? getTodayLinePlan(line.id) : null;

  if (!line) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('productionDetail.lineNotFound')}</h2>
          <button
            onClick={() => navigate('/production-lines')}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {t('productionDetail.backToLines')}
          </button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: 'active' | 'idle' | 'maintenance') => {
    updateProductionLine(id!, { status: newStatus });
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/production-lines')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('productionDetail.backToLines')}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{line.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('productionDetail.lineId')}: {line.id}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                line.status === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <PlayCircle className="w-5 h-5 inline mr-2" />
              {t('productionDetail.active')}
            </button>
            <button
              onClick={() => handleStatusChange('idle')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                line.status === 'idle'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <PauseCircle className="w-5 h-5 inline mr-2" />
              {t('productionDetail.idle')}
            </button>
            <button
              onClick={() => handleStatusChange('maintenance')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                line.status === 'maintenance'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Settings className="w-5 h-5 inline mr-2" />
              {t('productionDetail.maintenance')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Statistics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('productionDetail.lineStats')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('productionDetail.efficiency')}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.efficiency}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      line.efficiency >= 80 ? 'bg-green-500' : line.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${line.efficiency}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                {todayPlan ? (
                  <Button
                    onClick={() => setShowProductionPlan(true)}
                    variant="outline"
                    size="sm"
                    className="w-full text-sm"
                  >
                    {t('productionDetail.todayPlan')}
                  </Button>
                ) : (
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('linePlan.noPlanToday')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('productionDetail.status')}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  line.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                  line.status === 'idle' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {t(`productionDetail.${line.status}`)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('productionDetail.sendMaintenanceRequest')}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await maintenanceApi.createFailureReport({
                  line_id: id!,
                  line_name: line.name,
                  description: maintenanceDescription,
                  reported_by: 'Line Master', // This would come from auth in real app
                  priority: 'normal'
                });
                setMaintenanceDescription('');
                setMaintenanceDateTime('');
                alert(t('productionDetail.requestSubmitted'));
              } catch (error) {
                console.error('Error submitting maintenance request:', error);
                alert(t('productionDetail.requestError'));
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('productionDetail.failureDescription')}
                  </label>
                  <textarea
                    value={maintenanceDescription}
                    onChange={(e) => setMaintenanceDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t('productionDetail.failureDescriptionPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('productionDetail.failureTime')}
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceDateTime}
                    onChange={(e) => setMaintenanceDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t('productionDetail.submitRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Required Materials */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('productionDetail.requiredMaterials')}</h3>
              <button
                onClick={() => setShowMaterialModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('productionDetail.addMaterial')}
              </button>
            </div>

            {line.requiredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{t('productionDetail.noMaterials')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('productionDetail.addMaterialsHint')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {line.requiredMaterials.map(req => {
                  const material = materials.find(m => m.id === req.materialId);
                  if (!material) return null;

                  const available = material.quantity >= req.quantity;

                  return (
                    <div key={req.materialId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mt-1">
                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{material.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{material.category}</p>
                            <div className="mt-3 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.required')}</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.quantity} {material.unit}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.available')}</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{material.quantity} {material.unit}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('productionDetail.status')}</p>
                                <p className={`text-sm font-semibold ${available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {available ? t('productionDetail.sufficient') : t('productionDetail.insufficient')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => requestMaterials(material.id, req.quantity)}
                          disabled={!available}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            available
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {t('productionDetail.request')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Moved to Bottom */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('productionDetail.quickActions')}</h3>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            {t('productionDetail.viewReport')}
          </button>
          <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            {t('productionDetail.scheduleMaintenance')}
          </button>
          <button className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
            {t('productionDetail.exportData')}
          </button>
        </div>
      </div>

      {/* Add Material Modal */}
      {showMaterialModal && (
        <AddMaterialModal
          lineId={id!}
          onClose={() => setShowMaterialModal(false)}
          onAdd={(materialId, quantity) => {
            const newMaterials = [...line.requiredMaterials, { materialId, quantity }];
            updateProductionLine(id!, { requiredMaterials: newMaterials });
            setShowMaterialModal(false);
          }}
          existingMaterials={line.requiredMaterials.map(m => m.materialId)}
        />
      )}

      {/* Production Plan Modal */}
      {line && (
        <LinePlanModal
          open={showProductionPlan}
          onClose={() => setShowProductionPlan(false)}
          lineId={line.id}
          lineName={line.name}
        />
      )}
    </div>
  );
}

interface AddMaterialModalProps {
  lineId: string;
  onClose: () => void;
  onAdd: (materialId: string, quantity: number) => void;
  existingMaterials: string[];
}


function AddMaterialModal({ onClose, onAdd, existingMaterials }: AddMaterialModalProps) {
  const { materials } = useFactory();
  const { t } = useLanguage();
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState(1);

  const availableMaterials = materials.filter(m => !existingMaterials.includes(m.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaterial) {
      onAdd(selectedMaterial, quantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('productionDetail.addMaterialTitle')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('productionDetail.material')}
            </label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">{t('productionDetail.selectMaterial')}</option>
              {availableMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.quantity} {material.unit} {t('productionDetail.availableLabel')})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('productionDetail.quantityRequired')}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('productionDetail.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('productionDetail.addMaterial')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
