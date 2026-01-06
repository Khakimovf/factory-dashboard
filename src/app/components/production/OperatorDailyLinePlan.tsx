import { useState } from 'react';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { Factory } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
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
            <Card
              key={line.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-0 hover:shadow-md transition-all cursor-pointer min-h-[180px]"
              onClick={() => setSelectedLineId(line.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Factory className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {line.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('operatorPlan.clickToSend')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}




