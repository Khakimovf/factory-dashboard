/** API client with interceptors and error handling */
import { API_CONFIG, getApiUrl } from './config';

export interface ApiError {
  message: string;
  detail?: string;
  type?: string;
  errors?: any[];
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public data: ApiError,
    message?: string
  ) {
    super(message || data.message || 'API request failed');
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new ApiClientError(
            response.status,
            { message: `HTTP error! status: ${response.status}` },
            `Request failed with status ${response.status}`
          );
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorData = data.error || data;
        throw new ApiClientError(
          response.status,
          errorData,
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiClientError(
          0,
          { message: 'Network error. Please check your connection.' },
          'Network request failed'
        );
      }

      throw new ApiClientError(
        500,
        { message: 'An unexpected error occurred' },
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  async upload<T>(
    endpoint: string,
    file: File,
    options?: RequestInit
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, browser will set it with boundary
          ...(options?.headers as Record<string, string>),
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new ApiClientError(
            response.status,
            { message: `HTTP error! status: ${response.status}` },
            `Upload failed with status ${response.status}`
          );
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorData = data.error || data;
        throw new ApiClientError(
          response.status,
          errorData,
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new ApiClientError(
          0,
          { message: 'Network error. Please check your connection.' },
          'Network request failed'
        );
      }

      throw new ApiClientError(
        500,
        { message: 'An unexpected error occurred during upload' },
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}

export const apiClient = new ApiClient();

