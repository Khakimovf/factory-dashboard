import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { maintenanceApi, FailureReport, MaintenanceStatus } from '../services/maintenanceApi';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, User, Calendar, Timer, Camera, Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

export function FailureReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [report, setReport] = useState<FailureReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comments, setComments] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus>('open');

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await maintenanceApi.getFailureReport(id);
      setReport(data);
      setComments(data.comments || '');
      setAssignedTo(data.assigned_to || '');
      setStatus(data.status);
    } catch (error) {
      console.error('Error loading failure report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;
    
    try {
      setUpdating(true);
      await maintenanceApi.updateFailureReport(id, {
        comments,
        assigned_to: assignedTo || undefined,
        status,
      });
      await loadReport();
    } catch (error) {
      console.error('Error updating failure report:', error);
      alert(t('maintenance.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleWorkerArrived = async () => {
    if (!id) return;
    
    try {
      setUpdating(true);
      await maintenanceApi.markWorkerArrived(id);
      await loadReport();
    } catch (error) {
      console.error('Error marking worker arrived:', error);
      alert(t('maintenance.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseReport = async () => {
    if (!id) return;
    
    try {
      setUpdating(true);
      await maintenanceApi.updateFailureReport(id, {
        status: 'closed',
      });
      await loadReport();
    } catch (error) {
      console.error('Error closing report:', error);
      alert(t('maintenance.updateError'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-12 text-gray-500">
          {t('maintenance.loading')}
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t('maintenance.reportNotFound')}</p>
          <Button onClick={() => navigate('/maintenance')}>
            {t('maintenance.backToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} ${t('maintenance.minutes')}`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {t('maintenance.failureReport')} #{report.id}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {report.line_name}
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {report.description}
              </p>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.timeline')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TimelineItem
                icon={<Calendar className="w-5 h-5" />}
                label={t('maintenance.createdAt')}
                value={new Date(report.created_at).toLocaleString()}
              />
              {report.worker_arrived_at && (
                <TimelineItem
                  icon={<User className="w-5 h-5" />}
                  label={t('maintenance.workerArrivedAt')}
                  value={new Date(report.worker_arrived_at).toLocaleString()}
                />
              )}
              {report.start_time && (
                <TimelineItem
                  icon={<Clock className="w-5 h-5" />}
                  label={t('maintenance.startedAt')}
                  value={new Date(report.start_time).toLocaleString()}
                />
              )}
              {report.completed_at && (
                <TimelineItem
                  icon={<CheckCircle className="w-5 h-5" />}
                  label={t('maintenance.completedAt')}
                  value={new Date(report.completed_at).toLocaleString()}
                />
              )}
              {report.total_duration_minutes !== undefined && report.total_duration_minutes !== null && (
                <TimelineItem
                  icon={<Timer className="w-5 h-5" />}
                  label={t('maintenance.totalDuration')}
                  value={formatDuration(report.total_duration_minutes)}
                />
              )}
            </CardContent>
          </Card>

          {/* Photo Reports */}
          {report.photo_urls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('maintenance.photoReports')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.photo_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`http://localhost:8000/${url}`}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <a
                        href={`http://localhost:8000/${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailItem
                label={t('maintenance.reportedBy')}
                value={report.reported_by}
              />
              {report.priority && (
                <DetailItem
                  label={t('maintenance.priority')}
                  value={
                    <Badge variant="outline" className="capitalize">
                      {report.priority}
                    </Badge>
                  }
                />
              )}
              <DetailItem
                label={t('maintenance.status')}
                value={<StatusBadge status={report.status} />}
              />
            </CardContent>
          </Card>

          {/* Update Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.updateReport')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">{t('maintenance.status')}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as MaintenanceStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t('maintenance.status.open')}</SelectItem>
                    <SelectItem value="in_progress">{t('maintenance.status.in_progress')}</SelectItem>
                    <SelectItem value="closed">{t('maintenance.status.closed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignedTo">{t('maintenance.assignedTo')}</Label>
                <input
                  id="assignedTo"
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder={t('maintenance.assignedToPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <Label htmlFor="comments">{t('maintenance.comments')}</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={t('maintenance.commentsPlaceholder')}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full"
              >
                {updating ? t('maintenance.updating') : t('maintenance.update')}
              </Button>

              {report.status === 'open' && (
                <Button
                  onClick={handleWorkerArrived}
                  disabled={updating}
                  variant="outline"
                  className="w-full"
                >
                  {t('maintenance.markWorkerArrived')}
                </Button>
              )}

              {report.status !== 'closed' && (
                <Button
                  onClick={handleCloseReport}
                  disabled={updating}
                  variant="destructive"
                  className="w-full"
                >
                  {t('maintenance.closeReport')}
                </Button>
              )}

              <Button
                onClick={() => navigate(`/maintenance/failure-reports/${report.id}/upload-photos`)}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('maintenance.uploadPhotos')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const { t } = useLanguage();
  
  const statusClasses = {
    open: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    closed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status]}`}>
      {t(`maintenance.status.${status}`)}
    </span>
  );
}

function TimelineItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-gray-900 dark:text-white font-medium">{value}</div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}


