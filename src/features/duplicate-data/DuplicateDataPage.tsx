import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Copy,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  ShieldAlert,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../../types/auth.types.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { DuplicateRecordItem } from '../../types/enquiry.types.js';
import { Button } from '../../components/ui/Button.js';

interface OutletContextType {
  currentUser: UserProfile;
}

export interface DuplicateDataPageProps {
  isEmbedded?: boolean;
  currentUser?: UserProfile;
}

export const DuplicateDataPage: React.FC<DuplicateDataPageProps> = ({
  isEmbedded = false,
  currentUser: propUser
}) => {
  const outlet = useOutletContext<OutletContextType | null>();
  const currentUser = propUser || outlet?.currentUser;
  const navigate = useNavigate();

  const [records, setRecords] = useState<DuplicateRecordItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [matchReason, setMatchReason] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'MANUAL' | 'BULK'>('ALL');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDuplicates = useCallback(async (targetPage = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await enquiryService.getDuplicateRecords({
        page: targetPage,
        limit: 15,
        search: debouncedSearch.trim() || undefined,
        matchReason: matchReason !== 'ALL' ? matchReason : undefined,
        includeBulk: true,
        source: sourceFilter !== 'ALL' ? sourceFilter : undefined
      });

      const payload = res.data || ((res as any)?.duplicateRecords ? (res as any) : null);
      if (res.success && payload) {
        setRecords(payload.duplicateRecords || []);
        setTotalCount(payload.totalCount || 0);
        setTotalPages(payload.pagination?.totalPages || 1);
        setPage(payload.pagination?.page || targetPage);
      } else {
        setRecords([]);
        setTotalCount(0);
        setError(res.message || 'Failed to retrieve duplicate records.');
      }
    } catch (err: any) {
      setRecords([]);
      setTotalCount(0);
      setError(err?.message || 'Error connecting to server.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, matchReason, sourceFilter]);

  useEffect(() => {
    fetchDuplicates(page);
  }, [fetchDuplicates, page]);

  const getScopeDescription = () => {
    if (currentUser?.role === 'ADMIN') {
      return 'Company-wide duplicate records across all teams, including manual entries and bulk uploads.';
    }
    if (currentUser?.role === 'MANAGER') {
      return 'Duplicate records belonging only to your team members.';
    }
    return 'Duplicate records scoped strictly to your assigned leads.';
  };

  const getScopeBadge = () => {
    if (currentUser?.role === 'ADMIN') {
      return { label: 'Company-Wide Scope', className: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    if (currentUser?.role === 'MANAGER') {
      return { label: 'My Team Scope', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    return { label: 'My Leads Scope', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const scopeBadge = getScopeBadge();

  // Helper to resolve review status badge
  const renderReviewStatusBadge = (item: DuplicateRecordItem) => {
    if (item.previousEnquiry.isDealDone) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>Deal Done (Can Reopen)</span>
        </span>
      );
    }
    if (item.previousEnquiry.isRejected) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <RotateCcw className="w-3 h-3" />
          <span>Rejected (Can Reopen)</span>
        </span>
      );
    }
    if (item.previousEnquiry.status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-blue-200">
          <UserCheck className="w-3 h-3" />
          <span>Active in Pipeline</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
        <Clock className="w-3 h-3" />
        <span>Pending Review</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Standalone Header (hidden if embedded) */}
      {!isEmbedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
              <span>Neuways CRM</span>
              <span className="text-slate-300">/</span>
              <span>Duplicate Data Management</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
                Duplicate Data Records
              </h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scopeBadge.className}`}>
                {scopeBadge.label}
              </span>
            </div>
            <p className="text-xs text-content-secondary mt-1 max-w-2xl">
              {getScopeDescription()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <div className="px-3.5 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary">
              Total Duplicates: <strong className="text-brand-primary">{totalCount}</strong>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchDuplicates(page)}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface-card border border-edge rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            type="text"
            placeholder="Search by name, phone, email, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-subtle border border-edge rounded-lg focus:outline-none focus:border-brand-primary text-content-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Source Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-content-muted">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value as any);
                setPage(1);
              }}
              className="text-xs bg-surface-subtle border border-edge rounded-lg px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Sources</option>
              <option value="MANUAL">Manual Entry</option>
              <option value="BULK">Bulk Upload</option>
            </select>
          </div>

          {/* Match Reason Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-content-muted" />
            <select
              value={matchReason}
              onChange={(e) => {
                setMatchReason(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-surface-subtle border border-edge rounded-lg px-2.5 py-1.5 text-content-primary focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">All Match Types</option>
              <option value="MOBILE">Mobile Match Only</option>
              <option value="EMAIL">Email Match Only</option>
              <option value="BOTH">Both Fields Match</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchDuplicates(page)}
            disabled={isLoading}
            className="hidden sm:inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate Records Table */}
      <div className="bg-surface-card border border-edge rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-content-muted text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
            <span>Loading duplicate records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center text-content-muted text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
              <Copy className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-content-primary">
                No Duplicate Records Found
              </h3>
              <p className="text-xs text-content-muted leading-relaxed">
                {searchTerm || matchReason !== 'ALL' || sourceFilter !== 'ALL'
                  ? 'No duplicate match events match your search filters.'
                  : 'No duplicate creation attempts have been detected in your authorized scope.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-edge text-[11px] font-bold uppercase tracking-wider text-content-secondary">
                <tr>
                  <th className="py-3 px-4">Detection Date</th>
                  <th className="py-3 px-4">Attempted Lead Details</th>
                  <th className="py-3 px-4">Duplicate Reference</th>
                  <th className="py-3 px-4">Matched Field</th>
                  <th className="py-3 px-4">Existing / Previous Lead Record</th>
                  <th className="py-3 px-4">Lead Owner</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {records.map((item) => {
                  const isBulk = item.source === 'Bulk Upload' || (item as any).importId;
                  const canReopen = item.previousEnquiry.isDealDone || item.previousEnquiry.isRejected;

                  return (
                    <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors">
                      {/* Detection Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-content-muted text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-content-subtle" />
                          <span>
                            {new Date(item.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-content-subtle mt-0.5">
                          <span>By:</span>
                          <span className="font-medium text-content-secondary">{item.performedByName}</span>
                          {isBulk && (
                            <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FileSpreadsheet className="w-2.5 h-2.5" />
                              Bulk
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4 min-w-[170px]">
                        <div className="font-bold text-content-primary">
                          {item.attemptedLead.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-content-secondary text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-content-muted" />
                          <span>{item.attemptedLead.mobile}</span>
                        </div>
                        {item.attemptedLead.email && (
                          <div className="flex items-center gap-1.5 text-content-muted text-[11px]">
                            <Mail className="w-3 h-3 text-content-muted" />
                            <span className="truncate max-w-[160px]">{item.attemptedLead.email}</span>
                          </div>
                        )}
                        {item.attemptedLead.projectName && (
                          <div className="text-[10px] font-medium text-brand-primary mt-0.5">
                            Project: {item.attemptedLead.projectName}
                          </div>
                        )}
                      </td>

                      {/* Duplicate Reference */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] font-medium text-content-secondary">
                          {item.duplicateReference || item.importId || `DUP-${item.id.slice(-6).toUpperCase()}`}
                        </div>
                        {item.importRowNumber && (
                          <div className="text-[10px] text-content-muted">
                            Row #{item.importRowNumber}
                          </div>
                        )}
                      </td>

                      {/* Matched Field */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            item.matchReason === 'BOTH'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : item.matchReason === 'EMAIL'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>{item.matchReason === 'BOTH' ? 'Mobile & Email' : `${item.matchReason} Match`}</span>
                        </span>
                      </td>

                      {/* Existing Lead Record */}
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="font-bold text-content-primary">
                          {item.previousEnquiry.name}
                        </div>
                        <div className="text-[11px] text-content-secondary">
                          {item.previousEnquiry.projectName ? item.previousEnquiry.projectName : 'No Project Specified'}
                        </div>
                        <div className="text-[10px] text-brand-primary font-mono mt-0.5">
                          ID: #{item.previousEnquiry.id ? item.previousEnquiry.id.slice(-6).toUpperCase() : 'N/A'}
                        </div>
                      </td>

                      {/* Lead Owner */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.previousEnquiry.assignedTo ? (
                          <div>
                            <div className="font-semibold text-content-primary">
                              {item.previousEnquiry.assignedTo.name}
                            </div>
                            <div className="text-[10px] text-content-muted">
                              {item.previousEnquiry.assignedTo.role}
                            </div>
                          </div>
                        ) : (
                          <span className="text-content-muted italic">Unassigned</span>
                        )}
                      </td>

                      {/* Review Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderReviewStatusBadge(item)}
                        {item.previousEnquiry.currentStage && (
                          <div className="text-[10px] font-medium text-content-muted mt-1">
                            Stage: {item.previousEnquiry.currentStage}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.previousEnquiry.id && (
                            <button
                              type="button"
                              onClick={() => navigate(`/sales/leads/${item.previousEnquiry.id}/workflow`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-primary hover:bg-surface-subtle border border-edge rounded-lg transition-colors cursor-pointer"
                              title="Open Lead Workflow"
                            >
                              <span>View Lead</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          {canReopen && item.previousEnquiry.id && (
                            <button
                              type="button"
                              onClick={() => navigate(`/sales/leads/${item.previousEnquiry.id}/workflow?action=reopen`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              title="Reopen Closed Lead with Historical Continuity"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reopen</span>
                            </button>
                          )}
                        </div>
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
          <div className="p-3.5 border-t border-edge flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-content-muted">
            <span>
              Page <strong className="text-content-primary">{page}</strong> of <strong className="text-content-primary">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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