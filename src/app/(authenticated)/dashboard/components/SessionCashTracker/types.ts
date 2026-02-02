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

/** Shift with detailed payment info */
export interface ShiftDetailedSummary extends ShiftSummary {
  shiftDate: string; // Formatted date for display
  payments: PaymentDetail[];
}

/** Detailed report data with patient-level information */
export interface DetailedCashReportData extends SessionCashReportData {
  shifts: ShiftDetailedSummary[];
}
