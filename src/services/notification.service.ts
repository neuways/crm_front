import { api } from './api.js';
import {
  NotificationItem,
  GetNotificationsResponse,
  UnreadCountResponse,
  MarkReadResponse,
  MarkAllReadResponse
} from '../types/notification.types.js';

export class NotificationClientService {
  /**
   * Retrieves paginated notifications for the authenticated employee.
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<{
    notifications: NotificationItem[];
    unreadCount: number;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const unreadParam = params?.unreadOnly ? '&unreadOnly=true' : '';
    const endpoint = `/notifications?page=${page}&limit=${limit}${unreadParam}`;

    const res = await api.get<GetNotificationsResponse['data']>(endpoint);

    // Support both api.ts ApiResponse structure (where res.data contains the backend payload)
    // and raw responses where data.data contains the payload
    const payload = (res.data as any)?.notifications
      ? res.data
      : (res.data as any)?.data?.notifications
      ? (res.data as any).data
      : (res as any)?.notifications
      ? res
      : null;

    if (payload && (res.success || (res as any)?.data?.success !== false)) {
      return {
        notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
        unreadCount: typeof payload.unreadCount === 'number' ? payload.unreadCount : 0,
        pagination: payload.pagination || {
          total: payload.notifications?.length || 0,
          page,
          limit,
          totalPages: 1,
          hasMore: false
        }
      };
    }

    return {
      notifications: [],
      unreadCount: 0,
      pagination: { total: 0, page, limit, totalPages: 1, hasMore: false }
    };
  }

  /**
   * Retrieves quick unread count for badge indicators without loading the full list.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await api.get<UnreadCountResponse['data']>('/notifications/unread-count');
      if (res.data && typeof res.data.unreadCount === 'number') {
        return res.data.unreadCount;
      }
      if (typeof (res.data as any)?.data?.unreadCount === 'number') {
        return (res.data as any).data.unreadCount;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Marks an individual notification as read.
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const res = await api.patch<MarkReadResponse['data']>(`/notifications/${notificationId}/read`, {});
      return Boolean(res.success || (res.data as any)?.success);
    } catch {
      return false;
    }
  }

  /**
   * Marks all notifications for the authenticated user as read.
   */
  async markAllAsRead(): Promise<number> {
    try {
      const res = await api.patch<MarkAllReadResponse['data']>('/notifications/read-all', {});
      if (res.data && typeof res.data.markedCount === 'number') {
        return res.data.markedCount;
      }
      if (typeof (res.data as any)?.data?.markedCount === 'number') {
        return (res.data as any).data.markedCount;
      }
      return res.success ? 1 : 0;
    } catch {
      return 0;
    }
  }
}

export const notificationService = new NotificationClientService();
