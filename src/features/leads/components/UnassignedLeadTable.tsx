import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Phone,
  Mail,
  Building,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { IEnquiry } from '../../../types/enquiry.types.js';
import { Button } from '../../../components/ui/Button.js';

export interface UnassignedLeadTableProps {
  leads: IEnquiry[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onAssignClick: (lead: IEnquiry) => void;
  onBulkAssignClick: (selectedLeads: IEnquiry[]) => void;
}

export const UnassignedLeadTable: React.FC<UnassignedLeadTableProps> = ({
  leads,
  isLoading,
  error,
  onRetry,
  onAssignClick,
  onBulkAssignClick
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const UNASSIGNED_REASONS = [
    'Property/project not selected',
    'Property mapping unavailable',
    'No eligible active Sales Agent',
    'Assignment failed',
    'Assignment pending manual review'
  ];

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Reason filter
      if (selectedReason !== 'ALL') {
        const leadReason = lead.unassignedReason || 'Assignment pending manual review';
        if (leadReason !== selectedReason) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = lead.name?.toLowerCase().includes(term);
        const mobileMatch = lead.mobile?.includes(term);
        const emailMatch = lead.email?.toLowerCase().includes(term);
        const projectMatch = lead.projectName?.toLowerCase().includes(term);
        const reasonMatch = lead.unassignedReason?.toLowerCase().includes(term);
        return nameMatch || mobileMatch || emailMatch || projectMatch || reasonMatch;
      }

      return true;
    });
  }, [leads, selectedReason, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Multi-select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedLeads.map((l) => l.id || (l as any)._id).filter(Boolean));
      setSelectedLeadIds(allIds);
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedLeadObjects = useMemo(() => {
    return leads.filter((l) => selectedLeadIds.has(l.id || (l as any)._id));
  }, [leads, selectedLeadIds]);

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not Specified';
    const fmt = (n: number) => {
      if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
      if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
      return `₹${n.toLocaleString('en-IN')}`;
    };
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `Min ${fmt(min)}`;
    return `Max ${fmt(max!)}`;
  };

  const getReasonBadge = (reason?: string) => {
    const r = reason || 'Assignment pending manual review';
    let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

    if (r.includes('not selected')) {
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
    } else if (r.includes('mapping unavailable')) {
      colorClass = 'bg-rose-50 text-rose-800 border-rose-200';
    } else if (r.includes('No eligible active')) {
      colorClass = 'bg-orange-50 text-orange-800 border-orange-200';
    } else if (r.includes('failed')) {
      colorClass = 'bg-red-50 text-red-800 border-red-200';
    } else if (r.includes('manual review')) {
      colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass}`}>
        <AlertTriangle className="w-3 h-3 shrink-0" />
        <span>{r}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-surface-card border border-edge rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            placeholder="Search unassigned leads by name, phone, project..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-edge rounded-xl focus:outline-none focus:border-brand-primary text-content-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-content-secondary">
            <Filter className="w-3.5 h-3.5 text-content-muted" />
            <span>Reason:</span>
          </div>
          <select
            value={selectedReason}
            onChange={(e) => {
              setSelectedReason(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-surface-subtle border border-edge rounded-xl px-3 py-2 text-content-primary focus:outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Reasons ({leads.length})</option>
            {UNASSIGNED_REASONS.map((r) => {
              const count = leads.filter((l) => (l.unassignedReason || 'Assignment pending manual review') === r).length;
              return (
                <option key={r} value={r}>
                  {r} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar when items selected */}
      {selectedLeadIds.size > 0 && (
        <div className="p-3 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-brand-primary font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>{selectedLeadIds.size} lead(s) selected for assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLeadIds(new Set())}
              className="px-3 py-1.5 text-xs text-content-secondary hover:text-content-primary transition"
            >
              Clear Selection
            </button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onBulkAssignClick(selectedLeadObjects)}
              icon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Assign Selected ({selectedLeadIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-surface-card border border-edge rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-content-muted flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading unassigned leads...</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-20 text-center text-xs text-content-muted flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <Inbox className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-content-primary">No Unassigned Leads</h3>
              <p className="text-xs text-content-muted max-w-sm">
                {searchTerm || selectedReason !== 'ALL'
                  ? 'No unassigned leads match your current search and filter criteria.'
                  : 'All leads are currently assigned to sales agents or teams.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-edge text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedLeads.length > 0 &&
                        paginatedLeads.every((l) => selectedLeadIds.has(l.id || (l as any)._id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-edge text-brand-primary focus:ring-brand-primary"
                      aria-label="Select all unassigned leads on page"
                    />
                  </th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Property / Project</th>
                  <th className="py-3.5 px-4">Budget &amp; Requirement</th>
                  <th className="py-3.5 px-4">Source &amp; Date</th>
                  <th className="py-3.5 px-4">Unassigned Reason</th>
                  <th className="py-3.5 px-4">Assignment Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {paginatedLeads.map((lead) => {
                  const leadId = lead.id || (lead as any)._id;
                  const isSelected = selectedLeadIds.has(leadId);

                  return (
                    <tr
                      key={leadId}
                      className={`hover:bg-surface-subtle/50 transition-colors ${
                        isSelected ? 'bg-brand-primary/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(leadId)}
                          className="rounded border-edge text-brand-primary focus:ring-brand-primary"
                          aria-label={`Select lead ${lead.name}`}
                        />
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="font-bold text-content-primary">{lead.name}</div>
                        <div className="flex items-center gap-1.5 text-content-secondary text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-content-muted" />
                          <span>{lead.mobile}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-content-muted text-[11px]">
                            <Mail className="w-3 h-3 text-content-muted" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Property / Project */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {lead.projectName ? (
                          <div className="flex items-center gap-1.5 font-medium text-brand-primary">
                            <Building className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <span>{lead.projectName}</span>
                          </div>
                        ) : (
                          <span className="text-content-muted italic">Not Selected</span>
                        )}
                      </td>

                      {/* Budget & Requirement */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-content-primary">
                          {formatBudget(lead.budgetMin, lead.budgetMax)}
                        </div>
                        {lead.requirement && (
                          <div className="text-[11px] text-content-muted mt-0.5">
                            Req: {lead.requirement}
                          </div>
                        )}
                      </td>

                      {/* Source & Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-content-muted text-[11px]">
                        <div className="font-medium text-content-secondary">
                          {lead.source || 'Bulk Upload'}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-content-subtle">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {lead.createdAt
                              ? new Date(lead.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Unassigned Reason */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getReasonBadge(lead.unassignedReason)}
                      </td>

                      {/* Assignment Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Unassigned
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onAssignClick(lead)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 rounded-xl transition shadow-xs active:scale-95"
                          title="Assign this lead to an agent"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-content-muted">
            <div>
              Showing <strong className="text-content-primary">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-content-primary">
                {Math.min(currentPage * pageSize, filteredLeads.length)}
              </strong>{' '}
              of <strong className="text-content-primary">{filteredLeads.length}</strong> unassigned leads
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              <span className="px-2 text-content-primary font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
