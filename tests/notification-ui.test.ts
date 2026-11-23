import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SRC = path.join(__dirname, '../src');

test('Notification Types: Definitions include NotificationItem, types, and responses', () => {
  const filePath = path.join(CLIENT_SRC, 'types/notification.types.ts');
  assert.ok(fs.existsSync(filePath), 'notification.types.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('NEW_LEAD_ASSIGNED'), 'Includes NEW_LEAD_ASSIGNED type');
  assert.ok(content.includes('LEAD_ASSIGNED'), 'Includes LEAD_ASSIGNED type');
  assert.ok(content.includes('MEETING_SCHEDULED'), 'Includes MEETING_SCHEDULED type');
  assert.ok(content.includes('SITE_VISIT_SCHEDULED'), 'Includes SITE_VISIT_SCHEDULED type');
  assert.ok(content.includes('NEW_FOLLOW_UP'), 'Includes NEW_FOLLOW_UP type');
  assert.ok(content.includes('WORKFLOW_UPDATE'), 'Includes WORKFLOW_UPDATE type');
  assert.ok(content.includes('DUPLICATE_ENQUIRY'), 'Includes DUPLICATE_ENQUIRY type');
  assert.ok(content.includes('export interface NotificationItem'), 'Defines NotificationItem interface');
});

test('Notification Service: Client service defines all required backend methods', () => {
  const filePath = path.join(CLIENT_SRC, 'services/notification.service.ts');
  assert.ok(fs.existsSync(filePath), 'notification.service.ts must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('getNotifications('), 'Defines getNotifications method');
  assert.ok(content.includes('getUnreadCount('), 'Defines getUnreadCount method');
  assert.ok(content.includes('markAsRead('), 'Defines markAsRead method');
  assert.ok(content.includes('markAllAsRead('), 'Defines markAllAsRead method');
  assert.ok(content.includes('/notifications'), 'Calls /notifications endpoint');
  assert.ok(content.includes('/unread-count'), 'Calls /unread-count endpoint');
  assert.ok(content.includes('/read-all'), 'Calls /read-all endpoint');
});

test('Notification Bell Dropdown: Component exists and implements preview, badges, and read-all', () => {
  const filePath = path.join(CLIENT_SRC, 'components/layout/NotificationBellDropdown.tsx');
  assert.ok(fs.existsSync(filePath), 'NotificationBellDropdown.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('export const NotificationBellDropdown'), 'Exports NotificationBellDropdown component');
  assert.ok(content.includes('unreadCount'), 'Tracks unreadCount state');
  assert.ok(content.includes('refreshUnreadCount'), 'Refreshes unread count via polling');
  assert.ok(content.includes('handleMarkAllAsRead'), 'Implements quick mark-all-as-read action');
  assert.ok(content.includes('handleNotificationClick'), 'Implements click to mark read and route');
  assert.ok(content.includes('/notifications'), 'Links to /notifications view');
});

test('AppHeader: Replaces placeholder modal with functional NotificationBellDropdown', () => {
  const filePath = path.join(CLIENT_SRC, 'components/layout/AppHeader.tsx');
  assert.ok(fs.existsSync(filePath), 'AppHeader.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('NotificationBellDropdown'), 'Imports and renders NotificationBellDropdown');
  assert.ok(
    !content.includes("onClick={() => onShowPlaceholderNotice('System Notifications')}"),
    'Removes placeholder notice trigger for system notifications'
  );
});

test('Notifications Page: Full database-backed notification feed with tabs and filters', () => {
  const filePath = path.join(CLIENT_SRC, 'features/notifications/NotificationsPage.tsx');
  assert.ok(fs.existsSync(filePath), 'NotificationsPage.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('export const NotificationsPage'), 'Exports NotificationsPage component');
  assert.ok(content.includes('fetchNotifications'), 'Fetches database-backed notifications');
  assert.ok(content.includes('notificationService.getNotifications'), 'Uses notificationService');
  assert.ok(content.includes('handleMarkAsRead'), 'Supports marking individual notification as read');
  assert.ok(content.includes('handleMarkAllAsRead'), 'Supports marking all notifications as read');
  assert.ok(content.includes('SECURITY_ALERTS'), 'Preserves Admin Security & Incident Alerts view');
  assert.ok(content.includes('UNREAD'), 'Provides Unread filter tab');
  assert.ok(content.includes('ALL'), 'Provides All Notifications filter tab');
  assert.ok(content.includes('DUPLICATE_ENQUIRY'), 'Supports DUPLICATE_ENQUIRY notification badge');
  assert.ok(content.includes('View Existing Lead'), 'Provides View Existing Lead direct action');
});

test('Notification UI: Bell Dropdown supports DUPLICATE_ENQUIRY with match type badges and action', () => {
  const bellPath = path.join(CLIENT_SRC, 'components/layout/NotificationBellDropdown.tsx');
  const bellContent = fs.readFileSync(bellPath, 'utf-8');
  assert.ok(bellContent.includes('DUPLICATE_ENQUIRY'), 'Dropdown supports DUPLICATE_ENQUIRY');
  assert.ok(bellContent.includes('View Existing Lead'), 'Dropdown contains View Existing Lead button');
  assert.ok(bellContent.includes('Match'), 'Dropdown formats match type');
});

test('AppRoutes: Mounts /notifications route for all authenticated roles', () => {
  const filePath = path.join(CLIENT_SRC, 'routes/AppRoutes.tsx');
  assert.ok(fs.existsSync(filePath), 'AppRoutes.tsx must exist');

  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.includes('notifications'), 'Configures /notifications route');
  assert.ok(content.includes('NotificationsPage'), 'Connects to NotificationsPage component');
});

test('NotificationClientService: Correctly unwraps ApiResponse without dropping notification arrays', async () => {
  const { notificationService } = await import('../src/services/notification.service.js');
  const { api } = await import('../src/services/api.js');

  const originalGet = api.get;
  const originalPatch = api.patch;

  try {
    // 1. Mock api.get returning standard ApiResponse from backend
    (api as any).get = async (endpoint: string) => {
      if (endpoint.includes('/notifications/unread-count')) {
        return {
          success: true,
          statusCode: 200,
          data: { unreadCount: 7 }
        };
      }
      return {
        success: true,
        statusCode: 200,
        data: {
          notifications: [
            {
              id: 'mock-1',
              recipient: '6ae09712242bc26b64d15cde',
              type: 'NEW_LEAD_ASSIGNED',
              title: 'New Lead Assigned: Mock Customer',
              message: 'Assigned to you',
              isRead: false,
              metadata: { customerName: 'Mock Customer', mobile: '9876543210' }
            }
          ],
          unreadCount: 7,
          pagination: {
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasMore: false
          }
        }
      };
    };

    // 2. Mock api.patch returning mark results
    (api as any).patch = async (endpoint: string) => {
      if (endpoint.includes('/read-all')) {
        return {
          success: true,
          statusCode: 200,
          data: { markedCount: 7 }
        };
      }
      return {
        success: true,
        statusCode: 200,
        data: { notification: { id: 'mock-1', isRead: true } }
      };
    };

    // Test getNotifications
    const result = await notificationService.getNotifications({ page: 1, limit: 20 });
    assert.strictEqual(result.notifications.length, 1, 'Must return 1 notification');
    assert.strictEqual(result.notifications[0].title, 'New Lead Assigned: Mock Customer');
    assert.strictEqual(result.unreadCount, 7, 'Must return unread count 7');
    assert.strictEqual(result.pagination.total, 1, 'Pagination total must be 1');

    // Test getUnreadCount
    const count = await notificationService.getUnreadCount();
    assert.strictEqual(count, 7, 'Must return unread count 7');

    // Test markAsRead
    const markedSingle = await notificationService.markAsRead('mock-1');
    assert.strictEqual(markedSingle, true, 'markAsRead must return true');

    // Test markAllAsRead
    const markedAll = await notificationService.markAllAsRead();
    assert.strictEqual(markedAll, 7, 'markAllAsRead must return 7');
  } finally {
    (api as any).get = originalGet;
    (api as any).patch = originalPatch;
  }
});

test('AppSidebar: Renders Notifications navigation link for Admin role', () => {
  const sidebarPath = path.join(CLIENT_SRC, 'components/layout/AppSidebar.tsx');
  const content = fs.readFileSync(sidebarPath, 'utf-8');

  // Verify Notifications is included in adminNavItems
  const adminNavMatch = content.match(/const adminNavItems = \[([\s\S]*?)\];/);
  assert.ok(adminNavMatch, 'adminNavItems array must exist');
  assert.ok(adminNavMatch[1].includes('Notifications'), 'adminNavItems includes Notifications');
  assert.ok(adminNavMatch[1].includes('/notifications'), 'adminNavItems links to /notifications');
});

test('Notification Sync: NotificationBellDropdown and NotificationsPage dispatch crm:notification-refresh', () => {
  const bellPath = path.join(CLIENT_SRC, 'components/layout/NotificationBellDropdown.tsx');
  const bellContent = fs.readFileSync(bellPath, 'utf-8');
  assert.ok(
    bellContent.includes("crm:notification-refresh"),
    'NotificationBellDropdown dispatches and listens to crm:notification-refresh'
  );

  const pagePath = path.join(CLIENT_SRC, 'features/notifications/NotificationsPage.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');
  assert.ok(
    pageContent.includes("crm:notification-refresh"),
    'NotificationsPage dispatches and listens to crm:notification-refresh'
  );
  assert.ok(
    pageContent.includes("View all notifications"),
    'NotificationsPage has convenient quick-link to view all notifications from unread tab'
  );
});
