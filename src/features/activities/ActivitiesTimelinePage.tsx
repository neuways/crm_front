import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  RefreshCw,
  User,
  Clock,
  FileText,
  Filter,
  Search,
  RotateCcw,
  PhoneCall,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { useAuth } from '../../context/AuthContext.js';
import { IEnquiry, ReportPeriod } from '../../types/enquiry.types.js';
import {
  FOLLOW_UP_OUTCOME_META,
  getFollowUpOutcomeMeta,
} from '../../utils/followUpOutcome.js';

const PERIOD_CHOICES: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Date' },
  { value: 'all', label: 'All Time' },
];

const ACTIVITY_TYPE_CHOICES = [
  { value: 'ALL', label: 'All Activity Types' },
  { value: 'CALL_ATTEMPT', label: 'Quick Call Attempts' },
  { value: 'REMARK_ADDED', label: 'Discussions & Remarks' },
  { value: 'WORK_REPORT_SUBMITTED', label: 'Daily Work Reports' },
  { value: 'MEETING_PLANNED', label: 'Meetings Planned' },
  { value: 'MEETING_COMPLETED', label: 'Meetings Completed' },
  { value: 'SITE_VISIT_COMPLETED', label: 'Site Visits Completed' },
  { value: 'DEAL_COMPLETED', label: 'Deals Finalized' },
  { value: 'ASSIGNMENT_CHANGED', label: 'Lead Assignments' },
  { value: 'LEAD_REJECTED', label: 'Rejected Leads' },
  { value: 'DEAL_LOST', label: 'Deals Lost' },
];

