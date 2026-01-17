/**
 * Service for managing Late Arrival Reports
 * TODO: Replace with actual API calls when backend is ready
 */

import { LateArrivalReport, mockLateReports } from '../data/lateReportsData';

// In-memory storage (will be replaced with API calls)
let reports: LateArrivalReport[] = [...mockLateReports];

/**
 * Get all late arrival reports (latest first)
 * GET /api/hr/late-reports
 */
export async function getLateReports(): Promise<LateArrivalReport[]> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/hr/late-reports');
  // if (!response.ok) throw new Error('Failed to fetch late reports');
  // return response.json();
  
  // Sort by created_at descending (latest first)
  return [...reports].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Update late arrival report status
 * PATCH /api/hr/late-reports/:id
 */
export async function updateLateReportStatus(
  id: string,
  status: 'approved' | 'rejected'
): Promise<LateArrivalReport> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/hr/late-reports/${id}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ status }),
  // });
  // if (!response.ok) throw new Error('Failed to update late report');
  // return response.json();
  
  // Find and update the report
  const report = reports.find(r => r.id === id);
  if (!report) {
    throw new Error(`Late report with id ${id} not found`);
  }
  
  report.status = status;
  return report;
}

/**
 * Submit a new late arrival report (used by employees)
 * POST /api/attendance/late-report
 */
export async function submitLateReport(report: Omit<LateArrivalReport, 'id' | 'created_at' | 'status'>): Promise<LateArrivalReport> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/attendance/late-report', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(report),
  // });
  // if (!response.ok) throw new Error('Failed to submit late report');
  // return response.json();
  
  // Create new report
  const newReport: LateArrivalReport = {
    ...report,
    id: `LR-${String(reports.length + 1).padStart(3, '0')}`,
    created_at: new Date().toISOString(),
    status: 'new',
  };
  
  reports.push(newReport);
  return newReport;
}
