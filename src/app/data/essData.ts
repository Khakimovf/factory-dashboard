/**
 * Mock data for Employee Self-Service (ESS) module
 * TODO: Replace with actual API calls when backend is ready
 */

export interface SalaryRecord {
  month: string; // Format: "YYYY-MM"
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending' | 'processing';
}

export interface AttendanceRecord {
  date: string; // ISO date string
  checkIn?: string; // Time string "HH:MM"
  checkOut?: string; // Time string "HH:MM"
  isLate: boolean;
  isAbsent: boolean;
  workHours?: number; // Decimal hours
}

export interface LeaveBalance {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingDays: number;
}

export interface LeaveRequest {
  id: string;
  type: 'annual' | 'sick' | 'personal' | 'unpaid';
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string; // ISO date string
  reviewedDate?: string; // ISO date string
  reviewer?: string;
  comments?: string;
}

export interface TimeOffRequest {
  id: string;
  type: 'half_day' | 'few_hours' | 'emergency';
  date: string; // ISO date string
  hours?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string; // ISO date string
}

export interface HRInfoRequest {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  submittedDate: string; // ISO date string
  responseDate?: string; // ISO date string
  response?: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'contract' | 'order' | 'certificate' | 'other';
  uploadDate: string; // ISO date string
  size?: string; // File size string
}

export interface Notification {
  id: string;
  type: 'salary' | 'leave' | 'attendance' | 'document' | 'general';
  title: string;
  message: string;
  date: string; // ISO date string
  isRead: boolean;
  actionUrl?: string;
}

// Mock current employee data (would come from API)
export const mockCurrentEmployee = {
  employeeId: 'EMP-001',
  fullName: 'Aliyev Sardor',
  department: 'Ishlab chiqarish',
  position: 'Liniya operatori',
  employmentDate: '2022-01-15T08:00:00.000Z',
  email: 'sardor.aliyev@factory.uz',
  phone: '+998 90 123 45 67',
};

// Mock salary data
export const mockSalaryHistory: SalaryRecord[] = [
  {
    month: '2025-01',
    baseSalary: 5000000,
    bonuses: 500000,
    deductions: 0,
    netSalary: 5500000,
    status: 'paid',
  },
  {
    month: '2024-12',
    baseSalary: 5000000,
    bonuses: 300000,
    deductions: 100000,
    netSalary: 5200000,
    status: 'paid',
  },
  {
    month: '2024-11',
    baseSalary: 5000000,
    bonuses: 0,
    deductions: 0,
    netSalary: 5000000,
    status: 'paid',
  },
];

// Mock attendance data (last 30 days)
export const mockAttendanceRecords: AttendanceRecord[] = (() => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    const isLate = Math.random() < 0.1; // 10% chance of being late
    const checkInHour = isLate ? 9 : 8;
    const checkInMinute = isLate ? Math.floor(Math.random() * 30) + 1 : Math.floor(Math.random() * 30);
    const checkOutHour = 17 + Math.floor(Math.random() * 2);
    const checkOutMinute = Math.floor(Math.random() * 60);
    
    records.push({
      date: date.toISOString().split('T')[0],
      checkIn: `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}`,
      checkOut: `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}`,
      isLate,
      isAbsent: false,
      workHours: checkOutHour - checkInHour + (checkOutMinute - checkInMinute) / 60,
    });
  }
  
  return records;
})();

// Mock leave balance
export const mockLeaveBalance: LeaveBalance = {
  totalDays: 24,
  usedDays: 8,
  remainingDays: 16,
  pendingDays: 3,
};

