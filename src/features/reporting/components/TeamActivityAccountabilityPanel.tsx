import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  PhoneCall,
  Users,
  Clock,
  AlertTriangle,
  ExternalLink,
  X,
  Send,
  Calendar,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card.js';
import { Button } from '../../../components/ui/Button.js';
import { LoadingState } from '../../../components/ui/LoadingState.js';
import { enquiryService } from '../../../services/enquiry.service.js';
import {
  EmployeeWorkSummary,
  ReportPeriod,
  TeamActivityReportSummary,
} from '../../../types/enquiry.types.js';
import { getFollowUpOutcomeMeta } from '../../../utils/followUpOutcome.js';

export interface TeamActivityAccountabilityPanelProps {
  viewerRole: 'ADMIN' | 'MANAGER';
  title?: string;
  subtitle?: string;
}

const PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

export const TeamActivityAccountabilityPanel: React.FC<TeamActivityAccountabilityPanelProps> = ({
  viewerRole,
  title = 'Team Work & Call Accountability',
  subtitle = 'Live per-employee call attempts, follow-up outcomes, pipeline conversions, and idle tracking',
}) => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [managerFilter, setManagerFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALES' | 'MANAGER'>('ALL');

  const [employees, setEmployees] = useState<EmployeeWorkSummary[]>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [summary, setSummary] = useState<TeamActivityReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Drawer state for viewing full log of an employee
  const [drawerEmployee, setDrawerEmployee] = useState<EmployeeWorkSummary | null>(null);
  const [drawerActivities, setDrawerActivities] = useState<any[]>([]);
  const [isLoadingDrawer, setIsLoadingDrawer] = useState<boolean>(false);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await enquiryService.getTeamActivityReport({
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
        managerId: viewerRole === 'ADMIN' && managerFilter !== 'ALL' ? managerFilter : undefined,
      });
      if (res.success && res.data) {
        setEmployees(res.data.employees || []);
        setManagers(res.data.managers || []);
        setSummary(res.data.summary || null);
      } else {
        setError(res.message || 'Unable to load accountability report.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading accountability report.');
    } finally {
      setIsLoading(false);
    }
  }, [period, startDate, endDate, managerFilter, viewerRole]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleOpenEmployeeLog = async (emp: EmployeeWorkSummary) => {
    setDrawerEmployee(emp);
    setDrawerActivities([]);
    setIsLoadingDrawer(true);
    try {
      const res = await enquiryService.getActivityFeed({
        employeeId: emp.employeeId,
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
        limit: 40,
      });
      if (res.success && res.data?.activities) {
        setDrawerActivities(res.data.activities);
      }
    } finally {
      setIsLoadingDrawer(false);
    }
  };

  const handleSubmitManagerDailyReport = async () => {
    const promptRes = await Swal.fire({
      title: 'Submit Daily Work Report to Admin',
      input: 'textarea',
      inputLabel: 'Optional remarks / blockers / highlights for Admin',
      inputPlaceholder: 'Summarize team progress, key meetings held, or escalations...',
      showCancelButton: true,
      confirmButtonText: 'Submit Report',
      confirmButtonColor: '#2563eb',
    });
    if (!promptRes.isConfirmed) return;

    setIsSubmittingReport(true);
    try {
      const res = await enquiryService.submitWorkReport({
        period: 'today',
        summaryNotes: promptRes.value || '',
      });
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Work Report Submitted',
          text: 'Your daily report has been sent to Admin and logged in timeline.',
          timer: 2200,
          showConfirmButton: false,
        });
        loadReport();
      } else {
        Swal.fire({ icon: 'error', title: 'Submission Failed', text: res.message || 'Error' });
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filteredEmployees =
    viewerRole === 'ADMIN' && roleFilter !== 'ALL'
      ? employees.filter((e) => e.role === roleFilter)
      : employees;

  const getActivityStatusBadge = (status: EmployeeWorkSummary['activityStatus']) => {
    if (status === 'ACTIVE_TODAY') {
      return {
        label: 'Active Today',
        cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotCls: 'bg-emerald-500',
      };
    }
    if (status === 'LOW_ACTIVITY') {
      return {
        label: 'Low Activity',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        dotCls: 'bg-amber-500',
      };
    }
    return {
      label: 'Inactive / No Updates Today',
      cls: 'bg-rose-50 text-rose-800 border-rose-200',
      dotCls: 'bg-rose-500',
    };
  };

  const formatLastActive = (dt: string | null) => {
    if (!dt) return 'No recorded activity';
    const d = new Date(dt);
    if (isNaN(d.getTime())) return 'No recorded activity';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const targetActivitiesRoute = viewerRole === 'MANAGER' ? '/manager/activities' : '/admin/activities';

  return (
    <>
      <Card noPadding>
        {/* Header & Controls */}
        <div className="p-5 sm:px-6 border-b border-edge flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-blue-50 text-brand-primary">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-content-primary">{title}</h2>
              {summary && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {summary.activeEmployeesCount} Active / {summary.inactiveEmployeesCount} Idle
                </span>
              )}
            </div>
            <p className="text-xs text-content-muted mt-0.5">{subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-edge">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriod(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    period === opt.value
                      ? 'bg-brand-primary text-white shadow-xs'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {viewerRole === 'MANAGER' && (
              <Button
                size="sm"
                variant="primary"
                icon={<Send className="w-3.5 h-3.5" />}
                onClick={handleSubmitManagerDailyReport}
                disabled={isSubmittingReport}
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Daily Report'}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={loadReport}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Sub-filters (Custom date + Admin Manager/Role filter) */}
        {(period === 'custom' || viewerRole === 'ADMIN') && (
          <div className="px-5 sm:px-6 py-3 bg-surface-subtle/60 border-b border-edge flex flex-wrap items-center gap-3 text-xs">
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-content-muted" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-edge rounded text-xs"
                />
                <span className="text-content-muted">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-edge rounded text-xs"
                />
              </div>
            )}

            {viewerRole === 'ADMIN' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-content-secondary">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="px-2.5 py-1 bg-white border border-edge rounded text-xs font-semibold"
                  >
                    <option value="ALL">All Managers &amp; Sales</option>
                    <option value="SALES">Sales Agents Only</option>
                    <option value="MANAGER">Managers Only</option>
                  </select>
                </div>

                {managers.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-content-secondary">Team / Manager:</span>
                    <select
                      value={managerFilter}
                      onChange={(e) => setManagerFilter(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-edge rounded text-xs font-semibold"
                    >
                      <option value="ALL">All Organization Teams</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}'s Team
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Quick Rollup KPIs */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 sm:px-6 bg-slate-50/50 border-b border-edge text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-edge">
              <span className="text-[10px] font-bold uppercase text-content-muted">Calls Logged</span>
              <div className="text-lg font-extrabold text-brand-primary mt-0.5">{summary.totalCallsLogged}</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-edge">
              <span className="text-[10px] font-bold uppercase text-content-muted">Connected</span>
              <div className="text-lg font-extrabold text-blue-700 mt-0.5">{summary.connectedCount}</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-edge">
              <span className="text-[10px] font-bold uppercase text-content-muted">Unanswered / Busy</span>
              <div className="text-lg font-extrabold text-orange-700 mt-0.5">{summary.unansweredCount}</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-edge">
              <span className="text-[10px] font-bold uppercase text-content-muted">Callbacks Set</span>
              <div className="text-lg font-extrabold text-amber-700 mt-0.5">{summary.callbackRequestedCount}</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-edge">
              <span className="text-[10px] font-bold uppercase text-content-muted">Deals Closed</span>
              <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
                {summary.dealsClosedCount}
              </div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-edge">
              <span className="text-[10px] font-bold uppercase text-content-muted">Overdue Tasks</span>
              <div className={`text-lg font-extrabold mt-0.5 ${summary.pendingOverdueCount > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {summary.pendingOverdueCount}
              </div>
            </div>
          </div>
        )}

        {/* Accountability Table */}
        {isLoading ? (
          <div className="p-6">
            <LoadingState message="Computing per-employee work & call metrics..." rows={3} />
          </div>
        ) : error ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">{error}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-xs text-content-muted">
            No matching employees found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-table-header border-b border-edge text-[10px] font-bold text-content-muted uppercase tracking-wider">
                  <th className="py-3 pl-6 pr-3 min-w-[180px]">Employee</th>
                  <th className="py-3 px-2.5 text-center">Calls</th>
                  <th className="py-3 px-2.5 text-center">Connected</th>
                  <th className="py-3 px-2.5 text-center">No Ans / Busy</th>
                  <th className="py-3 px-2.5 text-center">Switched Off</th>
                  <th className="py-3 px-2.5 text-center">Callbacks</th>
                  <th className="py-3 px-2.5 text-center">Meetings</th>
                  <th className="py-3 px-2.5 text-center">Site Visits</th>
                  <th className="py-3 px-2.5 text-center">Deals</th>
                  <th className="py-3 px-2.5 text-center">Overdue</th>
                  <th className="py-3 px-3 min-w-[175px]">Activity Status</th>
                  <th className="py-3 pl-2.5 pr-6 text-right">Audit Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {filteredEmployees.map((emp) => {
                  const statusBadge = getActivityStatusBadge(emp.activityStatus);
                  const totalMeetings = emp.meetingsScheduledCount + emp.meetingsCompletedCount + emp.meetingAgreedCount;
                  return (
                    <tr key={emp.employeeId} className="hover:bg-surface-table-hover transition-colors">
                      <td className="py-3 pl-6 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-content-primary">{emp.name}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                              emp.role === 'MANAGER'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                          >
                            {emp.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-content-muted mt-0.5">
                          {emp.managerName ? `Reports to ${emp.managerName}` : emp.role === 'MANAGER' ? 'Team Supervisor' : 'Direct Admin'}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-center font-extrabold text-brand-primary">
                        {emp.totalCallsLogged}
                      </td>
                      <td className="py-3 px-2.5 text-center font-semibold text-blue-700">
                        {emp.connectedCount}
                      </td>
                      <td className="py-3 px-2.5 text-center font-semibold text-orange-700">
                        {emp.noAnswerBusyCount}
                      </td>
                      <td className="py-3 px-2.5 text-center font-semibold text-rose-700">
                        {emp.switchedOffCount}
                      </td>
                      <td className="py-3 px-2.5 text-center font-semibold text-amber-700">
                        {emp.callbackRequestedCount}
                      </td>
                      <td className="py-3 px-2.5 text-center font-semibold text-purple-700">
                        {totalMeetings}
                      </td>
                      <td className="py-3 px-2.5 text-center font-semibold text-indigo-700">
                        {emp.siteVisitsCompletedCount}
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <span className="font-bold text-emerald-700">{emp.dealsClosedCount}</span>
                        {emp.totalDealValue > 0 && (
                          <div className="text-[10px] text-emerald-800 font-mono">
                            ₹{(emp.totalDealValue / 100000).toFixed(1)}L
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            emp.pendingOverdueCount > 0
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'text-slate-500'
                          }`}
                        >
                          {emp.pendingOverdueCount}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.cls}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotCls}`} />
                          <span>{statusBadge.label}</span>
                        </span>
                        <div className="text-[10px] text-content-muted mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatLastActive(emp.lastActiveAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 pl-2.5 pr-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEmployeeLog(emp)}
                          className="py-1 px-2.5 text-[11px]"
                        >
                          View Full Log
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-over Audit Log Drawer */}
      {drawerEmployee && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Activity log for ${drawerEmployee.name}`}
        >
          <div className="bg-surface-card w-full max-w-xl h-full flex flex-col shadow-2xl border-l border-edge animate-in slide-in-from-right duration-200">
            <div className="p-4 px-5 border-b border-edge flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span>{drawerEmployee.name}'s Activity Log</span>
                </h3>
                <p className="text-xs text-content-muted mt-0.5">
                  {drawerEmployee.role} • {drawerEmployee.totalCallsLogged} calls logged • {drawerEmployee.totalActivitiesCount} events
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const targetId = drawerEmployee.employeeId;
                    setDrawerEmployee(null);
                    navigate(`${targetActivitiesRoute}?employeeId=${targetId}&period=${period}`);
                  }}
                >
                  Open Full Page
                </Button>
                <button
                  type="button"
                  onClick={() => setDrawerEmployee(null)}
                  className="p-1 text-content-subtle hover:text-content-primary rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
              {isLoadingDrawer ? (
                <LoadingState message="Fetching chronological activity records..." rows={4} />
              ) : drawerActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-content-muted space-y-2">
                  <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto" />
                  <p>No activities recorded for {drawerEmployee.name} in this period.</p>
                </div>
              ) : (
                drawerActivities.map((act, idx) => {
                  const outcomeMeta = getFollowUpOutcomeMeta(act.outcome);
                  return (
                    <div
                      key={act.id || act._id || idx}
                      className="p-3.5 rounded-xl border border-edge bg-surface-subtle/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-primary border border-blue-200 text-[10px] font-bold uppercase">
                            {String(act.type || 'ACTIVITY').replace(/_/g, ' ')}
                          </span>
                          {outcomeMeta && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${outcomeMeta.badgeCls}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${outcomeMeta.dotCls}`} />
                              {outcomeMeta.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-content-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {act.createdAt ? new Date(act.createdAt).toLocaleString('en-IN') : 'N/A'}
                        </span>
                      </div>

                      <p className="text-content-primary leading-relaxed">{act.note}</p>

                      {act.enquiry && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-edge/60 text-[11px]">
                          <span className="text-content-muted">
                            Lead: <strong className="text-content-secondary">{act.enquiry.name}</strong>
                            {act.enquiry.projectName ? ` (${act.enquiry.projectName})` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerEmployee(null);
                              navigate(`/sales/leads/${act.enquiry.id}/workflow`);
                            }}
                            className="text-brand-primary font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <PhoneCall className="w-3 h-3" />
                            Open Lead
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
