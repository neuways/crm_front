import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  PhoneCall,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Send,
  Activity,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Button } from '../../../components/ui/Button.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import { EmployeeWorkSummary } from '../../../types/enquiry.types.js';

export interface MyDailyActivityScorecardProps {
  refreshTrigger?: number;
}

export const MyDailyActivityScorecard: React.FC<MyDailyActivityScorecardProps> = ({
  refreshTrigger = 0,
}) => {
  const navigate = useNavigate();
  const [myStats, setMyStats] = useState<EmployeeWorkSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadMyStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await enquiryService.getTeamActivityReport({ period: 'today' });
      if (res.success && res.data?.employees?.[0]) {
        setMyStats(res.data.employees[0]);
      }
    } catch {
      // Fail quietly so dashboard remains usable even offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyStats();
  }, [loadMyStats, refreshTrigger]);

  const handleSubmitDailySummary = async () => {
    const resPrompt = await Swal.fire({
      title: "Submit Today's Work Summary",
      input: 'textarea',
      inputLabel: 'Optional remarks for your Manager & Admin',
      inputPlaceholder: 'Highlight key customer updates, pending callbacks, or support needed...',
      showCancelButton: true,
      confirmButtonText: 'Submit to Manager & Admin',
      confirmButtonColor: '#2563eb',
    });

    if (!resPrompt.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const res = await enquiryService.submitWorkReport({
        period: 'today',
        summaryNotes: resPrompt.value || '',
      });
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Daily Work Report Sent',
          text: 'Your supervisor and Admin have been notified.',
          timer: 2200,
          showConfirmButton: false,
        });
        loadMyStats();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: res.message || 'Submission failed.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !myStats) return null;

  const callsToday = myStats?.totalCallsLogged ?? 0;
  const connectedToday = myStats?.connectedCount ?? 0;
  const callbacksToday = myStats?.callbackRequestedCount ?? 0;
  const meetingsToday =
    (myStats?.meetingsScheduledCount ?? 0) +
    (myStats?.meetingsCompletedCount ?? 0) +
    (myStats?.meetingAgreedCount ?? 0);
  const visitsToday = myStats?.siteVisitsCompletedCount ?? 0;
  const dealsToday = myStats?.dealsClosedCount ?? 0;
  const overdueCount = myStats?.pendingOverdueCount ?? 0;

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/60 via-white to-emerald-50/40 border-blue-200/80">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-bold text-content-primary">
              My Today&apos;s Work Summary
            </h2>
            {myStats && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  myStats.activityStatus === 'ACTIVE_TODAY'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : myStats.activityStatus === 'LOW_ACTIVITY'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {myStats.activityStatus === 'ACTIVE_TODAY'
                  ? 'Active Today'
                  : myStats.activityStatus === 'LOW_ACTIVITY'
                  ? 'Low Activity'
                  : 'No Calls Logged Today'}
              </span>
            )}
          </div>
          <p className="text-xs text-content-muted">
            Every call attempt, callback, and milestone you log is automatically synced with your Manager and Admin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={() => navigate('/activities')}
          >
            My Activity Log
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Send className="w-3.5 h-3.5" />}
            onClick={handleSubmitDailySummary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Daily Summary'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 text-xs">
        <div
          role="button"
          tabIndex={0}
          aria-label="View today's logged calls in activity log"
          onClick={() => navigate('/activities?period=today')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activities?period=today');
            }
          }}
          className="group p-2.5 rounded-lg bg-white border border-edge flex items-center gap-2.5 cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all"
        >
          <PhoneCall className="w-4 h-4 text-brand-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-content-muted font-semibold uppercase">Calls Logged</div>
            <div className="text-base font-extrabold text-content-primary">{callsToday}</div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-content-subtle opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-primary transition-all shrink-0" />
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="View today's connected calls in activity log"
          onClick={() => navigate('/activities?period=today&outcome=CONNECTED')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activities?period=today&outcome=CONNECTED');
            }
          }}
          className="group p-2.5 rounded-lg bg-white border border-edge flex items-center gap-2.5 cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all"
        >
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-content-muted font-semibold uppercase">Connected</div>
            <div className="text-base font-extrabold text-blue-700">{connectedToday}</div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-content-subtle opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-primary transition-all shrink-0" />
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="View today's callback requests in activity log"
          onClick={() => navigate('/activities?period=today&outcome=CALL_BACK_REQUESTED')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activities?period=today&outcome=CALL_BACK_REQUESTED');
            }
          }}
          className="group p-2.5 rounded-lg bg-white border border-edge flex items-center gap-2.5 cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all"
        >
          <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-content-muted font-semibold uppercase">Callbacks Set</div>
            <div className="text-base font-extrabold text-amber-700">{callbacksToday}</div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-content-subtle opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-primary transition-all shrink-0" />
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="View leads in meetings and site visits stage"
          onClick={() => navigate('/leads?tab=active&stage=MEETING_PLAN')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/leads?tab=active&stage=MEETING_PLAN');
            }
          }}
          className="group p-2.5 rounded-lg bg-white border border-edge flex items-center justify-between gap-2 cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all"
        >
          <div className="min-w-0">
            <div className="text-[10px] text-content-muted font-semibold uppercase">Meetings / Visits</div>
            <div className="text-base font-extrabold text-purple-700">
              {meetingsToday} <span className="text-xs text-content-muted font-normal">/ {visitsToday}</span>
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-content-subtle opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-primary transition-all shrink-0" />
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="View completed deals"
          onClick={() => navigate('/completed-deals')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/completed-deals');
            }
          }}
          className="group p-2.5 rounded-lg bg-white border border-edge flex items-center justify-between gap-2 cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all"
        >
          <div className="min-w-0">
            <div className="text-[10px] text-content-muted font-semibold uppercase">Deals Closed</div>
            <div className="text-base font-extrabold text-emerald-700">{dealsToday}</div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-content-subtle opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-primary transition-all shrink-0" />
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="View overdue pending follow-up tasks"
          onClick={() => navigate('/follow-ups/pending')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/follow-ups/pending');
            }
          }}
          className="group p-2.5 rounded-lg bg-white border border-edge flex items-center gap-2.5 cursor-pointer hover:border-brand-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 transition-all"
        >
          <AlertTriangle className={`w-4 h-4 shrink-0 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-content-muted font-semibold uppercase">Overdue Tasks</div>
            <div className={`text-base font-extrabold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-600'}`}>
              {overdueCount}
            </div>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-content-subtle opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-primary transition-all shrink-0" />
        </div>
      </div>
    </Card>
  );
};
