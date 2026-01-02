import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { maintenanceApi, FailureReport, MaintenanceStatus } from '../services/maintenanceApi';
import { AlertCircle, Clock, CheckCircle, Search, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function FailureReportList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');

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

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.line_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') {
      return matchesSearch;
    }
    return matchesSearch && report.status === statusFilter;
  });

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('maintenance.failureReports')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('maintenance.failureReportsDesc')}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('maintenance.searchReports')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'open', 'in_progress', 'closed'] as const).map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {t(`maintenance.status.${status}`)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {t('maintenance.loading')}
          </CardContent>
        </Card>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {t('maintenance.noReports')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map(report => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/maintenance/failure-reports/${report.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {report.line_name}
                      </h3>
                      <StatusBadge status={report.status} />
                      {report.priority && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded text-xs font-medium">
                          {report.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {t('maintenance.reportedBy')}: <strong>{report.reported_by}</strong>
                      </span>
                      {report.assigned_to && (
                        <span>
                          {t('maintenance.assignedTo')}: <strong>{report.assigned_to}</strong>
                        </span>
                      )}
                      <span>
                        {t('maintenance.createdAt')}: {new Date(report.created_at).toLocaleString()}
                      </span>
                      {report.total_duration_minutes !== undefined && report.total_duration_minutes !== null && (
                        <span>
                          {t('maintenance.duration')}: {report.total_duration_minutes} {t('maintenance.minutes')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/maintenance/failure-reports/${report.id}`);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('maintenance.viewDetails')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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

  const statusIcons = {
    open: <AlertCircle className="w-3 h-3" />,
    in_progress: <Clock className="w-3 h-3" />,
    closed: <CheckCircle className="w-3 h-3" />,
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusClasses[status]}`}>
      {statusIcons[status]}
      {t(`maintenance.status.${status}`)}
    </span>
  );
}

