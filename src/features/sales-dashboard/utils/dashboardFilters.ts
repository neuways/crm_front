import { DashboardPeriod, NewLeadItem } from '../types/dashboard.types.js';
import { getFollowUpOutcomeMeta } from '../../../utils/followUpOutcome.js';

export interface TableFilterState {
  stage: string;
  status: string;
  agent: string;
  followUp: string;
  outcome?: string;
}

/**
 * Checks if a given ISO date string falls within the specified dashboard period.
 * Periods are calculated against local system time.
 */
export const isWithinPeriod = (
  dateString: string | undefined | null,
  period: DashboardPeriod
): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'today') {
    return date >= startOfToday && date <= endOfToday;
  }

  if (period === 'week') {
    // Current week: Monday 00:00:00 to Sunday 23:59:59
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    return date >= startOfWeek && date <= endOfWeek;
  }

  if (period === 'month') {
    // Current calendar month: 1st 00:00:00 to last day 23:59:59
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return date >= startOfMonth && date <= endOfMonth;
  }

  return true;
};

/**
 * Evaluates whether a lead matches the selected dashboard date period (Today / This Week / This Month).
 * A lead matches if its creation date or next follow-up date falls within the period.
 * Visual demonstration dataset records (isMockData: true) are always preserved.
 */
export const matchesDatePeriod = (lead: NewLeadItem, period: DashboardPeriod): boolean => {
  if (lead.isMockData) return true;

  const createdInPeriod = isWithinPeriod(lead.createdAt, period);
  const followUpInPeriod = lead.nextFollowUpDate ? isWithinPeriod(lead.nextFollowUpDate, period) : false;

  return createdInPeriod || followUpInPeriod;
};

/**
 * Evaluates whether a lead matches the dashboard global filter search term.
 * Supports matching across:
 * - Lead/customer name
 * - Assigned Sales Agent name
 * - Current workflow stage (raw and formatted labels)
 * - Status ('ACTIVE')
 * - Follow-up date (formatted date string or 'none scheduled')
 * - Project / requirement details
 * - Masked or unmasked mobile number
 * - Date keywords ('today', 'week', 'month')
 */
export const matchesGlobalFilter = (lead: NewLeadItem, term: string): boolean => {
  if (!term || !term.trim()) return true;
  const q = term.trim().toLowerCase();

  // 1. Lead / Customer Name
  if (lead.name?.toLowerCase().includes(q)) return true;

  // 2. Assigned Sales Agent Name
  if (lead.assignedTo?.name?.toLowerCase().includes(q)) return true;
  if (!lead.assignedTo && ('unassigned'.includes(q) || 'unassigned queue'.includes(q))) return true;

  // 3. Current Workflow Stage
  if (lead.currentStage?.toLowerCase().includes(q)) return true;
  const stageKeywords: Record<string, string> = {
    FOLLOW_UP: '01. follow-up stage 1 follow up initial contact',
    MEETING_PLAN: '02. meeting plan stage 2 meeting discussion',
    SITE_VISIT_PLAN: '03. site visit plan stage 3 visit property tour',
    DEAL_DONE: '04. deal done stage 4 closed completed deal',
  };
  if (lead.currentStage && stageKeywords[lead.currentStage]?.toLowerCase().includes(q)) return true;

  // 3b. Granular Follow-Up Outcome
  if (lead.lastFollowUpOutcome) {
    if (lead.lastFollowUpOutcome.toLowerCase().includes(q)) return true;
    const outcomeMeta = getFollowUpOutcomeMeta(lead.lastFollowUpOutcome);
    if (outcomeMeta?.label.toLowerCase().includes(q)) return true;
  }

  // 4. Status
  if (lead.status?.toLowerCase().includes(q)) return true;
  if (q === 'active' && (!lead.status || lead.status === 'ACTIVE')) return true;

  // 5. Follow-up Date
  if (lead.nextFollowUpDate) {
    const rawDate = lead.nextFollowUpDate.toLowerCase();
    const formattedDate = new Date(lead.nextFollowUpDate).toLocaleDateString().toLowerCase();
    if (rawDate.includes(q) || formattedDate.includes(q)) return true;
    if (lead.nextFollowUpTime?.toLowerCase().includes(q)) return true;
  } else {
    if ('none scheduled'.includes(q) || 'no follow-up'.includes(q)) return true;
  }

  // 6. Project Name
  if (lead.projectName?.toLowerCase().includes(q)) return true;

  // 7. Mobile (clean digits or masked string)
  if (lead.mobile?.toLowerCase().includes(q)) return true;
  const digitsOnlyLead = lead.mobile?.replace(/\D/g, '') || '';
  const digitsOnlyQ = q.replace(/\D/g, '');
  if (digitsOnlyQ && digitsOnlyLead.includes(digitsOnlyQ)) return true;

  // 8. Remark / Requirement
  if (lead.remark?.toLowerCase().includes(q)) return true;

  // 9. Period keywords in search input
  if (q === 'today' && isWithinPeriod(lead.createdAt || lead.nextFollowUpDate, 'today')) return true;
  if ((q === 'week' || q === 'this week') && isWithinPeriod(lead.createdAt || lead.nextFollowUpDate, 'week')) return true;
  if ((q === 'month' || q === 'this month') && isWithinPeriod(lead.createdAt || lead.nextFollowUpDate, 'month')) return true;

  return false;
};

/**
 * Evaluates whether a lead matches the New Lead table filter criteria:
 * - Current Stage
 * - Status
 * - Assigned Agent
 * - Follow-up Date (Scheduled, None scheduled, Today, This Week, Overdue)
 */
export const matchesTableFilters = (lead: NewLeadItem, filters: TableFilterState): boolean => {
  // 1. Stage Filter
  if (filters.stage !== 'ALL') {
    if (lead.currentStage !== filters.stage) return false;
  }

  // 2. Status Filter
  if (filters.status !== 'ALL') {
    const leadStatus = lead.status || 'ACTIVE';
    if (leadStatus !== filters.status) return false;
  }

  // 3. Assigned Agent Filter
  if (filters.agent !== 'ALL') {
    if (filters.agent === '__UNASSIGNED__') {
      if (lead.assignedTo) return false;
    } else {
      if (lead.assignedTo?.name !== filters.agent) return false;
    }
  }

  // 4. Follow-up Date Filter
  if (filters.followUp !== 'ALL') {
    if (filters.followUp === 'SCHEDULED' && !lead.nextFollowUpDate) return false;
    if (filters.followUp === 'NONE' && lead.nextFollowUpDate) return false;
    if (filters.followUp === 'TODAY') {
      if (!lead.nextFollowUpDate || !isWithinPeriod(lead.nextFollowUpDate, 'today')) return false;
    }
    if (filters.followUp === 'WEEK') {
      if (!lead.nextFollowUpDate || !isWithinPeriod(lead.nextFollowUpDate, 'week')) return false;
    }
    if (filters.followUp === 'OVERDUE') {
      if (!lead.nextFollowUpDate) return false;
      const d = new Date(lead.nextFollowUpDate);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (d >= todayMidnight) return false;
    }
  }

  // 5. Follow-up Outcome Filter
  if (filters.outcome && filters.outcome !== 'ALL') {
    if (filters.outcome === '__NONE__') {
      if (lead.lastFollowUpOutcome) return false;
    } else if (lead.lastFollowUpOutcome !== filters.outcome) {
      return false;
    }
  }

  return true;
};
