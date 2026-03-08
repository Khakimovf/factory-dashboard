import { useMemo } from 'react';
import { Factory, Clock, User, AlertTriangle, UserCheck, QrCode } from 'lucide-react';
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
      return { type: 'ABSENT', color: 'bg-red-500/10 text-red-500 border-red-500/20', label: t('qc.checkin.absent') };
    }

    const scanTime = new Date(assignment.scanTime);
    const now = new Date();
    const hoursSinceScan = (now.getTime() - scanTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceScan > 2) {
      return { type: 'ABSENT', color: 'bg-red-500/10 text-red-500 border-red-500/20', label: t('qc.checkin.absent') };
    } else if (hoursSinceScan > 1.5) {
      return { type: 'WARNING', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: t('qc.checkin.warning') };
    } else {
      return { type: 'PRESENT', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20', label: t('qc.checkin.present') };
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
    <Card className={`overflow-hidden border group transition-all duration-300 ${status.type === 'ABSENT' ? 'border-red-500/40 bg-red-500/5' : 'border-slate-200 dark:border-slate-800 dark:bg-slate-900/40'}`}>
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className={`w-4 h-4 ${status.type === 'PRESENT' ? 'text-cyan-500' : 'text-slate-400'}`} />
            {lineName}
          </div>
          <Badge className={`${status.color} border text-[9px] font-black uppercase py-0 px-2`}>{status.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {assignment ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.inspectorName)}&background=rose&color=fff&size=64`}
                  alt="Inspector Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Active Audit</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{assignment.inspectorName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Method</span>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                  {assignment.method === 'QR_SCAN' ? <QrCode className="w-2 h-2" /> : <UserCheck className="w-2 h-2" />}
                  {assignment.method}
                </div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Latency</span>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{timeSinceScan || 'Live'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center justify-center gap-2 text-slate-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-none">{t('qc.checkin.noInspector')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
