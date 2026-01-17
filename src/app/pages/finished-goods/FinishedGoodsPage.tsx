import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { 
  Package, 
  Search, 
  MapPin, 
  Download, 
  FileSpreadsheet, 
  Factory, 
  Calendar, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export function FinishedGoodsPage() {
  const { t } = useLanguage();
  const { finishedGoods } = useWarehouse();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedSourceLine, setSelectedSourceLine] = useState<string>('all');
  const [selectedQCStatus, setSelectedQCStatus] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalProducts = finishedGoods.length;
    const totalQuantity = finishedGoods.reduce((sum, item) => sum + item.totalQuantity, 0);
    const availableQuantity = finishedGoods.reduce((sum, item) => sum + item.availableQuantity, 0);
    const reservedQuantity = finishedGoods.reduce((sum, item) => sum + item.reservedQuantity, 0);
    return { totalProducts, totalQuantity, availableQuantity, reservedQuantity };
  }, [finishedGoods]);

  // Extract filter options
  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    finishedGoods.forEach(fg => {
      fg.warehouseLocations.forEach(loc => locations.add(loc));
    });
    return Array.from(locations).sort();
  }, [finishedGoods]);

  const allSourceLines = useMemo(() => {
    const lines = new Set<string>();
    finishedGoods.forEach(fg => {
      fg.sourceLines.forEach(line => lines.add(line));
    });
    return Array.from(lines).sort();
  }, [finishedGoods]);

  // Filter products
  const filteredGoods = useMemo(() => {
    return finishedGoods.filter(item => {
      const matchesSearch =
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation =
        selectedLocation === 'all' ||
        item.warehouseLocations.includes(selectedLocation);
      
      const matchesAvailability =
        selectedAvailability === 'all' ||
        (selectedAvailability === 'available' && item.availableQuantity > 0) ||
        (selectedAvailability === 'reserved' && item.reservedQuantity > 0);

      const matchesSourceLine =
        selectedSourceLine === 'all' ||
        item.sourceLines.includes(selectedSourceLine);

      // QC status filter - check if all batches have PASSED QC
      const matchesQCStatus =
        selectedQCStatus === 'all' ||
        (selectedQCStatus === 'passed' && item.batches.length > 0 && 
         item.batches.every(batch => batch.qcDate)); // All batches have QC date (passed)

      return matchesSearch && matchesLocation && matchesAvailability && matchesSourceLine && matchesQCStatus;
    });
  }, [finishedGoods, searchTerm, selectedLocation, selectedAvailability, selectedSourceLine, selectedQCStatus]);

  // Sort batches by date (FIFO - older first)
  const sortBatchesByDate = (batches: typeof finishedGoods[0]['batches']) => {
    return [...batches].sort((a, b) => {
      const dateA = new Date(a.receivedAt).getTime();
      const dateB = new Date(b.receivedAt).getTime();
      return dateA - dateB;
    });
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleExportPDF = () => {
    toast.info(t('finishedGoods.exportPDFPlaceholder') || 'PDF export will be implemented');
  };

  const handleExportExcel = () => {
    toast.info(t('finishedGoods.exportExcelPlaceholder') || 'Excel export will be implemented');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      AVAILABLE_FOR_SALE: 'text-[var(--success-foreground)]',
      RESERVED: 'text-[var(--warning-foreground)]',
      SHIPPED: 'text-[var(--info-foreground)]',
    };
    const bgVariants: Record<string, string> = {
      AVAILABLE_FOR_SALE: 'bg-[var(--success-bg)]',
      RESERVED: 'bg-[var(--warning-bg)]',
      SHIPPED: 'bg-[var(--info-bg)]',
    };
    const className = variants[status] || variants.AVAILABLE_FOR_SALE;
    const bgClassName = bgVariants[status] || bgVariants.AVAILABLE_FOR_SALE;
    return `${bgClassName} ${className}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              {t('finishedGoods.title') || 'Tayyor mahsulotlar ombori'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t('finishedGoods.subtitle') || 'Tayyor mahsulotlarning ombordagi holati va zaxirasi'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              {t('finishedGoods.exportPDF') || 'PDF'}
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {t('finishedGoods.exportExcel') || 'Excel'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('finishedGoods.summary.totalProducts') || 'Jami mahsulotlar'}
              </CardTitle>
            </div>
            <p className="text-5xl font-bold text-foreground">
              {summary.totalProducts}
            </p>
          </Card>
          <Card className="bg-card border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-primary" />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('finishedGoods.summary.totalQuantity') || 'Jami miqdor'}
              </CardTitle>
            </div>
            <p className="text-5xl font-bold text-foreground">
              {summary.totalQuantity}
            </p>
          </Card>
          <Card className="bg-card border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6" style={{ color: 'var(--success)' }} />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('finishedGoods.summary.availableQuantity') || 'Mavjud miqdor'}
              </CardTitle>
            </div>
            <p className="text-5xl font-bold" style={{ color: 'var(--success)' }}>
              {summary.availableQuantity}
            </p>
          </Card>
          <Card className="bg-card border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6" style={{ color: 'var(--warning)' }} />
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('finishedGoods.summary.reservedQuantity') || 'Zaxiralangan'}
              </CardTitle>
            </div>
            <p className="text-5xl font-bold" style={{ color: 'var(--warning)' }}>
              {summary.reservedQuantity}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-card border-border rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-nowrap">
              <div className="flex-1 relative min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('finishedGoods.search') || 'SKU yoki nom bo\'yicha qidirish'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-background border-border text-foreground"
                />
              </div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-52 h-10 bg-background border-border text-foreground">
                  <SelectValue placeholder={t('finishedGoods.filterByLocation') || 'Ombor joylashuvi'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('finishedGoods.allLocations') || 'Barcha joylar'}</SelectItem>
                  {allLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger className="w-52 h-10 bg-background border-border text-foreground">
                  <SelectValue placeholder={t('finishedGoods.filterByAvailability') || 'Mavjudlik'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('finishedGoods.allAvailability') || 'Hammasi'}</SelectItem>
                  <SelectItem value="available">{t('finishedGoods.available') || 'Mavjud'}</SelectItem>
                  <SelectItem value="reserved">{t('finishedGoods.reserved') || 'Zaxiralangan'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSourceLine} onValueChange={setSelectedSourceLine}>
                <SelectTrigger className="w-52 h-10 bg-background border-border text-foreground">
                  <SelectValue placeholder="Ishlab chiqarish liniyasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha liniyalar</SelectItem>
                  {allSourceLines.map(line => (
                    <SelectItem key={line} value={line}>{line}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedQCStatus} onValueChange={setSelectedQCStatus}>
                <SelectTrigger className="w-52 h-10 bg-background border-border text-foreground">
                  <SelectValue placeholder="QC holati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hammasi</SelectItem>
                  <SelectItem value="passed">QC O'tgan</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || selectedLocation !== 'all' || selectedAvailability !== 'all' || 
                selectedSourceLine !== 'all' || selectedQCStatus !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLocation('all');
                    setSelectedAvailability('all');
                    setSelectedSourceLine('all');
                    setSelectedQCStatus('all');
                  }}
                  className="h-10 bg-background border-border text-foreground"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Tozalash
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredGoods.length === 0 ? (
          <Card className="bg-card border-border rounded-xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t('finishedGoods.noProducts') || 'Mahsulotlar topilmadi'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoods.map(item => {
              const sortedBatches = sortBatchesByDate(item.batches);
              const isExpanded = expandedProducts.has(item.id);
              const reservedBatches = sortedBatches.filter(b => {
                // Simple logic: if batch has reserved quantity, it's reserved
                // In real system, this would come from batch-level reservation data
                return false; // Placeholder - batches don't have reserved quantity yet
              });

              return (
                <Card
                  key={item.id}
                  className="bg-card border-border rounded-xl hover:shadow-lg transition-shadow w-full h-auto flex flex-col"
                >
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-foreground mb-2 leading-tight">
                          {item.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                      <Badge className={`${getStatusBadge(item.status)} shrink-0 px-3 py-1 text-xs font-medium`}>
                        {t(`finishedGoods.${item.status.toLowerCase()}`) || item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-5 flex-1 flex flex-col">
                    {/* Priority Quantities - Most Important First */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                            {t('finishedGoods.available') || 'Mavjud'}
                          </p>
                          <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                            {item.availableQuantity}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                            {t('finishedGoods.reserved') || 'Zaxira'}
                          </p>
                          <p className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
                            {item.reservedQuantity}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            {t('finishedGoods.total') || 'Jami'}
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            {item.totalQuantity}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Info - Location, Lines, Batches */}
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Ombor joylari</p>
                          <p className="text-sm text-foreground font-medium leading-relaxed">
                            {item.warehouseLocations.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Factory className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Ishlab chiqarish liniyalari</p>
                          <p className="text-sm text-foreground font-medium leading-relaxed">
                            {item.sourceLines.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">Partiyalar soni</p>
                          <p className="text-sm text-foreground font-medium">
                            {item.batches.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Batches Section */}
                    {sortedBatches.length > 0 && (
                      <div className="border-t border-border pt-3 mt-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleProductExpansion(item.id)}
                          className="w-full justify-between text-foreground hover:bg-muted"
                        >
                          <span className="text-sm font-medium">
                            Partiya tafsilotlari ({sortedBatches.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        {isExpanded && (
                          <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
                            {sortedBatches.map((batch, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-muted/50 border border-border"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground font-mono">
                                      {batch.batch}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Miqdor: <span className="font-medium text-foreground">{batch.quantity}</span>
                                    </p>
                                  </div>
                                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--success)' }} />
                                </div>
                                <div className="space-y-1 mt-2 pt-2 border-t border-border">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Factory className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Liniya:</span>
                                    <span className="text-foreground">{batch.sourceLine}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Joylashuv:</span>
                                    <span className="text-foreground font-medium">{batch.warehouseLocation}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">QC sana:</span>
                                    <span className="text-foreground">
                                      {new Date(batch.qcDate).toLocaleDateString('uz-UZ')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">Qabul qilindi:</span>
                                    <span className="text-foreground">
                                      {formatDate(batch.receivedAt)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">Operator:</span>
                                    <span className="text-foreground">{batch.receivedBy}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