export const ActivitiesTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { leadId: routeLeadId } = useParams<{ leadId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [leads, setLeads] = useState<IEnquiry[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [period, setPeriod] = useState<ReportPeriod>(
    (searchParams.get('period') as ReportPeriod) || '7d'
  );
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [employeeFilter, setEmployeeFilter] = useState<string>(
    searchParams.get('employeeId') || 'ALL'
  );
  const [outcomeFilter, setOutcomeFilter] = useState<string>(
    searchParams.get('outcome') || 'ALL'
  );
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('ALL');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(routeLeadId || 'ALL');
  const [searchText, setSearchText] = useState<string>('');

  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);

  const loadLeads = useCallback(async () => {
    try {
      setIsLoadingLeads(true);
      const res = await enquiryService.getEnquiries({ limit: 100 });
      if (res.success && res.data?.enquiries) {
        setLeads(res.data.enquiries);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoadingLeads(false);
    }
  }, []);

  const loadActivityFeed = useCallback(async () => {
    setIsLoadingActivities(true);
    try {
      const res = await enquiryService.getActivityFeed({
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
        employeeId: employeeFilter !== 'ALL' ? employeeFilter : undefined,
        outcome: outcomeFilter !== 'ALL' ? outcomeFilter : undefined,
        activityType: activityTypeFilter !== 'ALL' ? activityTypeFilter : undefined,
        enquiryId: selectedLeadId !== 'ALL' ? selectedLeadId : undefined,
        search: searchText.trim() || undefined,
        page,
        limit: 30,
      });

      if (res.success && res.data) {
        setActivities(res.data.activities || []);
        setEmployees(res.data.employees || []);
        setTotalCount(res.data.pagination?.total ?? (res.data.activities || []).length);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } else {
        setActivities([]);
      }
    } catch {
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [
    period,
    startDate,
    endDate,
    employeeFilter,
    outcomeFilter,
    activityTypeFilter,
    selectedLeadId,
    searchText,
    page,
  ]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadActivityFeed();
  }, [loadActivityFeed]);

  const handleResetFilters = () => {
    setPeriod('7d');
    setEmployeeFilter('ALL');
    setOutcomeFilter('ALL');
    setActivityTypeFilter('ALL');
    setSelectedLeadId(routeLeadId || 'ALL');
    setSearchText('');
    setPage(1);
    setSearchParams({});
  };

  const selectedLead =
    selectedLeadId !== 'ALL'
      ? leads.find((l) => (l._id || (l as any).id) === selectedLeadId)
      : undefined;

  const formatDuration = (secs?: number) => {
    if (typeof secs !== 'number' || secs <= 0) return null;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Activities &amp; Accountability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Activities &amp; Call Audit Timeline
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            {user?.role === 'ADMIN'
              ? 'Organization-wide live feed of all Sales Agent and Manager call attempts, follow-up outcomes, meetings, deals, and daily work reports.'
              : user?.role === 'MANAGER'
              ? 'Live activity audit trail across your Sales Team and your own follow-ups, call attempts, and milestones.'
              : 'Complete chronological log of your logged calls, callbacks, follow-up remarks, and daily summaries.'}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoadingActivities ? 'animate-spin' : ''}`} />}
          onClick={() => {
            loadLeads();
            loadActivityFeed();
          }}
          disabled={isLoadingLeads || isLoadingActivities}
        >
          Refresh
        </Button>
      </div>

      {/* Filters Panel */}
      <div className="p-4 bg-surface-card border border-edge rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-content-primary">
            <Filter className="w-4 h-4 text-brand-primary" />
            <span>Filter Live Activity Stream</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-blue-200">
              {totalCount} Event{totalCount === 1 ? '' : 's'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-content-muted hover:text-brand-primary inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Date Period */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-content-muted mb-1">
              Date Window
            </label>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as ReportPeriod);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary"
            >
              {PERIOD_CHOICES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-content-muted mb-1">
              Employee (Sales / Manager)
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary"
            >
              <option value="ALL">
                {user?.role === 'SALES' ? 'My Activities' : 'All Visible Staff'}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-content-muted mb-1">
              Call / Follow-Up Outcome
            </label>
            <select
              value={outcomeFilter}
              onChange={(e) => {
                setOutcomeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary"
            >
              <option value="ALL">All Outcomes</option>
              {Object.values(FOLLOW_UP_OUTCOME_META).map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-content-muted mb-1">
              Event Type
            </label>
            <select
              value={activityTypeFilter}
              onChange={(e) => {
                setActivityTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary"
            >
              {ACTIVITY_TYPE_CHOICES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pipeline Lead Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-content-muted mb-1">
              Pipeline Lead
            </label>
            <select
              value={selectedLeadId}
              onChange={(e) => {
                setSelectedLeadId(e.target.value);
                setPage(1);
              }}
              disabled={isLoadingLeads}
              className="w-full px-2.5 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs font-semibold text-content-primary truncate"
            >
              <option value="ALL">All Leads</option>
              {leads.map((l) => {
                const id = l._id || (l as any).id;
                return (
                  <option key={id} value={id}>
                    {l.name} ({l.projectName || 'General'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Custom dates & keyword search */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {period === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-edge rounded-lg text-xs"
              />
              <span className="text-content-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-edge rounded-lg text-xs"
              />
            </div>
          )}

          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Search notes, remarks, or employee name..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface-subtle border border-edge rounded-lg text-xs text-content-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          {selectedLead && (
            <Button
              size="sm"
              variant="outline"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => navigate(`/sales/leads/${selectedLead._id || (selectedLead as any).id}/workflow`)}
            >
              Open {selectedLead.name} Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-surface-card border border-edge rounded-xl shadow-xs p-6">
        {isLoadingActivities ? (
          <div className="py-12 text-center text-content-muted text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
            <span>Loading chronological activity log...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-content-muted text-xs flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <span>No activities match the selected filters.</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activities.map((act, idx) => {
                const outcomeMeta = getFollowUpOutcomeMeta(act.outcome);
                const durationLabel = formatDuration(
                  act.callDurationSeconds ?? act.metadata?.callDurationSeconds
                );
                const roleLabel = act.actorRole || act.metadata?.actorRole;
                return (
                  <div key={act._id || act.id || idx} className="relative group">
                    <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-brand-primary ring-4 ring-white" />

                    <div className="p-4 bg-surface-subtle border border-edge rounded-xl text-xs space-y-2 hover:border-slate-300 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-brand-primary border border-blue-200">
                            {act.type ? String(act.type).replace(/_/g, ' ') : 'ACTIVITY'}
                          </span>
                          {outcomeMeta && (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${outcomeMeta.badgeCls}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${outcomeMeta.dotCls}`} />
                              <span>{outcomeMeta.label}</span>
                            </span>
                          )}
                          {durationLabel && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                              <PhoneCall className="w-3 h-3" />
                              {durationLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-content-muted flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          {act.createdAt ? new Date(act.createdAt).toLocaleString('en-IN') : 'N/A'}
                        </span>
                      </div>

                      <p className="text-content-secondary leading-relaxed">
                        {act.note || act.details?.remarks || 'Recorded workflow activity event.'}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5 text-[11px] text-content-muted border-t border-edge/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            Recorded by:{' '}
                            <strong className="text-content-secondary">
                              {act.performedByName || act.createdByName || 'Employee'}
                            </strong>
                          </span>
                          {roleLabel && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                                roleLabel === 'ADMIN'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : roleLabel === 'MANAGER'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}
                            >
                              {roleLabel}
                            </span>
                          )}
                        </div>

                        {act.enquiry && (
                          <button
                            type="button"
                            onClick={() => navigate(`/sales/leads/${act.enquiry.id}/workflow`)}
                            className="inline-flex items-center gap-1 text-brand-primary font-semibold hover:underline cursor-pointer"
                          >
                            <span>
                              Lead: {act.enquiry.name}
                              {act.enquiry.projectName ? ` (${act.enquiry.projectName})` : ''}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-edge text-xs text-content-muted">
                <span>
                  Page {page} of {totalPages} ({totalCount} total events)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
