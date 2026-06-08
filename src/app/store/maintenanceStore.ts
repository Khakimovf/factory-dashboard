import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SubRouteToggle {
    id: string;
    label: string;
    pathPrefixes: string[];
    enabled: boolean;
}

export interface ModuleToggleTree {
    id: string;
    label: string;
    globalKey: string;
    enabled: boolean;
    subRoutes: SubRouteToggle[];
    iconName: string;
}

interface MaintenanceState {
    modules: ModuleToggleTree[];
    toggleParent: (parentId: string) => void;
    toggleSubRoute: (parentId: string, subRouteId: string) => void;
    isRouteLocked: (pathname: string) => { isLocked: boolean; lockLabel: string } | null;
}

const INITIAL_MODULES: ModuleToggleTree[] = [
    // ── 1. BOSHQARUV PANELI (Dashboard) ─────────────────────────────────────
    {
        id: 'dashboard',
        label: 'Boshqaruv Paneli',
        globalKey: 'DASHBOARD_GLOBAL',
        enabled: true,
        iconName: 'dashboard',
        subRoutes: [
            {
                id: 'MAIN_ANALYTICS_BOARD',
                label: "BOSHQARUV PANELI KO'RSATKICHLARI (Main Analytics)",
                pathPrefixes: ['/'],
                enabled: true
            }
        ]
    },

    // ── 2. LOGISTIKA VA OMBOR (Warehouse & Logistics) ────────────────────────
    {
        id: 'warehouse_logistics',
        label: 'Logistika va Ombor',
        globalKey: 'WAREHOUSE_MODULE_GLOBAL',
        enabled: true,
        iconName: 'warehouse',
        subRoutes: [
            {
                id: 'OMBOR_RAW_INVENTORY_MASTER',
                label: 'OMBOR (RAW INVENTORY MASTER)',
                pathPrefixes: ['/warehouse/requests', '/warehouse/receiving', '/warehouse'],
                enabled: true
            },
            {
                id: 'FINISHED_GOODS',
                label: "TAYYOR MAHSULOTLAR (FINISHED GOODS)",
                pathPrefixes: ['/finished-goods'],
                enabled: true
            },
            {
                id: 'SUPPLIERS_RECORD',
                label: "TA'MINOTCHILAR (SUPPLIERS RECORD)",
                pathPrefixes: ['/suppliers'],
                enabled: true
            },
            {
                id: 'CONTAINER_PORT',
                label: 'KONTEYNER LOGISTIKASI (CONTAINER PORT)',
                pathPrefixes: ['/container-logistics'],
                enabled: true
            },
            {
                id: 'RECONCILIATION',
                label: "INVENTARIZATSIYA & BALANS (RECONCILIATION)",
                pathPrefixes: ['/warehouse/inventory-reconciliation'],
                enabled: true
            }
        ]
    },

    // ── 3. TA'MIRLASH VA TEXNIK XIZMAT (Maintenance) ────────────────────────
    {
        id: 'maintenance_tech',
        label: "Ta'mirlash va Texnik Xizmat",
        globalKey: 'MAINTENANCE_GLOBAL',
        enabled: true,
        iconName: 'maintenance',
        subRoutes: [
            {
                id: 'EQUIPMENT_REPAIR_LOGS',
                label: 'TEXNIK XIZMAT BOSHQARUVI (Maintenance Dashboard)',
                pathPrefixes: ['/maintenance'],
                enabled: true
            },
            {
                id: 'FAILURE_REPORTS',
                label: 'NOSOZLIK HISOBOTLARI (Failure Reports)',
                pathPrefixes: ['/maintenance/failure-reports'],
                enabled: true
            }
        ]
    },

    // ── 4. ISHLAB CHIQARISH (Production) ────────────────────────────────────
    {
        id: 'production_plan',
        label: 'Ishlab Chiqarish',
        globalKey: 'PRODUCTION_MODULE_GLOBAL',
        enabled: true,
        iconName: 'production',
        subRoutes: [
            {
                id: 'PRODUCTION_LINES',
                label: 'ISHLAB CHIQARISH LINIYALARI',
                pathPrefixes: ['/production-lines'],
                enabled: true
            },
            {
                id: 'DAILY_PLANS_SEND',
                label: 'KUNLIK REJALARNI YUBORISH',
                pathPrefixes: ['/hr/production-plan', '/hr/line-plans', '/production-lines/operator-plans', '/operator-plans'],
                enabled: true
            },
            {
                id: 'QC_LABS',
                label: 'SIFAT NAZORATI (QC LABS)',
                pathPrefixes: ['/qc'],
                enabled: true
            },
            {
                id: 'MRP_ENGINE',
                label: 'MRP — MATERIAL PLAN ENGINE',
                pathPrefixes: ['/mrp'],
                enabled: true
            },
            {
                id: 'TRACEABILITY_ENGINE',
                label: 'TRACEABILITY ENGINE',
                pathPrefixes: ['/traceability'],
                enabled: true
            },
            {
                id: 'BRAK_VA_QAYTA_ISHLASH_RECYCLING',
                label: 'BRAK VA QAYTA ISHLASH (Defect & Recycling Hub)',
                pathPrefixes: ['/brak-recycling'],
                enabled: true
            }
        ]
    },

    // ── 5. XODIMLAR VA SERVIS (HR & Services) ────────────────────────────────
    {
        id: 'hr_service',
        label: 'Xodimlar va Servis',
        globalKey: 'HRM_MODULE_GLOBAL',
        enabled: true,
        iconName: 'hrm',
        subRoutes: [
            {
                id: 'RECRUITING',
                label: "KADRLAR BO'LIMI (RECRUITING)",
                pathPrefixes: ['/hr/employees', '/hr/stats', '/hr/library', '/hr'],
                enabled: true
            },
            {
                id: 'EMPLOYEE_CABINET',
                label: 'ISHCHI SHAXSIY KABINETI',
                pathPrefixes: ['/worker-cabinet', '/profile', '/employee/cabinet', '/ess'],
                enabled: true
            },
            {
                id: 'CANTEEN_OPS',
                label: 'OSHXONA OPERATSIYALARI',
                pathPrefixes: ['/canteen'],
                enabled: true
            },
            {
                id: 'ROSTERS',
                label: 'SMENA JADVALI (ROSTERS)',
                pathPrefixes: ['/shift-schedule'],
                enabled: true
            }
        ]
    },

    // ── 6. VGM — TRANSPORT NAZORAT (Logistics Gate) ─────────────────────────
    {
        id: 'vgm_transport',
        label: 'VGM — Transport Nazorat',
        globalKey: 'TRANSPORT_VGM_GLOBAL',
        enabled: true,
        iconName: 'vgm',
        subRoutes: [
            {
                id: 'TRANSPORT_NAZORAT_MARKAZI',
                label: 'TRANSPORT NAZORAT MARKAZI (Gate Control)',
                pathPrefixes: ['/logistics-gate'],
                enabled: true
            },
            {
                id: 'POST_1_SCALE_TERMINAL',
                label: "POST 1 — KIRISH TAROZI (Entrance Scale)",
                pathPrefixes: ['/logistics-gate/post-1'],
                enabled: true
            },
            {
                id: 'POST_2_SCALE_TERMINAL',
                label: "POST 2 — CHIQISH TAROZI (Exit Scale)",
                pathPrefixes: ['/logistics-gate/post-2'],
                enabled: true
            },
            {
                id: 'POST_3_SCALE_TERMINAL',
                label: "POST 3 — YUK QABUL TERMINALI",
                pathPrefixes: ['/logistics-gate/post-3'],
                enabled: true
            },
            {
                id: 'POST_4_SCALE_TERMINAL',
                label: "POST 4 — TAYYOR MAHSULOT CHIQISHI",
                pathPrefixes: ['/logistics-gate/post-4'],
                enabled: true
            }
        ]
    },

    // ── 7. HISOBOTLAR (Reports) ──────────────────────────────────────────────
    {
        id: 'reports_intel',
        label: 'Hisobotlar & Tahlil',
        globalKey: 'REPORTS_GLOBAL',
        enabled: true,
        iconName: 'reports',
        subRoutes: [
            {
                id: 'ANALYTICAL_REPORTS_VIEWER',
                label: "TAHLILIY HISOBOTLAR (Analytical Reports Viewer)",
                pathPrefixes: ['/reports'],
                enabled: true
            }
        ]
    },

    // ── 8. MOLIYA (Finance FI/CO) ────────────────────────────────────────────
    {
        id: 'finance_co',
        label: 'Moliya (FI/CO)',
        globalKey: 'FINANCE_MODULE_GLOBAL',
        enabled: true,
        iconName: 'finance',
        subRoutes: [
            {
                id: 'GENERAL_LEDGER',
                label: 'GENERAL LEDGER (BOSH DAFTAR)',
                pathPrefixes: ['/finance'],
                enabled: true
            },
            {
                id: 'CONTRACT_MODULE',
                label: 'SHARTNOMALAR (AI CONTRACT MODULE)',
                pathPrefixes: ['/finance/contracts'],
                enabled: true
            }
        ]
    },

    // ── 9. TA'MINOT MM (Procurement) ─────────────────────────────────────────
    {
        id: 'procurement_mm',
        label: "Ta'minot (MM)",
        globalKey: 'PROCUREMENT_MM_GLOBAL',
        enabled: true,
        iconName: 'procurement',
        subRoutes: [
            {
                id: 'PURCHASE_REQUISITIONS_LEDGER',
                label: 'XARID SO\'ROVLARI (Purchase Requisitions Ledger)',
                pathPrefixes: ['/procurement'],
                enabled: true
            }
        ]
    }
];

