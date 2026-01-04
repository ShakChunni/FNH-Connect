// Dashboard Types
import { z } from "zod";

// ============================================
// API Response Types
// ============================================

export interface DashboardStats {
  totalActivePatients: number;
  patientsAdmittedToday: number;
  dischargedToday: number;
  dischargedAllTime: number;
  occupancyRate: number;
  pathologyDoneToday: number;
  pathologyDoneAllTime: number;
}

export interface RecentPatient {
  id: number;
  patientId: number;
  name: string;
  phoneNumber: string | null;
  admissionDate: string;
  department: string;
  departmentType?: "general" | "infertility" | "pathology";
  status: "admitted" | "pending" | "discharged";
  roomNumber?: string;
}

export interface CashFlowSession {
  shiftId: number;
  staffId: number;
  staffName: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  currentCash: number;
  systemCash: number;
  totalCollected: number;
  totalRefunded: number;
  paymentsCount: number;
  variance: number;
  isActive: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  recentPatients: RecentPatient[];
  cashSession: CashFlowSession | null;
}

// ============================================
// API Request/Response Schemas
// ============================================

export const DashboardDataResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    stats: z.object({
      totalActivePatients: z.number(),
      patientsAdmittedToday: z.number(),
      dischargedToday: z.number(),
      dischargedAllTime: z.number(),
      occupancyRate: z.number(),
      pathologyDoneToday: z.number(),
      pathologyDoneAllTime: z.number(),
    }),
    recentPatients: z.array(
      z.object({
        id: z.number(),
        patientId: z.number(),
        name: z.string(),
        phoneNumber: z.string().nullable(),
        admissionDate: z.string(),
        department: z.string(),
        departmentType: z
          .enum(["general", "infertility", "pathology"])
          .optional(),
        status: z.enum(["admitted", "pending", "discharged"]),
        roomNumber: z.string().optional(),
      })
    ),
    cashSession: z
      .object({
        shiftId: z.number(),
        staffId: z.number(),
        staffName: z.string(),
        startTime: z.string(),
        endTime: z.string().optional(),
        openingCash: z.number(),
        currentCash: z.number(),
        systemCash: z.number(),
        totalCollected: z.number(),
        totalRefunded: z.number(),
        paymentsCount: z.number(),
        variance: z.number(),
        isActive: z.boolean(),
      })
      .nullable(),
  }),
  error: z.string().optional(),
});

// ============================================
// Filters Types
// ============================================

export interface DashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: number;
}

// ============================================
// Quick Action Types (for RBAC)
// ============================================

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  adminOnly?: boolean;
}
