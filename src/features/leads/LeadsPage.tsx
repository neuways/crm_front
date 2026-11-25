import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, XCircle, Filter, FileSpreadsheet, Inbox, Copy, Users } from 'lucide-react';
import { UserProfile } from '../../types/auth.types.js';
import { Button } from '../../components/ui/Button.js';
import { NewLeadTable } from '../sales-dashboard/components/NewLeadTable.js';
import { RejectedLeadTable } from './components/RejectedLeadTable.js';
import { UnassignedLeadTable } from './components/UnassignedLeadTable.js';
import { AssignLeadModal } from './components/AssignLeadModal.js';
import { QuickCallLogModal } from '../sales-dashboard/components/QuickCallLogModal.js';
import { DuplicateDataPage } from '../duplicate-data/DuplicateDataPage.js';
import { NewEnquiryModal } from '../sales-dashboard/components/NewEnquiryModal.js';
import { mapEnquiryToNewLeadItem, useSalesDashboard } from '../sales-dashboard/hooks/useSalesDashboard.js';
import { NewLeadItem } from '../sales-dashboard/types/dashboard.types.js';
import { enquiryService } from '../../services/enquiry.service.js';
import {
  ActiveManagerSummary,
  EligibleAgentSummary,
  IEnquiry,
} from '../../types/enquiry.types.js';

interface OutletContextType {
  currentUser: UserProfile;
  onShowPlaceholderNotice: (featureName: string) => void;
}

export type LeadTab = 'ACTIVE' | 'UNASSIGNED' | 'DUPLICATES' | 'REJECTED';

export interface LeadsPageProps {
  defaultTab?: LeadTab;
}

const VALID_STAGE_FILTERS = ['FOLLOW_UP', 'MEETING_PLAN', 'SITE_VISIT_PLAN', 'DEAL_DONE'] as const;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const parseStageParam = (stageParam: string | null): string => {
  const upper = stageParam?.toUpperCase();
  if (upper && (VALID_STAGE_FILTERS as readonly string[]).includes(upper)) {
    return upper;
  }
  return 'ALL';
};

