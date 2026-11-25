import React, { useState } from 'react';
import { X, UserPlus, Eye, EyeOff, Sparkles, Check, Copy, AlertCircle, ShieldAlert, KeyRound } from 'lucide-react';
import { Button } from '../../../components/ui/Button.js';
import { CreateEmployeeInput, EmployeeProfile } from '../../../types/user.types.js';
import { userService } from '../../../services/user.service.js';
import { useAuth } from '../../../context/AuthContext.js';
import { PropertiesSelect } from './PropertiesSelect.js';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  managers?: EmployeeProfile[];
  onEmployeeCreated: (employee: EmployeeProfile) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  managers = [],
  onEmployeeCreated,
}) => {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [role, setRole] = useState<'MANAGER' | 'SALES'>('SALES');
  const [managerId, setManagerId] = useState<string>('');
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success view state
  const [createdEmployee, setCreatedEmployee] = useState<EmployeeProfile | null>(null);
  const [createdPasswordSnapshot, setCreatedPasswordSnapshot] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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
    setTemporaryPassword(pass);
    setShowPassword(true);
  };

  const handleCopyCredentials = async () => {
    if (!createdEmployee) return;
    const text = `Nueways CRM - Employee Account Provisioned\n\nName: ${createdEmployee.name}\nEmail: ${createdEmployee.email}\nMobile: ${createdEmployee.phone || 'Not provided'}\nRole: ${createdEmployee.role}\nTemporary Password: ${createdPasswordSnapshot}\nSign-in URL: ${window.location.origin}/login\n\nNote: You can log in with this temporary password (you will be prompted to set your own private password), or sign in directly with Google using this email.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
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

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      const msg = 'Mobile number is required.';
      setPhoneError(msg);
      setErrorMessage(msg);
      return;
    }
    if (!INDIAN_MOBILE_REGEX.test(trimmedPhone)) {
      const msg = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      setPhoneError(msg);
      setErrorMessage(msg);
      return;
    }

    if (!temporaryPassword || temporaryPassword.length < 8) {
      setErrorMessage('Temporary password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateEmployeeInput = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role,
        temporaryPassword,
        managerId: role === 'SALES' ? (managerId || currentUser?.id || null) : null,
        propertyIds: role === 'SALES' ? propertyIds : undefined,
      };

      const res = await userService.createEmployee(payload);
      if (!res.success || !res.data) {
        setErrorMessage(res.message || res.error || 'Failed to create employee.');
        return;
      }

      setCreatedEmployee(res.data);
      setCreatedPasswordSnapshot(temporaryPassword);
      onEmployeeCreated(res.data);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPhoneError(null);
    setRole('SALES');
    setManagerId('');
    setPropertyIds([]);
    setTemporaryPassword('');
    setShowPassword(false);
    setErrorMessage(null);
    setCreatedEmployee(null);
    setCreatedPasswordSnapshot('');
    setCopied(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-edge flex items-center justify-between bg-surface-header shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-brand-primary rounded-lg shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-content-primary">
                {createdEmployee ? 'Account Provisioned' : 'Provision Employee Account'}
              </h2>
              <p className="text-xs text-content-muted">
                {createdEmployee
                  ? 'Credentials ready for secure out-of-band delivery'
                  : 'Grant CRM access to a Sales Agent or Manager'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-content-subtle hover:text-content-primary hover:bg-surface-subtle transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success View */}
        {createdEmployee ? (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <div className="p-1 bg-green-600 text-white rounded-full mt-0.5 shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div className="text-xs text-green-950 flex-1">
                <p className="font-bold mb-1">Employee Account Created Successfully!</p>
                <p className="text-green-800 leading-relaxed">
                  The account has been created with role <span className="font-semibold">{createdEmployee.role}</span>. Deliver the temporary password out-of-band (e.g. secure corporate chat).
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-content-muted">Full Name</span>
                <span className="font-semibold text-content-primary">{createdEmployee.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-content-muted">Email</span>
                <span className="font-semibold text-content-primary">{createdEmployee.email}</span>
              </div>
              {createdEmployee.phone && (
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-content-muted">Mobile</span>
                  <span className="font-semibold text-content-primary font-mono">{createdEmployee.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                <span className="text-content-muted">Role</span>
                <span className="font-bold text-brand-primary">{createdEmployee.role}</span>
              </div>
              {createdEmployee.managerName && (
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-content-muted">Supervisor</span>
                  <span className="font-semibold text-content-primary">
                    {createdEmployee.managerRole === 'ADMIN'
                      ? `Direct Admin — ${createdEmployee.managerName}`
                      : createdEmployee.managerName}
                  </span>
                </div>
              )}
              {createdEmployee.assignedProperties && createdEmployee.assignedProperties.length > 0 && (
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-content-muted">Properties</span>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                    {createdEmployee.assignedProperties.map((p) => (
                      <span key={p.id} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-brand-primary border border-blue-200">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-content-muted">Temporary Password</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 border border-slate-300 rounded shadow-xs">
                  {createdPasswordSnapshot}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <KeyRound className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Alternative Sign-In: </span>
                The employee can also sign in directly using <strong>Google Sign-In</strong> with <span className="font-medium underline">{createdEmployee.email}</span> without ever needing to use the temporary password.
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                onClick={handleCopyCredentials}
                className="w-full sm:w-auto text-xs"
              >
                {copied ? 'Credentials Copied!' : 'Copy Credentials'}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleClose}
                className="w-full sm:w-auto text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Input Form View */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900">
                <AlertCircle className="h-4 w-4 text-status-danger shrink-0 mt-0.5" />
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
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Email Address <span className="text-status-danger">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.sharma@gmail.com or company email"
                className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <p className="text-[11px] text-content-muted mt-1">
                Managers and Sales Agents may use pre-approved personal Gmail or company accounts.
              </p>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Mobile Number <span className="text-status-danger">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
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
                <p className="text-[11px] text-status-danger mt-1">{phoneError}</p>
              ) : (
                <p className="text-[11px] text-content-muted mt-1">
                  10-digit Indian mobile number starting with 6, 7, 8, or 9.
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1.5">
                Role Assignment <span className="text-status-danger">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${
                    role === 'SALES'
                      ? 'border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary'
                      : 'border-edge hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-content-primary">SALES</span>
                    <input
                      type="radio"
                      name="role"
                      value="SALES"
                      checked={role === 'SALES'}
                      onChange={() => setRole('SALES')}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                  </div>
                  <span className="text-[11px] text-content-muted">
                    Sales Agent dashboard, pipeline follow-ups & lead management.
                  </span>
                </label>

                <label
                  className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all ${
                    role === 'MANAGER'
                      ? 'border-brand-primary bg-blue-50/50 ring-1 ring-brand-primary'
                      : 'border-edge hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-content-primary">MANAGER</span>
                    <input
                      type="radio"
                      name="role"
                      value="MANAGER"
                      checked={role === 'MANAGER'}
                      onChange={() => setRole('MANAGER')}
                      className="text-brand-primary focus:ring-brand-primary"
                    />
                  </div>
                  <span className="text-[11px] text-content-muted">
                    Team supervision, lead assignment & manager analytics.
                  </span>
                </label>
              </div>

              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-content-secondary flex items-start gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Policy:</strong> Initial ADMIN accounts cannot be created here and must be bootstrapped via the controlled server CLI.
                </span>
              </div>
            </div>

            {/* Assigned Manager Dropdown (Only for Sales Agents) */}
            {role === 'SALES' && (
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
                  {managers
                    .filter((m) => m.isActive && m.role === 'MANAGER')
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
            {role === 'SALES' && (
              <PropertiesSelect
                selectedPropertyIds={propertyIds}
                onChange={setPropertyIds}
                disabled={isSubmitting}
              />
            )}

            {/* Temporary Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-content-primary">
                  Initial Temporary Password <span className="text-status-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Secure Password
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full pl-3 pr-10 py-2 bg-surface-card border border-edge rounded-lg text-xs font-mono text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-subtle hover:text-content-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-content-muted mt-1">
                The employee will be required to set their permanent private password upon first sign-in.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-edge">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                icon={<UserPlus className="h-3.5 w-3.5" />}
              >
                Provision Account
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
