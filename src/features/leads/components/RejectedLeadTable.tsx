import React, { useState } from 'react';
import {
  XCircle,
  ArrowRight,
  Calendar,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Button } from '../../../components/ui/Button.js';
import { StatusBadge } from '../../../components/ui/StatusBadge.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { ErrorState } from '../../../components/ui/ErrorState.js';
import { IEnquiry } from '../../../types/enquiry.types.js';

export interface RejectedLeadTableProps {
  leads: IEnquiry[];
  isLoading?: boolean;
  error?: string | null;
  totalCount?: number;
  onRetry?: () => void;
  onViewDetails: (lead: IEnquiry) => void;
}

export const RejectedLeadTable: React.FC<RejectedLeadTableProps> = ({
  leads,
  isLoading = false,
  error = null,
  totalCount,
  onRetry,
  onViewDetails,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'REJECTED' | 'DEAL_LOST' | 'LEGACY'>('ALL');
  const pageSize = 10;

  const rejectedOnlyCount = leads.filter((l) => l.rejection?.closureType === 'REJECTED').length;
  const dealLostOnlyCount = leads.filter((l) => l.rejection?.closureType === 'DEAL_LOST').length;
  const legacyOnlyCount = leads.filter((l) => !l.rejection?.closureType).length;

  const filteredLeads = leads.filter((lead) => {
    if (outcomeFilter === 'REJECTED') return lead.rejection?.closureType === 'REJECTED';
    if (outcomeFilter === 'DEAL_LOST') return lead.rejection?.closureType === 'DEAL_LOST';
    if (outcomeFilter === 'LEGACY') return !lead.rejection?.closureType;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = filteredLeads.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIdx = Math.min(safeCurrentPage * pageSize, filteredLeads.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Card className="mb-6" noPadding>
      {/* Header */}
      <div className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-bold text-content-primary">
            Rejected &amp; Lost Leads
          </h2>
          <StatusBadge
            label={`${totalCount !== undefined ? totalCount : leads.length} Records`}
            variant="warning"
          />
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={onRetry}
              disabled={isLoading}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* REQ-36: Outcome Filter Pills */}
      {!isLoading && !error && leads.length > 0 && (
        <div className="px-5 py-3 bg-surface-subtle border-b border-edge flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-content-muted text-[11px] uppercase tracking-wider mr-1">
            Closure Outcome:
          </span>
          <button
            type="button"
            onClick={() => { setOutcomeFilter('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              outcomeFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-surface-card border border-edge text-content-secondary hover:bg-surface-hover'
            }`}
          >
            All Closed ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => { setOutcomeFilter('REJECTED'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              outcomeFilter === 'REJECTED'
                ? 'bg-red-700 text-white'
                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            }`}
          >
            Rejected Only ({rejectedOnlyCount})
          </button>
          <button
            type="button"
            onClick={() => { setOutcomeFilter('DEAL_LOST'); setCurrentPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              outcomeFilter === 'DEAL_LOST'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Deal Lost Only ({dealLostOnlyCount})
          </button>
          {legacyOnlyCount > 0 && (
            <button
              type="button"
              onClick={() => { setOutcomeFilter('LEGACY'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                outcomeFilter === 'LEGACY'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
              }`}
            >
              Legacy / Unknown ({legacyOnlyCount})
            </button>
          )}
        </div>
      )}

      {/* Body States */}
      {isLoading ? (
        <LoadingState message="Fetching rejected / lost enquiries from backend..." rows={5} />
      ) : error ? (
        <div className="p-6">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="No Rejected / Lost Leads"
          description="There are currently no enquiries marked as rejected or lost in the database."
        />
      ) : (
        <>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3 w-14">
                    Sr. No.
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[190px]">
                    Customer / Lead Name
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[140px]">
                    Assigned Sales Agent
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[140px]">
                    Previous Stage
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[160px]">
                    Rejection Reason
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[180px]">
                    Remarks
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[150px]">
                    Rejection Date &amp; Time
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right min-w-[120px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-content-muted">
                      No closed leads match the selected &quot;{outcomeFilter}&quot; filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeads
                    .slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize)
                    .map((lead, index) => {
                    const srNo = String((safeCurrentPage - 1) * pageSize + index + 1).padStart(2, '0');

                    // Assigned agent
                    const assignedName =
                      typeof lead.assignedTo === 'object' && lead.assignedTo
                        ? (lead.assignedTo as any).name
                        : lead.assignedToName || 'Unassigned';

                    // Previous stage formatting
                    const prevStage = lead.rejection?.previousStage || lead.currentStage || 'FOLLOW_UP';
                    const stageBadge = (() => {
                      switch (prevStage) {
                        case 'MEETING_PLAN':
                          return { label: '02. Meeting Plan', cls: 'bg-purple-50 text-purple-700 border-purple-200' };
                        case 'SITE_VISIT_PLAN':
                          return { label: '03. Site Visit Plan', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
                        case 'DEAL_DONE':
                          return { label: '04. Deal Done', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
                        case 'FOLLOW_UP':
                        default:
                          return { label: '01. Follow-up', cls: 'bg-blue-50 text-brand-primary border-blue-200' };
                      }
                    })();

                    // Rejection reason
                    const reason = lead.rejection?.reason || 'Closed';
                    const remarks = lead.rejection?.remarks || '—';

                    // Rejection date
                    const dateStr = lead.rejection?.rejectedAt
                      ? new Date(lead.rejection.rejectedAt).toLocaleString('en-IN')
                      : new Date(lead.updatedAt).toLocaleString('en-IN');

                    // Initials
                    const names = (lead.name || 'Prospect').split(' ');
                    const initials = ((names[0]?.[0] || 'N') + (names[1]?.[0] || '')).toUpperCase();

                    return (
                      <tr
                        key={lead.id || (lead as any)._id}
                        className="hover:bg-surface-table-hover transition-colors duration-100 group"
                      >
                        {/* 1. Sr. No. */}
                        <td className="py-3.5 pl-6 pr-3 font-semibold text-content-subtle text-xs">
                          {srNo}
                        </td>

                        {/* 2. Customer / Lead Name */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                lead.rejection?.closureType === 'DEAL_LOST'
                                  ? 'bg-amber-100 text-amber-700'
                                  : lead.rejection?.closureType === 'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <span className="font-semibold text-content-primary block">
                                {lead.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-content-muted">
                                {lead.projectName && (
                                  <span className="font-medium text-slate-600 flex items-center gap-0.5">
                                    <Building className="h-2.5 w-2.5" />
                                    {lead.projectName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Assigned Sales Agent */}
                        <td className="py-3.5 px-3 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-brand-primary border border-blue-200 font-semibold text-[11px]">
                            <User className="h-3 w-3" />
                            {assignedName}
                          </span>
                        </td>

                        {/* 4. Previous Workflow Stage */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${stageBadge.cls}`}
                          >
                            {stageBadge.label}
                          </span>
                        </td>

                        {/* 5. Rejection Reason */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                lead.rejection?.closureType === 'DEAL_LOST'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : lead.rejection?.closureType === 'REJECTED'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {lead.rejection?.closureType === 'DEAL_LOST'
                                ? 'Deal Lost'
                                : lead.rejection?.closureType === 'REJECTED'
                                ? 'Rejected'
                                : 'Legacy'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                                lead.rejection?.closureType === 'DEAL_LOST'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {lead.rejection?.closureType === 'DEAL_LOST' ? (
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 shrink-0" />
                              )}
                              {reason}
                            </span>
                          </div>
                        </td>

                        {/* 6. Remarks */}
                        <td className="py-3.5 px-3 text-xs text-content-secondary max-w-[200px] truncate" title={remarks}>
                          {remarks}
                        </td>

                        {/* 7. Rejection Date & Time */}
                        <td className="py-3.5 px-3 text-xs text-content-muted">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                        </td>

                        {/* 8. Action */}
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<ArrowRight className="h-3 w-3" />}
                            onClick={() => onViewDetails(lead)}
                            className="py-1 px-3 text-xs shadow-xs"
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Pagination */}
          <div className="p-4 px-6 border-t border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-content-muted">
            <div>
              Showing <span className="font-semibold text-content-primary">{startIdx}</span> to{' '}
              <span className="font-semibold text-content-primary">{endIdx}</span> of{' '}
              <span className="font-semibold text-content-primary">{filteredLeads.length}</span> records
              {outcomeFilter !== 'ALL' && ` (filtered from ${leads.length} total)`}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2 py-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      safeCurrentPage === p
                        ? 'bg-brand-primary text-white'
                        : 'text-content-muted hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2 py-1"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
