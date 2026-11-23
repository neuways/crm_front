import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isLoading, user } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  const googleClientId =
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_CLIENT_ID : undefined;
  const isGoogleConfigured = Boolean(googleClientId);

  // Determine redirection destination after login
  const fromLocation = (location.state as any)?.from?.pathname;

  const handleAuthSuccess = () => {
    const stored = localStorage.getItem('nueways_user');
    const role = stored ? JSON.parse(stored)?.role : user?.role;

    // Validate if fromLocation is authorized for the authenticated role
    const isSales = role === 'SALES';
    const isManager = role === 'MANAGER';

    const isRestrictedForSales = fromLocation?.startsWith('/manager') || fromLocation?.startsWith('/admin');
    const isRestrictedForManager = fromLocation?.startsWith('/admin');

    if (fromLocation && fromLocation !== '/login' && fromLocation !== '/') {
      if (isSales && isRestrictedForSales) {
        navigate('/sales/dashboard', { replace: true });
      } else if (isManager && isRestrictedForManager) {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate(fromLocation, { replace: true });
      }
    } else if (role === 'SALES') {
      navigate('/sales/dashboard', { replace: true });
    } else if (role === 'MANAGER') {
      navigate('/manager/dashboard', { replace: true });
    } else if (role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/sales/dashboard', { replace: true });
    }
  };

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Email cannot be empty.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setFormError('Password cannot be empty.');
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormError(null);
    setGoogleNotice(null);
    const result = await login({ email: email.trim(), password });

    if (result.success) {
      handleAuthSuccess();
    } else {
      setFormError(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleGoogleSignInClick = async () => {
    setFormError(null);

    if (!isGoogleConfigured) {
      setGoogleNotice(
        'Google Sign-In is pending corporate configuration (VITE_GOOGLE_CLIENT_ID has not been set by administrator). Please sign in using your corporate email and password below.'
      );
      return;
    }

    setGoogleNotice(null);
    setIsGoogleLoading(true);

    try {
      if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) {
        setFormError('Google Identity Services SDK is not loaded. Please verify internet connectivity.');
        setIsGoogleLoading(false);
        return;
      }

      (window as any).google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setFormError('No Google ID token was returned by Google authentication.');
            setIsGoogleLoading(false);
            return;
          }

          const res = await loginWithGoogle(response.credential);
          if (res.success) {
            handleAuthSuccess();
          } else {
            setFormError(res.error || 'Google authentication failed.');
          }
          setIsGoogleLoading(false);
        },
      });

      (window as any).google.accounts.id.prompt();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'An unexpected error occurred during Google Sign-In.'
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/neuways-logo.png"
            alt="Neuways CRM Logo"
            className="h-16 w-16 object-contain rounded-2xl shadow-sm mb-3"
          />
          <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
            Nueways CRM
          </h1>
          <span className="text-xs font-bold tracking-widest text-content-muted uppercase mt-0.5">
            Enterprise Real-Estate Sales
          </span>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-surface-card py-8 px-6 shadow-card border border-edge rounded-card sm:px-10">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-content-primary">
              Sign In to Your Workspace
            </h2>
            <p className="text-xs text-content-muted mt-1 leading-relaxed">
              Enter your corporate employee credentials to access lead queues and pipeline activities.
            </p>
          </div>

          {/* Form Error Banner */}
          {formError && (
            <div
              className="mb-5 p-3.5 bg-red-50/80 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-status-danger"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
              >
                Employee Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-subtle">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@nueways.com"
                  className="block w-full pl-9 pr-3 py-2 bg-surface-subtle/50 focus:bg-surface-card border border-edge rounded-lg text-sm text-content-primary placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-content-secondary mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-subtle">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 bg-surface-subtle/50 focus:bg-surface-card border border-edge rounded-lg text-sm text-content-primary placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-subtle hover:text-content-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full shadow-sm shadow-blue-500/25"
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Visual Divider: OR */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-edge" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface-card px-3 text-content-muted font-medium">Or</span>
            </div>
          </div>

          {/* Continue with Google Action */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-surface-card hover:bg-surface-subtle active:bg-slate-100 border border-edge rounded-lg text-sm font-semibold text-content-primary shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          {/* Google Configuration Guidance (Visible when Client ID is missing) */}
          {googleNotice && (
            <div className="mt-3.5 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed flex items-start gap-2 animate-in fade-in">
              <span className="font-bold shrink-0">Configuration:</span>
              <span>{googleNotice}</span>
            </div>
          )}

          {/* Session Security Indicator */}
          <div className="mt-6 pt-5 border-t border-edge flex items-center justify-center gap-1.5 text-[11px] text-content-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
            <span>Stateless 8-hour JWT authentication session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
