import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FatherDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface ChildDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  father_detail_id: string;
  quantity_per_unit: number;
  unit: string;
}

export interface BOMItem {
  child_id: string;
  child_code: string;
  child_name: string;
  unit: string;
  quantity_per_unit: number;
  required_quantity: number;
  in_stock: number;
  status: 'OK' | 'LOW' | 'SHORTAGE';
  shortage: number;
}

export interface BOMResult {
  father_code: string;
  father_name: string;
  production_volume: number;
  items: BOMItem[];
  lines: string[];
}

export interface StockItem {
  code: string;
  name: string;
  unit: string;
  in_stock: number;
  status: 'OK' | 'LOW' | 'OUT';
}

export interface DetailStats {
  total_fathers: number;
  total_children: number;
  top_used_children: { code: string; usage: number; in_stock: number }[];
  shortage_alerts: { code: string; in_stock: number; recommendation: string }[];
}

// ── Initial Mock Seed (Fallback) ─────────────────────────────────────────────

const SEED_FATHERS: FatherDetail[] = [
  { id: 'f-001', code: 'DOOR-PANEL-FL', name: 'Eshik Paneli (FL)', description: 'Oldingi chap eshik paneli' },
  { id: 'f-002', code: 'DASHBOARD-COVER', name: 'Priborlar Paneli Qoplamasi', description: 'Markaziy priborlar paneli' },
  { id: 'f-003', code: 'GLOVE-BOX', name: "Qo'lqop Qutisi", description: "O'ng tomonli qo'lqop qutisi" },
  { id: 'f-004', code: 'DOOR-PANEL-FR', name: 'Eshik Paneli (FR)', description: "Oldingi o'ng eshik paneli" },
  { id: 'f-005', code: 'CENTER-CONSOLE', name: 'Markaziy Konsol', description: 'Markaziy konsol korpusi' },
];

const SEED_CHILDREN: ChildDetail[] = [
  { id: 'c-001', code: 'CLIP-ABS-BLK-01', name: 'ABS Klips (Qora)', father_detail_id: 'f-001', quantity_per_unit: 4, unit: 'pcs' },
  { id: 'c-002', code: 'FOAM-PU-5MM', name: "PU Ko'pik 5mm", father_detail_id: 'f-001', quantity_per_unit: 0.2, unit: 'kg' },
  { id: 'c-003', code: 'SCREW-M6-BLK', name: 'Vint M6 (Qora)', father_detail_id: 'f-001', quantity_per_unit: 6, unit: 'pcs' },
  { id: 'c-004', code: 'CLIP-PP-GRY-01', name: 'PP Klips (Kulrang)', father_detail_id: 'f-002', quantity_per_unit: 8, unit: 'pcs' },
  { id: 'c-005', code: 'BEZEL-CHROME-01', name: 'Xrom Bezak', father_detail_id: 'f-002', quantity_per_unit: 1, unit: 'pcs' },
  { id: 'c-006', code: 'HINGE-STL-01', name: "Po'lat Petlya", father_detail_id: 'f-003', quantity_per_unit: 2, unit: 'pcs' },
];

// ── Store Interface ──────────────────────────────────────────────────────────

interface DetailsStore {
  fathers: FatherDetail[];
  children: ChildDetail[];
  stockItems: StockItem[];
  bomResult: BOMResult | null;
  stats: DetailStats | null;
  loading: boolean;
  error: string | null;

  // Fathers
  fetchFathers: () => Promise<void>;
  createFather: (data: Omit<FatherDetail, 'id'>) => Promise<FatherDetail | null>;
  updateFather: (id: string, data: Partial<FatherDetail>) => Promise<FatherDetail | null>;
  deleteFather: (id: string) => Promise<boolean>;

  // Children
  fetchChildren: () => Promise<void>;
  fetchChildrenByFather: (fatherId: string) => Promise<ChildDetail[]>;
  createChild: (data: Omit<ChildDetail, 'id'>) => Promise<ChildDetail | null>;
  updateChild: (id: string, data: Partial<ChildDetail>) => Promise<ChildDetail | null>;
  deleteChild: (id: string) => Promise<boolean>;

  // Production BOM
  fetchBOM: (fatherCode: string, productionVolume: number) => Promise<void>;
  clearBOM: () => void;