// Mock leave requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LR-001',
    type: 'annual',
    startDate: '2025-02-10T00:00:00.000Z',
    endDate: '2025-02-12T00:00:00.000Z',
    days: 3,
    reason: 'Oilaviy sabab',
    status: 'pending',
    submittedDate: '2025-01-15T08:00:00.000Z',
  },
  {
    id: 'LR-002',
    type: 'sick',
    startDate: '2024-12-05T00:00:00.000Z',
    endDate: '2024-12-06T00:00:00.000Z',
    days: 2,
    reason: 'Kasallik',
    status: 'approved',
    submittedDate: '2024-12-04T08:00:00.000Z',
    reviewedDate: '2024-12-04T14:00:00.000Z',
    reviewer: 'HR Bo\'limi',
  },
  {
    id: 'LR-003',
    type: 'annual',
    startDate: '2024-11-20T00:00:00.000Z',
    endDate: '2024-11-22T00:00:00.000Z',
    days: 3,
    reason: 'Dam olish',
    status: 'approved',
    submittedDate: '2024-11-15T08:00:00.000Z',
    reviewedDate: '2024-11-16T10:00:00.000Z',
    reviewer: 'HR Bo\'limi',
  },
];

// Mock time-off requests
export const mockTimeOffRequests: TimeOffRequest[] = [
  {
    id: 'TOR-001',
    type: 'half_day',
    date: '2025-01-25T00:00:00.000Z',
    reason: 'Shaxsiy ish',
    status: 'pending',
    submittedDate: '2025-01-20T08:00:00.000Z',
  },
  {
    id: 'TOR-002',
    type: 'few_hours',
    date: '2024-12-10T00:00:00.000Z',
    hours: 3,
    reason: 'Tibbiy ko\'rik',
    status: 'approved',
    submittedDate: '2024-12-09T08:00:00.000Z',
  },
];

// Mock HR info requests
export const mockHRInfoRequests: HRInfoRequest[] = [
  {
    id: 'HRIR-001',
    subject: 'Ish haqi haqida savol',
    message: 'Yanvar oyi ish haqi qachon to\'lanadi?',
    status: 'responded',
    submittedDate: '2025-01-10T08:00:00.000Z',
    responseDate: '2025-01-10T14:00:00.000Z',
    response: 'Yanvar oyi ish haqi 5-fevral kuni to\'lanadi.',
  },
  {
    id: 'HRIR-002',
    subject: 'Ta\'til haqida',
    message: 'Qancha kun ta\'til qoldi?',
    status: 'responded',
    submittedDate: '2025-01-05T08:00:00.000Z',
    responseDate: '2025-01-05T16:00:00.000Z',
    response: 'Sizda 16 kun ta\'til qolgan.',
  },
];

// Mock documents
export const mockDocuments: EmployeeDocument[] = [
  {
    id: 'DOC-001',
    name: 'Mehnat shartnomasi',
    type: 'contract',
    uploadDate: '2022-01-15T08:00:00.000Z',
    size: '245 KB',
  },
  {
    id: 'DOC-002',
    name: 'Qabul qilish buyrug\'i',
    type: 'order',
    uploadDate: '2022-01-15T08:00:00.000Z',
    size: '120 KB',
  },
  {
    id: 'DOC-003',
    name: 'Malaka oshirish sertifikati',
    type: 'certificate',
    uploadDate: '2023-06-20T08:00:00.000Z',
    size: '890 KB',
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: 'NOTIF-001',
    type: 'salary',
    title: 'Ish haqi to\'landi',
    message: 'Yanvar oyi ish haqi hisobingizga o\'tkazildi.',
    date: new Date().toISOString(),
    isRead: false,
    actionUrl: '/ess/salary',
  },
  {
    id: 'NOTIF-002',
    type: 'leave',
    title: 'Ta\'til so\'rovi tasdiqlandi',
    message: 'Sizning ta\'til so\'rovingiz tasdiqlandi.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    actionUrl: '/ess/leave',
  },
  {
    id: 'NOTIF-003',
    type: 'document',
    title: 'Yangi hujjat',
    message: 'Yangi hujjat yuklandi.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

/**
 * Calculate work experience in years and months
 */
export function calculateWorkExperience(employmentDate: string): { years: number; months: number } {
  const start = new Date(employmentDate);
  const now = new Date();
  
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (now.getDate() < start.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 11;
    }
  }
  
  return { years, months };
}
