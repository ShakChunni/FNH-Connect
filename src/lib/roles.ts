/**
 * Role-based Access Control System
 *
 * System Roles (User.role) - These are stored in the database:
 * - system-admin: Full system access, can manage everything
 * - admin: Administrative access, can manage users and system settings
 * - receptionist: Limited access - dashboard, general-admission, pathology only
 * - medicine-pharmacist: Limited access - dashboard and medicine-inventory only
 * - staff: Regular staff access, limited to their department/patient data
 *
 * Note: We also handle legacy formats like "SysAdmin", "System Admin", etc.
 *
 * Hospital Roles (Staff.role):
 * - System Admin, Admin, Doctor, Nurse, PIC, Receptionist, Pharmacist, etc.
 */

// System roles - canonical values (lowercase with hyphens)
export enum SystemRole {
  SYSTEM_ADMIN = "system-admin",
  ADMIN = "admin",
  RECEPTIONIST = "receptionist",
  RECEPTIONIST_INFERTILITY = "receptionist-infertility",
  MEDICINE_PHARMACIST = "medicine-pharmacist",
  STAFF = "staff",
}

// Hospital/Staff roles (display names)
export enum HospitalRole {
  SYSTEM_ADMIN = "System Admin",
  ADMIN = "Admin",
  DOCTOR = "Doctor",
  NURSE = "Nurse",
  PIC = "PIC",
  RECEPTIONIST = "Receptionist",
  PHARMACIST = "Pharmacist",
}

// Routes that receptionists can access
// Note: patient-records is admin-only
export const RECEPTIONIST_ALLOWED_ROUTES = [
  "/dashboard",
  "/general-admission",
  "/pathology",
  "/api/dashboard",
  "/api/general-admission",
  "/api/pathology",
  "/api/auth", // Auth routes are always allowed
  "/api/staff", // Staff/doctors list for dropdowns
  "/api/hospitals", // Hospitals list for dropdowns
  "/api/patients", // Patient data
];

// Routes that receptionist-infertility can access (receptionist + infertility)
export const RECEPTIONIST_INFERTILITY_ALLOWED_ROUTES = [
  ...RECEPTIONIST_ALLOWED_ROUTES,
  "/infertility",
  "/api/infertility",
];

// Routes that medicine-pharmacist can access
export const PHARMACIST_ALLOWED_ROUTES = [
  "/medicine-inventory",
  "/api/medicine-inventory",
  "/api/auth", // Auth routes are always allowed
  "/api/patients", // Patient lookup for sales
];

/**
 * Normalize role string to check against canonical values
 * Handles various formats: "system-admin", "SysAdmin", "System Admin", "systemadmin", etc.
 */
function normalizeRole(role: string): string {
  const lower = role.toLowerCase().replace(/[\s_-]/g, "");

  // Map to canonical values
  if (lower === "systemadmin" || lower === "sysadmin") {
    return SystemRole.SYSTEM_ADMIN;
  }
  if (lower === "admin" || lower === "administrator") {
    return SystemRole.ADMIN;
  }
  if (lower === "receptionistinfertility") {
    return SystemRole.RECEPTIONIST_INFERTILITY;
  }
  if (lower === "receptionist") {
    return SystemRole.RECEPTIONIST;
  }
  if (lower === "medicinepharmacist" || lower === "pharmacist") {
    return SystemRole.MEDICINE_PHARMACIST;
  }
  if (lower === "staff" || lower === "employee") {
    return SystemRole.STAFF;
  }

  return role; // Return as-is if no match
}

/**
 * Check if user has admin privileges (system-admin or admin)
 */
export function isAdminRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return (
    normalized === SystemRole.SYSTEM_ADMIN || normalized === SystemRole.ADMIN
  );
}

/**
 * Check if user has system admin privileges
 */
export function isSystemAdminRole(role: string): boolean {
  return normalizeRole(role) === SystemRole.SYSTEM_ADMIN;
}

/**
 * Check if user has receptionist role (any receptionist type)
 */
export function isReceptionistRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return (
    normalized === SystemRole.RECEPTIONIST ||
    normalized === SystemRole.RECEPTIONIST_INFERTILITY
  );
}

/**
 * Check if user has receptionist-infertility role
 */
export function isReceptionistInfertilityRole(role: string): boolean {
  return normalizeRole(role) === SystemRole.RECEPTIONIST_INFERTILITY;
}

/**
 * Check if user has staff privileges
 */
export function isStaffRole(role: string): boolean {
  return normalizeRole(role) === SystemRole.STAFF;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case SystemRole.SYSTEM_ADMIN:
      return "System Administrator";
    case SystemRole.ADMIN:
      return "Administrator";
    case SystemRole.RECEPTIONIST:
      return "Receptionist";
    case SystemRole.RECEPTIONIST_INFERTILITY:
      return "Receptionist (Infertility)";
    case SystemRole.MEDICINE_PHARMACIST:
      return "Pharmacist";
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

/**
 * Check if a receptionist can access a given path
 */
export function canReceptionistAccessPath(
  pathname: string,
  role: string,
): boolean {
  const allowedRoutes = isReceptionistInfertilityRole(role)
    ? RECEPTIONIST_INFERTILITY_ALLOWED_ROUTES
    : RECEPTIONIST_ALLOWED_ROUTES;

  return allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

/**
 * Check if user has pharmacist role
 */
export function isPharmacistRole(role: string): boolean {
  return normalizeRole(role) === SystemRole.MEDICINE_PHARMACIST;
}

/**
 * Check if a pharmacist can access a given path
 */
export function canPharmacistAccessPath(pathname: string): boolean {
  return PHARMACIST_ALLOWED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}
