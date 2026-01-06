import { useState, useEffect } from 'react';
import { useDailyProductionPlan, Shift, PlanRow, ProductOption } from '../../context/DailyProductionPlanContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProductionLine } from '../../context/FactoryContext';
import { getPartNumbersForProduct } from '../../data/partNumbers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface OperatorLinePlanFormProps {
  line: ProductionLine;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Operator Line Plan Form Modal
 * Allows operator to send daily production plan for a specific production line
 */
export function OperatorLinePlanForm({ line, open, onClose, onSave }: OperatorLinePlanFormProps) {
  const { t } = useLanguage();
  const { createLinePlan, getTodayLinePlan, updateLinePlan } = useDailyProductionPlan();

  const today = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Check if plan already exists for today
  const existingPlan = getTodayLinePlan(line.id);

  const [shift, setShift] = useState<Shift>(existingPlan?.shift || '1-smena');
  const [productOption, setProductOption] = useState<ProductOption>(
    existingPlan?.productOption || 'MIDNIGHT'
  );
  const [rows, setRows] = useState<PlanRow[]>(
    existingPlan?.rows.length 
      ? existingPlan.rows 
      : [{ id: Date.now().toString(), partNo: '', reja: 0 }]
  );

  // Get available part numbers for current product option
  const availablePartNumbers = getPartNumbersForProduct(productOption);

  // Reset form when line changes or modal opens
  useEffect(() => {
    if (open) {
      const plan = getTodayLinePlan(line.id);
      if (plan) {
        setShift(plan.shift);
        setProductOption(plan.productOption || 'MIDNIGHT');
        setRows(plan.rows);
      } else {
        setShift('1-smena');
        setProductOption('MIDNIGHT');
        setRows([{ id: Date.now().toString(), partNo: '', reja: 0 }]);
      }
    }
  }, [open, line.id, getTodayLinePlan]);

  // Reset plan items when product option changes (but not on initial load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    if (open && !isInitialLoad) {
      // User changed product option - reset the plan items
      setRows([{ id: Date.now().toString(), partNo: '', reja: 0 }]);
    }
    if (open) {
      setIsInitialLoad(false);
    }
  }, [productOption, open, isInitialLoad]);

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), partNo: '', reja: 0 }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof PlanRow, value: string | number) => {
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const totalReja = rows.reduce((sum, row) => sum + (row.reja || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const invalidRows = rows.filter(row => !row.partNo.trim() || row.reja <= 0);
    if (invalidRows.length > 0) {
      toast.error(t('operatorPlan.invalidRows'));
      return;
    }

    // Create or update plan
    if (existingPlan) {
      updateLinePlan(today, line.id, {
        shift,
        productOption,
        rows: rows.map(row => ({
          id: row.id,
          partNo: row.partNo.trim(),
          reja: row.reja,
        })),
      });
      toast.success(t('operatorPlan.planUpdated'));
    } else {
      createLinePlan({
        date: today,
        lineId: line.id,
        lineName: line.name,
        shift,
        productOption,
        productName: line.name, // For operator plans, use line name as product name
        rows: rows.map(row => ({
          id: row.id,
          partNo: row.partNo.trim(),
          reja: row.reja,
        })),
      });
      toast.success(t('operatorPlan.planSent'));
    }

    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('operatorPlan.formTitle')} - {line.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Read-only Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">{t('operatorPlan.date')}</Label>
                <Input
                  id="date"
                  type="text"
                  value={formattedDate}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="line">{t('operatorPlan.productionLine')}</Label>
                <Input
                  id="line"
                  type="text"
                  value={line.name}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Shift and Product Option Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shift">{t('operatorPlan.shift')} *</Label>
                <Select value={shift} onValueChange={(value) => setShift(value as Shift)}>
                  <SelectTrigger id="shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-smena">{t('operatorPlan.shift1')}</SelectItem>
                    <SelectItem value="2-smena">{t('operatorPlan.shift2')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="productOption">{t('operatorPlan.productOption')} *</Label>
                <Select value={productOption} onValueChange={(value) => setProductOption(value as ProductOption)}>
                  <SelectTrigger id="productOption">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIDNIGHT">{t('operatorPlan.productMidnight')}</SelectItem>
                    <SelectItem value="URBAN">{t('operatorPlan.productUrban')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Plan Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">{t('operatorPlan.planTable')}</Label>
                <Button
                  type="button"
                  onClick={addRow}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('operatorPlan.addRow')}
                </Button>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{t('operatorPlan.partNo')}</TableHead>
                      <TableHead>{t('operatorPlan.reja')}</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.partNo}
                            onValueChange={(value) => updateRow(row.id, 'partNo', value)}
                          >
                            <SelectTrigger className="min-w-[200px]">
                              <SelectValue placeholder={t('operatorPlan.selectPartNo')} />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePartNumbers.map(partNo => (
                                <SelectItem key={partNo} value={partNo}>
                                  {partNo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.reja || ''}
                            onChange={(e) => updateRow(row.id, 'reja', parseFloat(e.target.value) || 0)}
                            min="1"
                            required
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {rows.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
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
                  {t('operatorPlan.totalReja')}
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalReja}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                {t('operatorPlan.cancel')}
              </Button>
              <Button type="submit">
                {t('operatorPlan.sendPlan')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

