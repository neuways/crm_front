import React from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { FutureFollowUpTable } from '../sales-dashboard/components/FollowUpSummaryTable.js';
import { useSalesDashboard } from '../sales-dashboard/hooks/useSalesDashboard.js';

export const FutureFollowUpsPage: React.FC = () => {
  const {
    futureFollowUps,
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
            <span>Future</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Future Follow-ups
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Stage-wise matrix of follow-up activities, client meetings, and property site visits scheduled from tomorrow onwards.
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

      {/* Stage-wise Future Activity Matrix */}
      <FutureFollowUpTable data={futureFollowUps} />

      {/* Informational Guidance Card */}
      <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
        <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Automated Daily Progression:</span>
          <p className="text-blue-800">
            Activities scheduled for future dates automatically migrate into your Pending Follow-ups summary as their scheduled date arrives. Actions scheduled today or overdue are tracked exclusively under Pending Follow-ups.
          </p>
        </div>
      </div>
    </div>
  );
};
