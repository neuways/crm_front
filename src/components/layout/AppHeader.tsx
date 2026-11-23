import React, { useState } from "react";
import { Menu, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { UserProfile } from "../../types/auth.types.js";
import { GlobalSearchBar } from "./GlobalSearchBar.js";
import { NotificationBellDropdown } from "./NotificationBellDropdown.js";

export interface AppHeaderProps {
  currentUser: UserProfile;
  onOpenMobileMenu: () => void;
  onShowPlaceholderNotice?: (featureName: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  onOpenMobileMenu,
  onShowPlaceholderNotice: _onShowPlaceholderNotice,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface-header border-b border-edge px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-content-secondary hover:bg-surface-subtle lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-content-muted min-w-0">
          <span className="shrink-0">Sales</span>
          <span className="text-edge shrink-0">/</span>
          <span className="font-semibold text-content-primary truncate">
            Dashboard
          </span>
        </div>

        {/* Desktop Date badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-subtle border border-edge rounded-full text-xs font-medium text-content-secondary ml-2">
          <CalendarIcon className="h-3.5 w-3.5 text-content-muted" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Center: Functional Global CRM Search */}
      <div className="flex-1 max-w-md hidden sm:block">
        <GlobalSearchBar currentUser={currentUser} />
      </div>

      {/* Right: Notifications & User profile */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="p-2 rounded-lg text-content-secondary hover:bg-surface-subtle sm:hidden transition-colors"
          aria-label="Toggle search"
        >
          {isMobileSearchOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>

        {/* Functional Notification Bell & Dropdown */}
        <NotificationBellDropdown />

        <div className="h-4 w-px bg-edge hidden sm:block" />

        {/* User profile capsule */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-brand-primary font-semibold text-xs flex items-center justify-center shrink-0 border border-blue-200">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-content-primary leading-tight">
              {currentUser.name}
            </span>
            <span className="text-[10px] text-content-muted leading-tight">
              {currentUser.role === "SALES" ? "Sales Agent" : currentUser.role}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Search Bar */}
      {isMobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 bg-surface-header border-b border-edge p-3 sm:hidden z-30 shadow-dropdown">
          <GlobalSearchBar
            currentUser={currentUser}
            onClose={() => setIsMobileSearchOpen(false)}
            autoFocus
          />
        </div>
      )}
    </header>
  );
};
