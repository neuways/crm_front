import { FollowUpOutcome, WorkflowStage } from '../types/enquiry.types.js';

export interface FollowUpOutcomeMeta {
  value: FollowUpOutcome;
  label: string;
  shortLabel: string;
  badgeCls: string;
  dotCls: string;
}

export const FOLLOW_UP_OUTCOME_META: Record<FollowUpOutcome, FollowUpOutcomeMeta> = {
  CALL_BACK_REQUESTED: {
    value: 'CALL_BACK_REQUESTED',
    label: 'Call Back Requested',
    shortLabel: 'Call Back',
    badgeCls: 'bg-amber-50 text-amber-800 border-amber-200',
    dotCls: 'bg-amber-500',
  },
  NO_ANSWER: {
    value: 'NO_ANSWER',
    label: 'No Answer / Busy',
    shortLabel: 'No Answer / Busy',
    badgeCls: 'bg-orange-50 text-orange-800 border-orange-200',
    dotCls: 'bg-orange-500',
  },
  SWITCHED_OFF: {
    value: 'SWITCHED_OFF',
    label: 'Switched Off / Not Reachable',
    shortLabel: 'Switched Off',
    badgeCls: 'bg-rose-50 text-rose-800 border-rose-200',
    dotCls: 'bg-rose-500',
  },
  CONNECTED: {
    value: 'CONNECTED',
    label: 'Connected & Discussed',
    shortLabel: 'Connected',
    badgeCls: 'bg-blue-50 text-blue-800 border-blue-200',
    dotCls: 'bg-blue-500',
  },
  MEETING_SCHEDULED: {
    value: 'MEETING_SCHEDULED',
    label: 'Meeting Agreed',
    shortLabel: 'Meeting Agreed',
    badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotCls: 'bg-emerald-600',
  },
  SITE_VISIT_COMPLETED: {
    value: 'SITE_VISIT_COMPLETED',
    label: 'Site Visit Completed',
    shortLabel: 'Site Visit Done',
    badgeCls: 'bg-purple-50 text-purple-800 border-purple-200',
    dotCls: 'bg-purple-600',
  },
  DEAL_DONE: {
    value: 'DEAL_DONE',
    label: 'Deal Done',
    shortLabel: 'Deal Done',
    badgeCls: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dotCls: 'bg-emerald-700',
  },
  NOT_INTERESTED: {
    value: 'NOT_INTERESTED',
    label: 'Not Interested / Lost',
    shortLabel: 'Not Interested',
    badgeCls: 'bg-red-50 text-red-700 border-red-200',
    dotCls: 'bg-red-500',
  },
  OTHER: {
    value: 'OTHER',
    label: 'Other',
    shortLabel: 'Other',
    badgeCls: 'bg-slate-100 text-slate-700 border-slate-200',
    dotCls: 'bg-slate-500',
  },
};

export const QUICK_ACTIVITY_OUTCOMES: FollowUpOutcome[] = [
  'NO_ANSWER',
  'SWITCHED_OFF',
  'CALL_BACK_REQUESTED',
  'CONNECTED',
  'MEETING_SCHEDULED',
  'SITE_VISIT_COMPLETED',
  'DEAL_DONE',
  'NOT_INTERESTED',
];

export function getFollowUpOutcomeMeta(
  outcome?: FollowUpOutcome | string | null
): FollowUpOutcomeMeta | null {
  if (!outcome) return null;
  return (FOLLOW_UP_OUTCOME_META as Record<string, FollowUpOutcomeMeta>)[outcome] || null;
}

export function formatFollowUpScheduleLabel(
  dateStr?: string | null,
  timeStr?: string | null
): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return [dateStr, timeStr].filter(Boolean).join(' ').trim() || null;
  }

  const now = new Date();
  const targetDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const dayLabel =
    diffDays === 0
      ? 'Today'
      : diffDays === 1
      ? 'Tomorrow'
      : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return timeStr ? `${dayLabel} ${timeStr}` : dayLabel;
}

export function getWorkflowStageMeta(stage?: WorkflowStage | string | null): {
  label: string;
  cls: string;
} {
  switch (stage) {
    case 'MEETING_PLAN':
      return { label: '02. Meeting Plan', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'SITE_VISIT_PLAN':
      return { label: '03. Site Visit Plan', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'DEAL_DONE':
      return { label: '04. Deal Done', cls: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
    case 'FOLLOW_UP':
    default:
      return { label: '01. Follow-up', cls: 'bg-blue-50 text-brand-primary border-blue-200' };
  }
}
