import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  UserCheck,
  Inbox,
  Users,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  CheckSquare,
  Building,
  Phone,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { UserProfile } from '../../types/auth.types.js';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { propertyMappingService } from '../../services/property-mapping.service.js';
import { IEnquiry, EligibleAgentSummary, ActiveManagerSummary } from '../../types/enquiry.types.js';
import { maskPhoneNumber } from '../../utils/phone.js';
import { getWorkflowStageMeta, getFollowUpOutcomeMeta } from '../../utils/followUpOutcome.js';

interface OutletContextType {
  currentUser: UserProfile;
}

type QueueTab = 'UNASSIGNED' | 'ASSIGNED';
type PageSizeOption = 10 | 25 | 50;

interface AgentOption {
  id: string;
  name: string;
  email: string;
  managerId: string | null;
  managerName: string | null;
  activeLeadsCount: number;
  isTeamActive: boolean;
  isActive: boolean;
}

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [10, 25, 50];

const getEnquiryId = (lead: IEnquiry): string => (lead.id || (lead as any)._id || '').toString();

const getAssigneeId = (lead: IEnquiry): string => {
  const raw = (lead as any).assignedTo;
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  return (raw.id || raw._id || '').toString();
};

const getAssigneeName = (lead: IEnquiry): string => {
  const raw = (lead as any).assignedTo;
  if (!raw) return 'Unassigned';
  if (typeof raw === 'string') return 'Assigned Agent';
  return raw.name || 'Assigned Agent';
};

const getReportingManagerName = (lead: IEnquiry): string | null => {
  const raw = (lead as any).assignedTo;
  if (!raw || typeof raw !== 'object') return null;
  if (raw.managerName) return raw.managerName;
  if (raw.managerId && typeof raw.managerId === 'object' && raw.managerId.name) {
    return raw.managerId.name;
  }
  return null;
};

const formatLastActivity = (timestamp?: string): string => {
  if (!timestamp) return 'No activity yet';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return 'No activity yet';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildPageNumbers = (currentPage: number, totalPages: number): Array<number | 'ellipsis'> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
};

