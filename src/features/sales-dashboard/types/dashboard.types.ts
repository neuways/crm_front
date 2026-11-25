import { FollowUpOutcome } from '../../../types/enquiry.types.js';

/**
 * Sales Dashboard Data Contracts
 * Strictly derived from the company-defined sections and Stitch layout.
 */

export type DashboardPeriod = 'today' | 'week' | 'month';

export interface DashboardKpiMetric {
  id: string;
  title: string;
  subtitle: string;
  value: number;
  badgeText: string;
  badgeType: 'positive' | 'warning' | 'info' | 'neutral';
  isMockData: boolean;
}

export interface NewLeadItem {
  id: string;
  srNo: string;
  name: string;
  initials: string;
  avatarColor: string;
  mobile: string;
  price: string;
  remark: string;
  isMockData: boolean;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    managerName?: string | null;
    managerId?: string | { id?: string; _id?: string; name?: string; role?: string } | null;
  } | null;
  status?: 'ACTIVE' | 'CLOSED';
  currentStage?: 'FOLLOW_UP' | 'MEETING_PLAN' | 'SITE_VISIT_PLAN' | 'DEAL_DONE';
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  lastFollowUpOutcome?: FollowUpOutcome;
  lastFollowUpAt?: string;
  projectName?: string;
  isDoNotContact?: boolean;
}

export interface FollowUpStageItem {
  stage: string;
  contacted: number | 'N/A' | string;
  detailShared: number | 'N/A' | string;
  meeting?: number | 'N/A' | string;
  siteVisit?: number | 'N/A' | string;
}

export interface PendingFollowUpData {
  title: string;
  badgeText: string;
  subtitle: string;
  stages: FollowUpStageItem[];
}

export interface FutureFollowUpData {
  title: string;
  badgeText: string;
  subtitle: string;
  stages: FollowUpStageItem[];
}

export interface LeadQualificationMatrix {
  title: string;
  subtitle: string;
  percentages: Array<'10%' | '20%' | '50%' | '70%' | '80%' | '100%'>;
  hotRow: {
    values: number[]; // exactly 6 values matching percentages
  };
  possRow: {
    values: number[]; // exactly 6 values matching percentages
  };
  isPopulated?: boolean;
  totalActiveLeads?: number;
  scoredLeadsCount?: number;
  unscoredLeadsCount?: number;
  hotCount?: number;
  possCount?: number;
  scoredPercentage?: number;
  leads?: Array<{
    id: string;
    name: string;
    currentStage: string;
    priority: 'HOT' | 'POSSIBLE';
    readinessScore: number;
    scoreLabel: string;
    calculatedScore: number;
    budgetStatus?: string;
    timeline?: string;
    decisionMaker?: string;
    needClarity?: string;
    notes?: string;
  }>;
}
