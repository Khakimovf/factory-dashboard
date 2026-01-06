import { useState } from 'react';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { Factory } from 'lucide-react';
import { OperatorLinePlanForm } from './OperatorLinePlanForm';

/**
 * Operator Daily Line Plan Entry Page
 * Allows operators to send daily production plans to production lines
 */
export function OperatorDailyLinePlan() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const selectedLine = selectedLineId 
    ? productionLines.find(line => line.id === selectedLineId)
    : null;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('operatorPlan.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('operatorPlan.subtitle')}
        </p>
      </div>

      {/* Production Lines Grid – match ProductionLines card sizing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productionLines.map(line => (
          <div
            key={line.id}
            onClick={() => setSelectedLineId(line.id)}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Factory className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{line.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.id')}: {line.id}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium text-center">
                {t('operatorPlan.clickToSend')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Line Plan Form Modal */}
      {selectedLine && (
        <OperatorLinePlanForm
          line={selectedLine}
          open={!!selectedLine}
          onClose={() => setSelectedLineId(null)}
          onSave={() => setSelectedLineId(null)}
        />
      )}
    </div>
  );
}




