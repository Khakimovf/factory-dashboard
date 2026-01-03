import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import { maintenanceApi, FailureReport, MaintenanceStatus } from '../services/maintenanceApi';
import { Wrench, AlertCircle, Clock, CheckCircle, Eye, Factory, X, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export function MaintenanceDashboard() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const navigate = useNavigate();
  const [reports, setReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const data = await maintenanceApi.getFailureReports(status);
      setReports(data);
    } catch (error) {
      console.error('Error loading failure reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const openReports = reports.filter(r => r.status === 'open').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const closedReports = reports.filter(r => r.status === 'closed').length;
  const totalReports = reports.length;

  // Get reports for each line
  const getLineReports = (lineId: string) => {
    const line = productionLines.find(l => l.id === lineId);
    if (!line) return [];
    return reports.filter(r => r.line_id === lineId && r.status === 'open');
  };

  // Get main production lines (A, B, D)
  const mainLines = productionLines.filter(l => 
    l.name.includes('Assembly Line')
  );

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {t('maintenance.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('maintenance.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          title={t('maintenance.open')}
          value={openReports}
          color="red"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title={t('maintenance.inProgress')}
          value={inProgressReports}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          title={t('maintenance.closed')}
          value={closedReports}
          color="green"
        />
        <StatCard
          icon={<Wrench className="w-6 h-6" />}
          title={t('maintenance.totalReports')}
          value={totalReports}
          color="blue"
        />
      </div>

      {/* Line Monitoring Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('maintenance.lineRequests')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mainLines.map(line => {
              const lineReports = getLineReports(line.id);
              const hasRequest = lineReports.length > 0;
              const latestReport = lineReports[0] || null;

              return (
                <div
                  key={line.id}
                  onClick={() => setSelectedLine(line.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    hasRequest
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10 hover:border-red-600 hover:shadow-md'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Factory className={`w-6 h-6 ${hasRequest ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{line.name}</h3>
                    </div>
                    {hasRequest && (
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  {hasRequest && latestReport && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="truncate">{latestReport.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(latestReport.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {!hasRequest && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('maintenance.noRequests')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Line Detail Modal */}
      {selectedLine && (
        <LineDetailModal
          lineId={selectedLine}
          onClose={() => setSelectedLine(null)}
          onAccept={async (reportId: string) => {
            try {
              await maintenanceApi.updateFailureReport(reportId, { status: 'in_progress' });
              loadReports();
              setSelectedLine(null);
            } catch (error) {
              console.error('Error updating report:', error);
            }
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{title}</p>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
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
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusClasses[status]}`}>
      {t(`maintenance.status.${status}`)}
    </span>
  );
}

type WorkflowStatus = 'new' | 'worker_assigned' | 'in_progress' | 'completed';

interface LineDetailModalProps {
  lineId: string;
  onClose: () => void;
  onAccept: (reportId: string) => void;
}

function LineDetailModal({ lineId, onClose, onAccept }: LineDetailModalProps) {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const [reports, setReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Workflow state (UI-only)
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>('new');
  const [assignedTime, setAssignedTime] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoComment, setPhotoComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  useEffect(() => {
    const loadLineReports = async () => {
      try {
        setLoading(true);
        const data = await maintenanceApi.getFailureReports(undefined, lineId);
        setReports(data.filter(r => r.status === 'open'));
      } catch (error) {
        console.error('Error loading line reports:', error);
        // For UI-only, initialize with mock data if API fails
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    loadLineReports();
  }, [lineId]);

  const line = productionLines.find(l => l.id === lineId);
  const latestReport = reports[0] || null;

  // If no report found, create a mock one for UI demonstration
  const displayReport = latestReport || {
    id: 'mock-1',
    line_id: lineId,
    line_name: line?.name || '',
    description: 'Mock failure description - API connection unavailable',
    reported_by: 'Line Master',
    status: 'open' as MaintenanceStatus,
    created_at: new Date().toISOString(),
    photo_urls: [],
  };

  const handleWorkerSent = () => {
    const now = new Date().toISOString();
    setAssignedTime(now);
    setWorkflowStatus('worker_assigned');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreview(previews);
  };

  const handleFailureResolved = () => {
    const now = new Date().toISOString();
    setCompletionTime(now);
    setWorkflowStatus('completed');
  };

  const getStatusLabel = (status: WorkflowStatus): string => {
    switch (status) {
      case 'new':
        return t('maintenance.statusNew');
      case 'worker_assigned':
        return t('maintenance.statusInProgress'); // Show "Jarayonda" after worker assigned
      case 'in_progress':
        return t('maintenance.statusInProgress');
      case 'completed':
        return t('maintenance.statusCompleted');
      default:
        return t('maintenance.statusNew');
    }
  };

  const getStatusColor = (status: WorkflowStatus): string => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'worker_assigned':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{line?.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('maintenance.lineRequestDetails')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            {t('maintenance.loading')}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(workflowStatus)}`}>
                {getStatusLabel(workflowStatus)}
              </span>
            </div>

            {/* Failure Details */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">{t('maintenance.failureReport')}</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.description')}</p>
                  <p className="text-gray-900 dark:text-white">{displayReport.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.failureDetectedTime')}</p>
                    <p className="text-gray-900 dark:text-white">{new Date(displayReport.created_at).toLocaleString()}</p>
                  </div>
                  {assignedTime && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.assignedTime')}</p>
                      <p className="text-gray-900 dark:text-white">{new Date(assignedTime).toLocaleString()}</p>
                    </div>
                  )}
                  {completionTime && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.completionTime')}</p>
                      <p className="text-gray-900 dark:text-white">{new Date(completionTime).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Worker Assignment Section */}
            {workflowStatus === 'new' && (
              <div className="flex gap-3">
                <Button
                  onClick={handleWorkerSent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t('maintenance.workerSent')}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  {t('productionDetail.cancel')}
                </Button>
              </div>
            )}

            {/* Photo Upload Section - After Worker Assigned */}
            {(workflowStatus === 'worker_assigned' || workflowStatus === 'in_progress') && (
              <div className="bg-white dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t('maintenance.uploadPhotoReport')}</h4>
                
                <div className="space-y-4">
                  {/* Photo Upload Input */}
                  <div>
                    <Label htmlFor="photo-upload" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('maintenance.photoUpload')}
                    </Label>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="photo-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {t('maintenance.selectPhotos')}
                      </label>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      {photos.length > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {photos.length} {t('maintenance.selectedPhotos')}
                        </span>
                      )}
                    </div>
                    
                    {/* Photo Previews */}
                    {photoPreview.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {photoPreview.map((preview, index) => (
                          <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photo Comment */}
                  <div>
                    <Label htmlFor="photo-comment" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('maintenance.photoComment')}
                    </Label>
                    <Textarea
                      id="photo-comment"
                      value={photoComment}
                      onChange={(e) => setPhotoComment(e.target.value)}
                      placeholder={t('maintenance.photoCommentPlaceholder')}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Failure Resolved Button */}
                  <Button
                    onClick={handleFailureResolved}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {t('maintenance.failureResolved')}
                  </Button>
                </div>
              </div>
            )}

            {/* Completion Report */}
            {workflowStatus === 'completed' && (
              <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">{t('maintenance.completionReport')}</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.failureDetectedTime')}</p>
                      <p className="text-gray-900 dark:text-white font-medium">{new Date(displayReport.created_at).toLocaleString()}</p>
                    </div>
                    {assignedTime && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.assignedTime')}</p>
                        <p className="text-gray-900 dark:text-white font-medium">{new Date(assignedTime).toLocaleString()}</p>
                      </div>
                    )}
                    {completionTime && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.completionTime')}</p>
                        <p className="text-gray-900 dark:text-white font-medium">{new Date(completionTime).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Photos */}
                  {photoPreview.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('maintenance.photoReports')}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {photoPreview.map((preview, index) => (
                          <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img src={preview} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-4">
                    {t('maintenance.reportGenerated')}
                  </p>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('productionDetail.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

