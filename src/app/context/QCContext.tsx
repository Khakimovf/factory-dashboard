import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export type QCInspectionType = 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'BIN_AUDIT';
export type QCSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type QCDecision = 'ACCEPT' | 'REWORK' | 'SCRAP' | 'HOLD';

export type QCDefectCategory =
    | 'Cosmetic'
    | 'Functional'
    | 'Structural'
    | 'Missing Part'
    | 'Paint'
    | 'Other';


export interface QCInspection {
    id: string;
    lineId: string;
    lineName: string;
    date: string;
    inspector: string;
    defectTypes: { type: string; count: number }[];
    totalDefects: number;
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
    inspectionType: QCInspectionType;
    severity: QCSeverity;
    category: QCDefectCategory;
    decision?: QCDecision;
    lineStatus: 'RUNNING' | 'HOLD';
    managerApproved?: boolean;
    samplingList?: number[]; // For BIN_AUDIT random units
    defectiveUnits?: number[]; // Unit numbers confirmed as defective
    defectCode?: string; // Technical code e.g. QC-101
    markupPoints?: { x: number; y: number }[]; // Photo markup coordinates
}

export const initialInspections: QCInspection[] = [
    {
        id: '1',
        lineId: '1',
        lineName: 'Assembly Line A',
        date: '2025-01-15',
        inspector: 'Karimov Alisher',
        defectTypes: [
            { type: 'Scratches', count: 3 },
            { type: 'Missing Part', count: 1 },
        ],
        totalDefects: 4,
        status: 'pending',
        inspectionType: 'IN_PROCESS',
        severity: 'MAJOR',
        category: 'Missing Part',
        lineStatus: 'RUNNING',
    },
    {
        id: '2',
        lineId: '2',
        lineName: 'Assembly Line B',
        date: '2025-01-15',
        inspector: 'Toshmatov Bahodir',
        defectTypes: [
            { type: 'Paint Defect', count: 2 },
        ],
        totalDefects: 2,
        status: 'approved',
        inspectionType: 'FINAL',
        severity: 'MINOR',
        category: 'Paint',
        lineStatus: 'RUNNING',
    },
    {
        id: '3',
        lineId: '3',
        lineName: 'Assembly Line D',
        date: '2025-01-14',
        inspector: 'Karimov Alisher',
        defectTypes: [
            { type: 'Structural Issue', count: 5 },
        ],
        totalDefects: 5,
        status: 'rejected',
        inspectionType: 'FINAL',
        severity: 'CRITICAL',
        category: 'Structural',
        lineStatus: 'HOLD',
    },
];

interface QCContextType {
    inspections: QCInspection[];
    addInspection: (inspection: QCInspection) => void;
    updateInspection: (id: string, updates: Partial<QCInspection>) => void;
}

const QCContext = createContext<QCContextType | undefined>(undefined);

export function QCProvider({ children }: { children: ReactNode }) {
    const [inspections, setInspections] = useState<QCInspection[]>(initialInspections);

    const addInspection = (inspection: QCInspection) => {
        setInspections((prev) => [inspection, ...prev]);
    };

    const updateInspection = (id: string, updates: Partial<QCInspection>) => {
        setInspections((prev) =>
            prev.map((i) => {
                if (i.id === id) {
                    return { ...i, ...updates };
                }
                return i;
            })
        );
    };

    return (
        <QCContext.Provider value={{ inspections, addInspection, updateInspection }}>
            {children}
        </QCContext.Provider>
    );
}

export function useQC() {
    const context = useContext(QCContext);
    if (context === undefined) {
        throw new Error('useQC must be used within a QCProvider');
    }
    return context;
}
