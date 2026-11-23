import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Filter,
  Clock,
  Calendar,
  History,
  Bell,
  LogOut,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Copy,
  UploadCloud,
} from "lucide-react";
import { UserProfile } from "../../types/auth.types.js";

export interface AppSidebarProps {
  currentUser: UserProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onShowPlaceholderNotice: (featureName: string) => void;
  onRequestLogout: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentUser,
  isOpenMobile,
  onCloseMobile,
  onShowPlaceholderNotice,
  onRequestLogout,
}) => {
  const salesNavItems = [
    {
      name: "Sales Dashboard",
      path: "/sales/dashboard",
      icon: LayoutDashboard,
      implemented: true,
    },
    {
      name: "Completed Deals",
      path: "/sales/completed-deals",
      icon: CheckCircle2,
      implemented: true,
    },
    {
      name: "Leads / Enquiries",
      path: "/leads",
      icon: Filter,
      implemented: true,
    },
    {
      name: "Pending Follow-ups",
      path: "/follow-ups/pending",
      icon: Clock,
      implemented: true,
    },
    {
      name: "Future Follow-ups",
      path: "/follow-ups/future",
      icon: Calendar,
      implemented: true,
    },
    {
      name: "Activities / Timeline",
      path: "/activities",
      icon: History,
      implemented: true,
    },
    {
      name: "Duplicate Data",
      path: "/duplicate-data",
      icon: Copy,
      implemented: true,
    },
    {
      name: "Bulk Data Upload",
      path: "/bulk-upload",
      icon: UploadCloud,
      implemented: true,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      implemented: true,
    },
  ];

  const adminNavItems = [
    {
      name: "Overview",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      implemented: true,
    },
    {
      name: "Employee Management",
      path: "/admin/employees",
      icon: Users,
      implemented: true,
    },
    {
      name: "Leads / Enquiries",
      path: "/leads",
      icon: Filter,
      implemented: true,
    },
    {
      name: "Completed Deals",
      path: "/sales/completed-deals",
      icon: CheckCircle2,
      implemented: true,
    },
    {
      name: "Duplicate Data",
      path: "/duplicate-data",
      icon: Copy,
      implemented: true,
    },
    {
      name: "Activities / Timeline",
      path: "/activities",
      icon: History,
      implemented: true,
    },
    {
      name: "Bulk Data Upload",
      path: "/bulk-upload",
      icon: UploadCloud,
      implemented: true,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      implemented: true,
    },
  ];

  const managerNavItems = [
    {
      name: "Overview",
      path: "/manager/dashboard",
      icon: LayoutDashboard,
      implemented: true,
    },
    {
      name: "Sales Team",
      path: "/manager/team",
      icon: Users,
      implemented: true,
    },
    {
      name: "Leads / Enquiries",
      path: "/manager/leads",
      icon: Filter,
      implemented: true,
    },
    {
      name: "Pending Follow-ups",
      path: "/manager/follow-ups/pending",
      icon: Clock,
      implemented: true,
    },
    {
      name: "Future Follow-ups",
      path: "/manager/follow-ups/future",
      icon: Calendar,
      implemented: true,
    },
    {
      name: "Completed Deals",
      path: "/manager/completed-deals",
      icon: CheckCircle2,
      implemented: true,
    },
    {
      name: "Rejected / Lost",
      path: "/manager/rejected-deals",
      icon: XCircle,
      implemented: true,
    },
    {
      name: "Duplicate Data",
      path: "/duplicate-data",
      icon: Copy,
      implemented: true,
    },
    {
      name: "Activities / Timeline",
      path: "/manager/activities",
      icon: History,
      implemented: true,
    },
    {
      name: "Bulk Data Upload",
      path: "/bulk-upload",
      icon: UploadCloud,
      implemented: true,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Bell,
      implemented: true,
    },
  ];

  const navItems =
    currentUser.role === "MANAGER"
      ? managerNavItems
      : currentUser.role === "ADMIN" ? adminNavItems : salesNavItems;

  const getHomeRoute = () => {
    if (currentUser.role === "ADMIN") {
      return "/admin/dashboard";
    }
    if (currentUser.role === "MANAGER") {
      return "/manager/dashboard";
    }
    return "/sales/dashboard";
  };

  const roleSubtitle =
    currentUser.role === "ADMIN"
      ? "Administration"
      : currentUser.role === "MANAGER"
      ? "Team Management"
      : "Enterprise Sales";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface-sidebar border-r border-edge flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top: Logo & Nav items */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 px-3.5 border-b border-edge flex items-center justify-between">
            <Link
              to={getHomeRoute()}
              onClick={onCloseMobile}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-surface-subtle/80 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary flex-1 min-w-0 select-none group cursor-pointer"
              aria-label={`Neuways CRM - ${roleSubtitle} Home`}
            >
              <img
                src="/neuways-logo.png"
                alt="Neuways CRM Logo"
                className="h-10 w-10 object-contain rounded-xl shadow-xs shrink-0 group-hover:opacity-95 transition-opacity"
              />
              <div className="flex flex-col min-w-0 justify-center">
                <span className="font-bold text-sm tracking-tight text-content-primary leading-tight truncate">
                  Neuways CRM
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-content-muted uppercase leading-normal mt-0.5 truncate">
                  {currentUser.role === 'ADMIN'
                    ? 'Administration'
                    : currentUser.role === 'MANAGER'
                    ? 'Team Management'
                    : 'Enterprise Sales'}
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-content-subtle hover:text-content-primary hover:bg-surface-subtle lg:hidden shrink-0 ml-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="p-4 flex-1">
            <div className="text-[11px] font-bold tracking-wider text-content-subtle uppercase px-3 mb-2.5">
              {currentUser.role === 'ADMIN'
                ? 'Admin Navigation'
                : currentUser.role === 'MANAGER'
                ? 'Manager Navigation'
                : 'Pipeline Navigation'}
            </div>

            <nav className="space-y-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;

                if (item.implemented) {
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-blue-50 text-brand-primary font-semibold"
                            : "text-content-secondary hover:bg-surface-subtle hover:text-content-primary"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                    </NavLink>
                  );
                }

                // Placeholder / Unimplemented nav items
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onShowPlaceholderNotice(item.name)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-content-muted hover:bg-surface-subtle hover:text-content-primary transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-content-subtle group-hover:text-content-secondary" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Planned
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-edge bg-surface-subtle/50">
          <div className="p-3 bg-surface-card border border-edge rounded-xl shadow-xs flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-brand-primary font-semibold text-xs flex items-center justify-center shrink-0 border border-blue-200">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-content-primary truncate">
                {currentUser.name}
              </span>
              <span className="text-[11px] text-content-muted truncate">
                {currentUser.role === "SALES"
                  ? "Sales Agent"
                  : currentUser.role === "MANAGER"
                  ? "Sales Manager"
                  : "Administrator"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRequestLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-status-danger hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