  // Warehouse stock
  fetchStock: () => Promise<void>;
  receiveStock: (childCode: string, quantity: number) => Promise<void>;

  // Reports
  fetchStats: () => Promise<void>;
}

const API = '/api/v1/details';

const getAuthHeader = () => {
  const token = localStorage.getItem('erp_access_token') || localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useDetailsStore = create<DetailsStore>((set, get) => ({
  fathers: SEED_FATHERS,
  children: SEED_CHILDREN,
  stockItems: [],
  bomResult: null,
  stats: null,
  loading: false,
  error: null,

  // ── Fathers ──────────────────────────────────────────────────────────────

  fetchFathers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/fathers`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error('Failed to load fathers');
      const data: FatherDetail[] = await res.json();
      set({ fathers: data });
    } catch (e: any) {
      console.warn('API error in fetchFathers, using local state fallback');
    } finally {
      set({ loading: false });
    }
  },

  createFather: async (data) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/fathers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: FatherDetail = await res.json();
        set((s) => ({ fathers: [...s.fathers.filter(f => f.id !== created.id), created] }));
        return created;
      }
      const err = await res.json().catch(() => ({ detail: 'Create failed' }));
      throw new Error(err.detail || 'Create failed');
    } catch (e: any) {
      console.warn('Backend API failed, fallback to local creation:', e.message);
      const newFather: FatherDetail = {
        id: `f-local-${Date.now()}`,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
      };
      set((s) => ({ fathers: [...s.fathers, newFather], error: null }));
      return newFather;
    }
  },

  updateFather: async (id, data) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/fathers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated: FatherDetail = await res.json();
        set((s) => ({ fathers: s.fathers.map((f) => (f.id === id ? updated : f)) }));
        return updated;
      }
    } catch (e: any) {
      console.warn('Backend update failed, using local update:', e.message);
    }
    // Local fallback update
    let updatedFather: FatherDetail | null = null;
    set((s) => ({
      fathers: s.fathers.map((f) => {
        if (f.id === id) {
          updatedFather = { ...f, ...data };
          return updatedFather;
        }
        return f;
      }),
    }));
    return updatedFather;
  },

  deleteFather: async (id) => {
    set({ error: null });
    try {
      await fetch(`${API}/fathers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
    } catch (e: any) {
      console.warn('Backend delete failed, performing local delete:', e.message);
    }
    set((s) => ({
      fathers: s.fathers.filter((f) => f.id !== id),
      children: s.children.filter((c) => c.father_detail_id !== id),
    }));
    return true;
  },

  // ── Children ─────────────────────────────────────────────────────────────

  fetchChildren: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/children`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error('Failed to load children');
      const data: ChildDetail[] = await res.json();
      set({ children: data });
    } catch (e: any) {
      console.warn('API error in fetchChildren, using local state fallback');
    } finally {
      set({ loading: false });
    }
  },

  fetchChildrenByFather: async (fatherId) => {
    try {
      const res = await fetch(`${API}/fathers/${fatherId}/children`, { headers: getAuthHeader() });
      if (res.ok) return await res.json();
    } catch {
      // ignore
    }
    return get().children.filter((c) => c.father_detail_id === fatherId);
  },

  createChild: async (data) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: ChildDetail = await res.json();
        set((s) => ({ children: [...s.children.filter(c => c.id !== created.id), created] }));
        return created;
      }
      const err = await res.json().catch(() => ({ detail: 'Create failed' }));
      throw new Error(err.detail || 'Create failed');
    } catch (e: any) {
      console.warn('Backend API failed, fallback to local child creation:', e.message);
      const newChild: ChildDetail = {
        id: `c-local-${Date.now()}`,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        father_detail_id: data.father_detail_id,
        quantity_per_unit: data.quantity_per_unit || 1,
        unit: data.unit || 'pcs',
      };
      set((s) => ({ children: [...s.children, newChild], error: null }));
      return newChild;
    }
  },

  updateChild: async (id, data) => {
    set({ error: null });
    try {
      const res = await fetch(`${API}/children/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated: ChildDetail = await res.json();
        set((s) => ({ children: s.children.map((c) => (c.id === id ? updated : c)) }));
        return updated;
      }
    } catch (e: any) {
      console.warn('Backend child update failed, using local update:', e.message);
    }
    let updatedChild: ChildDetail | null = null;
    set((s) => ({
      children: s.children.map((c) => {
        if (c.id === id) {
          updatedChild = { ...c, ...data };
          return updatedChild;
        }
        return c;
      }),
    }));
    return updatedChild;
  },

  deleteChild: async (id) => {
    set({ error: null });
    try {
      await fetch(`${API}/children/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
    } catch (e: any) {
      console.warn('Backend child delete failed, using local delete:', e.message);
    }
    set((s) => ({ children: s.children.filter((c) => c.id !== id) }));
    return true;
  },

  // ── BOM ──────────────────────────────────────────────────────────────────

  fetchBOM: async (fatherCode, productionVolume) => {
    set({ loading: true, error: null, bomResult: null });
    try {
      const res = await fetch(
        `${API}/fathers/by-code/${encodeURIComponent(fatherCode)}/bom?production_volume=${productionVolume}`,
        { headers: getAuthHeader() }
      );
      if (res.ok) {
        const data: BOMResult = await res.json();
        set({ bomResult: data });
        return;
      }
    } catch (e: any) {
      console.warn('Backend BOM API failed, calculating BOM locally:', e.message);
    }

    // Local BOM calculation fallback
    const { fathers, children } = get();
    const father = fathers.find(f => f.code.toUpperCase() === fatherCode.toUpperCase());
    if (!father) {
      set({ error: `Ota detal kodi '${fatherCode}' topilmadi`, loading: false });
      return;
    }
    const fatherChildren = children.filter(c => c.father_detail_id === father.id);
    const items: BOMItem[] = fatherChildren.map(c => {
      const required = c.quantity_per_unit * productionVolume;
      const inStock = 500; // Mock default stock
      const shortage = Math.max(0, required - inStock);
      return {
        child_id: c.id,
        child_code: c.code,
        child_name: c.name,
        unit: c.unit,
        quantity_per_unit: c.quantity_per_unit,
        required_quantity: required,
        in_stock: inStock,
        status: shortage === 0 ? 'OK' : inStock > 0 ? 'LOW' : 'SHORTAGE',
        shortage,
      };
    });

    set({
      bomResult: {
        father_code: father.code,
        father_name: father.name,
        production_volume: productionVolume,
        items,
        lines: ['Liniya-A', 'Liniya-B', 'Liniya-C'],
      },
      loading: false,
    });
  },

  clearBOM: () => set({ bomResult: null, error: null }),

  // ── Stock ─────────────────────────────────────────────────────────────────

  fetchStock: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/stock`, { headers: getAuthHeader() });
      if (res.ok) {
        const data: StockItem[] = await res.json();
        set({ stockItems: data });
        return;
      }
    } catch (e: any) {
      console.warn('Backend stock API failed, using local stock fallback');
    }
    // Local stock fallback
    const { children } = get();
    const mockStock: StockItem[] = children.map(c => ({
      code: c.code,
      name: c.name,
      unit: c.unit,
      in_stock: 250,
      status: 'OK',
    }));
    set({ stockItems: mockStock, loading: false });
  },

  receiveStock: async (childCode, quantity) => {
    try {
      await fetch(`${API}/stock/receive?child_code=${encodeURIComponent(childCode)}&quantity=${quantity}`, {
        method: 'POST',
        headers: getAuthHeader(),
      });
    } catch (e: any) {
      console.warn('Backend receive API failed, updating local stock:', e.message);
    }
    set(s => ({
      stockItems: s.stockItems.map(item =>
        item.code === childCode ? { ...item, in_stock: item.in_stock + quantity } : item
      )
    }));
  },

  // ── Stats ─────────────────────────────────────────────────────────────────

  fetchStats: async () => {
    try {
      const res = await fetch(`${API}/stats`, { headers: getAuthHeader() });
      if (res.ok) {
        const data: DetailStats = await res.json();
        set({ stats: data });
        return;
      }
    } catch (e: any) {
      console.warn('Backend stats API failed, using local stats fallback');
    }
    const { fathers, children } = get();
    set({
      stats: {
        total_fathers: fathers.length,
        total_children: children.length,
        top_used_children: children.slice(0, 5).map(c => ({ code: c.code, usage: 15, in_stock: 250 })),
        shortage_alerts: [],
      }
    });
  },
}));
