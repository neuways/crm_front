import { useState, useEffect, useCallback } from "react";
import {
  DashboardPeriod,
  DashboardKpiMetric,
  NewLeadItem,
  PendingFollowUpData,
  FutureFollowUpData,
  LeadQualificationMatrix,
} from "../types/dashboard.types.js";
import {
  mockKpiMetrics,
  mockNewLeads,
  mockPendingFollowUps,
  mockFutureFollowUps,
  mockLeadQualification,
} from "../data/mockDashboardData.js";
import { enquiryService } from "../../../services/enquiry.service.js";
import { useAuth } from "../../../context/AuthContext.js";
import { TaskStatusCounts } from "../../../types/enquiry.types.js";

export interface UseSalesDashboardReturn {
  selectedPeriod: DashboardPeriod;
  setSelectedPeriod: (period: DashboardPeriod) => void;
  kpiMetrics: DashboardKpiMetric[];
  newLeads: NewLeadItem[];
  pendingFollowUps: PendingFollowUpData;
  futureFollowUps: FutureFollowUpData;
  leadQualification: LeadQualificationMatrix;
  taskStatusCounts: TaskStatusCounts | null;
  isLoadingLeads: boolean;
  leadsError: string | null;
  isBackendConnected: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (demo: boolean) => void;
  activeFollowUpLead: NewLeadItem | null;
  setActiveFollowUpLead: (lead: NewLeadItem | null) => void;
  addNewLead: (lead: NewLeadItem) => void;
  refreshLeads: () => void;
}

const defaultKpiMetrics: DashboardKpiMetric[] = [
  {
    id: "kpi-daily-velocity",
    title: "New enquiries",
    subtitle: "Daily Velocity",
    value: 0,
    badgeText: "0 Today",
    badgeType: "neutral",
    isMockData: false,
  },
  {
    id: "kpi-action-pipeline",
    title: "Pending follow-ups",
    subtitle: "Action Pipeline",
    value: 0,
    badgeText: "All Caught Up",
    badgeType: "positive",
    isMockData: false,
  },
  {
    id: "kpi-calendar-bookings",
    title: "Scheduled future calls",
    subtitle: "Calendar Bookings",
    value: 0,
    badgeText: "Scheduled",
    badgeType: "info",
    isMockData: false,
  },
  {
    id: "kpi-portfolio-scope",
    title: "Total active lead pipeline",
    subtitle: "Portfolio Scope",
    value: 0,
    badgeText: "0 Active Leads",
    badgeType: "neutral",
    isMockData: false,
  },
];

const defaultPendingFollowUps: PendingFollowUpData = {
  title: "Pending Follow-up",
  badgeText: "Zero Backlog",
  subtitle: "Immediate pending follow-up backlog categorized by stage",
  stages: [
    { stage: "Stage 1", contacted: 0, detailShared: 0, meeting: 'N/A', siteVisit: 'N/A' },
    { stage: "Stage 2", contacted: 'N/A', detailShared: 'N/A', meeting: 0, siteVisit: 'N/A' },
    { stage: "Stage 3", contacted: 'N/A', detailShared: 'N/A', meeting: 'N/A', siteVisit: 0 },
  ],
};

const defaultFutureFollowUps: FutureFollowUpData = {
  title: "Future Follow-up",
  badgeText: "Scheduled",
  subtitle: "Scheduled upcoming pipeline activities for future dates",
  stages: [
    { stage: "Stage 1", contacted: 0, detailShared: 0, meeting: 'N/A', siteVisit: 'N/A' },
    { stage: "Stage 2", contacted: 'N/A', detailShared: 'N/A', meeting: 0, siteVisit: 'N/A' },
    { stage: "Stage 3", contacted: 'N/A', detailShared: 'N/A', meeting: 'N/A', siteVisit: 0 },
  ],
};

const defaultLeadQualification: LeadQualificationMatrix = {
  title: "Lead Qualification",
  subtitle: "Matrix distribution across company milestones and buyer readiness",
  percentages: ["10%", "20%", "50%", "70%", "80%", "100%"],
  hotRow: { values: [0, 0, 0, 0, 0, 0] },
  possRow: { values: [0, 0, 0, 0, 0, 0] },
  isPopulated: false,
};

