import { createContext, useContext, useState, ReactNode } from 'react';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  category: string;
  createdAt?: string;
  createdByRole?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'maintenance';
  efficiency: number;
  requiredMaterials: { materialId: string; quantity: number }[];
  output: number;
}

export interface HRDocument {
  id: string;
  title: string;
  category: 'policy' | 'handbook' | 'form' | 'manual';
  status: 'draft' | 'pending' | 'approved' | 'archived';
  date: string;
}

interface FactoryContextType {
  materials: Material[];
  productionLines: ProductionLine[];
  hrDocuments: HRDocument[];
  addProductionLine: (line: Omit<ProductionLine, 'id'>) => void;
  updateProductionLine: (id: string, updates: Partial<ProductionLine>) => void;
  requestMaterials: (materialId: string, quantity: number) => void;
  updateDocumentStatus: (id: string, status: HRDocument['status']) => void;
  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'createdByRole'> & { materialId: string }) => void;
  updateMaterialQuantity: (materialId: string, quantity: number) => void;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

const initialMaterials: Material[] = [
  { id: '1', name: 'Steel Sheets', quantity: 500, unit: 'kg', minStock: 200, category: 'Raw Material' },
  { id: '2', name: 'Aluminum Rods', quantity: 150, unit: 'kg', minStock: 100, category: 'Raw Material' },
  { id: '3', name: 'Circuit Boards', quantity: 250, unit: 'units', minStock: 50, category: 'Components' },
  { id: '4', name: 'Screws & Bolts', quantity: 5000, unit: 'units', minStock: 1000, category: 'Hardware' },
  { id: '5', name: 'Plastic Casings', quantity: 180, unit: 'units', minStock: 80, category: 'Components' },
  { id: '6', name: 'Rubber Seals', quantity: 450, unit: 'units', minStock: 100, category: 'Components' },
];

const initialProductionLines: ProductionLine[] = [
  {
    id: '1',
    name: 'Assembly Line A',
    status: 'active',
    efficiency: 87,
    requiredMaterials: [
      { materialId: '1', quantity: 10 },
      { materialId: '3', quantity: 2 },
    ],
    output: 120,
  },
  {
    id: '2',
    name: 'Assembly Line B',
    status: 'active',
    efficiency: 92,
    requiredMaterials: [
      { materialId: '2', quantity: 5 },
      { materialId: '5', quantity: 3 },
    ],
    output: 95,
  },
  {
    id: '3',
    name: 'Assembly Line D',
    status: 'idle',
    efficiency: 78,
    requiredMaterials: [
      { materialId: '4', quantity: 20 },
    ],
    output: 80,
  },
];

const initialHRDocuments: HRDocument[] = [
  { id: '1', title: 'Employee Handbook 2025', category: 'handbook', status: 'approved', date: '2025-01-01' },
  { id: '2', title: 'Safety Policy Update', category: 'policy', status: 'pending', date: '2025-12-20' },
  { id: '3', title: 'Leave Request Form', category: 'form', status: 'approved', date: '2025-06-15' },
  { id: '4', title: 'Machine Operation Manual', category: 'manual', status: 'approved', date: '2025-03-10' },
  { id: '5', title: 'Remote Work Policy', category: 'policy', status: 'draft', date: '2025-12-15' },
  { id: '6', title: 'Training Completion Form', category: 'form', status: 'pending', date: '2025-11-28' },
];

export function FactoryProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>(initialProductionLines);
  const [hrDocuments, setHRDocuments] = useState<HRDocument[]>(initialHRDocuments);

  const addProductionLine = (line: Omit<ProductionLine, 'id'>) => {
    const newLine = { ...line, id: Date.now().toString() };
    setProductionLines([...productionLines, newLine]);
  };

  const updateProductionLine = (id: string, updates: Partial<ProductionLine>) => {
    setProductionLines(productionLines.map(line => 
      line.id === id ? { ...line, ...updates } : line
    ));
  };

  const requestMaterials = (materialId: string, quantity: number) => {
    setMaterials(materials.map(material =>
      material.id === materialId 
        ? { ...material, quantity: Math.max(0, material.quantity - quantity) }
        : material
    ));
  };

  const updateDocumentStatus = (id: string, status: HRDocument['status']) => {
    setHRDocuments(hrDocuments.map(doc =>
      doc.id === id ? { ...doc, status } : doc
    ));
  };

  const addMaterial = (materialData: Omit<Material, 'id' | 'createdAt' | 'createdByRole'> & { materialId: string }) => {
    // Check if material with this ID already exists
    if (materials.some(m => m.id === materialData.materialId)) {
      throw new Error('Bu detal allaqachon mavjud');
    }

    const newMaterial: Material = {
      id: materialData.materialId,
      name: materialData.name || `Material ${materialData.materialId}`,
      quantity: materialData.quantity,
      unit: materialData.unit,
      minStock: materialData.minStock || 0,
      category: materialData.category || 'Raw Material',
      createdAt: new Date().toISOString(),
      createdByRole: 'ADMIN', // This should come from auth context in production
    };
    
    setMaterials([...materials, newMaterial]);
  };

  const updateMaterialQuantity = (materialId: string, quantity: number) => {
    setMaterials(materials.map(material =>
      material.id === materialId 
        ? { ...material, quantity: Math.max(0, quantity) }
        : material
    ));
  };

  return (
    <FactoryContext.Provider
      value={{
        materials,
        productionLines,
        hrDocuments,
        addProductionLine,
        updateProductionLine,
        requestMaterials,
        updateDocumentStatus,
        addMaterial,
        updateMaterialQuantity,
      }}
    >
      {children}
    </FactoryContext.Provider>
  );
}

export function useFactory() {
  const context = useContext(FactoryContext);
  if (context === undefined) {
    throw new Error('useFactory must be used within a FactoryProvider');
  }
  return context;
}
