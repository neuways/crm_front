import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  X,
  FileSpreadsheet,
  CalendarCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UserProfile } from "../../types/auth.types.js";
import { PeriodSelector } from "../../components/ui/PeriodSelector.js";
import { Button } from "../../components/ui/Button.js";
import { MetricCard } from "../../components/ui/MetricCard.js";
import { SalesKpiCards } from "./components/SalesKpiCards.js";
import { NewLeadTable } from "./components/NewLeadTable.js";
import {
  PendingFollowUpTable,
  FutureFollowUpTable,
} from "./components/FollowUpSummaryTable.js";
import { LeadQualificationTable } from "./components/LeadQualificationTable.js";
import { NewEnquiryModal } from "./components/NewEnquiryModal.js";
import { FollowUpModal } from "./components/FollowUpModal.js";
import { MyDailyActivityScorecard } from "./components/MyDailyActivityScorecard.js";
import { useSalesDashboard } from "./hooks/useSalesDashboard.js";
import { NewLeadItem } from "./types/dashboard.types.js";
import { matchesDatePeriod, matchesGlobalFilter } from "./utils/dashboardFilters.js";

interface OutletContextType {
  currentUser: UserProfile;
  onShowPlaceholderNotice: (featureName: string) => void;
}

export const SalesDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, onShowPlaceholderNotice } =
    useOutletContext<OutletContextType>();
  const [isNewEnquiryModalOpen, setIsNewEnquiryModalOpen] =
    React.useState<boolean>(false);
  const [globalFilterText, setGlobalFilterText] = React.useState<string>("");
  const [scorecardRefreshKey, setScorecardRefreshKey] = React.useState<number>(0);

  const {
    selectedPeriod,
    setSelectedPeriod,
    kpiMetrics,
    pipelineOverview,
    newLeads,
    pendingFollowUps,
    futureFollowUps,
    leadQualification,
    isLoadingLeads,
    leadsError,
    isDemoMode,
    activeFollowUpLead,
    setActiveFollowUpLead,
    refreshLeads,
  } = useSalesDashboard();

  // 1. Filter leads by the selected date range period (Today, This Week, This Month)
  const periodFilteredLeads = React.useMemo(() => {
    return newLeads.filter((lead) => matchesDatePeriod(lead, selectedPeriod));
  }, [newLeads, selectedPeriod]);

  // 2. Filter leads by Global Filter text across supported lead fields
  const filteredDashboardLeads = React.useMemo(() => {
    return periodFilteredLeads.filter((lead) =>
      matchesGlobalFilter(lead, globalFilterText)
    );
  }, [periodFilteredLeads, globalFilterText]);

  const handleFollowUpClick = (lead: NewLeadItem) => {
    navigate(`/sales/leads/${lead.id}/workflow`);
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
       * Top Dashboard Header & Actions
       * ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        {/* Left: Titles & Subtitle */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Sales Dashboard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Sales Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Welcome back,{" "}
            <span className="font-semibold text-content-secondary">
              {currentUser.name}
            </span>
            . Here's your daily enquiry activity, pending follow-ups, and lead
            pipeline overview.
          </p>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector (Today / Week / Month) */}
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />

          {/* Quick Filter Input */}
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-content-subtle">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={globalFilterText}
              onChange={(e) => setGlobalFilterText(e.target.value)}
              placeholder="Filter current view..."
              className="pl-8 pr-7 py-1.5 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted hover:bg-surface-subtle focus:outline-hidden focus:ring-1 focus:ring-brand-primary transition-colors w-40 sm:w-52"
              aria-label="Filter current dashboard view"
            />
            {globalFilterText && (
              <button
                type="button"
                onClick={() => setGlobalFilterText("")}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-content-muted hover:text-content-primary transition-colors"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Refresh Action */}
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={refreshLeads}
            disabled={isLoadingLeads}
          >
            Refresh
          </Button>

          {/* Export Summary Action */}
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() => onShowPlaceholderNotice("Export Summary")}
          >
            Export Summary
          </Button>

          {/* Bulk Data Upload */}
          <Button
            size="sm"
            variant="outline"
            icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            onClick={() => navigate("/bulk-upload")}
            title="Bulk Data Upload (Excel / CSV)"
            className="hover:border-emerald-500 hover:text-emerald-700 font-medium"
          >
            <span>Bulk Data Upload</span>
            <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Excel / CSV
            </span>
          </Button>

          {/* Primary Action Button: New Lead Enquiry */}
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewEnquiryModalOpen(true)}
            className="shadow-sm shadow-blue-500/20"
          >
            New Lead Enquiry
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Section 5.B: Four KPI Cards & My Today's Activity Scorecard
       * ------------------------------------------------------------- */}
      <SalesKpiCards metrics={kpiMetrics} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Meetings / Site Visits"
          subtitle={
            pipelineOverview.meetingPlanCount > 0 || pipelineOverview.siteVisitPlanCount > 0
              ? `Meetings: ${pipelineOverview.meetingPlanCount} • Visits: ${pipelineOverview.siteVisitPlanCount}`
              : "Stage 2 & Stage 3 Pipeline"
          }
          value={pipelineOverview.meetingsAndVisitsCount}
          badgeText="Scheduled Milestones"
          badgeType="info"
          icon={<CalendarCheck className="h-5 w-5" />}
          iconBgColor="bg-purple-50 text-purple-600"
          isMockData={isDemoMode}
          ariaLabel="View leads in meeting and site visit stages"
          onClick={() => navigate("/leads?tab=active&stage=MEETING_PLAN")}
        />
        <MetricCard
          title="Completed Deals"
          subtitle="Closed & Finalized"
          value={pipelineOverview.completedDealsCount}
          badgeText="Deal Done"
          badgeType="positive"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          isMockData={isDemoMode}
          ariaLabel="View completed deals"
          onClick={() => navigate("/completed-deals")}
        />
        <MetricCard
          title="Rejected / Lost"
          subtitle={
            pipelineOverview.dealLostCount > 0
              ? `Rejected: ${pipelineOverview.explicitRejectedCount} • Lost: ${pipelineOverview.dealLostCount}`
              : "Closed & Disqualified"
          }
          value={pipelineOverview.rejectedCount}
          badgeText={`${pipelineOverview.rejectedCount} Lost`}
          badgeType="neutral"
          icon={<XCircle className="h-5 w-5" />}
          iconBgColor="bg-red-50 text-red-600"
          isMockData={isDemoMode}
          ariaLabel="View rejected and lost leads"
          onClick={() => navigate("/leads?tab=rejected")}
        />
      </div>

      <MyDailyActivityScorecard refreshTrigger={scorecardRefreshKey} />

      {/* -------------------------------------------------------------
       * Section 6.1: Assigned Leads Table (Sequential Workflow)
       * ------------------------------------------------------------- */}
      <NewLeadTable
        leads={filteredDashboardLeads}
        isLoading={isLoadingLeads}
        error={leadsError}
        isDemoMode={isDemoMode}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onRetry={() => {
          refreshLeads();
          setScorecardRefreshKey((k) => k + 1);
        }}
        onFollowUpClick={handleFollowUpClick}
        onShowNotice={onShowPlaceholderNotice}
        hideAgentFilter={true}
      />

      {/* -------------------------------------------------------------
       * Section 6.2: Pending Follow-up Card (Stage, Contacted, Detail Shared, Meeting, Site Visit)
       * ------------------------------------------------------------- */}
      <PendingFollowUpTable data={pendingFollowUps} />

      {/* -------------------------------------------------------------
       * Section 6.3: Future Follow-up Card (Stage, Contacted, Detail Shared)
       * ------------------------------------------------------------- */}
      <FutureFollowUpTable data={futureFollowUps} />

      {/* -------------------------------------------------------------
       * Section 6.4: Lead Qualification Card (10%, 20%, 50%, 70%, 80%, 100% | Hot, Poss.)
       * ------------------------------------------------------------- */}
      <LeadQualificationTable
        matrix={leadQualification}
        isDemoMode={isDemoMode}
        activeLeads={newLeads}
        onQualificationSaved={refreshLeads}
      />

      {/* -------------------------------------------------------------
       * Section: Interactive Follow-Up & Status Modal
       * ------------------------------------------------------------- */}
      <FollowUpModal
        lead={activeFollowUpLead}
        isOpen={Boolean(activeFollowUpLead)}
        onClose={() => setActiveFollowUpLead(null)}
        onFollowUpLogged={() => {
          refreshLeads();
          setScorecardRefreshKey((k) => k + 1);
        }}
      />

      {/* -------------------------------------------------------------
       * Section: New Lead Enquiry Form Modal Dialog
       * ------------------------------------------------------------- */}
      <NewEnquiryModal
        isOpen={isNewEnquiryModalOpen}
        onClose={() => setIsNewEnquiryModalOpen(false)}
        isDemoMode={isDemoMode}
        onEnquiryCreated={(lead, rawEnquiry) => {
          refreshLeads();
          const assignedId =
            lead.assignedTo?.id ||
            (rawEnquiry?.assignedTo as any)?._id?.toString() ||
            (rawEnquiry?.assignedTo as any)?.id?.toString() ||
            (typeof rawEnquiry?.assignedTo === 'string' ? rawEnquiry.assignedTo : null);

          // If current user is a SALES agent and the lead was assigned to a peer agent via Round Robin:
          if (currentUser.role === 'SALES' && assignedId && assignedId !== currentUser.id) {
            onShowPlaceholderNotice(
              `Lead "${lead.name}" created and assigned to ${lead.assignedTo?.name || 'peer agent'} via Round Robin.`
            );
          }
        }}
      />
    </div>
  );
};
