export type NotificationType =
  | 'NEW_LEAD_ASSIGNED'
  | 'LEAD_ASSIGNED'
  | 'LEAD_REASSIGNED'
  | 'NEW_ACTIVITY'
  | 'NEW_FOLLOW_UP'
  | 'MEETING_SCHEDULED'
  | 'SITE_VISIT_SCHEDULED'
  | 'WORKFLOW_UPDATE'
  | 'SYSTEM_ALERT'
  | 'RETURNING_CUSTOMER_RE_ENQUIRY'
  | 'DUPLICATE_ENQUIRY';

export interface LeadNotificationMetadata {
  leadId: string;
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  projectName?: string;
  propertyType?: string;
  configuration?: string;
  preferredLocation?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetRange?: string;
  requirement?: string;
  description?: string;
  remarks?: string;
  enquirySource?: string;
  preferredContactMethod?: string;
  preferredContactTiming?: string;
  enquiryDate?: string;
  status?: string;
  currentStage?: string;
  assignedBy?: string;
  assignedByRole?: string;
  assignedToName?: string;
  assignedToId?: string;
  assignmentDate?: string;
  assignmentType?: 'INITIAL_ASSIGNMENT' | 'REASSIGNMENT' | 'ROUND_ROBIN';
  previousAssigneeName?: string;
  leadOwner?: string;
  [key: string]: any;
}

export interface NotificationItem {
  id: string;
  recipient: string;
  sender?: string | null;
  senderName: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEnquiryId?: string | null;
  relatedCustomerName?: string | null;
  relatedStage?: string | null;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  metadata?: LeadNotificationMetadata | Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: {
    notifications: NotificationItem[];
    unreadCount: number;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface MarkReadResponse {
  success: boolean;
  data: {
    notification: NotificationItem;
  };
}

export interface MarkAllReadResponse {
  success: boolean;
  data: {
    markedCount: number;
  };
}