export const useMaintenanceStore = create<MaintenanceState>()(
    persist(
        (set, get) => ({
            modules: INITIAL_MODULES,

            toggleParent: (parentId: string) => set((state) => {
                const modules = state.modules.map((mod) => {
                    if (mod.id === parentId) {
                        return { ...mod, enabled: !mod.enabled };
                    }
                    return mod;
                });
                return { modules };
            }),

            toggleSubRoute: (parentId: string, subRouteId: string) => set((state) => {
                const modules = state.modules.map((mod) => {
                    if (mod.id === parentId) {
                        if (!mod.enabled) return mod;
                        return {
                            ...mod,
                            subRoutes: (mod.subRoutes ?? []).map((sub) =>
                                sub.id === subRouteId ? { ...sub, enabled: !sub.enabled } : sub
                            )
                        };
                    }
                    return mod;
                });
                return { modules };
            }),

            isRouteLocked: (pathname: string) => {
                const state = get();
                let matchedSubRoute: SubRouteToggle | null = null;
                let matchedParent: ModuleToggleTree | null = null;
                let longestPrefixLength = 0;

                for (const mod of state.modules) {
                    for (const sub of mod.subRoutes ?? []) {
                        for (const prefix of sub.pathPrefixes) {
                            // Special-case root "/" — only match exact
                            const isExact = pathname === prefix;
                            const isSubPath = prefix !== '/' && pathname.startsWith(prefix + '/');
                            if (isExact || isSubPath) {
                                if (prefix.length > longestPrefixLength) {
                                    longestPrefixLength = prefix.length;
                                    matchedSubRoute = sub;
                                    matchedParent = mod;
                                }
                            }
                        }
                    }
                }

                if (!matchedParent || !matchedSubRoute) return null;

                if (!matchedParent.enabled) {
                    return {
                        isLocked: true,
                        lockLabel: `${matchedParent.label.toUpperCase()} (TIZIM BLOKI)`
                    };
                }

                if (!matchedSubRoute.enabled) {
                    return {
                        isLocked: true,
                        lockLabel: matchedSubRoute.label
                    };
                }

                return null;
            }
        }),
        {
            name: 'vgm-maintenance-settings',
            version: 3, // Bumped — new BRAK_VA_QAYTA_ISHLASH sub-route added to production_plan
            partialize: (state) => ({ modules: state.modules }),
            migrate: (_persistedState, _version) => {
                // Any stored version < 2 gets wiped → falls back to INITIAL_MODULES
                return undefined;
            },
        }
    )
);
