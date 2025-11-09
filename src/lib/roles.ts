/**
 * Role-based Access Control System
 *
 * System Roles (User.role):
 * - system-admin: Full system access, can manage everything
 * - admin: Administrative access, can manage users and system settings
 * - staff: Regular staff access, limited to their department/patient data
 *
 * Hospital Roles (Staff.role):
 * - System Admin, Admin, Doctor, Nurse, PIC, etc.
 */

export enum SystemRole {
  SYSTEM_ADMIN = "system-admin",
  ADMIN = "admin",
  STAFF = "staff",
}

export enum HospitalRole {
  SYSTEM_ADMIN = "System Admin",
  ADMIN = "Admin",
  DOCTOR = "Doctor",
  NURSE = "Nurse",
  PIC = "PIC",
  RECEPTIONIST = "Receptionist",
}

/**
 * Check if user has admin privileges (system-admin or admin)
 */
export function isAdminRole(role: string): boolean {
  return role === SystemRole.SYSTEM_ADMIN || role === SystemRole.ADMIN;
}

/**
 * Check if user has system admin privileges
 */
export function isSystemAdminRole(role: string): boolean {
  return role === SystemRole.SYSTEM_ADMIN;
}

/**
 * Check if user has staff privileges
 */
export function isStaffRole(role: string): boolean {
  return role === SystemRole.STAFF;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case SystemRole.SYSTEM_ADMIN:
      return "System Administrator";
    case SystemRole.ADMIN:
      return "Administrator";
    case SystemRole.STAFF:
      return "Staff";
    default:
      return role;
  }
}

/**
 * Check if user can access admin routes
 */
export function canAccessAdminRoutes(userRole: string): boolean {
  return isAdminRole(userRole);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(userRole: string): boolean {
  return isAdminRole(userRole);
}

/**
 * Check if user can access system settings
 */
export function canAccessSystemSettings(userRole: string): boolean {
  return isAdminRole(userRole);
}

/**
 * Check if user can view activity logs
 */
export function canViewActivityLogs(userRole: string): boolean {
  return isAdminRole(userRole);
}
