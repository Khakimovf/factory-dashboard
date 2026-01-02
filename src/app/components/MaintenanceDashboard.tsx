import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import { maintenanceApi, FailureReport, MaintenanceStatus } from '../services/maintenanceApi';
import { Wrench, AlertCircle, Clock, CheckCircle, Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function MaintenanceDashboard() {
  const { t } = useLanguage();
  const { productionLines } = useFactory();
  const navigate = useNavigate();
  const [reports, setReports] = useState<FailureReport[]>([]);
  const [loading, setLoading] = useState(true);
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

  const openReports = reports.filter(r => r.status === 'open').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const closedReports = reports.filter(r => r.status === 'closed').length;
  const totalReports = reports.length;

  const filteredReports = statusFilter === 'all' 
    ? reports 
    : reports.filter(r => r.status === statusFilter);

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {t('maintenance.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('maintenance.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/maintenance/failure-reports/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('maintenance.createReport')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

      {/* Status Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
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

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>{t('maintenance.recentReports')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {t('maintenance.loading')}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('maintenance.noReports')}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.slice(0, 10).map(report => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => navigate(`/maintenance/failure-reports/${report.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {report.line_name}
                      </span>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{t('maintenance.reportedBy')}: {report.reported_by}</span>
                      <span>{new Date(report.created_at).toLocaleString()}</span>
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
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/maintenance/failure-reports')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('maintenance.viewAllReports')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('maintenance.viewAllReportsDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/maintenance/failure-reports/new')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('maintenance.reportFailure')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('maintenance.reportFailureDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('maintenance.activeRepairs')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('maintenance.activeRepairsDesc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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

