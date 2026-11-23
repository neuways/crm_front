import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Shield,
  Briefcase,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
  Filter,
  PhoneCall,
  MapPin,
  ChevronRight,
  Layers,
  XCircle,
  Building,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "../../components/ui/Button.js";
import { Card } from "../../components/ui/Card.js";
import { MetricCard } from "../../components/ui/MetricCard.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { PendingFollowUpTable } from "../sales-dashboard/components/FollowUpSummaryTable.js";
import { NewEnquiryModal } from "../sales-dashboard/components/NewEnquiryModal.js";
import { PropertyMappingModal } from "./components/PropertyMappingModal.js";
import { userService } from "../../services/user.service.js";
import { enquiryService } from "../../services/enquiry.service.js";
import { EmployeeProfile } from "../../types/user.types.js";
import { ClientDashboardSummaryData } from "../../types/enquiry.types.js";

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [summary, setSummary] = useState<ClientDashboardSummaryData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewEnquiryModalOpen, setIsNewEnquiryModalOpen] = useState(false);
  const [isPropertyMappingModalOpen, setIsPropertyMappingModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [empRes, summaryRes] = await Promise.all([
        userService.listEmployees(),
        enquiryService.getDashboardSummary(),
      ]);

      if (empRes.success && empRes.data) {
        setEmployees(empRes.data);
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      } else {
        setError(summaryRes.message || "Failed to compute dashboard metrics");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading dashboard data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh when network connectivity is restored
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleReconnected = () => {
      fetchDashboardData();
    };

    window.addEventListener("nueways:reconnected", handleReconnected);
    return () => window.removeEventListener("nueways:reconnected", handleReconnected);
  }, [fetchDashboardData]);

  // Organization-wide Headcount Metrics
  const activeEmployeeCount = employees.filter((e) => e.isActive).length;
  const managerCount = employees.filter(
    (e) => e.role === "MANAGER" && e.isActive,
  ).length;
  const activeSalesCount = employees.filter(
    (e) => e.role === "SALES" && e.isActive,
  ).length;
  const totalEmployeesCount = employees.length;

  // Pipeline & Deal Execution Metrics
  const activeLeadCount = summary?.activePipelineCount ?? 0;
  const pendingFollowUpCount = summary?.pendingFollowUpsCount ?? 0;
  const futureFollowUpCount = summary?.futureFollowUpsCount ?? 0;
  const completedDealCount =
    summary?.completedDealsCount ?? summary?.stageBreakdown?.dealDone ?? 0;
  const rejectedLeadCount = summary?.rejectedCount ?? 0;
  const dealLostCount = summary?.dealLostCount ?? 0;
  const explicitRejectedCount = summary?.explicitRejectedCount ?? Math.max(0, rejectedLeadCount - dealLostCount);

  // Leads Grouped by Stage
  const stageFollowUp = summary?.stageBreakdown?.followUp ?? 0;
  const stageMeetingPlan = summary?.stageBreakdown?.meetingPlan ?? 0;
  const stageSiteVisitPlan = summary?.stageBreakdown?.siteVisitPlan ?? 0;
  const stageDealDone = summary?.stageBreakdown?.dealDone ?? completedDealCount;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-edge">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Administration</span>
            <span className="text-slate-300">/</span>
            <span>Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Organization-wide operational intelligence, staff headcount, active
            lead pipeline, and workflow stage breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={<Building className="h-3.5 w-3.5 text-brand-primary" />}
            onClick={() => setIsPropertyMappingModalOpen(true)}
          >
            Property Mappings
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            }
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
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

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewEnquiryModalOpen(true)}
            className="shadow-sm shadow-blue-500/20"
          >
            New Lead Enquiry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Aggregating live organization-wide intelligence..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Overview Data"
          message={error}
          onRetry={fetchDashboardData}
        />
      ) : (
        <>
          {/* Section 1: Staffing & Organization Headcount */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs font-bold text-content-subtle uppercase tracking-wider">
                  Organization Headcount & Staffing
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/employees")}
                className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                <span>Manage Staff</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard
                title="Active Employees"
                subtitle="Authorized Staff"
                value={activeEmployeeCount}
                badgeText={`${activeEmployeeCount} of ${totalEmployeesCount} Active`}
                badgeType="positive"
                icon={<UserCheck className="h-5 w-5 text-status-success" />}
                isMockData={false}
              />
              <MetricCard
                title="Managers"
                subtitle="Team Supervisors"
                value={managerCount}
                badgeText="Leadership Role"
                badgeType="info"
                icon={<Shield className="h-5 w-5 text-indigo-600" />}
                isMockData={false}
              />
              <MetricCard
                title="Active Sales Agents"
                subtitle="Round Robin Pool"
                value={activeSalesCount}
                badgeText="Eligible for Leads"
                badgeType="info"
                icon={<Briefcase className="h-5 w-5 text-sky-600" />}
                isMockData={false}
              />
              <MetricCard
                title="Total Directory"
                subtitle="All Registered Accounts"
                value={totalEmployeesCount}
                badgeText="Headcount"
                badgeType="neutral"
                icon={<Users className="h-5 w-5 text-brand-primary" />}
                isMockData={false}
              />
            </div>
          </div>

          {/* Section 2: Active Pipeline & Follow-up Execution */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-primary" />
                <h2 className="text-xs font-bold text-content-subtle uppercase tracking-wider">
                  Pipeline & Action Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/leads")}
                className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                <span>View All Leads</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <MetricCard
                title="Active Lead Pipeline"
                subtitle="Enquiries in Progress"
                value={activeLeadCount}
                badgeText={`${activeLeadCount} Active`}
                badgeType="neutral"
                icon={<Filter className="h-5 w-5 text-brand-primary" />}
                isMockData={false}
              />
              <MetricCard
                title="Pending Follow-ups"
                subtitle="Due Today or Overdue"
                value={pendingFollowUpCount}
                badgeText={
                  pendingFollowUpCount === 0 ? "Caught Up" : "Requires Action"
                }
                badgeType={pendingFollowUpCount === 0 ? "positive" : "warning"}
                icon={<Clock className="h-5 w-5 text-amber-500" />}
                isMockData={false}
              />
              <MetricCard
                title="Future Follow-ups"
                subtitle="Scheduled Tomorrow Onward"
                value={futureFollowUpCount}
                badgeText="Upcoming"
                badgeType="info"
                icon={<Calendar className="h-5 w-5 text-sky-500" />}
                isMockData={false}
              />
              <MetricCard
                title="Completed Deals"
                subtitle="Closed & Finalized"
                value={completedDealCount}
                badgeText="Deal Done"
                badgeType="positive"
                icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                isMockData={false}
              />
              <div
                onClick={() => navigate("/admin/leads?tab=rejected")}
                className="cursor-pointer"
              >
                <MetricCard
                  title="Rejected / Lost"
                  subtitle={
                    dealLostCount > 0
                      ? `Rejected: ${explicitRejectedCount} • Lost: ${dealLostCount}`
                      : "Disqualified & Closed"
                  }
                  value={rejectedLeadCount}
                  badgeText={`${rejectedLeadCount} Lost`}
                  badgeType="neutral"
                  icon={<XCircle className="h-5 w-5 text-red-500" />}
                  isMockData={false}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Leads Grouped by Current Workflow Stage */}
          <div className="bg-surface-card border border-edge rounded-card shadow-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-edge">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-brand-primary" />
                <div>
                  <h3 className="text-sm font-bold text-content-primary">
                    Leads Grouped by Current Workflow Stage
                  </h3>
                  <p className="text-xs text-content-muted">
                    Distribution of active enquiries and finalized deals across
                    the 4 sequential milestones.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-brand-primary border border-blue-200 self-start sm:self-auto">
                {activeLeadCount + completedDealCount} Total Pipeline Records
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage 1: Follow-up */}
              <div
                onClick={() => navigate("/leads")}
                className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                    Stage 1
                  </span>
                  <PhoneCall className="h-4 w-4 text-brand-primary group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-content-primary mb-1">
                  01. Follow-up
                </h4>
                <div className="text-2xl font-black text-brand-primary mb-1">
                  {stageFollowUp}
                </div>
                <p className="text-[11px] text-content-muted">
                  Initial customer outreach, discussion & requirement gathering.
                </p>
              </div>

              {/* Stage 2: Meeting Plan */}
              <div
                onClick={() => navigate("/leads")}
                className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Stage 2
                  </span>
                  <Users className="h-4 w-4 text-purple-700 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-content-primary mb-1">
                  02. Meeting Plan
                </h4>
                <div className="text-2xl font-black text-purple-700 mb-1">
                  {stageMeetingPlan}
                </div>
                <p className="text-[11px] text-content-muted">
                  In-person or virtual consultation with manager oversight.
                </p>
              </div>

              {/* Stage 3: Site Visit Plan */}
              <div
                onClick={() => navigate("/leads")}
                className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Stage 3
                  </span>
                  <MapPin className="h-4 w-4 text-amber-700 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-content-primary mb-1">
                  03. Site Visit Plan
                </h4>
                <div className="text-2xl font-black text-amber-700 mb-1">
                  {stageSiteVisitPlan}
                </div>
                <p className="text-[11px] text-content-muted">
                  Property visit planning, project inspection & client
                  verification.
                </p>
              </div>

              {/* Stage 4: Deal Done */}
              <div
                onClick={() => navigate("/sales/completed-deals")}
                className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Stage 4
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-content-primary mb-1">
                  04. Deal Done
                </h4>
                <div className="text-2xl font-black text-emerald-700 mb-1">
                  {stageDealDone}
                </div>
                <p className="text-[11px] text-content-muted">
                  Finalized sales transactions with confirmed terms & pricing.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Pending Follow-up Breakdown Table */}
          {summary?.pendingStages && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-primary" />
                  <h3 className="text-xs font-bold text-content-subtle uppercase tracking-wider">
                    Organization-wide Pending Activity Backlog
                  </h3>
                </div>
                <span className="text-[11px] text-content-muted">
                  Overdue or Due Today
                </span>
              </div>
              <PendingFollowUpTable
                data={{
                  title: "Pending Follow-up Backlog",
                  subtitle:
                    "Stage-wise incomplete tasks across all sales agents",
                  badgeText:
                    pendingFollowUpCount === 0
                      ? "Caught Up"
                      : `${pendingFollowUpCount} Pending`,
                  stages: summary.pendingStages,
                }}
              />
            </div>
          )}

          {/* Section 5: Quick Administration Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Card
              className="p-4 hover:border-brand-primary transition-colors cursor-pointer group"
              onClick={() => navigate("/admin/employees")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 text-brand-primary">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-content-subtle group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-content-primary mb-1">
                Employee Management
              </h4>
              <p className="text-xs text-content-muted">
                Provision Managers and Sales Agents, edit details, assign
                supervisors, and manage access.
              </p>
            </Card>

            <Card
              className="p-4 hover:border-brand-primary transition-colors cursor-pointer group"
              onClick={() => navigate("/leads")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Filter className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-content-subtle group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-content-primary mb-1">
                Leads & Enquiries
              </h4>
              <p className="text-xs text-content-muted">
                Inspect organization-wide active leads, review stages, assigned
                agents, and next follow-up dates.
              </p>
            </Card>

            <Card
              className="p-4 hover:border-brand-primary transition-colors cursor-pointer group"
              onClick={() => navigate("/sales/completed-deals")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-content-subtle group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-sm font-bold text-content-primary mb-1">
                Completed Deals
              </h4>
              <p className="text-xs text-content-muted">
                Review all confirmed transactions across the organization with
                unit sizes and final deal pricing.
              </p>
            </Card>
          </div>
        </>
      )}

      {/* New Enquiry Modal */}
      <NewEnquiryModal
        isOpen={isNewEnquiryModalOpen}
        onClose={() => setIsNewEnquiryModalOpen(false)}
        isDemoMode={false}
        onEnquiryCreated={() => {
          fetchDashboardData();
        }}
      />

      {/* Property-Wise Round Robin Mapping Modal */}
      <PropertyMappingModal
        isOpen={isPropertyMappingModalOpen}
        onClose={() => setIsPropertyMappingModalOpen(false)}
      />
    </div>
  );
};
