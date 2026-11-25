import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  X,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserX,
  ArrowLeft,
  CheckSquare,
  Building,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { EligibleAgentSummary, IEnquiry } from '../../../types/enquiry.types.js';
import { maskPhoneNumber } from '../../../utils/phone.js';
import { getWorkflowStageMeta } from '../../../utils/followUpOutcome.js';

export interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentManagerId?: string;
}

const getLeadId = (lead: IEnquiry): string => (lead.id || (lead as any)._id || '').toString();

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentManagerId,
}) => {
  const [agents, setAgents] = useState<EligibleAgentSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Onboarding state: selecting an available agent shows optional initial lead assignment step
  const [onboardingAgent, setOnboardingAgent] = useState<EligibleAgentSummary | null>(null);
  const [availableLeads, setAvailableLeads] = useState<IEnquiry[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState<boolean>(false);

  const fetchRoster = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await enquiryService.getTeamRoster();
      if (res.success && res.data) {
        setAgents(res.data.agents || []);
      } else {
        setError(res.message || 'Failed to retrieve sales agents roster.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to team roster service.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPoolLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const [unassignedRes, managerOwnedRes] = await Promise.all([
        enquiryService.getEnquiries({
          unassigned: true,
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          limit: 100,
        }),
        enquiryService.getEnquiries({
          assignedTo: currentManagerId || 'me',
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          limit: 100,
        }),
      ]);

      const mergedMap = new Map<string, IEnquiry>();
      if (unassignedRes.success && unassignedRes.data?.enquiries) {
        for (const enq of unassignedRes.data.enquiries) {
          const id = getLeadId(enq);
          if (id) mergedMap.set(id, enq);
        }
      }
      if (managerOwnedRes.success && managerOwnedRes.data?.enquiries) {
        for (const enq of managerOwnedRes.data.enquiries) {
          const id = getLeadId(enq);
          if (id && !mergedMap.has(id)) mergedMap.set(id, enq);
        }
      }

      setAvailableLeads(Array.from(mergedMap.values()));
    } catch {
      setAvailableLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [currentManagerId]);

  useEffect(() => {
    if (isOpen) {
      fetchRoster();
      fetchPoolLeads();
      setSearchTerm('');
      setLeadSearchTerm('');
      setOnboardingAgent(null);
      setSelectedLeadIds([]);
      setSuccessMessage(null);
      setError(null);
    }
  }, [isOpen, fetchRoster, fetchPoolLeads]);

  const filteredPoolLeads = useMemo(() => {
    if (!leadSearchTerm.trim()) return availableLeads;
    const term = leadSearchTerm.toLowerCase();
    return availableLeads.filter(
      (l) =>
        l.name?.toLowerCase().includes(term) ||
        l.mobile?.toLowerCase().includes(term) ||
        l.projectName?.toLowerCase().includes(term)
    );
  }, [availableLeads, leadSearchTerm]);

  if (!isOpen) return null;

  const handleStartOnboarding = (agent: EligibleAgentSummary) => {
    setOnboardingAgent(agent);
    setSelectedLeadIds([]);
    setLeadSearchTerm('');
    setError(null);
    setSuccessMessage(null);
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllFilteredLeads = () => {
    const visibleIds = filteredPoolLeads.map(getLeadId).filter(Boolean);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedLeadIds.includes(id));
    if (allSelected) {
      const visibleSet = new Set(visibleIds);
      setSelectedLeadIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedLeadIds(Array.from(new Set([...selectedLeadIds, ...visibleIds])));
    }
  };

  const handleConfirmOnboarding = async () => {
    if (!onboardingAgent) return;
    setIsSubmittingOnboarding(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await enquiryService.assignAgentToTeam(
        onboardingAgent.id,
        selectedLeadIds.length > 0 ? selectedLeadIds : undefined
      );

      if (res.success) {
        const assignedLeadsCount = res.data?.assignedLeadsCount ?? 0;
        const msg =
          assignedLeadsCount > 0
            ? `Added ${onboardingAgent.name} to your sales team and assigned ${assignedLeadsCount} initial lead${assignedLeadsCount === 1 ? '' : 's'}.`
            : `Successfully assigned ${onboardingAgent.name} to your sales team.`;

        setSuccessMessage(msg);
        setOnboardingAgent(null);
        setSelectedLeadIds([]);
        await Promise.all([fetchRoster(), fetchPoolLeads()]);
        onSuccess();

        void Swal.fire({
          icon: 'success',
          title: 'Agent Added to Team',
          text: msg,
          timer: 2200,
          showConfirmButton: false,
        });
      } else {
        setError(res.message || 'Failed to assign agent to team.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error assigning agent.');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const handleToggleMembership = async (agent: EligibleAgentSummary, newStatus: boolean) => {
    setActionLoadingId(agent.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await enquiryService.updateTeamMemberStatus(agent.id, newStatus);
      if (res.success) {
        setSuccessMessage(
          newStatus
            ? `Activated team membership for ${agent.name}.`
            : `Deactivated team membership for ${agent.name}. Agent's records removed from your team view.`
        );
        await fetchRoster();
        onSuccess();
      } else {
        setError(res.message || 'Failed to update team membership status.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating team membership status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAgents = agents.filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term);
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-card border border-edge rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-brand-primary rounded-lg border border-blue-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary">
                {onboardingAgent
                  ? `Add ${onboardingAgent.name} to Team & Assign Initial Leads`
                  : 'Sales Team Membership & Assignment'}
              </h3>
              <p className="text-xs text-content-muted">
                {onboardingAgent
                  ? 'Optionally select unassigned or manager-held leads to allocate right as this agent joins.'
                  : 'View eligible sales agents, assign available agents, or manage team membership.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmittingOnboarding}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {onboardingAgent ? (
            /* Step 2: Optional "Assign Initial Leads Now" Onboarding Section */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-content-primary">New Team Member: </span>
                  <span className="font-semibold text-brand-primary">{onboardingAgent.name}</span>
                  <span className="text-content-muted font-mono ml-1.5">({onboardingAgent.email})</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] self-start sm:self-auto">
                  Ready for Onboarding
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary">
                      Assign Initial Leads Now (Optional)
                    </h4>
                    <p className="text-[11px] text-content-muted">
                      Select any unassigned or manager-held leads to assign immediately upon onboarding. Each assignment logs an audit event and sends a notification.
                    </p>
                  </div>
                  {selectedLeadIds.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-brand-primary shrink-0 self-start sm:self-auto">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {selectedLeadIds.length} Selected
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter available leads by name, phone, or project..."
                      value={leadSearchTerm}
                      onChange={(e) => setLeadSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-edge bg-surface-input focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>
                  {filteredPoolLeads.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleToggleAllFilteredLeads}
                      className="text-xs shrink-0"
                    >
                      {filteredPoolLeads.every((l) => selectedLeadIds.includes(getLeadId(l)))
                        ? 'Clear Filtered'
                        : 'Select All'}
                    </Button>
                  )}
                </div>

                <div className="border border-edge rounded-xl overflow-hidden bg-surface-subtle/30">
                  {isLoadingLeads ? (
                    <div className="p-6">
                      <LoadingState message="Loading unassigned and team pool leads..." rows={3} />
                    </div>
                  ) : filteredPoolLeads.length === 0 ? (
                    <div className="p-6 text-center text-xs text-content-muted">
                      No available unassigned or manager-held leads right now. You can add{' '}
                      <strong className="text-content-primary">{onboardingAgent.name}</strong> directly and assign leads later.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar divide-y divide-edge-subtle">
                      {filteredPoolLeads.map((lead) => {
                        const leadId = getLeadId(lead);
                        const isChecked = selectedLeadIds.includes(leadId);
                        const isUnassigned = !(lead as any).assignedTo;

                        return (
                          <label
                            key={leadId}
                            className={`flex items-start gap-3 p-3 cursor-pointer text-xs transition-colors ${
                              isChecked ? 'bg-blue-50/60' : 'hover:bg-surface-card'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleLeadSelection(leadId)}
                              className="mt-1 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-content-primary truncate">
                                  {lead.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                    isUnassigned
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {isUnassigned ? 'Unassigned Queue' : 'Manager Pool'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[11px] text-content-muted">
                                <span className="font-mono">{maskPhoneNumber(lead.mobile || '')}</span>
                                {lead.projectName && (
                                  <span className="inline-flex items-center gap-1 text-brand-primary font-medium">
                                    <Building className="w-3 h-3" />
                                    {lead.projectName}
                                  </span>
                                )}
                                <span>Stage: {getWorkflowStageMeta((lead as any).currentStage).label}</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Step 1: Roster Selection Table */
            <>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
                <ShieldAlert className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Team Assignment Rules: </span>
                  Assign eligible, unassigned Sales Agents to your team (with optional initial leads) and manage team membership status. Cross-manager transfers require Administrator approval.
                </div>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search agents by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-edge bg-surface-input focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                  onClick={() => {
                    fetchRoster();
                    fetchPoolLeads();
                  }}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>

              {/* Agents Roster Table */}
              <div className="border border-edge rounded-xl overflow-hidden">
                {isLoading ? (
                  <div className="p-8">
                    <LoadingState message="Loading sales team roster..." rows={3} />
                  </div>
                ) : filteredAgents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-content-muted">
                    {searchTerm.trim() ? (
                      <span>No sales agents found matching &ldquo;{searchTerm}&rdquo;.</span>
                    ) : (
                      <span>No eligible sales agents available. Currently, there are no unassigned agents or team members to manage.</span>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96 custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-surface-table-header border-b border-edge sticky top-0 z-10 text-[11px] font-bold text-content-muted uppercase tracking-wider">
                        <tr>
                          <th scope="col" className="py-3 pl-4 pr-2">Sales Agent</th>
                          <th scope="col" className="py-3 px-2">Team Membership</th>
                          <th scope="col" className="py-3 px-2">Membership Status</th>
                          <th scope="col" className="py-3 pl-2 pr-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge-subtle">
                        {filteredAgents.map((agent) => {
                          const isWorking = actionLoadingId === agent.id;
                          const names = agent.name.split(' ');
                          const initials = (names[0]?.[0] || 'S') + (names[1]?.[0] || '');

                          return (
                            <tr key={agent.id} className="hover:bg-surface-table-hover transition-colors">
                              <td className="py-3 pl-4 pr-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-7 w-7 rounded-full bg-blue-100 text-brand-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {initials.toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-semibold text-content-primary block truncate">
                                      {agent.name}
                                    </span>
                                    <span className="text-[10px] text-content-muted font-mono block truncate">
                                      {agent.email}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-2">
                                {agent.isAssignedToCurrentManager ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    Your Team
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Unassigned
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-2">
                                {agent.statusLabel === 'Assigned to your team' ? (
                                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Active in Team
                                  </span>
                                ) : agent.statusLabel === 'Deactivated in your team' ? (
                                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                    Deactivated in Team
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-blue-200">
                                    Available to Assign
                                  </span>
                                )}
                              </td>

                              <td className="py-3 pl-2 pr-4 text-right">
                                {agent.statusLabel === 'Available' && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<UserPlus className="w-3 h-3" />}
                                    onClick={() => handleStartOnboarding(agent)}
                                    disabled={isWorking || !agent.isActive}
                                    className="py-1 px-2.5 text-xs shadow-xs"
                                  >
                                    Assign to My Team
                                  </Button>
                                )}

                                {agent.statusLabel === 'Assigned to your team' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    icon={<UserX className="w-3 h-3 text-amber-600" />}
                                    onClick={() => handleToggleMembership(agent, false)}
                                    disabled={isWorking}
                                    className="py-1 px-2.5 text-xs text-amber-700 hover:bg-amber-50 border-amber-300"
                                  >
                                    {isWorking ? 'Updating...' : 'Deactivate'}
                                  </Button>
                                )}

                                {agent.statusLabel === 'Deactivated in your team' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    icon={<UserCheck className="w-3 h-3 text-emerald-600" />}
                                    onClick={() => handleToggleMembership(agent, true)}
                                    disabled={isWorking}
                                    className="py-1 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                                  >
                                    {isWorking ? 'Updating...' : 'Activate'}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-edge bg-surface-subtle/50 flex justify-between items-center text-xs gap-3">
          {onboardingAgent ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => {
                  setOnboardingAgent(null);
                  setSelectedLeadIds([]);
                  setError(null);
                }}
                disabled={isSubmittingOnboarding}
              >
                Back to Roster
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={<UserCheck className="w-3.5 h-3.5" />}
                  onClick={handleConfirmOnboarding}
                  disabled={isSubmittingOnboarding}
                  className="shadow-xs"
                >
                  {isSubmittingOnboarding
                    ? 'Adding Agent...'
                    : selectedLeadIds.length > 0
                    ? `Add to Team & Assign ${selectedLeadIds.length} Lead${selectedLeadIds.length === 1 ? '' : 's'}`
                    : 'Confirm & Add to Team'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-content-muted">
                {agents.filter((a) => a.isAssignedToCurrentManager && a.isTeamActive).length} Active in Your Team •{' '}
                {agents.filter((a) => a.canAssign && !a.managerId).length} Available for Assignment
              </span>
              <Button size="sm" variant="outline" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
