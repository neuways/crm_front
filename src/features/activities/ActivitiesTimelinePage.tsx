import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowRight, RefreshCw, User, Clock, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { IEnquiry } from '../../types/enquiry.types.js';

export const ActivitiesTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<IEnquiry[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);

  // Load active leads
  const loadLeads = useCallback(async () => {
    try {
      setIsLoadingLeads(true);
      const res = await enquiryService.getEnquiries({ status: 'ACTIVE' });
      if (res.success && res.data?.enquiries) {
        setLeads(res.data.enquiries);
        if (res.data.enquiries.length > 0 && !selectedLeadId) {
          setSelectedLeadId(res.data.enquiries[0]._id || (res.data.enquiries[0] as any).id);
        }
      }
    } catch {
      // Graceful error state
    } finally {
      setIsLoadingLeads(false);
    }
  }, [selectedLeadId]);

  // Load activities for the selected lead
  const loadActivities = useCallback(async (enquiryId: string) => {
    if (!enquiryId) {
      setActivities([]);
      return;
    }
    try {
      setIsLoadingActivities(true);
      const res = await enquiryService.getActivities(enquiryId);
      if (res.success && res.data?.activities) {
        setActivities(res.data.activities);
      } else {
        setActivities([]);
      }
    } catch {
      // Graceful error state
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (selectedLeadId) {
      loadActivities(selectedLeadId);
    }
  }, [selectedLeadId, loadActivities]);

  const selectedLead = leads.find(l => (l._id || (l as any).id) === selectedLeadId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Activities</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Activities & Timeline
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Complete chronological audit trail of customer interactions, remarks, meetings, and workflow stage advances.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={() => {
            loadLeads();
            if (selectedLeadId) loadActivities(selectedLeadId);
          }}
          disabled={isLoadingLeads || isLoadingActivities}
        >
          Refresh
        </Button>
      </div>

      {/* Lead Selector Bar */}
      <div className="p-4 bg-surface-card border border-edge rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-brand-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-content-primary">Select Pipeline Lead:</span>
            <span className="text-[11px] text-content-muted">View dedicated interaction audit trail</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            disabled={isLoadingLeads || leads.length === 0}
            className="px-3 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary w-full sm:w-auto max-w-full truncate"
          >
            {leads.length === 0 && <option value="">No active leads available</option>}
            {leads.map((l) => {
              const id = l._id || (l as any).id;
              return (
                <option key={id} value={id}>
                  {l.name} ({l.projectName || 'General'}) — {l.currentStage}
                </option>
              );
            })}
          </select>

          {selectedLeadId && (
            <Button
              size="sm"
              variant="outline"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => navigate(`/sales/leads/${selectedLeadId}/workflow`)}
            >
              Open Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Selected Lead Overview Header */}
      {selectedLead && (
        <div className="px-5 py-3 bg-surface-subtle/50 border border-edge rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span>Customer: <strong className="text-content-primary">{selectedLead.name}</strong></span>
            <span>Mobile: <strong className="text-content-primary">{selectedLead.mobile}</strong></span>
            <span>Stage: <span className="font-semibold text-brand-primary">{selectedLead.currentStage}</span></span>
          </div>
          <span className="text-content-muted">
            {activities.length} Recorded Event{activities.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-surface-card border border-edge rounded-xl shadow-xs p-6">
        {isLoadingActivities ? (
          <div className="py-12 text-center text-content-muted text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
            <span>Loading interaction history from MongoDB Atlas...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-content-muted text-xs flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <span>No historical interactions recorded yet for this lead.</span>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act, idx) => (
              <div key={act._id || act.id || idx} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-white" />

                {/* Activity Card */}
                <div className="p-4 bg-surface-subtle border border-edge rounded-xl text-xs space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-content-primary text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-brand-primary border border-blue-200">
                      {act.type ? act.type.replace(/_/g, ' ') : 'ACTIVITY'}
                    </span>
                    <span className="text-content-muted flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {act.createdAt ? new Date(act.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  <p className="text-content-secondary leading-relaxed">
                    {act.note || act.details?.remarks || 'Recorded workflow activity event.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-content-muted border-t border-edge/60">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Recorded by: <strong className="text-content-secondary">{act.performedByName || act.createdByName || 'Sales Agent'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
