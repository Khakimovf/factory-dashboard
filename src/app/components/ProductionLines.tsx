import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFactory } from '../context/FactoryContext';
import { useLanguage } from '../context/LanguageContext';
import { Factory, Plus, Activity, AlertCircle, PlayCircle, PauseCircle } from 'lucide-react';

export function ProductionLines() {
  const { productionLines, addProductionLine } = useFactory();
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'idle':
        return <PauseCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'maintenance':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'idle':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'maintenance':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('production.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('production.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t('production.addLine')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label={t('production.totalLines')}
          value={productionLines.length}
          icon={<Factory className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label={t('production.active')}
          value={productionLines.filter(l => l.status === 'active').length}
          icon={<PlayCircle className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          label={t('production.idle')}
          value={productionLines.filter(l => l.status === 'idle').length}
          icon={<PauseCircle className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          label={t('production.avgEfficiency')}
          value={`${Math.round(productionLines.reduce((sum, l) => sum + l.efficiency, 0) / productionLines.length)}%`}
          icon={<Activity className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Production Lines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productionLines.map(line => (
          <div
            key={line.id}
            onClick={() => navigate(`/production-lines/${line.id}`)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Factory className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{line.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.id')}: {line.id}</p>
                </div>
              </div>
              {getStatusIcon(line.status)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.status')}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(line.status)}`}>
                  {t(`production.${line.status}`)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.efficiency')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.efficiency}%</span>
              </div>

              <div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      line.efficiency >= 80 ? 'bg-green-500' : line.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${line.efficiency}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.output')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.output} {t('production.unitsPerDay')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('production.materialsRequired')}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{line.requiredMaterials.length} {t('production.types')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddLineModal
          onClose={() => setShowAddModal(false)}
          onAdd={(line) => {
            addProductionLine(line);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface AddLineModalProps {
  onClose: () => void;
  onAdd: (line: any) => void;
}

function AddLineModal({ onClose, onAdd }: AddLineModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      status: 'idle',
      efficiency: 0,
      requiredMaterials: [],
      output: 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('production.addLineTitle')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('production.lineName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('production.placeholderExample')}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('production.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('production.addLine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
