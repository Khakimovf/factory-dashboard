/**
 * Data model and mock data for Late Arrival Reports
 * TODO: Replace with actual API calls when backend is ready
 */

export interface LateArrivalReport {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  shift_start_time: string; // Format: "08:00" or "20:00"
  late_minutes: number;
  reason: string;
  notes?: string;
  created_at: string; // ISO date string
  status: 'new' | 'approved' | 'rejected';
}

// Mock late arrival reports data
export const mockLateReports: LateArrivalReport[] = [
  {
    id: 'LR-001',
    employee_id: 'EMP-001',
    employee_name: 'Aliyev Sardor',
    department: 'Ishlab chiqarish',
    shift_start_time: '08:00',
    late_minutes: 30,
    reason: 'personal',
    notes: 'Transport muammosi bo\'ldi',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'new',
  },
  {
    id: 'LR-002',
    employee_id: 'EMP-002',
    employee_name: 'Karimova Madina',
    department: 'Sifat nazorati',
    shift_start_time: '08:00',
    late_minutes: 45,
    reason: 'transport',
    notes: 'Avtobus kechikdi',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    status: 'new',
  },
  {
    id: 'LR-003',
    employee_id: 'EMP-003',
    employee_name: 'Toshmatov Javohir',
    department: 'Ombor',
    shift_start_time: '20:00',
    late_minutes: 20,
    reason: 'health',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'approved',
  },
  {
    id: 'LR-004',
    employee_id: 'EMP-004',
    employee_name: 'Yusupov Aziz',
    department: 'Ishlab chiqarish',
    shift_start_time: '08:00',
    late_minutes: 15,
    reason: 'personal',
    notes: 'Bolani maktabga olib borganman',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: 'rejected',
  },
];

// Helper function to get reason label
export function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    personal: 'Shaxsiy sabablar',
    transport: 'Transport muammosi',
    health: 'Sog\'liq muammosi',
    other: 'Boshqa sabab',
  };
  return labels[reason] || 'Noma\'lum sabab';
}
