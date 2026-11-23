import React, { useState, useEffect } from 'react';
import { X, UserCheck, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { TeamMemberPerformance } from '../../../types/enquiry.types.js';
import { maskPhoneNumber } from '../../../utils/phone.js';

export interface EligibleLeadItem {
  id: string;
  name: string;
  mobile?: string;
  projectName?: string;
  currentStage?: string;
  assignedTo?: { id: string; name: string; role?: string } | null;
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

export const ReassignLeadModal: React.FC<ReassignLeadModalProps> = ({
  isOpen,
  onClose,
  targetAgent,
  lead,
  currentManagerId,
  teamMembers,
  onSuccess,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [eligibleLeads, setEligibleLeads] = useState<EligibleLeadItem[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize target agent when modal opens or targetAgent changes
  useEffect(() => {
    if (targetAgent?.id) {
      setSelectedAgentId(targetAgent.id);
    } else if (teamMembers.length > 0 && !selectedAgentId) {
      const firstActive = teamMembers.find((m) => m.isActive);
      if (firstActive) {
        setSelectedAgentId(firstActive.id);
      }
    }
  }, [targetAgent, teamMembers, isOpen]);

  // Synchronize pre-selected lead if provided
  useEffect(() => {
    if (lead?.id) {
      setSelectedLeadId(lead.id);
      setEligibleLeads([lead]);
    }
  }, [lead]);

  // Fetch eligible leads currently assigned to the authenticated manager
  useEffect(() => {
    if (!isOpen || lead?.id) return;

    let isCancelled = false;
    const fetchEligibleLeads = async () => {
      setIsLoadingLeads(true);
      setError(null);
      try {
        const res = await enquiryService.getEnquiries({
          assignedTo: currentManagerId || 'me',
          status: 'ACTIVE',
          excludeCompletedDeals: true,
          limit: 100,
        });

        if (!isCancelled) {
          if (res.success && res.data?.enquiries) {
            const leads: EligibleLeadItem[] = res.data.enquiries.map((e: any) => ({
              id: e._id || e.id,
              name: e.name,
              mobile: e.mobile || e.normalizedMobile,
              projectName: e.projectName,
              currentStage: e.currentStage || 'FOLLOW_UP',
              assignedTo: e.assignedTo,
            }));
            setEligibleLeads(leads);
            if (leads.length > 0) {
              setSelectedLeadId(leads[0].id);
            } else {
              setSelectedLeadId('');
            }
          } else {
            setEligibleLeads([]);
            setSelectedLeadId('');
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve eligible leads.');
          setEligibleLeads([]);
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
  }, [isOpen, currentManagerId, lead]);

  if (!isOpen) return null;

  const activeTeamMembers = teamMembers.filter((m) => m.isActive);
  const activeTargetAgent = activeTeamMembers.find((m) => m.id === selectedAgentId) || targetAgent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Please select a target sales agent from your team.');
      return;
    }
    if (!selectedLeadId) {
      setError('Please select a lead to reassign.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await enquiryService.assignLead(selectedLeadId, selectedAgentId);
      if (res.success) {
        // Remove assigned lead from local eligible queue immediately
        setEligibleLeads((prev) => prev.filter((l) => l.id !== selectedLeadId));
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to reassign lead. Please try again.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reassigning lead.'
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
      <div className="bg-surface-card border border-edge rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                Reassign Lead to {activeTargetAgent?.name || 'Sales Agent'}
              </h2>
              <p className="text-xs text-content-muted">
                Transfer lead ownership to an active sales agent in your team
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              Only active sales agents reporting to your team are eligible for lead reassignment.
            </p>
          </div>

          {/* Eligible Leads Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Select Lead to Reassign {eligibleLeads.length > 0 && `(${eligibleLeads.length} Available)`}
              </span>
              <span className="text-[11px] text-content-muted">
                Active leads currently assigned to you
              </span>
            </div>

            {isLoadingLeads ? (
              <LoadingState message="Loading your eligible leads..." rows={3} />
            ) : eligibleLeads.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-edge bg-surface-subtle/50 text-center space-y-2">
                <EmptyState
                  title="No Eligible Leads Available"
                  description="You currently have no active leads assigned to yourself to transfer to your team members."
                />
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {eligibleLeads.map((leadItem) => {
                  const isSelected = selectedLeadId === leadItem.id;
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
                          type="radio"
                          name="selectedLeadForReassign"
                          value={leadItem.id}
                          checked={isSelected}
                          onChange={() => setSelectedLeadId(leadItem.id)}
                          className="mt-1 text-brand-primary focus:ring-brand-primary"
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
                                {leadItem.currentStage || 'FOLLOW_UP'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Current:{' '}
                              <strong className="text-emerald-700">
                                Assigned to You
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
              Reassignment automatically logs an activity event in the lead's history and delivers an immediate in-app notification to the newly assigned agent.
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
                !selectedLeadId ||
                eligibleLeads.length === 0
              }
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
