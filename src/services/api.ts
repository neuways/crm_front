/**
 * Nueways CRM - Central HTTP API Client
 * 
 * Provides type-safe request execution, standardized error interceptors,
 * and seamless fallback handling.
 */

import { ApiResponse } from '../types/enquiry.types.js';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL)) ||
  '/api/v1';

class ApiClient {
  private onUnauthorizedHandler?: () => void;
  private inMemoryToken: string | null = null;

  setToken(token: string | null) {
    this.inMemoryToken = token;
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorizedHandler = handler;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token =
      this.inMemoryToken ||
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('nueways_auth_token')
        : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me') && !endpoint.includes('/auth/logout')) {
          this.onUnauthorizedHandler?.();
        } else if (response.status === 403 && data?.error === 'PasswordChangeRequired') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:password-change-required'));
          }
        } else if (response.status === 502 || response.status === 503) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: response.status, endpoint } }));
          }
        }

        return {
          success: false,
          statusCode: response.status,
          error:
            data?.error ||
            (response.status === 401
              ? 'Unauthorized'
              : response.status === 403
              ? 'Forbidden'
              : response.status === 409
              ? 'Conflict'
              : response.status === 503
              ? 'DatabaseUnavailable'
              : 'HTTP Error'),
          message:
            data?.message ||
            `Request failed with HTTP status ${response.status}`,
          data: data?.data,
          isDuplicate: Boolean(data?.isDuplicate),
          duplicateType: data?.duplicateType,
          isRedFlag: Boolean(data?.isRedFlag || data?.data?.isRedFlag),
          previousEnquiry: data?.previousEnquiry || data?.data?.previousEnquiry,
        };
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-online', { detail: { endpoint } }));
      }

      return {
        success: data?.success !== false,
        statusCode: response.status,
        ...data,
      };
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: 0, error: err, endpoint } }));
      }
      return {
        success: false,
        statusCode: 0,
        error: 'Network Error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to connect to Nueways backend server.',
      };
    }
  }

  async post<T, B = unknown>(
    endpoint: string,
    body: B
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me') && !endpoint.includes('/auth/logout')) {
          this.onUnauthorizedHandler?.();
        } else if (response.status === 403 && data?.error === 'PasswordChangeRequired') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:password-change-required'));
          }
        }

        return {
          success: false,
          statusCode: response.status,
          error:
            data?.error ||
            (response.status === 401
              ? 'Unauthorized'
              : response.status === 403
              ? 'Forbidden'
              : response.status === 409
              ? 'Conflict'
              : 'HTTP Error'),
          message:
            data?.message ||
            `Request failed with HTTP status ${response.status}`,
          data: data?.data,
          isDuplicate: Boolean(data?.isDuplicate),
          duplicateType: data?.duplicateType,
          isRedFlag: Boolean(data?.isRedFlag || data?.data?.isRedFlag),
          previousEnquiry: data?.previousEnquiry || data?.data?.previousEnquiry,
        };
      }

      return {
        success: data?.success !== false,
        statusCode: response.status,
        ...data,
      };
    } catch (err: unknown) {
      return {
        success: false,
        statusCode: 0,
        error: 'Network Error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to connect to Nueways backend server.',
      };
    }
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {};
      const token =
        this.inMemoryToken ||
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('nueways_auth_token')
          : null);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me') && !endpoint.includes('/auth/logout')) {
          this.onUnauthorizedHandler?.();
        } else if (response.status === 403 && data?.error === 'PasswordChangeRequired') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:password-change-required'));
          }
        } else if (response.status === 502 || response.status === 503) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: response.status, endpoint } }));
          }
        }

        return {
          success: false,
          statusCode: response.status,
          error:
            data?.error ||
            (response.status === 400
              ? 'BadRequest'
              : response.status === 401
              ? 'Unauthorized'
              : response.status === 403
              ? 'Forbidden'
              : response.status === 409
              ? 'Conflict'
              : 'HTTP Error'),
          message:
            data?.message ||
            `Request failed with HTTP status ${response.status}`,
          data: data?.data,
        };
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-online', { detail: { endpoint } }));
      }

      return {
        success: data?.success !== false,
        statusCode: response.status,
        ...data,
      };
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: 0, error: err, endpoint } }));
      }
      return {
        success: false,
        statusCode: 0,
        error: 'Network Error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to connect to Nueways backend server.',
      };
    }
  }

  async patch<T, B = unknown>(
    endpoint: string,
    body: B
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/me') && !endpoint.includes('/auth/logout')) {
          this.onUnauthorizedHandler?.();
        } else if (response.status === 403 && data?.error === 'PasswordChangeRequired') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:password-change-required'));
          }
        } else if (response.status === 502 || response.status === 503) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: response.status, endpoint } }));
          }
        }

        return {
          success: false,
          statusCode: response.status,
          error:
            data?.error ||
            (response.status === 401
              ? 'Unauthorized'
              : response.status === 403
              ? 'Forbidden'
              : response.status === 409
              ? 'Conflict'
              : response.status === 503
              ? 'DatabaseUnavailable'
              : 'HTTP Error'),
          message:
            data?.message ||
            `Request failed with HTTP status ${response.status}`,
          data: data?.data,
          isDuplicate: Boolean(data?.isDuplicate),
          duplicateType: data?.duplicateType,
          isRedFlag: Boolean(data?.isRedFlag || data?.data?.isRedFlag),
          previousEnquiry: data?.previousEnquiry || data?.data?.previousEnquiry,
        };
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-online', { detail: { endpoint } }));
      }

      return {
        success: data?.success !== false,
        statusCode: response.status,
        ...data,
      };
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: 0, error: err, endpoint } }));
      }
      return {
        success: false,
        statusCode: 0,
        error: 'Network Error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to connect to Nueways backend server.',
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include',
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.onUnauthorizedHandler?.();
        } else if (response.status === 403 && data?.error === 'PasswordChangeRequired') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:password-change-required'));
          }
        } else if (response.status === 502 || response.status === 503) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: response.status, endpoint } }));
          }
        }

        return {
          success: false,
          statusCode: response.status,
          error:
            data?.error ||
            (response.status === 401
              ? 'Unauthorized'
              : response.status === 403
              ? 'Forbidden'
              : response.status === 404
              ? 'Not Found'
              : response.status === 503
              ? 'DatabaseUnavailable'
              : 'HTTP Error'),
          message:
            data?.message ||
            `Request failed with HTTP status ${response.status}`,
          data: data?.data,
        };
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-online', { detail: { endpoint } }));
      }

      return {
        success: data?.success !== false,
        statusCode: response.status,
        ...data,
      };
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nueways:network-offline', { detail: { statusCode: 0, error: err, endpoint } }));
      }
      return {
        success: false,
        statusCode: 0,
        error: 'Network Error',
        message:
          err instanceof Error
            ? err.message
            : 'Unable to connect to Nueways backend server.',
      };
    }
  }
}

export const api = new ApiClient();
