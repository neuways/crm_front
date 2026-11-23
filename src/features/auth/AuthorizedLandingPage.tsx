import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Info, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { StatusBadge } from '../../components/ui/StatusBadge.js';

export const AuthorizedLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-lg w-full">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src="/neuways-logo.png"
            alt="Neuways CRM Logo"
            className="h-16 w-16 object-contain rounded-2xl shadow-sm mb-3"
          />
          <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
            Nueways CRM
          </h1>
          <span className="text-xs font-bold tracking-widest text-content-muted uppercase mt-0.5">
            Enterprise Portal
          </span>
        </div>

        {/* Portal Information Card */}
        <div className="bg-surface-card border border-edge rounded-card shadow-card p-6 sm:p-8">
          <div className="flex items-start gap-4 pb-6 border-b border-edge">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-brand-primary font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'AU'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-content-primary truncate">
                  {user?.name || 'Authenticated Employee'}
                </h2>
                <StatusBadge
                  label={user?.role || 'AUTHORIZED'}
                  variant="primary"
                />
              </div>
              <p className="text-xs text-content-muted truncate">{user?.email}</p>
            </div>
          </div>

          <div className="my-6 space-y-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
              <Info className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <p className="font-semibold mb-1">
                  {user?.role === 'ADMIN' ? 'Executive Administration Portal' : 'Sales Management Portal'}
                </p>
                <p className="text-blue-800">
                  You are successfully authenticated. Specialized {user?.role} management dashboards (team assignments, quota analytics, and security log audits) are scheduled for upcoming development phases.
                </p>
              </div>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed">
              As an authorized {user?.role}, you may inspect the active Sales Agent Dashboard or conclude your session below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={<LogOut className="h-3.5 w-3.5" />}
              onClick={handleLogout}
              className="w-full sm:w-auto text-status-danger hover:bg-red-50 hover:text-red-700"
            >
              Sign Out
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {user?.role === 'ADMIN' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Users className="h-3.5 w-3.5" />}
                    onClick={() => navigate('/admin/employees')}
                    className="w-full sm:w-auto"
                  >
                    Manage Employees
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    Admin Dashboard
                  </Button>
                </>
              ) : user?.role === 'MANAGER' ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Users className="h-3.5 w-3.5" />}
                    onClick={() => navigate('/manager/team')}
                    className="w-full sm:w-auto"
                  >
                    Sales Team
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                    onClick={() => navigate('/manager/dashboard')}
                    className="w-full sm:w-auto shadow-sm"
                  >
                    Manager Dashboard
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                  onClick={() => navigate('/sales/dashboard')}
                  className="w-full sm:w-auto shadow-sm"
                >
                  View Sales Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
