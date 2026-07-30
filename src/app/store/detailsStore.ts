import { create } from 'zustand';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FatherDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: string;
  status?: string;
}

export interface ChildDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  father_detail_id: string;
  quantity_per_unit: number;
  unit: string;
  category?: string;
  supplier?: string;
  status?: string;
  stock_level?: number;
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

export interface CodeChangeLog {
  id: string;
  entity_type: 'father' | 'child';
  entity_id: string;
  old_code: string;
  new_code: string;
  reason?: string;
  change_date?: string;
  changed_by?: string;
  created_at: string;
}

export interface ContractComment {
  id: string;
  entity_type: 'father' | 'child';
  entity_id: string;
  note: string;
  filename?: string;
  uploaded_by?: string;
  created_at: string;
}

// ── Initial Mock Seed (Fallback) ─────────────────────────────────────────────

const SEED_FATHERS: FatherDetail[] = [
  { id: 'f-001', code: 'DOOR-PANEL-FL', name: 'Eshik Paneli (FL)', description: 'Oldingi chap eshik paneli', category: 'Plastik Qoliplar', supplier: 'Polymer-Uz', status: 'Faol' },
  { id: 'f-002', code: 'DASHBOARD-COVER', name: 'Priborlar Paneli Qoplamasi', description: 'Markaziy priborlar paneli', category: 'Plastik Qoliplar', supplier: 'AutoTech Ltd', status: 'Faol' },
  { id: 'f-003', code: 'GLOVE-BOX', name: "Qo'lqop Qutisi", description: "O'ng tomonli qo'lqop qutisi", category: 'Kabinets & Konsollar', supplier: 'Polymer-Uz', status: 'Faol' },
  { id: 'f-004', code: 'DOOR-PANEL-FR', name: 'Eshik Paneli (FR)', description: "Oldingi o'ng eshik paneli", category: 'Plastik Qoliplar', supplier: 'Polymer-Uz', status: 'Faol' },
  { id: 'f-005', code: 'CENTER-CONSOLE', name: 'Markaziy Konsol', description: 'Markaziy konsol korpusi', category: 'Kabinets & Konsollar', supplier: 'SamAuto Parts', status: 'Sinovda' },
];

const SEED_CHILDREN: ChildDetail[] = [
  { id: 'c-001', code: 'CLIP-ABS-BLK-01', name: 'ABS Klips (Qora)', father_detail_id: 'f-001', quantity_per_unit: 4, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 850 },
  { id: 'c-002', code: 'FOAM-PU-5MM', name: "PU Ko'pik 5mm", father_detail_id: 'f-001', quantity_per_unit: 0.2, unit: 'kg', category: 'Rezina va Zichlagichlar', supplier: 'Polymer-Uz', status: 'Faol', stock_level: 42.5 },
  { id: 'c-003', code: 'SCREW-M6-BLK', name: 'Vint M6 (Qora)', father_detail_id: 'f-001', quantity_per_unit: 6, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 3200 },
  { id: 'c-004', code: 'CLIP-PP-GRY-01', name: 'PP Klips (Kulrang)', father_detail_id: 'f-002', quantity_per_unit: 8, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 120 },
  { id: 'c-005', code: 'BEZEL-CHROME-01', name: 'Xrom Bezak', father_detail_id: 'f-002', quantity_per_unit: 1, unit: 'pcs', category: 'Dekorativ qismlar', supplier: 'AutoTech Ltd', status: 'Faol', stock_level: 15 },
  { id: 'c-006', code: 'SCREW-M6-BLK', name: 'Vint M6 (Qora)', father_detail_id: 'f-002', quantity_per_unit: 4, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 3200 },
  { id: 'c-007', code: 'HINGE-STL-01', name: "Po'lat Petlya", father_detail_id: 'f-003', quantity_per_unit: 2, unit: 'pcs', category: 'Metall qismlar', supplier: 'SamAuto Parts', status: 'Faol', stock_level: 200 },
  { id: 'c-008', code: 'FOAM-PU-5MM', name: "PU Ko'pik 5mm", father_detail_id: 'f-003', quantity_per_unit: 0.1, unit: 'kg', category: 'Rezina va Zichlagichlar', supplier: 'Polymer-Uz', status: 'Faol', stock_level: 42.5 },
  { id: 'c-009', code: 'CLIP-ABS-BLK-01', name: 'ABS Klips (Qora)', father_detail_id: 'f-004', quantity_per_unit: 4, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 850 },
  { id: 'c-010', code: 'SCREW-M6-BLK', name: 'Vint M6 (Qora)', father_detail_id: 'f-004', quantity_per_unit: 6, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 3200 },
  { id: 'c-011', code: 'ARMREST-FBRK', name: "Qo'l Tiragi (Fiber)", father_detail_id: 'f-005', quantity_per_unit: 1, unit: 'pcs', category: 'Mebel & Tikuv', supplier: 'SamAuto Parts', status: 'Sinovda', stock_level: 0 },
  { id: 'c-012', code: 'CLIP-PP-GRY-01', name: 'PP Klips (Kulrang)', father_detail_id: 'f-005', quantity_per_unit: 6, unit: 'pcs', category: 'Fastenerlar', supplier: 'GlobalFasteners', status: 'Faol', stock_level: 120 },
];