export const useSalesDashboard = (): UseSalesDashboardReturn => {
  const {
    isDemoMode: authDemoMode,
    enterDemoMode,
    exitDemoMode,
  } = useAuth();

  const [selectedPeriod, setSelectedPeriod] =
    useState<DashboardPeriod>("today");

  const [localDemoOverride, setLocalDemoOverride] = useState<boolean | null>(
    null,
  );

  // In normal operation, always query live backend. Explicit demo mode only when toggled.
  const isDemoMode =
    localDemoOverride !== null
      ? localDemoOverride
      : Boolean(authDemoMode);

  const setIsDemoMode = (demo: boolean) => {
    setLocalDemoOverride(demo);
    if (demo) {
      enterDemoMode();
    } else {
      exitDemoMode();
    }
  };

  const [dynamicKpis, setDynamicKpis] = useState<DashboardKpiMetric[]>(defaultKpiMetrics);
  const [newLeads, setNewLeads] = useState<NewLeadItem[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<PendingFollowUpData>(defaultPendingFollowUps);
  const [futureFollowUps, setFutureFollowUps] = useState<FutureFollowUpData>(defaultFutureFollowUps);
  const [leadQualification, setLeadQualification] = useState<LeadQualificationMatrix>(defaultLeadQualification);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [taskStatusCounts, setTaskStatusCounts] = useState<TaskStatusCounts | null>(null);
  const [activeFollowUpLead, setActiveFollowUpLead] =
    useState<NewLeadItem | null>(null);

  const fetchLiveEnquiries = useCallback(async () => {
    setIsLoadingLeads(true);
    setLeadsError(null);

    try {
      const isHealthy = await enquiryService.checkBackendHealth();
      setIsBackendConnected(isHealthy);

      if (!isHealthy) {
        setLeadsError(
          "Backend service is unreachable. Ensure the backend server is running on http://localhost:5000.",
        );
        setNewLeads([]);
        setIsLoadingLeads(false);
        return;
      }

      // Fetch live enquiries and dashboard summary in parallel
      const [res, summaryRes] = await Promise.all([
        enquiryService.getEnquiries({
          page: 1,
          limit: 100,
          status: "ACTIVE",
          rejected: false,
        }),
        enquiryService.getDashboardSummary(),
      ]);

      // Explicitly handle HTTP error codes - never silently display mock data as live data
      if (res.statusCode === 401 || res.error === "Unauthorized") {
        setLeadsError(
          "Authentication required (HTTP 401). No valid employee session was found. Please log in to view live enquiry data.",
        );
        setNewLeads([]);
        return;
      }

      if (res.statusCode === 403 || res.error === "Forbidden") {
        setLeadsError(
          "Access denied (HTTP 403). Your account role is not authorized to retrieve live enquiries.",
        );
        setNewLeads([]);
        return;
      }

      if (!res.success) {
        setLeadsError(
          res.message || "Failed to retrieve live enquiries from backend.",
        );
        setNewLeads([]);
        return;
      }

      // 1. Process Enquiries - strictly exclude rejected / closed enquiries
      if (res.data && Array.isArray(res.data.enquiries)) {
        const liveLeads: NewLeadItem[] = res.data.enquiries
          .filter((e) => e.status !== "CLOSED" && !e.rejection?.reason)
          .map((e, index) => {
          const names = (e.name || "Anonymous Prospect").split(" ");
          const initials = (names[0]?.[0] || "N") + (names[1]?.[0] || "");
          const colors = [
            "bg-purple-100 text-purple-700",
            "bg-emerald-100 text-emerald-700",
            "bg-blue-100 text-blue-700",
            "bg-indigo-100 text-indigo-700",
            "bg-slate-200 text-slate-700",
          ];

          let priceStr = "Price on Request";
          if (e.budgetMin && e.budgetMax) {
            priceStr = `₹${e.budgetMin.toLocaleString()} - ₹${e.budgetMax.toLocaleString()}`;
          } else if (e.budgetMin) {
            priceStr = `From ₹${e.budgetMin.toLocaleString()}`;
          } else if (e.budgetMax) {
            priceStr = `Up to ₹${e.budgetMax.toLocaleString()}`;
          }

          // Privacy mask: preserve customer privacy
          const cleanMobile = e.mobile.replace(/\s+/g, "");
          const maskedMobile =
            cleanMobile.length > 5
              ? `${cleanMobile.slice(0, cleanMobile.length - 4)}••••`
              : cleanMobile;

          return {
            id: e.id || (e as any)._id,
            srNo: String(index + 1).padStart(2, "0"),
            name: e.name,
            initials: initials.toUpperCase(),
            avatarColor: colors[index % colors.length],
            mobile: maskedMobile,
            price: priceStr,
            remark:
              e.requirement || e.projectName || "Active prospective enquiry",
            isMockData: false,
            createdAt: e.createdAt,
            assignedTo: (e as any).assignedTo,
            status: e.status,
            currentStage: (e as any).currentStage || 'FOLLOW_UP',
            nextFollowUpDate: (e as any).nextFollowUpDate,
            nextFollowUpTime: (e as any).nextFollowUpTime,
            projectName: e.projectName,
            isDoNotContact: e.isDoNotContact,
          };
        });

        setNewLeads(liveLeads);
        setLeadsError(null);
      }

      // 2. Process Summary Metrics
      if (summaryRes.success && summaryRes.data) {
        const s = summaryRes.data;

        setDynamicKpis([
          {
            id: "kpi-daily-velocity",
            title: "New enquiries",
            subtitle: "Daily Velocity",
            value: s.dailyVelocity,
            badgeText: s.dailyVelocity > 0 ? "+1 Today" : "0 Today",
            badgeType: "positive",
            isMockData: false,
          },
          {
            id: "kpi-action-pipeline",
            title: "Pending follow-ups",
            subtitle: "Action Pipeline",
            value: s.pendingFollowUpsCount,
            badgeText: s.pendingFollowUpsCount > 0 ? "• Requires Attention" : "All Caught Up",
            badgeType: s.pendingFollowUpsCount > 0 ? "warning" : "positive",
            isMockData: false,
          },
          {
            id: "kpi-calendar-bookings",
            title: "Scheduled future calls",
            subtitle: "Calendar Bookings",
            value: s.futureFollowUpsCount,
            badgeText: "Scheduled",
            badgeType: "info",
            isMockData: false,
          },
          {
            id: "kpi-portfolio-scope",
            title: "Total active lead pipeline",
            subtitle: "Portfolio Scope",
            value: s.activePipelineCount,
            badgeText: `${s.activePipelineCount} Active Leads`,
            badgeType: "neutral",
            isMockData: false,
          },
        ]);

        setPendingFollowUps({
          title: "Pending Follow-up",
          badgeText: s.pendingFollowUpsCount > 0 ? "• Requires Attention" : "Zero Backlog",
          subtitle: "Immediate pending follow-up backlog categorized by stage",
          stages: s.pendingStages,
        });

        setFutureFollowUps({
          title: "Future Follow-up",
          badgeText: "Scheduled",
          subtitle: "Scheduled upcoming pipeline activities for future dates",
          stages: s.futureStages,
        });

        setLeadQualification({
          title: "Lead Qualification",
          subtitle: "Matrix distribution across company milestones and buyer readiness",
          percentages: s.qualificationMatrix.percentages,
          hotRow: s.qualificationMatrix.hotRow,
          possRow: s.qualificationMatrix.possRow,
          isPopulated: s.qualificationMatrix.isPopulated,
          totalActiveLeads: (s.qualificationMatrix as any).totalActiveLeads,
          scoredLeadsCount: (s.qualificationMatrix as any).scoredLeadsCount,
          unscoredLeadsCount: (s.qualificationMatrix as any).unscoredLeadsCount,
          hotCount: (s.qualificationMatrix as any).hotCount,
          possCount: (s.qualificationMatrix as any).possCount,
          scoredPercentage: (s.qualificationMatrix as any).scoredPercentage,
          leads: (s.qualificationMatrix as any).leads,
        });

        if (s.taskStatusCounts) {
          setTaskStatusCounts(s.taskStatusCounts);
        }
      }
    } catch (err: unknown) {
      setLeadsError(
        err instanceof Error
          ? err.message
          : "Unexpected connection error while querying backend.",
      );
      setNewLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  }, []);

  const addNewLead = useCallback((lead: NewLeadItem) => {
    setNewLeads((prev) => {
      const updated = [lead, ...prev];
      return updated.map((item, idx) => ({
        ...item,
        srNo: String(idx + 1).padStart(2, "0"),
      }));
    });

    fetchLiveEnquiries();
  }, [fetchLiveEnquiries]);

  useEffect(() => {
    if (isDemoMode) {
      // In explicit demo mode: display verified demonstration dataset
      setNewLeads(mockNewLeads);
      setDynamicKpis(mockKpiMetrics);
      setPendingFollowUps(mockPendingFollowUps);
      setFutureFollowUps(mockFutureFollowUps);
      setLeadQualification(mockLeadQualification);
      setLeadsError(null);
      setIsLoadingLeads(false);
    } else {
      // In live mode: query live backend API
      fetchLiveEnquiries();
    }
  }, [isDemoMode, fetchLiveEnquiries]);

  // Auto-refresh live dashboard data safely when connectivity is restored
  useEffect(() => {
    if (typeof window === "undefined" || isDemoMode) return;

    const handleReconnected = () => {
      fetchLiveEnquiries();
    };

    window.addEventListener("nueways:reconnected", handleReconnected);
    return () => window.removeEventListener("nueways:reconnected", handleReconnected);
  }, [isDemoMode, fetchLiveEnquiries]);

  return {
    selectedPeriod,
    setSelectedPeriod,
    kpiMetrics: dynamicKpis,
    newLeads,
    pendingFollowUps,
    futureFollowUps,
    leadQualification,
    taskStatusCounts,
    isLoadingLeads,
    leadsError,
    isBackendConnected,
    isDemoMode,
    setIsDemoMode,
    activeFollowUpLead,
    setActiveFollowUpLead,
    addNewLead,
    refreshLeads: isDemoMode
      ? () => {
          setNewLeads(mockNewLeads);
          setDynamicKpis(mockKpiMetrics);
          setPendingFollowUps(mockPendingFollowUps);
          setFutureFollowUps(mockFutureFollowUps);
          setLeadQualification(mockLeadQualification);
        }
      : fetchLiveEnquiries,
  };
};
