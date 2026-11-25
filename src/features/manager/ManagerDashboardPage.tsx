import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Users,
  Filter,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowUpRight,
  Layers,
  FileSpreadsheet,
  Inbox,
} from 'lucide-react';
import { UserProfile } from '../../types/auth.types.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { MetricCard } from '../../components/ui/MetricCard.js';
import { PeriodSelector } from '../../components/ui/PeriodSelector.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import {
  PendingFollowUpTable,
  FutureFollowUpTable,
} from '../sales-dashboard/components/FollowUpSummaryTable.js';
import { NewEnquiryModal } from '../sales-dashboard/components/NewEnquiryModal.js';
import { TeamActivityAccountabilityPanel } from '../reporting/components/TeamActivityAccountabilityPanel.js';
import {
  DashboardPeriod,
  PendingFollowUpData,
  FutureFollowUpData,
} from '../sales-dashboard/types/dashboard.types.js';
import { enquiryService } from '../../services/enquiry.service.js';
import {
  ClientDashboardSummaryData,
  TeamMemberPerformance,
} from '../../types/enquiry.types.js';

interface OutletContextType {
  currentUser: UserProfile;
  onShowPlaceholderNotice: (featureName: string) => void;
}

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, onShowPlaceholderNotice } = useOutletContext<OutletContextType>();
  const [isNewEnquiryModalOpen, setIsNewEnquiryModalOpen] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('today');

  // Manager metrics & team performance state
  const [summary, setSummary] = useState<ClientDashboardSummaryData | null>(null);
  const [team, setTeam] = useState<TeamMemberPerformance[]>([]);
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const fetchManagerData = useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const [sumRes, teamRes, unassignedRes] = await Promise.all([
        enquiryService.getDashboardSummary(),
        enquiryService.getTeamPerformance(),
        enquiryService.getEnquiries({ unassigned: true, limit: 1 }).catch(() => null),
      ]);

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      } else {
        setSummaryError(sumRes.message || 'Failed to load manager dashboard summary.');
      }

      if (teamRes.success && teamRes.data?.team) {
        setTeam(teamRes.data.team);
      }

      if (unassignedRes?.success && unassignedRes.data) {
        setUnassignedCount(
          unassignedRes.data.pagination?.total ??
            unassignedRes.data.pagination?.totalCount ??
            (unassignedRes.data.enquiries || []).length
        );
      }
    } catch (err: unknown) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading manager dashboard.'
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchManagerData();
  }, [fetchManagerData]);

  // Auto-refresh when network connectivity is restored
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleReconnected = () => {
      fetchManagerData();
    };

    window.addEventListener('nueways:reconnected', handleReconnected);
    return () => window.removeEventListener('nueways:reconnected', handleReconnected);
  }, [fetchManagerData]);

  const handleRefreshAll = () => {
    fetchManagerData();
  };

  // Metric Computations
  const activeAgentsCount = summary?.activeAgentsCount ?? team.filter((a) => a.isActive).length;
  const activeLeadCount = summary?.activePipelineCount ?? 0;
  const pendingFollowUpCount = summary?.pendingFollowUpsCount ?? 0;
  const futureFollowUpCount = summary?.futureFollowUpsCount ?? 0;
  const completedDealCount = summary?.completedDealsCount ?? 0;
  const rejectedCount = summary?.rejectedCount ?? 0;
  const dealLostCount = summary?.dealLostCount ?? 0;
  const explicitRejectedCount = summary?.explicitRejectedCount ?? Math.max(0, rejectedCount - dealLostCount);

  // Stage Breakdown
  const stageFollowUp = summary?.stageBreakdown?.followUp ?? 0;
  const stageMeetingPlan = summary?.stageBreakdown?.meetingPlan ?? 0;
  const stageSiteVisitPlan = summary?.stageBreakdown?.siteVisitPlan ?? 0;
  const stageDealDone = summary?.stageBreakdown?.dealDone ?? completedDealCount;
  const totalStageLeads = (stageFollowUp + stageMeetingPlan + stageSiteVisitPlan + stageDealDone) || 1;

  const pctFollowUp = Math.round((stageFollowUp / totalStageLeads) * 100);
  const pctMeeting = Math.round((stageMeetingPlan / totalStageLeads) * 100);
  const pctSiteVisit = Math.round((stageSiteVisitPlan / totalStageLeads) * 100);
  const pctDealDone = Math.round((stageDealDone / totalStageLeads) * 100);

  // Follow-Up Table Data derived directly from backend summary
  const pendingFollowUpsData: PendingFollowUpData = {
    title: 'Pending Follow-up',
    badgeText: pendingFollowUpCount > 0 ? '• Requires Attention' : 'Zero Backlog',
    subtitle: 'Immediate pending follow-up backlog categorized by stage',
    stages: summary?.pendingStages || [
      { stage: 'Stage 1', contacted: 0, detailShared: 0, meeting: 'N/A', siteVisit: 'N/A' },
      { stage: 'Stage 2', contacted: 'N/A', detailShared: 'N/A', meeting: 0, siteVisit: 'N/A' },
      { stage: 'Stage 3', contacted: 'N/A', detailShared: 'N/A', meeting: 'N/A', siteVisit: 0 },
    ],
  };

  const futureFollowUpsData: FutureFollowUpData = {
    title: 'Future Follow-up',
    badgeText: 'Scheduled',
    subtitle: 'Scheduled upcoming pipeline activities for future dates',
    stages: summary?.futureStages || [
      { stage: 'Stage 1', contacted: 0, detailShared: 0, meeting: 'N/A', siteVisit: 'N/A' },
      { stage: 'Stage 2', contacted: 'N/A', detailShared: 'N/A', meeting: 0, siteVisit: 'N/A' },
      { stage: 'Stage 3', contacted: 'N/A', detailShared: 'N/A', meeting: 'N/A', siteVisit: 0 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
       * Top Dashboard Header & Controls
       * ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Manager Dashboard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Manager Overview
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Welcome back,{' '}
            <span className="font-semibold text-content-secondary">
              {currentUser.name}
            </span>
            . Real-time performance overview, lead pipeline, and workload tracking for your sales team.
          </p>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />

          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoadingSummary ? 'animate-spin' : ''}`} />}
            onClick={handleRefreshAll}
            disabled={isLoadingSummary}
          >
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<Users className="h-4 w-4" />}
            onClick={() => navigate('/manager/team')}
          >
            Sales Team
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            onClick={() => navigate('/bulk-upload')}
            title="Bulk Data Upload (Excel / CSV)"
            className="hover:border-emerald-500 hover:text-emerald-700 font-medium"
          >
            <span>Bulk Data Upload</span>
            <span className="hidden sm:inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Excel / CSV
            </span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsNewEnquiryModalOpen(true)}
            className="shadow-sm shadow-blue-500/20"
          >
            New Team Lead
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * Metric Cards Grid (6 cards)
       * ------------------------------------------------------------- */}
      {isLoadingSummary ? (
        <LoadingState message="Loading manager overview metrics..." rows={2} />
      ) : summaryError ? (
        <ErrorState message={summaryError} onRetry={fetchManagerData} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Active Sales Agents */}
            <MetricCard
              title="Active Agents"
              subtitle="Team Roster"
              value={activeAgentsCount}
              badgeText={`${team.length} Total`}
              badgeType={activeAgentsCount > 0 ? 'positive' : 'neutral'}
              icon={<Users className="w-5 h-5" />}
              iconBgColor="bg-blue-50 text-brand-primary"
              isMockData={false}
              ariaLabel="View active sales team roster"
              onClick={() => navigate('/manager/team')}
            />

            {/* 2. Active Team Leads */}
            <MetricCard
              title="Active Leads"
              subtitle="Pipeline Portfolio"
              value={activeLeadCount}
              badgeText="In Progress"
              badgeType="info"
              icon={<Filter className="w-5 h-5" />}
              iconBgColor="bg-indigo-50 text-indigo-600"
              isMockData={false}
              ariaLabel="View active team leads"
              onClick={() => navigate('/leads?tab=active')}
            />

            {/* 3. Unassigned Leads */}
            <MetricCard
              title="Unassigned Leads"
              subtitle="Needs Agent Assignment"
              value={unassignedCount}
              badgeText={unassignedCount > 0 ? 'Assign Now' : 'All Assigned'}
              badgeType={unassignedCount > 0 ? 'warning' : 'positive'}
              icon={<Inbox className="w-5 h-5" />}
              iconBgColor="bg-violet-50 text-violet-600"
              isMockData={false}
              ariaLabel="View unassigned leads queue"
              onClick={() => navigate('/leads?tab=unassigned')}
            />

            {/* 4. Pending Follow-ups */}
            <MetricCard
              title="Pending Tasks"
              subtitle="Due / Overdue"
              value={pendingFollowUpCount}
              badgeText={pendingFollowUpCount > 0 ? '• Action Due' : 'All Clear'}
              badgeType={pendingFollowUpCount > 0 ? 'warning' : 'positive'}
              icon={<Clock className="w-5 h-5" />}
              iconBgColor="bg-amber-50 text-amber-600"
              isMockData={false}
              ariaLabel="View pending follow-ups"
              onClick={() => navigate('/follow-ups/pending')}
            />

            {/* 5. Future Follow-ups */}
            <MetricCard
              title="Future Tasks"
              subtitle="Scheduled Calls"
              value={futureFollowUpCount}
              badgeText="Upcoming"
              badgeType="info"
              icon={<Calendar className="w-5 h-5" />}
              iconBgColor="bg-sky-50 text-sky-600"
              isMockData={false}
              ariaLabel="View future follow-ups"
              onClick={() => navigate('/follow-ups/future')}
            />

            {/* 6. Completed Deals */}
            <MetricCard
              title="Completed Deals"
              subtitle="Deals Won"
              value={completedDealCount}
              badgeText="Finalized"
              badgeType="positive"
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgColor="bg-emerald-50 text-emerald-600"
              isMockData={false}
              ariaLabel="View completed deals"
              onClick={() => navigate('/completed-deals')}
            />

            {/* 7. Rejected / Lost Leads */}
            <MetricCard
              title="Rejected / Lost"
              subtitle={
                dealLostCount > 0
                  ? `Rejected: ${explicitRejectedCount} • Lost: ${dealLostCount}`
                  : "Dropped Leads"
              }
              value={rejectedCount}
              badgeText="Closed"
              badgeType="neutral"
              icon={<XCircle className="w-5 h-5" />}
              iconBgColor="bg-red-50 text-red-600"
              isMockData={false}
              ariaLabel="View rejected and lost leads"
              onClick={() => navigate('/leads?tab=rejected')}
            />
          </div>

          {/* -------------------------------------------------------------
           * 4-Stage Sequential Pipeline Workload Breakdown
           * ------------------------------------------------------------- */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  <h2 className="text-base font-bold text-content-primary">
                    4-Stage Pipeline Workload
                  </h2>
                </div>
                <p className="text-xs text-content-muted mt-0.5">
                  Distribution of your team's active prospect pipeline across the sequential sales stages
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/manager/leads')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Inspect Leads
              </Button>
            </div>

            {/* Progress Bar Distribution */}
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden mb-5">
              <div
                style={{ width: `${pctFollowUp}%` }}
                className="bg-blue-500 transition-all duration-300"
                title={`Stage 01 Follow-up: ${stageFollowUp} (${pctFollowUp}%)`}
              />
              <div
                style={{ width: `${pctMeeting}%` }}
                className="bg-purple-500 transition-all duration-300"
                title={`Stage 02 Meeting Plan: ${stageMeetingPlan} (${pctMeeting}%)`}
              />
              <div
                style={{ width: `${pctSiteVisit}%` }}
                className="bg-amber-500 transition-all duration-300"
                title={`Stage 03 Site Visit Plan: ${stageSiteVisitPlan} (${pctSiteVisit}%)`}
              />
              <div
                style={{ width: `${pctDealDone}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Stage 04 Deal Done: ${stageDealDone} (${pctDealDone}%)`}
              />
            </div>

            {/* Stage Detail Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage 1 */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Filter leads by Stage 1 Follow-up"
                onClick={() => navigate('/leads?tab=active&stage=FOLLOW_UP')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/leads?tab=active&stage=FOLLOW_UP');
                  }
                }}
                className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-blue-700 font-bold mb-1">
                  <span>01. Follow-up</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 rounded-full">{pctFollowUp}%</span>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-blue-900">{stageFollowUp}</div>
                <p className="text-[11px] text-blue-700/80 mt-1">Initial contact &amp; requirement discovery</p>
              </div>

              {/* Stage 2 */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Filter leads by Stage 2 Meeting Plan"
                onClick={() => navigate('/leads?tab=active&stage=MEETING_PLAN')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/leads?tab=active&stage=MEETING_PLAN');
                  }
                }}
                className="p-4 rounded-xl border border-purple-100 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-purple-700 font-bold mb-1">
                  <span>02. Meeting Plan</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 rounded-full">{pctMeeting}%</span>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-purple-900">{stageMeetingPlan}</div>
                <p className="text-[11px] text-purple-700/80 mt-1">Manager-level client discussions</p>
              </div>

              {/* Stage 3 */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Filter leads by Stage 3 Site Visit Plan"
                onClick={() => navigate('/leads?tab=active&stage=SITE_VISIT_PLAN')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/leads?tab=active&stage=SITE_VISIT_PLAN');
                  }
                }}
                className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-1">
                  <span>03. Site Visit Plan</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 rounded-full">{pctSiteVisit}%</span>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-amber-900">{stageSiteVisitPlan}</div>
                <p className="text-[11px] text-amber-700/80 mt-1">On-site property tours scheduled</p>
              </div>

              {/* Stage 4 */}
              <div
                role="button"
                tabIndex={0}
                aria-label="View Stage 4 Completed Deals"
                onClick={() => navigate('/completed-deals')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/completed-deals');
                  }
                }}
                className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
                  <span>04. Deal Done</span>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 rounded-full">{pctDealDone}%</span>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-emerald-900">{stageDealDone}</div>
                <p className="text-[11px] text-emerald-700/80 mt-1">Finalized customer conversions</p>
              </div>
            </div>
          </Card>

          {/* -------------------------------------------------------------
           * Team Workload Quick Overview Table
           * ------------------------------------------------------------- */}
          <Card noPadding>
            <div className="p-5 sm:px-6 flex items-center justify-between border-b border-edge">
              <div>
                <h3 className="text-base font-bold text-content-primary">
                  Sales Team Workload Snapshot
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  Direct reports currently active under your managerial supervision
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/manager/team')}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Full Team Management
              </Button>
            </div>

            {team.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No Team Members"
                  description="No sales agents are currently linked to your management account."
                />
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                      <th className="py-3 px-6">Agent Name</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Active Leads</th>
                      <th className="py-3 px-3 text-center">Pending Tasks</th>
                      <th className="py-3 px-3 text-center">Future Tasks</th>
                      <th className="py-3 px-3 text-center">Completed Deals</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge-subtle">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-surface-table-hover transition-colors">
                        <td className="py-3 px-6">
                          <div className="font-semibold text-content-primary">{member.name}</div>
                          <div className="text-[11px] text-content-muted font-mono">{member.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              member.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-brand-primary">
                          {member.activeLeadsCount}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold text-xs ${
                              member.pendingFollowUpsCount > 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'text-slate-500'
                            }`}
                          >
                            {member.pendingFollowUpsCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600">
                          {member.futureFollowUpsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700">
                          {member.completedDealsCount}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate('/manager/team')}
                            className="py-1 px-2 text-xs"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* -------------------------------------------------------------
           * Daily Work & Call Accountability
           * ------------------------------------------------------------- */}
          <TeamActivityAccountabilityPanel viewerRole="MANAGER" />

          {/* -------------------------------------------------------------
           * Follow-Up Summary Tables (Pending & Future)
           * ------------------------------------------------------------- */}
          <div className="space-y-6">
            <PendingFollowUpTable data={pendingFollowUpsData} />
            <FutureFollowUpTable data={futureFollowUpsData} />
          </div>
        </>
      )}

      {/* -------------------------------------------------------------
       * New Team Lead Modal Dialog
       * ------------------------------------------------------------- */}
      <NewEnquiryModal
        isOpen={isNewEnquiryModalOpen}
        onClose={() => setIsNewEnquiryModalOpen(false)}
        isDemoMode={false}
        onEnquiryCreated={(lead) => {
          handleRefreshAll();
          onShowPlaceholderNotice(
            `Lead "${lead.name}" created and assigned to ${lead.assignedTo?.name || 'team agent'} via Team Round Robin.`
          );
        }}
      />
    </div>
  );
};
