import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import { maintenanceApi } from '../services/maintenanceApi';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function CreateFailureReport() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const navigate = useNavigate();
  
  const [lineId, setLineId] = useState('');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  const selectedLine = productionLines.find(line => line.id === lineId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lineId || !description || !reportedBy) {
      alert(t('maintenance.fillAllFields'));
      return;
    }

    try {
      setSubmitting(true);
      const report = await maintenanceApi.createFailureReport({
        line_id: lineId,
        line_name: selectedLine?.name || '',
        description,
        reported_by: reportedBy,
        priority: priority !== 'normal' ? priority : undefined,
      });
      
      navigate(`/maintenance/failure-reports/${report.id}`);
    } catch (error) {
      console.error('Error creating failure report:', error);
      alert(t('maintenance.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/maintenance/failure-reports')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('maintenance.backToReports')}
        </Button>
        
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('maintenance.createReport')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('maintenance.createReportDesc')}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {t('maintenance.failureReportForm')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="lineId">{t('maintenance.productionLine')} *</Label>
              <Select value={lineId} onValueChange={setLineId}>
                <SelectTrigger id="lineId">
                  <SelectValue placeholder={t('maintenance.selectLine')} />
                </SelectTrigger>
                <SelectContent>
                  {productionLines.map(line => (
                    <SelectItem key={line.id} value={line.id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reportedBy">{t('maintenance.reportedBy')} *</Label>
              <input
                id="reportedBy"
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                placeholder={t('maintenance.reportedByPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Label htmlFor="priority">{t('maintenance.priority')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('maintenance.priorityLow')}</SelectItem>
                  <SelectItem value="normal">{t('maintenance.priorityNormal')}</SelectItem>
                  <SelectItem value="high">{t('maintenance.priorityHigh')}</SelectItem>
                  <SelectItem value="urgent">{t('maintenance.priorityUrgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">{t('maintenance.description')} *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('maintenance.descriptionPlaceholder')}
                rows={6}
                className="resize-none"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('maintenance.descriptionHint')}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/maintenance/failure-reports')}
                className="flex-1"
              >
                {t('maintenance.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting || !lineId || !description || !reportedBy}
                className="flex-1"
              >
                {submitting ? t('maintenance.creating') : t('maintenance.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


