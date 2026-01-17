import { useMemo } from 'react';
import { Factory, Clock, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../context/LanguageContext';

export interface QCInspectorAssignment {
  inspectorId: string;
  inspectorName: string;
  lineId: string;
  lineName: string;
  scanTime: string;
  device?: string;
  method: 'QR_SCAN' | 'MANUAL';
}

interface QCLineStatusPanelProps {
  lineId: string;
  lineName: string;
  assignment: QCInspectorAssignment | null;
}

export function QCLineStatusPanel({ lineId, lineName, assignment }: QCLineStatusPanelProps) {
  const { t } = useLanguage();

  const status = useMemo(() => {
    if (!assignment) {
      return { type: 'ABSENT', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: t('qc.checkin.absent') };
    }

    const scanTime = new Date(assignment.scanTime);
    const now = new Date();
    const hoursSinceScan = (now.getTime() - scanTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceScan > 2) {
      return { type: 'ABSENT', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: t('qc.checkin.absent') };
    } else if (hoursSinceScan > 1.5) {
      return { type: 'WARNING', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', label: t('qc.checkin.warning') };
    } else {
      return { type: 'PRESENT', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: t('qc.checkin.present') };
    }
  }, [assignment, t]);

  const timeSinceScan = useMemo(() => {
    if (!assignment) return null;
    const scanTime = new Date(assignment.scanTime);
    const now = new Date();
    const diffMs = now.getTime() - scanTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [assignment]);

  return (
    <Card className={status.type === 'ABSENT' ? 'border-red-500' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4" />
            {lineName}
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {assignment ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{assignment.inspectorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {new Date(assignment.scanTime).toLocaleString()}
              </span>
            </div>
            {timeSinceScan && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('qc.checkin.timeSince')}: {timeSinceScan}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <AlertTriangle className="w-4 h-4" />
            {t('qc.checkin.noInspector')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
