import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Download, FileSpreadsheet, Search, Package, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { toast } from 'sonner';

export interface LineBufferItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  qcStatus: 'PASSED';
  lastUpdated: string;
  responsible: string;
  lineId: string;
}

// Mock data - in production, fetch from API filtered by lineId
const generateMockBufferItems = (lineId: string): LineBufferItem[] => {
  const products = [
    { name: 'Door Trim ALL', sku: 'DT-ALL-001' },
    { name: 'Dashboard Panel', sku: 'DP-PNL-002' },
    { name: 'Side Panel', sku: 'SP-PNL-003' },
    { name: 'Rear Bumper', sku: 'RB-BMP-004' },
    { name: 'Front Grille', sku: 'FG-GRL-005' },
  ];

  const inspectors = ['Karimov Alisher', 'Toshmatov Bahodir', 'Rahimov Shavkat'];

  return products.map((product, index) => ({
    id: `buffer-${lineId}-${index + 1}`,
    productName: product.name,
    sku: product.sku,
    quantity: Math.floor(Math.random() * 50) + 10,
    qcStatus: 'PASSED' as const,
    lastUpdated: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    responsible: inspectors[Math.floor(Math.random() * inspectors.length)],
    lineId,
  }));
};

export function LineBufferPage() {
  const { lineId } = useParams<{ lineId: string }>();
  const lineIdParam = lineId || '';
  const navigate = useNavigate();
  const { productionLines } = useFactory();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'quantity' | 'time' | 'name'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const line = productionLines.find(l => l.id === lineIdParam);
  const bufferItems = useMemo(() => {
    if (!lineIdParam) return [];
    return generateMockBufferItems(lineIdParam);
  }, [lineIdParam]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered = bufferItems.filter(item =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'quantity') {
        comparison = a.quantity - b.quantity;
      } else if (sortBy === 'time') {
        comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      } else {
        comparison = a.productName.localeCompare(b.productName);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [bufferItems, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const summary = useMemo(() => {
    return {
      totalPositions: bufferItems.length,
      totalQuantity: bufferItems.reduce((sum, item) => sum + item.quantity, 0),
      lastUpdate: bufferItems.length > 0
        ? bufferItems.reduce((latest, item) => {
            return new Date(item.lastUpdated) > new Date(latest) ? item.lastUpdated : latest;
          }, bufferItems[0].lastUpdated)
        : null,
      qcStatus: bufferItems.every(item => item.qcStatus === 'PASSED') ? 'PASSED' : 'MIXED',
    };
  }, [bufferItems]);

  const handleExportPDF = () => {
    toast.info(t('productionDetail.lineBuffer.exportPDFPlaceholder'));
    // PDF export implementation would go here
  };

  const handleExportExcel = () => {
    toast.info(t('productionDetail.lineBuffer.exportExcelPlaceholder'));
    // Excel export implementation would go here
  };

  const handleSort = (field: 'quantity' | 'time' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (!line) {
    return (
      <div className="min-h-screen p-8 bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('productionDetail.lineNotFound') || 'Production line not found'}
          </h2>
          <button
            onClick={() => navigate('/production-lines')}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            {t('productionDetail.backToLines')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background text-foreground">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              {t('productionDetail.lineBuffer.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {line.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              {t('productionDetail.lineBuffer.exportPDF')}
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {t('productionDetail.lineBuffer.exportExcel')}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/production-lines/${lineIdParam}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('productionDetail.lineBuffer.backToLine')}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.totalPositions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalPositions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.totalQuantity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {summary.totalQuantity}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('productionDetail.lineBuffer.units')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.lastUpdate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.lastUpdate ? (
              <>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(summary.lastUpdate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(summary.lastUpdate).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('productionDetail.lineBuffer.summary.qcStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('productionDetail.lineBuffer.qcPassed')}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('productionDetail.lineBuffer.search')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('productionDetail.lineBuffer.sortBy')}:
              </span>
              <Button
                variant={sortBy === 'quantity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('quantity')}
              >
                {t('productionDetail.lineBuffer.sortQuantity')}
              </Button>
              <Button
                variant={sortBy === 'time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('time')}
              >
                {t('productionDetail.lineBuffer.sortTime')}
              </Button>
              <Button
                variant={sortBy === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('name')}
              >
                {t('productionDetail.lineBuffer.sortName')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('productionDetail.lineBuffer.tableTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    {t('productionDetail.lineBuffer.table.productName')}
                  </TableHead>
                  <TableHead className="w-[150px]">
                    {t('productionDetail.lineBuffer.table.sku')}
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    {t('productionDetail.lineBuffer.table.quantity')}
                  </TableHead>
                  <TableHead className="w-[120px]">
                    {t('productionDetail.lineBuffer.table.qcStatus')}
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {t('productionDetail.lineBuffer.table.lastUpdated')}
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {t('productionDetail.lineBuffer.table.responsible')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? t('productionDetail.lineBuffer.noResults') : t('productionDetail.lineBuffer.empty')}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                        {item.quantity}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('productionDetail.lineBuffer.qcPassed')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.lastUpdated).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.responsible}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('productionDetail.lineBuffer.showing')} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedItems.length)} {t('productionDetail.lineBuffer.of')} {filteredAndSortedItems.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  {t('productionDetail.lineBuffer.previous')}
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('productionDetail.lineBuffer.page')} {currentPage} {t('productionDetail.lineBuffer.of')} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('productionDetail.lineBuffer.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
