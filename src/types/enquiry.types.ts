/**
 * Enquiry and Activity contracts mirroring backend source code:
 * server/src/types/enquiry.types.ts & models
 */

export type PreferredContactMethod = 'CALL' | 'WHATSAPP' | 'EMAIL';
export type EnquiryStatus = 'ACTIVE' | 'CLOSED';
export type WorkflowStage = 'FOLLOW_UP' | 'MEETING_PLAN' | 'SITE_VISIT_PLAN' | 'DEAL_DONE';
export type ClosureType = 'REJECTED' | 'DEAL_LOST';

export const PREDEFINED_REJECTION_REASONS = [
  'Budget too high',
  'Property not suitable',
  'Location issue',
  'Payment/loan issue',
  'Chose another property/competitor',
  'Not interested',
  'Other'
] as const;

export type RejectionReason = typeof PREDEFINED_REJECTION_REASONS[number];

/**
 * REQ-36: Dedicated Predefined Reasons for Lead Rejection
 */
export const REJECTED_REASONS = [
  'Not interested',
  'Location issue',
  'Budget mismatch',
  'Budget too high',
  'Property not suitable',
  'Invalid enquiry',
  'Other'
] as const;

export type RejectedReason = typeof REJECTED_REASONS[number];

/**
 * REQ-36: Dedicated Predefined Reasons for Deal Lost
 */
export const DEAL_LOST_REASONS = [
  'Chose another property/competitor',
  'Chose another property / competitor',
  'Payment/loan issue',
  'Payment / loan issue',
  'Pricing issue',
  'Property preference changed',
  'Other'
] as const;

export type DealLostReason = typeof DEAL_LOST_REASONS[number];

export interface IRejectionDetails {
  closureType?: ClosureType;
  reason: string;
  remarks?: string;
  rejectedBy?: string | { id: string; name: string; email?: string; role?: string };
  rejectedByName?: string;
  rejectedAt: string;
  previousStage: WorkflowStage;
}

export interface RejectEnquiryInput {
  reason: RejectionReason | string;
  remarks?: string;
}

export interface DealLostInput {
  reason: DealLostReason | string;
  remarks: string;
}

export interface ICancellationHistoryItem {
  cancellationReason: string;
  cancelledAt: string | Date;
  cancelledBy?: string | null;
  cancelledByName?: string;
  previousDate?: string;
  previousTime?: string;
}

export interface IMeetingPlan {
  meetingPlace?: string;
  meetingDate?: string;
  meetingTime?: string;
  projectDetails?: string;
  managerId?: string | null;
  managerName?: string;
  remarks?: string;
  meetingResult?: string;
  isCompleted: boolean;
  completedAt?: string;
  updatedAt?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string | null;
  cancelledByName?: string;
  previousDate?: string;
  previousTime?: string;
  cancellationHistory?: ICancellationHistoryItem[];
}

export interface ISiteVisitPlan {
  siteVisitAddress?: string;
  siteVisitDate?: string;
  siteVisitTime?: string;
  projectName?: string;
  managerId?: string | null;
  managerName?: string;
  remarks?: string;
  visitOutcome?: string;
  isCompleted: boolean;
  completedAt?: string;
  updatedAt?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string | null;
  cancelledByName?: string;
  previousDate?: string;
  previousTime?: string;
  cancellationHistory?: ICancellationHistoryItem[];
}

export interface IDealDone {
  project?: string;
  propertyType?: string;
  price?: number;
  size?: string;
  remarks?: string;
  isConfirmed: boolean;
  confirmedAt?: string;
}

export type BudgetStatus = 'VERIFIED_BUDGET' | 'LOAN_PRE_APPROVED' | 'STRETCH_BUDGET' | 'UNCONFIRMED';
export type PurchaseTimeline = 'IMMEDIATE' | 'WITHIN_30_DAYS' | 'WITHIN_90_DAYS' | 'ABOVE_90_DAYS';
export type DecisionMaker = 'SOLE_DECISION_MAKER' | 'JOINT_DECISION_MAKER' | 'INFLUENCER_ONLY';
export type RequirementClarity = 'SPECIFIC_UNIT_TYPE' | 'GENERAL_REQUIREMENT' | 'EXPLORATORY';
export type LeadPriority = 'HOT' | 'POSSIBLE';
export type ReadinessPercentage = '10%' | '20%' | '50%' | '70%' | '80%' | '100%';

