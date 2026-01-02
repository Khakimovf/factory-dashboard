/** Maintenance API service */
const API_BASE_URL = 'http://localhost:8000/api/v1/maintenance';

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
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getFailureReports(
    statusFilter?: MaintenanceStatus,
    lineId?: string
  ): Promise<FailureReport[]> {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status_filter', statusFilter);
    if (lineId) params.append('line_id', lineId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<FailureReport[]>(`/failure-reports${query}`);
  }

  async getFailureReport(reportId: string): Promise<FailureReport> {
    return this.request<FailureReport>(`/failure-reports/${reportId}`);
  }

  async createFailureReport(data: FailureReportCreate): Promise<FailureReport> {
    return this.request<FailureReport>('/failure-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFailureReport(
    reportId: string,
    data: FailureReportUpdate
  ): Promise<FailureReport> {
    return this.request<FailureReport>(`/failure-reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async markWorkerArrived(reportId: string): Promise<FailureReport> {
    return this.request<FailureReport>(`/failure-reports/${reportId}/worker-arrived`, {
      method: 'POST',
    });
  }

  async uploadPhoto(reportId: string, file: File): Promise<FailureReport> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/failure-reports/${reportId}/photos`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async deleteFailureReport(reportId: string): Promise<void> {
    await this.request<void>(`/failure-reports/${reportId}`, {
      method: 'DELETE',
    });
  }
}

export const maintenanceApi = new MaintenanceApiService();

