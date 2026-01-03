import { createContext, useContext, useState, ReactNode } from 'react';

export type AuditLogModule = 'HR' | 'Warehouse' | 'Production' | 'Maintenance';
export type AuditLogAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'assigned' 
  | 'approved' 
  | 'rejected' 
  | 'uploaded' 
  | 'fixed' 
  | 'status_changed';
export type AuditLogResult = 'Success' | 'Failed';

export interface AuditLogEntry {
  id: string;
  dateTime: string;
  user: string;
  role: string;
  module: AuditLogModule;
  action: AuditLogAction;
  target: string;
  result: AuditLogResult;
}

interface AuditLogContextType {
  auditLogs: AuditLogEntry[];
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'dateTime'>) => void;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

// Mock initial audit log data
const initialAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: 'John Doe',
    role: 'Maintenance Worker',
    module: 'Maintenance',
    action: 'created',
    target: 'Maintenance Request #123',
    result: 'Success',
  },
  {
    id: '2',
    dateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    user: 'Jane Smith',
    role: 'Director',
    module: 'Maintenance',
    action: 'assigned',
    target: 'Worker: Mike Johnson',
    result: 'Success',
  },
  {
    id: '3',
    dateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: 'Mike Johnson',
    role: 'Maintenance Worker',
    module: 'Maintenance',
    action: 'fixed',
    target: 'Issue: Motor Overheating',
    result: 'Success',
  },
  {
    id: '4',
    dateTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: 'Mike Johnson',
    role: 'Maintenance Worker',
    module: 'Maintenance',
    action: 'uploaded',
    target: 'Photo Report: 3 images',
    result: 'Success',
  },
  {
    id: '5',
    dateTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: 'Sarah Williams',
    role: 'HR Manager',
    module: 'HR',
    action: 'approved',
    target: 'Document: Employee Handbook 2025',
    result: 'Success',
  },
  {
    id: '6',
    dateTime: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    user: 'Tom Brown',
    role: 'Warehouse Manager',
    module: 'Warehouse',
    action: 'updated',
    target: 'Stock: Steel Sheets (+500 kg)',
    result: 'Success',
  },
  {
    id: '7',
    dateTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: 'Alice Green',
    role: 'Line Master',
    module: 'Production',
    action: 'status_changed',
    target: 'Line: Assembly Line A → Active',
    result: 'Success',
  },
  {
    id: '8',
    dateTime: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    user: 'Bob White',
    role: 'Maintenance Worker',
    module: 'Maintenance',
    action: 'created',
    target: 'Maintenance Request #124',
    result: 'Failed',
  },
  {
    id: '9',
    dateTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    user: 'Emma Davis',
    role: 'HR Manager',
    module: 'HR',
    action: 'updated',
    target: 'Document: Safety Policy Update',
    result: 'Success',
  },
  {
    id: '10',
    dateTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user: 'Chris Lee',
    role: 'Warehouse Manager',
    module: 'Warehouse',
    action: 'updated',
    target: 'Stock: Aluminum Rods (-150 kg)',
    result: 'Success',
  },
];

export function AuditLogProvider({ children }: { children: ReactNode }) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  /**
   * Add a new audit log entry
   * 
   * Usage example in components:
   * ```tsx
   * import { useAuditLog } from '../context/AuditLogContext';
   * 
   * function MyComponent() {
   *   const { addAuditLog } = useAuditLog();
   *   
   *   const handleAction = () => {
   *     // Perform action...
   *     addAuditLog({
   *       user: 'John Doe',
   *       role: 'Maintenance Worker',
   *       module: 'Maintenance',
   *       action: 'created',
   *       target: 'Maintenance Request #123',
   *       result: 'Success',
   *     });
   *   };
   * }
   * ```
   */
  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'dateTime'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: Date.now().toString(),
      dateTime: new Date().toISOString(),
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  return (
    <AuditLogContext.Provider
      value={{
        auditLogs,
        addAuditLog,
      }}
    >
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
}

