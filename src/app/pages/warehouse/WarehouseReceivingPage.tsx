import { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { QrCode, CheckCircle, X, Search, MapPin, Package, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { TransferDocument } from '../../types/transferDocument';

export function WarehouseReceivingPage() {
  const { t } = useLanguage();
  const { getTransferByQR, acceptTransfer, rejectTransfer } = useWarehouse();
  const { productionLines } = useFactory();
  const [scanInput, setScanInput] = useState('');
  const [currentTransfer, setCurrentTransfer] = useState<TransferDocument | null>(null);
  const [warehouseLocations, setWarehouseLocations] = useState<Record<string, string>>({});
  const [rejectReason, setRejectReason] = useState('');
  const [receivedBy] = useState('Warehouse Operator'); // In production, get from auth context

  const handleScan = () => {
    if (!scanInput.trim()) {
      toast.error(t('warehouse.receiving.scanRequired'));
      return;
    }

    const transfer = getTransferByQR(scanInput.trim());
    if (!transfer) {
      toast.error(t('warehouse.receiving.transferNotFound'));
      return;
    }

    if (transfer.status !== 'PENDING_RECEIVING') {
      toast.error(t('warehouse.receiving.invalidStatus'));
      return;
    }

    setCurrentTransfer(transfer);
    // Initialize locations for each product
    const initialLocations: Record<string, string> = {};
    transfer.productItems.forEach(item => {
      initialLocations[item.sku] = '';
    });
    setWarehouseLocations(initialLocations);
  };

  const handleAccept = () => {
    if (!currentTransfer) return;

    // Validate all locations are assigned
    const missingLocations = currentTransfer.productItems.filter(
      item => !warehouseLocations[item.sku] || warehouseLocations[item.sku].trim() === ''
    );

    if (missingLocations.length > 0) {
      toast.error(t('warehouse.receiving.locationsRequired'));
      return;
    }

    // Validate QC status
    const failedQC = currentTransfer.productItems.find(item => item.qcStatus !== 'PASSED');
    if (failedQC) {
      toast.error(t('warehouse.receiving.qcFailed'));
      return;
    }

    acceptTransfer(currentTransfer.id, receivedBy, warehouseLocations);
    toast.success(t('warehouse.receiving.accepted'));
    setCurrentTransfer(null);
    setScanInput('');
    setWarehouseLocations({});
  };

  const handleReject = () => {
    if (!currentTransfer) return;
    if (!rejectReason.trim()) {
      toast.error(t('warehouse.receiving.rejectReasonRequired'));
      return;
    }

    rejectTransfer(currentTransfer.id, receivedBy, rejectReason);
    toast.success(t('warehouse.receiving.rejected'));
    setCurrentTransfer(null);
    setScanInput('');
    setRejectReason('');
  };

  const canAccept = currentTransfer?.productItems.every(item => item.qcStatus === 'PASSED') && 
    Object.values(warehouseLocations).every(loc => loc.trim() !== '');

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            {t('warehouse.receiving.title')}
          </h1>
          <p className="text-gray-400 mt-1">{t('warehouse.receiving.subtitle')}</p>
        </div>

        {/* QR Scan Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {t('warehouse.receiving.scanQR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder={t('warehouse.receiving.scanPlaceholder')}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                className="flex-1"
              />
              <Button onClick={handleScan}>
                <Search className="w-4 h-4 mr-2" />
                {t('warehouse.receiving.load')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Document Details */}
        {currentTransfer && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('warehouse.receiving.transferDetails')}</CardTitle>
                <Badge className={
                  currentTransfer.status === 'PENDING_RECEIVING'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }>
                  {currentTransfer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Transfer Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">
                    {t('warehouse.receiving.transferId')}
                  </Label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentTransfer.id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">
                    {t('warehouse.receiving.sourceLine')}
                  </Label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentTransfer.sourceLineName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">
                    {t('warehouse.receiving.createdAt')}
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(currentTransfer.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500 dark:text-gray-400">
                    {t('warehouse.receiving.createdBy')}
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentTransfer.createdBy}
                  </p>
                </div>
              </div>

              {/* Products List */}
              <div>
                <Label className="text-lg font-semibold mb-4 block">
                  {t('warehouse.receiving.products')}
                </Label>
                <div className="space-y-4">
                  {currentTransfer.productItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        item.qcStatus === 'PASSED'
                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                          : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {item.productName}
                            </h4>
                            <Badge className={
                              item.qcStatus === 'PASSED'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {item.qcStatus === 'PASSED' ? t('warehouse.receiving.qcPassed') : t('warehouse.receiving.qcFailed')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.sku}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">{t('warehouse.receiving.quantity')}:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">{t('warehouse.receiving.batch')}:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">{item.batch}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Warehouse Location Selection */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Label className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4" />
                          {t('warehouse.receiving.warehouseLocation')} *
                        </Label>
                        <Input
                          placeholder="A-1, B-2, C-3..."
                          value={warehouseLocations[item.sku] || ''}
                          onChange={(e) =>
                            setWarehouseLocations(prev => ({
                              ...prev,
                              [item.sku]: e.target.value,
                            }))
                          }
                          className="max-w-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleAccept}
                  disabled={!canAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('warehouse.receiving.acceptTransfer')}
                </Button>
                <Button
                  onClick={() => {
                    setRejectReason('');
                    const dialog = document.getElementById('reject-dialog') as HTMLDialogElement;
                    dialog?.showModal();
                  }}
                  variant="destructive"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('warehouse.receiving.rejectTransfer')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reject Dialog */}
        <dialog id="reject-dialog" className="rounded-lg p-0 backdrop:bg-black/50">
          <div className="bg-[#0B1220] border border-gray-700 rounded-lg p-6 max-w-md text-gray-100">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              {t('warehouse.receiving.rejectTransfer')}
            </h3>
            <div className="mb-4">
              <Label>{t('warehouse.receiving.rejectReason')} *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('warehouse.receiving.rejectReasonPlaceholder')}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const dialog = document.getElementById('reject-dialog') as HTMLDialogElement;
                  dialog?.close();
                }}
                className="flex-1"
              >
                {t('warehouse.receiving.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (rejectReason.trim()) {
                    handleReject();
                    const dialog = document.getElementById('reject-dialog') as HTMLDialogElement;
                    dialog?.close();
                  }
                }}
                className="flex-1"
              >
                {t('warehouse.receiving.confirmReject')}
              </Button>
            </div>
          </div>
        </dialog>
      </div>
    </div>
  );
}
