/** Maintenance API service */
import { apiClient, ApiClientError } from '../api/client';

export type MaintenanceStatus = 'open' | 'in_progress' | 'closed';

export interface FailureReport {
  id: string;
  line_id: string;
  line_name: string;
  description: string;
  reported_by: string;
  priority?: string;
  status: MaintenanceStatus;
  assigned_to?: string;
  comments?: string;
  photo_urls: string[];
  created_at: string;
  start_time?: string;
  worker_arrived_at?: string;
  completed_at?: string;
  total_duration_minutes?: number;
}

export interface FailureReportCreate {
  line_id: string;
  line_name: string;
  description: string;
  reported_by: string;
  priority?: string;
}

export interface FailureReportUpdate {
  description?: string;
  status?: MaintenanceStatus;
  assigned_to?: string;
  comments?: string;
  photo_urls?: string[];
  worker_arrived_at?: string;
  completed_at?: string;
}

class MaintenanceApiService {
  async getFailureReports(
    statusFilter?: MaintenanceStatus,
    lineId?: string
  ): Promise<FailureReport[]> {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (lineId) params.append('line_id', lineId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<FailureReport[]>(`/maintenance/failure-reports${query}`);
  }

  async getFailureReport(reportId: string): Promise<FailureReport> {
    return apiClient.get<FailureReport>(`/maintenance/failure-reports/${reportId}`);
  }

  async createFailureReport(data: FailureReportCreate): Promise<FailureReport> {
    return apiClient.post<FailureReport>('/maintenance/failure-reports', data);
  }

  async updateFailureReport(
    reportId: string,
    data: FailureReportUpdate
  ): Promise<FailureReport> {
    return apiClient.patch<FailureReport>(`/maintenance/failure-reports/${reportId}`, data);
  }

  async markWorkerArrived(reportId: string): Promise<FailureReport> {
    return apiClient.post<FailureReport>(`/maintenance/failure-reports/${reportId}/worker-arrived`);
  }

  async uploadPhoto(reportId: string, file: File): Promise<FailureReport> {
    return apiClient.upload<FailureReport>(
      `/maintenance/failure-reports/${reportId}/photos`,
      file
    );
  }

  async deleteFailureReport(reportId: string): Promise<void> {
    await apiClient.delete<void>(`/maintenance/failure-reports/${reportId}`);
  }
}

export const maintenanceApi = new MaintenanceApiService();

// Export error class for error handling
export { ApiClientError };




