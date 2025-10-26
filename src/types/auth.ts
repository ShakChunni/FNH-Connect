/**
 * FNH Connect Authentication Types
 * Based on Staff model with role-based access control
 */

export type UserRole = "SysAdmin" | "Admin" | "Employee";

/**
 * Authentication User - matches Staff model in database
 * All users in FNH Connect are Staff members
 */
export interface AuthUser {
  id: number;
  staffId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  department?: string;
  specialization?: string;
  isActive: boolean;
}

/**
 * Session validation response from server
 */
export interface SessionValidationResponse {
  success: boolean;
  valid: boolean;
  user?: AuthUser;
  message?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Login response payload
 */
export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Permission levels based on roles
 */
export const ROLE_PERMISSIONS = {
  SysAdmin: ["read", "write", "delete", "admin"],
  Admin: ["read", "write", "delete"],
  Employee: ["read"],
} as const;

/**
 * Type guard to check if user has admin access
 */
export const hasAdminAccess = (role: UserRole): boolean => {
  return role === "SysAdmin" || role === "Admin";
};

/**
 * Type guard to check if user has system admin access
 */
export const hasSysAdminAccess = (role: UserRole): boolean => {
  return role === "SysAdmin";
};

/**
 * Get user display name
 */
export const getUserDisplayName = (user: AuthUser): string => {
  return user.fullName || `${user.firstName} ${user.lastName}`;
};
