import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyProductionPlan, Shift, PlanRow } from '../context/DailyProductionPlanContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export function DailyProductionPlanForm() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createPlan, todayPlan } = useDailyProductionPlan();

  const today = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const [shift, setShift] = useState<Shift>('1-smena');
  const [productGroup, setProductGroup] = useState('');
  const [rows, setRows] = useState<PlanRow[]>([
    { id: '1', partNo: '', reja: 0 },
  ]);
  const [comment, setComment] = useState('');

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
    if (!productGroup.trim()) {
      toast.error(t('productionPlan.productGroupRequired'));
      return;
    }

    const invalidRows = rows.filter(row => !row.partNo.trim() || row.reja <= 0);
    if (invalidRows.length > 0) {
      toast.error(t('productionPlan.invalidRows'));
      return;
    }

    // Create plan
    createPlan({
      date: today,
      shift,
      productGroup: productGroup.trim(),
      rows: rows.map(row => ({
        id: row.id,
        partNo: row.partNo.trim(),
        reja: row.reja,
        fact: row.fact,
      })),
      comment: comment.trim() || undefined,
    });

    toast.success(t('productionPlan.planSaved'));
    navigate('/hr');
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/hr')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('productionPlan.backToHR')}
          </button>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {t('productionPlan.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('productionPlan.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* General Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('productionPlan.generalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">{t('productionPlan.date')}</Label>
                    <Input
                      id="date"
                      type="text"
                      value={formattedDate}
                      disabled
                      className="bg-gray-100 dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift">{t('productionPlan.shift')} *</Label>
                    <Select value={shift} onValueChange={(value) => setShift(value as Shift)}>
                      <SelectTrigger id="shift">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-smena">{t('productionPlan.shift1')}</SelectItem>
                        <SelectItem value="2-smena">{t('productionPlan.shift2')}</SelectItem>
                        <SelectItem value="MIDNIGHT">{t('productionPlan.shiftMidnight')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="productGroup">{t('productionPlan.productGroup')} *</Label>
                    <Input
                      id="productGroup"
                      type="text"
                      value={productGroup}
                      onChange={(e) => setProductGroup(e.target.value)}
                      placeholder={t('productionPlan.productGroupPlaceholder')}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Table Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('productionPlan.planTable')}</CardTitle>
                  <Button
                    type="button"
                    onClick={addRow}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('productionPlan.addRow')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{t('productionPlan.partNo')}</TableHead>
                        <TableHead>{t('productionPlan.reja')}</TableHead>
                        <TableHead>{t('productionPlan.fact')}</TableHead>
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
                              placeholder={t('productionPlan.partNoPlaceholder')}
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
                            <Input
                              type="number"
                              value={row.fact || ''}
                              onChange={(e) => updateRow(row.id, 'fact', e.target.value ? parseFloat(e.target.value) : undefined)}
                              min="0"
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
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('productionPlan.summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('productionPlan.totalReja')}
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {totalReja}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment">{t('productionPlan.comment')}</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('productionPlan.commentPlaceholder')}
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/hr')}
              >
                {t('productionPlan.cancel')}
              </Button>
              <Button type="submit">
                {t('productionPlan.save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

