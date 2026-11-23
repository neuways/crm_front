/**
 * Neuways CRM - Enquiry Service
 *
 * Interacts with backend enquiry endpoints:
 * - GET /api/v1/enquiries (retrieves active prospect enquiries)
 * - GET /api/v1/enquiries/:id/activities
 */

import { api } from "./api.js";
import {
  IEnquiry,
  PaginationMeta,
  ApiResponse,
  CreateEnquiryInput,
  CreateEnquiryData,
  CreateFollowUpPayload,
  ClientDashboardSummaryData,
  WorkflowStepInput,
  ActiveManagerSummary,
  QualifyLeadInput,
  TeamMemberPerformance,
  EligibleAgentSummary,
  GetDuplicateRecordsResult,
  IFollowUpTaskClient,
  UpdateTaskStatusPayload,
  ClosureType,
  DealLostInput,
  EnableDoNotContactInput,
  RevokeDoNotContactInput,
  DncDetails
} from "../types/enquiry.types.js";

export interface GetEnquiriesResponseData {
  enquiries: IEnquiry[];
  pagination: PaginationMeta;
}

export class EnquiryService {
  /**
   * Registers a new lead enquiry on the backend: POST /api/v1/enquiries.
   * Handles duplicate detection (HTTP 409 Conflict) and input validation (HTTP 400).
   */
  async createEnquiry(
    input: CreateEnquiryInput
  ): Promise<ApiResponse<CreateEnquiryData>> {
    return api.post<CreateEnquiryData, CreateEnquiryInput>("/enquiries", input);
  }

