/** Error handling utilities */
import { ApiClientError } from '../api/client';

export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    return error.data.message || error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof ApiClientError && error.status === 0;
};

export const isNotFoundError = (error: unknown): boolean => {
  return error instanceof ApiClientError && error.status === 404;
};

export const isValidationError = (error: unknown): boolean => {
  return error instanceof ApiClientError && error.status === 422;
};