export const AssignLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useOutletContext<OutletContextType>();

  const queueQueryParam = searchParams.get('queue')?.toUpperCase();
  const initialQueue: QueueTab =
    queueQueryParam === 'ASSIGNED' || queueQueryParam === 'REASSIGN' ? 'ASSIGNED' : 'UNASSIGNED';

  const [activeQueue, setActiveQueue] = useState<QueueTab>(initialQueue);
  const [leads, setLeads] = useState<IEnquiry[]>([]);
  const [totalMatchingLeads, setTotalMatchingLeads] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [unassignedTotalCount, setUnassignedTotalCount] = useState<number>(0);
  const [assignedTotalCount, setAssignedTotalCount] = useState<number>(0);

  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [managers, setManagers] = useState<ActiveManagerSummary[]>([]);
  const [isMetaLoaded, setIsMetaLoaded] = useState<boolean>(false);
  const [knownProjects, setKnownProjects] = useState<string[]>([]);
  const [knownOwners, setKnownOwners] = useState<Array<{ id: string; name: string }>>([]);

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [managerFilter, setManagerFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef<number>(0);

  // Debounce search input -> reset pagination cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = searchInput.trim();
      setDebouncedSearch((prev) => {
        if (prev !== normalized) {
          setCurrentPage(1);
          setSelectedLeadIds(new Set());
        }
        return normalized;
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch eligible agents (strictly role-scoped), managers (for Admin), and project options
  const fetchMetaOptions = useCallback(async () => {
    try {
      const [rosterRes, teamPerfRes, mappingRes, managersRes] = await Promise.all([
        enquiryService.getTeamRoster(),
        enquiryService.getTeamPerformance().catch(() => null),
        propertyMappingService.listMappings().catch(() => null),
        currentUser.role === 'ADMIN'
          ? enquiryService.getActiveManagers().catch(() => null)
          : Promise.resolve(null),
      ]);

      const perfCountMap = new Map<string, number>();
      if (teamPerfRes?.success && teamPerfRes.data?.team) {
        for (const member of teamPerfRes.data.team) {
          const mid = (member.id || (member as any)._id || '').toString().trim();
          if (mid) {
            perfCountMap.set(mid, member.activeLeadsCount ?? 0);
          }
        }
      }

      if (managersRes?.success && managersRes.data?.managers) {
        setManagers(
          managersRes.data.managers.filter((m) => m.role === 'MANAGER' || m.role === 'ADMIN')
        );
      }

      if (rosterRes.success && rosterRes.data?.agents) {
        const mappedAgents = rosterRes.data.agents.map((a: EligibleAgentSummary) => {
          const aid = (a.id || (a as any)._id || '').toString().trim();
          return {
            id: aid,
            name: a.name,
            email: a.email,
            managerId: a.managerId || null,
            managerName: a.managerName || null,
            activeLeadsCount: perfCountMap.get(aid) ?? a.activeLeadsCount ?? 0,
            isTeamActive: a.isTeamActive !== false,
            isActive: a.isActive !== false,
            isAssignedToCurrentManager: Boolean(a.isAssignedToCurrentManager),
          };
        });

        const seenIds = new Set<string>();
        const filteredAgents: AgentOption[] = mappedAgents
          .filter((a) => {
            if (!a.id || a.id === 'undefined' || !a.isActive) return false;
            if (seenIds.has(a.id)) return false;
            seenIds.add(a.id);
            if (currentUser.role === 'MANAGER') {
              // Managers can assign ONLY to active Sales Agents in their own team
              return (
                (a.isAssignedToCurrentManager || a.managerId === currentUser.id) &&
                a.isTeamActive
              );
            }
            return true;
          })
          .map(({ isAssignedToCurrentManager: _ignored, ...rest }) => rest)
          .sort((a, b) => a.name.localeCompare(b.name));

        setAgents(filteredAgents);
        setTargetAgentId((prev) => {
          if (prev && prev !== 'undefined' && filteredAgents.some((a) => a.id === prev)) {
            return prev;
          }
          return filteredAgents[0]?.id || '';
        });

        setKnownOwners(() => {
          const map = new Map<string, string>();
          filteredAgents.forEach((a) => map.set(a.id, a.name));
          if (currentUser.role === 'MANAGER' && currentUser.id) {
            map.set(currentUser.id, `${currentUser.name} (Manager)`);
          }
          return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
        });
      }

      if (mappingRes?.success && mappingRes.data?.mappings) {
        setKnownProjects((prev) => {
          const set = new Set(prev);
          for (const m of mappingRes.data!.mappings) {
            if (m.propertyName?.trim()) set.add(m.propertyName.trim());
          }
          return Array.from(set).sort();
        });
      }
    } catch {
      // Non-fatal metadata load
    } finally {
      setIsMetaLoaded(true);
    }
  }, [currentUser.role, currentUser.id, currentUser.name]);

  useEffect(() => {
    fetchMetaOptions();
  }, [fetchMetaOptions]);

  // Fetch exact server-paginated queue + separate exact tab totals (unassigned=true&limit=1 and assignedOnly=true&limit=1)
  const fetchQueueData = useCallback(
    async (options?: { silent?: boolean }) => {
      const requestSeq = ++fetchIdRef.current;
      if (!options?.silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const activeParams =
          activeQueue === 'UNASSIGNED'
            ? {
                page: currentPage,
                limit: pageSize,
                status: 'ACTIVE' as const,
                excludeCompletedDeals: true,
                unassigned: true,
                project: projectFilter !== 'ALL' ? projectFilter : undefined,
                search: debouncedSearch || undefined,
              }
            : {
                page: currentPage,
                limit: pageSize,
                status: 'ACTIVE' as const,
                excludeCompletedDeals: true,
                assignedOnly: true,
                unassigned: false,
                managerId:
                  currentUser.role === 'ADMIN' && managerFilter !== 'ALL'
                    ? managerFilter
                    : undefined,
                assignedTo: ownerFilter !== 'ALL' ? ownerFilter : undefined,
                project: projectFilter !== 'ALL' ? projectFilter : undefined,
                search: debouncedSearch || undefined,
              };

        const [mainRes, unassignedBadgeRes, assignedBadgeRes] = await Promise.all([
          enquiryService.getEnquiries(activeParams),
          enquiryService
            .getEnquiries({
              unassigned: true,
              status: 'ACTIVE',
              excludeCompletedDeals: true,
              limit: 1,
            })
            .catch(() => null),
          enquiryService
            .getEnquiries({
              assignedOnly: true,
              unassigned: false,
              status: 'ACTIVE',
              excludeCompletedDeals: true,
              limit: 1,
            })
            .catch(() => null),
        ]);

        if (requestSeq !== fetchIdRef.current) return;

        if (!mainRes.success || !mainRes.data) {
          setError(mainRes.message || 'Failed to load leads queue.');
          return;
        }

        // Never filter rows in JS after MongoDB pagination
        const serverRows = mainRes.data.enquiries || [];
        setLeads(serverRows);

        const pag = mainRes.data.pagination;
        const mainTotal = pag?.total ?? pag?.totalCount ?? serverRows.length;
        const computedPages = Math.max(1, pag?.totalPages ?? (Math.ceil(mainTotal / pageSize) || 1));

        setTotalMatchingLeads(mainTotal);
        setTotalPages(computedPages);
        if (currentPage > computedPages) {
          setCurrentPage(computedPages);
        }

        if (unassignedBadgeRes?.success && unassignedBadgeRes.data?.pagination) {
          setUnassignedTotalCount(
            unassignedBadgeRes.data.pagination.total ??
              unassignedBadgeRes.data.pagination.totalCount ??
              0
          );
        } else if (activeQueue === 'UNASSIGNED') {
          setUnassignedTotalCount(mainTotal);
        }

        if (assignedBadgeRes?.success && assignedBadgeRes.data?.pagination) {
          setAssignedTotalCount(
            assignedBadgeRes.data.pagination.total ??
              assignedBadgeRes.data.pagination.totalCount ??
              0
          );
        } else if (activeQueue === 'ASSIGNED') {
          setAssignedTotalCount(mainTotal);
        }

        setKnownProjects((prev) => {
          const set = new Set(prev);
          let changed = false;
          for (const item of serverRows) {
            const p = item.projectName?.trim();
            if (p && !set.has(p)) {
              set.add(p);
              changed = true;
            }
          }
          return changed ? Array.from(set).sort() : prev;
        });
      } catch (err: unknown) {
        if (requestSeq !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load lead assignment workspace.');
      } finally {
        if (requestSeq === fetchIdRef.current && !options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [
      activeQueue,
      currentPage,
      pageSize,
      debouncedSearch,
      managerFilter,
      ownerFilter,
      projectFilter,
      currentUser.role,
    ]
  );

  useEffect(() => {
    if (!isMetaLoaded) return;
    fetchQueueData();
  }, [isMetaLoaded, fetchQueueData]);

  const handleQueueSwitch = (tab: QueueTab) => {
    if (tab === activeQueue) return;
    setActiveQueue(tab);
    setCurrentPage(1);
    setSelectedLeadIds(new Set());
    setSearchInput('');
    setDebouncedSearch('');
    setManagerFilter('ALL');
    setOwnerFilter('ALL');
    setProjectFilter('ALL');
    setSearchParams(tab === 'UNASSIGNED' ? {} : { queue: 'assigned' }, { replace: true });
  };

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    const visibleIds = leads.map(getEnquiryId).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedLeadIds.has(id));
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const targetAgentObj = agents.find((a) => a.id === targetAgentId) || null;

  const executeAssignment = async (
    leadIdsToAssign: string[],
    method: 'MANUAL' | 'ROUND_ROBIN'
  ) => {
    if (leadIdsToAssign.length === 0) {
      void Swal.fire({
        icon: 'info',
        title: 'No Leads Selected',
        text: 'Select at least one lead checkbox before assigning.',
      });
      return;
    }

    const resolvedAgentId = targetAgentId?.trim();
    if (method === 'MANUAL' && (!resolvedAgentId || resolvedAgentId === 'undefined')) {
      void Swal.fire({
        icon: 'warning',
        title: 'Select Sales Agent',
        text: 'Please choose a valid target Sales Agent from the dropdown first.',
      });
      return;
    }

    // In ASSIGNED queue with MANUAL mode, skip leads already assigned to the chosen target agent
    let effectiveIds = leadIdsToAssign;
    if (method === 'MANUAL' && activeQueue === 'ASSIGNED') {
      const sourceMap = new Map(leads.map((l) => [getEnquiryId(l), l]));
      effectiveIds = leadIdsToAssign.filter((id) => {
        const l = sourceMap.get(id);
        return !l || getAssigneeId(l) !== resolvedAgentId;
      });
      if (effectiveIds.length === 0) {
        void Swal.fire({
          icon: 'info',
          title: 'Already Assigned',
          text: `Selected leads are already assigned to ${targetAgentObj?.name || 'the target agent'}. Choose another agent to reassign.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let ok = false;
      let assignedCount = 0;
      let feedbackMsg = '';

      if (method === 'MANUAL' && effectiveIds.length === 1) {
        const singleRes = await enquiryService.assignLead(effectiveIds[0], resolvedAgentId);
        ok = singleRes.success;
        assignedCount = ok ? 1 : 0;
        feedbackMsg =
          singleRes.message ||
          `Lead assigned to ${targetAgentObj?.name || 'selected agent'}.`;
      } else {
        const bulkRes = await enquiryService.bulkAssignLeads(effectiveIds, {
          assignedToId: method === 'MANUAL' ? resolvedAgentId : undefined,
          method,
        });
        ok = Boolean(bulkRes.success || (bulkRes.data?.assignedCount ?? 0) > 0);
        assignedCount = bulkRes.data?.assignedCount ?? (ok ? effectiveIds.length : 0);
        feedbackMsg =
          bulkRes.data?.message ||
          bulkRes.message ||
          `Assigned ${assignedCount} lead(s) successfully.`;
      }

      if (!ok || assignedCount === 0) {
        void Swal.fire({
          icon: 'error',
          title: 'Assignment Failed',
          text: feedbackMsg || 'Unable to assign the selected leads.',
        });
        return;
      }

      const assignedIdSet = new Set(effectiveIds);

      if (activeQueue === 'UNASSIGNED') {
        // Immediate queue removal + Tab 1 decrement / Tab 2 increment
        setLeads((prev) => prev.filter((l) => !assignedIdSet.has(getEnquiryId(l))));
        setUnassignedTotalCount((c) => Math.max(0, c - assignedCount));
        setAssignedTotalCount((c) => c + assignedCount);
        setTotalMatchingLeads((c) => Math.max(0, c - assignedCount));
      } else if (method === 'MANUAL' && targetAgentObj) {
        // Update owner inline immediately in Assigned Leads tab
        setLeads((prev) =>
          prev.map((l) =>
            assignedIdSet.has(getEnquiryId(l))
              ? {
                  ...l,
                  assignedTo: {
                    id: targetAgentObj.id,
                    name: targetAgentObj.name,
                    role: 'SALES',
                    managerName: targetAgentObj.managerName,
                  },
                }
              : l
          )
        );
      }

      if (method === 'MANUAL' && targetAgentObj) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === targetAgentObj.id
              ? { ...a, activeLeadsCount: a.activeLeadsCount + assignedCount }
              : a
          )
        );
      }

      setSelectedLeadIds(new Set());

      void Swal.fire({
        icon: 'success',
        title: method === 'ROUND_ROBIN' ? 'Auto-Distributed' : 'Leads Assigned',
        text: feedbackMsg,
        timer: 2000,
        showConfirmButton: false,
      });

      // Reconcile exact server counts, page slice, and workload numbers
      await Promise.all([fetchMetaOptions(), fetchQueueData({ silent: true })]);
    } catch (err: unknown) {
      void Swal.fire({
        icon: 'error',
        title: 'Assignment Error',
        text: err instanceof Error ? err.message : 'Unexpected error while assigning leads.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleOwnerOptions =
    currentUser.role === 'ADMIN' && managerFilter !== 'ALL'
      ? knownOwners.filter((o) => {
          const ag = agents.find((a) => a.id === o.id);
          return ag ? ag.managerId === managerFilter || o.id === managerFilter : true;
        })
      : knownOwners;

  const allVisibleSelected =
    leads.length > 0 && leads.every((l) => selectedLeadIds.has(getEnquiryId(l)));

  const startItem = totalMatchingLeads === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalMatchingLeads);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Lead Allocation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Assign &amp; Reassign Leads
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            {currentUser.role === 'ADMIN'
              ? 'Allocate organization-wide unassigned enquiries or inspect and rebalance assigned leads across all managers and sales agents.'
              : `Allocate eligible unassigned enquiries or inspect and reassign active leads strictly within ${currentUser.name}'s team.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              fetchMetaOptions();
              fetchQueueData();
            }}
            disabled={isLoading || isSubmitting}
          >
            Refresh
          </Button>
          {currentUser.role === 'MANAGER' && (
            <Button
              size="sm"
              variant="outline"
              icon={<Users className="h-3.5 w-3.5 text-brand-primary" />}
              onClick={() => navigate('/manager/team')}
            >
              Manage Sales Team
            </Button>
          )}
        </div>
      </div>

      {/* Clean 2-Tab Separation: Unassigned Leads vs Assigned Leads */}
      <div className="flex flex-wrap items-center gap-2 border-b border-edge pb-2.5">
        <button
          type="button"
          onClick={() => handleQueueSwitch('UNASSIGNED')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeQueue === 'UNASSIGNED'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-surface-subtle text-content-secondary hover:text-content-primary hover:bg-slate-200/70'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Unassigned Leads</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeQueue === 'UNASSIGNED'
                ? 'bg-white/20 text-white'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {unassignedTotalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQueueSwitch('ASSIGNED')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeQueue === 'ASSIGNED'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-surface-subtle text-content-secondary hover:text-content-primary hover:bg-slate-200/70'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assigned Leads</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeQueue === 'ASSIGNED'
                ? 'bg-white/20 text-white'
                : 'bg-blue-100 text-brand-primary'
            }`}
          >
            {assignedTotalCount}
          </span>
        </button>
      </div>

      {/* Assignment Control & Filter Bar */}
      <Card className="p-4 sm:p-5 bg-surface-card border border-edge">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="assignLeadsTargetAgent"
              className="block text-[11px] font-bold uppercase tracking-wider text-content-primary"
            >
              Target Sales Agent (
              {currentUser.role === 'MANAGER' ? 'Your Team Only' : 'All Active Agents'})
            </label>
            <select
              id="assignLeadsTargetAgent"
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
              disabled={isSubmitting || agents.length === 0}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border border-edge bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              {agents.length === 0 ? (
                <option value="">
                  {currentUser.role === 'MANAGER'
                    ? 'No active sales agents in your team'
                    : 'No active sales agents available'}
                </option>
              ) : (
                agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} — {agent.activeLeadsCount} active lead{agent.activeLeadsCount === 1 ? '' : 's'}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {selectedLeadIds.size > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-brand-primary border border-blue-200 text-xs font-bold">
                <CheckSquare className="w-3.5 h-3.5" />
                {selectedLeadIds.size} Selected
              </span>
            )}

            <Button
              size="sm"
              variant="primary"
              icon={<UserCheck className="w-4 h-4" />}
              onClick={() => executeAssignment(Array.from(selectedLeadIds), 'MANUAL')}
              disabled={isSubmitting || selectedLeadIds.size === 0 || !targetAgentId}
              className="shadow-sm shadow-blue-500/20"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Selected'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              onClick={() => executeAssignment(Array.from(selectedLeadIds), 'ROUND_ROBIN')}
              disabled={isSubmitting || selectedLeadIds.size === 0 || agents.length === 0}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Auto-Distribute (Round Robin)
            </Button>
          </div>
        </div>

        {/* Search, Manager, Sales Agent, Project & Page Size Row */}
        <div className="mt-4 pt-4 border-t border-edge-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-content-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search lead name, phone, property, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-edge bg-surface-subtle focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Manager Filter (Admin Only on Assigned Leads Tab) */}
            {activeQueue === 'ASSIGNED' && currentUser.role === 'ADMIN' && managers.length > 0 && (
              <select
                value={managerFilter}
                onChange={(e) => {
                  setManagerFilter(e.target.value);
                  setOwnerFilter('ALL');
                  setCurrentPage(1);
                  setSelectedLeadIds(new Set());
                }}
                aria-label="Filter by reporting manager"
                className="px-3 py-2 text-xs rounded-lg border border-edge bg-surface-subtle text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="ALL">All Managers</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    Manager: {m.name}
                  </option>
                ))}
              </select>
            )}

            {/* Assigned Sales Agent Filter */}
            {activeQueue === 'ASSIGNED' && (
              <select
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setCurrentPage(1);
                  setSelectedLeadIds(new Set());
                }}
                aria-label="Filter by assigned sales agent"
                className="px-3 py-2 text-xs rounded-lg border border-edge bg-surface-subtle text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="ALL">
                  {currentUser.role === 'MANAGER' ? 'All Team Members' : 'All Sales Agents'}
                </option>
                {visibleOwnerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                setCurrentPage(1);
                setSelectedLeadIds(new Set());
              }}
              aria-label="Filter by property or project"
              className="px-3 py-2 text-xs rounded-lg border border-edge bg-surface-subtle text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="ALL">All Projects</option>
              {knownProjects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>

            {/* Page Size Selector (10 / 25 / 50) */}
            <div className="flex items-center gap-1.5 pl-1">
              <label
                htmlFor="assignLeadsPageSize"
                className="text-xs font-semibold text-content-muted whitespace-nowrap"
              >
                Show:
              </label>
              <select
                id="assignLeadsPageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as PageSizeOption);
                  setCurrentPage(1);
                  setSelectedLeadIds(new Set());
                }}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-edge bg-surface-subtle text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Leads Queue Table */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-6">
            <LoadingState message="Loading lead assignment queues..." rows={5} />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={() => fetchQueueData()} />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={
                activeQueue === 'UNASSIGNED'
                  ? 'No Unassigned Leads Waiting'
                  : 'No Assigned Leads Matching Filters'
              }
              description={
                activeQueue === 'UNASSIGNED'
                  ? 'All active enquiries in this queue matching your filters are already assigned.'
                  : 'Adjust your search, manager, agent, or project filter to view active assigned leads.'
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                    <th scope="col" className="py-3.5 pl-5 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        aria-label="Select all visible leads"
                        className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                      />
                    </th>
                    <th scope="col" className="py-3.5 px-3 min-w-[190px]">Lead Details</th>
                    <th scope="col" className="py-3.5 px-3 min-w-[150px]">Property / Project</th>
                    <th scope="col" className="py-3.5 px-3 min-w-[170px]">
                      {activeQueue === 'UNASSIGNED'
                        ? 'Unassigned Reason'
                        : 'Assigned Sales Agent & Manager'}
                    </th>
                    <th scope="col" className="py-3.5 px-3 min-w-[180px]">
                      Stage, Outcome &amp; Last Activity
                    </th>
                    <th scope="col" className="py-3.5 pl-3 pr-5 text-right min-w-[190px]">
                      {activeQueue === 'UNASSIGNED' ? 'Actions' : 'Reassign / View Workflow'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle">
                  {leads.map((lead) => {
                    const id = getEnquiryId(lead);
                    const isChecked = selectedLeadIds.has(id);
                    const currentOwnerId = getAssigneeId(lead);
                    const currentOwnerName = getAssigneeName(lead);
                    const reportingManagerName = getReportingManagerName(lead);
                    const isSameAsTarget =
                      activeQueue === 'ASSIGNED' &&
                      Boolean(targetAgentId && currentOwnerId === targetAgentId);
                    const outcomeMeta = getFollowUpOutcomeMeta(lead.lastFollowUpOutcome);
                    const stageMeta = getWorkflowStageMeta(lead.currentStage);
                    const lastActivityStr = formatLastActivity(
                      lead.lastFollowUpAt || lead.updatedAt || lead.createdAt
                    );

                    return (
                      <tr
                        key={id}
                        className={`transition-colors ${
                          isChecked ? 'bg-blue-50/40' : 'hover:bg-surface-table-hover'
                        }`}
                      >
                        <td className="py-3.5 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLead(id)}
                            aria-label={`Select ${lead.name}`}
                            className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                          />
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-content-primary">{lead.name}</div>
                          <div className="text-[11px] text-content-muted font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{maskPhoneNumber(lead.mobile || '')}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Building className="w-3 h-3 shrink-0" />
                            <span>{lead.projectName || 'Not Specified'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {activeQueue === 'UNASSIGNED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{lead.unassignedReason || 'Pending Review'}</span>
                            </span>
                          ) : (
                            <div className="flex flex-col items-start gap-0.5">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  currentOwnerId === currentUser.id
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-blue-50 text-brand-primary border-blue-200'
                                }`}
                              >
                                {currentOwnerName}
                                {currentOwnerId === currentUser.id ? ' (You)' : ''}
                              </span>
                              {reportingManagerName && (
                                <span className="text-[10px] text-content-muted pl-0.5">
                                  Mgr: {reportingManagerName}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[11px] font-semibold text-content-secondary">
                              {stageMeta.label}
                            </span>
                            {outcomeMeta && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${outcomeMeta.badgeCls}`}
                              >
                                {outcomeMeta.label}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[10px] text-content-muted">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{lastActivityStr}</span>
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 pl-3 pr-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeAssignment([id], 'MANUAL')}
                              disabled={isSubmitting || !targetAgentId || isSameAsTarget}
                              className="py-1 px-2.5 text-xs text-brand-primary border-blue-200 hover:bg-blue-50"
                              title={
                                isSameAsTarget
                                  ? `Already assigned to ${targetAgentObj?.name}`
                                  : `Assign to ${targetAgentObj?.name || 'selected agent'}`
                              }
                            >
                              <span>
                                {isSameAsTarget
                                  ? 'Assigned'
                                  : targetAgentObj
                                  ? `${activeQueue === 'UNASSIGNED' ? 'Assign' : 'Reassign'} → ${targetAgentObj.name.split(' ')[0]}`
                                  : activeQueue === 'UNASSIGNED'
                                  ? 'Assign'
                                  : 'Reassign'}
                              </span>
                              {!isSameAsTarget && <ArrowRight className="w-3 h-3 ml-1" />}
                            </Button>
                            <button
                              type="button"
                              onClick={() => navigate(`/sales/leads/${id}/workflow`)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-content-secondary hover:text-brand-primary hover:bg-slate-100 border border-transparent hover:border-edge transition-colors cursor-pointer"
                              title="View Lead Workflow"
                              aria-label={`View workflow for ${lead.name}`}
                            >
                              <span>Workflow</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Footer */}
            <div className="px-5 py-3.5 border-t border-edge bg-surface-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-content-muted font-medium">
                Showing <strong className="text-content-primary">{startItem}</strong>–
                <strong className="text-content-primary">{endItem}</strong> of{' '}
                <strong className="text-content-primary">{totalMatchingLeads}</strong> leads
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    setSelectedLeadIds(new Set());
                  }}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  className="py-1 px-2.5 text-xs"
                >
                  Previous
                </Button>

                {pageNumbers.map((entry, idx) =>
                  entry === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-content-muted">
                      ...
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        if (entry !== currentPage) {
                          setCurrentPage(entry);
                          setSelectedLeadIds(new Set());
                        }
                      }}
                      className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        entry === currentPage
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'bg-white border border-edge text-content-secondary hover:bg-slate-100'
                      }`}
                    >
                      {entry}
                    </button>
                  )
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    setSelectedLeadIds(new Set());
                  }}
                  className="py-1 px-2.5 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
