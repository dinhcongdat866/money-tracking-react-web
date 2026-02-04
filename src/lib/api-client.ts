/**
 * API Client Utilities
 * 
 * Centralized fetch wrapper with error handling and type safety
 */

import {
  ApiError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
} from './api-errors';

export type ApiResponse<T> = {
  data: T;
  error?: never;
} | {
  data?: never;
  error: ApiError;
};

/**
 * Enhanced fetch wrapper with error handling
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Handle different status codes
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorDetails: unknown;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      switch (response.status) {
        case 400:
          throw new ValidationError(errorMessage, undefined, errorDetails);
        case 401:
          throw new UnauthorizedError(errorMessage);
        case 403:
          throw new ForbiddenError(errorMessage);
        case 404:
          throw new NotFoundError('Resource', undefined);
        default:
          throw new ApiError(errorMessage, response.status, 'API_ERROR', errorDetails);
      }
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      // Some endpoints might return empty body (e.g., DELETE)
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network request failed', error);
    }

    // Re-throw unknown errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      'UNKNOWN_ERROR',
      error,
    );
  }
}

/**
 * Type-safe API request helper
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(url, options);
}

