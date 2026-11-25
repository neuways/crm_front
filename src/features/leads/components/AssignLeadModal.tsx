import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Compass,
  Building,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { IEnquiry, EligibleAgentSummary } from '../../../types/enquiry.types.js';
import { UserProfile } from '../../../types/auth.types.js';

export interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: IEnquiry[];
  currentUser: UserProfile;
  onSuccess: () => void;
  isReassignment?: boolean;
}

export const AssignLeadModal: React.FC<AssignLeadModalProps> = ({
  isOpen,
  onClose,
  selectedLeads,
  currentUser,
  onSuccess,
  isReassignment = false,
}) => {
  const [agents, setAgents] = useState<EligibleAgentSummary[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(true);
  const [assignmentMethod, setAssignmentMethod] = useState<'MANUAL' | 'ROUND_ROBIN'>('MANUAL');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRoster = useCallback(async () => {
    setIsLoadingAgents(true);
    setError(null);
    try {
      const res = await enquiryService.getTeamRoster();
      if (res.success && res.data) {
        let agentList = res.data.agents || [];
        // Role-based filtering:
        // Manager can only assign to active agents currently in their own team
        if (currentUser.role === 'MANAGER') {
          agentList = agentList.filter((a) => {
            const belongsToMgr =
              a.isAssignedToCurrentManager ||
              a.managerId === currentUser.id ||
              a.managerName === currentUser.name;
            return belongsToMgr && a.isTeamActive !== false;
          });
        }
        // Only active agents
        const activeOnly = agentList.filter((a) => a.isActive !== false);
        setAgents(activeOnly);
        if (activeOnly.length > 0 && !selectedAgentId) {
          setSelectedAgentId(activeOnly[0].id);
        }
      } else {
        setError(res.message || 'Failed to load eligible sales agents.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching sales agents.');
    } finally {
      setIsLoadingAgents(false);
    }
  }, [currentUser, selectedAgentId]);

  useEffect(() => {
    if (isOpen) {
      fetchRoster();
      setError(null);
      setSuccessMessage(null);
      if (currentUser.role === 'ADMIN') {
        setAssignmentMethod('MANUAL');
      } else {
        setAssignmentMethod('MANUAL');
      }
    }
  }, [isOpen, fetchRoster, currentUser.role]);

  if (!isOpen) return null;

  const leadCount = selectedLeads.length;
  const sampleLead = selectedLeads[0];
  const distinctProjects = Array.from(new Set(selectedLeads.map((l) => l.projectName).filter(Boolean)));

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadCount === 0) return;

    if (assignmentMethod === 'MANUAL' && !selectedAgentId) {
      setError('Please select an active Sales Agent.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const leadIds = selectedLeads.map((l) => l.id || (l as any)._id).filter(Boolean);

      const res = await enquiryService.bulkAssignLeads(leadIds, {
        assignedToId: assignmentMethod === 'MANUAL' ? selectedAgentId : undefined,
        method: assignmentMethod
      });

      if (res.success) {
        setSuccessMessage(res.message || `Successfully assigned ${leadCount} lead(s).`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setError(res.message || 'Failed to assign leads.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-surface-card border border-edge rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-edge bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary border border-brand-primary/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">
                {leadCount === 1
                  ? `${isReassignment ? 'Reassign' : 'Assign'} Lead: ${sampleLead?.name || 'Customer'}`
                  : isReassignment
                  ? `Reassign ${leadCount} Assigned Leads`
                  : `Assign ${leadCount} Unassigned Leads`}
              </h2>
              <p className="text-xs text-content-secondary mt-0.5">
                {currentUser.role === 'ADMIN'
                  ? 'Allocate to eligible sales agents or execute property-wise Round Robin.'
                  : `Assign leads to sales agents in ${currentUser.name}'s team.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-content-muted hover:text-content-primary rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Leads Overview */}
        <div className="p-4 bg-surface-subtle/40 border-b border-edge text-xs">
          <div className="flex items-center justify-between text-content-secondary mb-1.5 font-medium">
            <span>Selected Leads ({leadCount})</span>
            {distinctProjects.length > 0 && (
              <span className="flex items-center gap-1 text-brand-primary font-semibold">
                <Building className="w-3.5 h-3.5" />
                <span>{distinctProjects.slice(0, 2).join(', ')}{distinctProjects.length > 2 ? ` +${distinctProjects.length - 2}` : ''}</span>
              </span>
            )}
          </div>
          {leadCount === 1 ? (
            <div className="flex flex-wrap items-center gap-2 text-content-primary">
              <span className="font-bold">{sampleLead.name}</span>
              <span className="text-content-muted">&bull;</span>
              <span>{sampleLead.mobile}</span>
              {sampleLead.projectName && (
                <>
                  <span className="text-content-muted">&bull;</span>
                  <span className="text-brand-primary font-medium">{sampleLead.projectName}</span>
                </>
              )}
              {sampleLead.unassignedReason && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {sampleLead.unassignedReason}
                </span>
              )}
            </div>
          ) : (
            <div className="text-content-muted max-h-20 overflow-y-auto space-y-1">
              {selectedLeads.slice(0, 5).map((lead, idx) => (
                <div key={lead.id || idx} className="flex items-center justify-between">
                  <span className="font-medium text-content-primary truncate max-w-[200px]">{lead.name}</span>
                  <span className="text-content-secondary">{lead.projectName || 'No Project'}</span>
                </div>
              ))}
              {leadCount > 5 && (
                <div className="text-[11px] text-content-muted italic">...and {leadCount - 5} more leads</div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Assignment Method (Admin Only has Round Robin toggle option) */}
          {currentUser.role === 'ADMIN' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-content-primary">Assignment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentMethod('MANUAL')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                    assignmentMethod === 'MANUAL'
                      ? 'border-brand-primary bg-brand-primary/5 text-content-primary'
                      : 'border-edge hover:bg-surface-subtle text-content-secondary'
                  }`}
                >
                  <Users className="w-4 h-4 mt-0.5 text-brand-primary" />
                  <div>
                    <div className="text-xs font-bold">Designated Agent</div>
                    <div className="text-[11px] text-content-muted">Assign to a specific sales agent</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentMethod('ROUND_ROBIN')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                    assignmentMethod === 'ROUND_ROBIN'
                      ? 'border-brand-primary bg-brand-primary/5 text-content-primary'
                      : 'border-edge hover:bg-surface-subtle text-content-secondary'
                  }`}
                >
                  <Compass className="w-4 h-4 mt-0.5 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold">Round Robin</div>
                    <div className="text-[11px] text-content-muted">Property-wise sequential distribution</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Manual Sales Agent Selector */}
          {assignmentMethod === 'MANUAL' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-content-primary">
                  Select Active Sales Agent <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-content-muted">
                  {currentUser.role === 'MANAGER' ? 'My Team Agents Only' : 'All Active Agents'}
                </span>
              </div>

              {isLoadingAgents ? (
                <div className="py-6 text-center text-xs text-content-muted flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                  <span>Loading eligible agents...</span>
                </div>
              ) : agents.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  {currentUser.role === 'MANAGER'
                    ? 'No active sales agents found in your team. Please contact Admin.'
                    : 'No active sales agents found in the system.'}
                </div>
              ) : (
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-surface-card border border-edge rounded-xl text-content-primary focus:outline-none focus:border-brand-primary"
                  required
                >
                  <option value="" disabled>-- Select an Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role}){agent.managerName ? ` &bull; Team: ${agent.managerName}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {assignmentMethod === 'ROUND_ROBIN' && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <div className="leading-relaxed">
                Leads with mapped projects will automatically rotate sequentially through active mapped agents. Unmapped leads will be distributed among active general sales agents.
              </div>
            </div>
          )}

          {/* Manager Team Security Notice */}
          {currentUser.role === 'MANAGER' && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Team Scoped: You are assigning leads strictly to active sales agents within your team.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-edge">
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
              disabled={isSubmitting || (assignmentMethod === 'MANUAL' && (!selectedAgentId || agents.length === 0))}
              icon={isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Assigning...' : `Confirm Assignment (${leadCount})`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
