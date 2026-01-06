import { useDailyProductionPlan } from '../../context/DailyProductionPlanContext';
import { useLanguage } from '../../context/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Calendar, Package, Factory } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface LinePlanModalProps {
  open: boolean;
  onClose: () => void;
  lineId: string;
  lineName: string;
}

/**
 * Line Plan Modal (Read-Only)
 * Displays the daily production plan for a specific production line
 * Used on production line detail pages
 */
export function LinePlanModal({ open, onClose, lineId, lineName }: LinePlanModalProps) {
  const { t } = useLanguage();
  const { getTodayLinePlan } = useDailyProductionPlan();

  const plan = getTodayLinePlan(lineId);

  if (!plan) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('linePlan.viewTitle')} - {lineName}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <p>{t('linePlan.noPlanToday')}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              {t('linePlan.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formattedDate = new Date(plan.date).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case '1-smena':
        return t('linePlan.shift1');
      case '2-smena':
        return t('linePlan.shift2');
      case 'MIDNIGHT':
        return t('linePlan.shiftMidnight');
      default:
        return shift;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('linePlan.viewTitle')} - {lineName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('linePlan.date')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formattedDate}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Factory className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('linePlan.shift')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {getShiftLabel(plan.shift)}
              </p>
            </div>
            {plan.productOption && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('operatorPlan.productOption')}</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.productOption === 'MIDNIGHT' ? t('operatorPlan.productMidnight') : t('operatorPlan.productUrban')}
                </p>
              </div>
            )}
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('linePlan.productName')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {plan.productName}
              </p>
            </div>
          </div>

          {/* Plan Table */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t('linePlan.planTable')}
            </h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t('linePlan.partNo')}</TableHead>
                    <TableHead>{t('linePlan.reja')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.rows.map((row, index) => (
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
                {t('linePlan.totalReja')}
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {plan.totalReja}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            {t('linePlan.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

