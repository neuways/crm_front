import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  UserX
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { EligibleAgentSummary } from '../../../types/enquiry.types.js';

export interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignAgentModal: React.FC<AssignAgentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [agents, setAgents] = useState<EligibleAgentSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (isOpen) {
      fetchRoster();
      setSearchTerm('');
      setSuccessMessage(null);
      setError(null);
    }
  }, [isOpen, fetchRoster]);

  if (!isOpen) return null;

  const handleAssign = async (agent: EligibleAgentSummary) => {
    setActionLoadingId(agent.id);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await enquiryService.assignAgentToTeam(agent.id);
      if (res.success) {
        setSuccessMessage(`Successfully assigned ${agent.name} to your sales team.`);
        await fetchRoster();
        onSuccess();
      } else {
        setError(res.message || 'Failed to assign agent to team.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error assigning agent.');
    } finally {
      setActionLoadingId(null);
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
                Sales Team Membership &amp; Assignment
              </h3>
              <p className="text-xs text-content-muted">
                View eligible sales agents, assign available agents, or manage team membership.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices & Banners */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900">
            <ShieldAlert className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Team Assignment Rules: </span>
              Assign eligible, unassigned Sales Agents to your team and manage team membership status. Transfers between Managers are strictly controlled by Administrators.
            </div>
          </div>

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
              onClick={fetchRoster}
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
                          {/* Name & Email */}
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

                          {/* Current Team Membership */}
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

                          {/* Membership Status */}
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

                          {/* Action Button */}
                          <td className="py-3 pl-2 pr-4 text-right">
                            {agent.statusLabel === 'Available' && (
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<UserPlus className="w-3 h-3" />}
                                onClick={() => handleAssign(agent)}
                                disabled={isWorking || !agent.isActive}
                                className="py-1 px-2.5 text-xs shadow-xs"
                              >
                                {isWorking ? 'Assigning...' : 'Assign to My Team'}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-edge bg-surface-subtle/50 flex justify-between items-center text-xs">
          <span className="text-content-muted">
            {agents.filter((a) => a.isAssignedToCurrentManager && a.isTeamActive).length} Active in Your Team •{' '}
            {agents.filter((a) => a.canAssign && !a.managerId).length} Available for Assignment
          </span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
