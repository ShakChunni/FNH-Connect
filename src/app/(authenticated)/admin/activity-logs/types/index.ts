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

// Action type color mapping
export const ACTION_COLORS: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  // Authentication & Session
  LOGIN: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "🔐" },
  LOGOUT: { bg: "bg-slate-50", text: "text-slate-600", icon: "🚪" },
  FIRST_TIME_SETUP: { bg: "bg-purple-50", text: "text-purple-600", icon: "🎉" },
  PASSWORD_CHANGE: { bg: "bg-orange-50", text: "text-orange-600", icon: "🔑" },
  PASSWORD_RESET: { bg: "bg-orange-50", text: "text-orange-600", icon: "🔄" },
  SESSION_EXPIRED: { bg: "bg-gray-50", text: "text-gray-600", icon: "⏱️" },

  // CRUD Operations
  CREATE: { bg: "bg-blue-50", text: "text-blue-600", icon: "➕" },
  UPDATE: { bg: "bg-amber-50", text: "text-amber-600", icon: "✏️" },
  DELETE: { bg: "bg-rose-50", text: "text-rose-600", icon: "🗑️" },
  VIEW: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "👁️" },
  RESTORE: { bg: "bg-lime-50", text: "text-lime-600", icon: "🔄" },

  // Shift Management
  SHIFT_START: { bg: "bg-teal-50", text: "text-teal-600", icon: "▶️" },
  SHIFT_END: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "⏹️" },
  SHIFT_HANDOVER: { bg: "bg-sky-50", text: "text-sky-600", icon: "🤝" },

  // Financial
  PAYMENT: { bg: "bg-green-50", text: "text-green-600", icon: "💵" },
  REFUND: { bg: "bg-red-50", text: "text-red-600", icon: "💸" },
  DISCOUNT: { bg: "bg-yellow-50", text: "text-yellow-600", icon: "🏷️" },
  COLLECTION: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "💰" },

  // Patient Flow
  ADMISSION: { bg: "bg-blue-50", text: "text-blue-600", icon: "🏥" },
  DISCHARGE: { bg: "bg-teal-50", text: "text-teal-600", icon: "🏠" },
  TRANSFER: { bg: "bg-violet-50", text: "text-violet-600", icon: "🔄" },
  CANCEL: { bg: "bg-pink-50", text: "text-pink-600", icon: "❌" },
  CANCELLED: { bg: "bg-pink-50", text: "text-pink-600", icon: "❌" },
  COMPLETE: { bg: "bg-green-50", text: "text-green-600", icon: "✅" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-600", icon: "✅" },

  // Reports & Documents
  EXPORT: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", icon: "📤" },
  PRINT: { bg: "bg-zinc-50", text: "text-zinc-600", icon: "🖨️" },
  DOWNLOAD: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", icon: "📥" },
  GENERATE_REPORT: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "📊" },

  // Security Events
  LOGIN_FAILED: { bg: "bg-red-50", text: "text-red-600", icon: "🚫" },
  BLOCKED: { bg: "bg-red-50", text: "text-red-600", icon: "🔒" },
  UNBLOCKED: { bg: "bg-green-50", text: "text-green-600", icon: "🔓" },
  SUSPICIOUS: { bg: "bg-orange-50", text: "text-orange-600", icon: "⚠️" },

  // Staff Management
  STAFF_CREATE: { bg: "bg-blue-50", text: "text-blue-600", icon: "👤" },
  STAFF_UPDATE: { bg: "bg-amber-50", text: "text-amber-600", icon: "👤" },
  ROLE_CHANGE: { bg: "bg-purple-50", text: "text-purple-600", icon: "🎭" },
  ACTIVATE: { bg: "bg-green-50", text: "text-green-600", icon: "✓" },
  DEACTIVATE: { bg: "bg-gray-50", text: "text-gray-600", icon: "⏸️" },

  // Email
  EMAIL_SENT: { bg: "bg-sky-50", text: "text-sky-600", icon: "📧" },
  EMAIL_FAILED: { bg: "bg-red-50", text: "text-red-600", icon: "📧" },
};

// Get color for action type (with fallback)
export function getActionColor(action: string): {
  bg: string;
  text: string;
  icon: string;
} {
  // Check for exact match first
  if (ACTION_COLORS[action]) {
    return ACTION_COLORS[action];
  }

  // Check for partial match (e.g., "LOGIN_SUCCESS" contains "LOGIN")
  for (const [key, value] of Object.entries(ACTION_COLORS)) {
    if (action.toUpperCase().includes(key)) {
      return value;
    }
  }

  // Default fallback
  return { bg: "bg-gray-50", text: "text-gray-600", icon: "📋" };
}
