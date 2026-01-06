import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import { Wrench, AlertCircle, Clock, CheckCircle, Eye, Factory, X, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

type LineMaintenanceStatus = 'NORMAL' | 'ISSUE_REPORTED' | 'TECHNICIAN_ASSIGNED';

interface LineWithStatus {
  id: string;
  name: string;
  status: LineMaintenanceStatus;
}

export function MaintenanceDashboard() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const navigate = useNavigate();
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  // Local mock data for line statuses - no backend calls
  const [lineStatuses, setLineStatuses] = useState<Record<string, LineMaintenanceStatus>>({
    '1': 'ISSUE_REPORTED', // Assembly Line A
    '2': 'NORMAL', // Assembly Line B
    '3': 'TECHNICIAN_ASSIGNED', // Assembly Line D
  });

  // Get main production lines (A, B, D) with status
  const mainLines: LineWithStatus[] = productionLines
    .filter(l => l.name.includes('Assembly Line'))
    .map(line => ({
      id: line.id,
      name: line.name,
      status: lineStatuses[line.id] || 'NORMAL',
    }));

  const getStatusColor = (status: LineMaintenanceStatus) => {
    switch (status) {
      case 'NORMAL':
        return {
          border: 'border-blue-500 dark:border-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/10',
          hover: 'hover:border-blue-600 dark:hover:border-blue-300',
          icon: 'text-blue-600 dark:text-blue-400',
        };
      case 'ISSUE_REPORTED':
        return {
          border: 'border-red-500 dark:border-red-400',
          bg: 'bg-red-50 dark:bg-red-900/10',
          hover: 'hover:border-red-600 dark:hover:border-red-300',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'TECHNICIAN_ASSIGNED':
        return {
          border: 'border-yellow-500 dark:border-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/10',
          hover: 'hover:border-yellow-600 dark:hover:border-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
        };
    }
  };

  const getStatusLabel = (status: LineMaintenanceStatus) => {
    switch (status) {
      case 'NORMAL':
        return t('maintenance.lineStatus.normal');
      case 'ISSUE_REPORTED':
        return t('maintenance.lineStatus.issueReported');
      case 'TECHNICIAN_ASSIGNED':
        return t('maintenance.lineStatus.technicianAssigned');
    }
  };

  const getStatusBadgeColor = (status: LineMaintenanceStatus) => {
    switch (status) {
      case 'NORMAL':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ISSUE_REPORTED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'TECHNICIAN_ASSIGNED':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const handleUpdateStatus = (lineId: string, newStatus: LineMaintenanceStatus) => {
    setLineStatuses(prev => ({
      ...prev,
      [lineId]: newStatus,
    }));
    toast.success(t('maintenance.statusUpdated'));
  };

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          title={t('maintenance.lineStatus.normal')}
          value={mainLines.filter(l => l.status === 'NORMAL').length}
          color="blue"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          title={t('maintenance.lineStatus.issueReported')}
          value={mainLines.filter(l => l.status === 'ISSUE_REPORTED').length}
          color="red"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title={t('maintenance.lineStatus.technicianAssigned')}
          value={mainLines.filter(l => l.status === 'TECHNICIAN_ASSIGNED').length}
          color="yellow"
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
              const colors = getStatusColor(line.status);

              return (
                <div
                  key={line.id}
                  onClick={() => setSelectedLine(line.id)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${colors.border} ${colors.bg} ${colors.hover} hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Factory className={`w-6 h-6 ${colors.icon}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{line.name}</h3>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      line.status === 'NORMAL' ? 'bg-blue-500' :
                      line.status === 'ISSUE_REPORTED' ? 'bg-red-500 animate-pulse' :
                      'bg-yellow-500'
                    }`}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusBadgeColor(line.status)}>
                      {getStatusLabel(line.status)}
                    </Badge>
                  </div>
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
          lineStatus={lineStatuses[selectedLine] || 'NORMAL'}
          onClose={() => setSelectedLine(null)}
          onStatusUpdate={(newStatus) => handleUpdateStatus(selectedLine, newStatus)}
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

type WorkflowStatus = 'new' | 'worker_assigned' | 'in_progress' | 'completed';

interface LineDetailModalProps {
  lineId: string;
  lineStatus: LineMaintenanceStatus;
  onClose: () => void;
  onStatusUpdate: (status: LineMaintenanceStatus) => void;
}

function LineDetailModal({ lineId, lineStatus, onClose, onStatusUpdate }: LineDetailModalProps) {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  
  // Workflow state (UI-only)
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>(
    lineStatus === 'ISSUE_REPORTED' ? 'new' :
    lineStatus === 'TECHNICIAN_ASSIGNED' ? 'worker_assigned' : 'new'
  );
  const [assignedTime, setAssignedTime] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoComment, setPhotoComment] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  const line = productionLines.find(l => l.id === lineId);

  // Mock report data - local only
  const displayReport = {
    id: 'mock-1',
    line_id: lineId,
    line_name: line?.name || '',
    description: lineStatus === 'ISSUE_REPORTED' || lineStatus === 'TECHNICIAN_ASSIGNED' 
      ? 'Uskunada nosozlik aniqlandi. Tekshirish talab qilinadi.'
      : 'Hozirgi vaqtda muammolar yo\'q.',
    reported_by: 'Line Master',
    created_at: new Date().toISOString(),
  };

  const handleWorkerSent = () => {
    const now = new Date().toISOString();
    setAssignedTime(now);
    setWorkflowStatus('worker_assigned');
    onStatusUpdate('TECHNICIAN_ASSIGNED');
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
            {lineStatus === 'ISSUE_REPORTED' && (
              <div className="flex gap-3">
                <Button
                  onClick={handleWorkerSent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t('maintenance.sendTechnician')}
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
        </div>
      </div>
  );
}

