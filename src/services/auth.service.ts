/**
 * Nueways CRM - Frontend Authentication Service
 * 
 * Interacts with backend authentication endpoints:
 * - POST /api/v1/auth/login (Authenticates employee credentials & issues 8-hour access token)
 */

import { api } from './api.js';
import { ApiResponse } from '../types/enquiry.types.js';
import { LoginCredentials, LoginResponseData } from '../types/auth.types.js';

export class AuthService {
  /**
   * Submits employee credentials to backend login endpoint.
   * On success: Returns signed 8-hour Bearer JWT access token and user profile.
   * On failure: Returns standardized 400 (validation) or 401 (invalid/deactivated) error envelope.
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    return api.post<LoginResponseData, LoginCredentials>('/auth/login', credentials);
  }

  /**
   * Submits verified Google ID token to backend for employee authentication.
   * Enforces that the CRM account already exists in MongoDB and reads trusted role from database.
   */
  async loginWithGoogle(idToken: string): Promise<ApiResponse<LoginResponseData>> {
    return api.post<LoginResponseData, { idToken: string }>('/auth/google', { idToken });
  }

  /**
   * Updates employee password (e.g. upon first-time login or routine update).
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return api.post<void, { oldPassword: string; newPassword: string }>('/auth/change-password', {
      oldPassword,
      newPassword
    });
  }
}

export const authService = new AuthService();
