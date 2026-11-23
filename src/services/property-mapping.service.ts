/**
 * Nueways CRM - Property-to-Agent Mapping Service
 *
 * Interacts with backend property mapping endpoints:
 * - GET /api/v1/properties/mappings (ADMIN and MANAGER)
 * - POST /api/v1/properties/mappings (ADMIN only)
 * - DELETE /api/v1/properties/mappings/:id (ADMIN only)
 */

import { api } from './api.js';
import { ApiResponse } from '../types/enquiry.types.js';
import {
  UpsertPropertyMappingPayload,
  PropertyMappingListResponse,
  PropertyMappingSingleResponse,
} from '../types/property-mapping.types.js';

export class PropertyMappingService {
  /**
   * Retrieves all property-to-agent mappings.
   * Authorized for ADMIN and MANAGER roles.
   */
  async listMappings(): Promise<ApiResponse<PropertyMappingListResponse>> {
    return api.get<PropertyMappingListResponse>('/properties/mappings');
  }

  /**
   * Creates or updates a property-to-agent mapping.
   * Strictly restricted to ADMIN role.
   */
  async upsertMapping(
    payload: UpsertPropertyMappingPayload
  ): Promise<ApiResponse<PropertyMappingSingleResponse>> {
    return api.post<PropertyMappingSingleResponse, UpsertPropertyMappingPayload>(
      '/properties/mappings',
      payload
    );
  }

  /**
   * Deletes a property mapping by its ID.
   * Strictly restricted to ADMIN role.
   */
  async deleteMapping(id: string): Promise<ApiResponse<{ id: string }>> {
    return api.delete<{ id: string }>(`/properties/mappings/${id}`);
  }
}

export const propertyMappingService = new PropertyMappingService();
