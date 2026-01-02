import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useFactory } from '../context/FactoryContext';
import { maintenanceApi, FailureReport, MaintenanceStatus } from '../services/maintenanceApi';
import { Wrench, AlertCircle, Clock, CheckCircle, Eye, Factory } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

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

  // Get main production lines (A, B, C or first 3)
  const mainLines = productionLines.filter(l => 
    l.name.includes('Assembly Line') || l.name.includes('Line')
  ).slice(0, 3);

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

  useEffect(() => {
    const loadLineReports = async () => {
      try {
        setLoading(true);
        const data = await maintenanceApi.getFailureReports(undefined, lineId);
        setReports(data.filter(r => r.status === 'open'));
      } catch (error) {
        console.error('Error loading line reports:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLineReports();
  }, [lineId]);

  const line = productionLines.find(l => l.id === lineId);
  const latestReport = reports[0] || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{line?.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('maintenance.lineRequestDetails')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            {t('maintenance.loading')}
          </div>
        ) : latestReport ? (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">{t('maintenance.failureReport')}</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.descriptionHint')}</p>
                  <p className="text-gray-900 dark:text-white">{latestReport.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.reportedBy')}</p>
                  <p className="text-gray-900 dark:text-white">{latestReport.reported_by}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('maintenance.createdAt')}</p>
                  <p className="text-gray-900 dark:text-white">{new Date(latestReport.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('productionDetail.cancel')}
              </button>
              <button
                onClick={() => onAccept(latestReport.id)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {t('maintenance.acceptRequest')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t('maintenance.noRequests')}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('productionDetail.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

