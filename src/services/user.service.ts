/**
 * Nueways CRM - Frontend User & Employee Provisioning Service
 *
 * Interacts with backend user-management endpoints:
 * - GET /api/v1/users (ADMIN only)
 * - POST /api/v1/users (ADMIN only)
 * - PATCH /api/v1/users/:id/status (ADMIN only)
 */

import { api } from './api.js';
import { ApiResponse } from '../types/enquiry.types.js';
import { EmployeeProfile, CreateEmployeeInput, UpdateEmployeeInput } from '../types/user.types.js';

export class UserService {
  /**
   * Retrieves all registered employees with safe profile fields.
   * Restricted to ADMIN role.
   */
  async listEmployees(): Promise<ApiResponse<EmployeeProfile[]>> {
    return api.get<EmployeeProfile[]>('/users');
  }

  /**
   * Provisions a new MANAGER or SALES employee with an initial temporary password.
   * Restricted to ADMIN role.
   */
  async createEmployee(data: CreateEmployeeInput): Promise<ApiResponse<EmployeeProfile>> {
    return api.post<EmployeeProfile, CreateEmployeeInput>('/users', data);
  }

  /**
   * Updates permitted employee details (name, role, assigned manager, temporary password).
   * Restricted to ADMIN role.
   */
  async updateEmployee(
    userId: string,
    data: UpdateEmployeeInput
  ): Promise<ApiResponse<EmployeeProfile>> {
    return api.patch<EmployeeProfile, UpdateEmployeeInput>(`/users/${userId}`, data);
  }

  /**
   * Toggles employee active/inactive status.
   * When deactivating a MANAGER, accepts optional transfer parameters.
   * Restricted to ADMIN role.
   */
  async updateEmployeeStatus(
    userId: string,
    isActive: boolean,
    options?: {
      transferOption?: 'TRANSFER_TO_MANAGER' | 'ADMIN_HANDLE';
      targetManagerId?: string;
    }
  ): Promise<ApiResponse<EmployeeProfile>> {
    return api.patch<EmployeeProfile, { isActive: boolean; transferOption?: string; targetManagerId?: string }>(
      `/users/${userId}/status`,
      {
        isActive,
        transferOption: options?.transferOption,
        targetManagerId: options?.targetManagerId
      }
    );
  }

  /**
   * Deletes an employee account (MANAGER or SALES).
   * Restricted to ADMIN role.
   */
  async deleteEmployee(userId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/users/${userId}`);
  }
}

export const userService = new UserService();
