import React, { useState, useEffect, useMemo, useContext } from 'react';
import Swal from 'sweetalert2';
import {
  X,
  UserCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckSquare,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { AuthContext } from '../../../context/AuthContext.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { TeamMemberPerformance } from '../../../types/enquiry.types.js';
import { maskPhoneNumber } from '../../../utils/phone.js';
import {
  getFollowUpOutcomeMeta,
  getWorkflowStageMeta,
} from '../../../utils/followUpOutcome.js';

export interface EligibleLeadItem {
  id: string;
  name: string;
  mobile?: string;
  projectName?: string;
  currentStage?: string;
  lastFollowUpOutcome?: string;
  assignedTo?: { id: string; _id?: string; name: string; role?: string } | null;
}

export interface ReassignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAgent?: TeamMemberPerformance | null;
  lead?: EligibleLeadItem | null;
  currentManagerId?: string;
  teamMembers: TeamMemberPerformance[];
  onSuccess: () => void;
}

type OwnershipFilter = 'MANAGER_OWNED' | 'UNASSIGNED';

const getLeadAssigneeId = (item: EligibleLeadItem): string => {
  if (!item.assignedTo) return '';
  if (typeof item.assignedTo === 'string') return item.assignedTo;
  return item.assignedTo.id || item.assignedTo._id || '';
};

const isLeadHeldBySalesAgent = (item: EligibleLeadItem, managerId: string): boolean => {
  const ownerId = getLeadAssigneeId(item);
  if (!ownerId) return false; // Unassigned leads are eligible
  if (item.assignedTo?.role === 'SALES') return true;
  if (managerId && ownerId !== managerId) return true;
  return false;
};

const normalizeLeadItem = (e: any): EligibleLeadItem => {
  const rawOwner = e.assignedTo;
  let normalizedOwner: EligibleLeadItem['assignedTo'] = null;
  if (rawOwner && typeof rawOwner === 'object') {
    const ownerId = rawOwner.id || rawOwner._id?.toString() || '';
    if (ownerId) {
      normalizedOwner = {
        id: ownerId,
        name: rawOwner.name || 'Team Member',
        role: rawOwner.role,
      };
    }
  } else if (typeof rawOwner === 'string' && rawOwner) {
    normalizedOwner = { id: rawOwner, name: 'Team Member' };
  }

  return {
    id: (e._id || e.id || '').toString(),
    name: e.name,
    mobile: e.mobile || e.normalizedMobile,
    projectName: e.projectName,
    currentStage: e.currentStage || 'FOLLOW_UP',
    lastFollowUpOutcome: e.lastFollowUpOutcome,
    assignedTo: normalizedOwner,
  };
};

