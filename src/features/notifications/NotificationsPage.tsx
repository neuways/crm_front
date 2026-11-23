import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserPlus,
  Calendar,
  MapPin,
  MessageSquare,
  CheckCheck,
  ExternalLink,
  Check,
  Inbox,
  Phone,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  User,
  Layers
} from 'lucide-react';
import { UserProfile } from '../../types/auth.types.js';
import { Button } from '../../components/ui/Button.js';
import { api } from '../../services/api.js';
import { notificationService } from '../../services/notification.service.js';
import { NotificationItem } from '../../types/notification.types.js';

interface OutletContextType {
  currentUser: UserProfile;
  onShowPlaceholderNotice: (featureName: string) => void;
}

type TabType = 'ALL' | 'UNREAD' | 'SECURITY_ALERTS';

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

function getEventBadge(type: string) {
  switch (type) {
    case 'NEW_LEAD_ASSIGNED':
      return {
        label: 'New Lead',
        icon: <UserPlus className="w-3.5 h-3.5" />,
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    case 'RETURNING_CUSTOMER_RE_ENQUIRY':
      return {
        label: 'Returning Customer',
        icon: <UserPlus className="w-3.5 h-3.5" />,
        className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
      };
    case 'LEAD_ASSIGNED':
    case 'LEAD_REASSIGNED':
      return {
        label: 'Lead Assigned',
        icon: <UserPlus className="w-3.5 h-3.5" />,
        className: 'bg-sky-50 text-sky-700 border-sky-200'
      };
    case 'MEETING_SCHEDULED':
      return {
        label: 'Meeting',
        icon: <Calendar className="w-3.5 h-3.5" />,
        className: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    case 'SITE_VISIT_SCHEDULED':
      return {
        label: 'Site Visit',
        icon: <MapPin className="w-3.5 h-3.5" />,
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    case 'NEW_FOLLOW_UP':
      return {
        label: 'Follow-up',
        icon: <Clock className="w-3.5 h-3.5" />,
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    case 'WORKFLOW_UPDATE':
      return {
        label: 'Workflow Update',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    case 'NEW_ACTIVITY':
      return {
        label: 'Activity',
        icon: <MessageSquare className="w-3.5 h-3.5" />,
        className: 'bg-slate-50 text-slate-700 border-slate-200'
      };
    case 'SYSTEM_ALERT':
      return {
        label: 'System Alert',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        className: 'bg-red-50 text-red-700 border-red-200'
      };
    case 'DUPLICATE_ENQUIRY':
      return {
        label: 'Duplicate Enquiry',
        icon: <Copy className="w-3.5 h-3.5" />,
        className: 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
      };
    default:
      return {
        label: 'Notification',
        icon: <Bell className="w-3.5 h-3.5" />,
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
  }
}

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Admin Security alerts state
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isAlertsLoading, setIsAlertsLoading] = useState<boolean>(false);

  // Expandable lead details state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpanded = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch in-app notifications
  const fetchNotifications = useCallback(async (targetPage = 1, unreadOnly = false) => {
    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications({
        page: targetPage,
        limit: 20,
        unreadOnly
      });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages || 1);
      setPage(res.pagination.page || 1);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch admin security alerts
  const fetchAlerts = useCallback(async () => {
    if (currentUser.role !== 'ADMIN') return;
    try {
      setIsAlertsLoading(true);
      const res = await api.get<{ alerts?: any[] }>('/alerts');
      const responseData = res.data as any;
      if (responseData?.success && Array.isArray(responseData?.data?.alerts)) {
        setAlerts(responseData.data.alerts);
      } else {
        setAlerts([]);
      }
    } catch {
      setAlerts([]);
    } finally {
      setIsAlertsLoading(false);
    }
  }, [currentUser.role]);

  useEffect(() => {
    if (activeTab === 'SECURITY_ALERTS') {
      fetchAlerts();
    } else {
      fetchNotifications(1, activeTab === 'UNREAD');
    }
  }, [activeTab, fetchNotifications, fetchAlerts]);

  // Load security alerts count on mount for Admin
  useEffect(() => {
    if (currentUser.role === 'ADMIN') {
      fetchAlerts();
    }
  }, [currentUser.role, fetchAlerts]);

  // Listen for global notification refresh events (e.g. from header dropdown)
  useEffect(() => {
    const handleNotificationRefresh = () => {
      if (activeTab === 'SECURITY_ALERTS') {
        fetchAlerts();
      } else {
        fetchNotifications(page, activeTab === 'UNREAD');
      }
    };
    window.addEventListener('crm:notification-refresh', handleNotificationRefresh);
    return () => {
      window.removeEventListener('crm:notification-refresh', handleNotificationRefresh);
    };
  }, [activeTab, fetchNotifications, fetchAlerts, page]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
    } catch {
      // ignore
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('crm:notification-refresh'));
    } catch {
      // ignore
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Open related workflow or deal
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'SECURITY_ALERTS') {
      fetchAlerts();
    } else {
      fetchNotifications(page, activeTab === 'UNREAD');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-brand-primary uppercase mb-1">
            <span>Neuways CRM</span>
            <span className="text-slate-300">/</span>
            <span>Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1 max-w-2xl leading-relaxed">
            Database-backed workflow notifications, lead assignments, scheduled appointments, and system alerts.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {activeTab !== 'SECURITY_ALERTS' && unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              icon={
                isMarkingAll ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )
              }
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll || isLoading}
            >
              Mark all as read
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading || isAlertsLoading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isLoading || isAlertsLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-edge overflow-x-auto scrollbar-none">
        <nav className="flex space-x-4 sm:space-x-6 min-w-max">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setPage(1);
            }}
            className={`py-3 px-1 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'ALL'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary hover:border-slate-300'
            }`}
          >
            <span>All Notifications</span>
            {totalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-subtle border border-edge text-content-secondary">
                {totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('UNREAD');
              setPage(1);
            }}
            className={`py-3 px-1 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'UNREAD'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-content-secondary hover:text-content-primary hover:border-slate-300'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-brand-primary">
                {unreadCount}
              </span>
            )}
          </button>

          {currentUser.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setActiveTab('SECURITY_ALERTS')}
              className={`py-3 px-1 border-b-2 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'SECURITY_ALERTS'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-content-secondary hover:text-content-primary hover:border-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>Admin Security Alerts</span>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                  {alerts.length}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'SECURITY_ALERTS' && currentUser.role === 'ADMIN' ? (
        /* Admin Alerts Section */
        <div className="bg-surface-card border border-edge rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between bg-surface-subtle/30">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <h2 className="text-sm font-bold text-content-primary">
                Administrative Security & Incident Alerts
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-brand-primary border border-blue-200">
              {alerts.length} Total
            </span>
          </div>

          {isAlertsLoading ? (
            <div className="py-12 text-center text-content-muted text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
              <span>Checking system alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center text-content-muted text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-semibold text-content-primary">All systems operating normally</span>
              <span>No open incident or security alerts recorded.</span>
            </div>
          ) : (
            <div className="divide-y divide-edge">
              {alerts.map((alert) => (
                <div
                  key={alert._id || alert.id}
                  className="p-4 flex items-start gap-3 hover:bg-surface-subtle/40 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-content-primary truncate">
                        {alert.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-red-50 text-status-danger border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-content-secondary">{alert.message}</p>
                    <span className="text-[11px] text-content-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* In-App Notifications List (All Roles) */
        <div className="bg-surface-card border border-edge rounded-xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-content-muted text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-content-muted text-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center border border-blue-100">
                <Inbox className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-content-primary">
                  {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="text-xs text-content-muted leading-relaxed">
                  {activeTab === 'UNREAD'
                    ? 'You have caught up with all your notifications!'
                    : 'Real-time alerts for lead reassignments, meetings, site visits, and workflow milestones will appear here.'}
                </p>
                {activeTab === 'UNREAD' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ALL');
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline pt-2 focus:outline-none"
                  >
                    <span>View all notifications</span>
                    <span>&rarr;</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-edge">
              {notifications.map((item) => {
                const badge = getEventBadge(item.type);
                const isAssignment =
                  item.type === 'NEW_LEAD_ASSIGNED' ||
                  item.type === 'LEAD_ASSIGNED' ||
                  item.type === 'LEAD_REASSIGNED';
                const isDuplicate = item.type === 'DUPLICATE_ENQUIRY';
                const isExpanded = expandedIds.has(item.id);
                const meta = (item.metadata || {}) as any;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 sm:p-5 flex flex-col gap-3 cursor-pointer transition-colors ${
                      !item.isRead
                        ? isDuplicate ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'bg-blue-50/30 hover:bg-blue-50/60'
                        : 'hover:bg-surface-subtle/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Event Icon */}
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                          !item.isRead
                            ? isDuplicate ? 'bg-amber-100/80 border-amber-300 text-amber-700' : 'bg-blue-100/70 border-blue-200 text-brand-primary'
                            : 'bg-surface-subtle border-edge text-content-secondary'
                        }`}
                      >
                        {badge.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-sm truncate ${
                                !item.isRead ? 'font-bold text-content-primary' : 'font-medium text-content-secondary'
                              }`}
                            >
                              {item.title}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <span className="text-xs text-content-muted whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-content-secondary leading-relaxed">
                          {item.message}
                        </p>

                        {/* Meta context pills for non-assignment or summary */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          {item.relatedCustomerName && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-surface-subtle border border-edge text-content-secondary">
                              <span>Lead:</span>
                              <span className="font-semibold text-content-primary">
                                {item.relatedCustomerName}
                              </span>
                            </span>
                          )}

                          {item.relatedStage && (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Stage: {item.relatedStage}
                            </span>
                          )}

                          {item.senderName && item.senderName !== 'System' && (
                            <span className="text-[11px] text-content-muted">
                              By: {item.senderName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            title="Mark as read"
                            className="p-1.5 rounded-lg text-content-muted hover:text-brand-primary hover:bg-surface-subtle border border-transparent hover:border-edge transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        {item.link && (
                          <span className="p-1.5 rounded-lg text-content-muted group-hover:text-brand-primary transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compact Lead Summary Bar for Assignment Notifications */}
                    {isAssignment && (
                      <div className="mt-1 p-2.5 rounded-lg bg-surface-subtle/80 border border-edge text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-bold text-content-primary">
                              {meta.customerName || item.relatedCustomerName || 'Lead'}
                            </span>
                            {meta.mobile && (
                              <div className="inline-flex items-center gap-1.5 text-content-secondary">
                                <a
                                  href={`tel:${meta.mobile}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:underline flex items-center gap-1 text-brand-primary font-medium"
                                  title="Call"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>{meta.mobile}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyPhone(meta.mobile, item.id, e)}
                                  className="p-1 rounded hover:bg-surface-subtle text-content-muted hover:text-content-primary transition-colors"
                                  title="Copy phone number"
                                >
                                  {copiedId === item.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                            {meta.projectName && meta.projectName !== 'Not specified' && (
                              <span className="inline-flex items-center gap-1 text-content-secondary">
                                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                                <span>{meta.projectName}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {meta.budgetRange && meta.budgetRange !== 'Not specified' && (
                              <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {meta.budgetRange}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => toggleExpanded(item.id, e)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50/60 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide Details' : 'Show Lead Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expanded Full Lead Details View (All 5 Categories) */}
                    {isAssignment && isExpanded && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 p-4 rounded-xl bg-surface-subtle/50 border border-edge space-y-4 text-xs animate-in fade-in-50 duration-150"
                      >
                        {/* Category 1: Customer Information */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-content-primary font-bold text-xs uppercase tracking-wider text-slate-500">
                            <User className="w-3.5 h-3.5 text-brand-primary" />
                            <span>1. Customer Information</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-card border border-edge">
                            <div>
                              <span className="text-[10px] text-content-muted block">Full Name</span>
                              <span className="font-semibold text-content-primary">{meta.customerName || item.relatedCustomerName || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Primary Phone</span>
                              <span className="font-semibold text-content-primary">{meta.mobile || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Alternate Phone</span>
                              <span className="text-content-secondary">{meta.alternateMobile || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Email Address</span>
                              <span className="text-content-secondary truncate block">{meta.email || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Category 2: Property Information */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-content-primary font-bold text-xs uppercase tracking-wider text-slate-500">
                            <Building2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>2. Property Information</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-card border border-edge">
                            <div>
                              <span className="text-[10px] text-content-muted block">Project Name</span>
                              <span className="font-semibold text-content-primary">{meta.projectName || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Property Type</span>
                              <span className="text-content-secondary">{meta.propertyType || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Configuration</span>
                              <span className="text-content-secondary">{meta.configuration || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Preferred Location</span>
                              <span className="text-content-secondary">{meta.preferredLocation || 'Not specified'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Category 3: Budget & Requirement */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-content-primary font-bold text-xs uppercase tracking-wider text-slate-500">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            <span>3. Budget & Requirement Information</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-surface-card border border-edge">
                            <div>
                              <span className="text-[10px] text-content-muted block">Budget Range</span>
                              <span className="font-bold text-emerald-700">{meta.budgetRange || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Requirement Details</span>
                              <span className="text-content-secondary line-clamp-2">{meta.requirement || 'Not specified'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Remarks / Notes</span>
                              <span className="text-content-secondary line-clamp-2">{meta.remarks || 'None'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Category 4: Enquiry Information */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-content-primary font-bold text-xs uppercase tracking-wider text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>4. Enquiry Information</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-3 rounded-lg bg-surface-card border border-edge">
                            <div>
                              <span className="text-[10px] text-content-muted block">Source</span>
                              <span className="text-content-secondary">{meta.enquirySource || 'Direct / System'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Contact Method</span>
                              <span className="text-content-secondary">{meta.preferredContactMethod || 'CALL'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Contact Timing</span>
                              <span className="text-content-secondary">{meta.preferredContactTiming || 'Anytime'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Enquiry Date</span>
                              <span className="text-content-secondary">{meta.enquiryDate ? formatDateTime(meta.enquiryDate) : formatDateTime(item.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Current Stage</span>
                              <span className="font-semibold text-content-primary">{meta.currentStage || item.relatedStage || 'FOLLOW_UP'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Status</span>
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {meta.status || 'ACTIVE'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Category 5: Assignment Information */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-content-primary font-bold text-xs uppercase tracking-wider text-slate-500">
                            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                            <span>5. Assignment Information</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 rounded-lg bg-surface-card border border-edge">
                            <div>
                              <span className="text-[10px] text-content-muted block">Assigned By</span>
                              <span className="font-semibold text-content-primary">{meta.assignedBy || item.senderName || 'System'}</span>
                              {meta.assignedByRole && (
                                <span className="inline-block ml-1 text-[9px] font-bold px-1 rounded bg-slate-100 text-slate-600">
                                  {meta.assignedByRole}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Assigned To</span>
                              <span className="font-semibold text-content-primary">{meta.assignedToName || 'You'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Assignment Type</span>
                              <span className="text-content-secondary">{meta.assignmentType || (item.type === 'LEAD_REASSIGNED' ? 'REASSIGNMENT' : 'INITIAL_ASSIGNMENT')}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Assignment Time</span>
                              <span className="text-content-secondary">{meta.assignmentDate ? formatDateTime(meta.assignmentDate) : formatDateTime(item.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-content-muted block">Previous Assignee</span>
                              <span className="text-content-secondary">{meta.previousAssigneeName || 'None'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="pt-2 flex items-center justify-between border-t border-edge">
                          <span className="text-[11px] text-content-muted">
                            Complete lead record stored in CRM database.
                          </span>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                          >
                            View Full Lead Details
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Duplicate Enquiry Details Card */}
                    {isDuplicate && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3 text-xs animate-in fade-in-50 duration-150"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {meta.customerName || meta.existingLeadName || item.relatedCustomerName || 'Prospect'}
                            </span>
                            <span className="font-bold text-[10px] uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                              {meta.matchType || (meta.matchReason === 'BOTH' ? 'Mobile & Email Match' : meta.matchReason === 'EMAIL' ? 'Email Match' : 'Mobile Match')}
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-900/80 font-medium">
                            Detected: {meta.detectionDate ? formatDateTime(meta.detectionDate) : formatDateTime(item.createdAt)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-card border border-amber-200/60">
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Prospect Name</span>
                            <span className="font-semibold text-content-primary">{meta.customerName || meta.existingLeadName || item.relatedCustomerName || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Match Type</span>
                            <span className="font-semibold text-amber-800">{meta.matchType || 'Duplicate Match'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Existing Lead Reference</span>
                            <span className="font-semibold text-content-primary truncate block" title={meta.existingLeadId || item.relatedEnquiryId}>
                              {meta.existingLeadName || 'Lead'} (ID: {meta.existingLeadId ? `${meta.existingLeadId.slice(-6)}` : 'N/A'})
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Assigned Agent</span>
                            <span className="font-semibold text-content-primary">{meta.assignedAgentName || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Submitted By</span>
                            <span className="font-semibold text-content-primary">{meta.submittedBy || item.senderName || 'System'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Submission Source</span>
                            <span className="font-semibold text-content-primary">{meta.submissionSource || 'Manual Enquiry Form'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Contact Details</span>
                            <span className="font-medium text-content-secondary">{meta.mobile || meta.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-content-muted block uppercase font-semibold">Current Lead Stage</span>
                            <span className="font-semibold text-content-primary">{meta.currentStage || meta.status || 'ACTIVE'}</span>
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
                          <span className="text-[11px] text-amber-900/70">
                            A duplicate enquiry was prevented from creating a duplicate lead.
                          </span>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                          >
                            View Existing Lead
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-edge flex items-center justify-between bg-surface-subtle/30 text-xs text-content-muted">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || isLoading}
                  onClick={() => fetchNotifications(page - 1, activeTab === 'UNREAD')}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => fetchNotifications(page + 1, activeTab === 'UNREAD')}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
