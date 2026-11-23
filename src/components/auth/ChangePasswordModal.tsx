import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { authService } from '../../services/auth.service.js';
import { useAuth } from '../../context/AuthContext.js';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { clearMustChangePassword } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!oldPassword) {
      setErrorMessage('Please enter your temporary / current password.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setErrorMessage('New password must be different from the temporary password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.changePassword(oldPassword, newPassword);
      if (!res.success) {
        setErrorMessage(res.message || res.error || 'Failed to update password.');
        return;
      }

      setSuccess(true);
      clearMustChangePassword();
      setTimeout(() => {
        setSuccess(false);
        onClose?.();
      }, 1800);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-50 text-status-warning rounded-xl shrink-0 border border-amber-200">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary">
              {isMandatory ? 'Set Permanent Password' : 'Change Password'}
            </h3>
            <p className="text-xs text-content-muted">
              {isMandatory
                ? 'Your account was provisioned with a temporary password. Please set your private password to continue.'
                : 'Update your account security password'}
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-content-primary">Password Updated Successfully!</h4>
            <p className="text-xs text-content-muted">Your private password has been saved.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-900">
                <AlertCircle className="h-4 w-4 text-status-danger shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Temporary / Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current or temporary password"
                  className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs font-mono text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                New Private Password (min 8 chars)
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs font-mono text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 bg-surface-card border border-edge rounded-lg text-xs font-mono text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-content-subtle hover:text-content-primary flex items-center gap-1.5 cursor-pointer"
              >
                {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-content-muted" />}
                <span>{showPasswords ? 'Hide passwords' : 'Show passwords'}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-edge">
              {!isMandatory && onClose && (
                <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save New Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
