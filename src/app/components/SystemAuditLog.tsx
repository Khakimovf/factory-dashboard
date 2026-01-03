import { useState, useMemo } from 'react';
import { useAuditLog } from '../context/AuditLogContext';
import { useLanguage } from '../context/LanguageContext';
import { isSystemOwner } from '../utils/roleUtils';
import { AuditLogModule, AuditLogAction, AuditLogResult } from '../context/AuditLogContext';
import { FileText, Search, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';

export function SystemAuditLog() {
  const { auditLogs } = useAuditLog();
  const { t } = useLanguage();
  const [dateFilter, setDateFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  // Check if user has access
  if (!isSystemOwner()) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('auditLog.accessDenied')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique values for filters
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(auditLogs.map(log => log.role)));
  }, [auditLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Date filter
      if (dateFilter) {
        const logDate = new Date(log.dateTime).toDateString();
        const filterDate = new Date(dateFilter).toDateString();
        if (logDate !== filterDate) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && log.role !== roleFilter) return false;

      // Module filter
      if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;

      // Result filter
      if (resultFilter !== 'all' && log.result !== resultFilter) return false;

      return true;
    });
  }, [auditLogs, dateFilter, roleFilter, moduleFilter, actionFilter, resultFilter]);

  const clearFilters = () => {
    setDateFilter('');
    setRoleFilter('all');
    setModuleFilter('all');
    setActionFilter('all');
    setResultFilter('all');
  };

  const hasActiveFilters = dateFilter || roleFilter !== 'all' || moduleFilter !== 'all' || actionFilter !== 'all' || resultFilter !== 'all';

  const getResultBadgeVariant = (result: AuditLogResult) => {
    return result === 'Success' ? 'default' : 'destructive';
  };

  const formatAction = (action: AuditLogAction): string => {
    const actionMap: Record<AuditLogAction, string> = {
      created: t('auditLog.action.created'),
      updated: t('auditLog.action.updated'),
      deleted: t('auditLog.action.deleted'),
      assigned: t('auditLog.action.assigned'),
      approved: t('auditLog.action.approved'),
      rejected: t('auditLog.action.rejected'),
      uploaded: t('auditLog.action.uploaded'),
      fixed: t('auditLog.action.fixed'),
      status_changed: t('auditLog.action.status_changed'),
    };
    return actionMap[action] || action;
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-gray-700 dark:text-gray-300" />
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
              {t('auditLog.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('auditLog.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t('auditLog.filters')}
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-600 dark:text-gray-400"
              >
                <X className="w-4 h-4 mr-2" />
                {t('auditLog.clearFilters')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auditLog.filter.date')}
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auditLog.filter.role')}
              </label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.filter.all')}</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auditLog.filter.module')}
              </label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.filter.all')}</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Warehouse">{t('auditLog.module.warehouse')}</SelectItem>
                  <SelectItem value="Production">{t('auditLog.module.production')}</SelectItem>
                  <SelectItem value="Maintenance">{t('auditLog.module.maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auditLog.filter.action')}
              </label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.filter.all')}</SelectItem>
                  <SelectItem value="created">{t('auditLog.action.created')}</SelectItem>
                  <SelectItem value="updated">{t('auditLog.action.updated')}</SelectItem>
                  <SelectItem value="deleted">{t('auditLog.action.deleted')}</SelectItem>
                  <SelectItem value="assigned">{t('auditLog.action.assigned')}</SelectItem>
                  <SelectItem value="approved">{t('auditLog.action.approved')}</SelectItem>
                  <SelectItem value="rejected">{t('auditLog.action.rejected')}</SelectItem>
                  <SelectItem value="uploaded">{t('auditLog.action.uploaded')}</SelectItem>
                  <SelectItem value="fixed">{t('auditLog.action.fixed')}</SelectItem>
                  <SelectItem value="status_changed">{t('auditLog.action.status_changed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Result Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auditLog.filter.result')}
              </label>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('auditLog.filter.all')}</SelectItem>
                  <SelectItem value="Success">{t('auditLog.result.success')}</SelectItem>
                  <SelectItem value="Failed">{t('auditLog.result.failed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('auditLog.entries')} ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('auditLog.noEntries')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('auditLog.column.dateTime')}</TableHead>
                    <TableHead>{t('auditLog.column.user')}</TableHead>
                    <TableHead>{t('auditLog.column.role')}</TableHead>
                    <TableHead>{t('auditLog.column.module')}</TableHead>
                    <TableHead>{t('auditLog.column.action')}</TableHead>
                    <TableHead>{t('auditLog.column.target')}</TableHead>
                    <TableHead>{t('auditLog.column.result')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.dateTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.role}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.module}</Badge>
                      </TableCell>
                      <TableCell>{formatAction(log.action)}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.target}</TableCell>
                      <TableCell>
                        <Badge variant={getResultBadgeVariant(log.result)}>
                          {log.result === 'Success' 
                            ? t('auditLog.result.success') 
                            : t('auditLog.result.failed')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