export interface ILeadQualification {
  budgetStatus?: BudgetStatus;
  timeline?: PurchaseTimeline;
  decisionMaker?: DecisionMaker;
  needClarity?: RequirementClarity;
  priority?: LeadPriority;
  readinessScore?: number;
  scoreLabel?: ReadinessPercentage;
  calculatedScore?: number;
  notes?: string;
  isQualified: boolean;
  qualifiedAt?: string;
  qualifiedBy?: string;
  qualifiedByName?: string;
}

export interface IEnquiry {
  id: string;
  _id?: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email?: string;
  normalizedEmail?: string;
  projectName?: string;
  preferredLocation?: string;
  requirement?: string;
  budgetMin?: number;
  budgetMax?: number;
  description?: string;
  source?: string;
  preferredContactMethod?: PreferredContactMethod;
  preferredContactTiming?: string;
  status: EnquiryStatus;
  isActive: boolean;
  isDoNotContact?: boolean;
  assignedTo?: string | { id: string; name: string; email?: string; role?: string };
  assignedToName?: string;
  unassignedReason?: string;
  managerId?: string | null;
  currentStage?: WorkflowStage;
  meetingPlan?: IMeetingPlan;
  siteVisitPlan?: ISiteVisitPlan;
  dealDone?: IDealDone;
  qualification?: ILeadQualification;
  rejection?: IRejectionDetails;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnquiryInput {
  name: string;
  mobile: string;
  email?: string;
  projectName?: string;
  preferredLocation?: string;
  requirement?: string;
  budgetMin?: number;
  budgetMax?: number;
  description?: string;
  source?: string;
  preferredContactMethod?: PreferredContactMethod;
  preferredContactTiming?: string;
  assignedToId?: string | null;
  assignmentMethod?: 'ROUND_ROBIN' | 'MANUAL';
  allowReEnquiry?: boolean;
  previousEnquiryId?: string;
  isBulkUpload?: boolean;
}

export interface PreviousEnquirySummary {
  id: string;
  customerName: string;
  mobile: string;
  email?: string;
  previousProject?: string;
  previousAssignedAgent?: string;
  previousManager?: string;
  previousStatus: 'Deal Done' | 'Rejected';
  previousBudget?: string;
  previousEnquiryDate?: string;
  previousRemarks?: string;
}

export interface DuplicateRecordItem {
  id: string;
  createdAt: string;
  matchReason: 'MOBILE' | 'EMAIL' | 'BOTH';
  performedByName: string;
  performedById?: string | null;
  source?: string;
  reviewStatus?: 'PENDING_REVIEW' | 'REVIEWED' | 'REOPENED' | 'DISMISSED';
  duplicateReference?: string;
  importId?: string;
  importRowNumber?: number;
  attemptedLead: {
    name: string;
    mobile: string;
    email?: string;
    projectName?: string;
    source?: string;
  };
  previousEnquiry: {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    projectName?: string;
    status: 'ACTIVE' | 'CLOSED';
    currentStage?: string;
    isDealDone: boolean;
    isRejected: boolean;
    rejectionReason?: string;
    assignedTo?: {
      id: string;
      name: string;
      role: string;
    } | null;
    createdAt: string;
    remarks?: string;
  };
}

export interface GetDuplicateRecordsResult {
  duplicateRecords: DuplicateRecordItem[];
  totalCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type DuplicateType =
  | 'MOBILE_MATCH'
  | 'EMAIL_MATCH'
  | 'BOTH_FIELDS_MATCH'
  | 'CROSS_FIELD_MATCH'
  | 'CONCURRENT_COLLISION';

export interface MatchedEnquirySummary {
  id: string;
  name: string;
  status: EnquiryStatus;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string;
  matchReason: 'MOBILE' | 'EMAIL' | 'BOTH';
}

export interface DuplicateMatches {
  mobileMatch?: IEnquiry | MatchedEnquirySummary;
  emailMatch?: IEnquiry | MatchedEnquirySummary;
}

export interface CreateEnquiryData {
  enquiry?: IEnquiry;
  matches?: DuplicateMatches;
  matchedEnquiries?: MatchedEnquirySummary[];
  isRedFlag?: boolean;
  hasActiveLead?: boolean;
  previousEnquiry?: PreviousEnquirySummary;
  isReEnquiry?: boolean;
}

export type ActivityType =
  | 'REMARK_ADDED'
  | 'ASSIGNMENT_CHANGED'
  | 'STATUS_CHANGED'
  | 'DUPLICATE_MATCH_DETECTED';

export interface IEnquiryActivity {
  id: string;
  enquiryId: string;
  performedBy: string;
  performedByName: string;
  createdById?: string;
  createdByName?: string;
  type: ActivityType;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginationMeta {
  total: number;
  totalCount?: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
  error?: string;
  isDuplicate?: boolean;
  duplicateType?: DuplicateType;
  isRedFlag?: boolean;
  previousEnquiry?: PreviousEnquirySummary;
}

export type FollowUpOutcome =
  | 'CONNECTED'
  | 'NO_ANSWER'
  | 'CALL_BACK_REQUESTED'
  | 'MEETING_SCHEDULED'
  | 'NOT_INTERESTED'
  | 'OTHER';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface TaskStatusCounts {
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
}

export interface IFollowUpTaskClient {
  _id: string;
  enquiryId: string;
  assignedTo: string | { _id: string; name: string; email?: string; role?: string };
  purpose: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'SITE_VISIT' | 'OTHER';
  followUpDate: string;
  followUpTime: string;
  notes?: string;
  status: TaskStatus;
  outcome?: FollowUpOutcome;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  isInitialTask?: boolean;
  cancellationReason?: string;
  previousStatus?: TaskStatus;
  previousFollowUpDate?: string;
  previousFollowUpTime?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
  notes?: string;
  cancellationReason?: string;
  followUpDate?: string;
  followUpTime?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
}

export interface CreateFollowUpPayload {
  purpose: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'SITE_VISIT' | 'OTHER';
  followUpDate: string;
  followUpTime: string;
  notes: string;
  status?: TaskStatus;
  outcome?: FollowUpOutcome;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  leadStatus?: 'ACTIVE' | 'CLOSED';
  closingReason?: string;
}

export interface ClientFollowUpStageSummary {
  stage: string;
  contacted: number | 'N/A' | string;
  detailShared: number | 'N/A' | string;
  meeting?: number | 'N/A' | string;
  siteVisit?: number | 'N/A' | string;
}

export interface ScoredLeadClientSummary {
  id: string;
  name: string;
  currentStage: string;
  priority: LeadPriority;
  readinessScore: number;
  scoreLabel: ReadinessPercentage;
  calculatedScore: number;
  budgetStatus?: BudgetStatus;
  timeline?: PurchaseTimeline;
  decisionMaker?: DecisionMaker;
  needClarity?: RequirementClarity;
  notes?: string;
}

export interface ClientDashboardSummaryData {
  dailyVelocity: number;
  pendingFollowUpsCount: number;
  futureFollowUpsCount: number;
  activePipelineCount: number;
  completedDealsCount?: number;
  rejectedCount?: number;
  dealLostCount?: number;
  explicitRejectedCount?: number;
  legacyClosedCount?: number;
  activeAgentsCount?: number;
  teamMembersCount?: number;
  stageBreakdown?: {
    followUp: number;
    meetingPlan: number;
    siteVisitPlan: number;
    dealDone: number;
  };
  pendingStages: ClientFollowUpStageSummary[];
  futureStages: ClientFollowUpStageSummary[];
  qualificationMatrix: {
    isPopulated: boolean;
    percentages: Array<'10%' | '20%' | '50%' | '70%' | '80%' | '100%'>;
    hotRow: { values: number[] };
    possRow: { values: number[] };
    totalActiveLeads?: number;
    scoredLeadsCount?: number;
    unscoredLeadsCount?: number;
    hotCount?: number;
    possCount?: number;
    scoredPercentage?: number;
    leads?: ScoredLeadClientSummary[];
  };
  taskStatusCounts?: TaskStatusCounts;
}

export interface TeamMemberPerformance {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isTeamActive?: boolean;
  activeLeadsCount: number;
  stageWorkload: {
    followUp: number;
    meetingPlan: number;
    siteVisitPlan: number;
  };
  pendingFollowUpsCount: number;
  futureFollowUpsCount: number;
  completedDealsCount: number;
  rejectedCount: number;
  dealLostCount?: number;
  legacyClosedCount?: number;
}

export interface GetTeamPerformanceResponse {
  success: boolean;
  data: {
    team: TeamMemberPerformance[];
  };
  message?: string;
}

export interface QualifyLeadInput {
  budgetStatus?: BudgetStatus;
  timeline?: PurchaseTimeline;
  decisionMaker?: DecisionMaker;
  needClarity?: RequirementClarity;
  priority?: LeadPriority;
  readinessScore?: number;
  scoreLabel?: ReadinessPercentage;
  notes?: string;
}

export interface ActiveManagerSummary {
  id: string;
  name: string;
  email: string;
}

export interface WorkflowStepInput {
  step: WorkflowStage;
  // Step 1: Follow-up
  purpose?: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'SITE_VISIT' | 'OTHER';
  outcome?: FollowUpOutcome;
  followUpDate?: string;
  followUpTime?: string;
  notes?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  enquiryUpdate?: {
    projectName?: string;
    preferredLocation?: string;
    requirement?: string;
    budgetMin?: number;
    budgetMax?: number;
    description?: string;
  };
  // Step 2: Meeting Plan
  meetingPlace?: string;
  meetingDate?: string;
  meetingTime?: string;
  projectDetails?: string;
  managerId?: string | null;
  remarks?: string;
  meetingResult?: string;
  // Step 3: Site Visit Plan
  siteVisitAddress?: string;
  siteVisitDate?: string;
  siteVisitTime?: string;
  projectName?: string;
  visitOutcome?: string;
  // Step 4: Deal Done
  project?: string;
  propertyType?: string;
  price?: number;
  size?: string;
  isConfirmed?: boolean;
  // Common Controls
  action?: 'SAVE' | 'CANCEL' | 'RESCHEDULE';
  isCancelled?: boolean;
  cancellationReason?: string;
  isCompleted?: boolean;
  advanceStage?: boolean;
  leadStatus?: 'ACTIVE' | 'CLOSED';
  closingReason?: string;
}

export type TeamMembershipStatusLabel =
  | 'Available'
  | 'Assigned to your team'
  | 'Deactivated in your team'
  | 'Assigned to another team';

export interface EligibleAgentSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isTeamActive: boolean;
  managerId: string | null;
  managerName: string | null;
  canAssign: boolean;
  isAssignedToCurrentManager: boolean;
  statusLabel: TeamMembershipStatusLabel;
}

export interface GetTeamRosterResponse {
  success: boolean;
  data: {
    agents: EligibleAgentSummary[];
  };
  message?: string;
}

/**
 * REQ-38: Do Not Contact (DNC) Types and Interfaces
 */
export const DNC_ACTIVATION_REASONS = [
  'CUSTOMER_EXPLICITLY_REQUESTED',
  'LEGAL_REGULATORY_OPT_OUT',
  'OTHER'
] as const;

export type DncActivationReason = typeof DNC_ACTIVATION_REASONS[number];

export const DNC_ACTIVATION_REASON_LABELS: Record<DncActivationReason, string> = {
  CUSTOMER_EXPLICITLY_REQUESTED: 'Customer Explicitly Requested',
  LEGAL_REGULATORY_OPT_OUT: 'Legal / Regulatory Opt-Out',
  OTHER: 'Other'
};

export const DNC_REVOCATION_REASONS = [
  'CUSTOMER_RENEWED_CONSENT',
  'MANAGER_OVERRIDE',
  'OTHER'
] as const;

export type DncRevocationReason = typeof DNC_REVOCATION_REASONS[number];

export const DNC_REVOCATION_REASON_LABELS: Record<DncRevocationReason, string> = {
  CUSTOMER_RENEWED_CONSENT: 'Customer Renewed Consent',
  MANAGER_OVERRIDE: 'Manager Override',
  OTHER: 'Other'
};

export interface EnableDoNotContactInput {
  reason: string;
  remarks: string;
}

export interface RevokeDoNotContactInput {
  reason: string;
  remarks: string;
}

export interface IDncHistoryEntry {
  action: 'ENABLED' | 'REVOKED';
  reason: string;
  remarks: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  previousState: boolean;
  newState: boolean;
}

export interface DncDetails {
  normalizedMobile: string;
  isDoNotContact: boolean;
  reason?: string;
  remarks?: string;
  activatedBy?: string;
  activatedByName?: string;
  activatedAt?: string;
  revocationReason?: string;
  revocationRemarks?: string;
  revokedBy?: string;
  revokedByName?: string;
  revokedAt?: string;
  history?: IDncHistoryEntry[];
}

export interface DoNotContactResponse {
  success: boolean;
  message: string;
  data: {
    enquiry?: IEnquiry;
    dncRecord?: DncDetails;
    cancelledTasksCount?: number;
    affectedEnquiriesCount?: number;
  };
}

export interface GetDoNotContactResponse {
  success: boolean;
  data: {
    isDoNotContact: boolean;
    normalizedMobile: string;
    details?: DncDetails | null;
  };
  message?: string;
}

