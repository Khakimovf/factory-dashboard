/**
 * Attendance Service
 * Reusable service for counting unique employees from attendance/turnstile logs
 * Used by Canteen module and potentially other modules
 */

export interface TurnstileLog {
  employeeId: string;
  employeeName: string;
  timestamp: string; // ISO datetime string
  type: 'entry' | 'exit';
  shift?: string; // Optional shift information
}

export interface AttendanceCount {
  totalEmployees: number;
  beforeCutoff: number; // Employees entered before 09:00
  afterCutoff: number; // Employees entered after 09:00
  byShift: Record<string, number>; // Count by shift if available
}

/**
 * Count unique employees who entered today
 * Only first entry of the day counts
 * @param logs - Array of turnstile logs
 * @param cutoffTime - Time string "HH:MM" (default: "09:00")
 * @param startTime - Time string "HH:MM" (default: "06:00")
 * @returns AttendanceCount object
 */
export function countUniqueEmployeesToday(
  logs: TurnstileLog[],
  cutoffTime: string = '09:00',
  startTime: string = '06:00'
): AttendanceCount {
  const today = new Date().toISOString().split('T')[0];
  const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
  const [startHour, startMinute] = startTime.split(':').map(Number);

  // Filter today's entry logs only
  const todayEntries = logs.filter(log => {
    if (log.type !== 'entry') return false;
    const logDate = new Date(log.timestamp).toISOString().split('T')[0];
    return logDate === today;
  });

  // Get first entry per employee
  const firstEntryMap = new Map<string, TurnstileLog>();
  todayEntries.forEach(log => {
    const existing = firstEntryMap.get(log.employeeId);
    if (!existing || new Date(log.timestamp) < new Date(existing.timestamp)) {
      firstEntryMap.set(log.employeeId, log);
    }
  });

  const uniqueEmployees = Array.from(firstEntryMap.values());

  // Count by time window
  let beforeCutoff = 0;
  let afterCutoff = 0;
  const byShift: Record<string, number> = {};

  uniqueEmployees.forEach(log => {
    const logTime = new Date(log.timestamp);
    const logHour = logTime.getHours();
    const logMinute = logTime.getMinutes();

    // Check if entry is within valid time window (after startTime)
    const logTimeMinutes = logHour * 60 + logMinute;
    const startTimeMinutes = startHour * 60 + startMinute;
    const cutoffTimeMinutes = cutoffHour * 60 + cutoffMinute;

    if (logTimeMinutes < startTimeMinutes) {
      // Entry before start time window, skip
      return;
    }

    if (logTimeMinutes < cutoffTimeMinutes) {
      beforeCutoff++;
    } else {
      afterCutoff++;
    }

    // Determine shift based on entry time if not provided
    // Morning: 06:00-14:00, Afternoon: 14:00-22:00, Night: 22:00-06:00
    let shift = log.shift;
    if (!shift) {
      if (logHour >= 6 && logHour < 14) {
        shift = 'Morning';
      } else if (logHour >= 14 && logHour < 22) {
        shift = 'Afternoon';
      } else {
        shift = 'Night';
      }
    }

    // Count by shift
    if (shift) {
      byShift[shift] = (byShift[shift] || 0) + 1;
    }
  });

  return {
    totalEmployees: beforeCutoff + afterCutoff,
    beforeCutoff,
    afterCutoff,
    byShift,
  };
}

/**
 * Generate mock turnstile logs for testing
 * TODO: Replace with actual API call when backend is ready
 */
export function generateMockTurnstileLogs(): TurnstileLog[] {
  const today = new Date().toISOString().split('T')[0];
  const logs: TurnstileLog[] = [];
  
  // Mock employee list (in real system, this would come from HR module)
  const mockEmployees = [
    { id: 'EMP-001', name: 'Aliyev Sardor', shift: 'Morning' },
    { id: 'EMP-002', name: 'Karimov Alisher', shift: 'Morning' },
    { id: 'EMP-003', name: 'Toshmatov Bahodir', shift: 'Morning' },
    { id: 'EMP-004', name: 'Rahimov Olim', shift: 'Afternoon' },
    { id: 'EMP-005', name: 'Yusupov Farhod', shift: 'Morning' },
    { id: 'EMP-006', name: 'Nazarov Javohir', shift: 'Morning' },
    { id: 'EMP-007', name: 'Ismoilov Rustam', shift: 'Afternoon' },
    { id: 'EMP-008', name: 'Valiyev Akmal', shift: 'Morning' },
  ];

  mockEmployees.forEach((emp, index) => {
    // Simulate entry times: most between 06:00-09:00, some after 09:00
    const hour = index < 6 ? 7 + Math.floor(Math.random() * 2) : 9 + Math.floor(Math.random() * 2);
    const minute = Math.floor(Math.random() * 60);
    const entryTime = new Date(`${today}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);

    logs.push({
      employeeId: emp.id,
      employeeName: emp.name,
      timestamp: entryTime.toISOString(),
      type: 'entry',
      shift: emp.shift,
    });

    // Simulate exit time (end of day)
    const exitHour = 17 + Math.floor(Math.random() * 2);
    const exitMinute = Math.floor(Math.random() * 60);
    const exitTime = new Date(`${today}T${String(exitHour).padStart(2, '0')}:${String(exitMinute).padStart(2, '0')}:00`);

    logs.push({
      employeeId: emp.id,
      employeeName: emp.name,
      timestamp: exitTime.toISOString(),
      type: 'exit',
      shift: emp.shift,
    });
  });

  return logs;
}
