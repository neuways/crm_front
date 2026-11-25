import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types/auth.types.js';
import { ChangePasswordModal } from './ChangePasswordModal.js';

export interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { isAuthenticated, isDemoMode, user, isLoading } = useAuth();
  const location = useLocation();

  // If initial session verification is in flight, display loading indicator to avoid premature redirect
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-content-muted">Verifying session...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and not in explicit demo mode, redirect to /login
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user must change temporary password, block all protected views and render mandatory password change
  if (user?.mustChangePassword && !isDemoMode) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <ChangePasswordModal isOpen={true} isMandatory={true} />
      </div>
    );
  }

  // If specific roles are required, verify role authorization
  if (allowedRoles && user && !isDemoMode && !allowedRoles.includes(user.role)) {
    // If ADMIN or MANAGER attempts to navigate to a restricted route, redirect to authorized landing
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      return <Navigate to="/authorized-landing" replace />;
    }

    // If SALES attempts to navigate to a MANAGER or ADMIN restricted route, redirect to Sales Dashboard
    if (user.role === 'SALES') {
      return <Navigate to="/sales/dashboard" replace />;
    }

    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
        <div className="bg-surface-card border border-edge rounded-card shadow-card p-6 max-w-md w-full text-center">
          <div className="h-12 w-12 rounded-full bg-red-50 text-status-danger mx-auto flex items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-content-primary mb-1">Access Restricted (403)</h2>
          <p className="text-xs text-content-muted mb-4">
            Your authenticated role (<span className="font-semibold">{user.role}</span>) does not have authorization to access this view.
          </p>
          <a
            href={user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'MANAGER' ? '/manager/dashboard' : '/sales/dashboard'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none"
          >
            Go to My Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
