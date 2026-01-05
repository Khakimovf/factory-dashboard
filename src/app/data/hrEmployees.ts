export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  employeeId: string;
  fullName: string;
  department: string;
  position: string;
  employmentDate: string; // ISO string
  status: EmployeeStatus;
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
];


