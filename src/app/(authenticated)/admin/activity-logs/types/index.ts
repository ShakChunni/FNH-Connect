import type { StatusTone } from "@/lib/statusStyles";

/**
 * Activity Log Types
 * TypeScript interfaces for the activity logs module
 */

// User info embedded in activity log
export interface ActivityLogUser {
  id: number;
  username: string;
  role: string;
  staff: {
    id: number;
    fullName: string;
    role: string;
    photoUrl: string | null;
    email?: string;
    phoneNumber?: string;
  } | null;
}

// Single activity log entry for list display
export interface ActivityLogEntry {
  id: number;
  userId: number;
  action: string;
  description: string | null;
  entityType: string | null;
  entityId: number | null;
  timestamp: string;
  ipAddress: string | null;
  deviceType: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osType: string | null;
  deviceFingerprint: string | null;
  readableFingerprint: string | null;
  sessionId: string | null;
  user: ActivityLogUser;
}

// Session info for detailed view
export interface SessionInfo {
  id: string;
  createdAt: string;
  expiresAt: string;
  deviceType: string | null;
  browserName: string | null;
  browserVersion: string | null;
  osType: string | null;
  ipAddress: string | null;
  readableFingerprint: string | null;
}

// Related cash movement for audit trail
export interface RelatedCashMovement {
  id: number;
  amount: number;
  movementType: string;
  description: string | null;
  timestamp: string;
  shiftId: number;
}

// Full activity log detail
export interface ActivityLogDetail extends Omit<ActivityLogEntry, "user"> {
  user: ActivityLogUser & {
    staff:
      | (ActivityLogUser["staff"] & {
          email?: string;
          phoneNumber?: string;
        })
      | null;
  };
  session: SessionInfo | null;
  relatedCashMovements: RelatedCashMovement[];
}

// Pagination metadata
export interface ActivityLogPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Summary statistics for header cards
export interface ActivityLogSummary {
  totalActions: number;
  uniqueUsers: number;
  loginCount: number;
  lastActivity: string | null;
}

// Filter options from API
export interface ActivityLogFilterOptions {
  actionTypes: string[];
  users: Array<{
    id: number;
    username: string;
    fullName: string;
  }>;
}

// Full API response
export interface ActivityLogsResponse {
  success: boolean;
  data: {
    logs: ActivityLogEntry[];
    pagination: ActivityLogPagination;
    summary: ActivityLogSummary;
    filterOptions: ActivityLogFilterOptions;
  };
  error?: string;
}

// Detail API response
export interface ActivityLogDetailResponse {
  success: boolean;
  data: ActivityLogDetail;
  error?: string;
}

// Filter state for store
export interface ActivityLogFilters {
  search: string;
  action: string;
  userId: number | null;
  entityType: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

// Action type -> shared status tone, by meaning:
// create/login success -> success, update -> info, delete/failure -> danger,
// security/warning -> warning, everything else -> neutral.
export const ACTION_TONES: Record<string, StatusTone> = {
  // Authentication & Session
  LOGIN: "success",
  LOGOUT: "neutral",
  FIRST_TIME_SETUP: "success",
  PASSWORD_CHANGE: "warning",
  PASSWORD_RESET: "warning",
  SESSION_EXPIRED: "neutral",

  // CRUD Operations
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  VIEW: "neutral",
  RESTORE: "success",

  // Shift Management
  SHIFT_START: "info",
  SHIFT_END: "neutral",
  SHIFT_HANDOVER: "info",

  // Financial
  PAYMENT: "success",
  REFUND: "danger",
  DISCOUNT: "warning",
  COLLECTION: "success",

  // Patient Flow
  ADMISSION: "info",
  DISCHARGE: "success",
  TRANSFER: "info",
  CANCEL: "danger",
  CANCELLED: "danger",
  COMPLETE: "success",
  COMPLETED: "success",

  // Reports & Documents
  EXPORT: "neutral",
  PRINT: "neutral",
  DOWNLOAD: "neutral",
  GENERATE_REPORT: "neutral",

  // Security Events
  LOGIN_FAILED: "danger",
  BLOCKED: "warning",
  UNBLOCKED: "warning",
  SUSPICIOUS: "warning",

  // Staff Management
  STAFF_CREATE: "success",
  STAFF_UPDATE: "info",
  ROLE_CHANGE: "warning",
  ACTIVATE: "success",
  DEACTIVATE: "neutral",

  // Email
  EMAIL_SENT: "neutral",
  EMAIL_FAILED: "danger",
};

// Get tone for action type (with fallback)
export function getActionTone(action: string): StatusTone {
  // Check for exact match first
  if (ACTION_TONES[action]) {
    return ACTION_TONES[action];
  }

  // Check for partial match (e.g., "LOGIN_SUCCESS" contains "LOGIN")
  const upper = action.toUpperCase();
  for (const [key, tone] of Object.entries(ACTION_TONES)) {
    if (upper.includes(key)) {
      return tone;
    }
  }

  // Default fallback
  return "neutral";
}

// Display label for a raw action code: "FIRST_TIME_SETUP" -> "First Time Setup".
// Display only; the raw code is still what gets stored, filtered and shown in `title`.
export function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