export const LeadsPage: React.FC<LeadsPageProps> = ({ defaultTab }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, onShowPlaceholderNotice } = useOutletContext<OutletContextType>();
  const [isNewEnquiryModalOpen, setIsNewEnquiryModalOpen] = useState<boolean>(false);

  const canAccessUnassigned = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  // Determine initial tab from props or URL query param
  const getInitialTab = useCallback((): LeadTab => {
    if (defaultTab) return defaultTab;
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam === 'unassigned' && canAccessUnassigned) return 'UNASSIGNED';
    if (tabParam === 'assigned' && canAccessUnassigned) return 'ACTIVE';
    if (tabParam === 'duplicates' || tabParam === 'duplicate-data') return 'DUPLICATES';
    if (tabParam === 'rejected') return 'REJECTED';
    return 'ACTIVE';
  }, [defaultTab, searchParams, canAccessUnassigned]);

  const [activeTab, setActiveTab] = useState<LeadTab>(getInitialTab);
  const [stageFilter, setStageFilter] = useState<string>(() => parseStageParam(searchParams.get('stage')));

  useEffect(() => {
    setActiveTab(getInitialTab());
    setStageFilter(parseStageParam(searchParams.get('stage')));
  }, [getInitialTab, searchParams]);

  // Rejected leads data state
  const [rejectedLeads, setRejectedLeads] = useState<IEnquiry[]>([]);
  const [isLoadingRejected, setIsLoadingRejected] = useState<boolean>(false);
  const [rejectedError, setRejectedError] = useState<string | null>(null);
  const [rejectedTotalCount, setRejectedTotalCount] = useState<number>(0);

  // Unassigned leads server-paginated state (Admin & Manager only)
  const [unassignedLeads, setUnassignedLeads] = useState<IEnquiry[]>([]);
  const [isLoadingUnassigned, setIsLoadingUnassigned] = useState<boolean>(false);
  const [unassignedError, setUnassignedError] = useState<string | null>(null);
  const [unassignedTotalCount, setUnassignedTotalCount] = useState<number>(0);
  const [unassignedFilteredTotal, setUnassignedFilteredTotal] = useState<number>(0);
  const [unassignedTotalPages, setUnassignedTotalPages] = useState<number>(1);
  const [unassignedPage, setUnassignedPage] = useState<number>(1);
  const [unassignedLimit, setUnassignedLimit] = useState<number>(10);
  const [unassignedSearch, setUnassignedSearch] = useState<string>('');
  const [debouncedUnassignedSearch, setDebouncedUnassignedSearch] = useState<string>('');
  const [unassignedReason, setUnassignedReason] = useState<string>('ALL');
  const unassignedFetchSeqRef = useRef<number>(0);

  // Assigned leads server-paginated state (Admin & Manager only)
  const [assignedLeads, setAssignedLeads] = useState<NewLeadItem[]>([]);
  const [isLoadingAssigned, setIsLoadingAssigned] = useState<boolean>(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [assignedTotalCount, setAssignedTotalCount] = useState<number>(0);
  const [assignedFilteredTotal, setAssignedFilteredTotal] = useState<number>(0);
  const [assignedTotalPages, setAssignedTotalPages] = useState<number>(1);
  const [assignedPage, setAssignedPage] = useState<number>(1);
  const [assignedLimit, setAssignedLimit] = useState<number>(10);
  const [assignedManagerFilter, setAssignedManagerFilter] = useState<string>('ALL');
  const [assignedAgentFilter, setAssignedAgentFilter] = useState<string>('ALL');
  const [managers, setManagers] = useState<ActiveManagerSummary[]>([]);
  const [filterAgents, setFilterAgents] = useState<EligibleAgentSummary[]>([]);
  const [quickLogUnassignedLead, setQuickLogUnassignedLead] = useState<NewLeadItem | null>(null);
  const assignedFetchSeqRef = useRef<number>(0);

  // Duplicate count state for tab badge
  const [duplicateCount, setDuplicateCount] = useState<number>(0);

  // Assignment Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [leadsToAssign, setLeadsToAssign] = useState<IEnquiry[]>([]);

  const {
    newLeads,
    isLoadingLeads,
    leadsError,
    isDemoMode,
    refreshLeads
  } = useSalesDashboard({ enabled: !canAccessUnassigned });

  // Debounce unassigned table search
  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = unassignedSearch.trim();
      setDebouncedUnassignedSearch((prev) => {
        if (prev !== normalized) {
          setUnassignedPage(1);
        }
        return normalized;
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [unassignedSearch]);

  // Fetch real persisted rejected / lost enquiries from backend
  const fetchRejectedLeads = useCallback(async () => {
    setIsLoadingRejected(true);
    setRejectedError(null);
    try {
      const res = await enquiryService.getEnquiries({
        status: 'CLOSED',
        rejected: true,
        limit: 100
      });

      if (res.success && res.data) {
        setRejectedLeads(res.data.enquiries || []);
        const total = res.data.pagination?.total ?? res.data.pagination?.totalCount ?? (res.data.enquiries || []).length;
        setRejectedTotalCount(total);
      } else {
        setRejectedError(res.message || 'Failed to load rejected leads.');
      }
    } catch (err: unknown) {
      setRejectedError(err instanceof Error ? err.message : 'Error fetching rejected leads.');
    } finally {
      setIsLoadingRejected(false);
    }
  }, []);

  // Fetch active filter metadata (strictly role-scoped)
  const fetchFilterMeta = useCallback(async () => {
    if (!canAccessUnassigned) return;
    try {
      const [rosterRes, managersRes] = await Promise.all([
        enquiryService.getTeamRoster().catch(() => null),
        currentUser.role === 'ADMIN'
          ? enquiryService.getActiveManagers().catch(() => null)
          : Promise.resolve(null),
      ]);

      if (managersRes?.success && Array.isArray(managersRes.data?.managers)) {
        setManagers(
          managersRes.data.managers.filter((m) => m.role === 'MANAGER' || m.role === 'ADMIN')
        );
      }

      if (rosterRes?.success && Array.isArray(rosterRes.data?.agents)) {
        const seenIds = new Set<string>();
        const scopedAgents = rosterRes.data.agents.filter((a) => {
          const aid = (a.id || (a as any)._id || '').toString().trim();
          if (!aid || aid === 'undefined' || !a.isActive) return false;
          if (seenIds.has(aid)) return false;
          seenIds.add(aid);
          if (currentUser.role === 'MANAGER') {
            return Boolean((a.isAssignedToCurrentManager || a.managerId === currentUser.id) && a.isTeamActive);
          }
          return true;
        });

        setFilterAgents(scopedAgents);
      }
    } catch {
      // Non-fatal metadata fetch error
    }
  }, [canAccessUnassigned, currentUser.id, currentUser.role]);

  // Defensive client-side guard ensuring Assigned Leads rows always have a real assigned user
  const hasValidAssignedUser = (enquiry: IEnquiry): boolean => {
    const raw = (enquiry as any).assignedTo;
    if (!raw) return false;
    if (typeof raw === 'string') return raw.trim().length > 0;
    return Boolean(raw.id || raw._id);
  };

  // Fetch exact independent tab badge counts via lightweight limit=1 queries
  const fetchTabBadgeCounts = useCallback(async () => {
    if (!canAccessUnassigned) return;
    try {
      const [assignedBadgeRes, unassignedBadgeRes] = await Promise.all([
        enquiryService.getEnquiries({
          assignedOnly: true,
          unassigned: false,
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          page: 1,
          limit: 1,
        }),
        enquiryService.getEnquiries({
          unassigned: true,
          assignedOnly: false,
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          page: 1,
          limit: 1,
        }),
      ]);

      if (assignedBadgeRes.success && assignedBadgeRes.data) {
        const total =
          assignedBadgeRes.data.pagination?.total ??
          assignedBadgeRes.data.pagination?.totalCount ??
          0;
        setAssignedTotalCount(total);
      }
      if (unassignedBadgeRes.success && unassignedBadgeRes.data) {
        const total =
          unassignedBadgeRes.data.pagination?.total ??
          unassignedBadgeRes.data.pagination?.totalCount ??
          0;
        setUnassignedTotalCount(total);
      }
    } catch {
      // Non-fatal badge fetch error
    }
  }, [canAccessUnassigned]);

  // Fetch unassigned leads from backend (strict DB filtering & server pagination)
  const fetchUnassignedLeads = useCallback(async () => {
    if (!canAccessUnassigned) return;
    const reqSeq = ++unassignedFetchSeqRef.current;
    setIsLoadingUnassigned(true);
    setUnassignedError(null);
    const hasFilters = Boolean(debouncedUnassignedSearch) || unassignedReason !== 'ALL';
    try {
      const [res, badgeRes] = await Promise.all([
        enquiryService.getEnquiries({
          unassigned: true,
          assignedOnly: false,
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          page: unassignedPage,
          limit: unassignedLimit,
          search: debouncedUnassignedSearch || undefined,
          unassignedReason: unassignedReason !== 'ALL' ? unassignedReason : undefined,
        }),
        hasFilters
          ? enquiryService.getEnquiries({
              unassigned: true,
              assignedOnly: false,
              status: 'ACTIVE',
              excludeCompletedDeals: true,
              page: 1,
              limit: 1,
            })
          : Promise.resolve(null),
      ]);

      if (reqSeq !== unassignedFetchSeqRef.current) return;

      if (res.success && res.data) {
        const rawRows = res.data.enquiries || [];
        const rows = rawRows.filter((e) => !hasValidAssignedUser(e));
        const serverTotal =
          res.data.pagination?.total ??
          res.data.pagination?.totalCount ??
          rows.length;
        const effectiveTotal =
          rawRows.length > 0 && rows.length === 0 ? 0 : serverTotal;
        const computedTotalPages =
          effectiveTotal === 0
            ? 1
            : (res.data.pagination?.totalPages ??
              Math.max(1, Math.ceil(effectiveTotal / unassignedLimit)));

        if (rows.length === 0 && effectiveTotal > 0 && unassignedPage > computedTotalPages && computedTotalPages >= 1) {
          setUnassignedPage(computedTotalPages);
          return;
        }

        setUnassignedLeads(rows);
        setUnassignedFilteredTotal(effectiveTotal);
        setUnassignedTotalPages(Math.max(1, computedTotalPages));

        if (hasFilters && badgeRes?.success && badgeRes.data) {
          const unfilteredTotal =
            badgeRes.data.pagination?.total ??
            badgeRes.data.pagination?.totalCount ??
            effectiveTotal;
          setUnassignedTotalCount(unfilteredTotal);
        } else {
          setUnassignedTotalCount(effectiveTotal);
        }
      } else {
        setUnassignedError(res.message || 'Failed to load unassigned leads.');
      }
    } catch (err: unknown) {
      if (reqSeq === unassignedFetchSeqRef.current) {
        setUnassignedError(err instanceof Error ? err.message : 'Error fetching unassigned leads.');
      }
    } finally {
      if (reqSeq === unassignedFetchSeqRef.current) {
        setIsLoadingUnassigned(false);
      }
    }
  }, [
    canAccessUnassigned,
    unassignedPage,
    unassignedLimit,
    debouncedUnassignedSearch,
    unassignedReason,
  ]);

  // Fetch assigned active pipeline leads from backend (strict DB filtering & server pagination for Admin/Manager)
  const fetchAssignedLeads = useCallback(async () => {
    if (!canAccessUnassigned) return;
    const reqSeq = ++assignedFetchSeqRef.current;
    setIsLoadingAssigned(true);
    setAssignedError(null);
    const hasFilters =
      (currentUser.role === 'ADMIN' && assignedManagerFilter !== 'ALL') ||
      assignedAgentFilter !== 'ALL';
    try {
      const [res, badgeRes] = await Promise.all([
        enquiryService.getEnquiries({
          assignedOnly: true,
          unassigned: false,
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          page: assignedPage,
          limit: assignedLimit,
          managerId:
            currentUser.role === 'ADMIN' && assignedManagerFilter !== 'ALL'
              ? assignedManagerFilter
              : undefined,
          assignedTo:
            assignedAgentFilter !== 'ALL' ? assignedAgentFilter : undefined,
        }),
        hasFilters
          ? enquiryService.getEnquiries({
              assignedOnly: true,
              unassigned: false,
              status: 'ACTIVE',
              excludeCompletedDeals: true,
              page: 1,
              limit: 1,
            })
          : Promise.resolve(null),
      ]);

      if (reqSeq !== assignedFetchSeqRef.current) return;

      if (res.success && res.data) {
        const rawRows = res.data.enquiries || [];
        // Defensive client-side guard: never display unassigned leads inside Assigned Leads
        const rows = rawRows.filter(hasValidAssignedUser);
        const serverTotal =
          res.data.pagination?.total ??
          res.data.pagination?.totalCount ??
          rows.length;
        const effectiveTotal =
          rawRows.length > 0 && rows.length === 0 ? 0 : serverTotal;
        const computedTotalPages =
          effectiveTotal === 0
            ? 1
            : (res.data.pagination?.totalPages ??
              Math.max(1, Math.ceil(effectiveTotal / assignedLimit)));

        if (rawRows.length === 0 && effectiveTotal > 0 && assignedPage > computedTotalPages && computedTotalPages >= 1) {
          setAssignedPage(computedTotalPages);
          return;
        }

        const srOffset = (assignedPage - 1) * assignedLimit;
        setAssignedLeads(rows.map((e, idx) => mapEnquiryToNewLeadItem(e, idx, srOffset)));
        setAssignedFilteredTotal(rawRows.length !== rows.length ? rows.length : effectiveTotal);
        setAssignedTotalPages(Math.max(1, computedTotalPages));

        if (hasFilters && badgeRes?.success && badgeRes.data) {
          const unfilteredTotal =
            badgeRes.data.pagination?.total ??
            badgeRes.data.pagination?.totalCount ??
            effectiveTotal;
          setAssignedTotalCount(unfilteredTotal);
        } else {
          setAssignedTotalCount(effectiveTotal);
        }
      } else {
        setAssignedError(res.message || 'Failed to load assigned leads.');
      }
    } catch (err: unknown) {
      if (reqSeq === assignedFetchSeqRef.current) {
        setAssignedError(err instanceof Error ? err.message : 'Error fetching assigned leads.');
      }
    } finally {
      if (reqSeq === assignedFetchSeqRef.current) {
        setIsLoadingAssigned(false);
      }
    }
  }, [
    canAccessUnassigned,
    currentUser.role,
    assignedPage,
    assignedLimit,
    assignedManagerFilter,
    assignedAgentFilter,
  ]);

  // Fetch duplicate counts
  const fetchDuplicateSummary = useCallback(async () => {
    try {
      const count = await enquiryService.getDuplicateCount({ includeBulk: true });
      setDuplicateCount(count);
    } catch {
      setDuplicateCount(0);
    }
  }, []);

  // Load tab-specific or badge summary data on mount
  useEffect(() => {
    fetchDuplicateSummary();
    fetchRejectedLeads();
    if (canAccessUnassigned) {
      fetchFilterMeta();
      fetchTabBadgeCounts();
      fetchUnassignedLeads();
      fetchAssignedLeads();
    }
  }, [
    fetchDuplicateSummary,
    fetchRejectedLeads,
    fetchFilterMeta,
    fetchTabBadgeCounts,
    fetchUnassignedLeads,
    fetchAssignedLeads,
    canAccessUnassigned,
  ]);

  // Synchronize on reconnection or CRM event refresh
  useEffect(() => {
    const handleSync = () => {
      fetchDuplicateSummary();
      fetchRejectedLeads();
      if (canAccessUnassigned) {
        fetchTabBadgeCounts();
        fetchUnassignedLeads();
        fetchAssignedLeads();
      } else {
        refreshLeads();
      }
    };
    window.addEventListener('nueways:reconnected', handleSync);
    window.addEventListener('crm:notification-refresh', handleSync);
    return () => {
      window.removeEventListener('nueways:reconnected', handleSync);
      window.removeEventListener('crm:notification-refresh', handleSync);
    };
  }, [
    fetchDuplicateSummary,
    fetchRejectedLeads,
    fetchTabBadgeCounts,
    fetchUnassignedLeads,
    fetchAssignedLeads,
    refreshLeads,
    canAccessUnassigned,
  ]);

  useEffect(() => {
    if (activeTab === 'REJECTED') {
      fetchRejectedLeads();
    } else if (activeTab === 'UNASSIGNED' && canAccessUnassigned) {
      fetchUnassignedLeads();
    } else if (activeTab === 'ACTIVE' && canAccessUnassigned) {
      fetchAssignedLeads();
    }
  }, [activeTab, canAccessUnassigned, fetchRejectedLeads, fetchUnassignedLeads, fetchAssignedLeads]);

  // Sync tab with URL search parameter
  const handleTabChange = (tab: LeadTab) => {
    if (tab === 'UNASSIGNED' && !canAccessUnassigned) return;
    setActiveTab(tab);
    if (tab === 'ACTIVE') {
      setSearchParams(canAccessUnassigned ? { tab: 'assigned' } : {});
    } else {
      setSearchParams({ tab: tab.toLowerCase() });
    }
  };

  const handleFollowUpClick = (lead: NewLeadItem) => {
    navigate(`/sales/leads/${lead.id}/workflow`);
  };

  const handleViewRejectedDetails = (lead: IEnquiry) => {
    navigate(`/sales/leads/${lead.id || (lead as any)._id}/workflow`);
  };

  // Assign & Unassigned workflow action handlers
  const handleOpenSingleAssign = (lead: IEnquiry) => {
    setLeadsToAssign([lead]);
    setIsAssignModalOpen(true);
  };

  const handleOpenBulkAssign = (selected: IEnquiry[]) => {
    setLeadsToAssign(selected);
    setIsAssignModalOpen(true);
  };

  const handleOpenUnassignedFollowUp = (lead: IEnquiry) => {
    const lid = lead.id || (lead as any)._id;
    if (lid) {
      navigate(`/sales/leads/${lid}/workflow`);
    }
  };

  const handleOpenUnassignedLogCall = (lead: IEnquiry) => {
    setQuickLogUnassignedLead(mapEnquiryToNewLeadItem(lead, 0));
  };

  const handleAssignSuccess = () => {
    const assignedCount = leadsToAssign.length;
    if (assignedCount > 0) {
      const assignedIds = new Set(
        leadsToAssign.map((l) => l.id || (l as any)._id).filter(Boolean)
      );
      setUnassignedLeads((prev) =>
        prev.filter((l) => !assignedIds.has(l.id || (l as any)._id))
      );
      setUnassignedTotalCount((prev) => Math.max(0, prev - assignedCount));
      setUnassignedFilteredTotal((prev) => Math.max(0, prev - assignedCount));
      setAssignedTotalCount((prev) => prev + assignedCount);
    }

    if (canAccessUnassigned) {
      fetchTabBadgeCounts();
      fetchUnassignedLeads();
      fetchAssignedLeads();
    } else {
      refreshLeads();
    }

    onShowPlaceholderNotice(
      leadsToAssign.length === 1
        ? `Lead "${leadsToAssign[0].name}" assigned successfully.`
        : `${leadsToAssign.length} leads assigned successfully.`
    );
  };

  const handleRefreshAll = () => {
    fetchDuplicateSummary();
    fetchRejectedLeads();
    if (canAccessUnassigned) {
      fetchFilterMeta();
      fetchTabBadgeCounts();
      fetchUnassignedLeads();
      fetchAssignedLeads();
    } else {
      refreshLeads();
    }
  };

  const visibleFilterAgents = useMemo(() => {
    if (currentUser.role === 'ADMIN' && assignedManagerFilter !== 'ALL') {
      return filterAgents.filter((a) => a.managerId === assignedManagerFilter);
    }
    return filterAgents;
  }, [currentUser.role, assignedManagerFilter, filterAgents]);

  const isGlobalLoading =
    (canAccessUnassigned ? isLoadingAssigned || isLoadingUnassigned : isLoadingLeads) ||
    isLoadingRejected;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Leads</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Leads &amp; Enquiries
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            {currentUser.role === 'ADMIN'
              ? 'Organization-wide lead pipeline, unassigned pool, duplicate matches and rejected enquiries directory.'
              : currentUser.role === 'MANAGER'
              ? `Team lead pipeline, unassigned pool, duplicate matches and rejected enquiries for ${currentUser.name}'s sales team.`
              : `Active pipeline enquiries assigned to ${currentUser.name}. Continue follow-up workflows and track customer requirements.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isGlobalLoading ? 'animate-spin' : ''}`} />}
            onClick={handleRefreshAll}
            disabled={isGlobalLoading}
          >
            Refresh
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
            New Lead Enquiry
          </Button>
        </div>
      </div>

      {/* Pipeline View Tabs (Tab 1: Assigned Leads, Tab 2: Unassigned Leads) */}
      <div className="flex items-center gap-2 border-b border-edge pb-2 overflow-x-auto scrollbar-none min-w-0">
        {/* 1. Assigned Leads Tab (Default Active for Admin/Manager) / Active Pipeline Tab (Sales) */}
        <button
          type="button"
          onClick={() => handleTabChange('ACTIVE')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'ACTIVE'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{canAccessUnassigned ? 'Assigned Leads' : 'Active Pipeline'}</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {canAccessUnassigned ? assignedTotalCount : newLeads.length}
          </span>
        </button>

        {/* 2. Unassigned Leads Tab (Admin & Manager Only - Hidden from Sales Agent) */}
        {canAccessUnassigned && (
          <button
            type="button"
            onClick={() => handleTabChange('UNASSIGNED')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Unassigned Leads</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'UNASSIGNED' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {unassignedTotalCount}
            </span>
          </button>
        )}

        {/* Duplicate Data Tab (All Roles) */}
        <button
          type="button"
          onClick={() => handleTabChange('DUPLICATES')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'DUPLICATES'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Duplicate Data</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'DUPLICATES' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
            }`}
          >
            {duplicateCount}
          </span>
        </button>

        {/* Rejected / Lost Leads Tab (All Roles) */}
        <button
          type="button"
          onClick={() => handleTabChange('REJECTED')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'REJECTED'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-content-muted hover:text-content-primary hover:bg-slate-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected / Lost Leads</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'REJECTED' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
            }`}
          >
            {rejectedTotalCount}
          </span>
        </button>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'ACTIVE' && (
        <div className="space-y-4">
          {canAccessUnassigned && (
            <div className="bg-surface-card border border-edge rounded-2xl p-3.5 sm:px-5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-content-secondary font-medium">
                <Users className="w-4 h-4 text-brand-primary shrink-0" />
                <span>
                  {currentUser.role === 'ADMIN'
                    ? 'Organization Assigned Pipeline'
                    : `${currentUser.name}'s Team Assigned Pipeline`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {currentUser.role === 'ADMIN' && (
                  <select
                    aria-label="Filter by Manager"
                    value={assignedManagerFilter}
                    onChange={(e) => {
                      setAssignedManagerFilter(e.target.value);
                      setAssignedAgentFilter('ALL');
                      setAssignedPage(1);
                    }}
                    className="px-3 py-1.5 bg-surface-subtle border border-edge rounded-xl text-xs text-content-primary focus:outline-none focus:border-brand-primary"
                  >
                    <option value="ALL">All Managers</option>
                    {managers.map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  aria-label="Filter by Sales Agent"
                  value={assignedAgentFilter}
                  onChange={(e) => {
                    setAssignedAgentFilter(e.target.value);
                    setAssignedPage(1);
                  }}
                  className="px-3 py-1.5 bg-surface-subtle border border-edge rounded-xl text-xs text-content-primary focus:outline-none focus:border-brand-primary"
                >
                  <option value="ALL">
                    {currentUser.role === 'ADMIN' ? 'All Sales Agents' : 'All Team Agents'}
                  </option>
                  {visibleFilterAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <NewLeadTable
            title={canAccessUnassigned ? 'Assigned Leads' : 'New Lead'}
            leads={canAccessUnassigned ? assignedLeads : newLeads}
            isLoading={canAccessUnassigned ? isLoadingAssigned : isLoadingLeads}
            error={canAccessUnassigned ? assignedError : leadsError}
            isDemoMode={isDemoMode}
            onRetry={canAccessUnassigned ? fetchAssignedLeads : refreshLeads}
            onFollowUpClick={handleFollowUpClick}
            onShowNotice={onShowPlaceholderNotice}
            hideAgentFilter={currentUser.role === 'SALES'}
            initialStageFilter={stageFilter}
            serverPagination={
              canAccessUnassigned
                ? {
                    page: assignedPage,
                    limit: assignedLimit,
                    total: assignedFilteredTotal,
                    totalPages: assignedTotalPages,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    onPageChange: (nextPage) => setAssignedPage(nextPage),
                    onPageSizeChange: (nextLimit) => {
                      setAssignedLimit(nextLimit);
                      setAssignedPage(1);
                    },
                  }
                : undefined
            }
          />
        </div>
      )}

      {activeTab === 'UNASSIGNED' && canAccessUnassigned && (
        <UnassignedLeadTable
          leads={unassignedLeads}
          isLoading={isLoadingUnassigned}
          error={unassignedError}
          onRetry={fetchUnassignedLeads}
          onAssignClick={handleOpenSingleAssign}
          onBulkAssignClick={handleOpenBulkAssign}
          onFollowUpClick={handleOpenUnassignedFollowUp}
          onLogCallClick={handleOpenUnassignedLogCall}
          serverPagination={{
            page: unassignedPage,
            limit: unassignedLimit,
            total: unassignedFilteredTotal,
            totalPages: unassignedTotalPages,
            searchTerm: unassignedSearch,
            onSearchChange: (val) => setUnassignedSearch(val),
            selectedReason: unassignedReason,
            onReasonChange: (val) => {
              setUnassignedReason(val);
              setUnassignedPage(1);
            },
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: (nextPage) => setUnassignedPage(nextPage),
            onPageSizeChange: (nextLimit) => {
              setUnassignedLimit(nextLimit);
              setUnassignedPage(1);
            },
          }}
        />
      )}

      {activeTab === 'DUPLICATES' && (
        <DuplicateDataPage isEmbedded={true} currentUser={currentUser} />
      )}

      {activeTab === 'REJECTED' && (
        <RejectedLeadTable
          leads={rejectedLeads}
          isLoading={isLoadingRejected}
          error={rejectedError}
          totalCount={rejectedTotalCount}
          onRetry={fetchRejectedLeads}
          onViewDetails={handleViewRejectedDetails}
        />
      )}

      {/* Assign Lead Modal (Single & Bulk Allocation on Unassigned Leads) */}
      <AssignLeadModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedLeads={leadsToAssign}
        currentUser={currentUser}
        onSuccess={handleAssignSuccess}
      />

      {/* Quick Call Log Modal for Unassigned Leads Tab */}
      <QuickCallLogModal
        lead={quickLogUnassignedLead}
        isOpen={Boolean(quickLogUnassignedLead)}
        onClose={() => setQuickLogUnassignedLead(null)}
        onLogged={() => {
          fetchUnassignedLeads();
          fetchTabBadgeCounts();
          onShowPlaceholderNotice('Call attempt logged successfully.');
        }}
      />

      {/* New Enquiry Modal */}
      <NewEnquiryModal
        isOpen={isNewEnquiryModalOpen}
        onClose={() => setIsNewEnquiryModalOpen(false)}
        isDemoMode={isDemoMode}
        onEnquiryCreated={(lead, rawEnquiry) => {
          if (canAccessUnassigned) {
            fetchTabBadgeCounts();
            fetchAssignedLeads();
            fetchUnassignedLeads();
          } else {
            refreshLeads();
          }
          const assignedId =
            lead.assignedTo?.id ||
            (rawEnquiry?.assignedTo as any)?._id?.toString() ||
            (rawEnquiry?.assignedTo as any)?.id?.toString() ||
            (typeof rawEnquiry?.assignedTo === 'string' ? rawEnquiry.assignedTo : null);

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