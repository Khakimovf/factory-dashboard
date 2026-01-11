export type EmployeeStatus = 'active' | 'sick' | 'vacation' | 'absent' | 'inactive';

export interface Employee {
  employeeId: string;
  fullName: string;
  department: string;
  position: string;
  employmentDate: string; // ISO string
  status: EmployeeStatus;
  // Optional document references (file name or URL in this mock setup)
  laborContract?: File | string;
  hiringOrder?: File | string;
  // Optional status tracking fields for sick/vacation/absent employees
  statusReason?: string; // Reason for status (e.g., "Flu", "Annual leave", "Personal emergency")
  statusDate?: string; // ISO string - date when status was set
}

// Simple mock employees dataset for HR module UI
export const hrEmployees: Employee[] = [
  {
    employeeId: 'EMP-001',
    fullName: 'Aliyev Sardor',
    department: 'Ishlab chiqarish',
    position: 'Liniya operatori',
    employmentDate: new Date().toISOString(),
    status: 'active',
  },
  {
    employeeId: 'EMP-002',
    fullName: 'Karimova Dilnoza',
    department: 'Kadrlar bo\'limi',
    position: 'HR mutaxassisi',
    employmentDate: new Date().toISOString(),
    status: 'active',
  },
  {
    employeeId: 'EMP-003',
    fullName: 'Rustamov Bekzod',
    department: 'Logistika',
    position: 'Logistika mutaxassisi',
    employmentDate: '2025-11-20T08:00:00.000Z',
    status: 'inactive',
  },
  {
    employeeId: 'EMP-004',
    fullName: 'Ismoilova Maftuna',
    department: 'Ishlab chiqarish',
    position: 'Smena boshlig\'i',
    employmentDate: '2025-12-01T08:00:00.000Z',
    status: 'active',
  },
  {
    employeeId: 'EMP-005',
    fullName: 'Toshmatov Olim',
    department: 'Ishlab chiqarish',
    position: 'Texnik',
    employmentDate: '2024-06-15T08:00:00.000Z',
    status: 'sick',
    statusReason: 'Grip',
    statusDate: new Date().toISOString(),
  },
  {
    employeeId: 'EMP-006',
    fullName: 'Yusupova Malika',
    department: 'Buxgalteriya',
    position: 'Buxgalter',
    employmentDate: '2023-03-10T08:00:00.000Z',
    status: 'vacation',
    statusReason: 'Yillik ta\'til',
    statusDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    employeeId: 'EMP-007',
    fullName: 'Nazarov Farhod',
    department: 'Ishlab chiqarish',
    position: 'Operator',
    employmentDate: '2024-09-20T08:00:00.000Z',
    status: 'absent',
    statusReason: 'Shaxsiy sabab',
    statusDate: new Date().toISOString(),
  },
  {
    employeeId: 'EMP-008',
    fullName: 'Qodirova Zilola',
    department: 'Kadrlar bo\'limi',
    position: 'HR mutaxassisi',
    employmentDate: '2022-11-05T08:00:00.000Z',
    status: 'vacation',
    statusReason: 'Yillik ta\'til',
    statusDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
];




