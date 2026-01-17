import { X, Package, CheckCircle, Clock } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '../ui/drawer';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../context/LanguageContext';

export interface LineBufferItem {
  id: string;
  productName: string;
  quantity: number;
  qcStatus: 'PASSED';
  lastUpdated: string;
}

interface LineBufferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lineId: string;
  lineName: string;
}

const mockBufferItems: LineBufferItem[] = [
  {
    id: '1',
    productName: 'Door Trim ALL',
    quantity: 45,
    qcStatus: 'PASSED',
    lastUpdated: '2025-01-15T10:30:00',
  },
  {
    id: '2',
    productName: 'Dashboard Panel',
    quantity: 32,
    qcStatus: 'PASSED',
    lastUpdated: '2025-01-15T09:15:00',
  },
  {
    id: '3',
    productName: 'Side Panel',
    quantity: 28,
    qcStatus: 'PASSED',
    lastUpdated: '2025-01-15T08:45:00',
  },
];

export function LineBufferDrawer({ isOpen, onClose, lineId, lineName }: LineBufferDrawerProps) {
  const { t } = useLanguage();
  
  // Filter buffer items for current line (in production, this would come from API)
  const bufferItems = mockBufferItems;

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="w-full sm:w-[480px]">
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>{t('productionDetail.lineBuffer.title')}</DrawerTitle>
              <DrawerDescription>
                {lineName}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {bufferItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {t('productionDetail.lineBuffer.empty')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('productionDetail.lineBuffer.emptyDescription')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bufferItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {item.productName}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('productionDetail.lineBuffer.qcPassed')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('productionDetail.lineBuffer.quantity')}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('productionDetail.lineBuffer.lastUpdated')}
                      </p>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(item.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
