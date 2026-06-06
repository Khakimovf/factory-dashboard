import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Module IDs that can be locked ─────────────────────────────────────────────
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
    const [lockedModules, setLockedModules] = useState<Record<ModuleId, boolean>>({
        warehouse: false,
        gate: false,
        finance: false,
    });

    const [activeBroadcast, setActiveBroadcast] = useState<ActiveBroadcast | null>(null);

    const toggleModule = useCallback((id: ModuleId) => {
        setLockedModules(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

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
