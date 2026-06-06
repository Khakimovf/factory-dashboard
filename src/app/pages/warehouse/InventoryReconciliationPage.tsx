import InventoryReconciliationTab from '../../components/warehouse/tabs/InventoryReconciliationTab';
import { useLanguage } from '../../context/LanguageContext';
import { Package } from 'lucide-react';

export function InventoryReconciliationPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-full p-8 bg-background text-foreground overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
                        <Package className="w-8 h-8 text-primary" />
                        {t('sidebar.inventoryReconciliation')}
                    </h1>
                    <p className="text-gray-400 mt-1 uppercase text-xs font-bold tracking-widest opacity-60">
                        Stock mass-balance analytical engine & reconciliation system
                    </p>
                </div>

                <InventoryReconciliationTab />
            </div>
        </div>
    );
}
