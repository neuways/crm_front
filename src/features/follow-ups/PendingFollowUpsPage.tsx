import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { PendingFollowUpTable } from '../sales-dashboard/components/FollowUpSummaryTable.js';
import { useSalesDashboard } from '../sales-dashboard/hooks/useSalesDashboard.js';

export const PendingFollowUpsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pendingFollowUps,
    newLeads,
    taskStatusCounts,
    isLoadingLeads,
    refreshLeads
  } = useSalesDashboard();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Follow-ups</span>
            <span className="text-slate-300">/</span>
            <span>Pending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Pending Follow-ups
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Stage-wise breakdown of incomplete customer contact, client meetings, and property site visits due today or overdue.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={refreshLeads}
          disabled={isLoadingLeads}
        >
          Refresh
        </Button>
      </div>

      {/* REQ-22: Task Status Tracking Breakdown */}
      {taskStatusCounts && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wider">Pending</span>
            <span className="text-xl font-extrabold text-amber-900 mt-0.5 block">{taskStatusCounts.pending}</span>
          </div>
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-blue-700 block uppercase tracking-wider">In Progress</span>
            <span className="text-xl font-extrabold text-blue-900 mt-0.5 block">{taskStatusCounts.inProgress}</span>
          </div>
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">Completed</span>
            <span className="text-xl font-extrabold text-emerald-900 mt-0.5 block">{taskStatusCounts.completed}</span>
          </div>
          <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-rose-700 block uppercase tracking-wider">Cancelled</span>
            <span className="text-xl font-extrabold text-rose-900 mt-0.5 block">{taskStatusCounts.cancelled}</span>
          </div>
          <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-purple-700 block uppercase tracking-wider">Rescheduled</span>
            <span className="text-xl font-extrabold text-purple-900 mt-0.5 block">{taskStatusCounts.rescheduled}</span>
          </div>
        </div>
      )}

      {/* Stage-wise Pending Activity Matrix */}
      <PendingFollowUpTable data={pendingFollowUps} />

      {/* Actionable Pending Leads List */}
      <div className="bg-surface-card border border-edge rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-edge flex items-center justify-between bg-surface-subtle/30">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-bold text-content-primary">
              Active Pipeline Leads Requiring Action
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-blue-200">
            {newLeads.length} Total
          </span>
        </div>

        {newLeads.length === 0 ? (
          <div className="py-12 text-center text-content-muted text-xs flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <span>No pending leads in your pipeline.</span>
          </div>
        ) : (
          <div className="divide-y divide-edge">
            {newLeads.map((lead) => (
              <div
                key={lead.id}
                className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/40 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-content-primary truncate">
                      {lead.name}
                    </span>
                    {lead.isDoNotContact && (
                      <span
                        data-testid="lead-dnc-badge"
                        className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200"
                        title="Do Not Contact Restricted"
                      >
                        DNC
                      </span>
                    )}
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-content-secondary border border-slate-200">
                      {lead.currentStage}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted mt-1">
                    <span>Project: <strong className="text-content-secondary">{lead.projectName || 'General'}</strong></span>
                    <span>Budget / Price: <strong className="text-content-secondary">{lead.price}</strong></span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<ArrowRight className="h-3.5 w-3.5" />}
                  onClick={() => navigate(`/sales/leads/${lead.id}/workflow`)}
                  className="self-start sm:self-auto shrink-0"
                >
                  Continue Workflow
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
