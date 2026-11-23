import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  UserPlus,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Phone,
  Building2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { notificationService } from '../../services/notification.service.js';
import { NotificationItem } from '../../types/notification.types.js';

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getEventIcon(type: string) {
  switch (type) {
    case 'NEW_LEAD_ASSIGNED':
    case 'RETURNING_CUSTOMER_RE_ENQUIRY':
    case 'LEAD_ASSIGNED':
    case 'LEAD_REASSIGNED':
      return <UserPlus className="w-4 h-4 text-blue-600" />;
    case 'MEETING_SCHEDULED':
      return <Calendar className="w-4 h-4 text-purple-600" />;
    case 'SITE_VISIT_SCHEDULED':
      return <MapPin className="w-4 h-4 text-amber-600" />;
    case 'NEW_FOLLOW_UP':
      return <Clock className="w-4 h-4 text-sky-600" />;
    case 'WORKFLOW_UPDATE':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case 'NEW_ACTIVITY':
      return <MessageSquare className="w-4 h-4 text-slate-600" />;
    case 'SYSTEM_ALERT':
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    case 'DUPLICATE_ENQUIRY':
      return <Copy className="w-4 h-4 text-amber-600" />;
    default:
      return <Bell className="w-4 h-4 text-blue-600" />;
  }
}

export const NotificationBellDropdown: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch quick unread count on mount and polling
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore network errors
    }
  }, []);

  // Fetch recent preview items when dropdown is opened
  const fetchRecentNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications({ page: 1, limit: 6 });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll unread count every 30s & listen for CRM notification refresh events
  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    const handleRefreshEvent = () => refreshUnreadCount();
    window.addEventListener('crm:notification-refresh', handleRefreshEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('crm:notification-refresh', handleRefreshEvent);
    };
  }, [refreshUnreadCount]);

  // When dropdown opens, fetch latest
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen, fetchRecentNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      // Mark as read in background
      notificationService.markAsRead(item.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
    }
    setIsOpen(false);

    if (item.link) {
      navigate(item.link);
    } else {
      navigate('/notifications');
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
    } catch {
      // ignore error
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-content-secondary hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
        aria-label={`View notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-status-danger text-white text-[10px] font-bold ring-2 ring-white animate-in zoom-in-75">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-2 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:absolute mt-2 sm:w-96 max-w-[calc(100vw-1rem)] bg-surface-card rounded-xl shadow-dropdown border border-edge z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 max-h-[calc(100vh-5rem)] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-edge flex items-center justify-between bg-surface-subtle/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-brand-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-[11px] font-medium text-brand-primary hover:text-blue-700 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isMarkingAll ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[min(380px,calc(100vh-10rem))] overflow-y-auto divide-y divide-edge flex-1">
            {isLoading ? (
              <div className="py-10 text-center text-content-muted text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-content-muted text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 stroke-[1.5]" />
                <span className="font-semibold text-content-primary">All caught up!</span>
                <span>No notifications to show.</span>
              </div>
            ) : (
              notifications.map((item) => {
                const isAssignment =
                  item.type === 'NEW_LEAD_ASSIGNED' ||
                  item.type === 'LEAD_ASSIGNED' ||
                  item.type === 'LEAD_REASSIGNED';
                const isDuplicate = item.type === 'DUPLICATE_ENQUIRY';
                const meta = (item.metadata || {}) as any;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      !item.isRead
                        ? isDuplicate ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'hover:bg-surface-subtle/60'
                    }`}
                  >
                    {/* Event Icon container */}
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        !item.isRead
                          ? isDuplicate ? 'bg-amber-100 border border-amber-300' : 'bg-blue-100 border border-blue-200'
                          : 'bg-surface-subtle border border-edge'
                      }`}
                    >
                      {getEventIcon(item.type)}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            !item.isRead ? 'text-content-primary font-bold' : 'text-content-secondary font-semibold'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-content-muted whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-content-muted line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Compact Lead Details if Assignment Event */}
                      {isAssignment && (
                        <div className="mt-1.5 p-2 rounded-lg bg-surface-subtle/80 border border-edge text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-content-primary">
                            <span className="font-bold text-xs truncate">
                              {meta.customerName || item.relatedCustomerName || 'Lead'}
                            </span>
                            {meta.budgetRange && meta.budgetRange !== 'Not specified' && (
                              <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                {meta.budgetRange}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 text-content-muted text-[10px] flex-wrap">
                            {meta.mobile && (
                              <span className="inline-flex items-center gap-1 text-content-secondary font-medium">
                                <Phone className="w-3 h-3 text-brand-primary" />
                                <span>{meta.mobile}</span>
                              </span>
                            )}
                            {meta.projectName && meta.projectName !== 'Not specified' && (
                              <span className="inline-flex items-center gap-1 text-content-secondary truncate max-w-[130px]">
                                <Building2 className="w-3 h-3 text-amber-600" />
                                <span className="truncate">{meta.projectName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Compact Lead Details if Duplicate Enquiry Event */}
                      {isDuplicate && (
                        <div className="mt-1.5 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] space-y-1">
                          <div className="flex items-center justify-between text-content-primary">
                            <span className="font-bold text-xs truncate text-amber-950">
                              {meta.existingLeadName || meta.customerName || item.relatedCustomerName || 'Prospect'}
                            </span>
                            <span className="text-amber-800 font-bold text-[9px] uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                              {meta.matchType || 'Duplicate Match'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-content-muted text-[10px] flex-wrap">
                            {meta.assignedAgentName && (
                              <span className="text-content-secondary">
                                Agent: <strong className="font-medium text-slate-800">{meta.assignedAgentName}</strong>
                              </span>
                            )}
                            {meta.submittedBy && (
                              <>
                                <span>•</span>
                                <span className="text-content-secondary">
                                  By: <strong className="font-medium text-slate-800">{meta.submittedBy}</strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between gap-1">
                        {isAssignment ? (
                          <span className="text-[10px] font-semibold text-brand-primary flex items-center gap-1 hover:underline">
                            <span>View Lead Workflow</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        ) : isDuplicate ? (
                          <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-1 hover:underline">
                            <span>View Existing Lead</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          item.relatedCustomerName && (
                            <span className="inline-block text-[10px] font-medium px-1.5 py-0.2 rounded bg-surface-subtle text-content-secondary border border-edge truncate max-w-[140px]">
                              {item.relatedCustomerName}
                            </span>
                          )
                        )}
                        {item.relatedStage && (
                          <span className="inline-block text-[9px] font-semibold px-1 rounded bg-slate-100 text-slate-600">
                            {item.relatedStage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {!item.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-1.5"
                        title="Unread"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-edge bg-surface-subtle/30 text-center">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-brand-primary hover:bg-blue-50/60 transition-colors flex items-center justify-center gap-1"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
