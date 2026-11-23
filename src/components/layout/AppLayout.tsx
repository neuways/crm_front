import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar.js";
import { AppHeader } from "./AppHeader.js";
import { UserProfile } from "../../types/auth.types.js";
import { useAuth } from "../../context/AuthContext.js";
import { Info, LogOut, X } from "lucide-react";
import { Button } from "../ui/Button.js";
import { ChangePasswordModal } from "../auth/ChangePasswordModal.js";
import { NetworkRecoveryBanner } from "./NetworkRecoveryBanner.js";

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const currentUser: UserProfile = user || {
    id: "demo-agent",
    name: "Demo Sales Agent",
    email: "sales.agent@nueways.local",
    role: "SALES",
    isActive: true,
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const handleShowPlaceholderNotice = (featureName: string) => {
    setNoticeMessage(
      `"${featureName}" is part of the CRM roadmap and will be activated in an upcoming implementation phase. In Phase 1, only the Sales Agent Dashboard is operational.`,
    );
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col font-sans">
      {/* Reusable Left Sidebar */}
      <AppSidebar
        currentUser={currentUser}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onShowPlaceholderNotice={handleShowPlaceholderNotice}
        onRequestLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content Area (Offset by sidebar width on large screens) */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-200">
        {/* Network & Reconnection Status Banner */}
        <NetworkRecoveryBanner />

        {/* Reusable Header */}
        <AppHeader
          currentUser={currentUser}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onShowPlaceholderNotice={handleShowPlaceholderNotice}
        />

        {/* Content Outlet */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet
            context={{
              currentUser,
              onShowPlaceholderNotice: handleShowPlaceholderNotice,
            }}
          />
        </main>
      </div>

      {/* Feature Notice Modal */}
      {noticeMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-md w-full p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-brand-primary rounded-lg shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-content-primary mb-1">
                  Feature In Development
                </h3>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {noticeMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNoticeMessage(null)}
                className="text-content-subtle hover:text-content-primary p-1 rounded-md"
                aria-label="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setNoticeMessage(null)}
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-card border border-edge rounded-card shadow-dropdown max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-50 text-status-danger rounded-xl shrink-0">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Sign Out
                </h3>
                <span className="text-xs text-content-muted">
                  End your current session
                </span>
              </div>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed mb-5">
              Are you sure you want to log out of Nueways CRM? You will need to enter your email and password to access the sales workspace again.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                onClick={handleConfirmLogout}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory First-Time Password Change Modal */}
      <ChangePasswordModal
        isOpen={Boolean(currentUser.mustChangePassword)}
        isMandatory={true}
      />
    </div>
  );
};