const SEED_CHANGE_LOGS: CodeChangeLog[] = [
  {
    id: 'cl-001', entity_type: 'father', entity_id: 'f-001',
    old_code: 'DOOR-FL-V1', new_code: 'DOOR-PANEL-FL',
    reason: "Standart kodlash tizimiga o'tish", change_date: '2025-03-10',
    changed_by: 'admin', created_at: '2025-03-10T09:00:00',
  },
  {
    id: 'cl-002', entity_type: 'child', entity_id: 'c-001',
    old_code: 'CLIP-01', new_code: 'CLIP-ABS-BLK-01',
    reason: "Material va rang ma'lumotlari qo'shildi", change_date: '2025-03-10',
    changed_by: 'admin', created_at: '2025-03-10T09:15:00',
  },
];

const SEED_COMMENTS: ContractComment[] = [
  {
    id: 'cc-001', entity_type: 'father', entity_id: 'f-001',
    note: "2025-yil yanvar shartnomasi asosida tasdiqlangan. Shartnoma raqami: CT-2025-001",
    filename: 'shartnoma_CT-2025-001.pdf',
    uploaded_by: 'admin', created_at: '2025-01-15T10:30:00',
  },
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

  // Change logs cache: entityId → logs
  changeLogs: Record<string, CodeChangeLog[]>;
  // Comments cache: entityId → comments
  comments: Record<string, ContractComment[]>;

  // Fathers
  fetchFathers: () => Promise<void>;
  createFather: (data: Omit<FatherDetail, 'id'>) => Promise<FatherDetail | null>;
  updateFather: (id: string, data: Partial<FatherDetail> & { changeReason?: string; changeDate?: string }) => Promise<FatherDetail | null>;
  bulkUpdateFathers: (ids: string[], updates: { category?: string; supplier?: string; status?: string }) => Promise<boolean>;
  bulkDeleteFathers: (ids: string[]) => Promise<boolean>;
  deleteFather: (id: string) => Promise<boolean>;

  // Children
  fetchChildren: () => Promise<void>;
  fetchChildrenByFather: (fatherId: string) => Promise<ChildDetail[]>;
  createChild: (data: Omit<ChildDetail, 'id'>) => Promise<ChildDetail | null>;
  updateChild: (id: string, data: Partial<ChildDetail> & { changeReason?: string; changeDate?: string }) => Promise<ChildDetail | null>;
  bulkUpdateChildren: (ids: string[], updates: { category?: string; supplier?: string; status?: string }) => Promise<boolean>;
  bulkDeleteChildren: (ids: string[]) => Promise<boolean>;
  deleteChild: (id: string) => Promise<boolean>;

  // Production BOM
  fetchBOM: (fatherCode: string, productionVolume: number) => Promise<void>;
  clearBOM: () => void;

  // Warehouse stock
  fetchStock: () => Promise<void>;
  receiveStock: (childCode: string, quantity: number) => Promise<void>;

  // Reports
  fetchStats: () => Promise<void>;

  // Code change history
  fetchCodeChanges: (entityId: string, entityType: 'father' | 'child') => Promise<CodeChangeLog[]>;

  // Contract comments
  fetchComments: (entityId: string, entityType: 'father' | 'child') => Promise<ContractComment[]>;
  addComment: (entityId: string, entityType: 'father' | 'child', note: string, filename?: string) => Promise<ContractComment | null>;
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
  changeLogs: {
    'f-001': SEED_CHANGE_LOGS.filter(l => l.entity_id === 'f-001'),
    'c-001': SEED_CHANGE_LOGS.filter(l => l.entity_id === 'c-001'),
  },
  comments: {
    'f-001': SEED_COMMENTS.filter(c => c.entity_id === 'f-001'),
  },

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
        category: data.category || 'Plastik Qoliplar',
        supplier: data.supplier || 'Polymer-Uz',
        status: data.status || 'Faol',
      };
      set((s) => ({ fathers: [...s.fathers, newFather], error: null }));
      return newFather;
    }
  },

  updateFather: async (id, data) => {
    set({ error: null });
    const { changeReason, changeDate, ...coreData } = data as any;
    const payload = {
      ...coreData,
      ...(changeReason ? { change_reason: changeReason } : {}),
      ...(changeDate ? { change_date: changeDate } : {}),
    };
    try {
      const res = await fetch(`${API}/fathers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated: FatherDetail = await res.json();
        set((s) => ({ fathers: s.fathers.map((f) => (f.id === id ? updated : f)) }));
        if (coreData.code) {
          get().fetchCodeChanges(id, 'father');
        }
        return updated;
      }
    } catch (e: any) {
      console.warn('Backend update failed, using local update:', e.message);
    }
    let updatedFather: FatherDetail | null = null;
    set((s) => ({
      fathers: s.fathers.map((f) => {
        if (f.id === id) {
          updatedFather = { ...f, ...coreData };
          return updatedFather as FatherDetail;
        }
        return f;
      }),
    }));
    return updatedFather;
  },

  bulkUpdateFathers: async (ids, updates) => {
    try {
      await fetch(`${API}/fathers/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ids, ...updates }),
      });
    } catch (e: any) {
      console.warn('Backend bulk update failed, updating local state');
    }
    set(s => ({
      fathers: s.fathers.map(f => ids.includes(f.id) ? { ...f, ...updates } : f)
    }));
    return true;
  },

  bulkDeleteFathers: async (ids) => {
    try {
      await fetch(`${API}/fathers/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ids }),
      });
    } catch (e: any) {
      console.warn('Backend bulk delete failed, updating local state');
    }
    set(s => ({
      fathers: s.fathers.filter(f => !ids.includes(f.id)),
      children: s.children.filter(c => !ids.includes(c.father_detail_id)),
    }));
    return true;
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
        category: data.category || 'Fastenerlar',
        supplier: data.supplier || 'GlobalFasteners',
        status: data.status || 'Faol',
        stock_level: data.stock_level ?? 250,
      };
      set((s) => ({ children: [...s.children, newChild], error: null }));
      return newChild;
    }
  },

  updateChild: async (id, data) => {
    set({ error: null });
    const { changeReason, changeDate, ...coreData } = data as any;
    const payload = {
      ...coreData,
      ...(changeReason ? { change_reason: changeReason } : {}),
      ...(changeDate ? { change_date: changeDate } : {}),
    };
    try {
      const res = await fetch(`${API}/children/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated: ChildDetail = await res.json();
        set((s) => ({ children: s.children.map((c) => (c.id === id ? updated : c)) }));
        if (coreData.code) {
          get().fetchCodeChanges(id, 'child');
        }
        return updated;
      }
    } catch (e: any) {
      console.warn('Backend child update failed, using local update:', e.message);
    }
    let updatedChild: ChildDetail | null = null;
    set((s) => ({
      children: s.children.map((c) => {
        if (c.id === id) {
          updatedChild = { ...c, ...coreData };
          return updatedChild as ChildDetail;
        }
        return c;
      }),
    }));
    return updatedChild;
  },

  bulkUpdateChildren: async (ids, updates) => {
    try {
      await fetch(`${API}/children/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ids, ...updates }),
      });
    } catch (e: any) {
      console.warn('Backend bulk update failed, updating local state');
    }
    set(s => ({
      children: s.children.map(c => ids.includes(c.id) ? { ...c, ...updates } : c)
    }));
    return true;
  },

  bulkDeleteChildren: async (ids) => {
    try {
      await fetch(`${API}/children/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ids }),
      });
    } catch (e: any) {
      console.warn('Backend bulk delete failed, updating local state');
    }
    set(s => ({
      children: s.children.filter(c => !ids.includes(c.id))
    }));
    return true;
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
    const { fathers, children } = get();
    const father = fathers.find(f => f.code.toUpperCase() === fatherCode.toUpperCase());
    if (!father) {
      set({ error: `Ota detal kodi '${fatherCode}' topilmadi`, loading: false });
      return;
    }
    const fatherChildren = children.filter(c => c.father_detail_id === father.id);
    const items: BOMItem[] = fatherChildren.map(c => {
      const required = c.quantity_per_unit * productionVolume;
      const inStock = c.stock_level ?? 500;
      const shortage = Math.max(0, required - inStock);
      return {
        child_id: c.id, child_code: c.code, child_name: c.name, unit: c.unit,
        quantity_per_unit: c.quantity_per_unit, required_quantity: required,
        in_stock: inStock, status: shortage === 0 ? 'OK' : inStock > 0 ? 'LOW' : 'SHORTAGE', shortage,
      };
    });
    set({
      bomResult: {
        father_code: father.code, father_name: father.name,
        production_volume: productionVolume, items, lines: ['Liniya-A', 'Liniya-B', 'Liniya-C'],
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
    const { children } = get();
    const mockStock: StockItem[] = children.map(c => ({
      code: c.code, name: c.name, unit: c.unit, in_stock: c.stock_level ?? 250, status: (c.stock_level ?? 250) > 50 ? 'OK' : (c.stock_level ?? 250) > 0 ? 'LOW' : 'OUT',
    }));
    set({ stockItems: mockStock, loading: false });
  },

  receiveStock: async (childCode, quantity) => {
    try {
      await fetch(`${API}/stock/receive?child_code=${encodeURIComponent(childCode)}&quantity=${quantity}`, {
        method: 'POST', headers: getAuthHeader(),
      });
    } catch (e: any) {
      console.warn('Backend receive API failed, updating local stock:', e.message);
    }
    set(s => ({
      stockItems: s.stockItems.map(item =>
        item.code === childCode ? { ...item, in_stock: item.in_stock + quantity } : item
      ),
      children: s.children.map(c =>
        c.code === childCode ? { ...c, stock_level: (c.stock_level || 0) + quantity } : c
      ),
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
        top_used_children: children.slice(0, 5).map(c => ({ code: c.code, usage: 15, in_stock: c.stock_level ?? 250 })),
        shortage_alerts: [],
      }
    });
  },

  // ── Code Change History ────────────────────────────────────────────────────

  fetchCodeChanges: async (entityId, entityType) => {
    try {
      const endpoint = entityType === 'father'
        ? `${API}/fathers/${entityId}/changes`
        : `${API}/children/${entityId}/changes`;
      const res = await fetch(endpoint, { headers: getAuthHeader() });
      if (res.ok) {
        const data: CodeChangeLog[] = await res.json();
        set(s => ({ changeLogs: { ...s.changeLogs, [entityId]: data } }));
        return data;
      }
    } catch (e: any) {
      console.warn('Code change fetch failed, using cached data');
    }
    return get().changeLogs[entityId] || [];
  },

  // ── Contract Comments ──────────────────────────────────────────────────────

  fetchComments: async (entityId, entityType) => {
    try {
      const endpoint = entityType === 'father'
        ? `${API}/fathers/${entityId}/comments`
        : `${API}/children/${entityId}/comments`;
      const res = await fetch(endpoint, { headers: getAuthHeader() });
      if (res.ok) {
        const data: ContractComment[] = await res.json();
        set(s => ({ comments: { ...s.comments, [entityId]: data } }));
        return data;
      }
    } catch (e: any) {
      console.warn('Comments fetch failed, using cached data');
    }
    return get().comments[entityId] || [];
  },

  addComment: async (entityId, entityType, note, filename) => {
    try {
      const endpoint = entityType === 'father'
        ? `${API}/fathers/${entityId}/comments`
        : `${API}/children/${entityId}/comments`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ note, filename: filename || null }),
      });
      if (res.ok) {
        const created: ContractComment = await res.json();
        set(s => ({
          comments: {
            ...s.comments,
            [entityId]: [created, ...(s.comments[entityId] || [])],
          },
        }));
        return created;
      }
    } catch (e: any) {
      console.warn('Add comment failed, using local fallback');
    }
    const newComment: ContractComment = {
      id: `cc-local-${Date.now()}`,
      entity_type: entityType,
      entity_id: entityId,
      note,
      filename,
      uploaded_by: 'local',
      created_at: new Date().toISOString(),
    };
    set(s => ({
      comments: {
        ...s.comments,
        [entityId]: [newComment, ...(s.comments[entityId] || [])],
      },
    }));
    return newComment;
  },
}));
