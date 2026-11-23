/**
 * Neuways CRM - Demonstration Dataset
 *
 * STRICT ARCHITECTURAL INVARIANT:
 * All records in this file represent visual demonstration / placeholder data
 * strictly adhering to the company-defined sections and Stitch design.
 *
 * No invented business stage names, definitions, or fabricated metrics are claimed.
 * Customer contact numbers are masked for privacy compliance.
 */

import {
  DashboardKpiMetric,
  FutureFollowUpData,
  LeadQualificationMatrix,
  NewLeadItem,
  PendingFollowUpData,
} from "../types/dashboard.types.js";

export const mockKpiMetrics: DashboardKpiMetric[] = [
  {
    id: "kpi-daily-velocity",
    title: "New enquiries",
    subtitle: "Daily Velocity",
    value: 7,
    badgeText: "+18% from yesterday",
    badgeType: "positive",
    isMockData: true,
  },
  {
    id: "kpi-action-pipeline",
    title: "Pending follow-ups",
    subtitle: "Action Pipeline",
    value: 85,
    badgeText: "• Requires Attention",
    badgeType: "warning",
    isMockData: true,
  },
  {
    id: "kpi-calendar-bookings",
    title: "Scheduled future calls",
    subtitle: "Calendar Bookings",
    value: 74,
    badgeText: "Next 30 Days",
    badgeType: "info",
    isMockData: true,
  },
  {
    id: "kpi-portfolio-scope",
    title: "Total active lead pipeline",
    subtitle: "Portfolio Scope",
    value: 269,
    badgeText: "Hot: 119 | Poss: 150",
    badgeType: "neutral",
    isMockData: true,
  },
];

export const mockNewLeads: NewLeadItem[] = [
  {
    id: "lead-01",
    srNo: "01",
    name: "Marcus Vance",
    initials: "MV",
    avatarColor: "bg-purple-100 text-purple-700",
    mobile: "+1 (555) 438-••10",
    price: "$1,450,000",
    remark: "Interested in 3BHK high-rise unit. Requested site layout.",
    isMockData: true,
    createdAt: "2024-10-24T08:30:00Z",
  },
  {
    id: "lead-02",
    srNo: "02",
    name: "Amina Al-Mansoor",
    initials: "AA",
    avatarColor: "bg-emerald-100 text-emerald-700",
    mobile: "+971 50 892 ••44",
    price: "$890,000",
    remark: "Penthouse enquiry. Requires weekend site tour.",
    isMockData: true,
    createdAt: "2024-10-24T09:15:00Z",
  },
  {
    id: "lead-03",
    srNo: "03",
    name: "Julian Rossi",
    initials: "JR",
    avatarColor: "bg-blue-100 text-blue-700",
    mobile: "+1 (212) 809-••12",
    price: "$2,200,000",
    remark: "Commercial lease terms review.",
    isMockData: true,
    createdAt: "2024-10-24T10:05:00Z",
  },
  {
    id: "lead-04",
    srNo: "04",
    name: "Claire Beaumont",
    initials: "CB",
    avatarColor: "bg-indigo-100 text-indigo-700",
    mobile: "+44 20 7946 ••12",
    price: "$620,000",
    remark: "Inquired via Instagram ad campaign.",
    isMockData: true,
    createdAt: "2024-10-24T11:40:00Z",
  },
  {
    id: "lead-05",
    srNo: "05",
    name: "Rajesh Patel",
    initials: "RP",
    avatarColor: "bg-slate-200 text-slate-700",
    mobile: "+91 98201 ••921",
    price: "$1,150,000",
    remark: "Walk-in retail space requirement.",
    isMockData: true,
    createdAt: "2024-10-24T12:20:00Z",
  },
];

export const mockPendingFollowUps: PendingFollowUpData = {
  title: "Pending Follow-up",
  badgeText: "• Requires Attention",
  subtitle: "Immediate pending follow-up backlog categorized by stage",
  stages: [
    {
      stage: "Stage 1",
      contacted: 14,
      detailShared: 9,
      meeting: 5,
      siteVisit: 2,
    },
    {
      stage: "Stage 2",
      contacted: 8,
      detailShared: 12,
      meeting: 6,
      siteVisit: 4,
    },
    {
      stage: "Stage 3",
      contacted: 4,
      detailShared: 7,
      meeting: 8,
      siteVisit: 6,
    },
  ],
};

export const mockFutureFollowUps: FutureFollowUpData = {
  title: "Future Follow-up",
  badgeText: "Next 30 Days Scheduled",
  subtitle: "Scheduled upcoming pipeline activities for future dates",
  stages: [
    {
      stage: "Stage 1",
      contacted: 18,
      detailShared: 15,
    },
    {
      stage: "Stage 2",
      contacted: 11,
      detailShared: 14,
    },
    {
      stage: "Stage 3",
      contacted: 7,
      detailShared: 9,
    },
  ],
};

export const mockLeadQualification: LeadQualificationMatrix = {
  title: "Lead Qualification",
  subtitle: "Matrix distribution across company milestones and buyer readiness",
  percentages: ["10%", "20%", "50%", "70%", "80%", "100%"],
  hotRow: {
    values: [12, 18, 24, 31, 19, 15],
  },
  possRow: {
    values: [28, 34, 42, 22, 16, 8],
  },
};
