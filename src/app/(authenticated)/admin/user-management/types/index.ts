import { z } from "zod";

// ============================================
// User + Staff Types
// ============================================

export interface UserWithStaff {
  id: number;
  username: string;
  role: string; // System role: system-admin, admin, receptionist, etc.
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string; // Hospital/staff role: Doctor, Nurse, Receptionist, etc.
    specialization: string | null;
    phoneNumber: string | null;
    email: string | null;
    isActive: boolean;
  };
}

export interface StaffRecord {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  specialization: string | null;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  hasUser: boolean; // Whether this staff has a linked User account
}

// ============================================
// Stats Types
// ============================================

export interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  archivedUsers: number;
  byRole: Record<string, number>;
}

// ============================================
// Zod Schemas — Create User
// ============================================

export const createUserSchema = z
  .object({
    // If linking existing staff
    staffId: z.number().int().positive().optional(),

    // If creating new staff (required when staffId is not provided)
    firstName: z.string().min(1, "First name is required").max(100).optional(),
    lastName: z.string().max(100).optional(),

    // User credentials (always required)
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),

    // Roles
    role: z.enum([
      "system-admin",
      "admin",
      "receptionist",
      "receptionist-infertility",
      "medicine-pharmacist",
      "staff",
    ]),
    staffRole: z.string().min(1, "Staff role is required").max(100).optional(),

    // Optional staff details
    specialization: z.string().max(200).optional(),
    phoneNumber: z.string().max(50).optional(),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // Either staffId must be provided, or firstName is required for new staff
      return (
        data.staffId || (data.firstName && data.firstName.trim().length > 0)
      );
    },
    {
      message:
        "Either select an existing staff member or provide a first name for new staff",
      path: ["firstName"],
    },
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;

// ============================================
// Zod Schemas — Create Staff (standalone)
// ============================================

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional(),
  role: z.string().min(1, "Role is required").max(100),
  specialization: z.string().max(200).optional(),
  phoneNumber: z.string().max(50).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// ============================================
// Zod Schemas — Update User
// ============================================

export const updateUserSchema = z.object({
  role: z
    .enum([
      "system-admin",
      "admin",
      "receptionist",
      "receptionist-infertility",
      "medicine-pharmacist",
      "staff",
    ])
    .optional(),
  staffRole: z.string().min(1).max(100).optional(),
  specialization: z.string().max(200).optional(),
  phoneNumber: z.string().max(50).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================
// Zod Schemas — Reset Password
// ============================================

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================
// Filter Types
// ============================================

export interface UserFilters {
  search?: string;
  role?: string | null;
  status?: "all" | "active" | "archived";
  page?: number;
  limit?: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Modal Types
// ============================================

export type ModalType =
  | "addUser"
  | "editUser"
  | "archiveUser"
  | "resetPassword"
  | "addStaff"
  | null;

// ============================================
// Constants
// ============================================

export const SYSTEM_ROLES = [
  { value: "system-admin", label: "System Administrator" },
  { value: "admin", label: "Administrator" },
  { value: "receptionist", label: "Receptionist" },
  { value: "receptionist-infertility", label: "Receptionist (Infertility)" },
  { value: "medicine-pharmacist", label: "Pharmacist" },
  { value: "staff", label: "Staff" },
] as const;

export const STAFF_ROLES = [
  "System Admin",
  "Admin",
  "Doctor",
  "Nurse",
  "PIC",
  "Receptionist",
  "Pharmacist",
] as const;
