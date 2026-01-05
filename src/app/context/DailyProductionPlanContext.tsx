import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Shift = '1-smena' | '2-smena';
export type ProductOption = 'MIDNIGHT' | 'URBAN';

export interface PlanRow {
  id: string;
  partNo: string;
  reja: number;
  fact?: number;
}

export interface DailyProductionPlan {
  id: string;
  date: string; // YYYY-MM-DD format
  shift: Shift;
  productGroup: string;
  rows: PlanRow[];
  totalReja: number;
  comment?: string;
  createdAt: string;
}

// Line-specific daily plan (assigned to a production line)
export interface LineDailyPlan {
  date: string; // YYYY-MM-DD format
  lineId: string;
  lineName: string;
  shift: Shift;
  productOption: ProductOption; // MIDNIGHT or URBAN
  productName: string;
  rows: PlanRow[];
  totalReja: number;
  createdAt: string;
}

// Structure: { "2026-01-05": { "line-id-1": LineDailyPlan, "line-id-2": LineDailyPlan } }
export type LinePlansByDate = Record<string, Record<string, LineDailyPlan>>;

interface DailyProductionPlanContextType {
  // General plans (existing)
  plans: DailyProductionPlan[];
  todayPlan: DailyProductionPlan | null;
  createPlan: (plan: Omit<DailyProductionPlan, 'id' | 'createdAt' | 'totalReja'>) => void;
  updatePlan: (id: string, plan: Partial<DailyProductionPlan>) => void;
  getPlanByDate: (date: string) => DailyProductionPlan | null;
  
  // Line-specific plans (new)
  linePlans: LinePlansByDate;
  createLinePlan: (plan: Omit<LineDailyPlan, 'totalReja' | 'createdAt'>) => void;
  updateLinePlan: (date: string, lineId: string, updates: Partial<LineDailyPlan>) => void;
  getLinePlan: (date: string, lineId: string) => LineDailyPlan | null;
  getTodayLinePlan: (lineId: string) => LineDailyPlan | null;
}

const DailyProductionPlanContext = createContext<DailyProductionPlanContextType | undefined>(undefined);

const STORAGE_KEY = 'daily_production_plans';
const LINE_PLANS_STORAGE_KEY = 'line_daily_production_plans';

export function DailyProductionPlanProvider({ children }: { children: ReactNode }) {
  // General plans (existing)
  const [plans, setPlans] = useState<DailyProductionPlan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Line-specific plans (new)
  const [linePlans, setLinePlans] = useState<LinePlansByDate>(() => {
    try {
      const stored = localStorage.getItem(LINE_PLANS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Save to localStorage whenever plans change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (error) {
      console.error('Error saving plans to localStorage:', error);
    }
  }, [plans]);

  // Save line plans to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LINE_PLANS_STORAGE_KEY, JSON.stringify(linePlans));
    } catch (error) {
      console.error('Error saving line plans to localStorage:', error);
    }
  }, [linePlans]);

  // Get today's plan
  const todayPlan = plans.find(plan => {
    const today = new Date().toISOString().split('T')[0];
    return plan.date === today;
  }) || null;

  const createPlan = (planData: Omit<DailyProductionPlan, 'id' | 'createdAt' | 'totalReja'>) => {
    const totalReja = planData.rows.reduce((sum, row) => sum + row.reja, 0);
    
    const newPlan: DailyProductionPlan = {
      ...planData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      totalReja,
    };

    // Remove existing plan for the same date if exists
    const filteredPlans = plans.filter(p => p.date !== planData.date);
    
    setPlans([...filteredPlans, newPlan]);
  };

  const updatePlan = (id: string, updates: Partial<DailyProductionPlan>) => {
    setPlans(plans.map(plan => {
      if (plan.id === id) {
        const updated = { ...plan, ...updates };
        // Recalculate totalReja if rows changed
        if (updates.rows) {
          updated.totalReja = updated.rows.reduce((sum, row) => sum + row.reja, 0);
        }
        return updated;
      }
      return plan;
    }));
  };

  const getPlanByDate = (date: string): DailyProductionPlan | null => {
    return plans.find(plan => plan.date === date) || null;
  };

  // Line-specific plan functions
  const createLinePlan = (planData: Omit<LineDailyPlan, 'totalReja' | 'createdAt'>) => {
    const totalReja = planData.rows.reduce((sum, row) => sum + row.reja, 0);
    
    const newPlan: LineDailyPlan = {
      ...planData,
      totalReja,
      createdAt: new Date().toISOString(),
    };

    setLinePlans(prev => {
      const datePlans = prev[planData.date] || {};
      return {
        ...prev,
        [planData.date]: {
          ...datePlans,
          [planData.lineId]: newPlan,
        },
      };
    });
  };

  const updateLinePlan = (date: string, lineId: string, updates: Partial<LineDailyPlan>) => {
    setLinePlans(prev => {
      const datePlans = prev[date] || {};
      const existingPlan = datePlans[lineId];
      
      if (!existingPlan) return prev;

      const updated = { ...existingPlan, ...updates };
      // Recalculate totalReja if rows changed
      if (updates.rows) {
        updated.totalReja = updated.rows.reduce((sum, row) => sum + row.reja, 0);
      }

      return {
        ...prev,
        [date]: {
          ...datePlans,
          [lineId]: updated,
        },
      };
    });
  };

  const getLinePlan = (date: string, lineId: string): LineDailyPlan | null => {
    return linePlans[date]?.[lineId] || null;
  };

  const getTodayLinePlan = (lineId: string): LineDailyPlan | null => {
    const today = new Date().toISOString().split('T')[0];
    return getLinePlan(today, lineId);
  };

  return (
    <DailyProductionPlanContext.Provider
      value={{
        plans,
        todayPlan,
        createPlan,
        updatePlan,
        getPlanByDate,
        linePlans,
        createLinePlan,
        updateLinePlan,
        getLinePlan,
        getTodayLinePlan,
      }}
    >
      {children}
    </DailyProductionPlanContext.Provider>
  );
}

export function useDailyProductionPlan() {
  const context = useContext(DailyProductionPlanContext);
  if (context === undefined) {
    throw new Error('useDailyProductionPlan must be used within a DailyProductionPlanProvider');
  }
  return context;
}

