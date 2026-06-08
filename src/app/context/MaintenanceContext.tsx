import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useMaintenanceStore } from '../store/maintenanceStore';

// ── Module IDs that can be locked (Legacy support) ───────────────────────────
export type ModuleId = 'warehouse' | 'gate' | 'finance';

export interface ModuleDefinition {
    id: ModuleId;
    label: string;
    subLabel: string;
    pathPrefix: string;
    color: string;
}

export const LOCKABLE_MODULES: ModuleDefinition[] = [
    {
        id: 'warehouse',
        label: 'Warehouse Module',
        subLabel: 'Ombor',
        pathPrefix: '/warehouse',
        color: 'blue',
    },
    {
        id: 'gate',
        label: 'Gate Logistics Terminal',
        subLabel: 'Post-1',
        pathPrefix: '/logistics-gate',
        color: 'amber',
    },
    {
        id: 'finance',
        label: 'Finance Control System',
        subLabel: 'Moliya FI/CO',
        pathPrefix: '/finance',
        color: 'violet',
    },
];

// ── Broadcast Alert types ──────────────────────────────────────────────────────
export type BroadcastSeverity = 'info' | 'critical';

export interface ActiveBroadcast {
    id: string;
    message: string;
    severity: BroadcastSeverity;
    targets: string[];
    sentAt: Date;
}

// ── Context shape ──────────────────────────────────────────────────────────────
interface MaintenanceContextType {
    lockedModules: Record<ModuleId, boolean>;
    toggleModule: (id: ModuleId) => void;
    activeBroadcast: ActiveBroadcast | null;
    sendBroadcast: (broadcast: Omit<ActiveBroadcast, 'id' | 'sentAt'>) => void;
    dismissBroadcast: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const storeModules = useMaintenanceStore((state) => state.modules);
    const toggleParent = useMaintenanceStore((state) => state.toggleParent);
    const toggleSubRoute = useMaintenanceStore((state) => state.toggleSubRoute);

    const [activeBroadcast, setActiveBroadcast] = useState<ActiveBroadcast | null>(null);

    // Maintain backwards compatibility mapping
    const lockedModules = useMemo(() => {
        const warehouseLogistics = storeModules.find(m => m.id === 'warehouse_logistics');
        const financeCo = storeModules.find(m => m.id === 'finance_co');

        const isWarehouseLocked = !warehouseLogistics?.enabled || 
            !warehouseLogistics?.subRoutes.find(r => r.id === 'OMBOR_RAW_INVENTORY_MASTER')?.enabled;

        const isGateLocked = !warehouseLogistics?.enabled || 
            !warehouseLogistics?.subRoutes.find(r => r.id === 'CONTAINER_PORT')?.enabled;

        const isFinanceLocked = !financeCo?.enabled || 
            !financeCo?.subRoutes.find(r => r.id === 'GENERAL_LEDGER')?.enabled;

        return {
            warehouse: isWarehouseLocked,
            gate: isGateLocked,
            finance: isFinanceLocked
        };
    }, [storeModules]);

    const toggleModule = useCallback((id: ModuleId) => {
        if (id === 'warehouse') {
            toggleParent('warehouse_logistics');
        } else if (id === 'gate') {
            // Toggle container port sub-route
            toggleSubRoute('warehouse_logistics', 'CONTAINER_PORT');
        } else if (id === 'finance') {
            toggleParent('finance_co');
        }
    }, [toggleParent, toggleSubRoute]);

    const sendBroadcast = useCallback((broadcast: Omit<ActiveBroadcast, 'id' | 'sentAt'>) => {
        setActiveBroadcast({
            ...broadcast,
            id: `broadcast-${Date.now()}`,
            sentAt: new Date(),
        });
    }, []);

    const dismissBroadcast = useCallback(() => {
        setActiveBroadcast(null);
    }, []);

    return (
        <MaintenanceContext.Provider
            value={{ lockedModules, toggleModule, activeBroadcast, sendBroadcast, dismissBroadcast }}
        >
            {children}
        </MaintenanceContext.Provider>
    );
};

export const useMaintenance = () => {
    const ctx = useContext(MaintenanceContext);
    if (!ctx) throw new Error('useMaintenance must be used within MaintenanceProvider');
    return ctx;
};

