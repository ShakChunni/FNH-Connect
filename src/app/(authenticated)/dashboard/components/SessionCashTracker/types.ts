/**
 * Session Cash Tracker Types
 */

export type DatePreset =
  | "today"
  | "yesterday"
  | "lastWeek"
  | "thisMonth"
  | "lastCalendarMonth"
  | "last30Days"
  | "custom";

export interface CustomDateRange {
  from: Date;
  to: Date;
}

export interface Department {
  id: number;
  name: string;
}

export interface CashTrackerStaffOption {
  id: number;
  fullName: string;
  role: string;
}

export interface DepartmentCashBreakdown {
  departmentId: number;
  departmentName: string;
  totalCollected: number;
  transactionCount: number;
}

export interface ShiftSummary {
  shiftId: number;
  startTime: string;
  endTime?: string;
  isActive: boolean;
  totalCollected: number;
  totalRefunded: number;
  transactionCount: number;
  departmentBreakdown: DepartmentCashBreakdown[];
}

export interface SessionCashFilters {
  datePreset: DatePreset;
  departmentId?: number | "all";
  staffId?: number | null;
}

export interface SessionCashData {
  totalCollected: number;
  totalRefunded: number;
  netCash: number;
  transactionCount: number;
  departmentBreakdown: DepartmentCashBreakdown[];
  shifts?: ShiftSummary[];
  staffName: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  selectedStaffId?: number;
  canSelectStaff?: boolean;
}

export interface SessionCashReportData {
  staffName: string;
  generatedAt: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  departmentFilter: string;
  totalCollected: number;
  totalRefunded: number;
  netCash: number;
  transactionCount: number;
  departmentBreakdown: DepartmentCashBreakdown[];
  shifts?: ShiftSummary[];
}

// ===== DETAILED REPORT TYPES =====

/** Individual payment transaction for detailed report */
export interface PaymentDetail {
  paymentId: number;
  registrationId: string; // Patient registration ID (safer to display than receipt number)
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  serviceName: string;
  serviceType: string;
  departmentName: string;
}

/** Refund transaction for detailed report */
export interface RefundDetail {
  paymentId?: number; // Linked payment if available
  registrationId: string; // Patient registration ID
  refundDate: string;
  amount: number;
  patientId?: number;
  patientName: string;
  patientPhone?: string;
  serviceName: string;
  serviceType: string;
  departmentName: string;
  description?: string; // Reason / notes for refund
}

/** Shift with detailed payment info */
export interface ShiftDetailedSummary extends ShiftSummary {
  shiftDate: string; // Formatted date for display
  payments: PaymentDetail[];
  refunds: RefundDetail[];
}

/** Detailed report data with patient-level information */
export interface DetailedCashReportData extends SessionCashReportData {
  shifts: ShiftDetailedSummary[];
}
