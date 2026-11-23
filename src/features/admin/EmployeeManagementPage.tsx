import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Edit2,
  Building,
  Trash2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { MetricCard } from '../../components/ui/MetricCard.js';
import { StatusBadge } from '../../components/ui/StatusBadge.js';
import { LoadingState } from '../../components/ui/LoadingState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { AddEmployeeModal } from './components/AddEmployeeModal.js';
import { EditEmployeeModal } from './components/EditEmployeeModal.js';
import { EmployeeProfile } from '../../types/user.types.js';
import { userService } from '../../services/user.service.js';
import { useAuth } from '../../context/AuthContext.js';

export const EmployeeManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'SALES'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [statusToggleTarget, setStatusToggleTarget] = useState<EmployeeProfile | null>(null);
  const [transferOption, setTransferOption] = useState<'TRANSFER_TO_MANAGER' | 'ADMIN_HANDLE'>('TRANSFER_TO_MANAGER');
  const [selectedTargetManagerId, setSelectedTargetManagerId] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<EmployeeProfile | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await userService.listEmployees();
      if (!res.success || !res.data) {
        setError(res.message || res.error || 'Failed to retrieve employee directory.');
        return;
      }
      setEmployees(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).successMessage) {
      setActionSuccessMessage((location.state as any).successMessage);
      fetchEmployees();
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setActionSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleEmployeeCreated = (newEmp: EmployeeProfile) => {
    setEmployees((prev) => [newEmp, ...prev]);
    setActionSuccessMessage(`Employee account created for ${newEmp.name} (${newEmp.email}).`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const handleEmployeeUpdated = (updated: EmployeeProfile) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setActionSuccessMessage(`Employee account for ${updated.name} updated successfully.`);
    setTimeout(() => setActionSuccessMessage(null), 5000);
    setEditingEmployee(null);
  };

  const handleInitiateStatusToggle = (emp: EmployeeProfile) => {
    setStatusToggleTarget(emp);
    if (emp.role === 'MANAGER' && emp.isActive) {
      const otherActiveManagers = employees.filter(
        (e) => e.role === 'MANAGER' && e.isActive && e.id !== emp.id
      );
      if (otherActiveManagers.length > 0) {
        setTransferOption('TRANSFER_TO_MANAGER');
        setSelectedTargetManagerId(otherActiveManagers[0].id);
      } else {
        setTransferOption('ADMIN_HANDLE');
        setSelectedTargetManagerId('');
      }
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusToggleTarget) return;

    setIsUpdatingStatus(true);
    try {
      const nextStatus = !statusToggleTarget.isActive;
      let res;
      if (statusToggleTarget.role === 'MANAGER' && !nextStatus) {
        res = await userService.updateEmployeeStatus(statusToggleTarget.id, false, {
          transferOption,
          targetManagerId: transferOption === 'TRANSFER_TO_MANAGER' ? selectedTargetManagerId : undefined
        });
      } else {
        res = await userService.updateEmployeeStatus(statusToggleTarget.id, nextStatus);
      }

      if (!res.success || !res.data) {
        alert(res.message || res.error || 'Failed to update employee status.');
        return;
      }

      // Refresh list to update any transferred sales agents / manager IDs
      const listRes = await userService.listEmployees();
      if (listRes.success && listRes.data) {
        setEmployees(listRes.data);
      } else {
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === statusToggleTarget.id ? res.data! : emp))
        );
      }

      setActionSuccessMessage(
        `Account for ${statusToggleTarget.name} has been ${nextStatus ? 'activated' : 'deactivated'}.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
      setStatusToggleTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingEmployee(true);
    try {
      const res = await userService.deleteEmployee(deleteTarget.id);
      if (!res.success) {
        alert(res.message || res.error || 'Failed to delete employee account.');
        return;
      }

      setEmployees((prev) => prev.filter((emp) => emp.id !== deleteTarget.id));
      setActionSuccessMessage(
        `Employee ${deleteTarget.name} (${deleteTarget.role}) deleted successfully.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
      setDeleteTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting employee account.');
    } finally {
      setIsDeletingEmployee(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = employees.length;
    const sales = employees.filter((e) => e.role === 'SALES').length;
    const managers = employees.filter((e) => e.role === 'MANAGER').length;
    const active = employees.filter((e) => e.isActive).length;
    return { total, sales, managers, active };
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchQuery === '' ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && emp.isActive) ||
        (statusFilter === 'INACTIVE' && !emp.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchQuery, roleFilter, statusFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <StatusBadge label="ADMIN" variant="primary" showDot />;
      case 'MANAGER':
        return <StatusBadge label="MANAGER" variant="info" showDot />;
      case 'SALES':
        return <StatusBadge label="SALES" variant="neutral" showDot />;
      default:
        return <StatusBadge label={role} variant="neutral" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-edge">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-1">
            <span>Administration</span>
            <span className="text-edge">/</span>
            <span className="text-content-primary">Employee Provisioning</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
            Employee & User Management
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Provision and manage CRM access for Managers and Sales Agents
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchEmployees}
            disabled={isLoading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => navigate('/admin/employees/new')}
            className="shadow-sm"
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between text-xs text-green-950 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-success shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-green-700 hover:text-green-950 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Directory"
          subtitle="All Staff"
          value={metrics.total}
          badgeText={`${metrics.total} Registered`}
          badgeType="neutral"
          icon={<Users className="h-5 w-5 text-brand-primary" />}
          isMockData={false}
        />
        <MetricCard
          title="Sales Agents"
          subtitle="Frontline Team"
          value={metrics.sales}
          badgeText="Pipeline Role"
          badgeType="info"
          icon={<Briefcase className="h-5 w-5 text-sky-600" />}
          isMockData={false}
        />
        <MetricCard
          title="Managers"
          subtitle="Supervisors"
          value={metrics.managers}
          badgeText="Management Role"
          badgeType="info"
          icon={<Shield className="h-5 w-5 text-indigo-600" />}
          isMockData={false}
        />
        <MetricCard
          title="Active Accounts"
          subtitle="Operational"
          value={metrics.active}
          badgeText={metrics.total > 0 ? `${Math.round((metrics.active / metrics.total) * 100)}% Active` : '0%'}
          badgeType="positive"
          icon={<UserCheck className="h-5 w-5 text-status-success" />}
          isMockData={false}
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-subtle">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name or email address..."
              className="w-full pl-9 pr-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="flex-1 sm:flex-initial px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="ALL">All Roles</option>
              <option value="SALES">Sales Agents</option>
              <option value="MANAGER">Managers</option>
              <option value="ADMIN">Administrators</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex-1 sm:flex-initial px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Directory Content */}
      {isLoading ? (
        <LoadingState message="Loading registered employees directory..." />
      ) : error ? (
        <ErrorState
          title="Failed to Load Employees"
          message={error}
          onRetry={fetchEmployees}
        />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No Employees Found"
          description={
            searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No employees match the selected search or filter criteria.'
              : 'No employees have been provisioned yet.'
          }
          actionLabel="Provision First Employee"
          onAction={() => navigate('/admin/employees/new')}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-subtle/80 border-b border-edge text-content-muted font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Authentication</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {filteredEmployees.map((emp) => {
                  const isCurrent = currentUser?.id === emp.id || currentUser?.email === emp.email;

                  return (
                    <tr key={emp.id} className="hover:bg-surface-subtle/40 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-brand-primary font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200">
                            {emp.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-content-primary block">
                              {emp.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-brand-primary font-semibold">
                                (You)
                              </span>
                            )}
                          </div>
                          {emp.role === 'SALES' && emp.assignedProperties && emp.assignedProperties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {emp.assignedProperties.map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-brand-primary border border-blue-200"
                                >
                                  <Building className="h-2.5 w-2.5" />
                                  {p.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-content-secondary font-mono text-xs">
                        {emp.email}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        {getRoleBadge(emp.role)}
                      </td>

                      {/* Assigned Manager */}
                      <td className="py-3 px-4">
                        {emp.role === 'SALES' ? (
                          emp.managerName ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-content-primary">
                              <Shield className="h-3 w-3 text-indigo-500" />
                              {emp.managerName}
                            </span>
                          ) : (
                            <span className="text-content-subtle text-[11px] italic">Direct</span>
                          )
                        ) : (
                          <span className="text-content-subtle text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {emp.isActive ? (
                          <StatusBadge label="Active" variant="success" showDot />
                        ) : (
                          <StatusBadge label="Inactive" variant="danger" showDot />
                        )}
                      </td>

                      {/* Authentication Methods */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {emp.hasGoogleLinked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Google Linked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              Google Ready
                            </span>
                          )}

                          {emp.mustChangePassword && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <Lock className="h-3 w-3 text-amber-600" />
                              Temp Password
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-content-muted text-[11px]">
                        {new Date(emp.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCurrent && emp.role !== 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingEmployee(emp)}
                              className="text-content-secondary hover:text-brand-primary hover:bg-blue-50 text-xs py-1 px-2"
                              icon={<Edit2 className="h-3.5 w-3.5" />}
                            >
                              Edit
                            </Button>
                          )}
                          {isCurrent ? (
                            <span className="text-[11px] text-content-subtle italic">
                              Current session
                            </span>
                          ) : emp.role === 'ADMIN' ? (
                            <span className="text-[11px] text-content-subtle italic">
                              Protected admin
                            </span>
                          ) : (
                            <>
                              <Button
                                variant={emp.isActive ? 'ghost' : 'outline'}
                                size="sm"
                                onClick={() => handleInitiateStatusToggle(emp)}
                                className={
                                  emp.isActive
                                    ? 'text-status-danger hover:bg-red-50 hover:text-red-700 text-xs py-1 px-2'
                                    : 'text-status-success hover:bg-green-50 hover:text-green-700 text-xs py-1 px-2'
                                }
                                icon={
                                  emp.isActive ? (
                                    <UserX className="h-3.5 w-3.5" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5" />
                                  )
                                }
                              >
                                {emp.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(emp)}
                                className="text-status-danger hover:bg-red-50 hover:text-red-700 text-xs py-1 px-2"
                                icon={<Trash2 className="h-3.5 w-3.5" />}
                              >
                                Delete
                              </Button>
                            </>
                          )}
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

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        managers={employees.filter((e) => e.role === 'MANAGER')}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeCreated={handleEmployeeCreated}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={Boolean(editingEmployee)}
        employee={editingEmployee}
        managers={employees.filter((e) => e.role === 'MANAGER')}
        onClose={() => setEditingEmployee(null)}
        onEmployeeUpdated={handleEmployeeUpdated}
      />

      {/* Status Toggle Confirmation Modal */}
      {statusToggleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          {statusToggleTarget.role === 'MANAGER' && statusToggleTarget.isActive ? (
            <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl shrink-0 bg-red-50 text-status-danger">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-content-primary">
                    Deactivate Manager Account?
                  </h3>
                  <span className="text-xs text-content-muted font-mono">
                    {statusToggleTarget.name} ({statusToggleTarget.email})
                  </span>
                </div>
              </div>

              <p className="text-xs text-content-secondary leading-relaxed">
                Deactivating this Manager will immediately revoke their system access. Please specify how reporting sales agents and active leads should be handled:
              </p>

              {/* Options */}
              <div className="space-y-3 pt-1">
                {(() => {
                  const otherActiveManagers = employees.filter(
                    (e) => e.role === 'MANAGER' && e.isActive && e.id !== statusToggleTarget.id
                  );

                  return (
                    <>
                      {/* Option A: Transfer to Another Active Manager */}
                      <label
                        className={`block p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          transferOption === 'TRANSFER_TO_MANAGER' && otherActiveManagers.length > 0
                            ? 'border-brand-primary bg-blue-50/40 text-content-primary'
                            : otherActiveManagers.length === 0
                            ? 'border-edge opacity-60 cursor-not-allowed bg-slate-50'
                            : 'border-edge hover:bg-surface-subtle text-content-secondary'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="managerTransferOption"
                            value="TRANSFER_TO_MANAGER"
                            checked={transferOption === 'TRANSFER_TO_MANAGER' && otherActiveManagers.length > 0}
                            disabled={otherActiveManagers.length === 0}
                            onChange={() => {
                              if (otherActiveManagers.length > 0) {
                                setTransferOption('TRANSFER_TO_MANAGER');
                                if (!selectedTargetManagerId) {
                                  setSelectedTargetManagerId(otherActiveManagers[0].id);
                                }
                              }
                            }}
                            className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                          />
                          <div className="space-y-1.5 flex-1">
                            <span className="font-semibold block text-content-primary">
                              Option A: Transfer to Another Active Manager
                            </span>
                            <span className="text-[11px] text-content-muted block leading-normal">
                              Reassigns reporting sales agents and active leads directly to the selected active Manager.
                            </span>
                            {otherActiveManagers.length > 0 ? (
                              <div className="pt-1.5">
                                <select
                                  value={selectedTargetManagerId}
                                  onChange={(e) => setSelectedTargetManagerId(e.target.value)}
                                  disabled={transferOption !== 'TRANSFER_TO_MANAGER'}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-edge bg-surface-card focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                >
                                  {otherActiveManagers.map((mgr) => (
                                    <option key={mgr.id} value={mgr.id}>
                                      {mgr.name} ({mgr.email})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 italic block pt-1">
                                No other active managers available.
                              </span>
                            )}
                          </div>
                        </div>
                      </label>

                      {/* Option B: Administrator Handles Directly */}
                      <label
                        className={`block p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          transferOption === 'ADMIN_HANDLE' || otherActiveManagers.length === 0
                            ? 'border-brand-primary bg-blue-50/40 text-content-primary'
                            : 'border-edge hover:bg-surface-subtle text-content-secondary'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="managerTransferOption"
                            value="ADMIN_HANDLE"
                            checked={transferOption === 'ADMIN_HANDLE' || otherActiveManagers.length === 0}
                            onChange={() => setTransferOption('ADMIN_HANDLE')}
                            className="mt-0.5 text-brand-primary focus:ring-brand-primary"
                          />
                          <div className="space-y-1 flex-1">
                            <span className="font-semibold block text-content-primary">
                              Option B: Administrator Handles Team &amp; Leads Directly
                            </span>
                            <span className="text-[11px] text-content-muted block leading-normal">
                              Reporting sales agents are released to the unassigned pool under Admin control. Leads are transferred to your Admin account for subsequent reassignment.
                            </span>
                          </div>
                        </div>
                      </label>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-edge">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusToggleTarget(null)}
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={isUpdatingStatus}
                  disabled={
                    isUpdatingStatus ||
                    (transferOption === 'TRANSFER_TO_MANAGER' &&
                      !selectedTargetManagerId &&
                      employees.some((e) => e.role === 'MANAGER' && e.isActive && e.id !== statusToggleTarget.id))
                  }
                  onClick={handleConfirmToggleStatus}
                >
                  Confirm Deactivation
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    statusToggleTarget.isActive
                      ? 'bg-red-50 text-status-danger'
                      : 'bg-green-50 text-status-success'
                  }`}
                >
                  {statusToggleTarget.isActive ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <UserCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-content-primary">
                    {statusToggleTarget.isActive ? 'Deactivate Employee?' : 'Reactivate Employee?'}
                  </h3>
                  <span className="text-xs text-content-muted font-mono">
                    {statusToggleTarget.email}
                  </span>
                </div>
              </div>

              <p className="text-xs text-content-secondary leading-relaxed mb-5">
                {statusToggleTarget.isActive
                  ? `Deactivating ${statusToggleTarget.name} will immediately revoke their ability to log in via password or Google Sign-In.`
                  : `Reactivating ${statusToggleTarget.name} will restore their login access with role ${statusToggleTarget.role}.`}
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusToggleTarget(null)}
                  disabled={isUpdatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant={statusToggleTarget.isActive ? 'danger' : 'primary'}
                  isLoading={isUpdatingStatus}
                  onClick={handleConfirmToggleStatus}
                >
                  {statusToggleTarget.isActive ? 'Confirm Deactivation' : 'Confirm Activation'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-red-50 text-status-danger">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Delete Employee Account?
                </h3>
                <span className="text-xs text-content-muted font-mono">
                  {deleteTarget.email}
                </span>
              </div>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed mb-5">
              Permanently delete <strong className="text-content-primary">{deleteTarget.name}</strong> ({deleteTarget.role})? This action cannot be undone. Associated properties, team memberships, and assigned leads will be unassigned automatically.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingEmployee}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                isLoading={isDeletingEmployee}
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
