import { useDailyProductionPlan } from '../context/DailyProductionPlanContext';
import { useLanguage } from '../context/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Package } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface DailyProductionPlanModalProps {
  open: boolean;
  onClose: () => void;
}

export function DailyProductionPlanModal({ open, onClose }: DailyProductionPlanModalProps) {
  const { t } = useLanguage();
  const { todayPlan } = useDailyProductionPlan();

  if (!todayPlan) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('productionPlan.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <p>{t('productionPlan.noPlanToday')}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              {t('productionPlan.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formattedDate = new Date(todayPlan.date).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case '1-smena':
        return t('productionPlan.shift1');
      case '2-smena':
        return t('productionPlan.shift2');
      case 'MIDNIGHT':
        return t('productionPlan.shiftMidnight');
      default:
        return shift;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('productionPlan.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('productionPlan.date')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formattedDate}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('productionPlan.shift')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {getShiftLabel(todayPlan.shift)}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('productionPlan.productGroup')}</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {todayPlan.productGroup}
              </p>
            </div>
          </div>

          {/* Plan Table */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t('productionPlan.planTable')}
            </h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t('productionPlan.partNo')}</TableHead>
                    <TableHead>{t('productionPlan.reja')}</TableHead>
                    {todayPlan.rows.some(row => row.fact !== undefined) && (
                      <TableHead>{t('productionPlan.fact')}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayPlan.rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {row.partNo}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {row.reja}
                      </TableCell>
                      {todayPlan.rows.some(r => r.fact !== undefined) && (
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {row.fact ?? '-'}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('productionPlan.totalReja')}
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {todayPlan.totalReja}
              </span>
            </div>
          </div>

          {/* Comment */}
          {todayPlan.comment && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">{todayPlan.comment}</p>
            </div>
          )}

          {/* Note */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              {t('productionPlan.planNote')}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            {t('productionPlan.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

