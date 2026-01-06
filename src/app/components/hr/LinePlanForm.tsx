import { useState, useEffect } from 'react';
import { useDailyProductionPlan, Shift, PlanRow } from '../../context/DailyProductionPlanContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProductionLine } from '../../context/FactoryContext';
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

interface LinePlanFormProps {
  line: ProductionLine;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

/**
 * Line Plan Form Modal
 * Allows operator to enter/edit daily production plan for a specific production line
 */
export function LinePlanForm({ line, open, onClose, onSave }: LinePlanFormProps) {
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
  const [productName, setProductName] = useState(existingPlan?.productName || '');
  const [rows, setRows] = useState<PlanRow[]>(
    existingPlan?.rows.length 
      ? existingPlan.rows 
      : [{ id: Date.now().toString(), partNo: '', reja: 0 }]
  );

  // Reset form when line changes or modal opens
  useEffect(() => {
    if (open) {
      const plan = getTodayLinePlan(line.id);
      if (plan) {
        setShift(plan.shift);
        setProductName(plan.productName);
        setRows(plan.rows);
      } else {
        setShift('1-smena');
        setProductName('');
        setRows([{ id: Date.now().toString(), partNo: '', reja: 0 }]);
      }
    }
  }, [open, line.id, getTodayLinePlan]);

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
    if (!productName.trim()) {
      toast.error(t('linePlan.productNameRequired'));
      return;
    }

    const invalidRows = rows.filter(row => !row.partNo.trim() || row.reja <= 0);
    if (invalidRows.length > 0) {
      toast.error(t('linePlan.invalidRows'));
      return;
    }

    // Create or update plan
    if (existingPlan) {
      updateLinePlan(today, line.id, {
        shift,
        productName: productName.trim(),
        rows: rows.map(row => ({
          id: row.id,
          partNo: row.partNo.trim(),
          reja: row.reja,
        })),
      });
      toast.success(t('linePlan.planUpdated'));
    } else {
      createLinePlan({
        date: today,
        lineId: line.id,
        lineName: line.name,
        shift,
        productName: productName.trim(),
        rows: rows.map(row => ({
          id: row.id,
          partNo: row.partNo.trim(),
          reja: row.reja,
        })),
      });
      toast.success(t('linePlan.planSaved'));
    }

    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('linePlan.formTitle')} - {line.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">{t('linePlan.date')}</Label>
                <Input
                  id="date"
                  type="text"
                  value={formattedDate}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="line">{t('linePlan.productionLine')}</Label>
                <Input
                  id="line"
                  type="text"
                  value={line.name}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="shift">{t('linePlan.shift')} *</Label>
                <Select value={shift} onValueChange={(value) => setShift(value as Shift)}>
                  <SelectTrigger id="shift">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-smena">{t('linePlan.shift1')}</SelectItem>
                    <SelectItem value="2-smena">{t('linePlan.shift2')}</SelectItem>
                    <SelectItem value="MIDNIGHT">{t('linePlan.shiftMidnight')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <Label htmlFor="productName">{t('linePlan.productName')} *</Label>
              <Input
                id="productName"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={t('linePlan.productNamePlaceholder')}
                required
              />
            </div>

            {/* Plan Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">{t('linePlan.planTable')}</Label>
                <Button
                  type="button"
                  onClick={addRow}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('linePlan.addRow')}
                </Button>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{t('linePlan.partNo')}</TableHead>
                      <TableHead>{t('linePlan.reja')}</TableHead>
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
                          <Input
                            type="text"
                            value={row.partNo}
                            onChange={(e) => updateRow(row.id, 'partNo', e.target.value)}
                            placeholder={t('linePlan.partNoPlaceholder')}
                            required
                            className="min-w-[200px]"
                          />
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
                  {t('linePlan.totalReja')}
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
                {t('linePlan.cancel')}
              </Button>
              <Button type="submit">
                {t('linePlan.savePlan')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}




