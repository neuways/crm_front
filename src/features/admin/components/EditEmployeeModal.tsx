import React, { useState, useEffect } from 'react';
import { X, UserCheck, Eye, EyeOff, Sparkles, AlertCircle, Shield, Briefcase, KeyRound } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { EmployeeProfile, UpdateEmployeeInput } from '../../../types/user.types.js';
import { userService } from '../../../services/user.service.js';
import { useAuth } from '../../../context/AuthContext.js';
import { PropertiesSelect } from './PropertiesSelect.js';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeProfile | null;
  managers: EmployeeProfile[];
  admins?: EmployeeProfile[];
  onEmployeeUpdated: (updatedEmployee: EmployeeProfile) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  managers,
  admins = [],
  onEmployeeUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [role, setRole] = useState<'MANAGER' | 'SALES'>('SALES');
  const [managerId, setManagerId] = useState<string>('');
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [resetPassword, setResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setPhone(employee.phone || '');
      setPhoneError(null);
      setRole(employee.role === 'ADMIN' ? 'MANAGER' : (employee.role as 'MANAGER' | 'SALES'));
      if (!employee.managerId || employee.managerId === currentUser?.id) {
        setManagerId('');
      } else {
        setManagerId(employee.managerId);
      }
      setPropertyIds(
        employee.assignedPropertyIds ||
          employee.assignedProperties?.map((p) => p.id) ||
          []
      );
      setResetPassword('');
      setErrorMessage(null);
    }
  }, [employee, currentUser?.id]);

  if (!isOpen || !employee) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    const randomArray = new Uint32Array(14);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(randomArray);
    } else {
      for (let i = 0; i < 14; i++) {
        randomArray[i] = Math.floor(Math.random() * 1000000);
      }
    }
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(randomArray[i] % chars.length);
    }
    setResetPassword(pass);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPhoneError(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !INDIAN_MOBILE_REGEX.test(trimmedPhone)) {
      const msg = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      setPhoneError(msg);
      setErrorMessage(msg);
      return;
    }

    if (resetPassword && resetPassword.length < 8) {
      setErrorMessage('Reset password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateEmployeeInput = {
        name: trimmedName,
        phone: trimmedPhone || null,
        role: employee.role === 'ADMIN' ? undefined : role,
        managerId: role === 'SALES' ? (managerId || currentUser?.id || null) : null,
        temporaryPassword: resetPassword.trim() ? resetPassword.trim() : undefined,
        propertyIds: role === 'SALES' ? propertyIds : [],
      };

      const res = await userService.updateEmployee(employee.id, payload);
      if (!res.success || !res.data) {
        setErrorMessage(res.message || res.error || 'Failed to update employee details.');
        return;
      }

      onEmployeeUpdated(res.data);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred while updating employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-edge shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-brand-primary shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">
                Edit Employee Account
              </h2>
              <span className="text-xs text-content-muted font-mono">
                {employee.email}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-content-subtle hover:text-content-primary hover:bg-surface-subtle shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-status-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Full Name <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
              className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(digitsOnly);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={() => {
                if (phone.trim() && !INDIAN_MOBILE_REGEX.test(phone.trim())) {
                  setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
                }
              }}
              placeholder="e.g. 9876543210"
              className={`w-full px-3 py-2 bg-surface-card border rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 font-mono ${
                phoneError
                  ? 'border-status-danger focus:ring-status-danger'
                  : 'border-edge focus:ring-brand-primary'
              }`}
            />
            {phoneError ? (
              <span className="text-[10px] text-status-danger mt-1 block">{phoneError}</span>
            ) : (
              <span className="text-[10px] text-content-muted mt-1 block">
                10-digit Indian mobile number starting with 6, 7, 8, or 9.
              </span>
            )}
          </div>

          {/* Role Selection (Read-only if Admin) */}
          {employee.role === 'ADMIN' ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-content-muted">
              <span className="font-semibold text-content-primary">Administrator Role</span>: Primary administration accounts cannot have their role changed.
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Account Role <span className="text-status-danger">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('SALES')}
                  className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                    role === 'SALES'
                      ? 'border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary'
                      : 'border-edge bg-surface-card hover:bg-surface-subtle'
                  }`}
                >
                  <Briefcase className={`h-4 w-4 mt-0.5 ${role === 'SALES' ? 'text-brand-primary' : 'text-content-subtle'}`} />
                  <div>
                    <span className="block text-xs font-bold text-content-primary">Sales Agent</span>
                    <span className="text-[10px] text-content-muted">Frontline follow-ups & round robin</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('MANAGER');
                    setManagerId('');
                  }}
                  className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                    role === 'MANAGER'
                      ? 'border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary'
                      : 'border-edge bg-surface-card hover:bg-surface-subtle'
                  }`}
                >
                  <Shield className={`h-4 w-4 mt-0.5 ${role === 'MANAGER' ? 'text-brand-primary' : 'text-content-subtle'}`} />
                  <div>
                    <span className="block text-xs font-bold text-content-primary">Manager</span>
                    <span className="text-[10px] text-content-muted">Team supervision & approvals</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Assigned Manager Dropdown (Only for Sales Agents) */}
          {role === 'SALES' && employee.role !== 'ADMIN' && (
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Assign to Manager (Supervisor)
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">
                  {currentUser?.name
                    ? `Direct Admin — ${currentUser.name} (Reports to Admin)`
                    : 'Direct Admin (Reports to Admin)'}
                </option>
                {admins
                  .filter((a) => a.isActive && a.id !== currentUser?.id && a.id !== employee.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      Direct Admin — {a.name} ({a.email})
                    </option>
                  ))}
                {managers
                  .filter((m) => m.isActive && m.id !== employee.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-content-muted mt-1 block">
                Select a reporting manager, or leave as Direct Admin to assign this sales agent directly under Admin oversight.
              </span>
            </div>
          )}

          {/* Properties to Handle (Only for Sales Agents) */}
          {role === 'SALES' && employee.role !== 'ADMIN' && (
            <PropertiesSelect
              selectedPropertyIds={propertyIds}
              onChange={setPropertyIds}
              disabled={isSubmitting}
            />
          )}

          {/* Reset Temporary Password (Optional) */}
          <div className="pt-2 border-t border-edge">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-brand-primary" />
                <span>Reset Password (Optional)</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-semibold text-brand-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Generate Secure Password
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Leave blank to preserve current password"
                className="w-full px-3 py-2 pr-9 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-subtle hover:text-content-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetPassword && (
              <span className="text-[10px] text-amber-700 mt-1 block">
                Setting a new temporary password will require the employee to change it on their next login.
              </span>
            )}
          </div>

          {/* Footer Action Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-edge shrink-0">
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
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
