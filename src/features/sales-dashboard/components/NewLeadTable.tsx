import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  PhoneCall,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Button } from '../../../components/ui/Button.js';
import { StatusBadge } from '../../../components/ui/StatusBadge.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { ErrorState } from '../../../components/ui/ErrorState.js';
import { NewLeadItem, DashboardPeriod } from '../types/dashboard.types.js';
import { matchesTableFilters } from '../utils/dashboardFilters.js';
import { AuthContext } from '../../../context/AuthContext.js';

export interface NewLeadTableProps {
  leads: NewLeadItem[];
  isLoading?: boolean;
  error?: string | null;
  isDemoMode?: boolean;
  selectedPeriod?: DashboardPeriod;
  onPeriodChange?: (period: DashboardPeriod) => void;
  onRetry?: () => void;
  onFollowUpClick: (lead: NewLeadItem) => void;
  onShowNotice: (action: string) => void;
  hideAgentFilter?: boolean;
}

export const NewLeadTable: React.FC<NewLeadTableProps> = ({
  leads,
  isLoading = false,
  error = null,
  selectedPeriod,
  onPeriodChange,
  onRetry,
  onFollowUpClick,
  onShowNotice,
  hideAgentFilter,
}) => {
  const auth = useContext(AuthContext);
  const isSalesUser = hideAgentFilter ?? (auth?.user?.role === 'SALES');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Table filter criteria state
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [followUpFilter, setFollowUpFilter] = useState<string>('ALL');

  // Compute distinct assigned agents present in the current leads dataset
  const distinctAgents = useMemo(() => {
    const agents = new Set<string>();
    leads.forEach((l) => {
      if (l.assignedTo?.name) {
        agents.add(l.assignedTo.name);
      }
    });
    return Array.from(agents).sort();
  }, [leads]);

  const hasUnassignedLeads = useMemo(() => {
    return leads.some((l) => !l.assignedTo);
  }, [leads]);

  // Active filters count
  const activeFiltersCount =
    (stageFilter !== 'ALL' ? 1 : 0) +
    (statusFilter !== 'ALL' ? 1 : 0) +
    (!isSalesUser && agentFilter !== 'ALL' ? 1 : 0) +
    (followUpFilter !== 'ALL' ? 1 : 0);
  const hasActiveTableFilters = activeFiltersCount > 0;

  // Reset table filters to initial default state
  const handleResetFilters = () => {
    setStageFilter('ALL');
    setStatusFilter('ALL');
    setAgentFilter('ALL');
    setFollowUpFilter('ALL');
    setCurrentPage(1);
  };

  // Filter leads based on table filter state
  const displayedLeads = useMemo(() => {
    return leads.filter((lead) =>
      matchesTableFilters(lead, {
        stage: stageFilter,
        status: statusFilter,
        agent: isSalesUser ? 'ALL' : agentFilter,
        followUp: followUpFilter,
      })
    );
  }, [leads, stageFilter, statusFilter, agentFilter, followUpFilter, isSalesUser]);

  // Reset page to 1 whenever filters change or source leads change
  useEffect(() => {
    setCurrentPage(1);
  }, [stageFilter, statusFilter, agentFilter, followUpFilter, leads]);

  // Pagination parameters calculated against displayedLeads
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(displayedLeads.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = displayedLeads.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, displayedLeads.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Card className="mb-6" noPadding>
      {/* Card Header matching Stitch design */}
      <div className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-primary shrink-0" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-bold text-content-primary">
            New Lead
          </h2>
          <StatusBadge
            label={`${displayedLeads.length} Enquiries`}
            variant="primary"
          />
          {hasActiveTableFilters && (
            <span className="text-[11px] font-medium text-brand-primary bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 hidden sm:inline-block">
              Filtered ({displayedLeads.length} of {leads.length})
            </span>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isFilterPanelOpen || hasActiveTableFilters ? 'primary' : 'outline'}
            icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            aria-expanded={isFilterPanelOpen}
            aria-label="Filter lead table"
          >
            Filter
            {activeFiltersCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-white text-brand-primary text-[10px] font-extrabold rounded-full shadow-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() => onShowNotice('Export New Leads')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Expandable Table Filter Panel */}
      {isFilterPanelOpen && (
        <div className="p-3.5 sm:px-6 bg-surface-subtle border-b border-edge flex flex-wrap items-end gap-3 text-xs animate-in fade-in duration-150">
          {/* Current Stage */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label htmlFor="filter-lead-stage" className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
              Current Stage
            </label>
            <select
              id="filter-lead-stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-card border border-edge rounded-lg text-content-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            >
              <option value="ALL">All Stages</option>
              <option value="FOLLOW_UP">01. Follow-up</option>
              <option value="MEETING_PLAN">02. Meeting Plan</option>
              <option value="SITE_VISIT_PLAN">03. Site Visit Plan</option>
              <option value="DEAL_DONE">04. Deal Done</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1 min-w-[110px]">
            <label htmlFor="filter-lead-status" className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
              Status
            </label>
            <select
              id="filter-lead-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-card border border-edge rounded-lg text-content-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          {/* Assigned Agent (Visible to Admin and Manager; hidden for Sales Agent) */}
          {!isSalesUser && (
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label htmlFor="filter-lead-agent" className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                Assigned Agent
              </label>
              <select
                id="filter-lead-agent"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-surface-card border border-edge rounded-lg text-content-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
              >
                <option value="ALL">All Agents</option>
                {hasUnassignedLeads && (
                  <option value="__UNASSIGNED__">Unassigned Queue</option>
                )}
                {distinctAgents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Follow-up Date */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label htmlFor="filter-lead-followup" className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
              Follow-up Date
            </label>
            <select
              id="filter-lead-followup"
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-card border border-edge rounded-lg text-content-primary text-xs focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            >
              <option value="ALL">All Follow-ups</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="NONE">None Scheduled</option>
              <option value="TODAY">Scheduled Today</option>
              <option value="WEEK">Scheduled This Week</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {/* Clear / Reset Filters Action */}
          {hasActiveTableFilters && (
            <div className="pb-0.5">
              <Button
                size="sm"
                variant="outline"
                icon={<RotateCcw className="h-3 w-3" />}
                onClick={handleResetFilters}
                className="text-xs text-content-secondary hover:text-content-primary"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Body States */}
      {isLoading ? (
        <LoadingState message="Fetching latest new leads..." rows={5} />
      ) : error ? (
        <div className="p-6">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : leads.length === 0 ? (
        selectedPeriod === 'today' ? (
          <EmptyState
            title="No Enquiries for Today"
            description="There are currently no new leads or follow-ups scheduled for today in your queue."
            actionLabel={onPeriodChange ? "View This Week's Leads" : undefined}
            onAction={onPeriodChange ? () => onPeriodChange('week') : undefined}
          />
        ) : (
          <EmptyState
            title="No New Leads"
            description="There are currently no new unassigned enquiries in your operational queue."
          />
        )
      ) : displayedLeads.length === 0 ? (
        <EmptyState
          title="No Matching Leads"
          description="No leads match the selected filter criteria. Clear or adjust your filters to view leads."
          actionLabel="Reset Table Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          {/* Responsive Data Table */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3 w-14">
                    Sr. No.
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[200px]">
                    Lead Details
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[130px]">
                    Mobile
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[140px]">
                    Current Stage
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[90px]">
                    Status
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[150px]">
                    Next Follow-up
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right min-w-[140px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {displayedLeads
                  .slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
                  .map((lead) => {
                    const stageBadge = (() => {
                      switch (lead.currentStage) {
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
                    })();

                    const nextFollowUpFormatted = lead.nextFollowUpDate
                      ? `${new Date(lead.nextFollowUpDate).toLocaleDateString()} ${lead.nextFollowUpTime || ''}`.trim()
                      : null;

                    const actionButtonText = lead.currentStage === 'DEAL_DONE'
                      ? 'View Deal'
                      : lead.currentStage && lead.currentStage !== 'FOLLOW_UP'
                      ? 'Continue'
                      : 'Follow-up';

                    const actionIcon = lead.currentStage === 'DEAL_DONE' ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : lead.currentStage && lead.currentStage !== 'FOLLOW_UP' ? (
                      <ArrowRight className="h-3 w-3" />
                    ) : (
                      <PhoneCall className="h-3 w-3" />
                    );

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-surface-table-hover transition-colors duration-100 group"
                      >
                        {/* 1. Sr. No. */}
                        <td className="py-3.5 pl-6 pr-3 font-semibold text-content-subtle text-xs">
                          {lead.srNo}
                        </td>

                        {/* 2. Name & Info */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${lead.avatarColor}`}
                            >
                              {lead.initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-content-primary block">
                                  {lead.name}
                                </span>
                                {lead.isDoNotContact && (
                                  <span
                                    data-testid="lead-dnc-badge"
                                    className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200"
                                    title="Do Not Contact Restricted"
                                  >
                                    DNC
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-content-muted">
                                {lead.projectName && (
                                  <span className="font-medium text-slate-600">
                                    {lead.projectName}
                                  </span>
                                )}
                                {lead.assignedTo ? (
                                  <span className="inline-flex items-center bg-blue-50 text-brand-primary px-1.5 py-0.2 rounded border border-blue-100">
                                    {lead.assignedTo.name}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Mobile (Privacy Masked) */}
                        <td className="py-3.5 px-3 text-content-secondary font-mono text-xs">
                          {lead.mobile}
                        </td>

                        {/* 4. Current Stage */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${stageBadge.cls}`}
                          >
                            {stageBadge.label}
                          </span>
                        </td>

                        {/* 5. Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded ${
                              lead.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {lead.status || 'ACTIVE'}
                          </span>
                        </td>

                        {/* 6. Next Follow-up */}
                        <td className="py-3.5 px-3 text-xs">
                          {nextFollowUpFormatted ? (
                            <div className="flex items-center gap-1 text-blue-900 font-medium">
                              <Calendar className="h-3 w-3 text-brand-primary shrink-0" />
                              <span>{nextFollowUpFormatted}</span>
                            </div>
                          ) : (
                            <span className="text-content-muted italic text-[11px]">None scheduled</span>
                          )}
                        </td>

                        {/* 7. Action Button */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <Button
                            size="sm"
                            variant={lead.currentStage === 'DEAL_DONE' ? 'outline' : 'primary'}
                            icon={actionIcon}
                            onClick={() => onFollowUpClick(lead)}
                            className="py-1 px-3 text-xs shadow-xs"
                          >
                            {actionButtonText}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination & Counts */}
          <div className="p-3.5 sm:px-6 border-t border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-content-muted">
            <div>
              Showing <span className="font-semibold text-content-primary">{startIdx}</span> to{' '}
              <span className="font-semibold text-content-primary">{endIdx}</span> of{' '}
              <span className="font-semibold text-content-primary">{displayedLeads.length}</span> new leads
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-edge hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {pageNumbers.slice(0, 5).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-7 w-7 rounded border text-xs font-medium transition-colors ${
                    safeCurrentPage === pageNum
                      ? 'bg-brand-primary text-white border-brand-primary font-bold'
                      : 'border-edge hover:bg-surface-subtle text-content-secondary'
                  }`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={safeCurrentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-edge hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
