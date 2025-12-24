/**
 * Session Cash Tracker Types
 */

export type DatePreset = "today" | "yesterday" | "lastWeek" | "lastMonth";

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
