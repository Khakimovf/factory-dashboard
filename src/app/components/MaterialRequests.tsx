import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Package, Clock, CheckCircle, Truck, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type RequestStatus = 'new' | 'accepted' | 'sent';

interface MaterialRequest {
  id: string;
  productionLineName: string;
  materialName: string;
  materialId: string;
  quantity: number;
  unit: string;
  requestDate: string;
  status: RequestStatus;
}

export function MaterialRequests() {
  const { t } = useLanguage();

  // Mock data - local state only
  const [requests, setRequests] = useState<MaterialRequest[]>([
    {
      id: '1',
      productionLineName: 'Assembly Line A',
      materialName: 'Steel Sheets',
      materialId: '1',
      quantity: 50,
      unit: 'kg',
      requestDate: '2025-01-15T10:30:00',
      status: 'new',
    },
    {
      id: '2',
      productionLineName: 'Assembly Line B',
      materialName: 'Aluminum Rods',
      materialId: '2',
      quantity: 30,
      unit: 'kg',
      requestDate: '2025-01-15T09:15:00',
      status: 'accepted',
    },
    {
      id: '3',
      productionLineName: 'Assembly Line A',
      materialName: 'Circuit Boards',
      materialId: '3',
      quantity: 20,
      unit: 'units',
      requestDate: '2025-01-14T16:45:00',
      status: 'sent',
    },
    {
      id: '4',
      productionLineName: 'Assembly Line C',
      materialName: 'Screws & Bolts',
      materialId: '4',
      quantity: 500,
      unit: 'units',
      requestDate: '2025-01-15T11:20:00',
      status: 'new',
    },
    {
      id: '5',
      productionLineName: 'Assembly Line B',
      materialName: 'Plastic Casings',
      materialId: '5',
      quantity: 15,
      unit: 'units',
      requestDate: '2025-01-15T08:00:00',
      status: 'accepted',
    },
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'new':
        return (
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            {t('warehouse.requests.statusNew')}
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
            {t('warehouse.requests.statusAccepted')}
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            {t('warehouse.requests.statusSent')}
          </Badge>
        );
    }
  };

  const handleAccept = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'accepted' } : req
    ));
    toast.success(t('warehouse.requests.acceptedSuccess'));
  };

  const handleMarkAsSent = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'sent' } : req
    ));
    toast.success(t('warehouse.requests.sentSuccess'));
  };

  const newCount = requests.filter(r => r.status === 'new').length;
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const sentCount = requests.filter(r => r.status === 'sent').length;

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/warehouse"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('warehouse.backToWarehouse')}
          </Link>
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">
          {t('warehouse.requests.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('warehouse.requests.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                {t('warehouse.requests.statusNew')}
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {newCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                {t('warehouse.requests.statusAccepted')}
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {acceptedCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                {t('warehouse.requests.statusSent')}
              </p>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                {sentCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.productionLine')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.material')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.materialId')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.quantity')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.requestDate')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.status')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-900 dark:text-white">
                  {t('warehouse.requests.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t('warehouse.requests.noRequests')}
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {request.productionLineName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {request.materialName}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {request.materialId}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        {request.quantity} {request.unit}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(request.requestDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {request.status === 'new' && (
                          <Button
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            className="h-7 text-xs"
                          >
                            {t('warehouse.requests.accept')}
                          </Button>
                        )}
                        {request.status === 'accepted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsSent(request.id)}
                            className="h-7 text-xs"
                          >
                            {t('warehouse.requests.markAsSent')}
                          </Button>
                        )}
                        {request.status === 'sent' && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {t('warehouse.requests.completed')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}




