import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.js';
import {
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  UserCheck,
  ArrowRight,
  Layers,
  UserPlus,
  UserX,
} from 'lucide-react';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { StatusBadge } from '../../components/ui/StatusBadge.js';
import { MetricCard } from '../../components/ui/MetricCard.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { enquiryService } from '../../services/enquiry.service.js';
import { TeamMemberPerformance } from '../../types/enquiry.types.js';
import { ReassignLeadModal } from './components/ReassignLeadModal.js';
import { AssignAgentModal } from './components/AssignAgentModal.js';

export const ManagerTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamMemberPerformance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Team Assignment & Membership State
  const [isAssignAgentModalOpen, setIsAssignAgentModalOpen] = useState<boolean>(false);

  // Reassignment Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState<boolean>(false);
  const [targetAgentForReassignment, setTargetAgentForReassignment] = useState<TeamMemberPerformance | null>(null);

  // Retrieve authenticated manager ID (AuthContext preferred, localStorage fallback)
  const authContext = useContext(AuthContext);
  const currentManagerId = (() => {
    if (authContext?.user?.id) return authContext.user.id;
    try {
      const stored = localStorage.getItem('nueways_user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.id || 'me';
      }
    } catch {
      // Fallback
    }
    return 'me';
  })();

  const fetchTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await enquiryService.getTeamPerformance();
      const payload = res.data || ((res as any)?.team ? (res as any) : null);
      if (res.success && payload) {
        setTeam(payload.team || []);
      } else {
        setError(res.message || 'Failed to retrieve sales team performance metrics.');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected network error occurred while querying team performance.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Deactivate team membership for an agent directly from roster table
  const handleDeactivateMembership = async (agent: TeamMemberPerformance) => {
    if (
      !window.confirm(
        `Deactivate team membership for ${agent.name}? Their records and leads will be immediately removed from your team views.`
      )
    ) {
      return;
    }
    try {
      const res = await enquiryService.updateTeamMemberStatus(agent.id, false);
      if (res.success) {
        fetchTeamData();
      } else {
        setError(res.message || 'Failed to deactivate team membership.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating team membership.');
    }
  };

  // Handle clicking "Reassign" for a specific agent: opens modal to reassign a manager's lead to this agent
  const handleOpenReassignModal = (agent: TeamMemberPerformance) => {
    setTargetAgentForReassignment(agent);
    setIsReassignModalOpen(true);
  };

  // Rollup Aggregations across Manager's Team
  const totalAgents = team.length;
  const activeAgents = team.filter((a) => a.isActive).length;
  const totalActiveLeads = team.reduce((acc, curr) => acc + (curr.activeLeadsCount || 0), 0);
  const totalPendingFollowUps = team.reduce((acc, curr) => acc + (curr.pendingFollowUpsCount || 0), 0);
  const totalFutureFollowUps = team.reduce((acc, curr) => acc + (curr.futureFollowUpsCount || 0), 0);
  const totalCompletedDeals = team.reduce((acc, curr) => acc + (curr.completedDealsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* -----------------------------------------------------------------
       * Page Header
       * ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Sales Team</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Sales Team Performance
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Monitor agent workload, active pipelines, pending follow-ups, and conversion metrics across your direct sales team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchTeamData}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<UserPlus className="h-4 w-4 text-brand-primary" />}
            onClick={() => setIsAssignAgentModalOpen(true)}
            className="border-blue-200 text-brand-primary hover:bg-blue-50"
          >
            Assign Sales Agent
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<UserCheck className="h-4 w-4 text-emerald-600" />}
            onClick={() => navigate('/manager/leads?tab=unassigned')}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            Assign Leads
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Filter className="h-4 w-4" />}
            onClick={() => navigate('/manager/leads')}
            className="shadow-sm shadow-blue-500/20"
          >
            View Team Leads
          </Button>
        </div>
      </div>

      {/* -----------------------------------------------------------------
       * Read-only Scope Notice Banner (Preserves Admin privileges)
       * ----------------------------------------------------------------- */}
      

      {/* -----------------------------------------------------------------
       * Top KPI Summary Cards
       * ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Sales Agents"
          subtitle="Team Strength"
          value={totalAgents}
          badgeText={`${activeAgents} Active`}
          badgeType={activeAgents > 0 ? 'positive' : 'neutral'}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-brand-primary"
          isMockData={false}
        />
        <MetricCard
          title="Active Leads"
          subtitle="Pipeline Portfolio"
          value={totalActiveLeads}
          badgeText="In Progress"
          badgeType="info"
          icon={<Layers className="w-5 h-5" />}
          iconBgColor="bg-purple-50 text-purple-600"
          isMockData={false}
        />
        <MetricCard
          title="Pending Follow-ups"
          subtitle="Team Backlog"
          value={totalPendingFollowUps}
          badgeText={totalPendingFollowUps > 0 ? '• Action Due' : `${totalFutureFollowUps} Scheduled`}
          badgeType={totalPendingFollowUps > 0 ? 'warning' : 'positive'}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
          isMockData={false}
        />
        <MetricCard
          title="Completed Deals"
          subtitle="Team Wins"
          value={totalCompletedDeals}
          badgeText="Finalized"
          badgeType="positive"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          isMockData={false}
        />
      </div>

      {/* -----------------------------------------------------------------
       * Team Roster & Performance Table
       * ----------------------------------------------------------------- */}
      {isLoading ? (
        <LoadingState message="Loading sales team performance metrics..." rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTeamData} />
      ) : team.length === 0 ? (
        <div className="p-10 border border-edge rounded-2xl bg-surface-card text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-brand-primary mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-content-primary">No Sales Agents in Team</h3>
            <p className="text-xs text-content-muted mt-1 leading-relaxed">
              There are currently no active sales agents assigned to your management team. You can view eligible sales agents and assign available agents to your team below.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAssignAgentModalOpen(true)}
            className="shadow-sm shadow-blue-500/20"
          >
            Assign Sales Agent
          </Button>
        </div>
      ) : (
        <Card noPadding>
          <div className="p-5 sm:px-6 flex items-center justify-between border-b border-edge">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-primary shrink-0" aria-hidden="true" />
              <h2 className="text-base sm:text-lg font-bold text-content-primary">
                Sales Agents Roster
              </h2>
              <StatusBadge
                label={`${team.length} Team Member${team.length === 1 ? '' : 's'}`}
                variant="primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-surface-table-header border-b border-edge text-[11px] font-bold text-content-muted uppercase tracking-wider">
                  <th scope="col" className="py-3.5 pl-6 pr-3 min-w-[200px]">
                    Sales Agent
                  </th>
                  <th scope="col" className="py-3.5 px-3 min-w-[110px]">
                    Membership Status
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center min-w-[100px]">
                    Active Leads
                  </th>
                  <th scope="col" className="py-3.5 px-4 min-w-[180px]">
                    Stage Workload
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center min-w-[120px]">
                    Pending / Future
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-center min-w-[130px]">
                    Outcomes (Deals / Lost)
                  </th>
                  <th scope="col" className="py-3.5 pl-3 pr-6 text-right min-w-[140px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-subtle">
                {team.map((agent) => {
                  const names = agent.name.split(' ');
                  const initials = (names[0]?.[0] || 'S') + (names[1]?.[0] || '');

                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-surface-table-hover transition-colors duration-100"
                    >
                      {/* 1. Agent Name & Email */}
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {initials.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-content-primary block truncate">
                              {agent.name}
                            </span>
                            <span className="text-[11px] text-content-muted block truncate font-mono">
                              {agent.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Membership Status Badge */}
                      <td className="py-4 px-3">
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active in Team
                        </span>
                      </td>

                      {/* 3. Active Leads Count */}
                      <td className="py-4 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-brand-primary border border-blue-100">
                          {agent.activeLeadsCount}
                        </span>
                      </td>

                      {/* 4. Stage Workload (Follow-up, Meeting, Site Visit) */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Follow-up:
                            </span>
                            <span className="font-semibold">{agent.stageWorkload?.followUp ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              Meeting:
                            </span>
                            <span className="font-semibold">{agent.stageWorkload?.meetingPlan ?? 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Site Visit:
                            </span>
                            <span className="font-semibold">{agent.stageWorkload?.siteVisitPlan ?? 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Pending / Future Follow-ups */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex flex-col items-center gap-1 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              agent.pendingFollowUpsCount > 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {agent.pendingFollowUpsCount} Pending
                          </span>
                          <span className="text-slate-500">
                            {agent.futureFollowUpsCount} Future
                          </span>
                        </div>
                      </td>

                      {/* 6. Completed Deals / Rejected */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3" />
                            {agent.completedDealsCount}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">
                            <XCircle className="w-3 h-3" />
                            {agent.rejectedCount}
                          </span>
                        </div>
                      </td>

                      {/* 7. Action Controls */}
                      <td className="py-4 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReassignModal(agent)}
                            className="py-1 px-2 text-xs text-brand-primary hover:bg-blue-50 border-blue-200"
                            title="Reassign a lead to this agent"
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Reassign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateMembership(agent)}
                            className="py-1 px-2 text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                            title="Deactivate team membership"
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            Deactivate
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate('/manager/leads')}
                            className="py-1 px-2 text-xs"
                            title="View leads"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* -----------------------------------------------------------------
       * Assign Sales Agent Modal Dialog
       * ----------------------------------------------------------------- */}
      <AssignAgentModal
        isOpen={isAssignAgentModalOpen}
        onClose={() => setIsAssignAgentModalOpen(false)}
        currentManagerId={currentManagerId}
        onSuccess={() => {
          fetchTeamData();
        }}
      />

      {/* -----------------------------------------------------------------
       * Reassign Lead Modal Dialog
       * ----------------------------------------------------------------- */}
      <ReassignLeadModal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setTargetAgentForReassignment(null);
        }}
        targetAgent={targetAgentForReassignment}
        currentManagerId={currentManagerId}
        teamMembers={team}
        onSuccess={() => {
          fetchTeamData();
        }}
      />
    </div>
  );
};