export const ReassignLeadModal: React.FC<ReassignLeadModalProps> = ({
  isOpen,
  onClose,
  targetAgent,
  lead,
  currentManagerId,
  teamMembers,
  onSuccess,
}) => {
  const auth = useContext(AuthContext);
  const effectiveManagerId =
    (currentManagerId && currentManagerId !== 'me' ? currentManagerId : auth?.user?.id) || '';

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [allEligibleLeads, setAllEligibleLeads] = useState<EligibleLeadItem[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('MANAGER_OWNED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize target agent & reset local filter controls when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSearchQuery('');
    setOwnershipFilter('MANAGER_OWNED');

    if (targetAgent?.id) {
      setSelectedAgentId(targetAgent.id);
    } else if (teamMembers.length > 0) {
      const firstActive = teamMembers.find((m) => m.isActive);
      if (firstActive) {
        setSelectedAgentId(firstActive.id);
      }
    }
  }, [targetAgent, teamMembers, isOpen]);

  // Synchronize pre-selected single lead if provided directly (never allow Sales-held leads)
  useEffect(() => {
    if (lead?.id) {
      const normalized = normalizeLeadItem(lead);
      if (!isLeadHeldBySalesAgent(normalized, effectiveManagerId)) {
        setAllEligibleLeads([normalized]);
        setSelectedLeadIds([normalized.id]);
      } else {
        setAllEligibleLeads([]);
        setSelectedLeadIds([]);
      }
    }
  }, [lead, effectiveManagerId]);

  // Fetch ONLY leads held by the logged-in Manager (assignedTo: currentUser.id) + eligible unassigned leads
  useEffect(() => {
    if (!isOpen || lead?.id) return;

    let isCancelled = false;
    const fetchEligibleLeads = async () => {
      setIsLoadingLeads(true);
      setError(null);
      try {
        const [managerRes, unassignedRes] = await Promise.all([
          enquiryService.getEnquiries({
            assignedTo: effectiveManagerId || 'me',
            status: 'ACTIVE',
            excludeCompletedDeals: true,
            limit: 100,
          }),
          enquiryService.getEnquiries({
            unassigned: true,
            assignedOnly: false,
            status: 'ACTIVE',
            excludeCompletedDeals: true,
            limit: 100,
          }).catch(() => null),
        ]);

        if (!isCancelled) {
          const mergedMap = new Map<string, EligibleLeadItem>();

          if (managerRes.success && managerRes.data?.enquiries) {
            for (const raw of managerRes.data.enquiries) {
              const item = normalizeLeadItem(raw);
              if (item.id && !isLeadHeldBySalesAgent(item, effectiveManagerId)) {
                mergedMap.set(item.id, item);
              }
            }
          }

          if (unassignedRes?.success && unassignedRes.data?.enquiries) {
            for (const raw of unassignedRes.data.enquiries) {
              const item = normalizeLeadItem(raw);
              if (item.id && !getLeadAssigneeId(item) && !mergedMap.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            }
          }

          setAllEligibleLeads(Array.from(mergedMap.values()));
          setSelectedLeadIds([]);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve eligible leads.');
          setAllEligibleLeads([]);
          setSelectedLeadIds([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLeads(false);
        }
      }
    };

    fetchEligibleLeads();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, lead, effectiveManagerId]);

  // Strictly exclude any lead assigned to a Sales Agent or matching the target agent
  const leadsExcludingTargetAgent = useMemo(() => {
    return allEligibleLeads.filter((item) => {
      if (isLeadHeldBySalesAgent(item, effectiveManagerId)) return false;
      if (selectedAgentId && getLeadAssigneeId(item) === selectedAgentId) return false;
      return true;
    });
  }, [allEligibleLeads, selectedAgentId, effectiveManagerId]);

  // Prune any selected IDs no longer in the eligible pool
  useEffect(() => {
    const validIds = new Set(leadsExcludingTargetAgent.map((l) => l.id));
    setSelectedLeadIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [selectedAgentId, leadsExcludingTargetAgent]);

  // Apply ownership filter pills (My Assigned Leads vs Unassigned Only) + search query
  const filteredLeads = useMemo(() => {
    return leadsExcludingTargetAgent.filter((item) => {
      const ownerId = getLeadAssigneeId(item);
      if (ownershipFilter === 'MANAGER_OWNED' && !ownerId) return false;
      if (ownershipFilter === 'UNASSIGNED' && ownerId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ownerName = (ownerId ? 'Assigned to You (Manager)' : 'Unassigned').toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          Boolean(item.mobile && item.mobile.toLowerCase().includes(q)) ||
          Boolean(item.projectName && item.projectName.toLowerCase().includes(q)) ||
          ownerName.includes(q)
        );
      }
      return true;
    });
  }, [leadsExcludingTargetAgent, ownershipFilter, searchQuery]);

  if (!isOpen) return null;

  const activeTeamMembers = teamMembers.filter((m) => m.isActive);
  const activeTargetAgent = activeTeamMembers.find((m) => m.id === selectedAgentId) || targetAgent;
  const managerOwnedCount = leadsExcludingTargetAgent.filter((l) => Boolean(getLeadAssigneeId(l))).length;
  const unassignedCount = leadsExcludingTargetAgent.filter((l) => !getLeadAssigneeId(l)).length;

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setError(null);
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredLeads.map((l) => l.id);
    const allFilteredSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedLeadIds.includes(id));

    if (allFilteredSelected) {
      const filteredSet = new Set(filteredIds);
      setSelectedLeadIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...filteredIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Please select a target sales agent from your team.');
      return;
    }
    if (selectedLeadIds.length === 0) {
      setError('Please select at least one lead to assign.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let ok = false;
      let errMsg = 'Failed to reassign leads. Please try again.';

      if (selectedLeadIds.length === 1) {
        const res = await enquiryService.assignLead(selectedLeadIds[0], selectedAgentId);
        ok = res.success;
        if (!ok) errMsg = res.message || errMsg;
      } else {
        const res = await enquiryService.bulkAssignLeads(selectedLeadIds, {
          assignedToId: selectedAgentId,
          method: 'MANUAL',
        });
        ok = res.success;
        if (!ok) errMsg = res.message || errMsg;
      }

      if (ok) {
        const reassignedSet = new Set(selectedLeadIds);
        setAllEligibleLeads((prev) => prev.filter((l) => !reassignedSet.has(l.id)));
        onSuccess();
        onClose();
        void Swal.fire({
          icon: 'success',
          title: 'Lead Ownership Updated',
          text: `${selectedLeadIds.length} lead${selectedLeadIds.length === 1 ? '' : 's'} assigned to ${activeTargetAgent?.name || 'selected agent'}.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        setError(errMsg);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reassigning leads.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-modal-title"
    >
      <div className="bg-surface-card border border-edge rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-brand-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="reassign-modal-title"
                className="text-base font-bold text-content-primary"
              >
                Assign Lead to {activeTargetAgent?.name || 'Sales Agent'}
              </h2>
              <p className="text-xs text-content-muted">
                Assign leads currently held by you (Manager) to your team's sales agents. Leads already assigned to sales agents are excluded.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Agent Selector */}
          <div className="space-y-1.5">
            <label
              htmlFor="assignedToSelect"
              className="block text-xs font-bold text-content-primary uppercase tracking-wider"
            >
              Select New Assigned Sales Agent <span className="text-red-500">*</span>
            </label>
            <select
              id="assignedToSelect"
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-edge bg-surface-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            >
              <option value="">-- Choose Sales Agent --</option>
              {activeTeamMembers.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.email}) — {agent.activeLeadsCount} active lead{agent.activeLeadsCount === 1 ? '' : 's'}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-content-muted">
              Assign leads currently held by you (Manager) to your team's sales agents. Leads already assigned to sales agents are excluded.
            </p>
          </div>

          {/* Filter Pills & Search */}
          {!lead?.id && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOwnershipFilter('MANAGER_OWNED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    ownershipFilter === 'MANAGER_OWNED'
                      ? 'bg-brand-primary text-white'
                      : 'bg-surface-subtle text-content-secondary hover:bg-slate-200/70'
                  }`}
                >
                  My Assigned Leads ({managerOwnedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOwnershipFilter('UNASSIGNED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    ownershipFilter === 'UNASSIGNED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-surface-subtle text-content-secondary hover:bg-slate-200/70'
                  }`}
                >
                  Unassigned Only ({unassignedCount})
                </button>
              </div>

              <div className="relative sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-content-subtle" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lead, phone, project..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-edge bg-surface-subtle focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}

          {/* Eligible Leads Multi-Select List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-content-primary uppercase tracking-wider">
                SELECT LEAD TO REASSIGN ({filteredLeads.length} AVAILABLE)
              </span>
              <div className="flex items-center gap-2">
                {selectedLeadIds.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-brand-primary">
                    <CheckSquare className="w-3 h-3" />
                    {selectedLeadIds.length} Selected
                  </span>
                )}
                {filteredLeads.length > 0 && !lead?.id && (
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[11px] font-semibold text-brand-primary hover:underline cursor-pointer"
                  >
                    {filteredLeads.every((l) => selectedLeadIds.includes(l.id))
                      ? 'Clear Filtered'
                      : 'Select All Filtered'}
                  </button>
                )}
              </div>
            </div>

            {isLoadingLeads ? (
              <LoadingState message="Loading available leads..." rows={3} />
            ) : filteredLeads.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-edge bg-surface-subtle/50 text-center space-y-2">
                <EmptyState
                  title="No Eligible Leads Available"
                  description={
                    selectedAgentId
                      ? `There are no matching leads held by you${ownershipFilter === 'UNASSIGNED' ? ' in the unassigned queue' : ''} available to assign to ${activeTargetAgent?.name || 'this agent'}.`
                      : 'Select a target sales agent above to view assignable leads.'
                  }
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {filteredLeads.map((leadItem) => {
                  const isSelected = selectedLeadIds.includes(leadItem.id);
                  const ownerId = getLeadAssigneeId(leadItem);

                  return (
                    <label
                      key={leadItem.id}
                      className={`block p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-primary bg-blue-50/50 shadow-xs ring-1 ring-brand-primary/20'
                          : 'border-edge hover:bg-surface-subtle'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLeadSelection(leadItem.id)}
                          className="mt-1 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-content-primary truncate">
                              {leadItem.name}
                            </span>
                            {leadItem.projectName && (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-primary font-medium text-[11px] shrink-0">
                                {leadItem.projectName}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-content-muted">
                            {leadItem.mobile && (
                              <span>
                                Phone:{' '}
                                <strong className="font-mono text-content-secondary">
                                  {maskPhoneNumber(leadItem.mobile)}
                                </strong>
                              </span>
                            )}
                            <span>•</span>
                            <span>
                              Stage:{' '}
                              <strong className="text-content-secondary">
                                {getWorkflowStageMeta(leadItem.currentStage).label}
                              </strong>
                            </span>
                            {getFollowUpOutcomeMeta(leadItem.lastFollowUpOutcome) && (
                              <>
                                <span>•</span>
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${
                                    getFollowUpOutcomeMeta(leadItem.lastFollowUpOutcome)!.badgeCls
                                  }`}
                                >
                                  {getFollowUpOutcomeMeta(leadItem.lastFollowUpOutcome)!.label}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              Current:{' '}
                              <strong className={!ownerId ? 'text-amber-700' : 'text-emerald-700'}>
                                {!ownerId ? 'Unassigned' : 'Assigned to You (Manager)'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-brand-primary mt-0.5" />
            <div className="leading-relaxed">
              Every assignment automatically logs an audit entry in the lead timeline and sends an instant notification to the target sales agent.
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-edge">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={
                isSubmitting ||
                !selectedAgentId ||
                selectedLeadIds.length === 0 ||
                filteredLeads.length === 0
              }
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting
                ? 'Reassigning...'
                : selectedLeadIds.length > 1
                ? `Assign ${selectedLeadIds.length} Selected Leads`
                : 'Confirm Reassignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