  /**
   * Fetches latest active enquiries from backend.
   */
  async getEnquiries(params?: {
    page?: number;
    limit?: number;
    status?: "ACTIVE" | "CLOSED";
    search?: string;
    excludeCompletedDeals?: boolean;
    completedDeals?: boolean;
    rejected?: boolean;
    dealLost?: boolean;
    closureType?: ClosureType;
    unassigned?: boolean;
    unassignedReason?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<GetEnquiriesResponseData>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.excludeCompletedDeals !== undefined) {
      searchParams.set("excludeCompletedDeals", params.excludeCompletedDeals.toString());
    }
    if (params?.completedDeals !== undefined) {
      searchParams.set("completedDeals", params.completedDeals.toString());
    }
    if (params?.rejected !== undefined) {
      searchParams.set("rejected", params.rejected.toString());
    }
    if (params?.dealLost !== undefined) {
      searchParams.set("dealLost", params.dealLost.toString());
    }
    if (params?.closureType) {
      searchParams.set("closureType", params.closureType);
    }
    if (params?.unassigned !== undefined) {
      searchParams.set("unassigned", params.unassigned.toString());
    }
    if (params?.unassignedReason) {
      searchParams.set("unassignedReason", params.unassignedReason);
    }
    if (params?.assignedTo) {
      searchParams.set("assignedTo", params.assignedTo);
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return api.get<GetEnquiriesResponseData>(`/enquiries${query}`);
  }

  /**
   * Real-time global CRM search across leads by customer name, mobile, and project name.
   * Scoped by role: Sales sees own leads, Manager sees team leads, Admin sees organization-wide.
   */
  async searchLeads(query: string, limit: number = 8): Promise<ApiResponse<GetEnquiriesResponseData>> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        success: true,
        data: {
          enquiries: [],
          pagination: { total: 0, page: 1, limit, totalPages: 0, hasMore: false }
        }
      };
    }
    return this.getEnquiries({
      search: trimmed,
      limit,
      excludeCompletedDeals: false,
    });
  }

  /**
   * Records a follow-up action for an enquiry.
   */
  async createFollowUp(
    enquiryId: string,
    input: CreateFollowUpPayload
  ): Promise<ApiResponse<any>> {
    return api.post<any, CreateFollowUpPayload>(`/enquiries/${enquiryId}/follow-ups`, input);
  }

  /**
   * Retrieves all recorded follow-ups for an enquiry.
   */
  async getFollowUps(enquiryId: string): Promise<ApiResponse<{ followUps: any[] }>> {
    return api.get<{ followUps: any[] }>(`/enquiries/${enquiryId}/follow-ups`);
  }

  /**
   * REQ-22: Updates the status of a specific follow-up task.
   * Path: PATCH /api/v1/enquiries/:id/follow-ups/:taskId/status
   */
  async updateTaskStatus(
    enquiryId: string,
    taskId: string,
    input: UpdateTaskStatusPayload
  ): Promise<ApiResponse<{ task: IFollowUpTaskClient; activity: any }>> {
    return api.patch<{ task: IFollowUpTaskClient; activity: any }, UpdateTaskStatusPayload>(
      `/enquiries/${enquiryId}/follow-ups/${taskId}/status`,
      input
    );
  }

  /**
   * Retrieves aggregated dynamic dashboard summary (KPI metrics & follow-up stage breakdowns).
   */
  async getDashboardSummary(): Promise<ApiResponse<ClientDashboardSummaryData>> {
    return api.get<ClientDashboardSummaryData>("/enquiries/dashboard-summary");
  }

  /**
   * Health check to detect live backend connectivity.
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await api.get<{ status: string }>("/health");
      return res.success === true || (res as any).status === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Retrieves single enquiry details with latest stage, saved plans, and assigned info.
   */
  async getEnquiryById(enquiryId: string): Promise<ApiResponse<{ enquiry: IEnquiry }>> {
    return api.get<{ enquiry: IEnquiry }>(`/enquiries/${enquiryId}`);
  }

  /**
   * Retrieves list of active managers for workflow meeting & site visit assignment.
   */
  async getActiveManagers(): Promise<ApiResponse<{ managers: ActiveManagerSummary[] }>> {
    return api.get<{ managers: ActiveManagerSummary[] }>("/enquiries/managers");
  }

  /**
   * Records a sequential workflow step (Follow-up, Meeting Plan, Site Visit Plan, Deal Done).
   */
  async saveWorkflowStep(
    enquiryId: string,
    input: WorkflowStepInput
  ): Promise<ApiResponse<{ enquiry: IEnquiry; activity?: any }>> {
    return api.patch<{ enquiry: IEnquiry; activity?: any }, WorkflowStepInput>(
      `/enquiries/${enquiryId}/workflow`,
      input
    );
  }

  /**
   * REQ-31: Cancels an active meeting plan.
   * Path: PATCH /api/v1/enquiries/:id/meeting/cancel
   */
  async cancelMeetingPlan(
    enquiryId: string,
    cancellationReason: string
  ): Promise<ApiResponse<{ enquiry: IEnquiry; activity?: any }>> {
    return api.patch<{ enquiry: IEnquiry; activity?: any }, { cancellationReason: string }>(
      `/enquiries/${enquiryId}/meeting/cancel`,
      { cancellationReason }
    );
  }

  /**
   * REQ-31: Cancels an active site visit plan.
   * Path: PATCH /api/v1/enquiries/:id/site-visit/cancel
   */
  async cancelSiteVisitPlan(
    enquiryId: string,
    cancellationReason: string
  ): Promise<ApiResponse<{ enquiry: IEnquiry; activity?: any }>> {
    return api.patch<{ enquiry: IEnquiry; activity?: any }, { cancellationReason: string }>(
      `/enquiries/${enquiryId}/site-visit/cancel`,
      { cancellationReason }
    );
  }

  /**
   * Updates enquiry status (e.g. ACTIVE -> CLOSED) with mandatory closing reason.
   */
  async changeStatus(
    enquiryId: string,
    input: { status: 'ACTIVE' | 'CLOSED'; reason?: string }
  ): Promise<ApiResponse<{ enquiry: IEnquiry; statusChanged: boolean }>> {
    return api.patch<{ enquiry: IEnquiry; statusChanged: boolean }, { status: 'ACTIVE' | 'CLOSED'; reason?: string }>(
      `/enquiries/${enquiryId}/status`,
      input
    );
  }

  /**
   * Marks an active lead as Rejected / Lost with mandatory predefined reason.
   */
  async rejectLead(
    enquiryId: string,
    input: { reason: string; remarks?: string }
  ): Promise<ApiResponse<{ enquiry: IEnquiry; activity?: any }>> {
    return api.patch<{ enquiry: IEnquiry; activity?: any }, { reason: string; remarks?: string }>(
      `/enquiries/${enquiryId}/reject`,
      input
    );
  }

  /**
   * REQ-36: Marks an active lead as Deal Lost with dedicated reason and mandatory remarks.
   */
  async markDealLost(
    enquiryId: string,
    input: DealLostInput
  ): Promise<ApiResponse<{ enquiry: IEnquiry; activity?: any }>> {
    return api.patch<{ enquiry: IEnquiry; activity?: any }, DealLostInput>(
      `/enquiries/${enquiryId}/deal-lost`,
      input
    );
  }

  /**
   * Records lead qualification scoring dimensions and notes for an enquiry.
   */
  async qualifyLead(
    enquiryId: string,
    input: QualifyLeadInput
  ): Promise<ApiResponse<{ enquiry: IEnquiry; qualification: any }>> {
    return api.patch<{ enquiry: IEnquiry; qualification: any }, QualifyLeadInput>(
      `/enquiries/${enquiryId}/qualification`,
      input
    );
  }

  /**
   * Retrieves finalized completed property deals: GET /api/v1/enquiries/completed-deals.
   */
  async getCompletedDeals(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ deals: IEnquiry[]; pagination: PaginationMeta }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return api.get<{ deals: IEnquiry[]; pagination: PaginationMeta }>(`/enquiries/completed-deals${query}`);
  }

  /**
   * Retrieves audit activity timeline for an enquiry.
   */
  async getActivities(enquiryId: string): Promise<ApiResponse<{ activities: any[]; pagination?: PaginationMeta }>> {
    return api.get<{ activities: any[]; pagination?: PaginationMeta }>(`/enquiries/${enquiryId}/activities`);
  }

  /**
   * Assigns or reassigns an enquiry to a sales agent: PATCH /api/v1/enquiries/:id/assign
   */
  async assignLead(
    enquiryId: string,
    assignedTo: string
  ): Promise<ApiResponse<{ enquiry: IEnquiry }>> {
    return api.patch<{ enquiry: IEnquiry }, { assignedTo: string; assignedToId: string }>(
      `/enquiries/${enquiryId}/assign`,
      { assignedTo, assignedToId: assignedTo }
    );
  }

  /**
   * Bulk assigns multiple unassigned or active enquiries: POST /api/v1/enquiries/bulk-assign
   */
  async bulkAssignLeads(
    enquiryIds: string[],
    config: { assignedToId?: string; method?: 'MANUAL' | 'ROUND_ROBIN' }
  ): Promise<ApiResponse<{ assignedCount: number; failedCount: number; message: string; errors?: any[] }>> {
    return api.post<any, any>('/enquiries/bulk-assign', {
      enquiryIds,
      assignedToId: config.assignedToId,
      method: config.method || 'MANUAL'
    });
  }

  /**
   * Retrieves team performance metrics for Manager / Admin: GET /api/v1/enquiries/team
   */
  async getTeamPerformance(): Promise<ApiResponse<{ team: TeamMemberPerformance[] }>> {
    return api.get<{ team: TeamMemberPerformance[] }>("/enquiries/team");
  }

  /**
   * Retrieves team roster and eligible sales agents for Manager / Admin: GET /api/v1/enquiries/team/roster
   */
  async getTeamRoster(): Promise<ApiResponse<{ agents: EligibleAgentSummary[] }>> {
    return api.get<{ agents: EligibleAgentSummary[] }>("/enquiries/team/roster");
  }

  /**
   * Assigns an available sales agent to the authenticated Manager's team: POST /api/v1/enquiries/team/assign
   */
  async assignAgentToTeam(agentId: string): Promise<ApiResponse<{ agent: EligibleAgentSummary }>> {
    return api.post<{ agent: EligibleAgentSummary }, { agentId: string }>("/enquiries/team/assign", { agentId });
  }

  /**
   * Activates or deactivates team membership for an agent: PATCH /api/v1/enquiries/team/members/:agentId/status
   */
  async updateTeamMemberStatus(agentId: string, isTeamActive: boolean): Promise<ApiResponse<{ agent: EligibleAgentSummary }>> {
    return api.patch<{ agent: EligibleAgentSummary }, { isTeamActive: boolean }>(
      `/enquiries/team/members/${agentId}/status`,
      { isTeamActive }
    );
  }

  /**
   * Deletes an enquiry. Restricted to ADMIN role. Finalized deals cannot be deleted.
   */
  async deleteEnquiry(enquiryId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/enquiries/${enquiryId}`);
  }

  /**
   * Retrieves role-scoped duplicate records.
   */
  async getDuplicateRecords(params?: {
    page?: number;
    limit?: number;
    search?: string;
    matchReason?: string;
    includeBulk?: boolean;
    source?: string;
  }): Promise<ApiResponse<GetDuplicateRecordsResult>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.matchReason && params.matchReason !== 'ALL') searchParams.set("matchReason", params.matchReason);
    if (params?.includeBulk !== undefined) searchParams.set("includeBulk", params.includeBulk.toString());
    if (params?.source) searchParams.set("source", params.source);

    return api.get<GetDuplicateRecordsResult>(`/enquiries/duplicates?${searchParams.toString()}`);
  }

  /**
   * Retrieves quick total duplicate count scoped by role.
   */
  async getDuplicateCount(params?: { includeBulk?: boolean; source?: string }): Promise<number> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.includeBulk !== undefined) searchParams.set("includeBulk", params.includeBulk.toString());
      if (params?.source) searchParams.set("source", params.source);
      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const res = await api.get<{ totalCount: number }>(`/enquiries/duplicates/count${queryStr}`);
      if (res.success) {
        if (res.data && typeof res.data.totalCount === 'number') {
          return res.data.totalCount;
        }
        if (res.data && typeof (res.data as any).count === 'number') {
          return (res.data as any).count;
        }
        if (typeof (res as any).count === 'number') {
          return (res as any).count;
        }
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * REQ-38: Enables Do Not Contact restriction for a lead and its normalized mobile.
   * Path: PATCH /api/v1/enquiries/:id/do-not-contact/enable
   */
  async enableDoNotContact(
    enquiryId: string,
    input: EnableDoNotContactInput
  ): Promise<ApiResponse<{ enquiry: IEnquiry; dncRecord?: DncDetails; cancelledTasksCount?: number; affectedEnquiriesCount?: number }>> {
    return api.patch<
      { enquiry: IEnquiry; dncRecord?: DncDetails; cancelledTasksCount?: number; affectedEnquiriesCount?: number },
      EnableDoNotContactInput
    >(`/enquiries/${enquiryId}/do-not-contact/enable`, input);
  }

  /**
   * REQ-38: Revokes Do Not Contact restriction (MANAGER & ADMIN only).
   * Path: PATCH /api/v1/enquiries/:id/do-not-contact/revoke
   */
  async revokeDoNotContact(
    enquiryId: string,
    input: RevokeDoNotContactInput
  ): Promise<ApiResponse<{ enquiry: IEnquiry; dncRecord?: DncDetails; affectedEnquiriesCount?: number }>> {
    return api.patch<
      { enquiry: IEnquiry; dncRecord?: DncDetails; affectedEnquiriesCount?: number },
      RevokeDoNotContactInput
    >(`/enquiries/${enquiryId}/do-not-contact/revoke`, input);
  }

  /**
   * REQ-38: Retrieves Do Not Contact status and history for an enquiry.
   * Path: GET /api/v1/enquiries/:id/do-not-contact
   */
  async getDoNotContactStatus(
    enquiryId: string
  ): Promise<ApiResponse<{ isDoNotContact: boolean; normalizedMobile: string; details?: DncDetails | null }>> {
    return api.get<{ isDoNotContact: boolean; normalizedMobile: string; details?: DncDetails | null }>(
      `/enquiries/${enquiryId}/do-not-contact`
    );
  }
}

export const enquiryService = new EnquiryService();
